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

// REQUEST INTERCEPTOR: Since cookies are automatically attached by the browser,
// we don’t need to modify the headers here.
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => config,
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle token refresh on 401 errors.
// It assumes your backend reads the refresh token from cookies.
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn("Access token expired, attempting refresh...");
      try {
        const refreshResponse = await apiClient.post(
          '/api/users/refresh',
          {},
          { withCredentials: true }
        );
        if (refreshResponse.status === 200) {
          console.log("Token refreshed successfully.");
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear cookies on refresh failure if needed.
        document.cookie = 'access_token=; path=/; domain=.propertpro.com; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'refresh_token=; path=/; domain=.propertpro.com; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        // Instead of redirecting here, simply reject the error so that 
        // your application can handle the unauthenticated state gracefully.
      }
    }
    return Promise.reject(error);
  }
);


/**
 * Login user and return response data.
 * The backend is expected to set the authentication cookies via Set-Cookie headers.
 */
export async function login(email: string, password: string) {
  try {
    const response = await apiClient.post('/api/users/login', { email, password });
    // No client-side cookie setting is done; rely on the backend.
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
 * Calls the logout endpoint and then clears the cookies.
 * Ideally, your backend should clear the cookies via Set-Cookie headers.
 */
export async function logout() {
  try {
    const response = await apiClient.post('/api/users/logout');
    // Clear cookies.
    // Use the domain attribute that matches how the cookies were set.
    document.cookie = 'access_token=; path=/; domain=.propertpro.com; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; domain=.propertpro.com; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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

// Export the apiClient to be used elsewhere if needed.
export { apiClient };
