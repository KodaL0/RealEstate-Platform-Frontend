import axios, { AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Base API configuration
export const API_BASE = 'https://api.propertpro.com/api';

// Create standardized axios instance
export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
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

// Generic request methods
export const apiGet = <T = any>(endpoint: string, config?: AxiosRequestConfig) =>
  apiClient.get<T>(formatEndpoint(endpoint), config);

export const apiPost = <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
  apiClient.post<T>(formatEndpoint(endpoint), data, config);

export const apiPut = <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
  apiClient.put<T>(formatEndpoint(endpoint), data, config);

export const apiDelete = <T = any>(endpoint: string, config?: AxiosRequestConfig) =>
  apiClient.delete<T>(formatEndpoint(endpoint), config);

// For form-data submissions with files
export const apiFormPost = <T = any>(endpoint: string, formData: FormData, config?: AxiosRequestConfig) =>
  apiClient.post<T>(
    formatEndpoint(endpoint),
    formData,
    {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

export const apiFormPut = <T = any>(endpoint: string, formData: FormData, config?: AxiosRequestConfig) =>
  apiClient.put<T>(
    formatEndpoint(endpoint),
    formData,
    {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

// Debug request interceptor for logging
apiClient.interceptors.request.use(config => {
  const fullUrl = `${config.baseURL}${config.url}`.replace(/([^:]\/\/)\/+/, '$1');
  console.log(`API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
  return config;
});

// Handle response errors consistently
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default {
  apiClient,
  formatEndpoint,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  formPost: apiFormPost,
  formPut: apiFormPut,
};
