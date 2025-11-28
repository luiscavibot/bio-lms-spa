import { Outlet, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Home, Library, Settings, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useHasRole } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { DebugPermissions } from '@/components/DebugPermissions';

export function Layout() {
	const user = useAuthStore((state) => state.user);
	const backendUser = useAuthStore((state) => state.backendUser);
	const logout = useAuthStore((state) => state.logout);
	const navigate = useNavigate();
	const isAdmin = useHasRole('Admin');

	// Debug: Verificar información del usuario y rol
	console.log('🔍 Layout Debug:', {
		user,
		backendUser,
		userRole: backendUser?.role?.roleName,
		isAdmin,
	});

	const handleLogout = async () => {
		await logout();
		navigate('/login');
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="border-b border-primary/30 bg-[#1a6b4f] sticky top-0 z-50 shadow-lg">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
								<BookOpen className="h-6 w-6 text-white" />
							</div>
							<div>
								<h1 className="text-xl font-bold text-white">
									Repositorio Académico
								</h1>
								<p className="text-xs text-white/80">
									Facultad de Ciencias Biológicas - UNMSM
								</p>
							</div>
						</div>
						<nav className="hidden md:flex items-center space-x-2">
							<Link
								to="/"
								className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
							>
								<Home className="h-4 w-4" />
								<span>Dashboard</span>
							</Link>
							<Link
								to="/library"
								className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
							>
								<Library className="h-4 w-4" />
								<span>Biblioteca</span>
							</Link>
							{isAdmin && (
								<Link
									to="/maintenance"
									className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
								>
									<Settings className="h-4 w-4" />
									<span>Mantenimiento</span>
								</Link>
							)}
						</nav>{' '}
						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-2">
								<div className="text-right hidden sm:block">
									<p className="text-sm font-medium text-white">
										{user?.firstName} {user?.lastName}
									</p>
									<p className="text-xs text-white/70">
										{user?.email}
									</p>
								</div>
								<div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
									<User className="h-5 w-5 text-white" />
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleLogout}
								className="text-white/90 hover:text-white hover:bg-white/10"
							>
								<LogOut className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-8">
				<Outlet />
			</main>

			{/* Footer */}
			<footer className="border-t bg-gray-50 mt-12">
				<div className="container mx-auto px-4 py-6">
					<p className="text-center text-sm text-gray-600">
						© 2025 BioRepo - Facultad de Ciencias Biológicas, UNMSM
					</p>
				</div>
			</footer>

			{/* Debug Panel - REMOVER DESPUÉS DE RESOLVER */}
			<DebugPermissions />
		</div>
	);
}
