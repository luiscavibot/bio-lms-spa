/**
 * Sistema de Tipos para Roles y Permisos
 * Según directivas del backend
 */

// ==================== ROLES ====================

export type RoleName = 'Admin' | 'Teacher' | 'Student';

export interface Role {
	roleId: number;
	roleName: RoleName;
	description?: string;
}

// ==================== USUARIO ====================

export interface User {
	userId: number;
	email: string;
	firstName: string;
	lastName: string;
	cognitoId: string;
	role: Role;
	createdAt?: string;
	updatedAt?: string;
}

// ==================== PERMISOS CASL ====================

/**
 * Acciones disponibles en el sistema
 */
export type Actions =
	| 'manage' // Permiso total (wildcard)
	| 'create' // Crear recursos
	| 'read' // Leer/ver recursos
	| 'update' // Actualizar recursos
	| 'delete'; // Eliminar recursos

/**
 * Sujetos (recursos) del sistema
 */
export type Subjects =
	| 'Course' // Cursos
	| 'Grade' // Calificaciones
	| 'User' // Usuarios
	| 'Assignment' // Tareas/Asignaciones
	| 'Material' // Materiales de curso
	| 'Enrollment' // Inscripciones
	| 'all'; // Todos los recursos (wildcard)

/**
 * Condiciones para permisos contextuales
 * Ejemplo: { teacherId: 2 } significa "solo si teacherId === 2"
 */
export interface PermissionConditions {
	teacherId?: number;
	studentId?: number;
	userId?: number;
	courseId?: number;
	[key: string]: any;
}

/**
 * Regla de habilidad según formato del backend
 */
export interface AbilityRule {
	action: Actions;
	subject: Subjects;
	conditions?: PermissionConditions;
	fields?: string[]; // Campos específicos permitidos
	inverted?: boolean; // Si es true, es una regla de negación
	reason?: string; // Razón de la restricción (opcional)
}

// ==================== RESPUESTA DEL BACKEND ====================

/**
 * Respuesta de GET /api/v1/auth/me
 */
export interface AuthMeResponse {
	user: User;
	abilities: AbilityRule[];
}

// ==================== OBJETOS CON PERMISOS ====================

/**
 * Curso con información de ownership para validación de permisos
 */
export interface CourseWithPermissions {
	courseId: number;
	courseName: string;
	teacherId?: number; // Importante para validar conditions
	// ... otros campos
}

/**
 * Calificación con información de ownership
 */
export interface GradeWithPermissions {
	gradeId: number;
	studentId: number; // Importante para validar conditions
	courseId: number;
	// ... otros campos
}

/**
 * Asignación con información de ownership
 */
export interface AssignmentWithPermissions {
	assignmentId: number;
	courseId: number;
	teacherId?: number; // Importante para validar conditions
	// ... otros campos
}
