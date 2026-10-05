import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  repositoryService,
  type AcademicLevel,
  type CurriculumPlan,
  type Offering,
  type Program,
  type Semester,
} from "@/services/repositoryService";
import { authorsLine } from "@/lib/authors";

/** With every semester selected the list is paged; one semester loads at once. */
const PAGE_SIZE = 60;

export function Courses() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [search, setSearch] = useState("");
  const [programId, setProgramId] = useState("");
  const [planId, setPlanId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

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
        const activeSemester = semesterData.semesters.find(
          (semester) => semester.isActive,
        );
        if (activeSemester) setSemesterId(String(activeSemester.semesterId));
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const fetchPage = useCallback(
    (pageNumber: number) =>
      repositoryService.getOfferings({
        search: search.trim() || undefined,
        programId: programId ? Number(programId) : undefined,
        planId: planId ? Number(planId) : undefined,
        semesterId: semesterId ? Number(semesterId) : undefined,
        academicLevel: (academicLevel || undefined) as
          AcademicLevel | undefined,
        ...(semesterId ? {} : { page: pageNumber, limit: PAGE_SIZE }),
      }),
    [search, programId, planId, semesterId, academicLevel],
  );

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchPage(page + 1);
      setOfferings((current) => [...current, ...data.offerings]);
      setPage(page + 1);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudieron cargar más cursos",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPage(1);
      setOfferings(data.offerings);
      setTotal(data.total);
      setPage(1);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los cursos",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadCourses(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadCourses]);

  const visiblePrograms = programs.filter(
    (program) => !academicLevel || program.academicLevel === academicLevel,
  );

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
            placeholder="Buscar"
          />
          <Search size={20} aria-hidden="true" />
        </label>
        <label className="repo-select-field">
          <span>Tipo de programa</span>
          <select
            value={academicLevel}
            onChange={(event) => {
              setAcademicLevel(event.target.value);
              setProgramId("");
            }}
          >
            <option value="">Todos</option>
            <option value="UNDERGRADUATE">Pregrado</option>
            <option value="POSTGRADUATE">Posgrado</option>
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
            {semesters.map((semester) => (
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
            {plans.map((plan) => (
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
                <p>
                  {offering.teacherName ||
                    (offering.authors?.length
                      ? `Materiales de ${authorsLine(offering.authors)}`
                      : "Docente por asignar")}
                </p>
              </div>
              <div className="repo-course-card__bottom">
                <p>{offering.programName}</p>
                <p>Plan {offering.planCode}</p>
                <p>{offering.semesterName}</p>
                <Link
                  to={`/courses/${offering.offeringId}`}
                  className="repo-primary-action"
                >
                  Ver materiales
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && !semesterId && offerings.length < total && (
        <button
          type="button"
          className="repo-outline-button repo-load-more"
          onClick={() => void loadMore()}
          disabled={loadingMore}
        >
          {loadingMore
            ? "Cargando…"
            : `Cargar más cursos (${offerings.length} de ${total})`}
        </button>
      )}
    </section>
  );
}
