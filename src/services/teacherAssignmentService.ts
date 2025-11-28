/**
 * Servicio para gestión de Asignación de Docentes
 */

import { httpClient } from '@/lib/httpClient';

export interface TeacherAssignmentDto {
	assignmentId: number;
	teacherId: number;
	teacherName: string;
	teacherCode: string;
	courseOfferingId: number;
	courseName: string;
	courseCode: string;
	semesterName: string;
	section: string;
	assignmentDate: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTeacherAssignmentDto {
	teacherId: number;
	courseOfferingId: number;
}

export interface TeacherAssignmentListResponse {
	assignments: TeacherAssignmentDto[];
	total: number;
}

export interface TeacherBasicDto {
	teacherId: number;
	name: string;
	code: string;
	email: string;
	departmentId?: number;
	departmentName?: string;
	isActive: boolean;
}

export interface TeacherListResponse {
	teachers: TeacherBasicDto[];
	total: number;
}

export const teacherAssignmentService = {
	/**
	 * Obtener todas las asignaciones
	 */
	async getAll(params?: {
		semesterId?: number;
		teacherId?: number;
	}): Promise<TeacherAssignmentListResponse> {
		const queryParams = new URLSearchParams();
		if (params?.semesterId)
			queryParams.append('semesterId', params.semesterId.toString());
		if (params?.teacherId)
			queryParams.append('teacherId', params.teacherId.toString());

		const url = `/teacher-assignments${
			queryParams.toString() ? `?${queryParams.toString()}` : ''
		}`;
		const response = await httpClient.get<TeacherAssignmentListResponse>(
			url
		);
		return response;
	},

	/**
	 * Crear una nueva asignación
	 */
	async create(
		data: CreateTeacherAssignmentDto
	): Promise<TeacherAssignmentDto> {
		const response = await httpClient.post<TeacherAssignmentDto>(
			'/teacher-assignments',
			data
		);
		return response;
	},

	/**
	 * Eliminar una asignación
	 */
	async delete(assignmentId: number): Promise<void> {
		await httpClient.delete(`/teacher-assignments/${assignmentId}`);
	},

	/**
	 * Obtener lista de docentes (para select)
	 */
	async getTeachers(): Promise<TeacherListResponse> {
		const response = await httpClient.get<TeacherListResponse>('/teachers');
		return response;
	},
};
