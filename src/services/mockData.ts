/**
 * Mock Data Service - Datos de ejemplo UNMSM - Facultad de Ciencias Biológicas
 */

import type {
	Program,
	Semester,
	Course,
	Block,
	Week,
	Material,
	User,
	MyCourseCard,
	NewsItem,
} from '@/types/academic';
import { MaterialType, UserRole } from '@/types/academic';

// Datos Mock de Programas (Carreras FCB-UNMSM)
export const mockPrograms: Program[] = [
	{
		id: 'prog-1',
		code: 'E.P.MICRO',
		name: 'Microbiología y Parasitología',
		description: 'Escuela Profesional de Microbiología y Parasitología',
		facultyId: 'fcb-unmsm',
		semesters: [],
	},
	{
		id: 'prog-2',
		code: 'E.P.GENET',
		name: 'Genética y Biotecnología',
		description: 'Escuela Profesional de Genética y Biotecnología',
		facultyId: 'fcb-unmsm',
		semesters: [],
	},
	{
		id: 'prog-3',
		code: 'E.P.BIOLOGIA',
		name: 'Ciencias Biológicas',
		description: 'Escuela Profesional de Ciencias Biológicas',
		facultyId: 'fcb-unmsm',
		semesters: [],
	},
];

// Datos Mock de Semestres
export const mockSemesters: Semester[] = [
	{
		id: 'sem-1',
		code: '2025-I',
		name: 'Primer Semestre 2025',
		startDate: new Date('2025-03-15'),
		endDate: new Date('2025-07-20'),
		isActive: false,
		programId: 'prog-1',
		courses: [],
	},
	{
		id: 'sem-2',
		code: '2025-II',
		name: 'Segundo Semestre 2025',
		startDate: new Date('2025-08-15'),
		endDate: new Date('2025-12-20'),
		isActive: true,
		programId: 'prog-1',
		courses: [],
	},
];

// Datos Mock de Materiales
export const mockMaterials: Material[] = [
	{
		id: 'mat-1',
		title: 'Introducción a la Microbiología - Presentación',
		description: 'Conceptos fundamentales de microbiología',
		type: MaterialType.PRESENTATION,
		fileUrl: '/files/intro-micro.pptx',
		fileSize: 2048000,
		uploadDate: new Date('2025-11-20'),
		uploadedBy: 'prof-1',
		weekId: 'week-1',
	},
	{
		id: 'mat-2',
		title: 'Estructura Bacteriana - PDF',
		description: 'Morfología y ultraestructura de las bacterias',
		type: MaterialType.PDF,
		fileUrl: '/files/estructura-bacteriana.pdf',
		fileSize: 1024000,
		uploadDate: new Date('2025-11-21'),
		uploadedBy: 'prof-1',
		weekId: 'week-1',
	},
	{
		id: 'mat-3',
		title: 'Video: Observación Microscópica',
		description: 'Técnicas de microscopía en microbiología',
		type: MaterialType.VIDEO,
		externalUrl: 'https://youtube.com/watch?v=example',
		uploadDate: new Date('2025-11-22'),
		uploadedBy: 'prof-1',
		weekId: 'week-1',
	},
	{
		id: 'mat-4',
		title: 'Crecimiento Microbiano - Presentación',
		type: MaterialType.PRESENTATION,
		fileUrl: '/files/crecimiento.pptx',
		fileSize: 3072000,
		uploadDate: new Date('2025-11-18'),
		uploadedBy: 'prof-1',
		weekId: 'week-2',
	},
	{
		id: 'mat-5',
		title: 'Medios de Cultivo - PDF',
		type: MaterialType.PDF,
		fileUrl: '/files/medios-cultivo.pdf',
		fileSize: 512000,
		uploadDate: new Date('2025-11-19'),
		uploadedBy: 'prof-1',
		weekId: 'week-2',
	},
];

// Datos Mock de Semanas
export const mockWeeks: Week[] = [
	{
		id: 'week-1',
		weekNumber: 1,
		title: 'Introducción a la Microbiología',
		description: 'Conceptos básicos, historia y áreas de estudio',
		startDate: new Date('2025-11-18'),
		endDate: new Date('2025-11-24'),
		blockId: 'block-1',
		materials: mockMaterials.filter((m) => m.weekId === 'week-1'),
	},
	{
		id: 'week-2',
		weekNumber: 2,
		title: 'Morfología y Crecimiento Bacteriano',
		description: 'Estructura celular y metabolismo microbiano',
		startDate: new Date('2025-11-25'),
		endDate: new Date('2025-12-01'),
		blockId: 'block-1',
		materials: mockMaterials.filter((m) => m.weekId === 'week-2'),
	},
	{
		id: 'week-3',
		weekNumber: 3,
		title: 'Genética Microbiana',
		description: 'Replicación del ADN y transferencia genética',
		blockId: 'block-1',
		materials: [],
	},
];

