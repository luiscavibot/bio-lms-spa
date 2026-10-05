import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pagination } from "@/components/ui/pagination";
import {
  repositoryService,
  type AcademicLevel,
  type CurriculumPlan,
  type Offering,
  type OfferingFacets,
  type OfferingFilters,
  type Program,
  type Semester,
} from "@/services/repositoryService";
import { authorsLine } from "@/lib/authors";

/** Courses per page; the list is always paged on the server. */
const PAGE_SIZE = 30;

export function Courses() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<OfferingFacets>();
  const [error, setError] = useState("");

  // Filters and page live in the URL, so coming back from a course keeps them. Every filter
  // starts on «Todos»: the repository is browsed across all semesters.
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const academicLevel = params.get("nivel") ?? "";
  const programId = params.get("programa") ?? "";
  const semesterId = params.get("semestre") ?? "";
  const planId = params.get("plan") ?? "";
  const page = Math.max(1, Number(params.get("pagina")) || 1);

  // One URL update per change: react-router resolves each functional update against the
  // params of the last render, so two calls in a row would lose the first one.
  const setFilter =
    (name: string, alsoClear: string[] = []) =>
    (value: string) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value) next.set(name, value);
          else next.delete(name);
          for (const other of [...alsoClear, "pagina"]) next.delete(other);
          return next;
        },
        { replace: true },
      );
  const setSearch = setFilter("q");
  // A program belongs to one level, so changing the level clears the program.
  const setAcademicLevel = setFilter("nivel", ["programa"]);
  const setProgramId = setFilter("programa");
  const setSemesterId = setFilter("semestre");
  const setPlanId = setFilter("plan");
  const goToPage = (value: number) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value > 1) next.set("pagina", String(value));
      else next.delete("pagina");
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    Promise.all([
      repositoryService.getPrograms(),
      repositoryService.getCurriculumPlans(),
      repositoryService.getSemesters(),
    ])
      .then(([programData, planData, semesterData]) => {
        setPrograms(programData.programs.filter((program) => program.isActive));
        setPlans(planData.plans);
        setSemesters(semesterData.semesters);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    const filters: OfferingFilters = {
      search: search.trim() || undefined,
      programId: programId ? Number(programId) : undefined,
      planId: planId ? Number(planId) : undefined,
      semesterId: semesterId ? Number(semesterId) : undefined,
      academicLevel: (academicLevel || undefined) as AcademicLevel | undefined,
    };
    try {
      const [data, facetData] = await Promise.all([
        repositoryService.getOfferings({ ...filters, page, limit: PAGE_SIZE }),
        repositoryService.getOfferingFacets(filters),
      ]);
      setOfferings(data.offerings);
      setTotal(data.total);
      setFacets(facetData);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los cursos",
      );
    } finally {
      setLoading(false);
    }
  }, [search, programId, planId, semesterId, academicLevel, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadCourses(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadCourses]);

  // Each filter offers only values that still yield courses with the other filters; the
  // selected value always stays, so a filter can be read and cleared.
  const offered = (ids: number[] | undefined, id: number, selected: string) =>
    !ids || ids.includes(id) || String(id) === selected;
  const visiblePrograms = programs.filter(
    (program) =>
      (!academicLevel || program.academicLevel === academicLevel) &&
      offered(facets?.programIds, program.programId, programId),
  );
  const visibleSemesters = semesters.filter((semester) =>
    offered(facets?.semesterIds, semester.semesterId, semesterId),
  );
  const visiblePlans = plans.filter((plan) => offered(facets?.planIds, plan.planId, planId));
  const levelOffered = (level: AcademicLevel) =>
    !facets || facets.academicLevels.includes(level) || academicLevel === level;

  return (
    <section>
      <h1 className="repo-page-title">Cursos</h1>
      <div className="repo-filters" aria-label="Filtros de cursos">
        <p>Filtrar por:</p>
        <label className="repo-search-field">
          <span className="sr-only">Buscar</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar curso, código o docente"
          />
          <Search size={20} aria-hidden="true" />
        </label>
        <label className="repo-select-field">
          <span>Tipo de programa</span>
          <select
            value={academicLevel}
            onChange={(event) => setAcademicLevel(event.target.value)}
          >
            <option value="">Todos</option>
            {levelOffered("UNDERGRADUATE") && <option value="UNDERGRADUATE">Pregrado</option>}
            {levelOffered("POSTGRADUATE") && <option value="POSTGRADUATE">Posgrado</option>}
          </select>
        </label>
        <label className="repo-select-field">
          <span>Nombre del programa</span>
          <select
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
          >
            <option value="">Todos</option>
            {visiblePrograms.map((program) => (
              <option key={program.programId} value={program.programId}>
                {program.programName}
              </option>
            ))}
          </select>
        </label>
        <label className="repo-select-field">
          <span>Semestre</span>
          <select
            value={semesterId}
            onChange={(event) => setSemesterId(event.target.value)}
          >
            <option value="">Todos</option>
            {visibleSemesters.map((semester) => (
              <option key={semester.semesterId} value={semester.semesterId}>
                {semester.semesterName}
              </option>
            ))}
          </select>
        </label>
        <label className="repo-select-field">
          <span>Plan curricular</span>
          <select value={planId} onChange={(event) => setPlanId(event.target.value)}>
            <option value="">Todos</option>
            {visiblePlans.map((plan) => (
              <option key={plan.planId} value={plan.planId}>
                {plan.planCode}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="repo-alert repo-alert--error">{error}</div>}
      {loading ? (
        <div className="repo-page-state">
          <span className="repo-spinner" />
          Cargando cursos…
        </div>
      ) : offerings.length === 0 ? (
        <div className="repo-empty">
          No se encontraron cursos con los filtros seleccionados.
        </div>
      ) : (
        <div className="repo-course-grid">
          {offerings.map((offering) => (
            <article className="repo-course-card" key={offering.offeringId}>
              <div className="repo-course-card__top">
                <span className="repo-pill">
                  {offering.academicLevel === "UNDERGRADUATE"
                    ? "Pregrado"
                    : "Posgrado"}
                </span>
                <h2>{offering.courseName}</h2>
                <span className="repo-course-code">{offering.courseCode}</span>
                <p>
                  {offering.teacherName ||
                    (offering.authors?.length
                      ? `Publicado por ${authorsLine(offering.authors)}`
                      : "Docente por asignar")}
                </p>
              </div>
              <div className="repo-course-card__bottom">
                <p>{offering.programName}</p>
                <p>Plan {offering.planCode}</p>
                <p>{offering.semesterName}</p>
                <Link
                  to={`/courses/${offering.offeringId}`}
                  state={{ from: params.toString() }}
                  className="repo-primary-action"
                >
                  Ver materiales
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={goToPage}
          label="cursos"
        />
      )}
    </section>
  );
}
