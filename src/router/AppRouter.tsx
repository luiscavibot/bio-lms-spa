import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { Library } from '@/pages/Library';
import { CourseDetail } from '@/pages/CourseDetail';
import { Login } from '@/pages/Login';
import { Layout } from '@/components/Layout';
import { useAcademicStore } from '@/store/academicStoreNew';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useAcademicStore((state) => state.isAuthenticated);

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}

export function AppRouter() {
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
