import { defineConfig } from 'vite';

// During development, send /api requests to Express instead of Vite.
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
