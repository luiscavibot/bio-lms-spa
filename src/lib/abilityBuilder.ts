/**
 * Builder de CASL Ability
 * Construye el objeto de permisos desde las reglas del backend
 */

import { AbilityBuilder, PureAbility, createMongoAbility } from '@casl/ability';
import type {
	AbilityRule,
	Actions,
	Subjects,
	PermissionConditions,
} from '@/types/permissions';

/**
 * Tipo de Ability personalizado para nuestra aplicación
 */
export type AppAbility = PureAbility<[Actions, Subjects], PermissionConditions>;

/**
 * Construye un objeto CASL Ability desde las reglas del backend
 *
 * @param rules - Array de reglas recibidas del backend (GET /api/v1/auth/me)
 * @returns Objeto Ability de CASL listo para usar
 *
 * @example
 * const ability = buildAbilityFrom(backendRules);
 * if (ability.can('update', 'Course', course)) {
 *   // Usuario puede actualizar este curso
 * }
 */
export function buildAbilityFrom(rules: AbilityRule[]): AppAbility {
	const { can, cannot, build } = new AbilityBuilder<AppAbility>(
		createMongoAbility
	);

	// Procesar cada regla del backend
	rules.forEach((rule) => {
		const { action, subject, conditions, fields, inverted } = rule;

		if (inverted) {
			// Regla de negación (cannot)
			if (conditions) {
				cannot(action, subject, fields).because(
					rule.reason || 'No autorizado'
				);
			} else {
				cannot(action, subject, fields).because(
					rule.reason || 'No autorizado'
				);
			}
		} else {
			// Regla de permiso (can)
			if (conditions) {
				// Permiso condicional (ej: solo si teacherId === userId)
				can(action, subject, fields, conditions);
			} else {
				// Permiso general
				can(action, subject, fields);
			}
		}
	});

	return build();
}

/**
 * Crea un Ability vacío (sin permisos)
 * Útil como estado inicial antes de cargar los permisos del usuario
 */
export function createEmptyAbility(): AppAbility {
	return buildAbilityFrom([]);
}

/**
 * Crea un Ability con permisos de administrador
 * Útil para testing o fallback
 */
export function createAdminAbility(): AppAbility {
	return buildAbilityFrom([
		{
			action: 'manage',
			subject: 'all',
		},
	]);
}

/**
 * Helper para verificar si un usuario puede realizar una acción
 *
 * @example
 * // Permiso general
 * canDo(ability, 'create', 'Course') // true/false
 *
 * // Permiso condicional (SIEMPRE pasar el objeto completo)
 * canDo(ability, 'update', 'Course', course) // Valida course.teacherId
 */
export function canDo(
	ability: AppAbility,
	action: Actions,
	subject: Subjects,
	object?: any
): boolean {
	if (object) {
		return ability.can(action, subject, object);
	}
	return ability.can(action, subject);
}

/**
 * Helper para verificar si un usuario NO puede realizar una acción
 */
export function cannotDo(
	ability: AppAbility,
	action: Actions,
	subject: Subjects,
	object?: any
): boolean {
	return !canDo(ability, action, subject, object);
}
