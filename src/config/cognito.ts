// AWS Cognito Configuration
export const cognitoConfig = {
	region: 'us-east-2',
	userPoolId: 'us-east-2_fdNDmpEOG',
	userPoolWebClientId: 'n72i8eg8rj7vmqam5h4npi3f0',
	issuer: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_fdNDmpEOG',
};

export const amplifyConfig = {
	Auth: {
		Cognito: {
			userPoolId: cognitoConfig.userPoolId,
			userPoolClientId: cognitoConfig.userPoolWebClientId,
			loginWith: {
				oauth: {
					domain: cognitoConfig.userPoolId,
					scopes: ['email', 'profile', 'openid'],
					redirectSignIn: [window.location.origin],
					redirectSignOut: [window.location.origin],
					responseType: 'code',
				},
			},
		},
	},
	// Configuración de almacenamiento con cookies HttpOnly
	cookieStorage: {
		domain: window.location.hostname,
		path: '/',
		expires: 7, // 7 días
		sameSite: 'strict',
		secure: window.location.protocol === 'https:', // true en producción con HTTPS
	},
};
