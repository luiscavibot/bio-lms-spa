/**
 * Servicio para gestión de Semestres
 */

import { httpClient } from '@/lib/httpClient';

export interface SemesterDto {
	semesterId: number;
	year: number;
	period: number;
	name: string;
	startDate: string;
	endDate: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateSemesterDto {
	year: number;
	period: number;
	startDate: string;
	endDate: string;
}

export interface UpdateSemesterDto {
	year?: number;
	period?: number;
	startDate?: string;
	endDate?: string;
}

export interface SemesterListResponse {
	semesters: SemesterDto[];
	total: number;
}

export const semesterService = {
	/**
	 * Obtener todos los semestres
	 */
	async getAll(): Promise<SemesterListResponse> {
		const response = await httpClient.get<SemesterListResponse>(
			'/semesters'
		);
		return response;
	},

	/**
	 * Crear un nuevo semestre
	 */
	async create(data: CreateSemesterDto): Promise<SemesterDto> {
		const response = await httpClient.post<SemesterDto>('/semesters', data);
		return response;
	},

	/**
	 * Actualizar un semestre existente
	 */
	async update(
		semesterId: number,
		data: UpdateSemesterDto
	): Promise<SemesterDto> {
		const response = await httpClient.put<SemesterDto>(
			`/semesters/${semesterId}`,
			data
		);
		return response;
	},

	/**
	 * Eliminar un semestre
	 */
	async delete(semesterId: number): Promise<void> {
		await httpClient.delete(`/semesters/${semesterId}`);
	},
};
