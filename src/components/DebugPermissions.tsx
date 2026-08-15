/**
 * Componente de Debug para verificar permisos y rol del usuario
 * Eliminar después de resolver el problema
 */

import { useAuthStore } from '@/store/authStore';
import {
	useHasRole,
	useUserRole,
	useBackendUser,
} from '@/hooks/usePermissions';

export function DebugPermissions() {
	const user = useAuthStore((state) => state.user);
	const backendUser = useBackendUser();
	const ability = useAuthStore((state) => state.ability);
	const userRole = useUserRole();
	const isAdmin = useHasRole('Admin');
	const isTeacher = useHasRole('Teacher');

	return (
		<div className="fixed bottom-4 right-4 bg-white border-2 border-red-500 p-4 rounded-lg shadow-lg max-w-md z-50">
			<h3 className="font-bold text-red-600 mb-2">
				🐛 Debug de Permisos
			</h3>

			<div className="space-y-2 text-xs">
				<div>
					<strong>Usuario Cognito:</strong>
					<pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
						{JSON.stringify(user, null, 2)}
					</pre>
				</div>

				<div>
					<strong>Usuario Backend:</strong>
					<pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
						{JSON.stringify(backendUser, null, 2)}
					</pre>
				</div>

				<div>
					<strong>Rol:</strong> {userRole || '❌ No definido'}
				</div>

				<div>
					<strong>¿Es Admin?</strong> {isAdmin ? '✅ SÍ' : '❌ NO'}
				</div>

				<div>
					<strong>¿Es Teacher?</strong>{' '}
					{isTeacher ? '✅ SÍ' : '❌ NO'}
				</div>

				<div>
					<strong>Permisos (CASL rules):</strong>
					<pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
						{JSON.stringify(ability.rules, null, 2)}
					</pre>
				</div>
			</div>

			<button
				onClick={() => {
					const fetchUserPermissions =
						useAuthStore.getState().fetchUserPermissions;
					fetchUserPermissions();
				}}
				className="mt-2 w-full bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600"
			>
				🔄 Recargar Permisos
			</button>
		</div>
	);
}
