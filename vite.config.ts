import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_URL } = loadEnv(mode, process.cwd(), 'VITE_');

  if (mode === 'development' && !VITE_API_URL) {
    throw new Error('Defina VITE_API_URL no arquivo .env do frontend.');
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      proxy: VITE_API_URL
        ? {
            '/api': {
              target: VITE_API_URL,
              changeOrigin: true,
              secure: false,
            },
            '/uploads': {
              target: VITE_API_URL,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
  };
});
