import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Link2,
  ListChecks,
  PlaySquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  contentSpacesService,
  type AttachmentKind,
  type ContentAttachment,
  type ContentPost,
  type ContentSpaceDetail,
  type ContentSpaceSummary,
  type PostState,
  type TransferState,
} from "@/services/contentSpacesService";

const sourceStateLabels: Record<string, string> = {
  ACTIVE: "Activa en Classroom",
  ARCHIVED: "Archivada en Classroom",
};
const postStateLabels: Record<PostState, string> = {
  STAGED: "Preparada",
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
  ARCHIVED: "Archivada",
};
const transferLabels: Record<TransferState, string> = {
  PENDING: "En Drive · pendiente de copia",
  TRANSFERRED: "Copiado a BioRepo",
  LINK_ONLY: "Enlace externo",
  UNAVAILABLE: "Inaccesible",
};
const reviewLabels: Record<string, string> = {
  POSIBLE_DATO_PERSONAL: "Revisar: posible dato personal",
};
const attachmentIcons: Record<AttachmentKind, typeof FileText> = {
  DRIVE_FILE: FileText,
  LINK: Link2,
  YOUTUBE: PlaySquare,
  FORM: ListChecks,
};

function formatDate(value?: string) {
  return value
    ? new Date(value).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
}

