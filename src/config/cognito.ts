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
		},
	},
};
