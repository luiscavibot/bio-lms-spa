import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OfferingPicker } from "@/components/maintenance/OfferingPicker";
import { BLOCK_TYPE_LABEL, BLOCK_TYPES, blockSummary } from "@/lib/blocks";
import {
  repositoryService,
  type BlockConfigurationItem,
  type BlockType,
  type CourseBlockConfiguration,
  type Enrollment,
  type Teacher,
} from "@/services/repositoryService";

interface BlockForm {
  blockType: BlockType;
  name: string;
  section: string;
  maxCapacity: string;
  teacherIds: number[];
}

const emptyForm: BlockForm = {
  blockType: "THEORY",
  name: "",
  section: "",
  maxCapacity: "50",
  teacherIds: [],
};

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

/** Chooses several teachers by typing part of their name. */
function TeacherMultiPicker({
  teachers,
  value,
  onChange,
}: {
  teachers: Teacher[];
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  const [query, setQuery] = useState("");
  const chosen = teachers.filter((teacher) => value.includes(teacher.userId));
  const text = query.trim().toLowerCase();
  const options = text
    ? teachers
        .filter((teacher) => !value.includes(teacher.userId))
        .filter((teacher) => teacher.fullName.toLowerCase().includes(text))
        .slice(0, 8)
    : [];
  return (
    <div className="repo-search-picker repo-form-field--wide">
      <span className="repo-search-picker__label">Responsables</span>
      {chosen.length > 0 && (
        <div className="repo-chip-list">
          {chosen.map((teacher) => (
            <span className="repo-filter-chip" key={teacher.userId}>
              {teacher.fullName}
              <button
                type="button"
                aria-label={`Quitar a ${teacher.fullName}`}
                onClick={() => onChange(value.filter((id) => id !== teacher.userId))}
              >
                <X size={16} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="repo-search-picker__inputs">
        <input
          type="search"
          aria-label="Buscar docente"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar docente para agregar"
        />
      </div>
      {text && (
        <ul className="repo-search-picker__results">
          {options.length === 0 ? (
            <li className="repo-search-picker__note">Ningún docente coincide con «{query.trim()}».</li>
          ) : (
            options.map((teacher) => (
              <li key={teacher.userId}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([...value, teacher.userId]);
                    setQuery("");
                  }}
                >
                  <strong>{teacher.fullName}</strong>
                  {teacher.email && <small>{teacher.email}</small>}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {!chosen.length && !text && <small>Sin responsables: se mostrarán los autores de sus materiales.</small>}
    </div>
  );
}

/**
 * Bloques del curso dictado: any number of theory, practice and seminar blocks, grouped by
 * section, each with its responsible teachers; and the coordinator of the course.
 */
export function CourseBlocksManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courseOfferingId, setCourseOfferingId] = useState("");
  const [configuration, setConfiguration] = useState<CourseBlockConfiguration>();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [coordinatorId, setCoordinatorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<BlockConfigurationItem | "new" | null>(null);
  const [form, setForm] = useState<BlockForm>(emptyForm);
  const [deleting, setDeleting] = useState<BlockConfigurationItem | null>(null);

  useEffect(() => {
    repositoryService
      .getTeachers()
      .then((data) => setTeachers(data.users))
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const loadConfiguration = useCallback(async () => {
    if (!courseOfferingId) {
      setConfiguration(undefined);
      setEnrollments([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [configurationData, enrollmentData] = await Promise.all([
        repositoryService.getBlockConfiguration(Number(courseOfferingId)),
        repositoryService.getEnrollments({ courseOfferingId: Number(courseOfferingId) }),
      ]);
      setConfiguration(configurationData);
      setEnrollments(enrollmentData.enrollments.filter((enrollment) => enrollment.status === "ACTIVE"));
    } catch (reason) {
      setError(errorMessage(reason, "No se pudo cargar la configuración del curso dictado"));
    } finally {
      setLoading(false);
    }
  }, [courseOfferingId]);

  useEffect(() => {
    void loadConfiguration();
  }, [loadConfiguration]);

  useEffect(() => {
    setCoordinatorId(String(configuration?.principalTeacherId || ""));
  }, [configuration]);

  // Blocks grouped by section; blocks without a section first.
  const sections = useMemo(() => {
    const groups = new Map<string, BlockConfigurationItem[]>();
    for (const block of configuration?.blocks ?? []) {
      const key = block.section ?? "";
      groups.set(key, [...(groups.get(key) ?? []), block]);
    }
    return [...groups.entries()].sort(([a], [b]) =>
      a.localeCompare(b, "es", { numeric: true }),
    );
  }, [configuration]);
  const assignable = (configuration?.blocks ?? []).filter((block) => block.blockType !== "THEORY");

  const run = async (key: string, action: () => Promise<CourseBlockConfiguration>, fallback: string) => {
    setSavingKey(key);
    setError("");
    try {
      setConfiguration(await action());
      return true;
    } catch (reason) {
      setError(errorMessage(reason, fallback));
      return false;
    } finally {
      setSavingKey("");
    }
  };

  const saveCoordinator = (teacherId: number | null) => {
    if (!configuration) return;
    void run(
      "coordinator",
      () => repositoryService.assignPrincipalTeacher(configuration.courseOfferingId, teacherId),
      "No se pudo guardar el coordinador",
    );
  };

  const openForm = (block: BlockConfigurationItem | "new") => {
    setError("");
    setEditing(block);
    setForm(
      block === "new"
        ? emptyForm
        : {
            blockType: block.blockType,
            name: block.name,
            section: block.section ?? "",
            maxCapacity: String(block.maxCapacity),
            teacherIds: block.teachers.map((teacher) => teacher.teacherId),
          },
    );
  };

  const saveForm = async () => {
    if (!configuration || !editing) return;
    if (Number(form.maxCapacity) < 1) {
      setError("La capacidad debe ser mayor que cero.");
      return;
    }
    const fields = {
      blockType: form.blockType,
      name: form.name.trim(),
      section: form.section.trim() || null,
      maxCapacity: Number(form.maxCapacity),
      teacherIds: form.teacherIds,
    };
    const saved = await run(
      "form",
      () =>
        editing === "new"
          ? repositoryService.createBlock(configuration.courseOfferingId, fields)
          : repositoryService.updateBlock(editing.blockId, fields),
      "No se pudo guardar el bloque",
    );
    if (saved) setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await run(`delete-${deleting.blockId}`, () => repositoryService.deleteBlock(deleting.blockId), "No se pudo eliminar el bloque");
    setDeleting(null);
  };

  const assignStudent = async (enrollment: Enrollment, value: string) => {
    setSavingKey(`student-${enrollment.enrollmentId}`);
    setError("");
    try {
      await repositoryService.assignEnrollmentPracticeBlock(enrollment.enrollmentId, value ? Number(value) : null);
      await loadConfiguration();
    } catch (reason) {
      setError(errorMessage(reason, "No se pudo asignar el bloque al alumno"));
    } finally {
      setSavingKey("");
    }
  };

  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading repo-blocks-heading">
        <div>
          <h2>Bloques y responsables</h2>
          <p>Teorías, prácticas y seminarios de cada curso dictado, por sección.</p>
        </div>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => openForm("new")}
          disabled={!configuration}
        >
          <Plus /> Agregar bloque
        </button>
      </div>

      {error && !editing && <div className="repo-alert repo-alert--error">{error}</div>}

      <OfferingPicker className="repo-course-config-select" value={courseOfferingId} onChange={setCourseOfferingId} />

      {loading ? (
        <div className="repo-page-state">
          <span className="repo-spinner" /> Cargando configuración…
        </div>
      ) : !configuration ? (
        <div className="repo-empty">Elige un curso dictado para configurar sus bloques.</div>
      ) : (
        <>
          <section className="repo-config-section">
            <div className="repo-config-section__heading">
              <div>
                <h3>Coordinador</h3>
                <p>Opcional. Administra todos los bloques del curso dictado.</p>
              </div>
            </div>
            <div className="repo-inline-assignment">
              <label className="repo-form-field">
                <span>Docente coordinador</span>
                <select value={coordinatorId} onChange={(event) => setCoordinatorId(event.target.value)}>
                  <option value="">Sin coordinador</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.userId} value={teacher.userId}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="repo-outline-button"
                onClick={() => saveCoordinator(coordinatorId ? Number(coordinatorId) : null)}
                disabled={savingKey === "coordinator" || coordinatorId === String(configuration.principalTeacherId || "")}
              >
                <Save /> Guardar
              </button>
            </div>
          </section>

          <section className="repo-config-section">
            <div className="repo-config-section__heading">
              <div>
                <h3>Bloques</h3>
                <p>
                  {blockSummary(configuration.blocks) || "Sin bloques"}. Un bloque con alumnos o materiales no se puede
                  eliminar.
                </p>
              </div>
            </div>
            {sections.map(([section, blocks]) => (
              <div className="repo-block-section" key={section || "sin-seccion"}>
                {sections.length > 1 && <h4>{section ? `Sección ${section}` : "Sin sección"}</h4>}
                <div className="repo-data-table-wrap">
                  <table className="repo-data-table">
                    <thead>
                      <tr>
                        <th>Bloque</th>
                        <th>Responsables</th>
                        <th>Capacidad</th>
                        <th>Alumnos</th>
                        <th>Materiales</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map((block) => {
                        const locked = block.assignedStudentCount > 0 || block.materialCount > 0;
                        return (
                          <tr key={block.blockId}>
                            <td>
                              {block.displayName}
                              <span className="repo-table-sub">{BLOCK_TYPE_LABEL[block.blockType]}</span>
                            </td>
                            <td>
                              {block.teachers.length ? (
                                block.teachers.map((teacher) => teacher.name).join(", ")
                              ) : (
                                <span className="repo-table-sub">—</span>
                              )}
                            </td>
                            <td>{block.maxCapacity}</td>
                            <td>{block.assignedStudentCount}</td>
                            <td>{block.materialCount}</td>
                            <td>
                              <div className="repo-table-actions">
                                <button type="button" className="repo-table-action" onClick={() => openForm(block)}>
                                  <Pencil /> Editar
                                </button>
                                <button
                                  type="button"
                                  className="repo-table-action repo-table-action--danger"
                                  onClick={() => setDeleting(block)}
                                  disabled={locked || configuration.blocks.length <= 1}
                                  title={
                                    locked
                                      ? "Tiene alumnos o materiales"
                                      : configuration.blocks.length <= 1
                                        ? "El curso dictado necesita al menos un bloque"
                                        : undefined
                                  }
                                >
                                  <Trash2 /> Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>

          <section className="repo-config-section">
            <div className="repo-config-section__heading">
              <div>
                <h3>Distribución de alumnos</h3>
                <p>Cada alumno ve todas las teorías y solo la práctica o el seminario que se le asigne.</p>
              </div>
            </div>
            <div className="repo-data-table-wrap">
              <table className="repo-data-table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Código</th>
                    <th>Práctica o seminario</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="repo-empty">
                        No hay alumnos matriculados en este curso dictado.
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((enrollment) => (
                      <tr key={enrollment.enrollmentId}>
                        <td>{enrollment.studentName}</td>
                        <td>{enrollment.studentCode}</td>
                        <td>
                          <select
                            className="repo-table-select"
                            aria-label={`Bloque de ${enrollment.studentName}`}
                            value={enrollment.practiceBlockId || ""}
                            onChange={(event) => void assignStudent(enrollment, event.target.value)}
                            disabled={savingKey === `student-${enrollment.enrollmentId}`}
                          >
                            <option value="">Sin asignar</option>
                            {assignable.map((block) => (
                              <option
                                key={block.blockId}
                                value={block.blockId}
                                disabled={
                                  block.assignedStudentCount >= block.maxCapacity &&
                                  enrollment.practiceBlockId !== block.blockId
                                }
                              >
                                {block.displayName} ({block.assignedStudentCount}/{block.maxCapacity})
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Agregar bloque" : "Editar bloque"}</DialogTitle>
            <DialogDescription>
              El nombre visible se arma con el tipo, el grupo y la sección: «Práctica G1 · Sección 2».
            </DialogDescription>
          </DialogHeader>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Tipo</span>
              <select
                value={form.blockType}
                onChange={(event) => {
                  const blockType = event.target.value as BlockType;
                  setForm({
                    ...form,
                    blockType,
                    maxCapacity: editing === "new" ? (blockType === "THEORY" ? "50" : "25") : form.maxCapacity,
                  });
                }}
              >
                {BLOCK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {BLOCK_TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="repo-form-field">
              <span>Sección</span>
              <input
                value={form.section}
                onChange={(event) => setForm({ ...form, section: event.target.value })}
                placeholder="Opcional: 1, 2…"
              />
            </label>
          </div>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Grupo</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="G1, 2, Laboratorio 3…"
              />
            </label>
            <label className="repo-form-field">
              <span>Capacidad</span>
              <input
                type="number"
                min={1}
                max={500}
                value={form.maxCapacity}
                onChange={(event) => setForm({ ...form, maxCapacity: event.target.value })}
              />
            </label>
          </div>
          <TeacherMultiPicker
            teachers={teachers}
            value={form.teacherIds}
            onChange={(teacherIds) => setForm({ ...form, teacherIds })}
          />
          {error && <div className="repo-alert repo-alert--error">{error}</div>}
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveForm()}
            disabled={savingKey === "form"}
          >
            {savingKey === "form" ? "Guardando…" : editing === "new" ? "Agregar bloque" : "Guardar cambios"}
          </button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar bloque"
        description={`Se eliminará «${deleting?.displayName || ""}» con sus semanas vacías.`}
        pending={savingKey.startsWith("delete-")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
