import { create } from 'zustand';
import {
	signIn,
	signOut,
	getCurrentUser,
	fetchUserAttributes,
	confirmSignIn,
	fetchAuthSession,
} from 'aws-amplify/auth';
import type { User } from '@/types/academic-new';

interface AuthTokens {
	accessToken: string;
	idToken: string;
	refreshToken?: string;
}

interface AuthState {
	user: User | null;
	tokens: AuthTokens | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	needsPasswordChange: boolean;
	tempEmail: string | null; // Para recordar el email durante el cambio de contraseña

	// Actions
	login: (email: string, password: string) => Promise<void>;
	confirmNewPassword: (newPassword: string) => Promise<void>;
	logout: () => Promise<void>;
	checkAuth: () => Promise<void>;
	clearError: () => void;
	getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	tokens: null,
	isAuthenticated: false,
	isLoading: true,
	error: null,
	needsPasswordChange: false,
	tempEmail: null,

	login: async (email: string, password: string) => {
		set({ isLoading: true, error: null });
		try {
			console.log('🔐 Intentando login con:', { email });

			const { isSignedIn, nextStep } = await signIn({
				username: email,
				password,
			});

			console.log('✅ SignIn response:', { isSignedIn, nextStep });

			if (isSignedIn) {
				const cognitoUser = await getCurrentUser();
				console.log('👤 Cognito user:', cognitoUser);

				const attributes = await fetchUserAttributes();
				console.log('📋 User attributes:', attributes);

				// Obtener tokens JWT de la sesión
				const session = await fetchAuthSession();
				const tokens: AuthTokens | null = session.tokens
					? {
							accessToken: session.tokens.accessToken.toString(),
							idToken: session.tokens.idToken?.toString() || '',
					  }
					: null;

				console.log('🔑 Tokens obtenidos:', {
					hasAccessToken: !!tokens?.accessToken,
					hasIdToken: !!tokens?.idToken,
					hasRefreshToken: !!tokens?.refreshToken,
				});

				const user: User = {
					userId: parseInt(cognitoUser.userId) || 1,
					externalAuthId: cognitoUser.userId,
					authProvider: 'AWS_COGNITO',
					email: attributes.email || email,
					firstName: attributes.given_name || '',
					lastName: attributes.family_name || '',
					roleId: 3, // Student by default
					isActive: true,
				};

				set({
					user,
					tokens,
					isAuthenticated: true,
					isLoading: false,
					error: null,
					needsPasswordChange: false,
					tempEmail: null,
				});

				console.log('✅ Login exitoso');
			} else if (nextStep) {
				console.log('⚠️ Se requiere un paso adicional:', nextStep);

				// Manejar el caso de cambio de contraseña requerido
				if (
					nextStep.signInStep ===
					'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
				) {
					set({
						needsPasswordChange: true,
						tempEmail: email,
						isLoading: false,
						error: null,
					});
				} else {
					set({
						error: `Se requiere completar: ${nextStep.signInStep}`,
						isLoading: false,
						isAuthenticated: false,
						needsPasswordChange: false,
					});
				}
			}
		} catch (error: any) {
			console.error('❌ Login error:', error);
			console.error('Error name:', error.name);
			console.error('Error message:', error.message);

			let errorMessage = 'Error al iniciar sesión';

			// Manejo de errores específicos de Cognito
			if (error.name === 'NotAuthorizedException') {
				errorMessage = 'Usuario o contraseña incorrectos';
			} else if (error.name === 'UserNotFoundException') {
				errorMessage = 'Usuario no encontrado';
			} else if (error.name === 'UserNotConfirmedException') {
				errorMessage = 'Usuario no confirmado. Verifica tu email.';
			} else if (error.name === 'PasswordResetRequiredException') {
				errorMessage = 'Debes restablecer tu contraseña';
			} else if (error.message) {
				errorMessage = error.message;
			}

			set({
				error: errorMessage,
				isLoading: false,
				isAuthenticated: false,
			});
		}
	},

	logout: async () => {
		try {
			await signOut();
			set({
				user: null,
				tokens: null,
				isAuthenticated: false,
				error: null,
			});
		} catch (error: any) {
			console.error('Logout error:', error);
			set({ error: error.message || 'Error al cerrar sesión' });
		}
	},

	checkAuth: async () => {
		set({ isLoading: true });
		try {
			console.log('🔍 Verificando sesión de Cognito...');
			const cognitoUser = await getCurrentUser();
			console.log('👤 Usuario encontrado:', cognitoUser);

			const attributes = await fetchUserAttributes();
			console.log('📋 Atributos:', attributes);

			// Obtener tokens de la sesión existente
			const session = await fetchAuthSession();
			const tokens: AuthTokens | null = session.tokens
				? {
						accessToken: session.tokens.accessToken.toString(),
						idToken: session.tokens.idToken?.toString() || '',
				  }
				: null;

			const user: User = {
				userId: parseInt(cognitoUser.userId) || 1,
				externalAuthId: cognitoUser.userId,
				authProvider: 'AWS_COGNITO',
				email: attributes.email || '',
				firstName: attributes.given_name || '',
				lastName: attributes.family_name || '',
				roleId: 3,
				isActive: true,
			};

			set({
				user,
				tokens,
				isAuthenticated: true,
				isLoading: false,
			});

			console.log('✅ Sesión restaurada');
		} catch (error) {
			console.log('ℹ️ No hay sesión activa');
			set({
				user: null,
				tokens: null,
				isAuthenticated: false,
				isLoading: false,
			});
		}
	},

	confirmNewPassword: async (newPassword: string) => {
		set({ isLoading: true, error: null });
		try {
			console.log('🔐 Confirmando nueva contraseña...');
			console.log('📏 Longitud de contraseña:', newPassword.length);
			console.log('🔍 Validaciones:', {
				length: newPassword.length >= 8,
				hasUppercase: /[A-Z]/.test(newPassword),
				hasLowercase: /[a-z]/.test(newPassword),
				hasNumber: /\d/.test(newPassword),
				hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
			});

			const { isSignedIn, nextStep } = await confirmSignIn({
				challengeResponse: newPassword,
			});

			console.log('✅ ConfirmSignIn response:', { isSignedIn, nextStep });

			if (isSignedIn) {
				const cognitoUser = await getCurrentUser();
				const attributes = await fetchUserAttributes();
				const tempEmail = get().tempEmail;

				const user: User = {
					userId: parseInt(cognitoUser.userId) || 1,
					externalAuthId: cognitoUser.userId,
					authProvider: 'AWS_COGNITO',
					email: attributes.email || tempEmail || '',
					firstName: attributes.given_name || '',
					lastName: attributes.family_name || '',
					roleId: 3,
					isActive: true,
				};

				set({
					user,
					isAuthenticated: true,
					isLoading: false,
					error: null,
					needsPasswordChange: false,
					tempEmail: null,
				});

				console.log('✅ Contraseña cambiada y login exitoso');
			} else {
				set({
					error: 'No se pudo completar el cambio de contraseña',
					isLoading: false,
				});
			}
		} catch (error: any) {
			console.error('❌ Error al cambiar contraseña:', error);

			let errorMessage = 'Error al cambiar la contraseña';

			if (error.name === 'InvalidPasswordException') {
				errorMessage =
					'La contraseña no cumple con los requisitos de seguridad';
			} else if (error.message) {
				errorMessage = error.message;
			}

			set({
				error: errorMessage,
				isLoading: false,
			});
		}
	},

	clearError: () => set({ error: null }),

	getAccessToken: () => {
		const state = get();
		return state.tokens?.accessToken || null;
	},
}));
