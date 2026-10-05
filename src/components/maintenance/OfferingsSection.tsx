import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { SearchPicker } from "@/components/ui/search-picker";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import {
  repositoryService,
  type AcademicLevel,
  type Course,
  type CurriculumPlan,
  type Offering,
  type Semester,
  type Teacher,
} from "@/services/repositoryService";

const PAGE_SIZE = 25;
const COURSE_RESULTS = 20;

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
    .replace(".", "");
}

/** Chooses an existing course by typing part of its name or code. */
function CoursePicker({
  value,
  onChange,
}: {
  value: Course | null;
  onChange: (course: Course | null) => void;
}) {
  const [results, setResults] = useState<Course[]>([]);
  const search = useCallback(async (query: string) => {
    const data = await repositoryService.getCourses({
      search: query || undefined,
      page: 1,
      limit: COURSE_RESULTS,
    });
    setResults(data.courses);
    return {
      total: data.total,
      items: data.courses.map((course) => ({
        key: course.courseId,
        title: course.courseName,
        detail: courseDetail(course),
      })),
    };
  }, []);

  return (
    <SearchPicker
      className="repo-form-field--wide"
      label="Curso"
      placeholder="Buscar curso por nombre o código"
      selected={
        value ? { key: value.courseId, title: value.courseName, detail: courseDetail(value) } : null
      }
      onClear={() => onChange(null)}
      onPick={(key) => onChange(results.find((course) => course.courseId === key) ?? null)}
      search={search}
      emptyText={(query) =>
        query
          ? `Ningún curso coincide con «${query}». Si es nuevo, créalo primero en Cursos.`
          : "Todavía no hay cursos. Créalos primero en Cursos."
      }
    />
  );
}

function courseDetail(course: Course) {
  return `${course.courseCode} · ${course.programName} · Plan ${course.planCode}`;
}

/**
 * Ofertas: a course taught in one semester, with its dates, teacher, blocks and weeks.
 * `initialCourse` filters the list by that course, or preselects it when `startCreating`.
 */
