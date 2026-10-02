import { Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  repositoryService,
  type BlockConfigurationItem,
  type CourseBlockConfiguration,
  type Enrollment,
  type Offering,
  type Teacher,
} from "@/services/repositoryService";

interface BlockDraft {
  name: string;
  maxCapacity: string;
  teacherId: string;
}

export function CourseBlocksManagement() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courseOfferingId, setCourseOfferingId] = useState("");
  const [configuration, setConfiguration] =
    useState<CourseBlockConfiguration>();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [principalTeacherId, setPrincipalTeacherId] = useState("");
  const [blockDrafts, setBlockDrafts] = useState<Record<number, BlockDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [deletingBlock, setDeletingBlock] =
    useState<BlockConfigurationItem | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [offeringData, teacherData] = await Promise.all([
        repositoryService.getOfferings(),
        repositoryService.getTeachers(),
      ]);
      setOfferings(offeringData.offerings);
      setTeachers(teacherData.users);
      setCourseOfferingId((current) =>
        current || String(offeringData.offerings[0]?.offeringId || ""),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo cargar la configuración de cursos",
      );
    } finally {
      setLoading(false);
    }
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
        repositoryService.getEnrollments({
          courseOfferingId: Number(courseOfferingId),
        }),
      ]);
      setConfiguration(configurationData);
      setEnrollments(
        enrollmentData.enrollments.filter(
          (enrollment) => enrollment.status === "ACTIVE",
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo cargar la configuración del curso",
      );
    } finally {
      setLoading(false);
    }
  }, [courseOfferingId]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    void loadConfiguration();
  }, [loadConfiguration]);

  useEffect(() => {
    if (!configuration) return;
    setPrincipalTeacherId(String(configuration.principalTeacherId || ""));
    setBlockDrafts(
      Object.fromEntries(
        configuration.blocks.map((block) => [
          block.blockId,
          {
            name: block.name,
            maxCapacity: String(block.maxCapacity),
            teacherId: String(block.teacherId || ""),
          },
        ]),
      ),
    );
  }, [configuration]);

  const theoryBlock = configuration?.blocks.find(
    (block) => block.blockType === "THEORY",
  );
  const practiceBlocks = useMemo(
    () =>
      configuration?.blocks.filter((block) => block.blockType === "PRACTICE") ||
      [],
    [configuration],
  );

  const savePrincipal = async () => {
    if (!configuration || !principalTeacherId) return;
    setSavingKey("principal");
    setError("");
    try {
      setConfiguration(
        await repositoryService.assignPrincipalTeacher(
          configuration.courseOfferingId,
          Number(principalTeacherId),
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo asignar al docente principal",
      );
    } finally {
      setSavingKey("");
    }
  };

  const addPracticeBlock = async () => {
    if (!configuration) return;
    setSavingKey("new-block");
    setError("");
    try {
      setConfiguration(
        await repositoryService.createPracticeBlock({
          courseOfferingId: configuration.courseOfferingId,
          maxCapacity: 25,
        }),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo agregar el bloque de práctica",
      );
    } finally {
      setSavingKey("");
    }
  };

  const savePracticeBlock = async (block: BlockConfigurationItem) => {
    const draft = blockDrafts[block.blockId];
    if (!draft?.name.trim() || Number(draft.maxCapacity) < 1) return;
    setSavingKey(`block-${block.blockId}`);
    setError("");
    try {
      setConfiguration(
        await repositoryService.updatePracticeBlock(block.blockId, {
          name: draft.name.trim(),
          maxCapacity: Number(draft.maxCapacity),
          teacherId: draft.teacherId ? Number(draft.teacherId) : null,
        }),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo guardar el bloque de práctica",
      );
    } finally {
      setSavingKey("");
    }
  };

  const confirmDeleteBlock = async () => {
    if (!deletingBlock) return;
    setSavingKey(`delete-${deletingBlock.blockId}`);
    setError("");
    try {
      setConfiguration(
        await repositoryService.deletePracticeBlock(deletingBlock.blockId),
      );
      setDeletingBlock(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar el bloque de práctica",
      );
    } finally {
      setSavingKey("");
    }
  };

  const assignStudent = async (enrollment: Enrollment, value: string) => {
    setSavingKey(`student-${enrollment.enrollmentId}`);
    setError("");
    try {
      await repositoryService.assignEnrollmentPracticeBlock(
        enrollment.enrollmentId,
        value ? Number(value) : null,
      );
      await loadConfiguration();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo asignar el bloque al alumno",
      );
    } finally {
      setSavingKey("");
    }
  };

  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading repo-blocks-heading">
        <div>
          <h2>Bloques y responsables</h2>
          <p>Configura docentes y distribuye alumnos en los grupos de práctica.</p>
        </div>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => void addPracticeBlock()}
          disabled={
            !configuration ||
            practiceBlocks.length >= 3 ||
            savingKey === "new-block"
          }
        >
          <Plus /> Agregar práctica
        </button>
      </div>

      {error && <div className="repo-alert repo-alert--error">{error}</div>}

      <label className="repo-select-field repo-course-config-select">
        <span>Curso y semestre</span>
        <select
          value={courseOfferingId}
          onChange={(event) => setCourseOfferingId(event.target.value)}
        >
          {offerings.map((offering) => (
            <option key={offering.offeringId} value={offering.offeringId}>
              {offering.courseName} ({offering.courseCode}) — {offering.semesterName}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <div className="repo-page-state">
          <span className="repo-spinner" /> Cargando configuración…
        </div>
      ) : !configuration ? (
        <div className="repo-empty">No hay cursos para configurar.</div>
      ) : (
        <>
          <section className="repo-config-section">
            <div className="repo-config-section__heading">
              <div>
                <h3>Docente principal</h3>
                <p>
                  Administra Teoría y todos los bloques de práctica del curso.
                </p>
              </div>
            </div>
            <div className="repo-inline-assignment">
              <label className="repo-form-field">
                <span>Responsable principal</span>
                <select
                  value={principalTeacherId}
                  onChange={(event) => setPrincipalTeacherId(event.target.value)}
                >
                  <option value="">Seleccionar docente</option>
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
                onClick={() => void savePrincipal()}
                disabled={!principalTeacherId || savingKey === "principal"}
              >
                <Save /> Guardar responsable
              </button>
            </div>
          </section>

          <section className="repo-config-section">
            <div className="repo-config-section__heading">
              <div>
                <h3>Bloques del curso</h3>
                <p>
                  Teoría es común a todos. Cada práctica admite un responsable y una
                  capacidad propia.
                </p>
              </div>
            </div>
            <div className="repo-block-config-grid">
              {theoryBlock && (
                <article className="repo-block-config-card repo-block-config-card--theory">
                  <div className="repo-block-config-card__title">
                    <div>
                      <span>Bloque común</span>
                      <h4>{theoryBlock.name}</h4>
                    </div>
                    <span className="repo-status repo-status--active">Todos</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Responsable</dt>
                      <dd>{configuration.principalTeacherName || "Por asignar"}</dd>
                    </div>
                    <div>
                      <dt>Acceso de alumnos</dt>
                      <dd>{enrollments.length} matriculados</dd>
                    </div>
                  </dl>
                </article>
              )}
              {practiceBlocks.map((block) => {
                const draft = blockDrafts[block.blockId];
                if (!draft) return null;
                return (
                  <article className="repo-block-config-card" key={block.blockId}>
                    <div className="repo-block-config-card__title">
                      <div>
                        <span>Grupo de práctica</span>
                        <h4>{block.name}</h4>
                      </div>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeletingBlock(block)}
                      >
                        <Trash2 /> Eliminar
                      </button>
                    </div>
                    <label className="repo-form-field">
                      <span>Nombre</span>
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          setBlockDrafts({
                            ...blockDrafts,
                            [block.blockId]: { ...draft, name: event.target.value },
                          })
                        }
                      />
                    </label>
                    <label className="repo-form-field">
                      <span>Docente responsable</span>
                      <select
                        value={draft.teacherId}
                        onChange={(event) =>
                          setBlockDrafts({
                            ...blockDrafts,
                            [block.blockId]: {
                              ...draft,
                              teacherId: event.target.value,
                            },
                          })
                        }
                      >
                        <option value="">Por asignar</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.userId} value={teacher.userId}>
                            {teacher.fullName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="repo-form-field">
                      <span>Capacidad máxima</span>
                      <input
                        type="number"
                        min={Math.max(1, block.assignedStudentCount)}
                        max={500}
                        value={draft.maxCapacity}
                        onChange={(event) =>
                          setBlockDrafts({
                            ...blockDrafts,
                            [block.blockId]: {
                              ...draft,
                              maxCapacity: event.target.value,
                            },
                          })
                        }
                      />
                      <small>{block.assignedStudentCount} alumnos asignados</small>
                    </label>
                    <button
                      type="button"
                      className="repo-outline-button"
                      onClick={() => void savePracticeBlock(block)}
                      disabled={savingKey === `block-${block.blockId}`}
                    >
                      <Save /> Guardar bloque
                    </button>
                  </article>
                );
              })}
            </div>
            {practiceBlocks.length === 0 && (
              <p className="repo-muted-message">
                Este curso todavía no tiene bloques de práctica.
              </p>
            )}
          </section>

          <section className="repo-config-section">
            <div className="repo-config-section__heading">
              <div>
                <h3>Distribución de alumnos</h3>
                <p>
                  Cada alumno accede a Teoría y únicamente a la práctica asignada.
                </p>
              </div>
            </div>
            <div className="repo-data-table-wrap">
              <table className="repo-data-table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Código</th>
                    <th>Bloque de práctica</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="repo-empty">
                        No hay alumnos matriculados en este curso.
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
                            aria-label={`Bloque práctico de ${enrollment.studentName}`}
                            value={enrollment.practiceBlockId || ""}
                            onChange={(event) =>
                              void assignStudent(enrollment, event.target.value)
                            }
                            disabled={
                              savingKey === `student-${enrollment.enrollmentId}`
                            }
                          >
                            <option value="">Sin práctica asignada</option>
                            {practiceBlocks.map((block) => (
                              <option
                                key={block.blockId}
                                value={block.blockId}
                                disabled={
                                  block.assignedStudentCount >= block.maxCapacity &&
                                  enrollment.practiceBlockId !== block.blockId
                                }
                              >
                                {block.name} ({block.assignedStudentCount}/
                                {block.maxCapacity})
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

      <ConfirmDialog
        open={!!deletingBlock}
        onOpenChange={(open) => !open && setDeletingBlock(null)}
        title="Eliminar bloque de práctica"
        description={`Se eliminará “${deletingBlock?.name || ""}”. Solo es posible si no tiene alumnos, semanas ni materiales.`}
        pending={savingKey.startsWith("delete-")}
        onConfirm={confirmDeleteBlock}
      />
    </div>
  );
}
