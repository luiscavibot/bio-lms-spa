/**
 * Gestión de Asignación de Docentes
 */

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
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
	teacherAssignmentService,
	type TeacherAssignmentDto,
	type TeacherBasicDto,
} from '@/services/teacherAssignmentService';
import {
	type CourseOfferingBasicDto,
	enrollmentService,
} from '@/services/enrollmentService';

interface AssignmentForm {
	teacherId: number;
	courseOfferingId: number;
}

export function TeachersManagement() {
	const [assignments, setAssignments] = useState<TeacherAssignmentDto[]>([]);
	const [filteredAssignments, setFilteredAssignments] = useState<
		TeacherAssignmentDto[]
	>([]);
	const [teachers, setTeachers] = useState<TeacherBasicDto[]>([]);
	const [courseOfferings, setCourseOfferings] = useState<
		CourseOfferingBasicDto[]
	>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [formData, setFormData] = useState<AssignmentForm>({
		teacherId: 0,
		courseOfferingId: 0,
	});

	useEffect(() => {
		loadAssignments();
		loadTeachersAndOfferings();
	}, []);

	useEffect(() => {
		const filtered = assignments.filter(
			(assignment) =>
				assignment.teacherName
					.toLowerCase()
					.includes(search.toLowerCase()) ||
				assignment.teacherCode.includes(search) ||
				assignment.courseName
					.toLowerCase()
					.includes(search.toLowerCase()) ||
				assignment.courseCode
					.toLowerCase()
					.includes(search.toLowerCase())
		);
		setFilteredAssignments(filtered);
	}, [search, assignments]);

	const loadAssignments = async () => {
		setLoading(true);
		try {
			const data = await teacherAssignmentService.getAll();
			setAssignments(data.assignments);
		} catch (error) {
			console.error('Error al cargar asignaciones:', error);
			alert(
				'Error al cargar las asignaciones. Por favor, intenta de nuevo.'
			);
		} finally {
			setLoading(false);
		}
	};

	const loadTeachersAndOfferings = async () => {
		try {
			const [teachersData, offeringsData] = await Promise.all([
				teacherAssignmentService.getTeachers(),
				enrollmentService.getCourseOfferings(),
			]);
			setTeachers(teachersData.teachers);
			setCourseOfferings(offeringsData.offerings);
		} catch (error) {
			console.error('Error al cargar datos:', error);
		}
	};

	const handleOpenDialog = () => {
		setFormData({
			teacherId: 0,
			courseOfferingId: 0,
		});
		setDialogOpen(true);
	};

	const handleSave = async () => {
		try {
			await teacherAssignmentService.create(formData);
			setDialogOpen(false);
			loadAssignments();
		} catch (error) {
			console.error('Error al crear asignación:', error);
			alert(
				'Error al crear la asignación. Verifica que no exista otro docente asignado.'
			);
		}
	};

	const handleDelete = async (assignmentId: number) => {
		if (!confirm('¿Estás seguro de eliminar esta asignación?')) return;

		try {
			await teacherAssignmentService.delete(assignmentId);
			loadAssignments();
		} catch (error) {
			console.error('Error al eliminar asignación:', error);
			alert('Error al eliminar la asignación.');
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Buscar por docente o curso..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleOpenDialog} className="gap-2">
					<Plus className="w-4 h-4" />
					Nueva Asignación
				</Button>
			</div>

			<div className="border rounded-lg overflow-hidden">
				<table className="w-full">
					<thead className="bg-muted">
						<tr>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Docente
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Código
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Curso
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Sección
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Semestre
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Fecha
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td
									colSpan={7}
									className="text-center py-8 text-muted-foreground"
								>
									Cargando...
								</td>
							</tr>
						) : filteredAssignments.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									className="text-center py-8 text-muted-foreground"
								>
									No se encontraron asignaciones
								</td>
							</tr>
						) : (
							filteredAssignments.map((assignment) => (
								<tr
									key={assignment.assignmentId}
									className="border-t"
								>
									<td className="px-4 py-3">
										{assignment.teacherName}
									</td>
									<td className="px-4 py-3 text-sm">
										{assignment.teacherCode}
									</td>
									<td className="px-4 py-3">
										<div className="text-sm">
											<div className="font-medium">
												{assignment.courseCode}
											</div>
											<div className="text-muted-foreground">
												{assignment.courseName}
											</div>
										</div>
									</td>
									<td className="px-4 py-3">
										{assignment.section}
									</td>
									<td className="px-4 py-3">
										{assignment.semesterName}
									</td>
									<td className="px-4 py-3 text-sm">
										{new Date(
											assignment.assignmentDate
										).toLocaleDateString()}
									</td>
									<td className="px-4 py-3">
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleDelete(
													assignment.assignmentId
												)
											}
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nueva Asignación</DialogTitle>
						<DialogDescription>
							Asignar un docente a un curso
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Docente
							</label>
							<select
								value={formData.teacherId}
								onChange={(e) =>
									setFormData({
										...formData,
										teacherId: parseInt(e.target.value),
									})
								}
								className="w-full px-3 py-2 border rounded-md"
							>
								<option value={0}>Seleccione un docente</option>
								{teachers.map((teacher) => (
									<option
										key={teacher.teacherId}
										value={teacher.teacherId}
									>
										{teacher.code} - {teacher.name}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Curso</label>
							<select
								value={formData.courseOfferingId}
								onChange={(e) =>
									setFormData({
										...formData,
										courseOfferingId: parseInt(
											e.target.value
										),
									})
								}
								className="w-full px-3 py-2 border rounded-md"
							>
								<option value={0}>Seleccione un curso</option>
								{courseOfferings.map((offering) => (
									<option
										key={offering.courseOfferingId}
										value={offering.courseOfferingId}
									>
										{offering.courseCode} -{' '}
										{offering.courseName} (Sección{' '}
										{offering.section},{' '}
										{offering.semesterName})
									</option>
								))}
							</select>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDialogOpen(false)}
						>
							Cancelar
						</Button>
						<Button onClick={handleSave}>Crear Asignación</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
