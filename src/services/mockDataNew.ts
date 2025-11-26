/**
 * Mock Data - Compatible con nuevo ERD
 * UNMSM - Facultad de Ciencias Biológicas
 */

import type {
	Faculty,
	Program,
	Course,
	Semester,
	CourseOffering,
	Block,
	Week,
	Material,
	FileResource,
	User,
	Enrollment,
	EnrollmentBlock,
	MyCourseCard,
	NewsItem,
	BlockDetail,
} from '@/types/academic-new';
import {
	MaterialType,
	BlockType,
	AcademicLevel,
	DegreeType,
	StorageProvider,
	AuthProvider,
} from '@/types/academic-new';

// ============================================
// FACULTY
// ============================================

export const mockFaculty: Faculty = {
	facultyId: 1,
	facultyName: 'Facultad de Ciencias Biológicas',
};

// ============================================
// PROGRAMS
// ============================================

export const mockPrograms: Program[] = [
	{
		programId: 1,
		facultyId: 1,
		programName: 'Microbiología y Parasitología',
		academicLevel: AcademicLevel.UNDERGRADUATE,
		degreeType: DegreeType.BACHELOR,
	},
	{
		programId: 2,
		facultyId: 1,
		programName: 'Genética y Biotecnología',
		academicLevel: AcademicLevel.UNDERGRADUATE,
		degreeType: DegreeType.BACHELOR,
	},
	{
		programId: 3,
		facultyId: 1,
		programName: 'Ciencias Biológicas',
		academicLevel: AcademicLevel.UNDERGRADUATE,
		degreeType: DegreeType.BACHELOR,
	},
	{
		programId: 4,
		facultyId: 1,
		programName: 'Maestría en Microbiología',
		academicLevel: AcademicLevel.POSTGRADUATE,
		degreeType: DegreeType.MASTER,
	},
	{
		programId: 5,
		facultyId: 1,
		programName: 'Diplomado en Biotecnología Aplicada',
		academicLevel: AcademicLevel.POSTGRADUATE,
		degreeType: DegreeType.DIPLOMA,
	},
];

// ============================================
// COURSES
// ============================================

export const mockCourses: Course[] = [
	{
		courseId: 1,
		programId: 1,
		courseName: 'Microbiología General',
		description: 'Fundamentos de microbiología',
		credits: 4,
	},
	{
		courseId: 2,
		programId: 1,
		courseName: 'Parasitología Médica',
		description: 'Estudio de parásitos',
		credits: 3,
	},
	{
		courseId: 3,
		programId: 2,
		courseName: 'Genética Molecular',
		description: 'Bases moleculares de la herencia',
		credits: 4,
	},
];

// ============================================
// SEMESTERS
// ============================================

export const mockSemesters: Semester[] = [
	{
		semesterId: 1,
		semesterName: '2024-1',
		startDate: new Date('2024-03-01'),
		endDate: new Date('2024-07-31'),
	},
	{
		semesterId: 2,
		semesterName: '2024-2',
		startDate: new Date('2024-08-01'),
		endDate: new Date('2024-12-20'),
	},
];

// ============================================
// COURSE OFFERINGS
// ============================================

export const mockCourseOfferings: CourseOffering[] = [
	{
		courseOfferingId: 1,
		courseId: 1,
		semesterId: 2,
		startDate: new Date('2024-08-05'),
		endDate: new Date('2024-12-15'),
		status: 'ACTIVE',
	},
	{
		courseOfferingId: 2,
		courseId: 2,
		semesterId: 2,
		startDate: new Date('2024-08-05'),
		endDate: new Date('2024-12-15'),
		status: 'ACTIVE',
	},
	{
		courseOfferingId: 3,
		courseId: 3,
		semesterId: 2,
		startDate: new Date('2024-08-05'),
		endDate: new Date('2024-12-15'),
		status: 'ACTIVE',
	},
];

// ============================================
// BLOCKS (Theory & Practice)
// ============================================

export const mockBlocks: Block[] = [
	{
		blockId: 1,
		courseOfferingId: 1,
		name: 'Teoría A',
		blockType: BlockType.THEORY,
		maxCapacity: 40,
		classroomNumber: 'B-301',
		syllabusFileId: 1,
	},
	{
		blockId: 2,
		courseOfferingId: 1,
		name: 'Práctica 1',
		blockType: BlockType.PRACTICE,
		maxCapacity: 20,
		classroomNumber: 'Lab-102',
	},
	{
		blockId: 3,
		courseOfferingId: 2,
		name: 'Teoría A',
		blockType: BlockType.THEORY,
		maxCapacity: 35,
		classroomNumber: 'B-205',
		syllabusFileId: 2,
	},
];

