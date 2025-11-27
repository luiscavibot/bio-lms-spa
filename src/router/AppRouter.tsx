import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Dashboard } from '@/pages/Dashboard';
import { Library } from '@/pages/Library';
import { CourseDetail } from '@/pages/CourseDetail';
import { Login } from '@/pages/Login';
import { ForgotPassword } from '@/pages/ForgotPassword';
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

	useEffect(() => {
		// Verificar si hay una sesión activa de Cognito al iniciar la app
		checkAuth();
	}, [checkAuth]);

	return (
		<BrowserRouter>
			<Routes>
				{/* Rutas públicas */}
				<Route path="/login" element={<Login />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />

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
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
