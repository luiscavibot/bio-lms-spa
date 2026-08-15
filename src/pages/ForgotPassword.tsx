import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';

type Step = 'request' | 'confirm' | 'success';

export function ForgotPassword() {
	const [step, setStep] = useState<Step>('request');
	const [email, setEmail] = useState('');
	const [code, setCode] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	// Validación de requisitos de contraseña
	const passwordRequirements = [
		{ label: 'Mínimo 12 caracteres', test: (p: string) => p.length >= 12 },
		{ label: 'Una letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
		{ label: 'Una letra minúscula', test: (p: string) => /[a-z]/.test(p) },
		{ label: 'Un número', test: (p: string) => /\d/.test(p) },
		{
			label: 'Un carácter especial',
			test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
		},
	];

	const allRequirementsMet = passwordRequirements.every((req) =>
		req.test(newPassword)
	);
	const passwordsMatch =
		newPassword === confirmPassword && confirmPassword !== '';

	const handleRequestReset = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			await resetPassword({ username: email });
			setStep('confirm');
		} catch (err: any) {
			let errorMessage = 'Error al solicitar el código de recuperación';
			if (err.name === 'UserNotFoundException') {
				errorMessage = 'No se encontró un usuario con ese correo';
			} else if (err.name === 'LimitExceededException') {
				errorMessage = 'Demasiados intentos. Intenta más tarde';
			} else if (err.message) {
				errorMessage = err.message;
			}

			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleConfirmReset = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!allRequirementsMet) {
			setError('La contraseña no cumple con todos los requisitos');
			return;
		}

		if (!passwordsMatch) {
			setError('Las contraseñas no coinciden');
			return;
		}

		setIsLoading(true);

		try {
			await confirmResetPassword({
				username: email,
				confirmationCode: code,
				newPassword: newPassword,
			});
			setStep('success');
		} catch (err: any) {
			let errorMessage = 'Error al actualizar la contraseña';
			if (err.name === 'CodeMismatchException') {
				errorMessage =
					'Código incorrecto. Verifica el código enviado a tu correo';
			} else if (err.name === 'ExpiredCodeException') {
				errorMessage = 'El código ha expirado. Solicita uno nuevo';
			} else if (err.name === 'InvalidPasswordException') {
				errorMessage =
					'La contraseña no cumple con los requisitos de seguridad';
			} else if (err.message) {
				errorMessage = err.message;
			}

			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
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
							{step === 'success'
								? '¡Contraseña Actualizada!'
								: 'Recuperar Contraseña'}
						</CardTitle>
						<CardDescription className="text-base mt-2">
							{step === 'request' &&
								'Ingresa tu correo institucional para recibir un código de recuperación'}
							{step === 'confirm' &&
								'Ingresa el código que enviamos a tu correo y tu nueva contraseña'}
							{step === 'success' &&
								'Tu contraseña ha sido actualizada exitosamente'}
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent>
					{/* PASO 1: Solicitar código */}
					{step === 'request' && (
						<form
							onSubmit={handleRequestReset}
							className="space-y-6"
						>
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
										onChange={(e) =>
											setEmail(e.target.value)
										}
										className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
										required
										disabled={isLoading}
									/>
								</div>
							</div>

							{error && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
									<p className="text-sm text-red-800">
										{error}
									</p>
								</div>
							)}

							<Button
								type="submit"
								disabled={isLoading}
								className="w-full bg-primary hover:bg-primary/90"
							>
								{isLoading ? (
									<div className="flex items-center justify-center gap-2">
										<div className="flex gap-1">
											<div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
											<div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
											<div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
										</div>
									</div>
								) : (
									'Enviar Código'
								)}
							</Button>

							<button
								type="button"
								onClick={() => navigate('/login')}
								className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
							>
								<ArrowLeft className="h-4 w-4" />
								Volver al inicio de sesión
							</button>
						</form>
					)}

					{/* PASO 2: Confirmar código y nueva contraseña */}
					{step === 'confirm' && (
						<form
							onSubmit={handleConfirmReset}
							className="space-y-4"
						>
							<div className="space-y-2">
								<label
									htmlFor="code"
									className="text-sm font-medium text-gray-700"
								>
									Código de Verificación
								</label>
								<input
									id="code"
									type="text"
									placeholder="123456"
									value={code}
									onChange={(e) => setCode(e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									required
									disabled={isLoading}
									maxLength={6}
								/>
								<p className="text-xs text-gray-500">
									Revisa tu correo {email}
								</p>
							</div>

							<div className="space-y-2">
								<label
									htmlFor="newPassword"
									className="text-sm font-medium text-gray-700"
								>
									Nueva Contraseña
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										id="newPassword"
										type="password"
										placeholder="••••••••••••"
										value={newPassword}
										onChange={(e) =>
											setNewPassword(e.target.value)
										}
										className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
										required
										disabled={isLoading}
										autoComplete="new-password"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label
									htmlFor="confirmPassword"
									className="text-sm font-medium text-gray-700"
								>
									Confirmar Contraseña
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										id="confirmPassword"
										type="password"
										placeholder="••••••••••••"
										value={confirmPassword}
										onChange={(e) =>
											setConfirmPassword(e.target.value)
										}
										className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
										required
										disabled={isLoading}
										autoComplete="new-password"
									/>
								</div>
							</div>

							{/* Requisitos de contraseña */}
							<div className="bg-gray-50 rounded-md p-3 space-y-1.5">
								<p className="text-xs font-medium text-gray-700 mb-2">
									Requisitos de la contraseña:
								</p>
								{passwordRequirements.map((req, index) => (
									<div
										key={index}
										className="flex items-center gap-2 text-xs"
									>
										<div
											className={`w-1.5 h-1.5 rounded-full ${
												req.test(newPassword)
													? 'bg-green-600'
													: 'bg-gray-400'
											}`}
										></div>
										<span
											className={
												req.test(newPassword)
													? 'text-green-700'
													: 'text-gray-600'
											}
										>
											{req.label}
										</span>
									</div>
								))}
								{confirmPassword && (
									<div className="flex items-center gap-2 text-xs pt-1">
										<div
											className={`w-1.5 h-1.5 rounded-full ${
												passwordsMatch
													? 'bg-green-600'
													: 'bg-red-600'
											}`}
										></div>
										<span
											className={
												passwordsMatch
													? 'text-green-700'
													: 'text-red-700'
											}
										>
											{passwordsMatch
												? 'Las contraseñas coinciden'
												: 'Las contraseñas no coinciden'}
										</span>
									</div>
								)}
							</div>

							{error && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
									<p className="text-sm text-red-800">
										{error}
									</p>
								</div>
							)}

							<Button
								type="submit"
								disabled={
									isLoading ||
									!allRequirementsMet ||
									!passwordsMatch
								}
								className="w-full bg-primary hover:bg-primary/90"
							>
								{isLoading ? (
									<div className="flex items-center justify-center gap-2">
										<div className="flex gap-1">
											<div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
											<div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
											<div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
										</div>
									</div>
								) : (
									'Actualizar Contraseña'
								)}
							</Button>

							<button
								type="button"
								onClick={() => setStep('request')}
								className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
							>
								<ArrowLeft className="h-4 w-4" />
								Solicitar nuevo código
							</button>
						</form>
					)}

					{/* PASO 3: Éxito */}
					{step === 'success' && (
						<div className="space-y-6 text-center">
							<div className="flex justify-center">
								<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
									<CheckCircle2 className="h-8 w-8 text-green-600" />
								</div>
							</div>

							<div className="space-y-2">
								<p className="text-gray-700">
									Tu contraseña ha sido actualizada
									correctamente.
								</p>
								<p className="text-sm text-gray-600">
									Ahora puedes iniciar sesión con tu nueva
									contraseña.
								</p>
							</div>

							<Button
								onClick={() => navigate('/login')}
								className="w-full bg-primary hover:bg-primary/90"
							>
								Ir al Inicio de Sesión
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
