import axios from 'axios';
import Cookies from 'js-cookie';

// Define types since AxiosRequestConfig import is causing issues
type RequestConfig = {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  withCredentials?: boolean;
  [key: string]: any;
};

// Base API configuration
const API_HOST = 'https://api.propertpro.com';
const API_PREFIX = '';

// Create standardized axios instance
const apiClient = axios.create({
  baseURL: API_HOST,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Helper to ensure proper URL formatting with trailing slash for Django
const formatEndpoint = (endpoint: string): string => {
  // Remove leading slash if present
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

// Request methods
const apiGet = <T = any>(endpoint: string, config?: RequestConfig) =>
  apiClient.get<T>(formatEndpoint(endpoint), config);

const apiPost = <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
  apiClient.post<T>(formatEndpoint(endpoint), data, config);

const apiPut = <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
  apiClient.put<T>(formatEndpoint(endpoint), data, config);

const apiDelete = <T = any>(endpoint: string, config?: RequestConfig) =>
  apiClient.delete<T>(formatEndpoint(endpoint), config);

// Form data methods for file uploads
const apiFormPost = <T = any>(endpoint: string, formData: FormData, config?: RequestConfig) =>
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

const apiFormPut = <T = any>(endpoint: string, formData: FormData, config?: RequestConfig) =>
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

// Request interceptor for logging in development
apiClient.interceptors.request.use(config => {
  const url = config.url || '';
  const fullUrl = `${config.baseURL}${url}`.replace(/([^:]\/\/)\/+/, '$1');
  console.log(`API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
  return config;
});

// Response interceptor for error handling
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

// Organized API endpoints by domain
const api = {
  // Generic methods
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  formPost: apiFormPost,
  formPut: apiFormPut,
  
  // Authentication endpoints
  auth: {
    login: (data: any) => apiPost('users/login', data),
    register: (data: any) => apiPost('users/register', data),
    logout: () => apiPost('users/logout'),
    refreshToken: () => apiPost('users/refresh'),
    getUser: () => apiGet('users/get_user'),
    updateProfile: (data: any) => apiPut('users/profile', data),
    socialLoginVerify: (data: any) => apiPost('users/social-login-verify', data),
    authComplete: (data: any) => apiPost('users/auth-complete', data),
  },
  
  // Property endpoints
  properties: {
    list: (params?: any) => apiGet('properties', { params }),
    getById: (id: number) => apiGet(`properties/${id}`),
    create: (data: FormData) => apiFormPost('properties/create_property', data),
    update: (id: number, data: FormData) => apiFormPut(`properties/${id}`, data),
    delete: (id: number) => apiDelete(`properties/${id}`),
    
    // Special endpoints
    myProperties: () => apiGet('properties/my-properties'),
    buy: (params?: any) => apiGet('properties/buy', { params }),
    rent: (params?: any) => apiGet('properties/rent', { params }),
    featured: () => apiGet('properties/featured'),
    
    // User-specific property endpoints
    getUserProperty: (username: string, propertyId: number) => 
      apiGet(`properties/${username}/property/${propertyId}`),
    getUserProperties: (username: string) => 
      apiGet(`properties/${username}/properties`),
    
    // Favorites
    myFavorites: () => apiGet('properties/my-favourites'),
    toggleFavorite: (propertyId: number) => 
      apiPost(`properties/${propertyId}/favourite`),
  },
  
  // Admin endpoints
  admin: {
    getProperties: () => apiGet('properties/api_admin/dashboard/properties'),
    createProperty: (data: FormData) => 
      apiFormPost('properties/api_admin/create-property', data),
    getUserProperties: () => apiGet('properties/api_admin/properties'),
  }
};

export default api;
