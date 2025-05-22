import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /api/* calls go to your backend
      '/api': {
        target: 'https://api.propertpro.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
      },
      // OAuth callback proxy as well
      '/oauth': {
        target: 'https://api.propertpro.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  optimizeDeps: {
    include: ["@vercel/analytics/react"],
    exclude: ["lucide-react"],
  },
});
