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
// we don't need to modify the headers here.
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
    
    // Prevent infinite loop for refresh endpoint errors:
    if (originalRequest.url?.includes('/api/users/refresh')) {
      return Promise.reject(error);
    }
    
    // Don't try to refresh token for public routes
    const publicRoutes = [
      '/api/properties/buy',
      'buy/',
      '/api/properties/rent',
      'rent/'
    ];
    
    // Check if it's a public property details route (matches /api/properties/{number})
    const isPublicPropertyDetail = originalRequest.url && /\/api\/properties\/\d+\/?$/.test(originalRequest.url);
    
    // Skip token refresh for public routes
    const isPublicRoute = publicRoutes.some(route => originalRequest.url?.includes(route)) || isPublicPropertyDetail;
    
    if (error.response?.status === 401 && isPublicRoute) {
      console.log('Unauthenticated access to public route, continuing without refresh');
      return Promise.reject(error);
    }
    
    // Initialize or increment the retry count
    originalRequest._retryCount = originalRequest._retryCount || 0;

    // Limit refresh attempts to, say, 2 additional tries (3 in total)
    if (error.response?.status === 401 && originalRequest._retryCount < 3) {
      originalRequest._retryCount += 1;
      console.warn(`Attempt ${originalRequest._retryCount}: Access token expired, attempting refresh...`);
      try {
        const refreshResponse = await apiClient.post(
          '/api/users/refresh',
          {},
          { withCredentials: true }
        );
        if (refreshResponse.status === 200) {
          console.log("Token refreshed successfully.");
          // Retry the original request now that the token is refreshed.
          return apiClient(originalRequest);
        } else {
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error("Token refresh failed on attempt", originalRequest._retryCount, ":", refreshError);
        // Clear the cookies when refresh fails.
        document.cookie =
          'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie =
          'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        return Promise.reject(refreshError);
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
    document.cookie =
      'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie =
      'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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
    const response = await apiClient.post('/api/properties/create_property/', propertyData, {
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
