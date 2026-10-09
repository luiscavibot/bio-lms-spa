import {
  Copy,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Unauthorized } from "@/pages/Unauthorized";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EnrollmentsManagement } from "@/components/maintenance/EnrollmentsManagement";
import { StudentsManagement } from "@/components/maintenance/StudentsManagement";
import { CourseBlocksManagement } from "@/components/maintenance/CourseBlocksManagement";
import { CurriculumPlansManagement } from "@/components/maintenance/CurriculumPlansManagement";
import { CourseCatalogSection } from "@/components/maintenance/CourseCatalogSection";
import { OfferingsSection } from "@/components/maintenance/OfferingsSection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  repositoryService,
  type AcademicLevel,
  type Course,
  type Program,
  type Semester,
  type Teacher,
} from "@/services/repositoryService";
import { copyText } from "@/lib/copyText";

type Section =
  | "courses"
  | "offerings"
  | "blocks"
  | "programs"
  | "plans"
  | "semesters"
  | "teachers"
  | "students"
  | "enrollments";
type View = "list" | "create";

const maintenanceSections: { id: Section; label: string }[] = [
  { id: "courses", label: "Cursos" },
  { id: "offerings", label: "Ofertas" },
  { id: "blocks", label: "Bloques" },
  { id: "programs", label: "Programas" },
  { id: "plans", label: "Planes" },
  { id: "semesters", label: "Semestres" },
  { id: "teachers", label: "Docentes" },
  { id: "students", label: "Alumnos" },
  { id: "enrollments", label: "Matrículas" },
];

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
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
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    level: "UNDERGRADUATE" as AcademicLevel,
    degreeType: "BACHELOR" as Program["degreeType"],
  });

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

  const openProgramEditor = (program: Program) => {
    setError("");
    setEditingProgram(program);
    setEditForm({
      name: program.programName,
      code: program.programCode,
      level: program.academicLevel,
      degreeType: program.degreeType,
    });
  };

  const saveProgramEdit = async () => {
    if (!editingProgram || !editForm.name.trim() || !editForm.code.trim()) {
      setError("Completa el nombre y el código del programa.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.updateProgram(editingProgram.programId, {
        programName: editForm.name.trim(),
        programCode: editForm.code.trim().toUpperCase(),
        academicLevel: editForm.level,
        degreeType:
          editForm.level === "UNDERGRADUATE" ? "BACHELOR" : editForm.degreeType,
      });
      setEditingProgram(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo editar el programa",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProgram = async () => {
    if (!deletingProgram) return;
    setDeletePending(true);
    setError("");
    try {
      await repositoryService.deleteProgram(deletingProgram.programId);
      setDeletingProgram(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar el programa",
      );
    } finally {
      setDeletePending(false);
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3}>Cargando…</td>
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
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => openProgramEditor(program)}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeletingProgram(program)}
                      >
                        <Trash2 /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No hay programas para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog
        open={!!editingProgram}
        onOpenChange={(open) => !open && setEditingProgram(null)}
      >
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>Editar programa</DialogTitle>
            <DialogDescription>
              Actualiza los datos del programa académico.
            </DialogDescription>
          </DialogHeader>
          <label className="repo-form-field">
            <span>Nombre del programa</span>
            <input
              value={editForm.name}
              onChange={(event) =>
                setEditForm({ ...editForm, name: event.target.value })
              }
            />
          </label>
          <label className="repo-form-field">
            <span>Código</span>
            <input
              value={editForm.code}
              onChange={(event) =>
                setEditForm({ ...editForm, code: event.target.value })
              }
            />
          </label>
          <label className="repo-form-field">
            <span>Tipo de programa</span>
            <select
              value={editForm.level}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  level: event.target.value as AcademicLevel,
                  degreeType:
                    event.target.value === "UNDERGRADUATE"
                      ? "BACHELOR"
                      : "MASTER",
                })
              }
            >
              <option value="UNDERGRADUATE">Pregrado</option>
              <option value="POSTGRADUATE">Posgrado</option>
            </select>
          </label>
          {editForm.level === "POSTGRADUATE" && (
            <label className="repo-form-field">
              <span>Grado</span>
              <select
                value={editForm.degreeType}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
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
          <InlineError message={error} />
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveProgramEdit()}
            disabled={saving || !editForm.name.trim() || !editForm.code.trim()}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deletingProgram}
        onOpenChange={(open) => !open && setDeletingProgram(null)}
        title="Eliminar programa"
        description={`Se eliminará “${deletingProgram?.programName || ""}” del catálogo. Esta acción no se puede deshacer.`}
        pending={deletePending}
        onConfirm={confirmDeleteProgram}
      />
    </div>
  );
}

