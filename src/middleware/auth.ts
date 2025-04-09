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
 
// Utility function to get a cookie value by name
const getCookie = (name: string): string | null => {
  const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
};
 
// REQUEST INTERCEPTOR: Automatically attach the access token to headers
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const accessToken = getCookie("access_token_cookie");
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
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
        // Retrieve the refresh token from the cookie
        const refreshToken = getCookie("refresh_token_cookie");
        // Attempt to refresh the access token by including the refresh token in the body
        const refreshResponse = await apiClient.post('/api/users/refresh', {
          refresh_token: refreshToken
        });
        if (refreshResponse.status === 200) {
          console.log("Token refreshed successfully.");
          // Get new access token from the response or from the updated cookie
          const newAccessToken = refreshResponse.data.access_token || getCookie("access_token_cookie");
          if (newAccessToken) {
            // Update the access token cookie with the new token
            document.cookie = `access_token_cookie=${newAccessToken}; path=/;`;
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          } else {
            console.error("No new access token found after refresh.");
          }
        }
      } catch (refreshError) {
        console.error("Token refresh failed.", refreshError);
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
    // Save the access token in a cookie if returned in the response
    if (response.data.access_token) {
      document.cookie = `access_token_cookie=${response.data.access_token}; path=/;`;
    }
    // Save the refresh token in a cookie as well
    if (response.data.refresh_token) {
      document.cookie = `refresh_token_cookie=${response.data.refresh_token}; path=/;`;
    }
    return { status: response.status, ...response.data };
  } catch (error: any) {
    console.error("Login Error:", error);
    return { error: error.response?.data?.error || "Network error" };
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
    return { error: error.response?.data?.error || "Network error" };
  }
}
 
/**
* Logout the user.
*/
export async function logout() {
  try {
    // Retrieve the refresh token from the cookie
    const refreshToken = getCookie("refresh_token_cookie");
    const response = await apiClient.post('/api/users/logout', {
      refresh_token: refreshToken
    });
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
