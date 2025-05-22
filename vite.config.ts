import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // proxy all /api/* to your real backend
      '/api': {
        target: 'https://api.propertpro.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      // if you hit your OAuth callback locally
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
