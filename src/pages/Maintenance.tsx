import {
  Copy,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Unauthorized } from "@/pages/Unauthorized";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EnrollmentsManagement } from "@/components/maintenance/EnrollmentsManagement";
import { StudentsManagement } from "@/components/maintenance/StudentsManagement";
import { CourseBlocksManagement } from "@/components/maintenance/CourseBlocksManagement";
import { CurriculumPlansManagement } from "@/components/maintenance/CurriculumPlansManagement";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  repositoryService,
  type AcademicLevel,
  type CurriculumPlan,
  type Offering,
  type Program,
  type Semester,
  type Teacher,
} from "@/services/repositoryService";
import { copyText } from "@/lib/copyText";

type Section =
  | "courses"
  | "blocks"
  | "programs"
  | "plans"
  | "semesters"
  | "teachers"
  | "students"
  | "enrollments";
type View = "list" | "create";

const maintenanceSections: { id: Section; label: string }[] = [
  { id: "courses", label: "Cursos" },
  { id: "blocks", label: "Bloques" },
  { id: "programs", label: "Programas" },
  { id: "plans", label: "Planes" },
  { id: "semesters", label: "Semestres" },
  { id: "teachers", label: "Docentes" },
  { id: "students", label: "Alumnos" },
  { id: "enrollments", label: "Matrículas" },
];


/** Rows per page in the maintenance course table. */
const MAINTENANCE_PAGE_SIZE = 25;
function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const random = Array.from(
    bytes,
    (value) => alphabet[value % alphabet.length],
  ).join("");
  return `Bio#${random}Aa1!`;
}

function InlineError({ message }: { message: string }) {
  return message ? (
    <div className="repo-alert repo-alert--error">{message}</div>
  ) : null;
}

function formatCourseDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
    .replace(".", "");
}

