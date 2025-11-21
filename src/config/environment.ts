// Environment configuration for automatic URL switching
export const environment = {
  // API Configuration
  api: {
    // Development: Use local backend
    development: {
      baseUrl: "http://localhost:8000",
      useProxy: true,
    },
    // Production: Use production backend
    production: {
      baseUrl: "https://api.propertpro.com",
      useProxy: true,
    },
  },

  // Get current environment
  get isDevelopment() {
    return import.meta.env.DEV;
  },

  get isProduction() {
    return import.meta.env.PROD;
  },

  // Get current API configuration
  get currentApi() {
    return this.isDevelopment ? this.api.development : this.api.production;
  },

  // Get base URL for current environment
  get baseUrl() {
    // Allow override via environment variable
    const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (envBaseUrl) {
      return envBaseUrl;
    }
    return this.currentApi.baseUrl;
  },

  // Check if we should use proxy
  get useProxy() {
    // Allow override via environment variable
    const envUseProxy = import.meta.env.VITE_USE_PROXY;
    if (envUseProxy !== undefined) {
      return envUseProxy === "true";
    }
    return this.currentApi.useProxy;
  },
};

export default environment;
