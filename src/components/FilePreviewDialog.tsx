import { Download, ExternalLink, FileWarning } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FileAccess, FileDisposition } from "@/services/repositoryService";

export interface FilePreviewRequest {
  title: string;
  /** Asks the API for a new signed URL; each one lasts a few minutes. */
  load: (disposition: FileDisposition) => Promise<FileAccess>;
}

type PreviewKind = "pdf" | "image" | "video" | "text";

/** The API grants `inline` only to types the browser can show; this picks how to show it. */
function previewKind(access: FileAccess): PreviewKind | undefined {
  if (access.disposition !== "inline") return undefined;
  const type = access.mimeType.split(";")[0].trim().toLowerCase();
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("text/")) return "text";
  return undefined;
}

/** Signed URLs last five minutes; past this age a new one is requested. */
const FRESH_MS = 4 * 60 * 1000;

function follow(url: string, newTab: boolean) {
  const anchor = document.createElement("a");
  anchor.href = url;
  if (newTab) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  anchor.click();
}

function messageOf(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

export function FilePreviewDialog({
  request,
  onClose,
}: {
  request: FilePreviewRequest | null;
  onClose: () => void;
}) {
  const [access, setAccess] = useState<FileAccess>();
  const [loadedAt, setLoadedAt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAccess(undefined);
    setError("");
    if (!request) return;
    let cancelled = false;
    setLoading(true);
    request
      .load("inline")
      .then((result) => {
        if (cancelled) return;
        setAccess(result);
        setLoadedAt(Date.now());
      })
      .catch((reason) => {
        if (!cancelled) setError(messageOf(reason, "No se pudo abrir el archivo"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [request]);

  const download = async () => {
    if (!request) return;
    setDownloading(true);
    setError("");
    try {
      follow((await request.load("attachment")).url, false);
    } catch (reason) {
      setError(messageOf(reason, "No se pudo descargar el archivo"));
    } finally {
      setDownloading(false);
    }
  };

  const openInNewTab = async () => {
    if (!request || !access) return;
    // Opening synchronously keeps the click's user activation, so no popup blocker steps in.
    if (Date.now() - loadedAt < FRESH_MS) return follow(access.url, true);
    try {
      const result = await request.load("inline");
      setAccess(result);
      setLoadedAt(Date.now());
      follow(result.url, true);
    } catch (reason) {
      setError(messageOf(reason, "No se pudo abrir el archivo"));
    }
  };

  const kind = access ? previewKind(access) : undefined;

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="repo-preview-dialog">
        <DialogHeader className="repo-preview-header">
          <DialogTitle>{request?.title}</DialogTitle>
          <DialogDescription>{access?.fileName ?? "Cargando archivo…"}</DialogDescription>
        </DialogHeader>

        <div className="repo-preview-body">
          {loading && <p className="repo-muted-message">Preparando la vista previa…</p>}
          {access && kind === "pdf" && (
            <iframe className="repo-preview-frame" src={access.url} title={access.fileName} />
          )}
          {access && kind === "text" && (
            <iframe
              className="repo-preview-frame repo-preview-frame--text"
              src={access.url}
              title={access.fileName}
            />
          )}
          {access && kind === "image" && (
            <img className="repo-preview-media" src={access.url} alt={access.fileName} />
          )}
          {access && kind === "video" && (
            <video className="repo-preview-media" src={access.url} controls preload="metadata" />
          )}
          {access && !kind && (
            <div className="repo-preview-empty">
              <FileWarning aria-hidden="true" />
              <p>Este tipo de archivo no se puede mostrar en el navegador.</p>
              <p className="repo-muted-message">
                Descárgalo para abrirlo con la aplicación que corresponda.
              </p>
            </div>
          )}
        </div>

        {error && <div className="repo-alert repo-alert--error">{error}</div>}

        <div className="repo-preview-actions">
          {kind && (
            <button type="button" className="repo-outline-button" onClick={() => void openInNewTab()}>
              <ExternalLink aria-hidden="true" />
              Abrir en pestaña nueva
            </button>
          )}
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void download()}
            disabled={!access || downloading}
          >
            <Download aria-hidden="true" className="mr-2 h-4 w-4" />
            {downloading ? "Descargando…" : "Descargar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
