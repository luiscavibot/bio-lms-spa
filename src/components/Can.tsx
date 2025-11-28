/**
 * Componente Can - Control de permisos para UI
 * Muestra u oculta elementos según los permisos del usuario
 */

import { type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { Actions, Subjects } from '@/types/permissions';

interface CanProps {
	I: Actions;
	a: Subjects;
	this?: any; // Objeto para validación condicional
	passThrough?: boolean; // Si true, renderiza children con (allowed) => ReactNode
	children: ReactNode | ((allowed: boolean) => ReactNode);
}

/**
 * Componente Can para control de permisos en UI
 *
 * @example
 * // Mostrar solo si tiene permiso general
 * <Can I="create" a="Course">
 *   <button>Crear Curso</button>
 * </Can>
 *
 * @example
 * // Mostrar solo si tiene permiso condicional (IMPORTANTE: pasar this={objeto})
 * <Can I="update" a="Course" this={course}>
 *   <button>Editar Curso</button>
 * </Can>
 *
 * @example
 * // Personalizar cuando no tiene permisos
 * <Can I="delete" a="Course" passThrough>
 *   {(allowed) => (
 *     <button disabled={!allowed}>
 *       {allowed ? 'Eliminar' : 'Sin permisos'}
 *     </button>
 *   )}
 * </Can>
 */
export function Can({
	I: action,
	a: subject,
	this: object,
	passThrough,
	children,
}: CanProps) {
	const ability = useAuthStore((state) => state.ability);

	// Verificar permiso (con o sin objeto)
	const allowed = object
		? ability.can(action, subject, object)
		: ability.can(action, subject);

	// Si passThrough, siempre renderizar con el flag allowed
	if (passThrough && typeof children === 'function') {
		return <>{children(allowed)}</>;
	}

	// Solo renderizar si tiene permiso
	if (!allowed) {
		return null;
	}

	return <>{typeof children === 'function' ? children(allowed) : children}</>;
}
