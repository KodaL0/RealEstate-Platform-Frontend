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
 
// REQUEST INTERCEPTOR: Automatically attach the access token to headers
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // No need to manually set token, it's handled by cookies
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
        // No need to send refresh token, it's in cookies
        const refreshResponse = await apiClient.post('/api/users/refresh');
        if (refreshResponse.status === 200) {
          console.log("Token refreshed successfully.");
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Redirect to login if refresh fails
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
    // Clear any client-side state
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
