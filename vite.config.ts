import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiProxyTarget = env.VITE_DEV_API_PROXY_TARGET;

	return {
		plugins: [react()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
		},
		server: apiProxyTarget
			? {
					proxy: {
						'/api': {
							target: apiProxyTarget,
							changeOrigin: true,
						},
					},
				}
			: undefined,
	};
});
