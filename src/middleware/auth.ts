import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
 
const API_URL = import.meta.env.VITE_API_URL || "https://propertprodjango.onrender.com";
 
// Extend AxiosRequestConfig to include a custom _retry flag for token refresh
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}
 
// Create an Axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensures cookies are sent on each request
});
 
// REQUEST INTERCEPTOR: Automatically attach the access token if needed
// (In this version, we assume the cookies are automatically attached,
// so we don't need to modify the headers.)
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    return config;
  },
  (error) => Promise.reject(error)
);
 
// RESPONSE INTERCEPTOR: Handle token refresh on 401 errors
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    // Only retry if a 401 occurs and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn("Access token expired, attempting refresh...");
      try {
        // Attempt to refresh the token (force sending cookies with credentials)
        const refreshResponse = await apiClient.post(
          '/api/users/refresh',
          {},
          { withCredentials: true }
        );
        if (refreshResponse.status === 200) {
          console.log("Token refreshed successfully.");
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear any existing cookies on refresh failure (use consistent domain)
        document.cookie =
          'access_token=; path=/; domain=.propertpro.com; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie =
          'refresh_token=; path=/; domain=.propertpro.com; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
    return Promise.reject(error);
  }
);
 
 
 
/**
 * Login user and return response data.
 */
export async function login(email: string, password: string) {
  try {
    const response = await apiClient.post('/api/users/login', { email, password });
    return { status: response.status, ...response.data };
  } catch (error: any) {
    console.error("Login Error:", error);
    return { error: error.response?.data?.error || "Login failed" };
  }
}
 
/**
 * Register a new user.
 */
export async function register(username: string, email: string, password: string) {
  try {
    const response = await apiClient.post('/api/users/register', { username, email, password });
    return { status: response.status, ...response.data };
  } catch (error: any) {
    console.error("Registration Error:", error);
    return { error: error.response?.data?.error || "Registration failed" };
  }
}
 
/**
 * Logout the user.
 */
export async function logout() {
  try {
    const response = await apiClient.post('/api/users/logout');
    // Clear cookies on logout
    document.cookie = 'access_token=; path=/; domain=www.propertpro.com; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; domain=www.propertpro.com; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    return { status: response.status, ...response.data };
  } catch (error: any) {
    console.error("Logout Error:", error);
    return { error: error.response?.data?.error || "Logout failed" };
  }
}
 
/**
 * Fetch the current user's data.
 */
export async function fetchUser() {
  try {
    const response = await apiClient.get('/api/users/get_user/');
    return response.data;
  } catch (error: any) {
    console.error("Fetch User Error:", error);
    throw error;
  }
}
 
/**
 * Get protected data that requires authentication.
 */
export async function getProtectedData() {
  try {
    const response = await apiClient.get('/api/protected/');
    return response.data;
  } catch (error: any) {
    console.error("Protected Data Error:", error);
    throw error;
  }
}
 
/**
 * Create a new property.
 */
export async function createProperty(propertyData: FormData) {
  try {
    const response = await apiClient.post('/api/properties/', propertyData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Create Property Error:", error);
    throw error;
  }
}
 
/**
 * Get all properties.
 */
export async function getProperties() {
  try {
    const response = await apiClient.get('/api/properties/');
    return response.data;
  } catch (error: any) {
    console.error("Get Properties Error:", error);
    throw error;
  }
}
