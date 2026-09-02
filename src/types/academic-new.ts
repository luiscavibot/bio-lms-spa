/**
 * Tipos TypeScript - Sistema Académico BioRepo (ERD Refactorizado)
 * Estructura: Faculty → Program → Course → CourseOffering → Block → Week → Material
 */

// ============================================
// ENUMS Y CONSTANTES
// ============================================

export const MaterialType = {
	FILE: 'FILE',
	LINK: 'LINK',
} as const;

export type MaterialTypeValue =
	(typeof MaterialType)[keyof typeof MaterialType];

export const UserRole = {
	TEACHER: 'Teacher',
	ADMIN: 'Admin',
	STUDENT: 'Student',
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

export const BlockType = {
	THEORY: 'THEORY',
	PRACTICE: 'PRACTICE',
} as const;

export type BlockTypeValue = (typeof BlockType)[keyof typeof BlockType];

export const AcademicLevel = {
	UNDERGRADUATE: 'UNDERGRADUATE',
	POSTGRADUATE: 'POSTGRADUATE',
} as const;

export type AcademicLevelValue =
	(typeof AcademicLevel)[keyof typeof AcademicLevel];

export const DegreeType = {
	BACHELOR: 'BACHELOR',
	MASTER: 'MASTER',
	DOCTORATE: 'DOCTORATE',
	DIPLOMA: 'DIPLOMA',
} as const;

export type DegreeTypeValue = (typeof DegreeType)[keyof typeof DegreeType];

export const StorageProvider = {
	AWS_S3: 'AWS_S3',
	AZURE_BLOB: 'AZURE_BLOB',
} as const;

export type StorageProviderValue =
	(typeof StorageProvider)[keyof typeof StorageProvider];

export const AuthProvider = {
	AWS_COGNITO: 'AWS_COGNITO',
	AUTH0: 'AUTH0',
} as const;

export type AuthProviderValue =
	(typeof AuthProvider)[keyof typeof AuthProvider];

// ============================================
// 1. IDENTITY & AUTH
// ============================================

export interface Role {
	roleId: number;
	roleName: UserRoleValue;
}

export interface User {
	userId: number;
	externalAuthId: string; // UID from Auth Provider
	authProvider: AuthProviderValue;
	email: string;
	firstName: string;
	lastName: string;
	profileImgId?: number; // FK to FileResource
	resumeFileId?: number; // FK to FileResource
	roleId: number;
	isActive: boolean;
}

// ============================================
// 2. FILE STORAGE ABSTRACTION
// ============================================

export interface FileResource {
	fileId: number;
	providerKey: string; // File path in bucket
	providerBucket: string;
	storageProvider: StorageProviderValue;
	fileName: string; // Original filename
	mimeType: string;
	sizeBytes: number;
	publicUrl?: string; // Cached URL
}

// ============================================
// 3. ACADEMIC CATALOG
// ============================================

export interface Faculty {
	facultyId: number;
	facultyName: string;
}

export interface Program {
	programId: number;
	facultyId: number;
	programName: string;
	academicLevel: AcademicLevelValue;
	degreeType: DegreeTypeValue;
}

export interface Course {
	courseId: number;
	programId: number;
	courseName: string;
	description?: string;
	credits: number;
}

export interface AcademicModule {
	moduleId: number;
	programId: number;
	moduleName: string; // For Diplomados
	orderIndex: number;
}

// ============================================
// 4. OFFERING & LOGISTICS
// ============================================

export interface Semester {
	semesterId: number;
	semesterName: string;
	startDate: Date;
	endDate: Date;
}

export interface CourseOffering {
	courseOfferingId: number;
	courseId: number;
	semesterId: number;
	academicModuleId?: number; // Nullable
	startDate: Date;
	endDate: Date;
	status: string; // e.g., "ACTIVE", "COMPLETED"
}

// ============================================
// 5. BLOCKS (Theory & Practice)
// ============================================

export interface Block {
	blockId: number;
	courseOfferingId: number;
	name: string; // "Theory A", "Practice 1"
	blockType: BlockTypeValue;
	maxCapacity: number;
	classroomNumber?: string;
	syllabusFileId?: number; // FK to FileResource
}

export interface BlockAssignment {
	assignmentId: number;
	userId: number; // Instructor
	blockId: number;
	role: string; // e.g., "INSTRUCTOR", "ASSISTANT"
}

// ============================================
// 6. SCHEDULING & CONTENT
// ============================================

export interface Week {
	weekId: number;
	blockId: number;
	weekNumber: number;
	topicSummary?: string;
}

export interface ClassSession {
	sessionId: number;
	weekId: number;
	sessionDate: Date;
	startTime: string; // Time format "HH:MM"
	endTime: string;
	virtualMeetingUrl?: string;
}

export interface Material {
	materialId: number;
	weekId: number;
	title: string;
	materialType: MaterialTypeValue;
	fileResourceId?: number; // FK to FileResource (if type is FILE)
	externalLinkUrl?: string; // If type is LINK
}

// ============================================
// 7. STUDENT LIFE
// ============================================

export interface Enrollment {
	enrollmentId: number;
	userId: number;
	courseOfferingId: number;
	enrollmentDate: Date;
	finalAverage?: number;
	status: string; // e.g., "ACTIVE", "COMPLETED", "DROPPED"
}

export interface EnrollmentBlock {
	enrollmentBlockId: number;
	enrollmentId: number;
	blockId: number;
	blockAverage?: number;
}

export interface Attendance {
	attendanceId: number;
	enrollmentId: number;
	sessionId: number;
	status: string; // e.g., "PRESENT", "ABSENT", "LATE"
}

// ============================================
// 8. GRADING
// ============================================

export interface Evaluation {
	evaluationId: number;
	blockId: number;
	title: string;
	weightPercentage: number;
	dueDate?: Date;
}

export interface Grade {
	gradeId: number;
	evaluationId: number;
	enrollmentId: number;
	score: number;
	feedback?: string;
}

// ============================================
// DTOs & VIEW MODELS (Para la UI)
// ============================================

/**
 * DTO: Tarjeta de curso en Dashboard (vista de estudiante)
 */
export interface MyCourseCard {
	enrollmentId: number;
	courseOfferingId: number;
	courseName: string;
	programName: string;
	semesterName: string;
	blocks: {
		blockId: number;
		blockName: string;
		blockType: BlockTypeValue;
	}[];
	finalAverage?: number;
	lastUpdate?: Date;
}

/**
 * DTO: Item de novedades (nuevos materiales subidos)
 */
export interface NewsItem {
	materialId: number;
	materialTitle: string;
	materialType: MaterialTypeValue;
	courseName: string;
	blockName: string;
	uploadedByName: string;
	uploadDate: Date;
}

/**
 * DTO: Detalle completo de un bloque (Theory o Practice)
 */
export interface BlockDetail {
	block: Block;
	course: Course;
	courseOffering: CourseOffering;
	semester: Semester;
	program: Program;
	faculty: Faculty;
	weeks: (Week & {
		sessions: ClassSession[];
		materials: (Material & {
			fileResource?: FileResource;
		})[];
	})[];
	instructor?: User;
	syllabusFile?: FileResource;
}

/**
 * Filtros para la biblioteca global
 */
export interface LibraryFilters {
	facultyId?: number;
	programId?: number;
	semesterId?: number;
	courseId?: number;
}
