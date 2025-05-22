import axios from 'axios';
import { apiClient, apiPost, apiGet, API_URL } from '../config/api';

// Functions to manage auth tokens and cookies

/**
 * Set auth cookies (used by AuthTokenProcessor when receiving tokens from OAuth)
 */
export function setAuthCookies(accessToken: string, refreshToken: string) {
  console.log('[setAuthCookies] Received accessToken:', accessToken.substring(0, 10) + '...');
  console.log('[setAuthCookies] Received refreshToken:', refreshToken.substring(0, 10) + '...');
  
  // Set cookies with expiration
  document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`; // 1 day
  document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`; // 7 days
  
  console.log('[setAuthCookies] Auth cookies set');
  console.log('[setAuthCookies] Current cookies:', document.cookie);
}

/**
 * Clear auth cookies (to be used on logout/session expiry)
 */
export function clearAuthCookies() {
  // Clear auth-related cookies
  document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  console.log("Auth cookies cleared");
}

/**
 * Login user with email/password
 */
export async function login(email: string, password: string) {
  try {
    console.log("Attempting login with email:", email);
    const response = await apiPost('users/login', { email, password });
    console.log("Login successful, received response:", response.status);
    // Backend's /users/login endpoint is expected to set access_token and refresh_token cookies.
    return { status: response.status, ...response.data };
  } catch (error: any) {
    console.error("Login Error:", error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      
      return { 
        status: error.response.status,
        error: error.response.data.detail || error.response.data.error || "Authentication failed" 
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
      return { status: 0, error: "No response from server" };
    } else {
      // Something happened in setting up the request
      console.error("Error setting up request:", error.message);
      return { status: 0, error: "Error setting up request" };
    }
  }
}

/**
 * Register a new user.
 */
export async function register(username: string, email: string, password1: string, password2: string) {
  try {
    const response = await apiPost('users/register', { 
      username, email, password1, password2 
    });
    return { status: response.status, ...response.data };
  } catch (error: any) {
    console.error("Registration Error:", error);
    
    if (error.response) {
      return { 
        status: error.response.status,
        error: error.response.data.detail || error.response.data.error || "Registration failed" 
      };
    } else if (error.request) {
      return { status: 0, error: "No response from server" };
    } else {
      return { status: 0, error: "Error setting up request" };
    }
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
    // Debug the full URL that will be used
    const logoutUrl = 'users/logout/'; // Ensure trailing slash is consistent with Django
    console.log(`Attempting to call logout at: ${API_URL}/${logoutUrl}`);
    
    await apiPost(logoutUrl); 
    console.log("Logout API call successful.");
  } catch (error: any) {
    // Enhanced error logging for debugging
    console.error("Logout API call failed:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  } finally {
    // Always clear cookies on client-side regardless of API success
    clearAuthCookies();
  }
}

/**
 * Fetch the current user's information based on their authentication token.
 */
export async function fetchUser() {
  try {
    const response = await apiGet('users/get_user');
    return { 
      user: response.data,
      authenticated: true
    };
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return { user: null, authenticated: false };
  }
}

// Add a request interceptor to handle token refreshing
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';

    // Prevent infinite loop for refresh endpoint errors:
    if (url.includes('users/refresh')) {
      console.error("Refresh token request itself failed. Clearing auth cookies.");
      clearAuthCookies(); // Clear tokens if refresh fails
      return Promise.reject(error);
    }

    // Only attempt refresh if we got a 401 (Unauthorized) error
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Set a flag to prevent infinite retry loops
      originalRequest._retry = true;
      
      // Get current refresh token from cookie
      const cookieString = document.cookie;
      const refreshTokenMatch = cookieString.match(/refresh_token=([^;]*)/);
      const currentRefreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;
      
      if (!currentRefreshToken) {
        console.error("No refresh token available");
        clearAuthCookies();
        return Promise.reject(error);
      }
      
      try {
        console.log("Attempting to refresh token with refresh_token from cookie...");
        const refreshResponse = await axios.post( 
          `${API_URL}/api/users/refresh/`,
          { refresh: currentRefreshToken }, // Send refresh token in body
          { withCredentials: true } // Important for backend to read session/CSRF if needed, and set new cookies
        );
        console.log("Token refresh successful");
        
        // The backend should set the new access_token cookie via Set-Cookie header
        // We don't need to manually set it here

        // Now retry the original request with the new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        clearAuthCookies(); // Clear tokens if refresh fails
        return Promise.reject(error); // Reject with the original error
      }
    }
    
    // For any other error, just pass it through
    return Promise.reject(error);
  }
);

// Export the API client for use in other files
export { apiClient };
