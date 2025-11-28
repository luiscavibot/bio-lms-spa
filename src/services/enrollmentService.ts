/**
 * Servicio para gestión de Matrículas
 */

import { httpClient } from '@/lib/httpClient';

export interface EnrollmentDto {
	enrollmentId: number;
	studentId: number;
	studentName: string;
	studentCode: string;
	courseOfferingId: number;
	courseName: string;
	courseCode: string;
	semesterName: string;
	enrollmentDate: string;
	status: 'active' | 'dropped' | 'completed';
	createdAt: string;
	updatedAt: string;
}

export interface CreateEnrollmentDto {
	studentId: number;
	courseOfferingId: number;
}

export interface EnrollmentListResponse {
	enrollments: EnrollmentDto[];
	total: number;
}

export interface StudentBasicDto {
	studentId: number;
	name: string;
	code: string;
	email: string;
	programId: number;
	programName: string;
}

export interface StudentListResponse {
	students: StudentBasicDto[];
	total: number;
}

export interface CourseOfferingBasicDto {
	courseOfferingId: number;
	courseName: string;
	courseCode: string;
	semesterName: string;
	section: string;
	teacherName?: string;
	availableSeats: number;
	totalSeats: number;
}

export interface CourseOfferingListResponse {
	offerings: CourseOfferingBasicDto[];
	total: number;
}

export const enrollmentService = {
	/**
	 * Obtener todas las matrículas
	 */
	async getAll(params?: {
		semesterId?: number;
		studentId?: number;
		status?: string;
	}): Promise<EnrollmentListResponse> {
		const queryParams = new URLSearchParams();
		if (params?.semesterId)
			queryParams.append('semesterId', params.semesterId.toString());
		if (params?.studentId)
			queryParams.append('studentId', params.studentId.toString());
		if (params?.status) queryParams.append('status', params.status);

		const url = `/enrollments${
			queryParams.toString() ? `?${queryParams.toString()}` : ''
		}`;
		const response = await httpClient.get<EnrollmentListResponse>(url);
		return response;
	},

	/**
	 * Crear una nueva matrícula
	 */
	async create(data: CreateEnrollmentDto): Promise<EnrollmentDto> {
		const response = await httpClient.post<EnrollmentDto>(
			'/enrollments',
			data
		);
		return response;
	},

	/**
	 * Eliminar una matrícula
	 */
	async delete(enrollmentId: number): Promise<void> {
		await httpClient.delete(`/enrollments/${enrollmentId}`);
	},

	/**
	 * Obtener lista de estudiantes (para select)
	 */
	async getStudents(): Promise<StudentListResponse> {
		const response = await httpClient.get<StudentListResponse>('/students');
		return response;
	},

	/**
	 * Obtener lista de ofertas de curso (para select)
	 */
	async getCourseOfferings(
		semesterId?: number
	): Promise<CourseOfferingListResponse> {
		const url = semesterId
			? `/course-offerings?semesterId=${semesterId}`
			: '/course-offerings';
		const response = await httpClient.get<CourseOfferingListResponse>(url);
		return response;
	},
};
