/**
 * Página de No Autorizado (403)
 * Se muestra cuando el usuario intenta acceder a un recurso sin permisos
 */

import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export function Unauthorized() {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
			<Card className="max-w-md w-full">
				<CardHeader className="text-center">
					<div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
						<ShieldX className="w-8 h-8 text-destructive" />
					</div>
					<CardTitle className="text-2xl">Acceso Denegado</CardTitle>
					<CardDescription className="text-base mt-2">
						No tienes permisos para acceder a esta página o realizar
						esta acción.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="bg-muted p-4 rounded-lg">
						<p className="text-sm text-muted-foreground">
							Si crees que esto es un error, contacta con el
							administrador del sistema o verifica que tu rol
							tenga los permisos necesarios.
						</p>
					</div>

					<div className="flex flex-col gap-2">
						<Button
							onClick={() => navigate(-1)}
							variant="outline"
							className="w-full"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Volver atrás
						</Button>
						<Button
							onClick={() => navigate('/')}
							className="w-full"
						>
							<Home className="w-4 h-4 mr-2" />
							Ir a Cursos
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
