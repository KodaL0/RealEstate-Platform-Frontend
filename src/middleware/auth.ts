import axios from 'axios';
import api from '../config/api';

// Get the axios instance for interceptors
const apiClient = axios.create({
  baseURL: 'https://api.propertpro.com',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Functions to manage auth tokens and cookies

/**
 * Clear auth cookies (to be used on logout/session expiry)
 */
export function clearAuthCookies() {
  // Clear auth-related cookies with proper cross-domain attributes
  
  // Clear cookies without domain specification
  document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure';
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure';
  document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure';
  
  console.log("Auth cookies cleared");
}

/**
 * Login user with email/password
 */
export async function login(email: string, password: string) {
  try {
    console.log("Attempting login with email:", email);
    const response = await api.auth.login({ email, password });
    console.log("Login successful, received response:", response.status);
    
    // Backend's /users/login endpoint is expected to set access_token and refresh_token cookies.
    return { 
      status: response.status, 
      user: response.data.user,
      message: response.data.message || 'Login successful'
    };
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
export async function register(username: string, email: string, password: string) {
  try {
    // Convert username to lowercase before sending to backend
    const lowercaseUsername = username.toLowerCase();
    
    const response = await api.auth.register({ 
      username: lowercaseUsername, 
      email, 
      password  // Note: single password field, not password1/password2
    });
    
    return { 
      status: response.status, 
      message: response.data.message || 'Registration successful',
      email: response.data.email,
      email_sent: response.data.email_sent
    };
  } catch (error: any) {
    console.error("Registration Error:", error);
    
    if (error.response) {
      return { 
        status: error.response.status,
        error: error.response.data.error || error.response.data.detail || "Registration failed",
        details: error.response.data.details
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
    console.log(`Attempting to call logout endpoint`);
    
    await api.auth.logout(); 
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
    const response = await api.auth.getUser();
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
  (response) => response,
  async (error) => {
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
        const refreshResponse = await api.auth.refreshToken();
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