export function OfferingsSection({
  initialCourse,
  startCreating = false,
}: {
  initialCourse?: Course;
  startCreating?: boolean;
}) {
  const [creating, setCreating] = useState(startCreating);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courseFilter, setCourseFilter] = useState<Course | undefined>(
    startCreating ? undefined : initialCourse,
  );
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    course: (startCreating ? initialCourse : undefined) ?? (null as Course | null),
    semesterId: "",
    startDate: "",
    endDate: "",
    teacherId: "",
    practiceBlockCount: "1",
  });
  const [editing, setEditing] = useState<Offering | null>(null);
  const [editDates, setEditDates] = useState({ startDate: "", endDate: "" });
  const [deleting, setDeleting] = useState<Offering | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  // Any filter change goes back to the first page.
  const filterSetter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  useEffect(() => {
    Promise.all([
      repositoryService.getCurriculumPlans(),
      repositoryService.getSemesters(),
      repositoryService.getTeachers(),
    ])
      .then(([planData, semesterData, teacherData]) => {
        setPlans(planData.plans);
        setSemesters(semesterData.semesters);
        setTeachers(teacherData.users);
        const active = semesterData.semesters.find((semester) => semester.isActive);
        if (active) {
          setForm((current) =>
            current.semesterId
              ? current
              : {
                  ...current,
                  semesterId: String(active.semesterId),
                  startDate: active.startDate.slice(0, 10),
                  endDate: active.endDate.slice(0, 10),
                },
          );
        }
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await repositoryService.getOfferings({
        courseId: courseFilter?.courseId,
        search: search.trim() || undefined,
        semesterId: semesterFilter ? Number(semesterFilter) : undefined,
        academicLevel: (levelFilter || undefined) as AcademicLevel | undefined,
        planId: planFilter ? Number(planFilter) : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setOfferings(data.offerings);
      setTotal(data.total);
    } catch (reason) {
      setError(errorMessage(reason, "No se pudieron cargar las ofertas"));
    } finally {
      setLoading(false);
    }
  }, [courseFilter, search, semesterFilter, levelFilter, planFilter, page]);

  useEffect(() => {
    if (creating) return;
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load, creating]);

  // The semester's dates are proposed for the offering; they can be adjusted.
  const chooseSemester = (semesterId: string) => {
    const semester = semesters.find((item) => String(item.semesterId) === semesterId);
    setForm((current) => ({
      ...current,
      semesterId,
      startDate: semester ? semester.startDate.slice(0, 10) : current.startDate,
      endDate: semester ? semester.endDate.slice(0, 10) : current.endDate,
    }));
  };

  const create = async () => {
    if (!form.course || !form.semesterId || !form.startDate || !form.endDate) {
      setError("Elige el curso y el semestre, y completa las fechas de la oferta.");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("La fecha de fin debe ser igual o posterior a la fecha de inicio.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.createOffering({
        courseId: form.course.courseId,
        semesterId: Number(form.semesterId),
        teacherId: form.teacherId ? Number(form.teacherId) : undefined,
        practiceBlockCount: Number(form.practiceBlockCount),
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setCourseFilter(form.course);
      setForm((current) => ({ ...current, course: null, teacherId: "" }));
      setPage(1);
      setCreating(false);
    } catch (reason) {
      setError(errorMessage(reason, "No se pudo crear la oferta"));
    } finally {
      setSaving(false);
    }
  };

  const saveDates = async () => {
    if (!editing || !editDates.startDate || !editDates.endDate) return;
    if (editDates.endDate < editDates.startDate) {
      setError("La fecha de fin debe ser igual o posterior a la fecha de inicio.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.updateOfferingSchedule(editing.offeringId, editDates);
      setEditing(null);
      await load();
    } catch (reason) {
      setError(errorMessage(reason, "No se pudo editar la oferta"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    setError("");
    try {
      await repositoryService.deleteOffering(deleting.offeringId);
      setDeleting(null);
      await load();
    } catch (reason) {
      setError(errorMessage(reason, "No se pudo eliminar la oferta"));
    } finally {
      setDeletePending(false);
    }
  };

  if (creating) {
    return (
      <div className="repo-maint-content">
        <button type="button" className="repo-back-button" onClick={() => setCreating(false)}>
          ‹ Volver a ofertas
        </button>
        <div className="repo-section-heading">
          <h2>Nueva oferta</h2>
          <button
            type="button"
            className="repo-outline-button"
            onClick={() => void create()}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
        {error && <div className="repo-alert repo-alert--error">{error}</div>}
        <p className="repo-form-hint">
          Una oferta es un curso dictado en un semestre. Un curso tiene como máximo una oferta
          por semestre.
        </p>
        <div className="repo-maint-form">
          <CoursePicker
            value={form.course}
            onChange={(course) => setForm((current) => ({ ...current, course }))}
          />
          <label className="repo-form-field">
            <span>Semestre</span>
            <select value={form.semesterId} onChange={(event) => chooseSemester(event.target.value)}>
              <option value="">Seleccionar</option>
              {semesters.map((semester) => (
                <option key={semester.semesterId} value={semester.semesterId}>
                  {semester.semesterName}
                </option>
              ))}
            </select>
          </label>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Fecha de inicio</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
            </label>
            <label className="repo-form-field">
              <span>Fecha de fin</span>
              <input
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </label>
          </div>
          <p className="repo-form-hint">
            Se proponen las fechas del semestre. Al guardar se crean las semanas y los bloques.
          </p>
          <label className="repo-form-field">
            <span>Docente principal</span>
            <select
              value={form.teacherId}
              onChange={(event) => setForm({ ...form, teacherId: event.target.value })}
            >
              <option value="">Sin asignar por ahora</option>
              {teachers.map((teacher) => (
                <option key={teacher.userId} value={teacher.userId}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="repo-form-field">
            <span>Bloques de práctica</span>
            <select
              value={form.practiceBlockCount}
              onChange={(event) => setForm({ ...form, practiceBlockCount: event.target.value })}
            >
              <option value="0">Sin práctica</option>
              <option value="1">1 bloque — Práctica A</option>
              <option value="2">2 bloques — Prácticas A y B</option>
              <option value="3">3 bloques — Prácticas A, B y C</option>
            </select>
            <small>El bloque de Teoría se crea siempre y es común a todos.</small>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <h2>Ofertas</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => {
            setError("");
            setForm((current) => ({ ...current, course: courseFilter ?? null }));
            setCreating(true);
          }}
        >
          <Plus /> Nueva oferta
        </button>
      </div>
      {error && <div className="repo-alert repo-alert--error">{error}</div>}
      <div className="repo-table-filters">
        <label className="repo-search-field">
          <input
            value={search}
            onChange={(event) => filterSetter(setSearch)(event.target.value)}
            placeholder="Buscar curso, código o docente"
          />
          <Search />
        </label>
        <label className="repo-select-field">
          <span>Semestre</span>
          <select
            value={semesterFilter}
            onChange={(event) => filterSetter(setSemesterFilter)(event.target.value)}
          >
            <option value="">Todos</option>
            {semesters.map((semester) => (
              <option key={semester.semesterId} value={semester.semesterId}>
                {semester.semesterName}
              </option>
            ))}
          </select>
        </label>
        <label className="repo-select-field">
          <span>Tipo de programa</span>
          <select
            value={levelFilter}
            onChange={(event) => filterSetter(setLevelFilter)(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="UNDERGRADUATE">Pregrado</option>
            <option value="POSTGRADUATE">Posgrado</option>
          </select>
        </label>
        <label className="repo-select-field">
          <span>Plan curricular</span>
          <select
            value={planFilter}
            onChange={(event) => filterSetter(setPlanFilter)(event.target.value)}
          >
            <option value="">Todos</option>
            {plans.map((plan) => (
              <option key={plan.planId} value={plan.planId}>
                {plan.planCode}
              </option>
            ))}
          </select>
        </label>
        {courseFilter && (
          <span className="repo-filter-chip">
            Curso: {courseFilter.courseName}
            <button
              type="button"
              aria-label="Quitar el filtro de curso"
              onClick={() => {
                setCourseFilter(undefined);
                setPage(1);
              }}
            >
              <X size={16} />
            </button>
          </span>
        )}
      </div>
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Curso</th>
              <th>Semestre</th>
              <th>Programa</th>
              <th>Fechas</th>
              <th>Docente</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Cargando…</td>
              </tr>
            ) : offerings.length ? (
              offerings.map((offering) => (
                <tr key={offering.offeringId}>
                  <td>
                    {offering.courseName}
                    <span className="repo-table-sub">{offering.courseCode}</span>
                  </td>
                  <td>{offering.semesterName}</td>
                  <td>
                    {offering.programName}
                    <span className="repo-table-sub">Plan {offering.planCode}</span>
                  </td>
                  <td>
                    {formatDate(offering.startDate)} – {formatDate(offering.endDate)}
                  </td>
                  <td>{offering.teacherName || <span className="repo-table-sub">—</span>}</td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => {
                          setError("");
                          setEditing(offering);
                          setEditDates({
                            startDate: offering.startDate.slice(0, 10),
                            endDate: offering.endDate.slice(0, 10),
                          });
                        }}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeleting(offering)}
                      >
                        <Trash2 /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>No hay ofertas para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        label="ofertas"
      />
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>Editar oferta</DialogTitle>
            <DialogDescription>
              {editing?.courseName} · {editing?.semesterName}. Los datos del curso (nombre,
              código, plan) se editan en la sección Cursos.
            </DialogDescription>
          </DialogHeader>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Fecha de inicio</span>
              <input
                type="date"
                value={editDates.startDate}
                onChange={(event) => setEditDates({ ...editDates, startDate: event.target.value })}
              />
            </label>
            <label className="repo-form-field">
              <span>Fecha de fin</span>
              <input
                type="date"
                min={editDates.startDate}
                value={editDates.endDate}
                onChange={(event) => setEditDates({ ...editDates, endDate: event.target.value })}
              />
            </label>
          </div>
          <p className="repo-form-hint">
            Las fechas sincronizan las semanas de todos los bloques. No se eliminan semanas que
            ya tengan contenido.
          </p>
          {error && <div className="repo-alert repo-alert--error">{error}</div>}
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveDates()}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar oferta"
        description={`Se eliminará la oferta ${deleting?.semesterName || ""} de “${deleting?.courseName || ""}”. El curso y sus demás ofertas se conservan.`}
        pending={deletePending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
