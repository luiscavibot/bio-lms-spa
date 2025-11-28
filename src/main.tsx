import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { CookieStorage } from 'aws-amplify/utils';
import { amplifyConfig, cookieStorageConfig } from './config/cognito';
import './index.css';
import App from './App.tsx';

Amplify.configure(amplifyConfig);

cognitoUserPoolsTokenProvider.setKeyValueStorage(
	new CookieStorage(cookieStorageConfig)
);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
