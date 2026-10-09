import { Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OfferingPicker } from "@/components/maintenance/OfferingPicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  repositoryService,
  type Enrollment,
  type Student,
} from "@/services/repositoryService";

const statusLabels: Record<Enrollment["status"], string> = {
  ACTIVE: "Activa",
  COMPLETED: "Completada",
  DROPPED: "Retirada",
  WITHDRAWN: "Retirada",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

export function EnrollmentsManagement() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ userId: "", courseOfferingId: "" });
  const [deletingEnrollment, setDeletingEnrollment] =
    useState<Enrollment | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [enrollmentData, studentData] = await Promise.all([
        repositoryService.getEnrollments(),
        repositoryService.getStudents(),
      ]);
      setEnrollments(enrollmentData.enrollments);
      setStudents(studentData.users);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar las matrículas",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredEnrollments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return enrollments.filter(
      (enrollment) =>
        !normalizedSearch ||
        enrollment.studentName.toLowerCase().includes(normalizedSearch) ||
        enrollment.studentCode.toLowerCase().includes(normalizedSearch) ||
        enrollment.courseName.toLowerCase().includes(normalizedSearch) ||
        enrollment.courseCode.toLowerCase().includes(normalizedSearch),
    );
  }, [enrollments, search]);

  // Offerings the chosen student is already actively enrolled in are hidden from the picker.
  const enrolledOfferingIds = useMemo(() => {
    if (!form.userId) return new Set<number>();
    return new Set(
      enrollments
        .filter(
          (enrollment) =>
            enrollment.userId === Number(form.userId) &&
            enrollment.status === "ACTIVE",
        )
        .map((enrollment) => enrollment.courseOfferingId),
    );
  }, [enrollments, form.userId]);

  const closeDialog = () => {
    setDialogOpen(false);
    setForm({ userId: "", courseOfferingId: "" });
  };

  const saveEnrollment = async () => {
    if (!form.userId || !form.courseOfferingId) {
      setError("Selecciona un alumno y un curso.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repositoryService.createEnrollment({
        userId: Number(form.userId),
        courseOfferingId: Number(form.courseOfferingId),
      });
      closeDialog();
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo crear la matrícula",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteEnrollment = async () => {
    if (!deletingEnrollment) return;
    setDeletePending(true);
    setError("");
    try {
      await repositoryService.deleteEnrollment(
        deletingEnrollment.enrollmentId,
      );
      setDeletingEnrollment(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo retirar la matrícula",
      );
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <h2>Matrículas</h2>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => setDialogOpen(true)}
          disabled={loading || students.length === 0}
          title={students.length === 0 ? "Primero agrega un alumno" : undefined}
        >
          <Plus /> Nueva matrícula
        </button>
      </div>

      {error && <div className="repo-alert repo-alert--error">{error}</div>}

      <label className="repo-search-field">
        <Search />
        <input
          type="search"
          placeholder="Buscar alumno o curso"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Curso</th>
              <th>Semestre</th>
              <th>Práctica</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Cargando…</td>
              </tr>
            ) : filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={7} className="repo-empty">
                  {search
                    ? "No se encontraron matrículas."
                    : "Aún no hay matrículas registradas."}
                </td>
              </tr>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.enrollmentId}>
                  <td>
                    <strong className="block">{enrollment.studentName}</strong>
                    <small className="block text-slate-500">
                      {enrollment.studentCode}
                    </small>
                  </td>
                  <td>
                    <strong className="block">{enrollment.courseName}</strong>
                    <small className="block text-slate-500">
                      {enrollment.courseCode}
                    </small>
                  </td>
                  <td>{enrollment.semesterName}</td>
                  <td>{enrollment.practiceBlockName || "Sin asignar"}</td>
                  <td>
                    <span
                      className={
                        enrollment.status === "ACTIVE"
                          ? "repo-status repo-status--active"
                          : "repo-status"
                      }
                    >
                      {statusLabels[enrollment.status]}
                    </span>
                  </td>
                  <td>{formatDate(enrollment.enrollmentDate)}</td>
                  <td>
                    <button
                      type="button"
                      className="repo-table-action repo-table-action--danger"
                      onClick={() => setDeletingEnrollment(enrollment)}
                      disabled={enrollment.status !== "ACTIVE"}
                    >
                      <Trash2 /> Retirar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>Nueva matrícula</DialogTitle>
            <DialogDescription>
              Asigna un alumno a uno de los cursos disponibles.
            </DialogDescription>
          </DialogHeader>
          <label className="repo-form-field">
            <span>Alumno</span>
            <select
              value={form.userId}
              onChange={(event) =>
                setForm({
                  userId: event.target.value,
                  courseOfferingId: "",
                })
              }
            >
              <option value="">Seleccionar alumno</option>
              {students.map((student) => (
                <option key={student.userId} value={student.userId}>
                  {student.fullName} — {student.code || student.email}
                </option>
              ))}
            </select>
          </label>
          <OfferingPicker
            value={form.courseOfferingId}
            onChange={(courseOfferingId) => setForm({ ...form, courseOfferingId })}
            excludeIds={enrolledOfferingIds}
            disabled={!form.userId}
            disabledHint="Elige primero al alumno."
          />
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void saveEnrollment()}
            disabled={saving || !form.userId || !form.courseOfferingId}
          >
            {saving ? "Matriculando…" : "Matricular alumno"}
          </button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingEnrollment}
        onOpenChange={(open) => !open && setDeletingEnrollment(null)}
        title="Retirar matrícula"
        description={`Se retirará a “${deletingEnrollment?.studentName || ""}” del curso “${deletingEnrollment?.courseName || ""}”.`}
        confirmLabel="Retirar"
        pending={deletePending}
        onConfirm={confirmDeleteEnrollment}
      />
    </div>
  );
}