function SemestersSection() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [editingSemester, setEditingSemester] = useState<Semester | null>();
  const [deletingSemester, setDeletingSemester] = useState<Semester | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    year: String(new Date().getFullYear()),
    period: "1",
    startDate: "",
    endDate: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSemesters((await repositoryService.getSemesters()).semesters);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los semestres",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openSemesterEditor = (semester?: Semester) => {
    setError("");
    setEditingSemester(semester || null);
    setForm(
      semester
        ? {
            year: String(semester.year),
            period: String(semester.period),
            startDate: semester.startDate.slice(0, 10),
            endDate: semester.endDate.slice(0, 10),
          }
        : {
            year: String(new Date().getFullYear()),
            period: "1",
            startDate: "",
            endDate: "",
          },
    );
  };

  const saveSemester = async () => {
    const year = Number(form.year);
    const period = Number(form.period);
    if (
      year < 2020 ||
      year > 2100 ||
      ![1, 2].includes(period) ||
      !form.startDate ||
      !form.endDate
    ) {
      setError("Completa el año, periodo y las fechas del semestre.");
      return;
    }
    if (form.endDate <= form.startDate) {
      setError("La fecha de fin debe ser posterior a la fecha de inicio.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = {
        year,
        period,
        startDate: form.startDate,
        endDate: form.endDate,
      };
      if (editingSemester) {
        await repositoryService.updateSemester(
          editingSemester.semesterId,
          data,
        );
      } else {
        await repositoryService.createSemester(data);
      }
      setEditingSemester(undefined);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo guardar el semestre",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteSemester = async () => {
    if (!deletingSemester) return;
    setDeletePending(true);
    setError("");
    try {
      await repositoryService.deleteSemester(deletingSemester.semesterId);
      setDeletingSemester(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar el semestre",
      );
    } finally {
      setDeletePending(false);
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "UTC" })
      .format(new Date(value))
      .replace(".", "");

  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <h2>Semestres</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => openSemesterEditor()}
        >
          <Plus /> Agregar semestre
        </button>
      </div>
      <InlineError message={error} />
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Semestre</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Cargando…</td>
              </tr>
            ) : semesters.length ? (
              semesters.map((semester) => (
                <tr key={semester.semesterId}>
                  <td>{semester.semesterName}</td>
                  <td>{formatDate(semester.startDate)}</td>
                  <td>{formatDate(semester.endDate)}</td>
                  <td>
                    <span
                      className={
                        semester.isActive
                          ? "repo-status repo-status--active"
                          : "repo-status"
                      }
                    >
                      {semester.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => openSemesterEditor(semester)}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeletingSemester(semester)}
                      >
                        <Trash2 /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No hay semestres para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog
        open={editingSemester !== undefined}
        onOpenChange={(open) => !open && setEditingSemester(undefined)}
      >
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingSemester ? "Editar semestre" : "Agregar semestre"}
            </DialogTitle>
            <DialogDescription>
              Define el periodo académico y sus fechas de vigencia.
            </DialogDescription>
          </DialogHeader>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Año</span>
              <input
                type="number"
                min="2020"
                max="2100"
                value={form.year}
                onChange={(event) =>
                  setForm({ ...form, year: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Periodo</span>
              <select
                value={form.period}
                onChange={(event) =>
                  setForm({ ...form, period: event.target.value })
                }
              >
                <option value="1">I</option>
                <option value="2">II</option>
              </select>
            </label>
          </div>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Fecha de inicio</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm({ ...form, startDate: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Fecha de fin</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm({ ...form, endDate: event.target.value })
                }
              />
            </label>
          </div>
          <InlineError message={error} />
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveSemester()}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar semestre"}
          </button>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deletingSemester}
        onOpenChange={(open) => !open && setDeletingSemester(null)}
        title="Eliminar semestre"
        description={`Se eliminará “${deletingSemester?.semesterName || ""}” del catálogo. Esta acción no se puede deshacer.`}
        pending={deletePending}
        onConfirm={confirmDeleteSemester}
      />
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
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "" });
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
      const response = await repositoryService.resetTeacherTemporaryPassword(
        email,
        temporaryPassword,
      );
      setCreatedCredentials({ email, password: temporaryPassword });
      setCopied(false);
      setNotice(
        response.accountProvisioned
          ? `Se creó y vinculó la cuenta de acceso de ${email}. Entrégale la contraseña temporal de forma segura.`
          : `Se generó una nueva contraseña temporal para ${email}. Entrégasela de forma segura al docente.`,
      );
      if (response.accountProvisioned) await load();
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
  const openTeacherEditor = (teacher: Teacher) => {
    setError("");
    setEditingTeacher(teacher);
    setEditForm({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
    });
  };
  const saveTeacherEdit = async () => {
    if (
      !editingTeacher ||
      !editForm.firstName.trim() ||
      !editForm.lastName.trim()
    ) {
      setError("Completa el nombre y los apellidos del docente.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.updateTeacher(editingTeacher.userId, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      });
      setEditingTeacher(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo editar el docente",
      );
    } finally {
      setSaving(false);
    }
  };
  const confirmDeleteTeacher = async () => {
    if (!deletingTeacher) return;
    setDeletePending(true);
    setError("");
    setNotice("");
    try {
      await repositoryService.deleteTeacher(deletingTeacher.email);
      setDeletingTeacher(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar el docente",
      );
    } finally {
      setDeletePending(false);
    }
  };
  const copyCredentials = async () => {
    if (!createdCredentials) return;
    try {
      await copyText(
        `Usuario: ${createdCredentials.email}\nContraseña temporal: ${createdCredentials.password}`,
      );
      setCopied(true);
    } catch {
      setError(
        "No se pudo copiar. Selecciona la contraseña y cópiala manualmente.",
      );
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
              <th>Acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Cargando…</td>
              </tr>
            ) : filtered.length ? (
              filtered.map((teacher) => (
                <tr key={teacher.userId}>
                  <td>{teacher.fullName}</td>
                  <td>{teacher.email}</td>
                  <td>
                    <span
                      className={`repo-access-status ${
                        teacher.authProvider === "AWS_COGNITO"
                          ? "repo-access-status--linked"
                          : "repo-access-status--local"
                      }`}
                    >
                      {teacher.authProvider === "AWS_COGNITO"
                        ? "Cuenta vinculada"
                        : "Sin acceso"}
                    </span>
                  </td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => void resendInvitation(teacher.email)}
                        disabled={
                          resendingEmail === teacher.email ||
                          teacher.authProvider !== "AWS_COGNITO"
                        }
                        title={
                          teacher.authProvider === "AWS_COGNITO"
                            ? "Reenviar invitación temporal"
                            : "Primero crea el acceso con una clave temporal"
                        }
                      >
                        <Send />
                        {resendingEmail === teacher.email
                          ? "Reenviando…"
                          : "Reenviar"}
                      </button>
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => openTeacherEditor(teacher)}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeletingTeacher(teacher)}
                      >
                        <Trash2 /> Eliminar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() =>
                          void resetTemporaryPassword(teacher.email)
                        }
                        disabled={resettingEmail === teacher.email}
                        title={
                          teacher.authProvider === "LOCAL"
                            ? "Crear y vincular una cuenta con contraseña temporal"
                            : "Generar una nueva contraseña temporal"
                        }
                      >
                        <KeyRound />
                        {resettingEmail === teacher.email
                          ? "Generando…"
                          : teacher.authProvider === "LOCAL"
                            ? "Crear acceso"
                            : "Nueva clave"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No hay docentes para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog
        open={!!editingTeacher}
        onOpenChange={(open) => !open && setEditingTeacher(null)}
      >
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>Editar docente</DialogTitle>
            <DialogDescription>
              Actualiza la información personal del docente.
            </DialogDescription>
          </DialogHeader>
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Nombre</span>
              <input
                value={editForm.firstName}
                onChange={(event) =>
                  setEditForm({ ...editForm, firstName: event.target.value })
                }
              />
            </label>
            <label className="repo-form-field">
              <span>Apellidos</span>
              <input
                value={editForm.lastName}
                onChange={(event) =>
                  setEditForm({ ...editForm, lastName: event.target.value })
                }
              />
            </label>
          </div>
          <label className="repo-form-field">
            <span>Correo institucional</span>
            <input value={editingTeacher?.email || ""} readOnly disabled />
          </label>
          <InlineError message={error} />
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveTeacherEdit()}
            disabled={
              saving || !editForm.firstName.trim() || !editForm.lastName.trim()
            }
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deletingTeacher}
        onOpenChange={(open) => !open && setDeletingTeacher(null)}
        title="Eliminar docente"
        description={`Se eliminará la cuenta de “${deletingTeacher?.fullName || ""}” y perderá el acceso al repositorio. Esta acción no se puede deshacer.`}
        pending={deletePending}
        onConfirm={confirmDeleteTeacher}
      />
    </div>
  );
}

