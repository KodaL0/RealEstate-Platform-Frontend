import axios from 'axios';
// Attempt to import types directly, hoping the module resolution works
import { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Extend AxiosRequestConfig to include a custom _retryCount flag for token refresh
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retryCount?: number;
}

// --- Token State (In-memory, to be replaced by cookie handling) ---
// let accessToken: string | null = null;
// let refreshToken: string | null = null;

// export const setTokens = (newAccessToken: string, newRefreshToken: string) => {
//   accessToken = newAccessToken;
//   refreshToken = newRefreshToken;
//   // Potentially save to localStorage here if persistence across tabs/sessions is needed
//   // localStorage.setItem('accessToken', newAccessToken);
//   // localStorage.setItem('refreshToken', newRefreshToken);
// };

// export const getAccessToken = () => {
//   // return accessToken || localStorage.getItem('accessToken');
//   return accessToken;
// };

// export const getRefreshToken = () => {
//   // return refreshToken || localStorage.getItem('refreshToken');
//   return refreshToken;
// };

// export const clearTokens = () => {
//   accessToken = null;
//   refreshToken = null;
//   // localStorage.removeItem('accessToken');
//   // localStorage.removeItem('refreshToken');
// };
// --- End Token State ---


// Helper function to get a cookie value by name
function getCookieValue(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Helper function to set a cookie
function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  const cookieString = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax";
  console.log(`[setCookie] Attempting to set cookie: ${cookieString}`);
  document.cookie = cookieString;
  // Log the specific cookie being set and then all cookies for verification
  const currentCookieValue = getCookieValue(name);
  console.log(`[setCookie] Value of ${name} after setting: ${currentCookieValue}`);
  console.log(`[setCookie] Current document.cookie after trying to set ${name}:`, document.cookie);
}

// Helper function to clear a cookie
function clearCookie(name: string, domain?: string | null, path: string = '/') {
  let cookieStr = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
  
  // Add domain if specified
  if (domain) {
    cookieStr += `; Domain=${domain}`;
  }
  
  document.cookie = cookieStr;
  console.log(`Cookie cleared: ${name}${domain ? ' (domain: ' + domain + ')' : ''}${path !== '/' ? ' (path: ' + path + ')' : ''}`);
}

export function setAuthCookies(accessToken: string, refreshToken: string) {
  console.log('[setAuthCookies] Received accessToken:', accessToken);
  console.log('[setAuthCookies] Received refreshToken:', refreshToken);
  setCookie("access_token", accessToken, 1/24); // 1 hour for access token
  setCookie("refresh_token", refreshToken, 7);  // 7 days for refresh token
  console.log("[setAuthCookies] Auth cookies setting process complete.");
  console.log('[setAuthCookies] Final document.cookie after all setAuthCookies operations:', document.cookie);
}

export function clearAuthCookies() {
  clearCookie("access_token");
  clearCookie("refresh_token");
  clearCookie("XSRF-TOKEN"); // Clear CSRF token on logout
  clearCookie("csrftoken");  // Also clear Django's default CSRF token name
  
  // Clear potential Django admin session cookies
  clearCookie("sessionid"); 
  
  // Try to clear Google auth-related cookies that might be set at root domain
  const domains = [null, window.location.hostname, `.${window.location.hostname}`, "localhost"];
  const paths = ["/", "/admin/", "/accounts/", "/api/"];
  
  // Clear potential Google OAuth cookies across multiple paths and domains
  domains.forEach(domain => {
    paths.forEach(path => {
      clearCookie("g_state", domain, path);
      clearCookie("g_csrf_token", domain, path);
      clearCookie("g_auth_state", domain, path);
    });
  });
  
  // Clear localStorage items that might be related to auth
  localStorage.removeItem("g_state");
  localStorage.removeItem("g_auth_state");
  
  console.log("Auth cookies have been cleared.");
}


// Create an Axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
});

