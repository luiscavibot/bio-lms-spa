/**
 * Gestión de Matrículas
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
	enrollmentService,
	type EnrollmentDto,
	type StudentBasicDto,
	type CourseOfferingBasicDto,
} from '@/services/enrollmentService';

interface EnrollmentForm {
	studentId: number;
	courseOfferingId: number;
}

export function EnrollmentsManagement() {
	const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
	const [filteredEnrollments, setFilteredEnrollments] = useState<
		EnrollmentDto[]
	>([]);
	const [students, setStudents] = useState<StudentBasicDto[]>([]);
	const [courseOfferings, setCourseOfferings] = useState<
		CourseOfferingBasicDto[]
	>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [formData, setFormData] = useState<EnrollmentForm>({
		studentId: 0,
		courseOfferingId: 0,
	});

	useEffect(() => {
		loadEnrollments();
		loadStudentsAndOfferings();
	}, []);

	useEffect(() => {
		const filtered = enrollments.filter(
			(enrollment) =>
				enrollment.studentName
					.toLowerCase()
					.includes(search.toLowerCase()) ||
				enrollment.studentCode.includes(search) ||
				enrollment.courseName
					.toLowerCase()
					.includes(search.toLowerCase()) ||
				enrollment.courseCode
					.toLowerCase()
					.includes(search.toLowerCase())
		);
		setFilteredEnrollments(filtered);
	}, [search, enrollments]);

	const loadEnrollments = async () => {
		setLoading(true);
		try {
			const data = await enrollmentService.getAll();
			setEnrollments(data.enrollments);
		} catch (error) {
			console.error('Error al cargar matrículas:', error);
			alert(
				'Error al cargar las matrículas. Por favor, intenta de nuevo.'
			);
		} finally {
			setLoading(false);
		}
	};

	const loadStudentsAndOfferings = async () => {
		try {
			const [studentsData, offeringsData] = await Promise.all([
				enrollmentService.getStudents(),
				enrollmentService.getCourseOfferings(),
			]);
			setStudents(studentsData.students);
			setCourseOfferings(offeringsData.offerings);
		} catch (error) {
			console.error('Error al cargar datos:', error);
		}
	};

	const handleOpenDialog = () => {
		setFormData({
			studentId: 0,
			courseOfferingId: 0,
		});
		setDialogOpen(true);
	};

	const handleSave = async () => {
		try {
			await enrollmentService.create(formData);
			setDialogOpen(false);
			loadEnrollments();
		} catch (error) {
			console.error('Error al crear matrícula:', error);
			alert(
				'Error al crear la matrícula. Verifica que el estudiante no esté ya matriculado.'
			);
		}
	};

	const handleDelete = async (enrollmentId: number) => {
		if (!confirm('¿Estás seguro de eliminar esta matrícula?')) return;

		try {
			await enrollmentService.delete(enrollmentId);
			loadEnrollments();
		} catch (error) {
			console.error('Error al eliminar matrícula:', error);
			alert('Error al eliminar la matrícula.');
		}
	};

	const getStatusLabel = (status: string) => {
		const labels = {
			active: 'Activa',
			dropped: 'Retirada',
			completed: 'Completada',
		};
		return labels[status as keyof typeof labels] || status;
	};

	const getStatusColor = (status: string) => {
		const colors = {
			active: 'bg-green-100 text-green-800',
			dropped: 'bg-red-100 text-red-800',
			completed: 'bg-blue-100 text-blue-800',
		};
		return colors[status as keyof typeof colors] || '';
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Buscar por estudiante o curso..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleOpenDialog} className="gap-2">
					<Plus className="w-4 h-4" />
					Nueva Matrícula
				</Button>
			</div>

			<div className="border rounded-lg overflow-hidden">
				<table className="w-full">
					<thead className="bg-muted">
						<tr>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Estudiante
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Código
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Curso
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Semestre
							</th>
							<th className="px-4 py-3 text-left text-sm font-medium">
								Estado
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
						) : filteredEnrollments.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									className="text-center py-8 text-muted-foreground"
								>
									No se encontraron matrículas
								</td>
							</tr>
						) : (
							filteredEnrollments.map((enrollment) => (
								<tr
									key={enrollment.enrollmentId}
									className="border-t"
								>
									<td className="px-4 py-3">
										{enrollment.studentName}
									</td>
									<td className="px-4 py-3 text-sm">
										{enrollment.studentCode}
									</td>
									<td className="px-4 py-3">
										<div className="text-sm">
											<div className="font-medium">
												{enrollment.courseCode}
											</div>
											<div className="text-muted-foreground">
												{enrollment.courseName}
											</div>
										</div>
									</td>
									<td className="px-4 py-3">
										{enrollment.semesterName}
									</td>
									<td className="px-4 py-3">
										<span
											className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
												enrollment.status
											)}`}
										>
											{getStatusLabel(enrollment.status)}
										</span>
									</td>
									<td className="px-4 py-3 text-sm">
										{new Date(
											enrollment.enrollmentDate
										).toLocaleDateString()}
									</td>
									<td className="px-4 py-3">
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleDelete(
													enrollment.enrollmentId
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
						<DialogTitle>Nueva Matrícula</DialogTitle>
						<DialogDescription>
							Matricular un estudiante en un curso
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Estudiante
							</label>
							<select
								value={formData.studentId}
								onChange={(e) =>
									setFormData({
										...formData,
										studentId: parseInt(e.target.value),
									})
								}
								className="w-full px-3 py-2 border rounded-md"
							>
								<option value={0}>
									Seleccione un estudiante
								</option>
								{students.map((student) => (
									<option
										key={student.studentId}
										value={student.studentId}
									>
										{student.code} - {student.name}
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
										{offering.courseName} (
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
						<Button onClick={handleSave}>Crear Matrícula</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
