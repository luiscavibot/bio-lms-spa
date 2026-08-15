import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PasswordChangeModalProps {
	isOpen: boolean;
	onConfirm: (newPassword: string) => void;
	isLoading: boolean;
	error: string | null;
}

interface PasswordRequirement {
	label: string;
	test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
	{ label: 'Mínimo 12 caracteres', test: (p) => p.length >= 12 },
	{ label: 'Una letra mayúscula', test: (p) => /[A-Z]/.test(p) },
	{ label: 'Una letra minúscula', test: (p) => /[a-z]/.test(p) },
	{ label: 'Un número', test: (p) => /\d/.test(p) },
	{
		label: 'Un carácter especial (!@#$%^&*)',
		test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
	},
];

export function PasswordChangeModal({
	isOpen,
	onConfirm,
	isLoading,
	error,
}: PasswordChangeModalProps) {
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	if (!isOpen) return null;

	const passwordsMatch =
		newPassword === confirmPassword && confirmPassword !== '';
	const allRequirementsMet = passwordRequirements.every((req) =>
		req.test(newPassword)
	);
	const canSubmit = allRequirementsMet && passwordsMatch && !isLoading;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (canSubmit) {
			onConfirm(newPassword);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-2">
						<Lock className="h-5 w-5 text-[#228665]" />
						<h2 className="text-xl font-semibold text-gray-900">
							Cambiar Contraseña
						</h2>
					</div>
				</div>

				<p className="text-sm text-gray-600 mb-6">
					Tu contraseña temporal debe ser cambiada. Por favor, ingresa
					una nueva contraseña que cumpla con los siguientes
					requisitos:
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Nueva contraseña */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Nueva Contraseña
						</label>
						<div className="relative">
							<Input
								type={showPassword ? 'text' : 'password'}
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Ingresa tu nueva contraseña"
								className="pr-10"
								disabled={isLoading}
								autoComplete="new-password"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
					</div>

					{/* Confirmar contraseña */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Confirmar Contraseña
						</label>
						<div className="relative">
							<Input
								type={showConfirmPassword ? 'text' : 'password'}
								value={confirmPassword}
								onChange={(e) =>
									setConfirmPassword(e.target.value)
								}
								placeholder="Confirma tu nueva contraseña"
								className="pr-10"
								disabled={isLoading}
								autoComplete="new-password"
							/>
							<button
								type="button"
								onClick={() =>
									setShowConfirmPassword(!showConfirmPassword)
								}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								{showConfirmPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
					</div>

					{/* Requisitos de contraseña */}
					<div className="bg-gray-50 rounded-md p-3 space-y-2">
						<p className="text-xs font-medium text-gray-700 mb-2">
							Requisitos de la contraseña:
						</p>
						{passwordRequirements.map((req, index) => {
							const isMet = req.test(newPassword);
							return (
								<div
									key={index}
									className="flex items-center gap-2 text-xs"
								>
									{isMet ? (
										<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
									) : (
										<XCircle className="h-3.5 w-3.5 text-gray-400" />
									)}
									<span
										className={
											isMet
												? 'text-green-700'
												: 'text-gray-600'
										}
									>
										{req.label}
									</span>
								</div>
							);
						})}

						{/* Verificación de coincidencia */}
						{confirmPassword && (
							<div className="flex items-center gap-2 text-xs pt-1">
								{passwordsMatch ? (
									<>
										<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
										<span className="text-green-700">
											Las contraseñas coinciden
										</span>
									</>
								) : (
									<>
										<XCircle className="h-3.5 w-3.5 text-red-600" />
										<span className="text-red-700">
											Las contraseñas no coinciden
										</span>
									</>
								)}
							</div>
						)}
					</div>

					{/* Error message */}
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-md">
							<p className="text-sm text-red-800">{error}</p>
						</div>
					)}

					{/* Botón de confirmar */}
					<Button
						type="submit"
						disabled={!canSubmit}
						className="w-full bg-[#228665] hover:bg-[#1a6b4f]"
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
							'Confirmar Nueva Contraseña'
						)}
					</Button>
				</form>
			</div>
		</div>
	);
}
