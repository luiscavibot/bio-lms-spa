import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAcademicStore } from '@/store/academicStore';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { BookOpen } from 'lucide-react';

export function Library() {
	const [selectedProgramId, setSelectedProgramId] = useState<string>('');
	const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');

	const programs = useAcademicStore((state) => state.programs);
	const semesters = useAcademicStore((state) => state.semesters);
	const courses = useAcademicStore((state) => state.courses);

	const loadPrograms = useAcademicStore((state) => state.loadPrograms);
	const loadSemestersByProgram = useAcademicStore(
		(state) => state.loadSemestersByProgram
	);
	const loadCoursesBySemester = useAcademicStore(
		(state) => state.loadCoursesBySemester
	);

	useEffect(() => {
		loadPrograms();
	}, [loadPrograms]);

	useEffect(() => {
		if (selectedProgramId) {
			loadSemestersByProgram(selectedProgramId);
			setSelectedSemesterId(''); // Reset semester when program changes
		}
	}, [selectedProgramId, loadSemestersByProgram]);

	useEffect(() => {
		if (selectedProgramId && selectedSemesterId) {
			loadCoursesBySemester(selectedProgramId, selectedSemesterId);
		}
	}, [selectedProgramId, selectedSemesterId, loadCoursesBySemester]);

	return (
		<div className="space-y-8">
			{/* Hero Section */}
			<section>
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Biblioteca Global
				</h1>
				<p className="text-gray-600">
					Explora todos los cursos disponibles por programa y semestre
				</p>
			</section>

			{/* Filtros en Cascada */}
			<section className="bg-white rounded-lg border p-6">
				<h2 className="text-lg font-semibold text-gray-900 mb-4">
					Filtrar Cursos
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Selector de Programa */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							Programa Académico
						</label>
						<Select
							value={selectedProgramId}
							onValueChange={setSelectedProgramId}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un programa" />
							</SelectTrigger>
							<SelectContent>
								{programs.map((program) => (
									<SelectItem
										key={program.id}
										value={program.id}
									>
										{program.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Selector de Semestre */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							Ciclo Académico
						</label>
						<Select
							value={selectedSemesterId}
							onValueChange={setSelectedSemesterId}
							disabled={!selectedProgramId}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un semestre" />
							</SelectTrigger>
							<SelectContent>
								{semesters.map((semester) => (
									<SelectItem
										key={semester.id}
										value={semester.id}
									>
										{semester.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</section>

			{/* Grid de Cursos */}
			<section>
				{!selectedProgramId || !selectedSemesterId ? (
					<div className="text-center py-12 text-gray-500">
						<BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						<p>
							Selecciona un programa y semestre para ver los
							cursos disponibles
						</p>
					</div>
				) : courses.length === 0 ? (
					<div className="text-center py-12 text-gray-500">
						<p>No hay cursos disponibles para esta selección</p>
					</div>
				) : (
					<>
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							Cursos Disponibles
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{courses.map((course) => (
								<Card
									key={course.id}
									className="hover:shadow-lg transition-shadow"
								>
									<CardHeader>
										<CardTitle className="text-lg">
											{course.name}
										</CardTitle>
										<CardDescription>
											{course.code}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-gray-600 mb-4">
											{course.description ||
												'Sin descripción disponible'}
										</p>
										<div className="space-y-2">
											<p className="text-sm font-medium text-gray-700">
												Grupos disponibles:{' '}
												{course.blocks.length}
											</p>
											<div className="flex flex-wrap gap-2">
												{course.blocks.map((block) => (
													<Link
														key={block.id}
														to={`/course/${block.id}`}
														className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white transition-colors"
													>
														{block.groupName}
													</Link>
												))}
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</>
				)}
			</section>
		</div>
	);
}
