import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { useAcademicStore } from '@/store/academicStoreNew';

export function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const setAuthenticated = useAcademicStore(
		(state) => state.setAuthenticated
	);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		// Simular llamada a API (reemplazar con AWS Cognito)
		setTimeout(() => {
			// Mock login - acepta cualquier credencial
			setAuthenticated(true);
			setIsLoading(false);
			navigate('/');
		}, 1000);
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md shadow-2xl border-primary/20">
				<CardHeader className="space-y-4 text-center pb-8">
					<div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
						<BookOpen className="h-10 w-10 text-white" />
					</div>
					<div>
						<CardTitle className="text-3xl font-bold text-primary">
							Repositorio Académico
						</CardTitle>
						<CardDescription className="text-base mt-2">
							Facultad de Ciencias Biológicas - UNMSM
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleLogin} className="space-y-4">
						{/* Email Input */}
						<div className="space-y-2">
							<label
								htmlFor="email"
								className="text-sm font-medium text-gray-700"
							>
								Correo Institucional
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									id="email"
									type="email"
									placeholder="juan.perez@unmsm.edu.pe"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									required
								/>
							</div>
						</div>
						{/* Password Input */}
						<div className="space-y-2">
							<label
								htmlFor="password"
								className="text-sm font-medium text-gray-700"
							>
								Contraseña
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									id="password"
									type="password"
									placeholder="••••••••"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									required
								/>
							</div>
						</div>
						{/* Forgot Password Link */}
						<div className="text-right">
							<a
								href="#"
								className="text-sm text-primary hover:underline"
							>
								¿Olvidaste tu contraseña?
							</a>
						</div>
						{/* Login Button */}
						<Button
							type="submit"
							className="w-full"
							disabled={isLoading}
						>
							{isLoading ? (
								<div className="flex items-center justify-center gap-1">
									<div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
									<div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
									<div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
								</div>
							) : (
								'Iniciar Sesión'
							)}
						</Button>{' '}
						{/* Info Message */}
						<div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
							<p className="text-xs text-blue-800 text-center">
								<strong>Demo:</strong> Ingresa cualquier correo
								y contraseña para acceder
							</p>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Footer */}
			<div className="absolute bottom-4 text-center w-full">
				<p className="text-sm text-gray-500">
					© 2025 Facultad de Ciencias Biológicas - UNMSM
				</p>
			</div>
		</div>
	);
}
