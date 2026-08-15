/**
 * Gestión de Programas Académicos - CRUD
 */

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	programsService,
	type ProgramDto,
	type CreateProgramDto,
	type UpdateProgramDto,
} from '@/services/programsService';
import { facultiesService, type FacultyDto } from '@/services/facultiesService';

interface ProgramForm {
	programName: string;
	programCode: string;
	facultyId: number;
	academicLevel?: 'UNDERGRADUATE' | 'POSTGRADUATE';
	degreeType?: 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'DIPLOMA';
	isActive?: boolean;
}

export function ProgramsManagement() {
	const [programs, setPrograms] = useState<ProgramDto[]>([]);
	const [filtered, setFiltered] = useState<ProgramDto[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(false);
	const [faculties, setFaculties] = useState<FacultyDto[]>([]);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<ProgramDto | null>(null);
	const [saving, setSaving] = useState(false);
	const [notification, setNotification] = useState<{
		type: 'success' | 'error' | 'warning';
		message: string;
	} | null>(null);
	const [form, setForm] = useState<ProgramForm>({
		programName: '',
		programCode: '',
		facultyId: 0,
		academicLevel: 'UNDERGRADUATE',
		degreeType: 'BACHELOR',
		isActive: true,
	});

	// Componente legado conservado para compatibilidad; la carga ocurre una vez al montar.
	useEffect(() => {
		loadPrograms();
		loadFaculties();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (search.trim()) {
			setFiltered(
				programs.filter(
					(p) =>
						p.programName
							.toLowerCase()
							.includes(search.toLowerCase()) ||
						p.programCode
							.toLowerCase()
							.includes(search.toLowerCase())
				)
			);
		} else {
			setFiltered(programs);
		}
	}, [search, programs]);

	useEffect(() => {
		if (notification) {
			const timer = setTimeout(() => {
				setNotification(null);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [notification]);

	const showNotification = (
		type: 'success' | 'error' | 'warning',
		message: string
	) => {
		setNotification({ type, message });
	};

	const loadPrograms = async () => {
		setLoading(true);
		try {
			const resp = await programsService.getAll();
			setPrograms(resp.programs || []);
		} catch (err) {
			console.error('Error al cargar programas:', err);
			showNotification('error', 'Error al cargar los programas');
		} finally {
			setLoading(false);
		}
	};

	const loadFaculties = async () => {
		try {
			const resp = await facultiesService.getAll();
			setFaculties(resp.faculties || []);
		} catch (err) {
			console.error('Error al cargar facultades:', err);
			showNotification('error', 'Error al cargar las facultades');
		}
	};
	const handleOpenDialog = (program?: ProgramDto) => {
		if (program) {
			setEditing(program);
			setForm({
				programName: program.programName,
				programCode: program.programCode,
				facultyId: program.facultyId,
				academicLevel: program.academicLevel || 'UNDERGRADUATE',
				degreeType: program.degreeType || 'BACHELOR',
				isActive: program.isActive,
			});
		} else {
			setEditing(null);
			setForm({
				programName: '',
				programCode: '',
				facultyId: 0,
				academicLevel: 'UNDERGRADUATE',
				degreeType: 'BACHELOR',
				isActive: true,
			});
		}
		setDialogOpen(true);
	};

	const handleSave = async () => {
		// Validaciones
		if (!form.programName.trim()) {
			showNotification('warning', 'El nombre del programa es requerido');
			return;
		}
		if (!form.programCode.trim()) {
			showNotification('warning', 'El código del programa es requerido');
			return;
		}
		if (!form.facultyId || form.facultyId === 0) {
			showNotification('warning', 'Debes seleccionar una facultad');
			return;
		}

		setSaving(true);
		try {
			if (editing) {
				const data: UpdateProgramDto = {
					programName: form.programName,
					programCode: form.programCode,
					facultyId: form.facultyId,
					academicLevel: form.academicLevel,
					degreeType: form.degreeType,
					isActive: form.isActive,
				};
				await programsService.update(editing.programId, data);
				showNotification(
					'success',
					'Programa actualizado exitosamente'
				);
			} else {
				const data: CreateProgramDto = {
					programName: form.programName,
					programCode: form.programCode,
					facultyId: form.facultyId,
					academicLevel: form.academicLevel!,
					degreeType: form.degreeType!,
				};
				console.log(
					'📤 Datos que se enviarán al backend:',
					JSON.stringify(data, null, 2)
				);
				console.log('📤 Tipo de cada campo:', {
					programName: typeof data.programName,
					programCode: typeof data.programCode,
					facultyId: typeof data.facultyId,
					academicLevel: typeof data.academicLevel,
					degreeType: typeof data.degreeType,
				});
				await programsService.create(data);
				showNotification('success', 'Programa creado exitosamente');
			}
			setDialogOpen(false);
			await loadPrograms();
		} catch (err: any) {
			console.error('Error al guardar programa:', err);
			let errorMessage = 'Error al guardar el programa';
			if (err.message) {
				errorMessage = err.message;
			}
			if (err.response?.message) {
				errorMessage = err.response.message;
			}
			showNotification('error', errorMessage);
		} finally {
			setSaving(false);
		}
	};
	const handleDelete = async (programId: number) => {
		if (!confirm('¿Eliminar este programa?')) return;
		try {
			await programsService.delete(programId);
			loadPrograms();
		} catch (err) {
			console.error('Error al eliminar programa:', err);
			alert('Error al eliminar el programa. Puede estar en uso.');
		}
	};

	return (
		<div className="space-y-4">
			{/* Notificación */}
			{notification && (
				<div
					className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md animate-in slide-in-from-top-5 ${
						notification.type === 'success'
							? 'bg-green-50 text-green-900 border border-green-200'
							: notification.type === 'error'
							? 'bg-red-50 text-red-900 border border-red-200'
							: 'bg-yellow-50 text-yellow-900 border border-yellow-200'
					}`}
				>
					<div className="flex items-start gap-3">
						<div className="flex-1">
							<p className="font-medium">
								{notification.type === 'success' && '✓ '}
								{notification.type === 'error' && '✕ '}
								{notification.type === 'warning' && '⚠ '}
								{notification.message}
							</p>
						</div>
						<button
							onClick={() => setNotification(null)}
							className="text-current opacity-70 hover:opacity-100"
						>
							×
						</button>
					</div>
				</div>
			)}

			{/* Toolbar */}
			<div className="flex items-center justify-between gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar por código o nombre..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Button onClick={() => handleOpenDialog()} className="gap-2">
					<Plus className="w-4 h-4" />
					Nuevo Programa
				</Button>
			</div>

			{/* Tabla */}
			<div className="border rounded-lg overflow-hidden">
				<table className="w-full">
					<thead className="bg-muted">
						<tr>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Código
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Nombre
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Facultad
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Nivel
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Grado
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Estado
							</th>
							<th className="px-4 py-3 text-right text-sm font-medium">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									Cargando...
								</td>
							</tr>
						) : filtered.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									No se encontraron programas
								</td>
							</tr>
						) : (
							filtered.map((p) => (
								<tr
									key={p.programId}
									className="border-t hover:bg-muted/50"
								>
									<td className="px-4 py-3 font-medium">
										{p.programCode}
									</td>
									<td className="px-4 py-3">
										{p.programName}
									</td>
									<td className="px-4 py-3">
										{p.facultyName ?? '-'}
									</td>
									<td className="px-4 py-3">
										{p.academicLevel ?? '-'}
									</td>
									<td className="px-4 py-3">
										{p.degreeType ?? '-'}
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
												p.isActive
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-800'
											}`}
										>
											{p.isActive ? 'Activo' : 'Inactivo'}
										</span>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleOpenDialog(p)
												}
											>
												<Edit className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleDelete(p.programId)
												}
												className="text-destructive hover:text-destructive"
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editing ? 'Editar Programa' : 'Nuevo Programa'}
						</DialogTitle>
						<DialogDescription>
							{editing
								? 'Modifica la información del programa'
								: 'Completa los datos del nuevo programa'}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Código del Programa
							</label>
							<Input
								placeholder="Ej: BIO"
								value={form.programCode}
								onChange={(e) =>
									setForm({
										...form,
										programCode: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Nombre del Programa
							</label>
							<Input
								placeholder="Biología"
								value={form.programName}
								onChange={(e) =>
									setForm({
										...form,
										programName: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Facultad{' '}
								{form.facultyId > 0 && (
									<span className="text-xs text-muted-foreground">
										(ID: {form.facultyId})
									</span>
								)}
							</label>
							<Select
								key={`faculty-${dialogOpen}-${form.facultyId}`}
								value={
									form.facultyId > 0
										? String(form.facultyId)
										: undefined
								}
								onValueChange={(val) => {
									if (!val || val === 'undefined') {
										return;
									}
									const facultyId = parseInt(val, 10);
									if (!isNaN(facultyId) && facultyId > 0) {
										setForm({ ...form, facultyId });
									}
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona una facultad" />
								</SelectTrigger>
								<SelectContent position="popper">
									{faculties.length === 0 && (
										<SelectItem
											key="empty"
											value="0"
											disabled
										>
											Sin facultades disponibles
										</SelectItem>
									)}
									{faculties.length > 0 &&
										faculties.map((f) => (
											<SelectItem
												key={f.id}
												value={String(f.id)}
											>
												{f.facultyName}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">
									Nivel Académico
								</label>
								<Select
									value={form.academicLevel}
									onValueChange={(val) =>
										setForm({
											...form,
											academicLevel: val as
												| 'UNDERGRADUATE'
												| 'POSTGRADUATE',
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona" />
									</SelectTrigger>
									<SelectContent position="popper">
										<SelectItem value="UNDERGRADUATE">
											Pregrado
										</SelectItem>
										<SelectItem value="POSTGRADUATE">
											Posgrado
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium">
									Tipo de Grado
								</label>
								<Select
									value={form.degreeType}
									onValueChange={(val) =>
										setForm({
											...form,
											degreeType: val as
												| 'BACHELOR'
												| 'MASTER'
												| 'DOCTORATE'
												| 'DIPLOMA',
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona" />
									</SelectTrigger>
									<SelectContent position="popper">
										<SelectItem value="BACHELOR">
											Bachiller
										</SelectItem>
										<SelectItem value="MASTER">
											Maestría
										</SelectItem>
										<SelectItem value="DOCTORATE">
											Doctorado
										</SelectItem>
										<SelectItem value="DIPLOMA">
											Diplomado
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Estado
							</label>
							<Select
								value={String(form.isActive)}
								onValueChange={(val) =>
									setForm({
										...form,
										isActive: val === 'true',
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona" />
								</SelectTrigger>
								<SelectContent position="popper">
									<SelectItem value="true">Activo</SelectItem>
									<SelectItem value="false">
										Inactivo
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button onClick={handleSave} disabled={saving}>
							{saving ? 'Guardando...' : 'Guardar'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
