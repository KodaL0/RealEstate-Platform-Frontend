import axios from 'axios';

// Base API configuration
export const API_URL = 'https://api.propertpro.com';
export const API_PREFIX = '/api';

// Create standardized axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Helper to ensure proper URL formatting with API prefix and trailing slash
export const formatEndpoint = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Add API prefix if not already included
  const withPrefix = cleanEndpoint.startsWith('api/') ? cleanEndpoint : `api/${cleanEndpoint}`;
  
  // Ensure trailing slash for Django (but preserve query parameters)
  if (withPrefix.includes('?')) {
    const [path, query] = withPrefix.split('?');
    return `${path.endsWith('/') ? path : `${path}/`}?${query}`;
  }
  
  return withPrefix.endsWith('/') ? withPrefix : `${withPrefix}/`;
};

// Generic request methods with automatic endpoint formatting
export const apiGet = (endpoint: string, config?: any): Promise<any> => {
  return apiClient.get(formatEndpoint(endpoint), config);
};

export const apiPost = (endpoint: string, data?: any, config?: any): Promise<any> => {
  return apiClient.post(formatEndpoint(endpoint), data, config);
};

export const apiPut = (endpoint: string, data?: any, config?: any): Promise<any> => {
  return apiClient.put(formatEndpoint(endpoint), data, config);
};

export const apiDelete = (endpoint: string, config?: any): Promise<any> => {
  return apiClient.delete(formatEndpoint(endpoint), config);
};

// For form data submissions with files
export const apiFormPost = (endpoint: string, formData: FormData, config?: any): Promise<any> => {
  return apiClient.post(formatEndpoint(endpoint), formData, {
    ...config,
    headers: {
      ...config?.headers,
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const apiFormPut = (endpoint: string, formData: FormData, config?: any): Promise<any> => {
  return apiClient.put(formatEndpoint(endpoint), formData, {
    ...config,
    headers: {
      ...config?.headers,
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Debug request interceptor
apiClient.interceptors.request.use((config: any) => {
  // Format the URL properly for logging
  const fullUrl = `${config.baseURL}/${config.url}`.replace(/([^:]\/)\/+/g, "$1");
  console.log(`API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
  return config;
});

// Handle response errors consistently
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default {
  API_URL,
  API_PREFIX,
  apiClient,
  formatEndpoint,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  formPost: apiFormPost,
  formPut: apiFormPut
}; 
