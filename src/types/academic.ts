/**
 * BioRepo - Modelo de Datos Académico
 * Jerarquía: Program → Semester → Course → Block → Week → Material
 */

// Tipos de archivo
export const MaterialType = {
	PDF: 'pdf',
	VIDEO: 'video',
	PRESENTATION: 'presentation',
	DOCUMENT: 'document',
	LINK: 'link',
	OTHER: 'other',
} as const;

export type MaterialType = (typeof MaterialType)[keyof typeof MaterialType];

// Roles de usuario
export const UserRole = {
	STUDENT: 'student',
	PROFESSOR: 'professor',
	ADMIN: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Material: El archivo/recurso final (PDF, Video, Presentación, etc.)
 */
export interface Material {
	id: string;
	title: string;
	description?: string;
	type: MaterialType;
	fileUrl?: string; // URL del archivo en S3 o sistema de almacenamiento
	externalUrl?: string; // URL externa (ej. YouTube, Google Drive)
	fileSize?: number; // Tamaño en bytes
	uploadDate: Date;
	uploadedBy: string; // ID del profesor que subió el material
	weekId: string; // Relación con la semana
}

/**
 * Week: Unidad temporal de organización (Semana 1, Semana 2, etc.)
 */
export interface Week {
	id: string;
	weekNumber: number;
	title: string; // Ej. "Introducción a la Biología Celular"
	description?: string;
	startDate?: Date;
	endDate?: Date;
	blockId: string; // Relación con el bloque
	materials: Material[];
}

/**
 * Block: Asignación específica/Grupo (Ej. Grupo A - Laboratorio 1)
 * Es la unidad a la que el estudiante se inscribe
 */
export interface Block {
	id: string;
	code: string; // Ej. "MICRO-2025I-LAB-A"
	groupName: string; // Ej. "Grupo A"
	professorId: string;
	professorName: string;
	schedule?: string; // Ej. "Lunes 14:00-16:00"
	classroom?: string; // Ej. "Lab 301"
	capacity?: number;
	enrolledStudents?: number;
	courseId: string; // Relación con el curso
	weeks: Week[];
}

/**
 * Course: La materia teórica (Ej. Biología Celular)
 */
export interface Course {
	id: string;
	code: string; // Código oficial del curso, Ej. "BIO101"
	name: string; // Ej. "Biología Celular"
	description?: string;
	credits: number;
	syllabus?: string; // URL al sílabo
	semesterId: string; // Relación con el semestre
	blocks: Block[]; // Diferentes grupos/secciones del curso
}

/**
 * Semester: Ciclo Académico (Ej. 2025-I, 2025-II)
 */
export interface Semester {
	id: string;
	code: string; // Ej. "2025-I", "2025-II"
	name: string; // Ej. "Primer Semestre 2025"
	startDate: Date;
	endDate: Date;
	isActive: boolean;
	programId: string; // Relación con el programa
	courses: Course[];
}

/**
 * Program: Carrera Profesional (Ej. Microbiología, Genética)
 */
export interface Program {
	id: string;
	code: string; // Código oficial de la carrera
	name: string; // Ej. "Microbiología y Parasitología"
	description?: string;
	facultyId: string; // ID de la Facultad (FCB-UNMSM)
	semesters: Semester[];
}

/**
 * User: Estudiante o Profesor
 */
export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	programId?: string; // Para estudiantes
	enrolledBlocks?: string[]; // IDs de bloques inscritos (estudiantes)
	teachingBlocks?: string[]; // IDs de bloques que enseña (profesores)
	avatarUrl?: string;
}

/**
 * Enrollment: Inscripción de un estudiante a un bloque
 */
export interface Enrollment {
	id: string;
	studentId: string;
	blockId: string;
	enrollmentDate: Date;
	status: 'active' | 'dropped' | 'completed';
}

/**
 * DTOs para las vistas
 */

// Para el Dashboard - "Mis Cursos"
export interface MyCourseCard {
	blockId: string;
	blockCode: string;
	courseName: string;
	professorName: string;
	groupName: string;
	schedule?: string;
	lastUpdate?: Date;
}

// Para el Dashboard - "Novedades"
export interface NewsItem {
	materialId: string;
	materialTitle: string;
	materialType: MaterialType;
	courseName: string;
	blockCode: string;
	uploadDate: Date;
	uploadedByName: string;
}

// Para la Biblioteca Global - Filtros
export interface LibraryFilters {
	programId?: string;
	semesterId?: string;
	searchTerm?: string;
}

// Para el Detalle del Curso
export interface CourseDetail {
	block: Block;
	course: Course;
	semester: Semester;
	program: Program;
	weeks: Week[];
}
