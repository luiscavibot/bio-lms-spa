import { Copy, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  repositoryService,
  type Student,
} from "@/services/repositoryService";

type View = "list" | "create";

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const random = Array.from(
    bytes,
    (value) => alphabet[value % alphabet.length],
  ).join("");
  return `Bio#${random}Aa1!`;
}

export function StudentsManagement() {
  const [view, setView] = useState<View>("list");
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", familyName: "", email: "" });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "" });
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  }>();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStudents((await repositoryService.getStudents()).users);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los alumnos",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return students.filter(
      (student) =>
        !normalizedSearch ||
        student.fullName.toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch) ||
        student.code?.toLowerCase().includes(normalizedSearch),
    );
  }, [students, search]);

  const saveStudent = async () => {
    if (!form.name.trim() || !form.familyName.trim() || !form.email.trim()) {
      setError("Completa el nombre, los apellidos y el correo del alumno.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const temporaryPassword = generateTemporaryPassword();
      await repositoryService.createStudent({
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
        reason instanceof Error ? reason.message : "No se pudo agregar el alumno",
      );
    } finally {
      setSaving(false);
    }
  };

  const openStudentEditor = (student: Student) => {
    setError("");
    setEditingStudent(student);
    setEditForm({ firstName: student.firstName, lastName: student.lastName });
  };

  const saveStudentEdit = async () => {
    if (!editingStudent || !editForm.firstName.trim() || !editForm.lastName.trim()) {
      setError("Completa el nombre y los apellidos del alumno.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.updateStudent(editingStudent.userId, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      });
      setEditingStudent(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo editar el alumno",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteStudent = async () => {
    if (!deletingStudent) return;
    setDeletePending(true);
    setError("");
    try {
      await repositoryService.deleteStudent(deletingStudent.email);
      setDeletingStudent(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo eliminar el alumno",
      );
    } finally {
      setDeletePending(false);
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
      setError("No se pudo copiar. Copia las credenciales manualmente.");
    }
  };

  if (view === "create") {
    return (
      <div className="repo-maint-content">
        <button
          type="button"
          className="repo-back-button"
          onClick={() => setView("list")}
        >
          ‹ Volver a alumnos
        </button>
        <div className="repo-section-heading">
          <h2>Agregar alumno</h2>
          <button
            type="button"
            className="repo-outline-button"
            onClick={() => void saveStudent()}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
        {error && <div className="repo-alert repo-alert--error">{error}</div>}
        <div className="repo-maint-form">
          <div className="repo-form-row">
            <label className="repo-form-field">
              <span>Nombre del alumno</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
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
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <small>
              Se creará su acceso y se mostrará una contraseña temporal por única vez.
            </small>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <h2>Alumnos</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => setView("create")}
        >
          <Plus /> Agregar alumno
        </button>
      </div>
      {error && <div className="repo-alert repo-alert--error">{error}</div>}
      {createdCredentials && (
        <div className="repo-credentials" role="status">
          <div>
            <strong>Acceso temporal del alumno</strong>
            <p>
              Guarda estas credenciales ahora. El alumno deberá cambiar la contraseña al
              iniciar sesión.
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
            placeholder="Buscar alumno"
          />
          <Search />
        </label>
      </div>
      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Código</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Cargando…</td>
              </tr>
            ) : filteredStudents.length ? (
              filteredStudents.map((student) => (
                <tr key={student.userId}>
                  <td>{student.fullName}</td>
                  <td>{student.code}</td>
                  <td>{student.email}</td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => openStudentEditor(student)}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeletingStudent(student)}
                      >
                        <Trash2 /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No hay alumnos para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
      >
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>Editar alumno</DialogTitle>
            <DialogDescription>Actualiza los datos personales del alumno.</DialogDescription>
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
            <input value={editingStudent?.email || ""} readOnly disabled />
          </label>
          {error && <div className="repo-alert repo-alert--error">{error}</div>}
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveStudentEdit()}
            disabled={saving || !editForm.firstName.trim() || !editForm.lastName.trim()}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingStudent}
        onOpenChange={(open) => !open && setDeletingStudent(null)}
        title="Eliminar alumno"
        description={`Se eliminará la cuenta de “${deletingStudent?.fullName || ""}” y también se retirarán sus matrículas activas.`}
        pending={deletePending}
        onConfirm={confirmDeleteStudent}
      />
    </div>
  );
}
