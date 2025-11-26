import { create } from 'zustand';
import {
	signIn,
	signOut,
	getCurrentUser,
	fetchUserAttributes,
} from 'aws-amplify/auth';
import type { User } from '@/types/academic-new';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;

	// Actions
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	checkAuth: () => Promise<void>;
	clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	isAuthenticated: false,
	isLoading: true,
	error: null,

	login: async (email: string, password: string) => {
		set({ isLoading: true, error: null });
		try {
			const { isSignedIn } = await signIn({
				username: email,
				password,
			});

			if (isSignedIn) {
				const cognitoUser = await getCurrentUser();
				const attributes = await fetchUserAttributes();

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
					isAuthenticated: true,
					isLoading: false,
					error: null,
				});
			}
		} catch (error: any) {
			console.error('Login error:', error);
			set({
				error: error.message || 'Error al iniciar sesión',
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
			const cognitoUser = await getCurrentUser();
			const attributes = await fetchUserAttributes();

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
				isAuthenticated: true,
				isLoading: false,
			});
		} catch (error) {
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});
		}
	},

	clearError: () => set({ error: null }),
}));
