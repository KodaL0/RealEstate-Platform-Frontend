// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.propertpro.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
      },
      '/oauth': {
        target: 'https://api.propertpro.com',
        changeOrigin: true,
        secure: true,
      },
      '/accounts': {                    // ← add this
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
