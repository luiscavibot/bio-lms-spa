import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
  type CurriculumPlan,
} from "@/services/repositoryService";

export function CurriculumPlansManagement() {
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<CurriculumPlan | null>();
  const [deletingPlan, setDeletingPlan] = useState<CurriculumPlan | null>(null);
  const [planCode, setPlanCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPlans((await repositoryService.getCurriculumPlans()).plans);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar los planes curriculares",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = (plan?: CurriculumPlan) => {
    setError("");
    setEditingPlan(plan || null);
    setPlanCode(plan?.planCode || "");
    setIsActive(plan?.isActive ?? true);
  };

  const save = async () => {
    if (!planCode.trim()) {
      setError("Ingresa el nombre o año del plan curricular.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingPlan) {
        await repositoryService.updateCurriculumPlan(editingPlan.planId, {
          planCode: planCode.trim(),
          isActive,
        });
      } else {
        await repositoryService.createCurriculumPlan({
          planCode: planCode.trim(),
        });
      }
      setEditingPlan(undefined);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo guardar el plan curricular",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingPlan) return;
    setDeletePending(true);
    setError("");
    try {
      await repositoryService.deleteCurriculumPlan(deletingPlan.planId);
      setDeletingPlan(null);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar el plan curricular",
      );
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div className="repo-maint-content">
      <div className="repo-section-heading">
        <div>
          <h2>Planes curriculares</h2>
          <p>Administra los planes disponibles para la definición de cursos.</p>
        </div>
        <button
          type="button"
          className="repo-outline-button"
          onClick={() => openEditor()}
        >
          <Plus /> Agregar plan
        </button>
      </div>

      {error && <div className="repo-alert repo-alert--error">{error}</div>}

      <div className="repo-data-table-wrap">
        <table className="repo-data-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Cursos asociados</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Cargando…</td>
              </tr>
            ) : plans.length ? (
              plans.map((plan) => (
                <tr key={plan.planId}>
                  <td>
                    <strong>{plan.planCode}</strong>
                  </td>
                  <td>{plan.courseCount}</td>
                  <td>
                    <span
                      className={
                        plan.isActive
                          ? "repo-status repo-status--active"
                          : "repo-status"
                      }
                    >
                      {plan.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="repo-table-actions">
                      <button
                        type="button"
                        className="repo-table-action"
                        onClick={() => openEditor(plan)}
                      >
                        <Pencil /> Editar
                      </button>
                      <button
                        type="button"
                        className="repo-table-action repo-table-action--danger"
                        onClick={() => setDeletingPlan(plan)}
                        disabled={plan.courseCount > 0}
                        title={
                          plan.courseCount > 0
                            ? "No puede eliminarse mientras tenga cursos asociados"
                            : undefined
                        }
                      >
                        <Trash2 /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No hay planes curriculares.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={editingPlan !== undefined}
        onOpenChange={(open) => !open && setEditingPlan(undefined)}
      >
        <DialogContent className="repo-maint-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Editar plan curricular" : "Agregar plan curricular"}
            </DialogTitle>
            <DialogDescription>
              Usa el año o nombre con el que se identificará el plan en los cursos.
            </DialogDescription>
          </DialogHeader>
          <label className="repo-form-field">
            <span>Plan curricular</span>
            <input
              value={planCode}
              maxLength={32}
              placeholder="Ej. 2024"
              onChange={(event) => setPlanCode(event.target.value)}
            />
          </label>
          {editingPlan && (
            <label className="repo-form-field">
              <span>Estado</span>
              <select
                value={isActive ? "active" : "inactive"}
                onChange={(event) => setIsActive(event.target.value === "active")}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              <small>
                Un plan inactivo sigue visible en sus cursos, pero no puede asignarse a
                cursos nuevos.
              </small>
            </label>
          )}
          {error && <div className="repo-alert repo-alert--error">{error}</div>}
          <button
            type="button"
            className="repo-primary-button"
            onClick={() => void save()}
            disabled={saving || !planCode.trim()}
          >
            {saving ? "Guardando…" : "Guardar plan"}
          </button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingPlan}
        onOpenChange={(open) => !open && setDeletingPlan(null)}
        title="Eliminar plan curricular"
        description={`Se eliminará el plan “${deletingPlan?.planCode || ""}”. Esta acción no se puede deshacer.`}
        pending={deletePending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
