import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Dashboard } from '@/pages/Dashboard';
import { Library } from '@/pages/Library';
import { CourseDetail } from '@/pages/CourseDetail';
import { Login } from '@/pages/Login';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { Unauthorized } from '@/pages/Unauthorized';
import { Maintenance } from '@/pages/Maintenance';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isLoading = useAuthStore((state) => state.isLoading);
	const tokens = useAuthStore((state) => state.tokens);

	// Mostrar loading mientras verifica la sesión
	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
					<p className="mt-4 text-gray-600">Verificando sesión...</p>
				</div>
			</div>
		);
	}

	// Verificar autenticación Y que existan tokens válidos
	if (!isAuthenticated || !tokens?.accessToken) {
		console.log('🔒 Acceso denegado - Redirigiendo a login');
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}

export function AppRouter() {
	const checkAuth = useAuthStore((state) => state.checkAuth);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const tokens = useAuthStore((state) => state.tokens);
	const backendUser = useAuthStore((state) => state.backendUser);
	const fetchUserPermissions = useAuthStore(
		(state) => state.fetchUserPermissions
	);

	useEffect(() => {
		// Verificar si hay una sesión activa de Cognito al iniciar la app
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		// Si ya está autenticado y hay token, cargar permisos si no existen
		if (isAuthenticated && tokens?.accessToken && !backendUser) {
			console.log('📡 Cargando permisos tras checkAuth...');
			fetchUserPermissions();
		}
	}, [isAuthenticated, tokens, backendUser, fetchUserPermissions]);

	return (
		<BrowserRouter>
			<Routes>
				{/* Rutas públicas */}
				<Route path="/login" element={<Login />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
				<Route path="/unauthorized" element={<Unauthorized />} />

				{/* Rutas protegidas */}
				<Route element={<Layout />}>
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/library"
						element={
							<ProtectedRoute>
								<Library />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/course/:blockId"
						element={
							<ProtectedRoute>
								<CourseDetail />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/block/:blockId"
						element={
							<ProtectedRoute>
								<CourseDetail />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/maintenance"
						element={
							<ProtectedRoute>
								<Maintenance />
							</ProtectedRoute>
						}
					/>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
