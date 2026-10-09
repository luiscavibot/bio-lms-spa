import { ChevronLeft, ChevronRight } from "lucide-react";

/** Page numbers to show: first, last and a window around the current one, with gaps. */
export function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => pages.add(value));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((value) => pages.add(value));
  const sorted = [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
  return sorted.flatMap((value, index) =>
    index > 0 && value - sorted[index - 1] > 1 ? (["gap", value] as const) : [value],
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  label = "resultados",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  return (
    <nav className="repo-pagination" aria-label="Paginación">
      <p>
        Mostrando {first}–{last} de {total} {label}
      </p>
      {pageCount > 1 && (
        <div className="repo-pagination__pages">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden="true" /> Anterior
          </button>
          {pageItems(page, pageCount).map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} aria-hidden="true">
                …
              </span>
            ) : (
              <button
                type="button"
                key={item}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                className={item === page ? "repo-pagination__current" : undefined}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label="Página siguiente"
          >
            Siguiente <ChevronRight aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  );
}
