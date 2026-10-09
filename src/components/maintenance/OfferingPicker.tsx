import { useCallback, useEffect, useState } from "react";
import { SearchPicker } from "@/components/ui/search-picker";
import {
  repositoryService,
  type Offering,
  type Semester,
} from "@/services/repositoryService";

const RESULT_LIMIT = 20;

function offeringTitle(offering: Offering) {
  return `${offering.courseName} — ${offering.semesterName}`;
}

function offeringDetail(offering: Offering) {
  return `${offering.courseCode} · ${offering.programName}`;
}

/**
 * Chooses one course offering without loading all of them: the server returns the offerings
 * that match the typed text, optionally within one semester.
 */
export function OfferingPicker({
  value,
  onChange,
  excludeIds,
  disabled,
  disabledHint,
  className = "repo-form-field",
}: {
  value: string;
  onChange: (offeringId: string) => void;
  /** Listed as unavailable (for example, offerings the student is already enrolled in). */
  excludeIds?: Set<number>;
  disabled?: boolean;
  disabledHint?: string;
  className?: string;
}) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [results, setResults] = useState<Offering[]>([]);
  const [selected, setSelected] = useState<Offering | null>(null);

  useEffect(() => {
    repositoryService
      .getSemesters()
      .then((data) => setSemesters(data.semesters))
      .catch(() => setSemesters([]));
  }, []);

  // A value cleared by the parent (a reset form) clears the choice.
  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  const search = useCallback(
    async (query: string) => {
      const data = await repositoryService.getOfferings({
        semesterId: semesterId ? Number(semesterId) : undefined,
        search: query || undefined,
        page: 1,
        limit: RESULT_LIMIT,
      });
      setResults(data.offerings);
      return {
        total: data.total,
        items: data.offerings.map((offering) => ({
          key: offering.offeringId,
          title: offeringTitle(offering),
          detail: offeringDetail(offering),
          unavailable: excludeIds?.has(offering.offeringId) ? "Ya matriculado" : undefined,
        })),
      };
    },
    [semesterId, excludeIds],
  );

  return (
    <SearchPicker
      className={className}
      label="Oferta (curso y semestre)"
      placeholder="Buscar por curso, código o docente"
      selected={
        selected
          ? { key: selected.offeringId, title: offeringTitle(selected), detail: offeringDetail(selected) }
          : null
      }
      onClear={() => {
        setSelected(null);
        onChange("");
      }}
      onPick={(key) => {
        const offering = results.find((item) => item.offeringId === key) ?? null;
        setSelected(offering);
        onChange(offering ? String(offering.offeringId) : "");
      }}
      search={search}
      disabled={disabled}
      disabledHint={disabledHint}
      emptyText={(query) =>
        query ? `Ninguna oferta coincide con «${query}».` : "No hay ofertas con ese filtro."
      }
      filters={
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
      }
    />
  );
}
