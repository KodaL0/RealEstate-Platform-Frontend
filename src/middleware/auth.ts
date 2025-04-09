import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "https://propertprodjango.onrender.com";

// Extend AxiosRequestConfig to include a custom _retry flag for token refresh
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Create an Axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensures cookies are sent with each request
});

// REQUEST INTERCEPTOR: We assume the browser automatically sends cookies,
// so no need to attach tokens manually here.
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => config,
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle token refresh on 401 errors.
// It assumes that the refresh endpoint (/api/users/refresh) reads the refresh token from cookies.
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    // Only retry if a 401 occurs and we haven't retried yet.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn("Access token expired, attempting refresh...");
      try {
        const refreshResponse = await apiClient.post('/api/users/refresh');
        if (refreshResponse.status === 200) {
          console.log("Token refreshed successfully.");
          // Retry the original request using the updated cookies.
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Optionally, update your UI state to indicate the user is logged out.
        // You might want to redirect to /login only if necessary:
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Login user and return response data.
 * We rely on the backend to set the cookies (via Set-Cookie headers) on a successful login.
 */
export async function login(email: string, password: string) {
  try {
    const response = await apiClient.post('/api/users/login', { email, password });
    // Do not set cookies manually—let the backend do it.
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
 * We call the logout endpoint and then redirect.
 * Ideally, the backend will clear the authentication cookies.
 */
export async function logout() {
  try {
    const response = await apiClient.post('/api/users/logout');
    // Instead of manually clearing cookies (which may cause domain issues),
    // allow the backend to clear them via Set-Cookie headers.
    window.location.href = '/login';
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

export { apiClient };
