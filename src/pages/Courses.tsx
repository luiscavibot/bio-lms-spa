import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  repositoryService,
  type AcademicLevel,
  type Offering,
  type Program,
  type Semester,
} from "@/services/repositoryService";

export function Courses() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [search, setSearch] = useState("");
  const [programId, setProgramId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      repositoryService.getPrograms(),
      repositoryService.getSemesters(),
    ])
      .then(([programData, semesterData]) => {
        setPrograms(programData.programs.filter((program) => program.isActive));
        setSemesters(semesterData.semesters);
        const activeSemester = semesterData.semesters.find(
          (semester) => semester.isActive,
        );
        if (activeSemester) setSemesterId(String(activeSemester.semesterId));
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await repositoryService.getOfferings({
        search: search.trim() || undefined,
        programId: programId ? Number(programId) : undefined,
        semesterId: semesterId ? Number(semesterId) : undefined,
        academicLevel: (academicLevel || undefined) as
          AcademicLevel | undefined,
      });
      setOfferings(data.offerings);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los cursos",
      );
    } finally {
      setLoading(false);
    }
  }, [search, programId, semesterId, academicLevel]);

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
                <p>{offering.teacherName || "Docente por asignar"}</p>
              </div>
              <div className="repo-course-card__bottom">
                <p>{offering.programName}</p>
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
    </section>
  );
}
