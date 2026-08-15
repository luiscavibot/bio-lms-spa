/**
 * Hook personalizado para acceder a los permisos del usuario
 * Facilita el uso de CASL ability en componentes React
 */

import { useAuthStore } from '@/store/authStore';
import type { Actions, Subjects } from '@/types/permissions';
import type { RoleName } from '@/types/permissions';

/**
 * Hook para acceder al objeto ability de CASL
 *
 * @example
 * const ability = useAbility();
 * if (ability.can('create', 'Course')) {
 *   // Mostrar botón de crear curso
 * }
 */
export function useAbility() {
	return useAuthStore((state) => state.ability);
}

/**
 * Hook para verificar si el usuario tiene un permiso específico
 *
 * @example
 * const canCreateCourse = useCan('create', 'Course');
 *
 * @example
 * // Con objeto para validación condicional
 * const canEditCourse = useCan('update', 'Course', course);
 */
export function useCan(
	action: Actions,
	subject: Subjects,
	object?: any
): boolean {
	const ability = useAuthStore((state) => state.ability);

	if (object) {
		return ability.can(action, subject, object);
	}
	return ability.can(action, subject);
}

/**
 * Hook para verificar si el usuario NO tiene un permiso específico
 *
 * @example
 * const cannotDeleteCourse = useCannot('delete', 'Course');
 */
export function useCannot(
	action: Actions,
	subject: Subjects,
	object?: any
): boolean {
	return !useCan(action, subject, object);
}

/**
 * Hook para obtener el usuario del backend con información de roles
 *
 * @example
 * const backendUser = useBackendUser();
 * if (backendUser?.role.roleName === 'Admin') {
 *   // Es administrador
 * }
 */
export function useBackendUser() {
	return useAuthStore((state) => state.backendUser);
}

/**
 * Hook para obtener el rol del usuario actual
 *
 * @example
 * const userRole = useUserRole();
 * if (userRole === 'Teacher') {
 *   // Mostrar panel de profesor
 * }
 */
export function useUserRole(): RoleName | null {
	const backendUser = useAuthStore((state) => state.backendUser);
	return backendUser?.role.roleName || null;
}

/**
 * Hook para verificar si el usuario tiene un rol específico
 *
 * @example
 * const isAdmin = useHasRole('Admin');
 * const isTeacher = useHasRole('Teacher');
 */
export function useHasRole(role: RoleName): boolean {
	const userRole = useUserRole();
	return userRole === role;
}
