import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.API_PROXY_TARGET || 'http://localhost:3000';
  const proxy = Object.fromEntries(
    ['/api', '/health', '/metrics', '/docs'].map((path) => [path, { target, changeOrigin: true }]),
  );

  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
  };
});
