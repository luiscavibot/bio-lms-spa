import { httpClient } from '@/lib/httpClient';

export interface FacultyDto {
	facultyId: number;
	facultyName: string;
	isActive: boolean;
}

export interface FacultyListDto {
	faculties: FacultyDto[];
	total: number;
}

export const facultiesService = {
	async getAll(): Promise<FacultyListDto> {
		const res = await httpClient.get('/api/v1/faculties');
		return res as FacultyListDto;
	},
};
