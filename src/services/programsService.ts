/**
 * Servicio para gestión de Programas Académicos
 */

import { httpClient } from '@/lib/httpClient';

export interface ProgramDto {
	programId: number;
	programName: string;
	programCode: string;
	facultyId: number;
	facultyName?: string;
	academicLevel?: string; // UNDERGRADUATE | POSTGRADUATE
	degreeType?: string; // BACHELOR | MASTER | DOCTORATE | DIPLOMA
	isActive: boolean;
}

export interface CreateProgramDto {
	programName: string;
	programCode: string;
	facultyId: number;
	academicLevel: string;
	degreeType: string;
}

export interface UpdateProgramDto {
	programName?: string;
	programCode?: string;
	facultyId?: number;
	academicLevel?: string;
	degreeType?: string;
	isActive?: boolean;
}

export interface ProgramListResponse {
	programs: ProgramDto[];
	total: number;
}

export const programsService = {
	/** Obtener todos los programas */
	async getAll(): Promise<ProgramListResponse> {
		const response = await httpClient.get<ProgramListResponse>(
			'/api/v1/programs'
		);
		return response;
	},

	/** Crear programa */
	async create(data: CreateProgramDto): Promise<ProgramDto> {
		const response = await httpClient.post<ProgramDto>(
			'/api/v1/programs',
			data
		);
		return response;
	},

	/** Actualizar programa */
	async update(
		programId: number,
		data: UpdateProgramDto
	): Promise<ProgramDto> {
		const response = await httpClient.put<ProgramDto>(
			`/api/v1/programs/${programId}`,
			data
		);
		return response;
	},

	/** Eliminar programa */
	async delete(programId: number): Promise<void> {
		await httpClient.delete(`/api/v1/programs/${programId}`);
	},
};
