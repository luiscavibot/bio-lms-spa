import { FileText, FileUp, LockKeyhole, Pencil, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  repositoryService,
  type Material,
  type MaterialCategory,
  type LinkMaterialSubtype,
  type Offering,
  type UploadableMaterialCategory,
  type Week,
} from "@/services/repositoryService";
import { authorsLine } from "@/lib/authors";
import { BlockNavigator } from "@/components/BlockNavigator";

const materialLabels: Record<MaterialCategory, string> = {
  EXTERNAL_LINK: "Enlace externo",
  CLASS_SLIDES: "Material de teoría",
  PRACTICE_FILE: "Material de práctica",
  ASSIGNMENT_FILE: "Guía de tarea",
  ANNOUNCEMENT_FILE: "Adjunto de anuncio",
};

/** Categories offered when a material is added by hand. */
const creatableCategories: (UploadableMaterialCategory | "EXTERNAL_LINK")[] = [
  "CLASS_SLIDES",
  "PRACTICE_FILE",
  "EXTERNAL_LINK",
];

function formatSize(bytes?: number) {
  if (!bytes) return "";
  const value = Number(bytes);
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function materialAuthor(material: Material) {
  const uploader = material.uploadedBy
    ? `${material.uploadedBy.firstName} ${material.uploadedBy.lastName}`.trim()
    : "";
  if (uploader) return `Subido por ${uploader}`;
  if (material.authorName) return `Publicado por ${material.authorName}`;
  return "Subido por Repositorio";
}


const linkSubtypeLabels: Record<LinkMaterialSubtype, string> = {
  VIDEO: "Video",
  ARTICLE: "Artículo",
  THESIS: "Tesis",
  WEBSITE: "Sitio web",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(value))
    .replace(".", "");
}

/** An offering is current while its status is not closed and today falls within its dates. */
function isCurrentOffering(offering: Offering) {
  if (offering.status === "COMPLETED" || offering.status === "CANCELLED") return false;
  const today = new Date().toISOString().slice(0, 10);
  return offering.startDate.slice(0, 10) <= today && today <= offering.endDate.slice(0, 10);
}

function formatWeekDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
    .replace(".", "");
}

