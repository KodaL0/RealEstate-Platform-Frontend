const API_URL = import.meta.env.VITE_API_URL || "https://propertprobackend.onrender.com";

/**
 * A generic fetch wrapper that automatically attempts a token refresh.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const getCookie = (name: string) => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
  };

  let accessToken = getCookie("access_token_cookie");

  const headers = {
    ...options.headers,
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  let response = await fetch(url, { 
    ...options, 
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    console.warn("Access token expired, attempting refresh...");

    const refreshResponse = await fetch(`${API_URL}/api/users/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshResponse.ok) {
      console.log("Token refreshed successfully.");
      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.access_token || getCookie("access_token_cookie");

      if (newAccessToken) {
        console.log("Using new access token");
        response = await fetch(url, { 
          ...options, 
          headers: {
            ...options.headers, 
            Authorization: `Bearer ${newAccessToken}`, // Update token
          },
          credentials: "include",
        });
      } else {
        console.error("No new access token found after refresh.");
      }
    } else {
      console.error("Token refresh failed.");
    }
  }

  return response;
}

/**
 * Login user and return response data.
 */
export async function login(email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Login failed");

    return { status: response.status, ...data };
  } catch (error) {
    console.error("Login Error:", error);
    return { error: "Network error" };
  }
}

/**
 * Register a new user.
 */
export async function register(username: string, email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Registration failed");

    return { status: response.status, ...data };
  } catch (error) {
    console.error("Registration Error:", error);
    return { error: "Network error" };
  }
}

/**
 * Logout the user.
 */
export async function logout() {
  try {
    const response = await fetch(`${API_URL}/api/users/logout`, {
      method: "POST",
      credentials: "include",
    });

    return response.json();
  } catch (error) {
    console.error("Logout Error:", error);
    return { error: "Network error" };
  }
}

/**
 * Fetch the current user details.
 */
export async function fetchUser() {
  try {
    const response = await authFetch(`${API_URL}/api/users/get_user`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch user data.");

    return response.json();
  } catch (error) {
    console.error("Fetch User Error:", error);
    return { error: "Failed to fetch user data." };
  }
}

/**
 * Get protected user data.
 */
export async function getProtectedData() {
  try {
    const response = await authFetch(`${API_URL}/api/users/protected`, { method: "GET" });

    if (!response.ok) throw new Error("Failed to fetch protected data.");

    return response.json();
  } catch (error) {
    console.error("Get Protected Data Error:", error);
    return { error: "Failed to fetch protected data." };
  }
}

/**
 * Create a new property listing.
 */
export async function createProperty(propertyData: FormData) {
  try {
    const response = await authFetch(`${API_URL}/api/properties/create_property`, {
      method: "POST",
      body: propertyData, // Use FormData for file uploads
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
  }
}

/**
 * Fetch all properties.
 */
export async function getProperties() {
  try {
    const response = await authFetch(`${API_URL}/api/properties/get_properties`, { method: "GET" });

    if (!response.ok) throw new Error("Failed to fetch properties.");

    return await response.json();
  } catch (error) {
    console.error("Error fetching properties:", error);
    return { error: "Failed to fetch properties." };
  }
}
