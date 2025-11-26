import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAcademicStore } from '@/store/academicStoreNew';
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
import { BookOpen, GraduationCap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CourseOffering, Block } from '@/types/academic-new';
import { mockCourses, mockBlocks } from '@/services/mockDataNew';
import { AcademicLevel, DegreeType } from '@/types/academic-new';
import { Input } from '@/components/ui/input';

export function Library() {
	const [selectedProgramId, setSelectedProgramId] = useState<string>('');
	const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
	const [selectedDegreeType, setSelectedDegreeType] = useState<string>('');
	const [programSearchQuery, setProgramSearchQuery] = useState<string>('');

	const programs = useAcademicStore((state) => state.programs);
	const semesters = useAcademicStore((state) => state.semesters);
	const courseOfferings = useAcademicStore((state) => state.courseOfferings);

	const loadPrograms = useAcademicStore((state) => state.loadPrograms);
	const loadSemesters = useAcademicStore((state) => state.loadSemesters);
	const loadCourseOfferingsByFilters = useAcademicStore(
		(state) => state.loadCourseOfferingsByFilters
	);

	useEffect(() => {
		loadPrograms();
		loadSemesters();
	}, [loadPrograms, loadSemesters]);

	// Filtrar programas por tipo y búsqueda
	const filteredPrograms = useMemo(() => {
		let filtered = programs;

		// Filtrar por tipo de grado
		if (selectedDegreeType && selectedDegreeType !== 'all') {
			filtered = filtered.filter(
				(p) => p.degreeType === selectedDegreeType
			);
		}

		// Filtrar por búsqueda de texto
		if (programSearchQuery.trim()) {
			const query = programSearchQuery.toLowerCase();
			filtered = filtered.filter((p) =>
				p.programName.toLowerCase().includes(query)
			);
		}

		return filtered;
	}, [programs, selectedDegreeType, programSearchQuery]);

	useEffect(() => {
		if (selectedProgramId && selectedSemesterId) {
			loadCourseOfferingsByFilters(
				undefined,
				parseInt(selectedProgramId),
				parseInt(selectedSemesterId)
			);
		} else if (selectedSemesterId) {
			loadCourseOfferingsByFilters(
				undefined,
				undefined,
				parseInt(selectedSemesterId)
			);
		} else if (selectedProgramId) {
			loadCourseOfferingsByFilters(
				undefined,
				parseInt(selectedProgramId),
				undefined
			);
		} else {
			loadCourseOfferingsByFilters();
		}
	}, [selectedProgramId, selectedSemesterId, loadCourseOfferingsByFilters]);

	// Enriquecer course offerings con datos de curso
	const enrichedOfferings = useMemo(() => {
		return courseOfferings.map((offering: CourseOffering) => {
			const course = mockCourses.find(
				(c) => c.courseId === offering.courseId
			);
			const program = programs.find(
				(p) => p.programId === course?.programId
			);
			const semester = semesters.find(
				(s) => s.semesterId === offering.semesterId
			);
			const blocks = mockBlocks.filter(
				(b: Block) => b.courseOfferingId === offering.courseOfferingId
			);

			return {
				...offering,
				courseName: course?.courseName || '',
				courseDescription: course?.description,
				credits: course?.credits || 0,
				programName: program?.programName || '',
				academicLevel: program?.academicLevel,
				degreeType: program?.degreeType,
				semesterName: semester?.semesterName || '',
				blocks,
			};
		});
	}, [courseOfferings, programs, semesters]);

	const getLevelIcon = (level?: string) => {
		if (level === AcademicLevel.POSTGRADUATE) {
			return <GraduationCap className="h-4 w-4" />;
		}
		return <Award className="h-4 w-4" />;
	};

	const getLevelLabel = (level?: string) => {
		if (level === AcademicLevel.POSTGRADUATE) return 'Posgrado';
		if (level === AcademicLevel.UNDERGRADUATE) return 'Pregrado';
		return 'N/A';
	};

	const getDegreeLabel = (degree?: string) => {
		if (degree === DegreeType.BACHELOR) return 'Bachillerato';
		if (degree === DegreeType.MASTER) return 'Maestría';
		if (degree === DegreeType.DOCTORATE) return 'Doctorado';
		if (degree === DegreeType.DIPLOMA) return 'Diplomado';
		return '';
	};

	return (
		<div className="space-y-8">
			{/* Hero Section */}
			<section className="bg-primary/10 -mx-4 px-4 py-8 rounded-2xl border border-primary/20">
				<h1 className="text-4xl font-bold text-primary mb-2">
					Biblioteca Global
				</h1>
				<p className="text-muted-foreground text-lg">
					Explora todos los cursos disponibles por programa y semestre
				</p>
			</section>

			{/* Filtros */}
			<section className="bg-muted/30 -mx-4 px-4 py-6 rounded-xl border border-border">
				<h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
					<div className="w-1 h-6 bg-accent rounded-full"></div>
					Filtrar Cursos
				</h2>
				<div className="grid gap-4 md:grid-cols-4">
					{/* Filtro de Tipo de Programa */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-foreground">
							Tipo de Programa
						</label>
						<Select
							value={selectedDegreeType}
							onValueChange={(value) => {
								setSelectedDegreeType(value);
								// Si cambias el tipo, limpia el programa seleccionado
								if (value !== 'all') {
									setSelectedProgramId('');
								}
							}}
						>
							<SelectTrigger className="w-full bg-background">
								<SelectValue placeholder="Todos los tipos" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									Todos los tipos
								</SelectItem>
								<SelectItem value={DegreeType.BACHELOR}>
									Bachillerato
								</SelectItem>
								<SelectItem value={DegreeType.MASTER}>
									Maestría
								</SelectItem>
								<SelectItem value={DegreeType.DOCTORATE}>
									Doctorado
								</SelectItem>
								<SelectItem value={DegreeType.DIPLOMA}>
									Diplomado
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Filtro de Programa con búsqueda integrada */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-foreground">
							Programa
						</label>
						<Select
							value={selectedProgramId}
							onValueChange={setSelectedProgramId}
						>
							<SelectTrigger className="w-full bg-background">
								<SelectValue placeholder="Todos los programas" />
							</SelectTrigger>
							<SelectContent>
								<div className="px-2 py-2 border-b">
									<Input
										type="text"
										placeholder="Buscar programa..."
										value={programSearchQuery}
										onChange={(
											e: React.ChangeEvent<HTMLInputElement>
										) =>
											setProgramSearchQuery(
												e.target.value
											)
										}
										className="h-8"
										onClick={(e: React.MouseEvent) =>
											e.stopPropagation()
										}
										onKeyDown={(e: React.KeyboardEvent) =>
											e.stopPropagation()
										}
									/>
								</div>
								<SelectItem value="all">
									Todos los programas
								</SelectItem>
								{filteredPrograms.length === 0 ? (
									<div className="px-2 py-6 text-center text-sm text-muted-foreground">
										No se encontraron programas
									</div>
								) : (
									filteredPrograms.map((program) => (
										<SelectItem
											key={program.programId}
											value={program.programId.toString()}
										>
											{program.programName}
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</div>

					{/* Filtro de Semestre */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-foreground">
							Semestre
						</label>
						<Select
							value={selectedSemesterId}
							onValueChange={setSelectedSemesterId}
						>
							<SelectTrigger className="w-full bg-background">
								<SelectValue placeholder="Todos los semestres" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									Todos los semestres
								</SelectItem>
								{semesters.map((semester) => (
									<SelectItem
										key={semester.semesterId}
										value={semester.semesterId.toString()}
									>
										{semester.semesterName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Botón limpiar filtros */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-transparent">
							Acciones
						</label>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setSelectedProgramId('');
								setSelectedSemesterId('');
								setSelectedDegreeType('');
								setProgramSearchQuery('');
							}}
						>
							Limpiar filtros
						</Button>
					</div>
				</div>
			</section>

			{/* Resultados Filtrados */}
			<section>
				<h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
					<div className="w-1 h-8 bg-accent rounded-full"></div>
					{selectedProgramId || selectedSemesterId
						? 'Resultados Filtrados'
						: 'Todos los Cursos'}
					<span className="text-sm text-muted-foreground ml-2">
						({enrichedOfferings.length})
					</span>
				</h2>

				{enrichedOfferings.length === 0 ? (
					<Card className="border-primary/10">
						<CardContent className="p-12 text-center">
							<BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-muted-foreground">
								{selectedProgramId || selectedSemesterId
									? 'No se encontraron cursos con los filtros seleccionados'
									: 'No hay cursos disponibles en este momento'}
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{enrichedOfferings.map((offering) => (
							<Card
								key={offering.courseOfferingId}
								className="hover:shadow-lg hover:border-primary/40 transition-all duration-200 border-primary/10"
							>
								<CardHeader>
									<div className="flex items-start justify-between gap-2 mb-2">
										<CardTitle className="text-lg text-primary">
											{offering.courseName}
										</CardTitle>
										<div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md whitespace-nowrap">
											{getLevelIcon(
												offering.academicLevel
											)}
											<span>
												{getLevelLabel(
													offering.academicLevel
												)}
											</span>
										</div>
									</div>
									<CardDescription className="space-y-1">
										<div className="font-medium text-foreground/80">
											{offering.programName}
										</div>
										<div className="text-xs text-muted-foreground">
											{getDegreeLabel(
												offering.degreeType
											)}{' '}
											• {offering.credits} créditos
										</div>
										<div className="text-xs text-muted-foreground">
											{offering.semesterName}
										</div>
									</CardDescription>
								</CardHeader>
								<CardContent>
									{offering.courseDescription && (
										<p className="text-sm text-muted-foreground mb-4 line-clamp-2">
											{offering.courseDescription}
										</p>
									)}

									{/* Bloques disponibles */}
									<div className="space-y-2">
										<p className="text-xs font-medium text-foreground">
											Grupos disponibles:
										</p>
										<div className="flex flex-wrap gap-2">
											{offering.blocks.map((block) => (
												<Link
													key={block.blockId}
													to={`/block/${block.blockId}`}
												>
													<button className="text-xs px-3 py-1 bg-primary/5 hover:bg-primary/10 text-primary rounded-md transition-colors border border-primary/20">
														{block.name}
													</button>
												</Link>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