// ============================================
// FILE RESOURCES
// ============================================

export const mockFileResources: FileResource[] = [
	{
		fileId: 1,
		providerKey: 'syllabi/microbiologia-general-2024-2.pdf',
		providerBucket: 'biorepo-files',
		storageProvider: StorageProvider.AWS_S3,
		fileName: 'Silabo_Microbiologia_General.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 245678,
		publicUrl:
			'https://biorepo-files.s3.amazonaws.com/syllabi/microbiologia-general-2024-2.pdf',
	},
	{
		fileId: 2,
		providerKey: 'syllabi/parasitologia-medica-2024-2.pdf',
		providerBucket: 'biorepo-files',
		storageProvider: StorageProvider.AWS_S3,
		fileName: 'Silabo_Parasitologia_Medica.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 198432,
	},
	{
		fileId: 3,
		providerKey: 'materials/week1/introduccion-micro.pdf',
		providerBucket: 'biorepo-files',
		storageProvider: StorageProvider.AWS_S3,
		fileName: 'Introduccion_Microbiologia.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 1234567,
	},
];

// ============================================
// WEEKS
// ============================================

export const mockWeeks: Week[] = [
	{
		weekId: 1,
		blockId: 1,
		weekNumber: 1,
		topicSummary: 'Introducción a la Microbiología',
	},
	{
		weekId: 2,
		blockId: 1,
		weekNumber: 2,
		topicSummary: 'Bacterias: Estructura y Morfología',
	},
	{
		weekId: 3,
		blockId: 1,
		weekNumber: 3,
		topicSummary: 'Metabolismo Bacteriano',
	},
];

// ============================================
// MATERIALS
// ============================================

export const mockMaterials: Material[] = [
	{
		materialId: 1,
		weekId: 1,
		title: 'Introducción a la Microbiología',
		materialType: MaterialType.FILE,
		fileResourceId: 3,
	},
	{
		materialId: 2,
		weekId: 1,
		title: 'Video: Historia de la Microbiología',
		materialType: MaterialType.LINK,
		externalLinkUrl: 'https://www.youtube.com/watch?v=example',
	},
	{
		materialId: 3,
		weekId: 2,
		title: 'Atlas de Bacterias',
		materialType: MaterialType.LINK,
		externalLinkUrl: 'https://atlas-bacterias.unmsm.edu.pe',
	},
];

// ============================================
// USERS
// ============================================

export const mockCurrentUser: User = {
	userId: 1,
	externalAuthId: 'cognito-uuid-12345',
	authProvider: AuthProvider.AWS_COGNITO,
	email: 'juan.perez@unmsm.edu.pe',
	firstName: 'Juan',
	lastName: 'Pérez',
	roleId: 1,
	isActive: true,
};

export const mockInstructor: User = {
	userId: 2,
	externalAuthId: 'cognito-uuid-67890',
	authProvider: AuthProvider.AWS_COGNITO,
	email: 'maria.garcia@unmsm.edu.pe',
	firstName: 'María',
	lastName: 'García',
	roleId: 2,
	isActive: true,
};

// ============================================
// ENROLLMENTS
// ============================================

export const mockEnrollments: Enrollment[] = [
	{
		enrollmentId: 1,
		userId: 1,
		courseOfferingId: 1,
		enrollmentDate: new Date('2024-07-15'),
		status: 'ACTIVE',
	},
	{
		enrollmentId: 2,
		userId: 1,
		courseOfferingId: 2,
		enrollmentDate: new Date('2024-07-15'),
		status: 'ACTIVE',
	},
];

