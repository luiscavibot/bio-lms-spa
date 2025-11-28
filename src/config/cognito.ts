export const cognitoConfig = {
	region: import.meta.env.VITE_AWS_REGION,
	userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
	userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID,
};

export const amplifyConfig = {
	Auth: {
		Cognito: {
			userPoolId: cognitoConfig.userPoolId,
			userPoolClientId: cognitoConfig.userPoolClientId,
		},
	},
};

// Configuración de cookies para almacenamiento de tokens
// Nota: En Amplify v6 esto debe configurarse por separado (ver main.tsx)
export const cookieStorageConfig = {
	domain: window.location.hostname,
	path: '/',
	expires: 30, // días
	sameSite: 'lax' as const, // 'lax' es más compatible que 'strict'
	secure: window.location.protocol === 'https:',
};
