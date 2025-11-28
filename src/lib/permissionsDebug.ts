/**
 * Utilidades para testing del sistema de permisos
 * Útil para desarrollo y debugging
 */

import { useAuthStore } from '@/store/authStore';

/**
 * Muestra en consola toda la información de permisos del usuario actual
 * Útil para debugging
 *
 * @example
 * // En la consola del navegador
 * debugPermissions()
 */
export function debugPermissions() {
	const store = useAuthStore.getState();
	const { backendUser, ability, tokens, isAuthenticated } = store;

	console.group('🔐 Debug de Permisos');

	console.log('✅ Autenticado:', isAuthenticated);
	console.log('👤 Usuario Backend:', backendUser);
	console.log('🎭 Rol:', backendUser?.role.roleName);
	console.log('🔑 Tiene Token:', !!tokens?.accessToken);

	if (ability) {
		console.group('📋 Permisos Verificados');

		// Permisos comunes a verificar
		const checks = [
			{ action: 'create', subject: 'Course' },
			{ action: 'read', subject: 'Course' },
			{ action: 'update', subject: 'Course' },
			{ action: 'delete', subject: 'Course' },
			{ action: 'create', subject: 'Assignment' },
			{ action: 'read', subject: 'Grade' },
			{ action: 'update', subject: 'Grade' },
			{ action: 'manage', subject: 'User' },
			{ action: 'manage', subject: 'all' },
		];

		checks.forEach(({ action, subject }) => {
			const can = ability.can(action as any, subject as any);
			console.log(
				`${can ? '✅' : '❌'} ${action} ${subject}`,
				can ? '(Permitido)' : '(Denegado)'
			);
		});

		console.groupEnd();
	}

	console.groupEnd();

	return {
		user: backendUser,
		role: backendUser?.role.roleName,
		isAuthenticated,
		ability,
	};
}

/**
 * Prueba si el usuario puede realizar una acción específica
 *
 * @example
 * testPermission('create', 'Course')
 * testPermission('update', 'Course', { courseId: 1, teacherId: 2 })
 */
export function testPermission(action: string, subject: string, object?: any) {
	const ability = useAuthStore.getState().ability;

	const can = object
		? ability.can(action as any, subject as any, object)
		: ability.can(action as any, subject as any);

	console.log(
		`${can ? '✅' : '❌'} ${action} ${subject}`,
		object ? `con objeto: ${JSON.stringify(object)}` : '',
		can ? '→ PERMITIDO' : '→ DENEGADO'
	);

	return can;
}

/**
 * Lista todos los permisos del usuario
 */
export function listAllPermissions() {
	const backendUser = useAuthStore.getState().backendUser;

	if (!backendUser) {
		console.warn('⚠️ No hay usuario autenticado');
		return;
	}

	console.group(
		`📋 Permisos de ${backendUser.firstName} ${backendUser.lastName}`
	);
	console.log('🎭 Rol:', backendUser.role.roleName);
	console.log('📧 Email:', backendUser.email);
	console.groupEnd();
}

/**
 * Exporta funciones al window para acceso fácil en consola
 */
if (typeof window !== 'undefined') {
	(window as any).debugPermissions = debugPermissions;
	(window as any).testPermission = testPermission;
	(window as any).listAllPermissions = listAllPermissions;

	console.log(
		'%c🔐 Herramientas de Debug de Permisos disponibles:',
		'color: #228665; font-weight: bold; font-size: 14px;'
	);
	console.log('• debugPermissions() - Ver todos los permisos');
	console.log(
		'• testPermission(action, subject, object?) - Probar permiso específico'
	);
	console.log('• listAllPermissions() - Listar permisos del usuario');
}
