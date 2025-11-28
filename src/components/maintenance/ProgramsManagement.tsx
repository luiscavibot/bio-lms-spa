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
	academicLevel?: string;
	degreeType?: string;
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
	const [form, setForm] = useState<ProgramForm>({
		programName: '',
		programCode: '',
		facultyId: 0,
		academicLevel: 'UNDERGRADUATE',
		degreeType: 'BACHELOR',
		isActive: true,
	});

	useEffect(() => {
		loadPrograms();
		loadFaculties();
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

	const loadPrograms = async () => {
		setLoading(true);
		try {
			const resp = await programsService.getAll();
			console.log('🎓 Programas (list):', resp);
			setPrograms(resp.programs || []);
		} catch (err) {
			console.error('Error al cargar programas:', err);
			alert('Error al cargar los programas. Intenta de nuevo.');
		} finally {
			setLoading(false);
		}
	};

	const loadFaculties = async () => {
		try {
			const resp = await facultiesService.getAll();
			console.log('🏫 Facultades (list):', resp);
			setFaculties(resp.faculties || []);
		} catch (err) {
			console.error('Error al cargar facultades:', err);
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
			} else {
				const data: CreateProgramDto = {
					programName: form.programName,
					programCode: form.programCode,
					facultyId: form.facultyId,
					academicLevel: form.academicLevel!,
					degreeType: form.degreeType!,
				};
				await programsService.create(data);
			}
			setDialogOpen(false);
			loadPrograms();
		} catch (err) {
			console.error('Error al guardar programa:', err);
			alert('Error al guardar el programa. Verifica los datos.');
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
								Facultad
							</label>
							<Select
								value={String(form.facultyId || '')}
								onValueChange={(val) =>
									setForm({ ...form, facultyId: Number(val) })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona" />
								</SelectTrigger>
								<SelectContent>
									{faculties.length === 0 ? (
										<div className="px-3 py-2 text-sm text-muted-foreground">
											Sin facultades disponibles
										</div>
									) : (
										faculties.map((f) => (
											<SelectItem
												key={f.facultyId}
												value={String(f.facultyId)}
											>
												{f.facultyName}
											</SelectItem>
										))
									)}
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
										setForm({ ...form, academicLevel: val })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona" />
									</SelectTrigger>
									<SelectContent>
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
										setForm({ ...form, degreeType: val })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona" />
									</SelectTrigger>
									<SelectContent>
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
								<SelectContent>
									<SelectItem value="true">Activo</SelectItem>
									<SelectItem value="false">
										Inactivo
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button onClick={handleSave}>Guardar</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
