// src/config/api.ts
import axios from "axios";
import environment from "./environment";

type RequestConfig = {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  withCredentials?: boolean;
  [k: string]: unknown;
};

// Use environment configuration for automatic URL switching
const API_HOST = environment.baseUrl;
const API_BASE = `${API_HOST}/api`;

// In development, use proxy; in production, use full URL
const baseURL = environment.useProxy ? "/api" : API_BASE;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// ─── Add this interceptor *before* your existing ones ───
// It reads the access_token cookie and, if present, sets the Authorization header.
apiClient.interceptors.request.use((cfg) => {
  // More robust cookie extraction for mobile compatibility
  const getCookieValue = (name: string): string | null => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [cookieName, ...cookieValueParts] = cookie.trim().split("=");
      if (cookieName === name) {
        return cookieValueParts.join("="); // Handle values with = signs
      }
    }
    return null;
  };

  // Try access_token first, then mobile fallback
  let token = getCookieValue("access_token");
  if (!token) {
    token = getCookieValue("mobile_access_token");
    if (token) {
      console.log("Using mobile_access_token fallback");
    }
  }

  if (token) {
    cfg.headers = {
      ...cfg.headers,
      Authorization: `Bearer ${token}`,
    };
  } else {
    // No JWT token found - this is normal when using Django session auth
    console.log("🔐 No JWT token found - using Django session authentication");
  }

  // Try to get CSRF token if available
  const csrfToken = getCookieValue("csrftoken");
  if (csrfToken) {
    cfg.headers = {
      ...cfg.headers,
      "X-CSRFToken": csrfToken,
    };
    console.log("✅ CSRF token found and added to headers");
  } else {
    console.warn("⚠️ No CSRF token found in cookies");
  }

  // Add debug logging for authentication method
  if (!token) {
    console.log("🔐 Using Django session authentication (no JWT token needed)");
    console.log(
      "🔍 Available cookies:",
      Object.keys(
        document.cookie.split(";").reduce((acc: Record<string, boolean>, cookie) => {
          const [name] = cookie.trim().split("=");
          acc[name] = true;
          return acc;
        }, {}),
      ),
    );
  } else {
    console.log("✅ JWT token found:", `${token.substring(0, 20)}...`);
  }

  // then continue to your existing logging
  console.log(`→ ${cfg.method?.toUpperCase()} ${cfg.baseURL}${cfg.url}`);
  return cfg;
});

// remove the old standalone logging interceptor if present
// apiClient.interceptors.request.clear();

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API Error", err.response?.status, err.response?.data);
    return Promise.reject(err);
  },
);

const formatEndpoint = (ep: string): string => {
  const clean = ep.replace(/^\/+/, "");
  if (clean.includes("?")) {
    const [path, query] = clean.split("?");
    const p = path.endsWith("/") ? path : `${path}/`;
    return `/${p}?${query}`;
  }
  return `/${clean.endsWith("/") ? clean : `${clean}/`}`;
};

export const apiGet = <T = unknown>(endpoint: string, config?: RequestConfig) =>
  apiClient.get<T>(formatEndpoint(endpoint), config);

export const apiPost = <T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig) =>
  apiClient.post<T>(formatEndpoint(endpoint), data, config);

export const apiPut = <T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig) =>
  apiClient.put<T>(formatEndpoint(endpoint), data, config);

export const apiDelete = <T = unknown>(endpoint: string, config?: RequestConfig) =>
  apiClient.delete<T>(formatEndpoint(endpoint), config);

export const apiFormPost = <T = unknown>(
  endpoint: string,
  formData: FormData,
  config?: RequestConfig,
) =>
  apiClient.post<T>(formatEndpoint(endpoint), formData, {
    ...config,
    headers: { ...config?.headers, "Content-Type": "multipart/form-data" },
  });

export const apiFormPut = <T = unknown>(
  endpoint: string,
  formData: FormData,
  config?: RequestConfig,
) =>
  apiClient.put<T>(formatEndpoint(endpoint), formData, {
    ...config,
    headers: { ...config?.headers, "Content-Type": "multipart/form-data" },
  });

export const apiFormPatch = <T = unknown>(
  endpoint: string,
  formData: FormData,
  config?: RequestConfig,
) =>
  apiClient.patch<T>(formatEndpoint(endpoint), formData, {
    ...config,
    headers: { ...config?.headers, "Content-Type": "multipart/form-data" },
  });

