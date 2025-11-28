import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { amplifyConfig } from './config/cognito';
import './index.css';
import App from './App.tsx';

// Configure Amplify
Amplify.configure(amplifyConfig);

// Import debug tools (only in development)
if (import.meta.env.DEV) {
	import('./lib/permissionsDebug');
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
