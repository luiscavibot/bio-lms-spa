import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export interface SearchPickerItem {
  key: number;
  title: string;
  detail?: string;
  /** Shown but not selectable, with this reason. */
  unavailable?: string;
}

/**
 * One control to find and pick an item: typing asks the server for matches and lists them
 * below; a click picks one, shown in place of the search until it is cleared.
 */
export function SearchPicker({
  label,
  placeholder,
  selected,
  onClear,
  onPick,
  search,
  filters,
  disabled,
  disabledHint,
  emptyText,
  className = "",
}: {
  label: string;
  placeholder: string;
  selected: SearchPickerItem | null;
  onClear: () => void;
  onPick: (key: number) => void;
  /** Must be stable (useCallback); a new function runs the search again. */
  search: (query: string) => Promise<{ items: SearchPickerItem[]; total: number }>;
  filters?: ReactNode;
  disabled?: boolean;
  disabledHint?: string;
  emptyText: (query: string) => string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchPickerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (selected || disabled) return;
    let current = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      search(query.trim())
        .then((data) => {
          if (!current) return;
          setItems(data.items);
          setTotal(data.total);
          setFailed(false);
        })
        .catch(() => current && setFailed(true))
        .finally(() => current && setLoading(false));
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timeout);
    };
  }, [query, search, selected, disabled]);

  if (selected) {
    return (
      <div className={`repo-search-picker ${className}`}>
        <span className="repo-search-picker__label">{label}</span>
        <div className="repo-search-picker__selected">
          <div>
            <strong>{selected.title}</strong>
            {selected.detail && <small>{selected.detail}</small>}
          </div>
          <button type="button" onClick={onClear} aria-label={`Cambiar ${label.toLowerCase()}`}>
            <X size={16} /> Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`repo-search-picker ${className}`}>
      <span className="repo-search-picker__label">{label}</span>
      <div className="repo-search-picker__inputs">
        {filters}
        <input
          type="search"
          aria-label={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      {disabled ? (
        disabledHint && <small>{disabledHint}</small>
      ) : (
        <>
          <ul className="repo-search-picker__results" aria-busy={loading}>
            {loading && items.length === 0 ? (
              <li className="repo-search-picker__note">Buscando…</li>
            ) : failed ? (
              <li className="repo-search-picker__note">No se pudo buscar. Intenta de nuevo.</li>
            ) : items.length === 0 ? (
              <li className="repo-search-picker__note">{emptyText(query.trim())}</li>
            ) : (
              items.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => onPick(item.key)}
                    disabled={!!item.unavailable}
                    title={item.unavailable}
                  >
                    <strong>{item.title}</strong>
                    {(item.detail || item.unavailable) && (
                      <small>{item.unavailable ?? item.detail}</small>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
          {!loading && total > items.length && (
            <small>
              Se muestran {items.length} de {total}. Escribe más para acotar.
            </small>
          )}
        </>
      )}
    </div>
  );
}
