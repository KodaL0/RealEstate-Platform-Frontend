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
    // Only retry if we get a 401 response and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn("Access token expired, attempting refresh...");
 
      try {
        // The browser sends cookies automatically because of withCredentials:true.
        // The backend should read the refresh token from the cookie (e.g., "refresh_token_cookie").
        const refreshResponse = await apiClient.post('/api/users/refresh');
        if (refreshResponse.status === 200) {
          console.log("Token refreshed successfully.");
          // When refreshed successfully, the backend should ideally update the cookies.
          // Retry the original request.
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Optionally, redirect to login if refresh fails.
        window.location.href = '/login';
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
    
    // Manually set cookies for tokens if they are returned in the response.
    // Adjust the cookie names/attributes as needed.
    if (response.data.access_token) {
      document.cookie = `access_token_cookie=${response.data.access_token}; path=/;`;
    }
    if (response.data.refresh_token) {
      document.cookie = `refresh_token_cookie=${response.data.refresh_token}; path=/;`;
    }
    
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
    // Optionally clear cookies here if necessary.
    // You may want to clear document.cookie entries.
    // Redirecting to login after logout:
    window.location.href = '/login';
    return response.data;
  } catch (error: any) {
    console.error("Logout Error:", error);
    return { error: "Network error" };
  }
}
 
/**
 * Fetch the current user details.
 */
export async function fetchUser() {
  try {
    const response = await apiClient.get('/api/users/get_user');
    return response.data;
  } catch (error: any) {
    console.error("Fetch User Error:", error);
    return { error: "Failed to fetch user data." };
  }
}
 
/**
 * Get protected user data.
 */
export async function getProtectedData() {
  try {
    const response = await apiClient.get('/api/users/protected');
    return response.data;
  } catch (error: any) {
    console.error("Get Protected Data Error:", error);
    return { error: "Failed to fetch protected data." };
  }
}
 
/**
 * Create a new property listing.
 */
export async function createProperty(propertyData: FormData) {
  try {
    const response = await apiClient.post('/api/properties/create_property', propertyData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating property:", error);
    throw error;
  }
}
 
/**
 * Fetch all properties.
 */
export async function getProperties() {
  try {
    const response = await apiClient.get('/api/properties/get_properties');
    return response.data;
  } catch (error: any) {
    console.error("Error fetching properties:", error);
    return { error: "Failed to fetch properties." };
  }
}