export function Maintenance() {
  const backendUser = useAuthStore((state) => state.backendUser);
  const [section, setSection] = useState<Section>("courses");
  // Opening Ofertas from a course: filtered by it, or creating an offering of it.
  const [offeringContext, setOfferingContext] = useState<{
    course: Course;
    creating: boolean;
    key: number;
  }>();
  const openOfferings = (course: Course, creating: boolean) => {
    setOfferingContext({ course, creating, key: Date.now() });
    setSection("offerings");
  };
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
          {maintenanceSections.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                setOfferingContext(undefined);
                setSection(item.id);
              }}
              className={section === item.id ? "active" : ""}
            >
              {item.label}
            </button>
          ))}
        </aside>
        {section === "courses" && (
          <CourseCatalogSection
            onShowOfferings={(course) => openOfferings(course, false)}
            onCreateOffering={(course) => openOfferings(course, true)}
          />
        )}
        {section === "offerings" && (
          <OfferingsSection
            key={offeringContext?.key ?? 0}
            initialCourse={offeringContext?.course}
            startCreating={offeringContext?.creating}
          />
        )}
        {section === "blocks" && <CourseBlocksManagement />}
        {section === "programs" && <ProgramsSection />}
        {section === "plans" && <CurriculumPlansManagement />}
        {section === "semesters" && <SemestersSection />}
        {section === "teachers" && <TeachersSection />}
        {section === "students" && <StudentsManagement />}
        {section === "enrollments" && <EnrollmentsManagement />}
      </div>
    </section>
  );
}