// REQUEST INTERCEPTOR:
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add Authorization header if access token cookie exists
    const token = getCookieValue('access_token');
    if (token) {
      config.headers = config.headers || {};
      if (config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Add X-CSRFToken header for non-GET requests
    if (config.method && !['GET', 'HEAD', 'OPTIONS'].includes(config.method.toUpperCase())) {
      // Try to get the CSRF token from XSRF-TOKEN first, then fall back to Django's default csrftoken
      let csrfToken = getCookieValue('XSRF-TOKEN') || getCookieValue('csrftoken');
      
      if (csrfToken) {
        config.headers = config.headers || {};
        if (config.headers) {
          config.headers['X-CSRFToken'] = csrfToken;
        }
        console.log(`Adding X-CSRFToken header to request: ${csrfToken.substring(0, 8)}...`);
      } else {
        console.warn('No CSRF token cookie found (tried both XSRF-TOKEN and csrftoken)');
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);


// RESPONSE INTERCEPTOR: Handle token refresh on 401 errors.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    const status = error.response?.status;
    const url = originalRequest.url;

    // Prevent infinite loop for refresh endpoint errors:
    if (url && url.includes('/users/refresh')) {
      console.error("Refresh token request itself failed. Clearing auth cookies.");
      clearAuthCookies(); // Clear tokens if refresh fails
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
    
    const isPublicPropertyDetail = url && /\/properties\/\d+\/?$/.test(url);
    const isPublicRoute = publicRoutes.some(route => url?.includes(route)) || isPublicPropertyDetail;
    
    if (status === 401 && isPublicRoute) {
      console.log('Unauthenticated access to public route, continuing without refresh');
      return Promise.reject(error);
    }
    
    originalRequest._retryCount = originalRequest._retryCount || 0;

    if (status === 401 && originalRequest._retryCount < 2) { // Limit to 1 retry for refresh
      originalRequest._retryCount += 1;
      console.warn(`Attempt ${originalRequest._retryCount}: Access token expired or invalid, attempting refresh...`);
      
      const currentRefreshToken = getCookieValue('refresh_token');
      if (!currentRefreshToken) {
        console.error("No refresh token cookie found. Cannot attempt refresh.");
        clearAuthCookies(); // Clear any lingering auth state
        // Optionally redirect to login: window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        console.log("Attempting to refresh token with refresh_token from cookie...");
        const refreshResponse = await axios.post( // Use a new axios instance or the global one for refresh
          `${API_URL}/users/refresh`,
          { refresh: currentRefreshToken }, // Send refresh token in body
          { withCredentials: true } // Important for backend to read session/CSRF if needed, and set new cookies
        );

        if (refreshResponse.status === 200) {
          console.log("Token refreshed successfully. Backend should have set new cookies.");
          // The backend's response to /users/refresh is expected to set new httpOnly cookies.
          // The browser will automatically use these new cookies for the retried request.
          // If the backend also returns new tokens in the response body (and they are not httpOnly),
          // you could update them here using setAuthCookies if needed, but relying on Set-Cookie is preferred.
          // For example, if refreshResponse.data.access and refreshResponse.data.refresh exist:
          // setAuthCookies(refreshResponse.data.access, refreshResponse.data.refresh);

          return apiClient(originalRequest); // Retry original request
        } else {
          console.error("Token refresh responded with status:", refreshResponse.status);
          clearAuthCookies();
          // Optionally redirect to login
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error("Token refresh request failed:", refreshError);
        clearAuthCookies();
        // Optionally redirect to login: window.location.href = '/login';
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
    const response = await apiClient.post('/users/login', { email, password });
    console.log("Login successful, received response:", response.status);
    // Backend's /users/login endpoint is expected to set access_token and refresh_token cookies.
    // No explicit client-side cookie setting needed here after login.
    // We might want to fetch the XSRF-TOKEN if the backend sets it on login.
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
    // Assuming backend sets cookies on successful registration too, or returns tokens
    // If tokens are returned in body, and we need to set them as JS-accessible cookies:
    // if (response.data.access_token && response.data.refresh_token) {
    //   setAuthCookies(response.data.access_token, response.data.refresh_token);
    // }
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
    // Important: Call backend logout first. It might do session invalidation or token blacklisting.
    await apiClient.post('/users/logout'); 
    console.log("Logout API call successful.");
  } catch (error: any) {
    // Log the error but proceed to clear client-side tokens anyway
    console.error("Logout API call failed:", error.response?.data?.error || error.message);
  } finally {
    // Always clear client-side auth state
    clearAuthCookies();
    console.log("Client-side auth cookies cleared after logout attempt.");
    
    // Redirect back to login page with cache-busting parameter
    // This avoids logging out of Google account completely
    const timestamp = new Date().getTime();
    window.location.href = `/login?nocache=${timestamp}`;
  }
  // Return a resolved promise or some status, as the original function did
  return { status: 200, message: "Logout process completed on client." };
}

/**
 * Fetch the current user's data.
 */
export async function fetchUser() {
  console.log("Attempting to fetch user data");
  console.log("Cookies available at fetchUser call:", document.cookie);
  
  try {
    const response = await apiClient.get('/users/get_user');
    console.log("User fetch response status:", response.status);
    console.log("User data:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Fetch User Error:", error);
    console.error("Error response from fetchUser:", error.response?.data);
    // If 401 and refresh didn't work or wasn't attempted, it will be rejected by interceptor.
    // No need to clear cookies here, interceptor handles it on failed refresh.
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