export const mockEnrollmentBlocks: EnrollmentBlock[] = [
	{
		enrollmentBlockId: 1,
		enrollmentId: 1,
		blockId: 1,
	},
	{
		enrollmentBlockId: 2,
		enrollmentId: 1,
		blockId: 2,
	},
	{
		enrollmentBlockId: 3,
		enrollmentId: 2,
		blockId: 3,
	},
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getMyCourses(userId: number): MyCourseCard[] {
	const userEnrollments = mockEnrollments.filter((e) => e.userId === userId);

	return userEnrollments.map((enrollment) => {
		const offering = mockCourseOfferings.find(
			(o) => o.courseOfferingId === enrollment.courseOfferingId
		)!;
		const course = mockCourses.find(
			(c) => c.courseId === offering.courseId
		)!;
		const program = mockPrograms.find(
			(p) => p.programId === course.programId
		)!;
		const semester = mockSemesters.find(
			(s) => s.semesterId === offering.semesterId
		)!;

		const enrolledBlocks = mockEnrollmentBlocks
			.filter((eb) => eb.enrollmentId === enrollment.enrollmentId)
			.map((eb) => {
				const block = mockBlocks.find((b) => b.blockId === eb.blockId)!;
				return {
					blockId: block.blockId,
					blockName: block.name,
					blockType: block.blockType,
				};
			});

		return {
			enrollmentId: enrollment.enrollmentId,
			courseOfferingId: offering.courseOfferingId,
			courseName: course.courseName,
			programName: program.programName,
			semesterName: semester.semesterName,
			blocks: enrolledBlocks,
			finalAverage: enrollment.finalAverage,
			lastUpdate: new Date(),
		};
	});
}

export function getNewsItems(userId: number): NewsItem[] {
	const userEnrollments = mockEnrollments.filter((e) => e.userId === userId);
	const enrollmentIds = userEnrollments.map((e) => e.enrollmentId);

	const userBlocks = mockEnrollmentBlocks
		.filter((eb) => enrollmentIds.includes(eb.enrollmentId))
		.map((eb) => eb.blockId);

	const userWeeks = mockWeeks.filter((w) => userBlocks.includes(w.blockId));
	const weekIds = userWeeks.map((w) => w.weekId);

	const recentMaterials = mockMaterials.filter((m) =>
		weekIds.includes(m.weekId)
	);

	return recentMaterials.map((material) => {
		const week = mockWeeks.find((w) => w.weekId === material.weekId)!;
		const block = mockBlocks.find((b) => b.blockId === week.blockId)!;
		const offering = mockCourseOfferings.find(
			(o) => o.courseOfferingId === block.courseOfferingId
		)!;
		const course = mockCourses.find(
			(c) => c.courseId === offering.courseId
		)!;

		return {
			materialId: material.materialId,
			materialTitle: material.title,
			materialType: material.materialType,
			courseName: course.courseName,
			blockName: block.name,
			uploadedByName:
				mockInstructor.firstName + ' ' + mockInstructor.lastName,
			uploadDate: new Date(),
		};
	});
}

export function getBlockDetail(blockId: number): BlockDetail | null {
	const block = mockBlocks.find((b) => b.blockId === blockId);
	if (!block) return null;

	const offering = mockCourseOfferings.find(
		(o) => o.courseOfferingId === block.courseOfferingId
	)!;
	const course = mockCourses.find((c) => c.courseId === offering.courseId)!;
	const program = mockPrograms.find((p) => p.programId === course.programId)!;
	const semester = mockSemesters.find(
		(s) => s.semesterId === offering.semesterId
	)!;

	const weeks = mockWeeks
		.filter((w) => w.blockId === blockId)
		.map((week) => ({
			...week,
			sessions: [],
			materials: mockMaterials
				.filter((m) => m.weekId === week.weekId)
				.map((material) => ({
					...material,
					fileResource: material.fileResourceId
						? mockFileResources.find(
								(f) => f.fileId === material.fileResourceId
						  )
						: undefined,
				})),
		}));

	const syllabusFile = block.syllabusFileId
		? mockFileResources.find((f) => f.fileId === block.syllabusFileId)
		: undefined;

	return {
		block,
		course,
		courseOffering: offering,
		semester,
		program,
		faculty: mockFaculty,
		weeks,
		instructor: mockInstructor,
		syllabusFile,
	};
}

export function getCourseOfferingsByFilters(
	facultyId?: number,
	programId?: number,
	semesterId?: number
): CourseOffering[] {
	let offerings = mockCourseOfferings;

	if (semesterId) {
		offerings = offerings.filter((o) => o.semesterId === semesterId);
	}

	if (programId) {
		const programCourseIds = mockCourses
			.filter((c) => c.programId === programId)
			.map((c) => c.courseId);
		offerings = offerings.filter((o) =>
			programCourseIds.includes(o.courseId)
		);
	}

	if (facultyId) {
		const facultyProgramIds = mockPrograms
			.filter((p) => p.facultyId === facultyId)
			.map((p) => p.programId);
		const facultyCourseIds = mockCourses
			.filter((c) => facultyProgramIds.includes(c.programId))
			.map((c) => c.courseId);
		offerings = offerings.filter((o) =>
			facultyCourseIds.includes(o.courseId)
		);
	}

	return offerings;
}
