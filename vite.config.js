import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || env.PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      allowedHosts: env.VITE_ALLOW_EXTERNAL_HOSTS === 'true' ? true : undefined,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