function formatSize(bytes?: number) {
  if (bytes === undefined) return "";
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

function StagedNotice() {
  return (
    <div className="repo-block-access-note">
      <strong>Vista administrativa</strong>
      <span>
        Contenido importado de Google Classroom y preparado en privado: los
        alumnos no lo ven hasta validar su correspondencia académica y publicarlo.
      </span>
    </div>
  );
}

export function ImportedSpaces() {
  const [spaces, setSpaces] = useState<ContentSpaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    contentSpacesService
      .list()
      .then((data) => setSpaces(data.spaces))
      .catch((reason) =>
        setError(errorMessage(reason, "No se pudieron cargar las aulas")),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h1 className="repo-page-title">Aulas importadas</h1>
      <StagedNotice />
      {error && <div className="repo-alert repo-alert--error">{error}</div>}
      {loading ? (
        <div className="repo-page-state">
          <span className="repo-spinner" />
          Cargando aulas…
        </div>
      ) : spaces.length === 0 ? (
        <div className="repo-empty">Aún no se ha importado ninguna aula.</div>
      ) : (
        <div className="repo-course-grid">
          {spaces.map((space) => (
            <article className="repo-course-card" key={space.id}>
              <div className="repo-course-card__top">
                <span className="repo-pill">
                  {sourceStateLabels[space.sourceState] ?? space.sourceState}
                </span>
                <h2>{space.title}</h2>
                {space.section && <p>{space.section}</p>}
              </div>
              <div className="repo-course-card__bottom">
                <p>
                  {space.postCount} publicaciones · {space.attachmentCount} adjuntos
                </p>
                <p>
                  {space.teacherCount} docentes · {space.studentCount} alumnos
                </p>
                <p>
                  {space.courseOfferingId
                    ? "Vinculada a un curso"
                    : "Sin correspondencia académica"}
                </p>
                {space.flaggedCount > 0 && (
                  <p className="repo-imported-flag">
                    <AlertTriangle aria-hidden="true" />
                    {space.flaggedCount} por revisar
                  </p>
                )}
                <Link
                  to={`/imported/${space.id}`}
                  className="repo-primary-action"
                >
                  Ver contenido
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AttachmentRow({ attachment }: { attachment: ContentAttachment }) {
  const Icon = attachmentIcons[attachment.kind];
  const meta = [transferLabels[attachment.transferState], formatSize(attachment.sizeBytes)]
    .filter(Boolean)
    .join(" · ");
  const content = (
    <>
      <Icon aria-hidden="true" />
      <span>
        <span className="repo-imported-attachment__title">{attachment.title}</span>
        <small>{meta}</small>
      </span>
      {attachment.url && <ExternalLink aria-hidden="true" />}
    </>
  );
  return (
    <li>
      {attachment.url ? (
        <a
          className="repo-imported-attachment"
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          title={attachment.disposition}
        >
          {content}
        </a>
      ) : (
        <span className="repo-imported-attachment" title={attachment.disposition}>
          {content}
        </span>
      )}
    </li>
  );
}

function PostCard({ post }: { post: ContentPost }) {
  return (
    <article className="repo-imported-post">
      <div className="repo-imported-post__header">
        <h3>{post.title}</h3>
        <div className="repo-imported-post__badges">
          <span className="repo-status">{postStateLabels[post.localState]}</span>
          {post.reviewFlag && (
            <span className="repo-status repo-status--warning">
              <AlertTriangle aria-hidden="true" />
              {reviewLabels[post.reviewFlag] ?? post.reviewFlag}
            </span>
          )}
          {post.audienceMode === "INDIVIDUAL_STUDENTS" && (
            <span className="repo-status">Audiencia individual</span>
          )}
        </div>
      </div>
      <p className="repo-material-meta">
        {formatDate(post.sourceCreatedAt)}
        {post.authorName ? ` · Publicado por ${post.authorName}` : ""}
      </p>
      {post.body && <p className="repo-imported-post__body">{post.body}</p>}
      {post.attachments.length > 0 && (
        <ul className="repo-imported-attachments">
          {post.attachments.map((attachment) => (
            <AttachmentRow key={attachment.id} attachment={attachment} />
          ))}
        </ul>
      )}
    </article>
  );
}

export function ImportedSpaceDetail() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [space, setSpace] = useState<ContentSpaceDetail>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!spaceId) return;
    setLoading(true);
    contentSpacesService
      .get(Number(spaceId))
      .then(setSpace)
      .catch((reason) =>
        setError(errorMessage(reason, "No se pudo cargar el aula")),
      )
      .finally(() => setLoading(false));
  }, [spaceId]);

  if (loading)
    return (
      <div className="repo-page-state">
        <span className="repo-spinner" />
        Cargando aula…
      </div>
    );
  if (!space)
    return <div className="repo-empty">{error || "El aula no existe."}</div>;

  const sections = space.sections.filter((section) => section.posts.length > 0);
  const postCount =
    space.sections.reduce((sum, section) => sum + section.posts.length, 0) +
    space.unsectionedPosts.length;

  return (
    <section>
      <div className="repo-breadcrumb">
        <Link to="/imported">Aulas importadas</Link>
        <span>›</span>
        <span>{space.title}</span>
      </div>
      <div className="repo-course-heading">
        <div>
          <div className="repo-title-line">
            <h1>{space.title}</h1>
            <span>{sourceStateLabels[space.sourceState] ?? space.sourceState}</span>
          </div>
          {space.section && <p>{space.section}</p>}
          <p>
            {space.teacherCount} docentes · {space.studentCount} alumnos en Classroom
          </p>
          <p>
            {postCount} publicaciones en {sections.length} secciones · capturado el{" "}
            {formatDate(space.capturedAt)}
          </p>
          <p>
            {space.courseOfferingId
              ? "Vinculada a un curso del catálogo"
              : "Sin correspondencia académica: falta vincularla a curso, semestre y bloque"}
          </p>
        </div>
      </div>
      <StagedNotice />
      {error && <div className="repo-alert repo-alert--error">{error}</div>}
      <div className="repo-weeks-heading">
        <div>
          <h2>Temas</h2>
          <p>En el mismo orden que en Classroom.</p>
        </div>
      </div>
      <div className="repo-week-list">
        {sections.map((section, index) => (
          <details className="repo-week" key={section.id} open={index === 0}>
            <summary>
              <span>
                {section.title}
                <small>
                  {section.posts.length}{" "}
                  {section.posts.length === 1 ? "publicación" : "publicaciones"}
                  {section.kind === "GENERAL"
                    ? " sin tema"
                    : section.weekNumberHint
                      ? ` · semana ${section.weekNumberHint}`
                      : " · sin semana"}
                </small>
              </span>
            </summary>
            <div className="repo-week__content">
              {section.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
