/**
 * Servicio de Autenticación con Backend
 * Gestiona la obtención de usuario y permisos desde el backend
 */

import { httpClient } from '@/lib/httpClient';
import type { AuthMeResponse } from '@/types/permissions';

/**
 * Obtiene el usuario actual y sus permisos desde el backend
 * Endpoint: GET /api/v1/auth/me
 *
 * @throws Error si no hay token o el usuario no está autenticado
 * @returns Usuario y sus habilidades (abilities) desde el backend
 */
export async function getUserWithPermissions(): Promise<AuthMeResponse> {
	try {
		const response = await httpClient.get<AuthMeResponse>('/auth/me');
		return response;
	} catch (error) {
		console.error('❌ Error al obtener usuario y permisos:', error);
		throw error;
	}
}

/**
 * Servicio de autenticación
 */
export const authService = {
	/**
	 * Obtiene información del usuario actual y sus permisos
	 */
	getMe: getUserWithPermissions,
};
