import { Copy, KeyRound, Plus, Search, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Unauthorized } from "@/pages/Unauthorized";
import {
  repositoryService,
  type AcademicLevel,
  type BlockType,
  type Offering,
  type Program,
  type Semester,
  type Teacher,
} from "@/services/repositoryService";

type Section = "courses" | "programs" | "teachers";
type View = "list" | "create";

function generateTemporaryPassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const random = Array.from(
    bytes,
    (value) => alphabet[value % alphabet.length],
  ).join("");
  return `Bio#${random}Aa1!`;
}

function InlineError({ message }: { message: string }) {
  return message ? (
    <div className="repo-alert repo-alert--error">{message}</div>
  ) : null;
}

function CoursesSection() {
  const [view, setView] = useState<View>("list");
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    courseName: "",
    teacherId: "",
    academicLevel: "" as AcademicLevel | "",
    programId: "",
    semesterId: "",
    blockTypes: [] as BlockType[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [offeringData, programData, semesterData, teacherData] =
        await Promise.all([
          repositoryService.getOfferings(),
          repositoryService.getPrograms(),
          repositoryService.getSemesters(),
          repositoryService.getTeachers(),
        ]);
      setOfferings(offeringData.offerings);
      setPrograms(programData.programs.filter((program) => program.isActive));
      setSemesters(semesterData.semesters);
      setTeachers(teacherData.users);
      const active = semesterData.semesters.find(
        (semester) => semester.isActive,
      );
      if (active) {
        setSemesterFilter((current) => current || String(active.semesterId));
        setForm((current) => ({
          ...current,
          semesterId: current.semesterId || String(active.semesterId),
        }));
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los cursos",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      offerings.filter((offering) => {
        const matchesSearch =
          !search.trim() ||
          offering.courseName.toLowerCase().includes(search.toLowerCase());
        return (
          matchesSearch &&
          (!semesterFilter || offering.semesterId === Number(semesterFilter)) &&
          (!levelFilter || offering.academicLevel === levelFilter)
        );
      }),
    [offerings, search, semesterFilter, levelFilter],
  );

  const save = async () => {
    if (
      !form.courseName.trim() ||
      !form.programId ||
      !form.semesterId ||
      form.blockTypes.length === 0
    ) {
      setError("Completa el nombre, programa, semestre y al menos un bloque.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.createOffering({
        courseName: form.courseName.trim(),
        programId: Number(form.programId),
        semesterId: Number(form.semesterId),
        teacherId: form.teacherId ? Number(form.teacherId) : undefined,
        blockTypes: form.blockTypes,
      });
      setForm((current) => ({
        ...current,
        courseName: "",
        teacherId: "",
        programId: "",
        blockTypes: [],
      }));
      setView("list");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo agregar el curso",
      );
    } finally {
      setSaving(false);
    }
  };

  if (view === "create") {
    const filteredPrograms = programs.filter(
      (program) =>
        !form.academicLevel || program.academicLevel === form.academicLevel,
    );
    return (
      <div className="repo-maint-content">
        <button
          type="button"
          className="repo-back-button"
          onClick={() => setView("list")}
        >
          ‹ Volver a cursos
        </button>
        <div className="repo-section-heading">
          <h2>Agregar curso</h2>
          <button
            type="button"
            className="repo-outline-button"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
        <InlineError message={error} />
        <div className="repo-maint-form">
          <label className="repo-form-field repo-form-field--wide">
            <span>Nombre del curso</span>
            <input
              value={form.courseName}
              onChange={(event) =>
                setForm({ ...form, courseName: event.target.value })
              }
            />
          </label>
          <label className="repo-form-field">
            <span>Docente</span>
            <select
              value={form.teacherId}
              onChange={(event) =>
                setForm({ ...form, teacherId: event.target.value })
              }
            >
              <option value="">Por asignar</option>
              {teachers.map((teacher) => (
                <option key={teacher.userId} value={teacher.userId}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </label>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Tipo de programa</span>
              <select
                value={form.academicLevel}
                onChange={(event) =>
                  setForm({
                    ...form,
                    academicLevel: event.target.value as AcademicLevel,
                    programId: "",
                  })
                }
              >
                <option value="">Seleccionar</option>
                <option value="UNDERGRADUATE">Pregrado</option>
                <option value="POSTGRADUATE">Posgrado</option>
              </select>
            </label>
            <label className="repo-form-field">
              <span>Programa</span>
              <select
                value={form.programId}
                onChange={(event) =>
                  setForm({ ...form, programId: event.target.value })
                }
              >
                <option value="">Seleccionar</option>
                {filteredPrograms.map((program) => (
                  <option key={program.programId} value={program.programId}>
                    {program.programName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="repo-form-field">
            <span>Semestre</span>
            <select
              value={form.semesterId}
              onChange={(event) =>
                setForm({ ...form, semesterId: event.target.value })
              }
            >
              <option value="">Seleccionar</option>
              {semesters.map((semester) => (
                <option key={semester.semesterId} value={semester.semesterId}>
                  {semester.semesterName}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="repo-checkboxes">
            <legend>Bloques a visualizar:</legend>
            {(["THEORY", "PRACTICE"] as BlockType[]).map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={form.blockTypes.includes(type)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      blockTypes: event.target.checked
                        ? [...form.blockTypes, type]
                        : form.blockTypes.filter((item) => item !== type),
                    })
                  }
                />
                <span>{type === "THEORY" ? "Teoría" : "Práctica"}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </div>
    );
  }

  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <h2>Cursos</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => setView("create")}
        >
          <Plus /> Agregar curso
        </button>
      </div>
      <InlineError message={error} />
      <div className="repo-table-filters">
        <label className="repo-search-field">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
          />
          <Search />
        </label>
        <label className="repo-select-field">
          <span>Semestre</span>
          <select
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
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
          <span>Tipo de programa</span>
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="UNDERGRADUATE">Pregrado</option>
            <option value="POSTGRADUATE">Posgrado</option>
          </select>
        </label>
      </div>
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Nombre del curso</th>
              <th>Programa</th>
              <th>Tipo de programa</th>
              <th>Semestre</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Cargando…</td>
              </tr>
            ) : filtered.length ? (
              filtered.map((offering) => (
                <tr key={offering.offeringId}>
                  <td>{offering.courseName}</td>
                  <td>{offering.programName}</td>
                  <td>
                    {offering.academicLevel === "UNDERGRADUATE"
                      ? "Pregrado"
                      : "Posgrado"}
                  </td>
                  <td>{offering.semesterName}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No hay cursos para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProgramsSection() {
  const [view, setView] = useState<View>("list");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [facultyId, setFacultyId] = useState<number>();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [form, setForm] = useState({
    name: "",
    level: "" as AcademicLevel | "",
    degreeType: "BACHELOR" as Program["degreeType"],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [programData, facultyData] = await Promise.all([
        repositoryService.getPrograms(),
        repositoryService.getFaculties(),
      ]);
      setPrograms(programData.programs);
      setFacultyId(facultyData.faculties[0]?.id);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los programas",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const generatedCode = useMemo(() => {
    const words =
      form.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .match(/[A-Z0-9]+/g) || [];
    const base =
      words.length > 1
        ? words
            .map((word) => word[0])
            .join("")
            .slice(0, 6)
        : (words[0] || "").slice(0, 6);
    let code = base || "PROG";
    let suffix = 2;
    while (programs.some((program) => program.programCode === code))
      code = `${base || "PROG"}${suffix++}`;
    return code;
  }, [form.name, programs]);

  const save = async () => {
    if (!form.name.trim() || !form.level || !facultyId)
      return setError("Completa el nombre y tipo de programa.");
    setSaving(true);
    setError("");
    try {
      await repositoryService.createProgram({
        programName: form.name.trim(),
        programCode: generatedCode,
        facultyId,
        academicLevel: form.level,
        degreeType:
          form.level === "UNDERGRADUATE" ? "BACHELOR" : form.degreeType,
      });
      setForm({ name: "", level: "", degreeType: "MASTER" });
      setView("list");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo agregar el programa",
      );
    } finally {
      setSaving(false);
    }
  };

  if (view === "create")
    return (
      <div className="repo-maint-content">
        <button
          type="button"
          className="repo-back-button"
          onClick={() => setView("list")}
        >
          ‹ Volver a programas
        </button>
        <div className="repo-section-heading">
          <h2>Agregar programa</h2>
          <button
            type="button"
            className="repo-outline-button"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
        <InlineError message={error} />
        <div className="repo-maint-form">
          <label className="repo-form-field repo-form-field--wide">
            <span>Nombre del programa</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <small>
              El código se generará como <strong>{generatedCode}</strong>.
            </small>
          </label>
          <label className="repo-form-field">
            <span>Tipo de programa</span>
            <select
              value={form.level}
              onChange={(event) =>
                setForm({
                  ...form,
                  level: event.target.value as AcademicLevel,
                  degreeType:
                    event.target.value === "UNDERGRADUATE"
                      ? "BACHELOR"
                      : "MASTER",
                })
              }
            >
              <option value="">Seleccionar</option>
              <option value="UNDERGRADUATE">Pregrado</option>
              <option value="POSTGRADUATE">Posgrado</option>
            </select>
          </label>
          {form.level === "POSTGRADUATE" && (
            <label className="repo-form-field">
              <span>Grado</span>
              <select
                value={form.degreeType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    degreeType: event.target.value as Program["degreeType"],
                  })
                }
              >
                <option value="MASTER">Maestría</option>
                <option value="DOCTORATE">Doctorado</option>
                <option value="DIPLOMA">Diplomado</option>
              </select>
            </label>
          )}
        </div>
      </div>
    );

  const filtered = programs.filter(
    (program) =>
      (!search ||
        program.programName.toLowerCase().includes(search.toLowerCase())) &&
      (!levelFilter || program.academicLevel === levelFilter),
  );
  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <h2>Programas</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => setView("create")}
        >
          <Plus /> Agregar programa
        </button>
      </div>
      <InlineError message={error} />
      <div className="repo-table-filters">
        <label className="repo-search-field">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
          />
          <Search />
        </label>
        <label className="repo-select-field">
          <span>Tipo de programa</span>
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="UNDERGRADUATE">Pregrado</option>
            <option value="POSTGRADUATE">Posgrado</option>
          </select>
        </label>
      </div>
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Programa</th>
              <th>Tipo de programa</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2}>Cargando…</td>
              </tr>
            ) : filtered.length ? (
              filtered.map((program) => (
                <tr key={program.programId}>
                  <td>{program.programName}</td>
                  <td>
                    {program.academicLevel === "UNDERGRADUATE"
                      ? "Pregrado"
                      : "Posgrado"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2}>No hay programas para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeachersSection() {
  const [view, setView] = useState<View>("list");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", familyName: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resendingEmail, setResendingEmail] = useState("");
  const [resettingEmail, setResettingEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  }>();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTeachers((await repositoryService.getTeachers()).users);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los docentes",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const save = async () => {
    if (!form.name.trim() || !form.familyName.trim() || !form.email.trim())
      return setError("Completa el nombre, apellido y correo.");
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const temporaryPassword = generateTemporaryPassword();
      await repositoryService.createTeacher({
        email: form.email.trim(),
        name: form.name.trim(),
        familyName: form.familyName.trim(),
        temporaryPassword,
      });
      setCreatedCredentials({
        email: form.email.trim(),
        password: temporaryPassword,
      });
      setCopied(false);
      setForm({ name: "", familyName: "", email: "" });
      setView("list");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo agregar el docente",
      );
    } finally {
      setSaving(false);
    }
  };
  const resendInvitation = async (email: string) => {
    setResendingEmail(email);
    setError("");
    setNotice("");
    try {
      await repositoryService.resendTeacherInvitation(email);
      setNotice(`Cognito aceptó el reenvío de la invitación a ${email}.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo reenviar la invitación",
      );
    } finally {
      setResendingEmail("");
    }
  };
  const resetTemporaryPassword = async (email: string) => {
    setResettingEmail(email);
    setError("");
    setNotice("");
    try {
      const temporaryPassword = generateTemporaryPassword();
      await repositoryService.resetTeacherTemporaryPassword(
        email,
        temporaryPassword,
      );
      setCreatedCredentials({ email, password: temporaryPassword });
      setCopied(false);
      setNotice(
        `Se generó una nueva contraseña temporal para ${email}. Entrégasela de forma segura al docente.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo generar la contraseña temporal",
      );
    } finally {
      setResettingEmail("");
    }
  };
  const copyCredentials = async () => {
    if (!createdCredentials) return;
    try {
      await navigator.clipboard.writeText(
        `Usuario: ${createdCredentials.email}\nContraseña temporal: ${createdCredentials.password}`,
      );
      setCopied(true);
    } catch {
      setError("No se pudo copiar. Selecciona la contraseña y cópiala manualmente.");
    }
  };
  if (view === "create")
    return (
      <div className="repo-maint-content">
        <button
          type="button"
          className="repo-back-button"
          onClick={() => setView("list")}
        >
          ‹ Volver a docentes
        </button>
        <div className="repo-section-heading">
          <h2>Agregar docente</h2>
          <button
            type="button"
            className="repo-outline-button"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
        <InlineError message={error} />
        <div className="repo-maint-form">
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Nombre del docente</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Apellidos</span>
              <input
                value={form.familyName}
                onChange={(event) =>
                  setForm({ ...form, familyName: event.target.value })
                }
              />
            </label>
          </div>
          <label className="repo-form-field repo-form-field--wide">
            <span>Correo institucional</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
            <small>
              Se enviará una invitación y también se mostrará una contraseña
              temporal por única vez.
            </small>
          </label>
        </div>
      </div>
    );
  const filtered = teachers.filter(
    (teacher) =>
      !search ||
      teacher.fullName.toLowerCase().includes(search.toLowerCase()) ||
      teacher.email.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <h2>Docentes</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => setView("create")}
        >
          <Plus /> Agregar docente
        </button>
      </div>
      <InlineError message={error} />
      {notice && <div className="repo-alert repo-alert--success">{notice}</div>}
      {createdCredentials && (
        <div className="repo-credentials" role="status">
          <div>
            <strong>Acceso temporal del docente</strong>
            <p>
              Guarda estas credenciales ahora. La contraseña temporal solo se
              muestra en esta sesión y el docente deberá cambiarla al iniciar.
            </p>
          </div>
          <dl>
            <div>
              <dt>Usuario</dt>
              <dd>{createdCredentials.email}</dd>
            </div>
            <div>
              <dt>Contraseña temporal</dt>
              <dd>
                <code>{createdCredentials.password}</code>
              </dd>
            </div>
          </dl>
          <button
            type="button"
            className="repo-outline-button"
            onClick={() => void copyCredentials()}
          >
            <Copy /> {copied ? "Copiado" : "Copiar credenciales"}
          </button>
        </div>
      )}
      <div className="repo-table-filters">
        <label className="repo-search-field">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
          />
          <Search />
        </label>
      </div>
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Docente</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3}>Cargando…</td>
              </tr>
            ) : filtered.length ? (
              filtered.map((teacher) => (
                <tr key={teacher.userId}>
                  <td>{teacher.fullName}</td>
                  <td>{teacher.email}</td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => void resendInvitation(teacher.email)}
                        disabled={resendingEmail === teacher.email}
                      >
                        <Send />
                        {resendingEmail === teacher.email
                          ? "Reenviando…"
                          : "Reenviar invitación"}
                      </button>
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() =>
                          void resetTemporaryPassword(teacher.email)
                        }
                        disabled={resettingEmail === teacher.email}
                      >
                        <KeyRound />
                        {resettingEmail === teacher.email
                          ? "Generando…"
                          : "Generar clave temporal"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No hay docentes para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Maintenance() {
  const backendUser = useAuthStore((state) => state.backendUser);
  const [section, setSection] = useState<Section>("courses");
  if (!backendUser)
    return (
      <div className="repo-page-state">
        <span className="repo-spinner" />
        Cargando permisos…
      </div>
    );
  if (backendUser.role.roleName !== "Admin") return <Unauthorized />;
  return (
    <section>
      <h1 className="repo-page-title">Mantenimiento</h1>
      <div className="repo-maint-layout">
        <aside className="repo-maint-sidebar">
          {(["courses", "programs", "teachers"] as Section[]).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setSection(item)}
              className={section === item ? "active" : ""}
            >
              {item === "courses"
                ? "Cursos"
                : item === "programs"
                  ? "Programas"
                  : "Docentes"}
            </button>
          ))}
        </aside>
        {section === "courses" && <CoursesSection />}
        {section === "programs" && <ProgramsSection />}
        {section === "teachers" && <TeachersSection />}
      </div>
    </section>
  );
}
