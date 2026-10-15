import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { apiMiddleware } from './server/api.js';

export default defineConfig({
  appType: 'mpa',
  plugins: [
    react(),
    {
      name: 'rewards-api',
      configureServer(server) {
        server.middlewares.use(apiMiddleware);
      },
    },
  ],
  server: { port: 3000, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    restoreMocks: true,
  },
});
