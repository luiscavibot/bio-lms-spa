import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Dashboard } from '@/pages/Dashboard';
import { Library } from '@/pages/Library';
import { CourseDetail } from '@/pages/CourseDetail';
import { Login } from '@/pages/Login';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	if (!isAuthenticated) {
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
				{/* Ruta pública */}
				<Route path="/login" element={<Login />} />

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