function NewMaterialDialog({
  weekId,
  open,
  onOpenChange,
  onCreated,
}: {
  weekId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [category, setCategory] = useState<
    UploadableMaterialCategory | "EXTERNAL_LINK" | ""
  >("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [linkSubtype, setLinkSubtype] = useState<LinkMaterialSubtype | "">("");
  const [file, setFile] = useState<File>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setCategory("");
      setTitle("");
      setDescription("");
      setUrl("");
      setLinkSubtype("");
      setFile(undefined);
      setError("");
    }
  }, [open]);

  const save = async () => {
    if (!weekId || !category || !title.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (category === "EXTERNAL_LINK") {
        if (!url.trim()) throw new Error("Ingresa la dirección del enlace");
        if (!linkSubtype) throw new Error("Selecciona el tipo de enlace");
        await repositoryService.createLink({
          weekId,
          title: title.trim(),
          externalLinkUrl: url.trim(),
          linkSubtype,
          description: description.trim() || undefined,
        });
      } else {
        if (!file) throw new Error("Selecciona un archivo");
        await repositoryService.uploadMaterial({
          weekId,
          title: title.trim(),
          materialCategory: category,
          file,
          description: description.trim() || undefined,
        });
      }
      onOpenChange(false);
      onCreated();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo guardar el material",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="repo-material-dialog">
        <DialogHeader>
          <DialogTitle>Nuevo material</DialogTitle>
          <DialogDescription>
            Selecciona el tipo y completa la información del material.
          </DialogDescription>
        </DialogHeader>
        <label className="repo-form-field">
          <span>Tipo de material</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value as UploadableMaterialCategory | "EXTERNAL_LINK",
              )
            }
          >
            <option value="">Seleccionar</option>
            {creatableCategories.map((value) => (
              <option key={value} value={value}>
                {materialLabels[value]}
              </option>
            ))}
          </select>
        </label>
        {category && (
          <label className="repo-form-field">
            <span>Título del material</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. Clase 05: Investigación científica"
            />
          </label>
        )}
        {category && (
          <label className="repo-form-field">
            <span>Descripción (opcional)</span>
            <textarea
              rows={3}
              maxLength={5000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        )}
        {category === "EXTERNAL_LINK" && (
          <>
            <label className="repo-form-field">
              <span>Subetiqueta del enlace</span>
              <select
                value={linkSubtype}
                onChange={(event) =>
                  setLinkSubtype(event.target.value as LinkMaterialSubtype)
                }
              >
                <option value="">Seleccionar</option>
                {Object.entries(linkSubtypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="repo-form-field">
              <span>Dirección web</span>
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://…"
              />
            </label>
          </>
        )}
        {category && category !== "EXTERNAL_LINK" && (
          <div>
            <p className="repo-upload-label">Cargar archivo</p>
            <label className="repo-dropzone">
              <UploadCloud aria-hidden="true" />
              <strong>
                {file ? file.name : "Arrastra aquí o selecciona un archivo"}
              </strong>
              <span>
                PDF, PPT/PPTX, DOC/DOCX, XLS/XLSX, imágenes o video (máx. 25 MB)
              </span>
              <input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0])}
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.mp4"
              />
            </label>
          </div>
        )}
        {error && <div className="repo-alert repo-alert--error">{error}</div>}
        <button
          type="button"
          className="repo-primary-button repo-material-submit"
          onClick={save}
          disabled={
            saving ||
            !category ||
            !title.trim() ||
            (category === "EXTERNAL_LINK"
              ? !url.trim() || !linkSubtype
              : !file)
          }
        >
          {saving ? "Subiendo…" : "Subir material"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

function EditMaterialDialog({
  material,
  onOpenChange,
  onSaved,
}: {
  material: Material | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [linkSubtype, setLinkSubtype] = useState<LinkMaterialSubtype>("WEBSITE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(material?.title || "");
    setDescription(material?.description || "");
    setUrl(material?.externalLinkUrl || "");
    setLinkSubtype(material?.linkSubtype || "WEBSITE");
    setError("");
  }, [material]);

  const save = async () => {
    if (!material || !title.trim()) return;
    setSaving(true);
    try {
      await repositoryService.updateMaterial(material.id, {
        title: title.trim(),
        description: description.trim(),
        ...(material.materialType === "LINK"
          ? { externalLinkUrl: url.trim(), linkSubtype }
          : {}),
      });
      onOpenChange(false);
      onSaved();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo editar el material",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!material} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar material</DialogTitle>
          <DialogDescription>
            Actualiza la información visible del recurso.
          </DialogDescription>
        </DialogHeader>
        <label className="repo-form-field">
          <span>Título</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="repo-form-field">
          <span>Descripción</span>
          <textarea
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        {material?.materialType === "LINK" && (
          <>
            <label className="repo-form-field">
              <span>Subetiqueta del enlace</span>
              <select
                value={linkSubtype}
                onChange={(event) =>
                  setLinkSubtype(event.target.value as LinkMaterialSubtype)
                }
              >
                {Object.entries(linkSubtypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="repo-form-field">
              <span>Dirección web</span>
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </label>
          </>
        )}
        {error && <div className="repo-alert repo-alert--error">{error}</div>}
        <button
          type="button"
          className="repo-primary-button"
          onClick={save}
          disabled={saving || !title.trim()}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

function EditWeekDialog({
  week,
  onOpenChange,
  onSaved,
}: {
  week: Week | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [topicSummary, setTopicSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTopicSummary(week?.topicSummary || "");
    setError("");
  }, [week]);

  const save = async () => {
    if (!week || !topicSummary.trim()) return;
    setSaving(true);
    setError("");
    try {
      await repositoryService.updateWeek(week.id, {
        topicSummary: topicSummary.trim(),
      });
      onOpenChange(false);
      onSaved();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo guardar el resumen",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!week} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resumen de la semana {week?.weekNumber}</DialogTitle>
          <DialogDescription>
            Añade una descripción breve de los contenidos de esta semana.
          </DialogDescription>
        </DialogHeader>
        <label className="repo-form-field">
          <span>Resumen</span>
          <textarea
            rows={5}
            value={topicSummary}
            onChange={(event) => setTopicSummary(event.target.value)}
            maxLength={1000}
            autoFocus
          />
        </label>
        {error && <div className="repo-alert repo-alert--error">{error}</div>}
        <button
          type="button"
          className="repo-primary-button"
          onClick={() => void save()}
          disabled={saving || !topicSummary.trim()}
        >
          {saving ? "Guardando…" : "Guardar resumen"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

export function CourseDetail() {
  const { offeringId } = useParams<{ offeringId: string }>();
  // Back to the same page and filters of the course list.
  const listSearch = (useLocation().state as { from?: string } | null)?.from;
  const [offering, setOffering] = useState<Offering>();
  const [blockId, setBlockId] = useState("");
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMaterialWeekId, setNewMaterialWeekId] = useState<number>();
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingWeek, setEditingWeek] = useState<Week | null>(null);

  useEffect(() => {
    if (!offeringId) return;
    setLoading(true);
    repositoryService
      .getOffering(Number(offeringId))
      .then((data) => {
        setOffering(data);
        if (data.blocks[0]) setBlockId(String(data.blocks[0].blockId));
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [offeringId]);

  const loadWeeks = useCallback(async () => {
    if (!blockId) return setWeeks([]);
    try {
      setWeeks(await repositoryService.getWeeks(Number(blockId)));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo cargar el contenido",
      );
    }
  }, [blockId]);

  useEffect(() => {
    void loadWeeks();
  }, [loadWeeks]);

  const openUrl = (url: string) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  };

  const openSyllabus = async (blockIdToOpen: number) => {
    try {
      const { url } = await repositoryService.getSyllabusAccess(blockIdToOpen);
      openUrl(url);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo abrir el sílabo",
      );
    }
  };

  const openMaterial = async (material: Material) => {
    try {
      const { url } = await repositoryService.getMaterialAccess(material.id);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo abrir el material",
      );
    }
  };

  const deleteMaterial = async (material: Material) => {
    if (
      !window.confirm(
        `¿Eliminar “${material.title}”? Esta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      await repositoryService.deleteMaterial(material.id);
      await loadWeeks();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar el material",
      );
    }
  };

  if (loading)
    return (
      <div className="repo-page-state">
        <span className="repo-spinner" />
        Cargando curso…
      </div>
    );
  if (!offering)
    return <div className="repo-empty">{error || "El curso no existe."}</div>;

  const selectedBlock = offering.blocks.find(
    (block) => block.blockId === Number(blockId),
  );
  const canManage = selectedBlock?.canManage === true;

  return (
    <section>
      <div className="repo-breadcrumb">
        <Link to={listSearch ? `/?${listSearch}` : "/"}>Cursos dictados</Link>
        <span>›</span>
        <span>{offering.courseName}</span>
      </div>
      <div className="repo-course-heading">
        <div>
          <div className="repo-title-line">
            <h1>{offering.courseName}</h1>
            <span>
              {offering.academicLevel === "UNDERGRADUATE"
                ? "Pregrado"
                : "Posgrado"}
            </span>
          </div>
          <span className="repo-course-code repo-course-code--heading">
            {offering.courseCode}
          </span>
          <p>
            {offering.teacherName ||
              (offering.authors?.length
                ? `Publicado por ${authorsLine(offering.authors)}`
                : "Docente por asignar")}
          </p>
          <p>
            {offering.programs?.length
              ? offering.programs.map((program) => program.programName).join(" · ")
              : offering.programName}
          </p>
          <p>Plan curricular {offering.planCode}</p>
          <p>{offering.semesterName}</p>
          <p>
            {formatWeekDate(offering.startDate)} – {formatWeekDate(offering.endDate)}
          </p>
          {offering.description && (
            <p className="repo-course-description">{offering.description}</p>
          )}
        </div>
      </div>

      <BlockNavigator
        blocks={offering.blocks}
        selectedId={selectedBlock?.blockId}
        onSelect={(id) => setBlockId(String(id))}
      />

      {selectedBlock && (
        <div className="repo-block-access-note">
          <div className="repo-block-fact">
            <span>Bloque</span>
            <strong>{selectedBlock.displayName}</strong>
          </div>
          {selectedBlock.teachers.length > 0 ? (
            <div className="repo-block-fact">
              <span>{selectedBlock.teachers.length > 1 ? "Responsables" : "Responsable"}</span>
              <strong>{selectedBlock.teachers.map((teacher) => teacher.name).join(", ")}</strong>
            </div>
          ) : (
            selectedBlock.authors.length > 0 && (
              <div className="repo-block-fact">
                <span>Publicado por</span>
                <strong>{authorsLine(selectedBlock.authors)}</strong>
              </div>
            )
          )}
          {selectedBlock.hasSyllabus && (
            <button
              type="button"
              className="repo-table-action"
              onClick={() => void openSyllabus(selectedBlock.blockId)}
            >
              <FileText /> Sílabo
            </button>
          )}
          {canManage && <span className="repo-status repo-status--active">Puedes administrar</span>}
        </div>
      )}

      {error && <div className="repo-alert repo-alert--error">{error}</div>}
      <div className="repo-weeks-heading">
        <div>
          <h2>Semanas</h2>
          <p>Generadas automáticamente según las fechas del curso.</p>
        </div>
      </div>
      {weeks.length === 0 ? (
        <div className="repo-empty">Aún no hay semanas en este bloque.</div>
      ) : (
        <div className="repo-week-list">
          {[...weeks]
            .sort((a, b) => a.weekNumber - b.weekNumber)
            .map((week, index) => (
              <details
                className="repo-week"
                key={week.id}
                open={index === 0 && !!offering && isCurrentOffering(offering)}
              >
                <summary>
                  <span>
                    Semana {week.weekNumber}
                    <small>
                      {formatWeekDate(week.weekStartDate)} –{" "}
                      {formatWeekDate(week.weekEndDate)}
                    </small>
                  </span>
                  {week.isLocked && (
                    <span className="repo-week-lock">
                      <LockKeyhole /> Bloqueada para docentes
                    </span>
                  )}
                </summary>
                <div className="repo-week__content">
                  <div className="repo-week-toolbar">
                    <p
                      className={
                        week.topicSummary
                          ? "repo-week-topic"
                          : "repo-week-topic repo-week-topic--empty"
                      }
                    >
                      {week.topicSummary || "Sin resumen de la semana."}
                    </p>
                    {week.canManage && (
                      <div className="repo-week-actions">
                        <button
                          type="button"
                          className="repo-table-action"
                          onClick={() => setEditingWeek(week)}
                        >
                          <Pencil />
                          {week.topicSummary ? "Editar resumen" : "Añadir resumen"}
                        </button>
                      </div>
                    )}
                  </div>
                  {week.materials.length === 0 && (
                    <p className="repo-muted-message">
                      No hay materiales en esta semana.
                    </p>
                  )}
                  {week.materials.map((material) => (
                    <article className="repo-material-row" key={material.id}>
                      <div className="repo-material-row__main">
                        <p className="repo-material-kind">
                          {material.materialType === "LINK" && material.linkSubtype
                            ? linkSubtypeLabels[material.linkSubtype]
                            : materialLabels[material.materialCategory]}
                        </p>
                        <button
                          type="button"
                          onClick={() => void openMaterial(material)}
                        >
                          {material.title}
                        </button>
                        {material.description && (
                          <p className="repo-material-description">
                            {material.description}
                          </p>
                        )}
                        <p className="repo-material-meta">
                          {formatDate(material.createdAt)} ·{" "}
                          {materialAuthor(material)}
                          {material.fileResource
                            ? ` · ${material.fileResource.fileName} (${formatSize(material.fileResource.sizeBytes)})`
                            : ""}
                        </p>
                      </div>
                      {week.canManage && (
                        <div className="repo-material-actions">
                          <button
                            type="button"
                            className="repo-outline-button"
                            onClick={() => setEditingMaterial(material)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="repo-text-button repo-text-button--danger"
                            onClick={() => void deleteMaterial(material)}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                  {week.canManage && (
                    <button
                      type="button"
                      className="repo-outline-button repo-add-material"
                      onClick={() => setNewMaterialWeekId(week.id)}
                    >
                      <FileUp /> Agregar material
                    </button>
                  )}
                </div>
              </details>
            ))}
        </div>
      )}
      <NewMaterialDialog
        weekId={newMaterialWeekId}
        open={!!newMaterialWeekId}
        onOpenChange={(open) => !open && setNewMaterialWeekId(undefined)}
        onCreated={loadWeeks}
      />
      <EditMaterialDialog
        material={editingMaterial}
        onOpenChange={(open) => !open && setEditingMaterial(null)}
        onSaved={loadWeeks}
      />
      <EditWeekDialog
        week={editingWeek}
        onOpenChange={(open) => !open && setEditingWeek(null)}
        onSaved={loadWeeks}
      />
    </section>
  );
}
