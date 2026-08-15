import { FileUp, Plus, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserRole } from "@/hooks/usePermissions";
import {
  repositoryService,
  type Material,
  type MaterialCategory,
  type Offering,
  type Week,
} from "@/services/repositoryService";

const materialLabels: Record<MaterialCategory, string> = {
  EXTERNAL_LINK: "Enlace externo",
  PRACTICE_FILE: "Archivo de prácticas",
  CLASS_SLIDES: "Diapositivas de clase",
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
  const [category, setCategory] = useState<MaterialCategory | "">("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setCategory("");
      setTitle("");
      setUrl("");
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
        await repositoryService.createLink({
          weekId,
          title: title.trim(),
          externalLinkUrl: url.trim(),
        });
      } else {
        if (!file) throw new Error("Selecciona un archivo");
        await repositoryService.uploadMaterial({
          weekId,
          title: title.trim(),
          materialCategory: category,
          file,
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
              setCategory(event.target.value as MaterialCategory)
            }
          >
            <option value="">Seleccionar</option>
            {Object.entries(materialLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
        {category === "EXTERNAL_LINK" && (
          <label className="repo-form-field">
            <span>Dirección web</span>
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
            />
          </label>
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
            (category === "EXTERNAL_LINK" ? !url.trim() : !file)
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
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(material?.title || "");
    setUrl(material?.externalLinkUrl || "");
    setError("");
  }, [material]);

  const save = async () => {
    if (!material || !title.trim()) return;
    setSaving(true);
    try {
      await repositoryService.updateMaterial(material.id, {
        title: title.trim(),
        ...(material.materialType === "LINK"
          ? { externalLinkUrl: url.trim() }
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
        {material?.materialType === "LINK" && (
          <label className="repo-form-field">
            <span>Dirección web</span>
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </label>
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

export function CourseDetail() {
  const { offeringId } = useParams<{ offeringId: string }>();
  const role = useUserRole();
  const canManage = role === "Admin" || role === "Teacher";
  const [offering, setOffering] = useState<Offering>();
  const [blockId, setBlockId] = useState("");
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMaterialWeekId, setNewMaterialWeekId] = useState<number>();
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

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

  const addWeek = async () => {
    const nextWeek =
      weeks.reduce((maximum, week) => Math.max(maximum, week.weekNumber), 0) +
      1;
    try {
      await repositoryService.createWeek({
        blockId: Number(blockId),
        weekNumber: nextWeek,
      });
      await loadWeeks();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo crear la semana",
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

  return (
    <section>
      <div className="repo-breadcrumb">
        <Link to="/">Cursos</Link>
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
          <p>{offering.teacherName || "Docente por asignar"}</p>
          <p>{offering.programName}</p>
          <p>{offering.semesterName}</p>
          {offering.description && (
            <p className="repo-course-description">{offering.description}</p>
          )}
        </div>
        <label className="repo-select-field repo-block-select">
          <span>Bloque</span>
          <select
            value={blockId}
            onChange={(event) => setBlockId(event.target.value)}
          >
            {offering.blocks.map((block) => (
              <option key={block.blockId} value={block.blockId}>
                {block.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="repo-alert repo-alert--error">{error}</div>}
      <div className="repo-weeks-heading">
        <h2>Semanas</h2>
        {canManage && (
          <button
            type="button"
            className="repo-outline-button"
            onClick={addWeek}
            disabled={!blockId}
          >
            <Plus /> Nueva semana
          </button>
        )}
      </div>
      {weeks.length === 0 ? (
        <div className="repo-empty">Aún no hay semanas en este bloque.</div>
      ) : (
        <div className="repo-week-list">
          {[...weeks]
            .sort((a, b) => b.weekNumber - a.weekNumber)
            .map((week, index) => (
              <details className="repo-week" key={week.id} open={index === 0}>
                <summary>Semana {week.weekNumber}</summary>
                <div className="repo-week__content">
                  {week.topicSummary && (
                    <p className="repo-week-topic">{week.topicSummary}</p>
                  )}
                  {week.materials.length === 0 && (
                    <p className="repo-muted-message">
                      No hay materiales en esta semana.
                    </p>
                  )}
                  {week.materials.map((material) => (
                    <article className="repo-material-row" key={material.id}>
                      <div className="repo-material-row__main">
                        <p className="repo-material-kind">
                          {materialLabels[material.materialCategory]}
                        </p>
                        <button
                          type="button"
                          onClick={() => void openMaterial(material)}
                        >
                          {material.title}
                        </button>
                        <p className="repo-material-meta">
                          {formatDate(material.createdAt)} · Subido por{" "}
                          {material.uploadedBy
                            ? `${material.uploadedBy.firstName} ${material.uploadedBy.lastName}`.trim()
                            : "Repositorio"}
                        </p>
                      </div>
                      {canManage && (
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
                  {canManage && (
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
    </section>
  );
}
