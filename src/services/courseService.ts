/**
 * Servicio para gestión de Cursos
 */

import { httpClient } from '@/lib/httpClient';

export interface CourseDto {
	courseId: number;
	courseCode: string;
	courseName: string;
	credits: number;
	programId: number;
	programName: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCourseDto {
	courseCode: string;
	courseName: string;
	credits: number;
	programId: number;
}

export interface UpdateCourseDto {
	courseCode?: string;
	courseName?: string;
	credits?: number;
	programId?: number;
	isActive?: boolean;
}

export interface CourseListResponse {
	courses: CourseDto[];
	total: number;
}

export interface ProgramDto {
	programId: number;
	programName: string;
	programCode: string;
	facultyId: number;
	facultyName: string;
	isActive: boolean;
}

export interface ProgramListResponse {
	programs: ProgramDto[];
	total: number;
}

export const courseService = {
	/**
	 * Obtener todos los cursos
	 */
	async getAll(): Promise<CourseListResponse> {
		const response = await httpClient.get<CourseListResponse>('/courses');
		return response;
	},

	/**
	 * Crear un nuevo curso
	 */
	async create(data: CreateCourseDto): Promise<CourseDto> {
		const response = await httpClient.post<CourseDto>('/courses', data);
		return response;
	},

	/**
	 * Actualizar un curso existente
	 */
	async update(courseId: number, data: UpdateCourseDto): Promise<CourseDto> {
		const response = await httpClient.put<CourseDto>(
			`/courses/${courseId}`,
			data
		);
		return response;
	},

	/**
	 * Eliminar un curso
	 */
	async delete(courseId: number): Promise<void> {
		await httpClient.delete(`/courses/${courseId}`);
	},

	/**
	 * Obtener todos los programas académicos (para select)
	 */
	async getPrograms(): Promise<ProgramListResponse> {
		const response = await httpClient.get<ProgramListResponse>('/programs');
		return response;
	},
};
