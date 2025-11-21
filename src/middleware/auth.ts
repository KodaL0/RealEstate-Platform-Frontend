import api, { apiClient } from "../config/api";

// Functions to manage auth tokens and cookies

/**
 * Check if auth cookies exist
 */
export function hasAuthCookies(): boolean {
  if (typeof document === "undefined") return false;

  const cookieString = document.cookie;
  const authCookieNames = [
    "access_token",
    "refresh_token",
    "mobile_access_token",
    "mobile_refresh_token",
    "sessionid",
  ];

  return authCookieNames.some((name) => {
    const regex = new RegExp(`(^|; )${name}=`);
    return regex.test(cookieString);
  });
}

/**
 * Clear auth cookies (to be used on logout/session expiry)
 */
export function clearAuthCookies() {
  if (typeof document === "undefined") return;

  const cookieNames = [
    "access_token",
    "refresh_token",
    "mobile_access_token",
    "mobile_refresh_token",
    "csrftoken",
    "sessionid",
  ];

  // Get current hostname to determine domains
  const hostname = window.location.hostname;

  // Define all possible domain combinations
  const domains: (string | undefined)[] = [
    undefined, // Host-only (no domain) - covers current domain
  ];

  // Add .propertpro.com domain if we're on a propertpro.com domain (covers all subdomains)
  if (hostname.includes("propertpro.com")) {
    domains.push(".propertpro.com");
  }

  // Clear each cookie with all domain combinations and SameSite attributes
  cookieNames.forEach((name) => {
    domains.forEach((domain) => {
      // Clear with SameSite=None; Secure (for cross-origin cookies in production)
      let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure`;
      if (domain) {
        cookieString += `; domain=${domain}`;
      }
      document.cookie = cookieString;

      // Clear with SameSite=Lax (for mobile browsers and same-site cookies)
      cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      if (domain) {
        cookieString += `; domain=${domain}`;
      }
      document.cookie = cookieString;
    });
  });

  console.log("✅ Auth cookies cleared with all domain combinations");
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
    const responseData = response.data as { user?: unknown; message?: string };
    return {
      status: response.status,
      user: responseData.user,
      message: responseData.message || "Login successful",
    };
  } catch (error: unknown) {
    console.error("Login Error:", error);
    const apiError = error as {
      response?: { status: number; data?: { detail?: string; error?: string } };
      request?: unknown;
      message?: string;
    };

    if (apiError.response) {
      // The request was made and the server responded with a status code
      console.error("Status:", apiError.response.status);
      console.error("Data:", apiError.response.data);

      return {
        status: apiError.response.status,
        error:
          apiError.response.data?.detail ||
          apiError.response.data?.error ||
          "Authentication failed",
      };
    } else if (apiError.request) {
      // The request was made but no response was received
      console.error("No response received:", apiError.request);
      return { status: 0, error: "No response from server" };
    } else {
      // Something happened in setting up the request
      console.error("Error setting up request:", apiError.message);
      return { status: 0, error: "Error setting up request" };
    }
  }
}

/**
 * Register a new user.
 */
export async function register(
  username: string,
  email: string,
  password: string,
  acceptedTerms: boolean = false,
  acceptedPrivacy: boolean = false,
  marketingConsent: boolean = false,
) {
  try {
    // Convert username to lowercase before sending to backend
    const lowercaseUsername = username.toLowerCase();

    const response = await api.auth.register({
      username: lowercaseUsername,
      email,
      password, // Note: single password field, not password1/password2
      accepted_terms: acceptedTerms,
      accepted_privacy_policy: acceptedPrivacy,
      marketing_consent: marketingConsent,
      terms_accepted_at: new Date().toISOString(),
    });

    const responseData = response.data as {
      message?: string;
      email?: string;
      email_sent?: boolean;
      consents_recorded?: boolean;
    };
    return {
      status: response.status,
      message: responseData.message || "Registration successful",
      email: responseData.email,
      email_sent: responseData.email_sent,
      consents_recorded: responseData.consents_recorded,
    };
  } catch (error: unknown) {
    console.error("Registration Error:", error);
    const apiError = error as {
      response?: { status: number; data?: { error?: string; detail?: string; details?: unknown } };
      request?: unknown;
    };

    if (apiError.response) {
      return {
        status: apiError.response.status,
        error:
          apiError.response.data?.error || apiError.response.data?.detail || "Registration failed",
        details: apiError.response.data?.details,
      };
    } else if (apiError.request) {
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
  } catch (error: unknown) {
    // Enhanced error logging for debugging
    console.error("Logout API call failed:", error);
    const apiError = error as { response?: { status: number; data?: unknown } };
    if (apiError.response) {
      console.error("Status:", apiError.response.status);
      console.error("Data:", apiError.response.data);
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
    console.log("fetchUser raw response:", response.data);

    // Backend returns: { status: 200, user: {...} }
    // We need to extract the user data from response.data.user
    const responseData = response.data as { user?: unknown } | unknown;
    const userData =
      (responseData && typeof responseData === "object" && "user" in responseData
        ? (responseData as { user?: unknown }).user
        : responseData) || responseData;

    return {
      user: userData,
      authenticated: true,
    };
  } catch (error: unknown) {
    console.error("Error fetching user:", error);
    return { user: null, authenticated: false };
  }
}

// Note: The response interceptor for token refreshing is already configured in api.ts
// We don't need to duplicate it here since we're using the same apiClient instance

// Export the API client for use in other files
export { apiClient };
