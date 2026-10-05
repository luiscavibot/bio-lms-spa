import { useEffect, useState } from "react";
import {
  repositoryService,
  type Offering,
  type Semester,
} from "@/services/repositoryService";

const RESULT_LIMIT = 50;

/**
 * Chooses one course offering without loading all of them: the server returns the offerings
 * of the chosen semester that match the typed text, at most RESULT_LIMIT at a time.
 */
export function OfferingPicker({
  value,
  onChange,
  excludeIds,
  disabled,
  className = "repo-form-field",
}: {
  value: string;
  onChange: (offeringId: string) => void;
  excludeIds?: Set<number>;
  disabled?: boolean;
  className?: string;
}) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Offering[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    repositoryService
      .getSemesters()
      .then((data) => setSemesters(data.semesters))
      .catch(() => setSemesters([]));
  }, []);

  useEffect(() => {
    if (disabled) return;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      repositoryService
        .getOfferings({
          semesterId: semesterId ? Number(semesterId) : undefined,
          search: query.trim() || undefined,
          page: 1,
          limit: RESULT_LIMIT,
        })
        .then((data) => {
          setResults(data.offerings);
          setTotal(data.total);
        })
        .catch(() => {
          setResults([]);
          setTotal(0);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [semesterId, query, disabled]);

  const options = results.filter((offering) => !excludeIds?.has(offering.offeringId));

  return (
    <div className={`repo-offering-picker ${className}`}>
      <span>Oferta (curso y semestre)</span>
      <div className="repo-offering-picker__filters">
        <select
          aria-label="Semestre"
          value={semesterId}
          onChange={(event) => setSemesterId(event.target.value)}
          disabled={disabled}
        >
          <option value="">Todos los semestres</option>
          {semesters.map((semester) => (
            <option key={semester.semesterId} value={semester.semesterId}>
              {semester.semesterName}
            </option>
          ))}
        </select>
        <input
          aria-label="Buscar curso por nombre o código"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar curso por nombre o código"
          disabled={disabled}
        />
      </div>
      <select
        aria-label="Curso"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading}
      >
        <option value="">{loading ? "Buscando…" : "Seleccionar oferta"}</option>
        {options.map((offering) => (
          <option key={offering.offeringId} value={offering.offeringId}>
            {offering.courseName} ({offering.courseCode}) — {offering.semesterName}
          </option>
        ))}
      </select>
      {!loading && total > RESULT_LIMIT && (
        <small>
          Se muestran {RESULT_LIMIT} de {total}. Elige un semestre o escribe parte del nombre.
        </small>
      )}
      {!loading && !disabled && total === 0 && <small>No hay ofertas con ese filtro.</small>}
    </div>
  );
}
