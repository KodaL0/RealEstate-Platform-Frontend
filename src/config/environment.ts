// Environment configuration for automatic URL switching
export const environment = {
  // API Configuration
  api: {
    // Development: Use local backend
    development: {
      baseUrl: 'http://127.0.0.1:8000',
      useProxy: true,
    },
    // Production: Use production backend
    production: {
      baseUrl: 'http://127.0.0.1:8000',
      useProxy: false,
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
    return this.currentApi.baseUrl;
  },
  
  // Check if we should use proxy
  get useProxy() {
    return this.currentApi.useProxy;
  },
};

export default environment; 