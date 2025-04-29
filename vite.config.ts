import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // include Vercel’s analytics runtime so Vite bundles it
    include: ["@vercel/analytics/react"],
    // still excluding any you don’t want (e.g. lucide-react)
    exclude: ["lucide-react"],
  },
});
