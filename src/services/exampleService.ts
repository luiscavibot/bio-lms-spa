/**
 * Ejemplo de servicio usando httpClient
 * Este archivo muestra cómo estructurar servicios para tu backend
 */

import { httpClient } from '@/lib/httpClient';
import { useAuthStore } from '@/store/authStore';
import type { Block, Course, Program } from '@/types/academic-new';

// ==================================
// EJEMPLO 1: Servicio de Cursos
// ==================================

interface CourseResponse {
	courses: Course[];
	total: number;
}

export const courseService = {
	/**
	 * Obtener todos los cursos (con token automático)
	 */
	async getAll(programId?: number): Promise<CourseResponse> {
		const query = programId ? `?programId=${programId}` : '';
		return httpClient.get<CourseResponse>(`/courses${query}`);
	},

	/**
	 * Obtener un curso por ID
	 */
	async getById(courseId: number): Promise<Course> {
		return httpClient.get<Course>(`/courses/${courseId}`);
	},

	/**
	 * Crear un nuevo curso (requiere permisos de admin)
	 */
	async create(course: Omit<Course, 'courseId'>): Promise<Course> {
		return httpClient.post<Course>('/courses', course);
	},

	/**
	 * Actualizar un curso
	 */
	async update(courseId: number, updates: Partial<Course>): Promise<Course> {
		return httpClient.put<Course>(`/courses/${courseId}`, updates);
	},

	/**
	 * Eliminar un curso
	 */
	async delete(courseId: number): Promise<void> {
		return httpClient.delete(`/courses/${courseId}`);
	},
};

// ==================================
// EJEMPLO 2: Servicio de Bloques
// ==================================

interface BlockMaterialUpload {
	blockId: number;
	title: string;
	description?: string;
	file: File;
}

export const blockService = {
	/**
	 * Obtener bloques de un curso
	 */
	async getByOffering(offeringId: number): Promise<Block[]> {
		return httpClient.get<Block[]>(`/offerings/${offeringId}/blocks`);
	},

	/**
	 * Subir material a un bloque
	 */
	async uploadMaterial(
		data: BlockMaterialUpload
	): Promise<{ materialId: number }> {
		const { blockId, file } = data;

		// Usar el método upload para archivos
		return httpClient.upload<{ materialId: number }>(
			`/blocks/${blockId}/materials`,
			file
		);
	},

	/**
	 * Descargar material de un bloque
	 */
	async downloadMaterial(materialId: number): Promise<Blob> {
		// Para descargas de archivos, usar fetch directamente
		const token = useAuthStore.getState().getAccessToken();

		const response = await fetch(
			`${import.meta.env.VITE_API_URL}/materials/${materialId}/download`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (!response.ok) throw new Error('Error al descargar archivo');
		return response.blob();
	},
};

// ==================================
// EJEMPLO 3: Servicio de Programas
// ==================================

export const programService = {
	/**
	 * Obtener todos los programas (endpoint público)
	 */
	async getAll(): Promise<Program[]> {
		return httpClient.get<Program[]>('/programs', {
			requiresAuth: false, // No requiere autenticación
		});
	},

	/**
	 * Buscar programas por nombre
	 */
	async search(query: string): Promise<Program[]> {
		return httpClient.get<Program[]>(
			`/programs/search?q=${encodeURIComponent(query)}`
		);
	},
};

// ==================================
// EJEMPLO 4: Uso en Componentes
// ==================================

/**
 * Ejemplo de uso en un componente React
 */
/*
import { useEffect, useState } from 'react';
import { courseService } from '@/services/exampleService';

function CoursesPage() {
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadCourses();
	}, []);

	const loadCourses = async () => {
		try {
			setLoading(true);
			setError(null);
			
			const result = await courseService.getAll();
			setCourses(result.courses);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar cursos');
			console.error('Error:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async (newCourse: Omit<Course, 'courseId'>) => {
		try {
			const created = await courseService.create(newCourse);
			setCourses([...courses, created]);
		} catch (err) {
			console.error('Error al crear curso:', err);
			alert('No se pudo crear el curso');
		}
	};

	if (loading) return <div>Cargando...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<div>
			<h1>Cursos</h1>
			{courses.map(course => (
				<div key={course.courseId}>{course.courseName}</div>
			))}
		</div>
	);
}
*/

// ==================================
// EJEMPLO 5: Manejo de Errores
// ==================================

/**
 * Función helper para manejar errores comunes
 */
export function handleApiError(error: unknown): string {
	if (error instanceof Error) {
		// Errores específicos
		if (error.message.includes('401')) {
			return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
		}
		if (error.message.includes('403')) {
			return 'No tienes permisos para realizar esta acción.';
		}
		if (error.message.includes('404')) {
			return 'Recurso no encontrado.';
		}
		if (error.message.includes('500')) {
			return 'Error del servidor. Intenta nuevamente más tarde.';
		}

		return error.message;
	}

	return 'Error desconocido. Intenta nuevamente.';
}

/**
 * Hook personalizado para operaciones CRUD
 */
/*
import { useState, useCallback } from 'react';

export function useCrudOperations<T>(service: any) {
	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchAll = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await service.getAll();
			setData(result);
		} catch (err) {
			setError(handleApiError(err));
		} finally {
			setLoading(false);
		}
	}, [service]);

	const create = useCallback(async (item: Omit<T, 'id'>) => {
		try {
			const created = await service.create(item);
			setData(prev => [...prev, created]);
			return created;
		} catch (err) {
			setError(handleApiError(err));
			throw err;
		}
	}, [service]);

	const update = useCallback(async (id: number, updates: Partial<T>) => {
		try {
			const updated = await service.update(id, updates);
			setData(prev => prev.map(item => 
				(item as any).id === id ? updated : item
			));
			return updated;
		} catch (err) {
			setError(handleApiError(err));
			throw err;
		}
	}, [service]);

	const remove = useCallback(async (id: number) => {
		try {
			await service.delete(id);
			setData(prev => prev.filter(item => (item as any).id !== id));
		} catch (err) {
			setError(handleApiError(err));
			throw err;
		}
	}, [service]);

	return {
		data,
		loading,
		error,
		fetchAll,
		create,
		update,
		remove,
	};
}
*/
