import { useAuthStore } from '@/store/authStore';

/**
 * Cliente HTTP configurado para usar tokens de autenticación automáticamente
 * Maneja renovación de tokens y redirección en caso de sesión expirada
 */

interface RequestConfig extends RequestInit {
	requiresAuth?: boolean;
}

class HttpClient {
	private baseURL: string;

	constructor(baseURL: string = '') {
		this.baseURL = baseURL;
	}

	private resolveUrl(path: string): string {
		// Si el path es absoluto, retornarlo tal cual
		if (/^https?:\/\//.test(path)) {
			return path;
		}

		const base = this.baseURL.replace(/\/$/, ''); // sin barra final
		const p = path.startsWith('/') ? path : `/${path}`;

		// Evitar duplicar /api/v1 si ya está en base y también en path
		const apiPrefix = '/api/v1';
		const baseEndsWithApi = base.endsWith(apiPrefix);
		const pathStartsWithApi = p.startsWith(apiPrefix);

		if (baseEndsWithApi && pathStartsWithApi) {
			return `${base}${p.substring(apiPrefix.length)}`;
		}

		return `${base}${p}`;
	}

	private async getAuthHeaders(): Promise<HeadersInit> {
		const tokens = useAuthStore.getState().tokens;
		// Backend valida exclusivamente el accessToken (Cognito Access Token)
		const bearerToken = tokens?.accessToken;

		if (!bearerToken) {
			throw new Error('No hay token de autenticación disponible');
		}

		const headers = {
			Authorization: `Bearer ${bearerToken}`,
			'Content-Type': 'application/json',
		};

		// Log para trazabilidad del tipo de token
		console.log('🔑 Auth headers preparados', {
			usesAccessToken: !!tokens?.accessToken,
			usesIdToken: false,
		});

		return headers;
	}

	private async handleResponse(response: Response) {
		// Si el token expiró o es inválido (401 - No autorizado)
		if (response.status === 401) {
			console.error('🔒 Token inválido o expirado (401)');

			// Intentar renovar la sesión
			const checkAuth = useAuthStore.getState().checkAuth;
			await checkAuth();

			// Si después de checkAuth sigue sin token, logout
			const tokens = useAuthStore.getState().tokens;
			if (!tokens?.accessToken) {
				console.log(
					'❌ No se pudo renovar la sesión, limpiando estado...'
				);
				const logout = useAuthStore.getState().logout;
				await logout();

				// Limpiar localStorage/sessionStorage
				localStorage.clear();
				sessionStorage.clear();

				// Redirigir a login
				window.location.href = '/login';
				throw new Error(
					'Sesión expirada. Por favor, inicia sesión nuevamente.'
				);
			}
		}

		// Si no tiene permisos (403 - Forbidden)
		if (response.status === 403) {
			console.error(
				'🚫 No tienes permisos para realizar esta acción (403)'
			);
			throw new Error('No tienes permisos para realizar esta acción');
		}

		if (!response.ok) {
			const error = await response.text();
			throw new Error(error || `HTTP Error ${response.status}`);
		}

		// Si la respuesta está vacía, retornar null
		const contentType = response.headers.get('content-type');
		if (contentType?.includes('application/json')) {
			return response.json();
		}
		return response.text();
	}

	async get<T>(url: string, config: RequestConfig = {}): Promise<T> {
		const { requiresAuth = true, ...restConfig } = config;

		const headers = requiresAuth
			? await this.getAuthHeaders()
			: { 'Content-Type': 'application/json' };

		const fullUrl = this.resolveUrl(url);
		console.log('🌐 HTTP GET:', { url: fullUrl, requiresAuth });

		const response = await fetch(fullUrl, {
			method: 'GET',
			headers,
			...restConfig,
		});

		return this.handleResponse(response);
	}

	async post<T>(
		url: string,
		data?: any,
		config: RequestConfig = {}
	): Promise<T> {
		const { requiresAuth = true, ...restConfig } = config;

		const headers = requiresAuth
			? await this.getAuthHeaders()
			: { 'Content-Type': 'application/json' };

		const body = JSON.stringify(data);
		console.log('🌐 HTTP POST:', {
			url: this.resolveUrl(url),
			dataObject: data,
			bodyString: body,
			headers: Object.keys(headers),
		});

		const response = await fetch(this.resolveUrl(url), {
			method: 'POST',
			headers,
			body,
			...restConfig,
		});

		return this.handleResponse(response);
	}

	async put<T>(
		url: string,
		data?: any,
		config: RequestConfig = {}
	): Promise<T> {
		const { requiresAuth = true, ...restConfig } = config;

		const headers = requiresAuth
			? await this.getAuthHeaders()
			: { 'Content-Type': 'application/json' };

		const response = await fetch(this.resolveUrl(url), {
			method: 'PUT',
			headers,
			body: JSON.stringify(data),
			...restConfig,
		});

		return this.handleResponse(response);
	}

	async delete<T>(url: string, config: RequestConfig = {}): Promise<T> {
		const { requiresAuth = true, ...restConfig } = config;

		const headers = requiresAuth
			? await this.getAuthHeaders()
			: { 'Content-Type': 'application/json' };

		const response = await fetch(this.resolveUrl(url), {
			method: 'DELETE',
			headers,
			...restConfig,
		});

		return this.handleResponse(response);
	}

	async upload<T>(
		url: string,
		file: File,
		config: RequestConfig = {}
	): Promise<T> {
		const { requiresAuth = true, ...restConfig } = config;

		const tokens = useAuthStore.getState().tokens;
		const accessToken = tokens?.accessToken;

		if (requiresAuth && !accessToken) {
			throw new Error('No hay token de autenticación disponible');
		}

		const formData = new FormData();
		formData.append('file', file);

		const headers: HeadersInit = requiresAuth
			? { Authorization: `Bearer ${accessToken}` }
			: {};

		const response = await fetch(this.resolveUrl(url), {
			method: 'POST',
			headers,
			body: formData,
			...restConfig,
		});

		return this.handleResponse(response);
	}
}

// Instancia por defecto (ajusta la baseURL según tu API backend)
// Nota: VITE_API_URL debe ser la raíz del backend (ej. http://localhost:3000)
// y los servicios deben incluir el path completo (ej. /api/v1/...)
export const httpClient = new HttpClient(
	import.meta.env.VITE_API_URL || 'http://localhost:3000'
);

// Hook para usar en componentes React
export function useHttpClient() {
	return httpClient;
}
