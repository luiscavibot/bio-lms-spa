import { CalendarPlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  type Program,
} from "@/services/repositoryService";

const PAGE_SIZE = 25;

const emptyForm = {
  courseName: "",
  courseCode: "",
  description: "",
  credits: "3",
  academicLevel: "" as AcademicLevel | "",
  programId: "",
  additionalProgramIds: [] as number[],
  planId: "",
};

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

function offeringsLabel(count: number) {
  return count === 1 ? "1 oferta" : `${count} ofertas`;
}

/**
 * Cursos: the subjects of the curriculum (name, code, program, plan, credits). Each one is
 * taught through offerings, one per semester, managed in the Ofertas section.
 */
export function CourseCatalogSection({
  onShowOfferings,
  onCreateOffering,
}: {
  onShowOfferings: (course: Course) => void;
  onCreateOffering: (course: Course) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  // Any filter change goes back to the first page.
  const filterSetter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  useEffect(() => {
    Promise.all([repositoryService.getPrograms(), repositoryService.getCurriculumPlans()])
      .then(([programData, planData]) => {
        setPrograms(programData.programs.filter((program) => program.isActive));
        setPlans(planData.plans);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await repositoryService.getCourses({
        search: search.trim() || undefined,
        academicLevel: (levelFilter || undefined) as AcademicLevel | undefined,
        programId: programFilter ? Number(programFilter) : undefined,
        planId: planFilter ? Number(planFilter) : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setCourses(data.courses);
      setTotal(data.total);
    } catch (reason) {
      setError(errorMessage(reason, "No se pudieron cargar los cursos"));
    } finally {
      setLoading(false);
    }
  }, [search, levelFilter, programFilter, planFilter, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const programsFor = (level: string) =>
    programs.filter((program) => !level || program.academicLevel === level);

  const create = async (thenOffering: boolean) => {
    if (!form.courseName.trim() || !form.programId || !form.planId || Number(form.credits) < 1) {
      setError("Completa el nombre, el programa, el plan y los créditos del curso.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const course = await repositoryService.createCourse({
        courseName: form.courseName.trim(),
        courseCode: form.courseCode.trim() || undefined,
        description: form.description.trim() || undefined,
        credits: Number(form.credits),
        programId: Number(form.programId),
        additionalProgramIds: form.additionalProgramIds,
        planId: Number(form.planId),
      });
      setForm(emptyForm);
      setCreating(false);
      if (thenOffering) onCreateOffering(course);
      else await load();
    } catch (reason) {
      setError(errorMessage(reason, "No se pudo crear el curso"));
    } finally {
      setSaving(false);
    }
  };

  const openEditor = (course: Course) => {
    setError("");
    setEditing(course);
    setEditForm({
      courseName: course.courseName,
      courseCode: course.courseCode,
      description: course.description || "",
      credits: String(course.credits),
      academicLevel: course.academicLevel,
      programId: String(course.programId),
      additionalProgramIds: (course.programs ?? []).filter((item) => !item.principal).map((item) => item.programId),
      planId: String(course.planId),
    });
  };

  const saveEdit = async () => {
    if (
      !editing ||
      !editForm.courseName.trim() ||
      !editForm.courseCode.trim() ||
      !editForm.programId ||
      !editForm.planId ||
      Number(editForm.credits) < 1
    ) {
      setError("Completa el nombre, el código, el programa, el plan y los créditos.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.updateCourse(editing.courseId, {
        courseName: editForm.courseName.trim(),
        courseCode: editForm.courseCode.trim().toUpperCase(),
        description: editForm.description.trim(),
        credits: Number(editForm.credits),
        programId: Number(editForm.programId),
        additionalProgramIds: editForm.additionalProgramIds,
        planId: Number(editForm.planId),
      });
      setEditing(null);
      await load();
    } catch (reason) {
      setError(errorMessage(reason, "No se pudo editar el curso"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    setError("");
    try {
      await repositoryService.deleteCourse(deleting.courseId);
      setDeleting(null);
      await load();
    } catch (reason) {
      setError(errorMessage(reason, "No se pudo eliminar el curso"));
      setDeleting(null);
    } finally {
      setDeletePending(false);
    }
  };

  const courseFields = (
    values: typeof emptyForm,
    update: (values: typeof emptyForm) => void,
    currentPlanId?: number,
  ) => (
    <>
      <label className="repo-form-field repo-form-field--wide">
        <span>Nombre del curso</span>
        <input
          value={values.courseName}
          onChange={(event) => update({ ...values, courseName: event.target.value })}
        />
      </label>
      <div className="repo-form-row">
        <label className="repo-form-field">
          <span>Código</span>
          <input
            value={values.courseCode}
            onChange={(event) => update({ ...values, courseCode: event.target.value })}
            placeholder={creating ? "Se genera si lo dejas vacío" : undefined}
          />
        </label>
        <label className="repo-form-field">
          <span>Créditos</span>
          <input
            type="number"
            min="1"
            max="10"
            value={values.credits}
            onChange={(event) => update({ ...values, credits: event.target.value })}
          />
        </label>
      </div>
      <div className="repo-form-row">
        <label className="repo-form-field">
          <span>Tipo de programa</span>
          <select
            value={values.academicLevel}
            onChange={(event) =>
              update({
                ...values,
                academicLevel: event.target.value as AcademicLevel,
                programId: "",
              })
            }
          >
            <option value="">Todos</option>
            <option value="UNDERGRADUATE">Pregrado</option>
            <option value="POSTGRADUATE">Posgrado</option>
          </select>
        </label>
        <label className="repo-form-field">
          <span>Programa</span>
          <select
            value={values.programId}
            onChange={(event) => update({ ...values, programId: event.target.value })}
          >
            <option value="">Seleccionar</option>
            {programsFor(values.academicLevel).map((program) => (
              <option key={program.programId} value={program.programId}>
                {program.programName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="repo-form-field repo-form-field--wide repo-program-checks">
        <legend>Programas adicionales</legend>
        <small>Solo si el mismo curso se dicta a la vez para otras escuelas o programas.</small>
        <div>
          {programs
            .filter((program) => String(program.programId) !== values.programId)
            .map((program) => (
              <label key={program.programId}>
                <input
                  type="checkbox"
                  checked={values.additionalProgramIds.includes(program.programId)}
                  onChange={(event) =>
                    update({
                      ...values,
                      additionalProgramIds: event.target.checked
                        ? [...values.additionalProgramIds, program.programId]
                        : values.additionalProgramIds.filter((id) => id !== program.programId),
                    })
                  }
                />
                {program.programName}
              </label>
            ))}
        </div>
      </fieldset>
      <label className="repo-form-field">
        <span>Plan curricular</span>
        <select
          value={values.planId}
          onChange={(event) => update({ ...values, planId: event.target.value })}
        >
          <option value="">Seleccionar</option>
          {plans
            .filter((plan) => plan.isActive || plan.planId === currentPlanId)
            .map((plan) => (
              <option key={plan.planId} value={plan.planId}>
                {plan.planCode}
                {plan.isActive ? "" : " — Inactivo"}
              </option>
            ))}
        </select>
      </label>
      <label className="repo-form-field repo-form-field--wide">
        <span>Descripción del curso</span>
        <textarea
          rows={4}
          maxLength={2000}
          value={values.description}
          onChange={(event) => update({ ...values, description: event.target.value })}
        />
      </label>
    </>
  );

  if (creating) {
    return (
      <div className="repo-maint-content">
        <button type="button" className="repo-back-button" onClick={() => setCreating(false)}>
          ‹ Volver a cursos
        </button>
        <div className="repo-section-heading">
          <h2>Agregar curso</h2>
          <div className="repo-table-actions">
            <button
              type="button"
              className="repo-outline-button"
              onClick={() => void create(false)}
              disabled={saving}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              className="repo-outline-button"
              onClick={() => void create(true)}
              disabled={saving}
            >
              Guardar y crear oferta
            </button>
          </div>
        </div>
        {error && <div className="repo-alert repo-alert--error">{error}</div>}
        <p className="repo-form-hint">
          Un curso es la asignatura del plan de estudios. Para dictarlo en un semestre, crea
          después una oferta suya.
        </p>
        <div className="repo-maint-form">{courseFields(form, setForm)}</div>
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
          onClick={() => {
            setError("");
            setCreating(true);
          }}
        >
          <Plus /> Agregar curso
        </button>
      </div>
      {error && <div className="repo-alert repo-alert--error">{error}</div>}
      <div className="repo-table-filters">
        <label className="repo-search-field">
          <input
            value={search}
            onChange={(event) => filterSetter(setSearch)(event.target.value)}
            placeholder="Buscar por nombre o código"
          />
          <Search />
        </label>
        <label className="repo-select-field">
          <span>Tipo de programa</span>
          <select
            value={levelFilter}
            onChange={(event) => {
              filterSetter(setLevelFilter)(event.target.value);
              setProgramFilter("");
            }}
          >
            <option value="">Todos</option>
            <option value="UNDERGRADUATE">Pregrado</option>
            <option value="POSTGRADUATE">Posgrado</option>
          </select>
        </label>
        <label className="repo-select-field">
          <span>Programa</span>
          <select
            value={programFilter}
            onChange={(event) => filterSetter(setProgramFilter)(event.target.value)}
          >
            <option value="">Todos</option>
            {programsFor(levelFilter).map((program) => (
              <option key={program.programId} value={program.programId}>
                {program.programName}
              </option>
            ))}
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
      </div>
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Curso</th>
              <th>Programa</th>
              <th>Plan</th>
              <th>Créditos</th>
              <th>Ofertas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Cargando…</td>
              </tr>
            ) : courses.length ? (
              courses.map((course) => (
                <tr key={course.courseId}>
                  <td>
                    {course.courseName}
                    <span className="repo-table-sub">{course.courseCode}</span>
                  </td>
                  <td title={course.programs?.map((program) => program.programName).join(", ")}>
                    {course.programName}
                    {(course.programs?.length ?? 0) > 1 && (
                      <span className="repo-table-sub">+{course.programs.length - 1} programas</span>
                    )}
                  </td>
                  <td>{course.planCode}</td>
                  <td>{course.credits}</td>
                  <td>
                    {course.offeringCount ? (
                      <button
                        type="button"
                        className="repo-link-button"
                        onClick={() => onShowOfferings(course)}
                      >
                        {offeringsLabel(course.offeringCount)}
                      </button>
                    ) : (
                      <span className="repo-table-sub">Sin ofertas</span>
                    )}
                  </td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => onCreateOffering(course)}
                      >
                        <CalendarPlus /> Nueva oferta
                      </button>
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => openEditor(course)}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeleting(course)}
                        disabled={course.offeringCount > 0}
                        title={
                          course.offeringCount > 0
                            ? "Primero elimina sus ofertas"
                            : undefined
                        }
                      >
                        <Trash2 /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>No hay cursos para mostrar.</td>
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
        label="cursos"
      />
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>Editar curso</DialogTitle>
            <DialogDescription>
              {editing?.offeringCount
                ? `Los cambios se aplican a sus ${offeringsLabel(editing.offeringCount)}.`
                : "Datos de la asignatura; todavía no tiene ofertas."}
            </DialogDescription>
          </DialogHeader>
          {courseFields(editForm, setEditForm, editing?.planId)}
          {error && <div className="repo-alert repo-alert--error">{error}</div>}
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveEdit()}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar curso"
        description={`Se eliminará el curso “${deleting?.courseName || ""}”. No tiene ofertas.`}
        pending={deletePending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
