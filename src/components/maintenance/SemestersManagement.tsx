/**
 * Gestión de Semestres/Periodos Académicos
 */

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { semesterService, type SemesterDto } from '@/services/semesterService';

interface SemesterForm {
	year: number;
	period: number;
	startDate: string;
	endDate: string;
}

export function SemestersManagement() {
	const [semesters, setSemesters] = useState<SemesterDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSemester, setEditingSemester] = useState<SemesterDto | null>(
		null
	);
	const [formData, setFormData] = useState<SemesterForm>({
		year: new Date().getFullYear(),
		period: 1,
		startDate: '',
		endDate: '',
	});

	useEffect(() => {
		loadSemesters();
	}, []);

	const loadSemesters = async () => {
		setLoading(true);
		try {
			const data = await semesterService.getAll();
			setSemesters(data.semesters);
		} catch (error) {
			console.error('Error al cargar semestres:', error);
			alert(
				'Error al cargar los semestres. Por favor, intenta de nuevo.'
			);
		} finally {
			setLoading(false);
		}
	};

	const handleOpenDialog = (semester?: SemesterDto) => {
		if (semester) {
			setEditingSemester(semester);
			setFormData({
				year: semester.year,
				period: semester.period,
				startDate: semester.startDate,
				endDate: semester.endDate,
			});
		} else {
			setEditingSemester(null);
			setFormData({
				year: new Date().getFullYear(),
				period: 1,
				startDate: '',
				endDate: '',
			});
		}
		setDialogOpen(true);
	};

	const handleSave = async () => {
		try {
			if (editingSemester) {
				await semesterService.update(
					editingSemester.semesterId,
					formData
				);
			} else {
				await semesterService.create(formData);
			}
			setDialogOpen(false);
			loadSemesters();
		} catch (error) {
			console.error('Error al guardar semestre:', error);
			alert(
				'Error al guardar el semestre. Por favor, verifica los datos.'
			);
		}
	};

	const handleDelete = async (semesterId: number) => {
		if (!confirm('¿Estás seguro de eliminar este semestre?')) return;

		try {
			await semesterService.delete(semesterId);
			loadSemesters();
		} catch (error) {
			console.error('Error al eliminar semestre:', error);
			alert(
				'Error al eliminar el semestre. Puede que esté siendo utilizado.'
			);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button onClick={() => handleOpenDialog()} className="gap-2">
					<Plus className="w-4 h-4" />
					Nuevo Semestre
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{loading ? (
					<div className="col-span-2 text-center py-8 text-muted-foreground">
						Cargando...
					</div>
				) : semesters.length === 0 ? (
					<div className="col-span-2 text-center py-8 text-muted-foreground">
						No hay semestres registrados
					</div>
				) : (
					semesters.map((semester) => (
						<div
							key={semester.semesterId}
							className="border rounded-lg p-4 space-y-3"
						>
							<div className="flex items-start justify-between">
								<div>
									<h3 className="font-semibold text-lg">
										{semester.name}
									</h3>
									<p className="text-sm text-muted-foreground">
										{new Date(
											semester.startDate
										).toLocaleDateString()}{' '}
										-{' '}
										{new Date(
											semester.endDate
										).toLocaleDateString()}
									</p>
								</div>
								{semester.isActive && (
									<span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
										Activo
									</span>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleOpenDialog(semester)}
									className="gap-2"
								>
									<Edit className="w-3 h-3" />
									Editar
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										handleDelete(semester.semesterId)
									}
									className="gap-2 text-destructive hover:text-destructive"
								>
									<Trash2 className="w-3 h-3" />
									Eliminar
								</Button>
							</div>
						</div>
					))
				)}
			</div>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingSemester
								? 'Editar Semestre'
								: 'Nuevo Semestre'}
						</DialogTitle>
						<DialogDescription>
							Configura el periodo académico
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">
									Año
								</label>
								<Input
									type="number"
									value={formData.year}
									onChange={(e) =>
										setFormData({
											...formData,
											year: parseInt(e.target.value),
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium">
									Periodo
								</label>
								<Input
									type="number"
									min="1"
									max="2"
									value={formData.period}
									onChange={(e) =>
										setFormData({
											...formData,
											period: parseInt(e.target.value),
										})
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Fecha de Inicio
							</label>
							<Input
								type="date"
								value={formData.startDate}
								onChange={(e) =>
									setFormData({
										...formData,
										startDate: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Fecha de Fin
							</label>
							<Input
								type="date"
								value={formData.endDate}
								onChange={(e) =>
									setFormData({
										...formData,
										endDate: e.target.value,
									})
								}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDialogOpen(false)}
						>
							Cancelar
						</Button>
						<Button onClick={handleSave}>
							{editingSemester
								? 'Guardar Cambios'
								: 'Crear Semestre'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
