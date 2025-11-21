// vite.config.ts

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Environment configuration
const isDevelopment = process.env.NODE_ENV === "development";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: isDevelopment
      ? {
          "/api": {
            target: "http://localhost:8000",
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, "/api"),
          },
          "/oauth": {
            target: "http://localhost:8000",
            changeOrigin: true,
            secure: false,
          },
          "/accounts": {
            target: "http://localhost:8000",
            changeOrigin: true,
            secure: false,
          },
        }
      : undefined,
  },
  optimizeDeps: {
    include: ["@vercel/analytics/react"],
    exclude: ["lucide-react"],
  },
});
