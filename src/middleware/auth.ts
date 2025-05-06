import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "/api";

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
  (config: AxiosRequestConfig) => {
    // Add X-CSRFToken header for non-GET requests
    /* // Temporarily disable CSRF header for testing SameSite=Lax
    if (config.method !== 'get' && config.method !== 'GET') {
      // Get CSRF token from cookies
      const csrfToken = getCookieValue('XSRF-TOKEN');
      if (csrfToken) {
        // Set the header Django expects
        config.headers = config.headers || {};
        config.headers['X-CSRFToken'] = csrfToken;
        console.log('Adding X-CSRFToken header to request');
      } else {
        console.warn('No CSRF token found in cookies for non-GET request');
      }
    }
    */
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to get a cookie value by name
function getCookieValue(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// RESPONSE INTERCEPTOR: Handle token refresh on 401 errors.
// It assumes your backend reads the refresh token from cookies.
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    
    // Prevent infinite loop for refresh endpoint errors:
    if (originalRequest.url?.includes('/users/refresh')) {
      return Promise.reject(error);
    }
    
    // Don't try to refresh token for public routes
    const publicRoutes = [
      '/properties/buy',
      '/properties/buy/',
      'properties/buy',
      'buy/',
      '/buy',
      '/buy/',
      '/properties/rent',
      '/properties/rent/',
      'properties/rent',
      'rent/',
      '/rent',
      '/rent/'
    ];
    
    // Check if it's a public property details route (matches /properties/{number})
    const isPublicPropertyDetail = originalRequest.url && /\/properties\/\d+\/?$/.test(originalRequest.url);
    
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
          '/users/refresh',
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
    console.log("Attempting login with email:", email);
    console.log("API URL base:", apiClient.defaults.baseURL);
    
    const response = await apiClient.post('/users/login', { email, password });
    console.log("Login successful, received response:", response.status);
    // No client-side cookie setting is done; rely on the backend.
    return { status: response.status, ...response.data };
  } catch (error: any) {
    console.error("Login Error:", error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error("Server responded with status:", error.response.status);
      console.error("Response data:", error.response.data);
      
      if (error.response.status === 502) {
        return { error: "Backend server is unreachable. Please try again later or contact support." };
      }
      return { error: error.response?.data?.error || "Login failed" };
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from server");
      return { error: "No response from server. Please check your internet connection." };
    } else {
      // Something happened in setting up the request
      console.error("Error setting up request:", error.message);
      return { error: "Login request failed. Please try again later." };
    }
  }
}

/**
 * Register a new user.
 */
export async function register(username: string, email: string, password: string) {
  try {
    const response = await apiClient.post('/users/register', { username, email, password });
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
    const response = await apiClient.post('/users/logout');
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
  console.log("Attempting to fetch user data");
  console.log("API URL:", API_URL);
  console.log("Cookies available:", document.cookie); // Check if cookies exist
  
  try {
    // Try with explicit URL to bypass any potential routing issues
    const response = await apiClient.get('/users/get_user', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Log response details for debugging
    console.log("User fetch response status:", response.status);
    console.log("Response headers:", response.headers);
    
    // Check if response is actually JSON
    const contentType = response.headers['content-type'];
    console.log("Content-Type of response:", contentType);
    
    if (contentType && contentType.includes('text/html')) {
      console.error("Received HTML instead of JSON. This likely indicates a routing issue.");
      throw new Error("Invalid response format: expected JSON, received HTML");
    }
    
    console.log("User data:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Fetch User Error:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
}

/**
 * Get protected data that requires authentication.
 */
export async function getProtectedData() {
  try {
    const response = await apiClient.get('/protected/');
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
    const response = await apiClient.post('/properties/create_property', propertyData, {
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
    const response = await apiClient.get('/properties/');
    return response.data;
  } catch (error: any) {
    console.error("Get Properties Error:", error);
    throw error;
  }
}

// Export the apiClient to be used elsewhere if needed.
export { apiClient };