// Datos Mock de Bloques (Grupos)
export const mockBlocks: Block[] = [
	{
		id: 'block-1',
		code: 'MICRO-2025II-A',
		groupName: 'Grupo A - Mañana',
		professorId: 'prof-1',
		professorName: 'Dr. Carlos Mendoza Ticona',
		schedule: 'Lunes y Miércoles 08:00-10:00',
		classroom: 'Aula 301',
		capacity: 30,
		enrolledStudents: 28,
		courseId: 'course-1',
		weeks: mockWeeks,
	},
	{
		id: 'block-2',
		code: 'MICRO-2025II-B',
		groupName: 'Grupo B - Tarde',
		professorId: 'prof-2',
		professorName: 'Dra. María Rodríguez López',
		schedule: 'Martes y Jueves 14:00-16:00',
		classroom: 'Aula 302',
		capacity: 30,
		enrolledStudents: 25,
		courseId: 'course-1',
		weeks: [],
	},
];

// Datos Mock de Cursos
export const mockCourses: Course[] = [
	{
		id: 'course-1',
		code: 'BM301',
		name: 'Microbiología General',
		description:
			'Estudio de microorganismos: bacterias, virus, hongos y parásitos',
		credits: 4,
		semesterId: 'sem-2',
		blocks: mockBlocks.filter((b) => b.courseId === 'course-1'),
	},
	{
		id: 'course-2',
		code: 'BB201',
		name: 'Biología Celular',
		description: 'Estructura y función de la célula eucariota y procariota',
		credits: 5,
		semesterId: 'sem-2',
		blocks: [],
	},
	{
		id: 'course-3',
		code: 'BG401',
		name: 'Genética Molecular',
		description: 'Fundamentos de genética a nivel molecular',
		credits: 4,
		semesterId: 'sem-2',
		blocks: [],
	},
];

// Usuario Mock (Estudiante)
export const mockCurrentUser: User = {
	id: 'user-1',
	email: 'juan.perez@unmsm.edu.pe',
	firstName: 'Juan',
	lastName: 'Pérez García',
	role: UserRole.STUDENT,
	programId: 'prog-1',
	enrolledBlocks: ['block-1'],
	avatarUrl: undefined,
};

// Funciones Helper para obtener datos

export function getProgramById(id: string): Program | undefined {
	return mockPrograms.find((p) => p.id === id);
}

export function getSemesterById(id: string): Semester | undefined {
	return mockSemesters.find((s) => s.id === id);
}

export function getCourseById(id: string): Course | undefined {
	return mockCourses.find((c) => c.id === id);
}

export function getBlockById(id: string): Block | undefined {
	return mockBlocks.find((b) => b.id === id);
}

export function getCoursesByProgramAndSemester(
	_programId: string,
	semesterId: string
): Course[] {
	return mockCourses.filter((c) => c.semesterId === semesterId);
}

// DTO Helpers para las vistas

export function getMyCourses(_userId: string): MyCourseCard[] {
	const user = mockCurrentUser;
	if (!user.enrolledBlocks) return [];

	return user.enrolledBlocks
		.map((blockId) => {
			const block = getBlockById(blockId);
			const course = block ? getCourseById(block.courseId) : undefined;

			if (!block || !course) return null;

			return {
				blockId: block.id,
				blockCode: block.code,
				courseName: course.name,
				professorName: block.professorName,
				groupName: block.groupName,
				schedule: block.schedule,
				lastUpdate: block.weeks[0]?.materials[0]?.uploadDate,
			};
		})
		.filter(Boolean) as MyCourseCard[];
}

export function getNewsItems(_userId: string): NewsItem[] {
	const user = mockCurrentUser;
	if (!user.enrolledBlocks) return [];

	const newsItems: NewsItem[] = [];

	user.enrolledBlocks.forEach((blockId) => {
		const block = getBlockById(blockId);
		const course = block ? getCourseById(block.courseId) : undefined;

		if (!block || !course) return;

		block.weeks.forEach((week) => {
			week.materials.forEach((material) => {
				newsItems.push({
					materialId: material.id,
					materialTitle: material.title,
					materialType: material.type,
					courseName: course.name,
					blockCode: block.code,
					uploadDate: material.uploadDate,
					uploadedByName: block.professorName,
				});
			});
		});
	});

	// Ordenar por fecha descendente
	return newsItems.sort(
		(a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()
	);
}