function CoursesSection() {
  const [view, setView] = useState<View>("list");
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearchValue] = useState("");
  const [semesterFilter, setSemesterValue] = useState("");
  const [levelFilter, setLevelValue] = useState("");
  const [planFilter, setPlanValue] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  // Any filter change goes back to the first page.
  const resetting = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  const setSearch = resetting(setSearchValue);
  const setSemesterFilter = resetting(setSemesterValue);
  const setLevelFilter = resetting(setLevelValue);
  const setPlanFilter = resetting(setPlanValue);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingCourse, setEditingCourse] = useState<Offering | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Offering | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [editForm, setEditForm] = useState({
    courseName: "",
    courseCode: "",
    description: "",
    credits: "3",
    programId: "",
    planId: "",
    startDate: "",
    endDate: "",
  });
  const [form, setForm] = useState({
    courseName: "",
    description: "",
    teacherId: "",
    academicLevel: "" as AcademicLevel | "",
    programId: "",
    planId: "",
    semesterId: "",
    practiceBlockCount: "1",
    startDate: "",
    endDate: "",
  });

  // Catalogs for the filters and the create form are loaded once.
  useEffect(() => {
    Promise.all([
      repositoryService.getPrograms(),
      repositoryService.getCurriculumPlans(),
      repositoryService.getSemesters(),
      repositoryService.getTeachers(),
    ])
      .then(([programData, planData, semesterData, teacherData]) => {
        setPrograms(programData.programs.filter((program) => program.isActive));
        setPlans(planData.plans);
        setSemesters(semesterData.semesters);
        setTeachers(teacherData.users);
        const active = semesterData.semesters.find((semester) => semester.isActive);
        setForm((current) => ({
          ...current,
          semesterId: current.semesterId || (active ? String(active.semesterId) : ""),
          startDate: current.startDate || (active?.startDate ?? "").slice(0, 10),
          endDate: current.endDate || (active?.endDate ?? "").slice(0, 10),
        }));
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  // Only the visible page of offerings is requested; the server applies the filters.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await repositoryService.getOfferings({
        search: search.trim() || undefined,
        semesterId: semesterFilter ? Number(semesterFilter) : undefined,
        academicLevel: (levelFilter || undefined) as AcademicLevel | undefined,
        planId: planFilter ? Number(planFilter) : undefined,
        page,
        limit: MAINTENANCE_PAGE_SIZE,
      });
      setOfferings(data.offerings);
      setTotal(data.total);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los cursos",
      );
    } finally {
      setLoading(false);
    }
  }, [search, semesterFilter, levelFilter, planFilter, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const save = async () => {
    if (
      !form.courseName.trim() ||
      !form.description.trim() ||
      !form.teacherId ||
      !form.programId ||
      !form.planId ||
      !form.semesterId ||
      !form.startDate ||
      !form.endDate
    ) {
      setError(
        "Completa todos los datos del curso, incluidas las fechas de inicio y fin.",
      );
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
        courseName: form.courseName.trim(),
        description: form.description.trim(),
        programId: Number(form.programId),
        planId: Number(form.planId),
        semesterId: Number(form.semesterId),
        teacherId: Number(form.teacherId),
        practiceBlockCount: Number(form.practiceBlockCount),
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setForm((current) => ({
        ...current,
        courseName: "",
        description: "",
        teacherId: "",
        programId: "",
        planId: "",
        practiceBlockCount: "1",
      }));
      setView("list");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo agregar el curso",
      );
    } finally {
      setSaving(false);
    }
  };

  const openCourseEditor = (offering: Offering) => {
    setError("");
    setEditingCourse(offering);
    setEditForm({
      courseName: offering.courseName,
      courseCode: offering.courseCode,
      description: offering.description || "",
      credits: String(offering.credits),
      programId: String(offering.programId),
      planId: String(offering.planId),
      startDate: offering.startDate.slice(0, 10),
      endDate: offering.endDate.slice(0, 10),
    });
  };

  const saveCourseEdit = async () => {
    if (
      !editingCourse ||
      !editForm.courseName.trim() ||
      !editForm.courseCode.trim() ||
      !editForm.description.trim() ||
      !editForm.programId ||
      !editForm.planId ||
      !editForm.startDate ||
      !editForm.endDate ||
      Number(editForm.credits) < 1
    ) {
      setError("Completa todos los datos obligatorios del curso.");
      return;
    }
    if (editForm.endDate < editForm.startDate) {
      setError("La fecha de fin debe ser igual o posterior a la fecha de inicio.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.updateCourse(editingCourse.courseId, {
        courseName: editForm.courseName.trim(),
        courseCode: editForm.courseCode.trim().toUpperCase(),
        description: editForm.description.trim(),
        credits: Number(editForm.credits),
        programId: Number(editForm.programId),
        planId: Number(editForm.planId),
      });
      await repositoryService.updateOfferingSchedule(editingCourse.offeringId, {
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      setEditingCourse(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo editar el curso",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteCourse = async () => {
    if (!deletingCourse) return;
    setDeletePending(true);
    setError("");
    try {
      // Several editions share a course after the Classroom import: only this one is removed.
      await repositoryService.deleteOffering(deletingCourse.offeringId);
      setDeletingCourse(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar el curso",
      );
    } finally {
      setDeletePending(false);
    }
  };

  if (view === "create") {
    const filteredPrograms = programs.filter(
      (program) =>
        !form.academicLevel || program.academicLevel === form.academicLevel,
    );
    return (
      <div className="repo-maint-content">
        <button
          type="button"
          className="repo-back-button"
          onClick={() => setView("list")}
        >
          ‹ Volver a cursos
        </button>
        <div className="repo-section-heading">
          <h2>Agregar curso</h2>
          <button
            type="button"
            className="repo-outline-button"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
        <InlineError message={error} />
        <div className="repo-maint-form">
          <label className="repo-form-field repo-form-field--wide">
            <span>Nombre del curso</span>
            <input
              value={form.courseName}
              onChange={(event) =>
                setForm({ ...form, courseName: event.target.value })
              }
            />
          </label>
          <label className="repo-form-field repo-form-field--wide">
            <span>Descripción del curso</span>
            <textarea
              rows={5}
              required
              maxLength={2000}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>
          <label className="repo-form-field">
            <span>Docente principal</span>
            <select
              value={form.teacherId}
              onChange={(event) =>
                setForm({ ...form, teacherId: event.target.value })
              }
            >
              <option value="">Seleccionar docente</option>
              {teachers.map((teacher) => (
                <option key={teacher.userId} value={teacher.userId}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </label>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Tipo de programa</span>
              <select
                value={form.academicLevel}
                onChange={(event) =>
                  setForm({
                    ...form,
                    academicLevel: event.target.value as AcademicLevel,
                    programId: "",
                  })
                }
              >
                <option value="">Seleccionar</option>
                <option value="UNDERGRADUATE">Pregrado</option>
                <option value="POSTGRADUATE">Posgrado</option>
              </select>
            </label>
            <label className="repo-form-field">
              <span>Programa</span>
              <select
                value={form.programId}
                onChange={(event) =>
                  setForm({ ...form, programId: event.target.value })
                }
              >
                <option value="">Seleccionar</option>
                {filteredPrograms.map((program) => (
                  <option key={program.programId} value={program.programId}>
                    {program.programName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="repo-form-field">
            <span>Semestre</span>
            <select
              value={form.semesterId}
              onChange={(event) =>
                setForm({ ...form, semesterId: event.target.value })
              }
            >
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
              <span>Fecha de inicio del curso</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm({ ...form, startDate: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Fecha de fin del curso</span>
              <input
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(event) =>
                  setForm({ ...form, endDate: event.target.value })
                }
              />
            </label>
          </div>
          <p className="repo-form-hint">
            Fechas sugeridas según el último curso configurado. Al guardar se
            crearán automáticamente todas las semanas del curso y sus bloques.
          </p>
          <label className="repo-form-field">
            <span>Plan curricular</span>
            <select
              value={form.planId}
              onChange={(event) =>
                setForm({ ...form, planId: event.target.value })
              }
            >
              <option value="">Seleccionar</option>
              {plans
                .filter((plan) => plan.isActive)
                .map((plan) => (
                  <option key={plan.planId} value={plan.planId}>
                    {plan.planCode}
                  </option>
                ))}
            </select>
            <small>Todo curso pertenece a un único plan curricular.</small>
          </label>
          <label className="repo-form-field">
            <span>Bloques de práctica</span>
            <select
              value={form.practiceBlockCount}
              onChange={(event) =>
                setForm({ ...form, practiceBlockCount: event.target.value })
              }
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
        <h2>Cursos</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => setView("create")}
        >
          <Plus /> Agregar curso
        </button>
      </div>
      <InlineError message={error} />
      <div className="repo-table-filters">
        <label className="repo-search-field">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
          />
          <Search />
        </label>
        <label className="repo-select-field">
          <span>Semestre</span>
          <select
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
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
            onChange={(event) => setLevelFilter(event.target.value)}
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
            onChange={(event) => setPlanFilter(event.target.value)}
          >
            <option value="">Todos</option>
            {plans.map((plan) => (
              <option key={plan.planId} value={plan.planId}>
                {plan.planCode}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Nombre del curso</th>
              <th>Programa</th>
              <th>Plan</th>
              <th>Tipo de programa</th>
              <th>Semestre</th>
              <th>Fechas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Cargando…</td>
              </tr>
            ) : offerings.length ? (
              offerings.map((offering) => (
                <tr key={offering.offeringId}>
                  <td>{offering.courseName}</td>
                  <td>{offering.programName}</td>
                  <td>{offering.planCode}</td>
                  <td>
                    {offering.academicLevel === "UNDERGRADUATE"
                      ? "Pregrado"
                      : "Posgrado"}
                  </td>
                  <td>{offering.semesterName}</td>
                  <td>
                    {formatCourseDate(offering.startDate)} –{" "}
                    {formatCourseDate(offering.endDate)}
                  </td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => openCourseEditor(offering)}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeletingCourse(offering)}
                      >
                        <Trash2 /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>No hay cursos para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={MAINTENANCE_PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        label="cursos"
      />
      <Dialog
        open={!!editingCourse}
        onOpenChange={(open) => !open && setEditingCourse(null)}
      >
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>Editar curso</DialogTitle>
            <DialogDescription>
              Actualiza la información general y el calendario del curso.
            </DialogDescription>
          </DialogHeader>
          <label className="repo-form-field">
            <span>Nombre del curso</span>
            <input
              value={editForm.courseName}
              onChange={(event) =>
                setEditForm({ ...editForm, courseName: event.target.value })
              }
            />
          </label>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Código</span>
              <input
                value={editForm.courseCode}
                onChange={(event) =>
                  setEditForm({ ...editForm, courseCode: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Créditos</span>
              <input
                type="number"
                min="1"
                max="10"
                value={editForm.credits}
                onChange={(event) =>
                  setEditForm({ ...editForm, credits: event.target.value })
                }
              />
            </label>
          </div>
          <label className="repo-form-field">
            <span>Programa</span>
            <select
              value={editForm.programId}
              onChange={(event) =>
                setEditForm({ ...editForm, programId: event.target.value })
              }
            >
              {programs.map((program) => (
                <option key={program.programId} value={program.programId}>
                  {program.programName}
                </option>
              ))}
            </select>
          </label>
          <label className="repo-form-field">
            <span>Plan curricular</span>
            <select
              value={editForm.planId}
              onChange={(event) =>
                setEditForm({ ...editForm, planId: event.target.value })
              }
            >
              {plans
                .filter(
                  (plan) =>
                    plan.isActive || plan.planId === editingCourse?.planId,
                )
                .map((plan) => (
                  <option key={plan.planId} value={plan.planId}>
                    {plan.planCode}
                    {plan.isActive ? "" : " — Inactivo"}
                  </option>
                ))}
            </select>
          </label>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Fecha de inicio del curso</span>
              <input
                type="date"
                value={editForm.startDate}
                onChange={(event) =>
                  setEditForm({ ...editForm, startDate: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Fecha de fin del curso</span>
              <input
                type="date"
                min={editForm.startDate}
                value={editForm.endDate}
                onChange={(event) =>
                  setEditForm({ ...editForm, endDate: event.target.value })
                }
              />
            </label>
          </div>
          <p className="repo-form-hint">
            El calendario sincroniza las semanas de todos los bloques. No se
            eliminarán semanas que ya tengan contenido.
          </p>
          <label className="repo-form-field">
            <span>Descripción del curso</span>
            <textarea
              rows={5}
              maxLength={2000}
              value={editForm.description}
              onChange={(event) =>
                setEditForm({ ...editForm, description: event.target.value })
              }
            />
          </label>
          <InlineError message={error} />
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveCourseEdit()}
            disabled={saving || !editForm.description.trim()}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deletingCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
        title="Eliminar edición del curso"
        description={`Se eliminará la edición ${deletingCourse?.semesterName || ""} de “${deletingCourse?.courseName || ""}”. Las demás ediciones del curso se conservan.`}
        pending={deletePending}
        onConfirm={confirmDeleteCourse}
      />
    </div>
  );
}

function ProgramsSection() {
  const [view, setView] = useState<View>("list");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [facultyId, setFacultyId] = useState<number>();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [form, setForm] = useState({
    name: "",
    level: "" as AcademicLevel | "",
    degreeType: "BACHELOR" as Program["degreeType"],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    level: "UNDERGRADUATE" as AcademicLevel,
    degreeType: "BACHELOR" as Program["degreeType"],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [programData, facultyData] = await Promise.all([
        repositoryService.getPrograms(),
        repositoryService.getFaculties(),
      ]);
      setPrograms(programData.programs);
      setFacultyId(facultyData.faculties[0]?.id);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los programas",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const generatedCode = useMemo(() => {
    const words =
      form.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .match(/[A-Z0-9]+/g) || [];
    const base =
      words.length > 1
        ? words
            .map((word) => word[0])
            .join("")
            .slice(0, 6)
        : (words[0] || "").slice(0, 6);
    let code = base || "PROG";
    let suffix = 2;
    while (programs.some((program) => program.programCode === code))
      code = `${base || "PROG"}${suffix++}`;
    return code;
  }, [form.name, programs]);

  const save = async () => {
    if (!form.name.trim() || !form.level || !facultyId)
      return setError("Completa el nombre y tipo de programa.");
    setSaving(true);
    setError("");
    try {
      await repositoryService.createProgram({
        programName: form.name.trim(),
        programCode: generatedCode,
        facultyId,
        academicLevel: form.level,
        degreeType:
          form.level === "UNDERGRADUATE" ? "BACHELOR" : form.degreeType,
      });
      setForm({ name: "", level: "", degreeType: "MASTER" });
      setView("list");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo agregar el programa",
      );
    } finally {
      setSaving(false);
    }
  };

  const openProgramEditor = (program: Program) => {
    setError("");
    setEditingProgram(program);
    setEditForm({
      name: program.programName,
      code: program.programCode,
      level: program.academicLevel,
      degreeType: program.degreeType,
    });
  };

  const saveProgramEdit = async () => {
    if (!editingProgram || !editForm.name.trim() || !editForm.code.trim()) {
      setError("Completa el nombre y el código del programa.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.updateProgram(editingProgram.programId, {
        programName: editForm.name.trim(),
        programCode: editForm.code.trim().toUpperCase(),
        academicLevel: editForm.level,
        degreeType:
          editForm.level === "UNDERGRADUATE" ? "BACHELOR" : editForm.degreeType,
      });
      setEditingProgram(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo editar el programa",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProgram = async () => {
    if (!deletingProgram) return;
    setDeletePending(true);
    setError("");
    try {
      await repositoryService.deleteProgram(deletingProgram.programId);
      setDeletingProgram(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar el programa",
      );
    } finally {
      setDeletePending(false);
    }
  };

  if (view === "create")
    return (
      <div className="repo-maint-content">
        <button
          type="button"
          className="repo-back-button"
          onClick={() => setView("list")}
        >
          ‹ Volver a programas
        </button>
        <div className="repo-section-heading">
          <h2>Agregar programa</h2>
          <button
            type="button"
            className="repo-outline-button"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
        <InlineError message={error} />
        <div className="repo-maint-form">
          <label className="repo-form-field repo-form-field--wide">
            <span>Nombre del programa</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <small>
              El código se generará como <strong>{generatedCode}</strong>.
            </small>
          </label>
          <label className="repo-form-field">
            <span>Tipo de programa</span>
            <select
              value={form.level}
              onChange={(event) =>
                setForm({
                  ...form,
                  level: event.target.value as AcademicLevel,
                  degreeType:
                    event.target.value === "UNDERGRADUATE"
                      ? "BACHELOR"
                      : "MASTER",
                })
              }
            >
              <option value="">Seleccionar</option>
              <option value="UNDERGRADUATE">Pregrado</option>
              <option value="POSTGRADUATE">Posgrado</option>
            </select>
          </label>
          {form.level === "POSTGRADUATE" && (
            <label className="repo-form-field">
              <span>Grado</span>
              <select
                value={form.degreeType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    degreeType: event.target.value as Program["degreeType"],
                  })
                }
              >
                <option value="MASTER">Maestría</option>
                <option value="DOCTORATE">Doctorado</option>
                <option value="DIPLOMA">Diplomado</option>
              </select>
            </label>
          )}
        </div>
      </div>
    );

  const filtered = programs.filter(
    (program) =>
      (!search ||
        program.programName.toLowerCase().includes(search.toLowerCase())) &&
      (!levelFilter || program.academicLevel === levelFilter),
  );
  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <h2>Programas</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => setView("create")}
        >
          <Plus /> Agregar programa
        </button>
      </div>
      <InlineError message={error} />
      <div className="repo-table-filters">
        <label className="repo-search-field">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
          />
          <Search />
        </label>
        <label className="repo-select-field">
          <span>Tipo de programa</span>
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="UNDERGRADUATE">Pregrado</option>
            <option value="POSTGRADUATE">Posgrado</option>
          </select>
        </label>
      </div>
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Programa</th>
              <th>Tipo de programa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3}>Cargando…</td>
              </tr>
            ) : filtered.length ? (
              filtered.map((program) => (
                <tr key={program.programId}>
                  <td>{program.programName}</td>
                  <td>
                    {program.academicLevel === "UNDERGRADUATE"
                      ? "Pregrado"
                      : "Posgrado"}
                  </td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => openProgramEditor(program)}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeletingProgram(program)}
                      >
                        <Trash2 /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No hay programas para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog
        open={!!editingProgram}
        onOpenChange={(open) => !open && setEditingProgram(null)}
      >
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>Editar programa</DialogTitle>
            <DialogDescription>
              Actualiza los datos del programa académico.
            </DialogDescription>
          </DialogHeader>
          <label className="repo-form-field">
            <span>Nombre del programa</span>
            <input
              value={editForm.name}
              onChange={(event) =>
                setEditForm({ ...editForm, name: event.target.value })
              }
            />
          </label>
          <label className="repo-form-field">
            <span>Código</span>
            <input
              value={editForm.code}
              onChange={(event) =>
                setEditForm({ ...editForm, code: event.target.value })
              }
            />
          </label>
          <label className="repo-form-field">
            <span>Tipo de programa</span>
            <select
              value={editForm.level}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  level: event.target.value as AcademicLevel,
                  degreeType:
                    event.target.value === "UNDERGRADUATE"
                      ? "BACHELOR"
                      : "MASTER",
                })
              }
            >
              <option value="UNDERGRADUATE">Pregrado</option>
              <option value="POSTGRADUATE">Posgrado</option>
            </select>
          </label>
          {editForm.level === "POSTGRADUATE" && (
            <label className="repo-form-field">
              <span>Grado</span>
              <select
                value={editForm.degreeType}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    degreeType: event.target.value as Program["degreeType"],
                  })
                }
              >
                <option value="MASTER">Maestría</option>
                <option value="DOCTORATE">Doctorado</option>
                <option value="DIPLOMA">Diplomado</option>
              </select>
            </label>
          )}
          <InlineError message={error} />
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveProgramEdit()}
            disabled={saving || !editForm.name.trim() || !editForm.code.trim()}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deletingProgram}
        onOpenChange={(open) => !open && setDeletingProgram(null)}
        title="Eliminar programa"
        description={`Se eliminará “${deletingProgram?.programName || ""}” del catálogo. Esta acción no se puede deshacer.`}
        pending={deletePending}
        onConfirm={confirmDeleteProgram}
      />
    </div>
  );
}

function SemestersSection() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [editingSemester, setEditingSemester] = useState<Semester | null>();
  const [deletingSemester, setDeletingSemester] = useState<Semester | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    year: String(new Date().getFullYear()),
    period: "1",
    startDate: "",
    endDate: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSemesters((await repositoryService.getSemesters()).semesters);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los semestres",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openSemesterEditor = (semester?: Semester) => {
    setError("");
    setEditingSemester(semester || null);
    setForm(
      semester
        ? {
            year: String(semester.year),
            period: String(semester.period),
            startDate: semester.startDate.slice(0, 10),
            endDate: semester.endDate.slice(0, 10),
          }
        : {
            year: String(new Date().getFullYear()),
            period: "1",
            startDate: "",
            endDate: "",
          },
    );
  };

  const saveSemester = async () => {
    const year = Number(form.year);
    const period = Number(form.period);
    if (
      year < 2020 ||
      year > 2100 ||
      ![1, 2].includes(period) ||
      !form.startDate ||
      !form.endDate
    ) {
      setError("Completa el año, periodo y las fechas del semestre.");
      return;
    }
    if (form.endDate <= form.startDate) {
      setError("La fecha de fin debe ser posterior a la fecha de inicio.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = {
        year,
        period,
        startDate: form.startDate,
        endDate: form.endDate,
      };
      if (editingSemester) {
        await repositoryService.updateSemester(
          editingSemester.semesterId,
          data,
        );
      } else {
        await repositoryService.createSemester(data);
      }
      setEditingSemester(undefined);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo guardar el semestre",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteSemester = async () => {
    if (!deletingSemester) return;
    setDeletePending(true);
    setError("");
    try {
      await repositoryService.deleteSemester(deletingSemester.semesterId);
      setDeletingSemester(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar el semestre",
      );
    } finally {
      setDeletePending(false);
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "UTC" })
      .format(new Date(value))
      .replace(".", "");

  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <h2>Semestres</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => openSemesterEditor()}
        >
          <Plus /> Agregar semestre
        </button>
      </div>
      <InlineError message={error} />
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Semestre</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Cargando…</td>
              </tr>
            ) : semesters.length ? (
              semesters.map((semester) => (
                <tr key={semester.semesterId}>
                  <td>{semester.semesterName}</td>
                  <td>{formatDate(semester.startDate)}</td>
                  <td>{formatDate(semester.endDate)}</td>
                  <td>
                    <span
                      className={
                        semester.isActive
                          ? "repo-status repo-status--active"
                          : "repo-status"
                      }
                    >
                      {semester.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => openSemesterEditor(semester)}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeletingSemester(semester)}
                      >
                        <Trash2 /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No hay semestres para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog
        open={editingSemester !== undefined}
        onOpenChange={(open) => !open && setEditingSemester(undefined)}
      >
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingSemester ? "Editar semestre" : "Agregar semestre"}
            </DialogTitle>
            <DialogDescription>
              Define el periodo académico y sus fechas de vigencia.
            </DialogDescription>
          </DialogHeader>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Año</span>
              <input
                type="number"
                min="2020"
                max="2100"
                value={form.year}
                onChange={(event) =>
                  setForm({ ...form, year: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Periodo</span>
              <select
                value={form.period}
                onChange={(event) =>
                  setForm({ ...form, period: event.target.value })
                }
              >
                <option value="1">I</option>
                <option value="2">II</option>
              </select>
            </label>
          </div>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Fecha de inicio</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm({ ...form, startDate: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Fecha de fin</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm({ ...form, endDate: event.target.value })
                }
              />
            </label>
          </div>
          <InlineError message={error} />
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveSemester()}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar semestre"}
          </button>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deletingSemester}
        onOpenChange={(open) => !open && setDeletingSemester(null)}
        title="Eliminar semestre"
        description={`Se eliminará “${deletingSemester?.semesterName || ""}” del catálogo. Esta acción no se puede deshacer.`}
        pending={deletePending}
        onConfirm={confirmDeleteSemester}
      />
    </div>
  );
}

function TeachersSection() {
  const [view, setView] = useState<View>("list");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", familyName: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resendingEmail, setResendingEmail] = useState("");
  const [resettingEmail, setResettingEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "" });
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  }>();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTeachers((await repositoryService.getTeachers()).users);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los docentes",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const save = async () => {
    if (!form.name.trim() || !form.familyName.trim() || !form.email.trim())
      return setError("Completa el nombre, apellido y correo.");
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const temporaryPassword = generateTemporaryPassword();
      await repositoryService.createTeacher({
        email: form.email.trim(),
        name: form.name.trim(),
        familyName: form.familyName.trim(),
        temporaryPassword,
      });
      setCreatedCredentials({
        email: form.email.trim(),
        password: temporaryPassword,
      });
      setCopied(false);
      setForm({ name: "", familyName: "", email: "" });
      setView("list");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo agregar el docente",
      );
    } finally {
      setSaving(false);
    }
  };
  const resendInvitation = async (email: string) => {
    setResendingEmail(email);
    setError("");
    setNotice("");
    try {
      await repositoryService.resendTeacherInvitation(email);
      setNotice(`Cognito aceptó el reenvío de la invitación a ${email}.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo reenviar la invitación",
      );
    } finally {
      setResendingEmail("");
    }
  };
  const resetTemporaryPassword = async (email: string) => {
    setResettingEmail(email);
    setError("");
    setNotice("");
    try {
      const temporaryPassword = generateTemporaryPassword();
      const response = await repositoryService.resetTeacherTemporaryPassword(
        email,
        temporaryPassword,
      );
      setCreatedCredentials({ email, password: temporaryPassword });
      setCopied(false);
      setNotice(
        response.accountProvisioned
          ? `Se creó y vinculó la cuenta de acceso de ${email}. Entrégale la contraseña temporal de forma segura.`
          : `Se generó una nueva contraseña temporal para ${email}. Entrégasela de forma segura al docente.`,
      );
      if (response.accountProvisioned) await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo generar la contraseña temporal",
      );
    } finally {
      setResettingEmail("");
    }
  };
  const openTeacherEditor = (teacher: Teacher) => {
    setError("");
    setEditingTeacher(teacher);
    setEditForm({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
    });
  };
  const saveTeacherEdit = async () => {
    if (
      !editingTeacher ||
      !editForm.firstName.trim() ||
      !editForm.lastName.trim()
    ) {
      setError("Completa el nombre y los apellidos del docente.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.updateTeacher(editingTeacher.userId, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      });
      setEditingTeacher(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo editar el docente",
      );
    } finally {
      setSaving(false);
    }
  };
  const confirmDeleteTeacher = async () => {
    if (!deletingTeacher) return;
    setDeletePending(true);
    setError("");
    setNotice("");
    try {
      await repositoryService.deleteTeacher(deletingTeacher.email);
      setDeletingTeacher(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar el docente",
      );
    } finally {
      setDeletePending(false);
    }
  };
  const copyCredentials = async () => {
    if (!createdCredentials) return;
    try {
      await copyText(
        `Usuario: ${createdCredentials.email}\nContraseña temporal: ${createdCredentials.password}`,
      );
      setCopied(true);
    } catch {
      setError(
        "No se pudo copiar. Selecciona la contraseña y cópiala manualmente.",
      );
    }
  };
  if (view === "create")
    return (
      <div className="repo-maint-content">
        <button
          type="button"
          className="repo-back-button"
          onClick={() => setView("list")}
        >
          ‹ Volver a docentes
        </button>
        <div className="repo-section-heading">
          <h2>Agregar docente</h2>
          <button
            type="button"
            className="repo-outline-button"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
        <InlineError message={error} />
        <div className="repo-maint-form">
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Nombre del docente</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Apellidos</span>
              <input
                value={form.familyName}
                onChange={(event) =>
                  setForm({ ...form, familyName: event.target.value })
                }
              />
            </label>
          </div>
          <label className="repo-form-field repo-form-field--wide">
            <span>Correo institucional</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
            <small>
              Se enviará una invitación y también se mostrará una contraseña
              temporal por única vez.
            </small>
          </label>
        </div>
      </div>
    );
  const filtered = teachers.filter(
    (teacher) =>
      !search ||
      teacher.fullName.toLowerCase().includes(search.toLowerCase()) ||
      teacher.email.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <h2>Docentes</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => setView("create")}
        >
          <Plus /> Agregar docente
        </button>
      </div>
      <InlineError message={error} />
      {notice && <div className="repo-alert repo-alert--success">{notice}</div>}
      {createdCredentials && (
        <div className="repo-credentials" role="status">
          <div>
            <strong>Acceso temporal del docente</strong>
            <p>
              Guarda estas credenciales ahora. La contraseña temporal solo se
              muestra en esta sesión y el docente deberá cambiarla al iniciar.
            </p>
          </div>
          <dl>
            <div>
              <dt>Usuario</dt>
              <dd>{createdCredentials.email}</dd>
            </div>
            <div>
              <dt>Contraseña temporal</dt>
              <dd>
                <code>{createdCredentials.password}</code>
              </dd>
            </div>
          </dl>
          <button
            type="button"
            className="repo-outline-button"
            onClick={() => void copyCredentials()}
          >
            <Copy /> {copied ? "Copiado" : "Copiar credenciales"}
          </button>
        </div>
      )}
      <div className="repo-table-filters">
        <label className="repo-search-field">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
          />
          <Search />
        </label>
      </div>
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Docente</th>
              <th>Correo</th>
              <th>Acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Cargando…</td>
              </tr>
            ) : filtered.length ? (
              filtered.map((teacher) => (
                <tr key={teacher.userId}>
                  <td>{teacher.fullName}</td>
                  <td>{teacher.email}</td>
                  <td>
                    <span
                      className={`repo-access-status ${
                        teacher.authProvider === "AWS_COGNITO"
                          ? "repo-access-status--linked"
                          : "repo-access-status--local"
                      }`}
                    >
                      {teacher.authProvider === "AWS_COGNITO"
                        ? "Cuenta vinculada"
                        : "Sin acceso"}
                    </span>
                  </td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => void resendInvitation(teacher.email)}
                        disabled={
                          resendingEmail === teacher.email ||
                          teacher.authProvider !== "AWS_COGNITO"
                        }
                        title={
                          teacher.authProvider === "AWS_COGNITO"
                            ? "Reenviar invitación temporal"
                            : "Primero crea el acceso con una clave temporal"
                        }
                      >
                        <Send />
                        {resendingEmail === teacher.email
                          ? "Reenviando…"
                          : "Reenviar"}
                      </button>
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => openTeacherEditor(teacher)}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeletingTeacher(teacher)}
                      >
                        <Trash2 /> Eliminar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() =>
                          void resetTemporaryPassword(teacher.email)
                        }
                        disabled={resettingEmail === teacher.email}
                        title={
                          teacher.authProvider === "LOCAL"
                            ? "Crear y vincular una cuenta con contraseña temporal"
                            : "Generar una nueva contraseña temporal"
                        }
                      >
                        <KeyRound />
                        {resettingEmail === teacher.email
                          ? "Generando…"
                          : teacher.authProvider === "LOCAL"
                            ? "Crear acceso"
                            : "Nueva clave"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No hay docentes para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog
        open={!!editingTeacher}
        onOpenChange={(open) => !open && setEditingTeacher(null)}
      >
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>Editar docente</DialogTitle>
            <DialogDescription>
              Actualiza la información personal del docente.
            </DialogDescription>
          </DialogHeader>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Nombre</span>
              <input
                value={editForm.firstName}
                onChange={(event) =>
                  setEditForm({ ...editForm, firstName: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Apellidos</span>
              <input
                value={editForm.lastName}
                onChange={(event) =>
                  setEditForm({ ...editForm, lastName: event.target.value })
                }
              />
            </label>
          </div>
          <label className="repo-form-field">
            <span>Correo institucional</span>
            <input value={editingTeacher?.email || ""} readOnly disabled />
          </label>
          <InlineError message={error} />
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveTeacherEdit()}
            disabled={
              saving || !editForm.firstName.trim() || !editForm.lastName.trim()
            }
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deletingTeacher}
        onOpenChange={(open) => !open && setDeletingTeacher(null)}
        title="Eliminar docente"
        description={`Se eliminará la cuenta de “${deletingTeacher?.fullName || ""}” y perderá el acceso al repositorio. Esta acción no se puede deshacer.`}
        pending={deletePending}
        onConfirm={confirmDeleteTeacher}
      />
    </div>
  );
}

export function Maintenance() {
  const backendUser = useAuthStore((state) => state.backendUser);
  const [section, setSection] = useState<Section>("courses");
  if (!backendUser)
    return (
      <div className="repo-page-state">
        <span className="repo-spinner" />
        Cargando permisos…
      </div>
    );
  if (backendUser.role.roleName !== "Admin") return <Unauthorized />;
  return (
    <section>
      <h1 className="repo-page-title">Mantenimiento</h1>
      <div className="repo-maint-layout">
        <aside className="repo-maint-sidebar">
          {maintenanceSections.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setSection(item.id)}
              className={section === item.id ? "active" : ""}
            >
              {item.label}
            </button>
          ))}
        </aside>
        {section === "courses" && <CoursesSection />}
        {section === "blocks" && <CourseBlocksManagement />}
        {section === "programs" && <ProgramsSection />}
        {section === "plans" && <CurriculumPlansManagement />}
        {section === "semesters" && <SemestersSection />}
        {section === "teachers" && <TeachersSection />}
        {section === "students" && <StudentsManagement />}
        {section === "enrollments" && <EnrollmentsManagement />}
      </div>
    </section>
  );
}