const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  formPost: apiFormPost,
  formPut: apiFormPut,
  formPatch: apiFormPatch,

  auth: {
    login: (d: unknown) => apiPost("users/login", d),
    register: (d: unknown) => apiPost("users/register", d),
    logout: () => apiPost("users/logout"),
    refreshToken: () => apiPost("users/refresh"),
    getUser: () => apiGet("users/get_user"),
    updateProfile: (d: unknown) => apiPut("users/profile", d),
    getPublicProfile: (username: string) => apiGet(`users/profiles/${username}`),
    searchUsers: (q: string) => apiGet(`users/search`, { params: { q } }),
    verifyEmail: (d: unknown) => apiPost("users/verify-email", d),
    resendVerification: () => apiPost("users/resend-verification"),
    requestPasswordReset: (email: string) => apiPost("users/password-reset/request", { email }),
    confirmPasswordReset: (token: string, newPassword: string) =>
      apiPost("users/password-reset/confirm", { token, new_password: newPassword }),
    validateResetToken: (token: string) =>
      apiGet("users/password-reset/validate", { params: { token } }),
  },

  listings: {
    buy: (p?: Record<string, unknown>) =>
      apiGet<{
        count: number;
        next: string | null;
        previous: string | null;
        results: unknown[];
        search_event_id?: number;
      }>("listings/buy", { params: p }).then((res) => {
        const d = res.data;
        return {
          results: Array.isArray(d.results) ? d.results : Array.isArray(d) ? d : [],
          count: d.count || (Array.isArray(d) ? d.length : 0),
          next: d.next,
          previous: d.previous,
          search_event_id: d.search_event_id,
        };
      }),

    rent: (p?: Record<string, unknown>) =>
      apiGet<{
        count: number;
        next: string | null;
        previous: string | null;
        results: unknown[];
        search_event_id?: number;
      }>("listings/rent", { params: p }).then((res) => {
        const d = res.data;
        return {
          results: Array.isArray(d.results) ? d.results : Array.isArray(d) ? d : [],
          count: d.count || (Array.isArray(d) ? d.length : 0),
          next: d.next,
          previous: d.previous,
          search_event_id: d.search_event_id,
        };
      }),

    search: (p?: Record<string, unknown>) =>
      apiGet<{
        count: number;
        next: string | null;
        previous: string | null;
        results: unknown[];
        search_event_id?: number;
      }>("listings/search", { params: p }).then((res) => {
        const d = res.data;
        return {
          results: Array.isArray(d.results) ? d.results : Array.isArray(d) ? d : [],
          count: d.count || (Array.isArray(d) ? d.length : 0),
          next: d.next,
          previous: d.previous,
          search_event_id: d.search_event_id,
        };
      }),
  },

  properties: {
    featured: (p?: { page?: number; page_size?: number }) =>
      apiGet<{ count: number; next: string | null; previous: string | null; results: unknown[] }>(
        "properties/featured",
        { params: p },
      ).then((res) => {
        const d = res.data;
        return {
          results: Array.isArray(d.results) ? d.results : [],
          count: d.count || 0,
          next: d.next,
          previous: d.previous,
        };
      }),

    leaderboard: (p?: { limit?: number }) =>
      apiGet<{ results: Array<{ id: number; view_count: number; _type: 'property' | 'project' }> }>(
        "properties/leaderboard",
        { params: p },
      ).then((res) => {
        const d = res.data;
        return {
          results: Array.isArray(d.results) ? d.results : [],
        };
      }),

    getUserProp: (u: string, pid: number) => apiGet(`properties/${u}/property/${pid}`),
    getUserProperty: (u: string, pid: number) => apiGet(`properties/${u}/property/${pid}`),
    getUserProps: (u: string) => apiGet(`properties/${u}/properties`),

    // Bulk reorder API - reorders all images and sets primary in one call
    reorderImages: (u: string, pid: number, imageIds: number[], primaryIndex: number = 0) => {
      const formData = new FormData();
      formData.append("reorder_images", "true");
      formData.append("primary_image_index", primaryIndex.toString());
      imageIds.forEach((id) => {
        formData.append("image_order[]", id.toString());
      });
      return apiFormPut(`properties/${u}/property/${pid}/edit`, formData);
    },

    deleteImage: (u: string, pid: number, imageId: number) =>
      apiDelete(`properties/${u}/property/${pid}/image/${imageId}/delete`),

    deleteDocument: (u: string, pid: number, documentId: number) =>
      apiDelete(`properties/${u}/property/${pid}/document/${documentId}/delete`),

    updateDocument: (
      u: string,
      pid: number,
      docId: number,
      data: {
        document_type?: string;
        title?: string;
        description?: string;
      },
    ) =>
      apiClient.patch(
        formatEndpoint(`properties/${u}/property/${pid}/document/${docId}/update`),
        data,
      ),

    // Step-specific PATCH updates
    updatePropertyType: (u: string, pid: number, propertyType: string) => {
      const formData = new FormData();
      formData.append("propertyType", propertyType);
      return apiFormPatch(`properties/${u}/property/${pid}/edit`, formData);
    },

    updatePropertyDetails: (u: string, pid: number, details: Record<string, unknown>) => {
      const formData = new FormData();
      Object.entries(details).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value.toString());
        }
      });
      return apiFormPatch(`properties/${u}/property/${pid}/edit`, formData);
    },

    updateContactInfo: (
      u: string,
      pid: number,
      contactInfo: { contactEmail?: string; contactPhone?: string },
    ) => {
      const formData = new FormData();
      if (contactInfo.contactEmail) formData.append("contactEmail", contactInfo.contactEmail);
      if (contactInfo.contactPhone) formData.append("contactPhone", contactInfo.contactPhone);
      return apiFormPatch(`properties/${u}/property/${pid}/edit`, formData);
    },

    myFavorites: () =>
      apiGet("properties/my-favourites").then((res) => {
        const d = res.data as unknown;
        if (Array.isArray(d)) return d;
        if (
          d &&
          typeof d === "object" &&
          "results" in d &&
          Array.isArray((d as { results: unknown }).results)
        ) {
          return (d as { results: unknown[] }).results;
        }
        return [];
      }),
    toggleFavorite: (pid: number) => apiPost(`properties/${pid}/favourite`),
  },

  propertyUnits: {
    list: (propertyId?: number, includeUnpublished = false) => {
      let url = propertyId
        ? `properties/property-units/?property=${propertyId}`
        : `properties/property-units/`;
      
      // Add parameter to include unpublished units (for owner/editing view)
      if (includeUnpublished) {
        url += propertyId ? '&include_unpublished=true' : '?include_unpublished=true';
      }
      
      return apiGet(url);
    },
    get: (id: number) => apiGet(`properties/property-units/${id}/`),
    create: (data: unknown) => apiPost(`properties/property-units/`, data),
    update: (id: number, data: unknown) => apiPut(`properties/property-units/${id}/`, data),
    delete: (id: number) => apiDelete(`properties/property-units/${id}/`),
  },



  favourites: {
    list: (p?: Record<string, unknown>) =>
      apiGet("properties/my-favourites", { params: p }).then((res) => {
        const d = res.data as unknown;
        const data = d as {
          results?: unknown[];
          count?: number;
          next?: string | null;
          previous?: string | null;
        };
        return {
          results: Array.isArray(data.results) ? data.results : Array.isArray(d) ? d : [],
          count: data.count || (Array.isArray(d) ? d.length : 0),
          next: data.next,
          previous: data.previous,
        };
      }),
    toggle: (data: { property_id?: number; project_id?: number }) => {
      // Backend expects: properties/<id>/favourite/ for properties
      // or properties/0/favourite/ with project_id in body for projects
      if (data.property_id) {
        return apiPost(`properties/${data.property_id}/favourite`, {});
      } else if (data.project_id) {
        return apiPost("properties/0/favourite", { project_id: data.project_id });
      } else {
        throw new Error("Must provide either property_id or project_id");
      }
    },
  },

  analytics: {
    projectAnalytics: {
      public: (projectId: number, p?: Record<string, unknown>) =>
        apiGet(`analytics/project/${projectId}`, { params: p }),
      myProjects: (projectId: number, p?: Record<string, unknown>) =>
        apiGet(`analytics/my-projects/${projectId}`, { params: p }),
    },
    myListingsSummary: (days?: number) =>
      apiGet(`analytics/my-listings/summary/`, { params: days ? { days } : {} }),
  },

  chat: {
    createThread: (data: {
      recipient_id: number;
      property_id?: number;
      project_id?: number;
      organization_id?: number;
    }) => apiPost("chat/threads", data),
    getThreads: () => apiGet("chat/threads"),
    getMessages: (threadId: number, p?: Record<string, unknown>) =>
      apiGet(`chat/threads/${threadId}/messages`, { params: p }),
    sendMessage: (threadId: number, data: { content: string }) =>
      apiPost(`chat/threads/${threadId}/messages`, data),
    markRead: (threadId: number) => apiPost(`chat/threads/${threadId}/mark_read`),
  },

  admin: {
    getProperties: () => apiGet("properties/api_admin/dashboard/properties"),
    createProperty: (fd: FormData) => apiFormPost("properties/api_admin/create-property", fd),
    getUserProps: () => apiGet("properties/api_admin/properties"),
  },

  connections: {
    // Send a connection request
    sendRequest: (toUserId: number) => apiPost("users/connections", { to_user_id: toUserId }),

    // Get all connections for current user
    getMyConnections: () => apiGet("users/connections/my_connections"),

    // Get pending connection requests sent TO me
    getPendingRequests: () => apiGet("users/connections/pending_requests"),

    // Get pending connection requests sent BY me
    getPendingSentRequests: () => apiGet("users/connections/pending_sent_requests"),

    // Accept a connection request
    acceptRequest: (connectionId: string) => apiPost(`users/connections/${connectionId}/accept`),

    // Reject a connection request
    rejectRequest: (connectionId: string) => apiPost(`users/connections/${connectionId}/reject`),

    // Disconnect from a user
    disconnect: (connectionId: string) => apiDelete(`users/connections/${connectionId}/disconnect`),

    // Get connection status with another user
    getStatus: (userId: number) => apiGet(`users/connection-status/${userId}`),
  },

  reviews: {
    // Get all review categories
    getCategories: () => apiGet("reviews/categories"),

    // Get reviews for a specific user
    getUserReviews: (userId: number, params?: Record<string, unknown>) =>
      apiGet(`reviews/users/${userId}`, { params }),

    // Get review statistics for a user
    getUserStats: (userId: number) => apiGet(`reviews/users/${userId}/stats`),

    // Check if current user can review another user
    canReviewUser: (userId: number) => apiGet(`reviews/users/${userId}/can-review`),

    // Create a new review
    createReview: (data: unknown) => apiPost("reviews", data),

    // Get a specific review
    getReview: (reviewId: number) => apiGet(`reviews/${reviewId}`),

    // Update a review (only reviewer can do this)
    updateReview: (reviewId: number, data: unknown) => apiPut(`reviews/${reviewId}`, data),

    // Delete a review (only reviewer can do this)
    deleteReview: (reviewId: number) => apiDelete(`reviews/${reviewId}`),

    // Mark a review as helpful/unhelpful
    toggleHelpful: (reviewId: number, isHelpful: boolean) =>
      apiPost(`reviews/${reviewId}/helpful`, { is_helpful: isHelpful }),

    // Remove helpful vote
    removeHelpful: (reviewId: number) => apiDelete(`reviews/${reviewId}/helpful/remove`),

    // Report a review
    reportReview: (reviewId: number, reason: string, description?: string) =>
      apiPost(`reviews/${reviewId}/report`, { reason, description }),

    // Get review dashboard data for current user
    getDashboard: () => apiGet("reviews/dashboard"),

    getUserOverallRating: (userId: number) => apiGet(`reviews/users/${userId}/overall_rating`),
  },

  instagram: {
    // Post a property to Instagram
    postProperty: (propertyId: number, configId?: number) =>
      apiPost(`instagram/post/${propertyId}/`, configId ? { config_id: configId } : {}),

    // Get Instagram posts for a specific property
    getPropertyPosts: (propertyId: number) => apiGet(`instagram/property/${propertyId}/posts/`),

    // Get Instagram posting queue status (admin only)
    getQueueStatus: () => apiGet("instagram/queue/status/"),

    // Retry a failed Instagram post (admin only)
    retryPost: (postId: number) => apiPost(`instagram/posts/${postId}/retry/`),
  },
};

export default api;
