/**
 * Gestión de Cursos - CRUD Completo
 */

import { useState, useEffect } from 'react';
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
	courseService,
	type CourseDto,
	type ProgramDto,
} from '@/services/courseService';

interface CourseForm {
	courseCode: string;
	courseName: string;
	credits: number;
	programId: number;
}

export function CoursesManagement() {
	const [courses, setCourses] = useState<CourseDto[]>([]);
	const [filteredCourses, setFilteredCourses] = useState<CourseDto[]>([]);
	const [programs, setPrograms] = useState<ProgramDto[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingCourse, setEditingCourse] = useState<CourseDto | null>(null);
	const [formData, setFormData] = useState<CourseForm>({
		courseCode: '',
		courseName: '',
		credits: 3,
		programId: 0,
	});

	// Mock data (reemplazar con llamada al backend)
	useEffect(() => {
		loadCourses();
	}, []);

	useEffect(() => {
		if (search.trim()) {
			setFilteredCourses(
				courses.filter(
					(c) =>
						c.courseName
							.toLowerCase()
							.includes(search.toLowerCase()) ||
						c.courseCode
							.toLowerCase()
							.includes(search.toLowerCase())
				)
			);
		} else {
			setFilteredCourses(courses);
		}
	}, [search, courses]);

	const loadCourses = async () => {
		setLoading(true);
		try {
			const [coursesData, programsData] = await Promise.all([
				courseService.getAll(),
				courseService.getPrograms(),
			]);
			setCourses(coursesData.courses);
			setPrograms(programsData.programs);
		} catch (error) {
			console.error('Error al cargar cursos:', error);
			alert('Error al cargar los datos. Por favor, intenta de nuevo.');
		} finally {
			setLoading(false);
		}
	};

	const handleOpenDialog = (course?: CourseDto) => {
		if (course) {
			setEditingCourse(course);
			setFormData({
				courseCode: course.courseCode,
				courseName: course.courseName,
				credits: course.credits,
				programId: course.programId,
			});
		} else {
			setEditingCourse(null);
			setFormData({
				courseCode: '',
				courseName: '',
				credits: 3,
				programId: 1,
			});
		}
		setDialogOpen(true);
	};

	const handleSave = async () => {
		try {
			if (editingCourse) {
				await courseService.update(editingCourse.courseId, formData);
			} else {
				await courseService.create(formData);
			}
			setDialogOpen(false);
			loadCourses();
		} catch (error) {
			console.error('Error al guardar curso:', error);
			alert('Error al guardar el curso. Por favor, verifica los datos.');
		}
	};

	const handleDelete = async (courseId: number) => {
		if (!confirm('¿Estás seguro de eliminar este curso?')) return;

		try {
			await courseService.delete(courseId);
			loadCourses();
		} catch (error) {
			console.error('Error al eliminar curso:', error);
			alert(
				'Error al eliminar el curso. Puede que esté siendo utilizado.'
			);
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
					Nuevo Curso
				</Button>
			</div>

			{/* Tabla de Cursos */}
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
								Créditos
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Programa
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
									colSpan={6}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									Cargando...
								</td>
							</tr>
						) : filteredCourses.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									No se encontraron cursos
								</td>
							</tr>
						) : (
							filteredCourses.map((course) => (
								<tr
									key={course.courseId}
									className="border-t hover:bg-muted/50"
								>
									<td className="px-4 py-3 font-medium">
										{course.courseCode}
									</td>
									<td className="px-4 py-3">
										{course.courseName}
									</td>
									<td className="px-4 py-3">
										{course.credits}
									</td>
									<td className="px-4 py-3">
										{course.programName || '-'}
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
												course.isActive
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-800'
											}`}
										>
											{course.isActive
												? 'Activo'
												: 'Inactivo'}
										</span>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleOpenDialog(course)
												}
											>
												<Edit className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleDelete(
														course.courseId
													)
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

			{/* Dialog de Crear/Editar */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
						</DialogTitle>
						<DialogDescription>
							{editingCourse
								? 'Modifica la información del curso'
								: 'Completa los datos del nuevo curso'}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Código del Curso
							</label>
							<Input
								placeholder="Ej: BIO101"
								value={formData.courseCode}
								onChange={(e) =>
									setFormData({
										...formData,
										courseCode: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Nombre del Curso
							</label>
							<Input
								placeholder="Ej: Biología General"
								value={formData.courseName}
								onChange={(e) =>
									setFormData({
										...formData,
										courseName: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Créditos
							</label>
							<Input
								type="number"
								min="1"
								max="10"
								value={formData.credits}
								onChange={(e) =>
									setFormData({
										...formData,
										credits: parseInt(e.target.value),
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Programa
							</label>
							<Select
								value={formData.programId.toString()}
								onValueChange={(value) =>
									setFormData({
										...formData,
										programId: parseInt(value),
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un programa" />
								</SelectTrigger>
								<SelectContent>
									{programs.map((program) => (
										<SelectItem
											key={program.programId}
											value={program.programId.toString()}
										>
											{program.programName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
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
							{editingCourse ? 'Guardar Cambios' : 'Crear Curso'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
