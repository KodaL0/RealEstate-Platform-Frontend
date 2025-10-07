// src/config/api.ts
import axios from 'axios';
import environment from './environment';

type RequestConfig = {
  headers?: Record<string,string>;
  params?: Record<string,any>;
  withCredentials?: boolean;
  [k:string]: any;
};

// Use environment configuration for automatic URL switching
const API_HOST = environment.baseUrl;
const API_BASE = `${API_HOST}/api`;

// In development, use proxy; in production, use full URL
const baseURL = environment.useProxy ? '/api' : API_BASE;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Accept':           'application/json',
    'Content-Type':     'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// ─── Add this interceptor *before* your existing ones ───
// It reads the access_token cookie and, if present, sets the Authorization header.
apiClient.interceptors.request.use(cfg => {
  // More robust cookie extraction for mobile compatibility
  const getCookieValue = (name: string): string | null => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [cookieName, ...cookieValueParts] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValueParts.join('='); // Handle values with = signs
      }
    }
    return null;
  };

  // Try access_token first, then mobile fallback
  let token = getCookieValue('access_token');
  if (!token) {
    token = getCookieValue('mobile_access_token');
    if (token) {
      console.log('Using mobile_access_token fallback');
    }
  }

  if (token) {
    cfg.headers = {
      ...cfg.headers,
      Authorization: `Bearer ${token}`,
    };
  } else {
    // No JWT token found - this is normal when using Django session auth
    console.log('🔐 No JWT token found - using Django session authentication');
  }

  // Try to get CSRF token if available
  const csrfToken = getCookieValue('csrftoken');
  if (csrfToken) {
    cfg.headers = {
      ...cfg.headers,
      'X-CSRFToken': csrfToken,
    };
    console.log('✅ CSRF token found and added to headers');
  } else {
    console.warn('⚠️ No CSRF token found in cookies');
  }

  // Add debug logging for authentication method
  if (!token) {
    console.log("🔐 Using Django session authentication (no JWT token needed)");
    console.log("🔍 Available cookies:", Object.keys(document.cookie.split(';').reduce((acc: Record<string, boolean>, cookie) => {
      const [name] = cookie.trim().split('=');
      acc[name] = true;
      return acc;
    }, {})));
  } else {
    console.log("✅ JWT token found:", token.substring(0, 20) + "...");
  }

  // then continue to your existing logging
  console.log(`→ ${cfg.method?.toUpperCase()} ${cfg.baseURL}${cfg.url}`);
  return cfg;
});

// remove the old standalone logging interceptor if present
// apiClient.interceptors.request.clear();

apiClient.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error', err.response?.status, err.response?.data);
    return Promise.reject(err);
  }
);

const formatEndpoint = (ep: string): string => {
  let clean = ep.replace(/^\/+/, '');
  if (clean.includes('?')) {
    const [path, query] = clean.split('?');
    const p = path.endsWith('/') ? path : path + '/';
    return `/${p}?${query}`;
  }
  return '/' + (clean.endsWith('/') ? clean : clean + '/');
};

export const apiGet = <T = any>(endpoint: string, config?: RequestConfig) =>
  apiClient.get<T>(formatEndpoint(endpoint), config);

export const apiPost = <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
  apiClient.post<T>(formatEndpoint(endpoint), data, config);

export const apiPut = <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
  apiClient.put<T>(formatEndpoint(endpoint), data, config);

export const apiDelete = <T = any>(endpoint: string, config?: RequestConfig) =>
  apiClient.delete<T>(formatEndpoint(endpoint), config);

export const apiFormPost = <T = any>(endpoint: string, formData: FormData, config?: RequestConfig) =>
  apiClient.post<T>(formatEndpoint(endpoint), formData, {
    ...config,
    headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' },
  });

export const apiFormPut = <T = any>(endpoint: string, formData: FormData, config?: RequestConfig) =>
  apiClient.put<T>(formatEndpoint(endpoint), formData, {
    ...config,
    headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' },
  });

export const apiFormPatch = <T = any>(endpoint: string, formData: FormData, config?: RequestConfig) =>
  apiClient.patch<T>(formatEndpoint(endpoint), formData, {
    ...config,
    headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' },
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
    login:           (d: any) => apiPost('users/login', d),
    register:        (d: any) => apiPost('users/register', d),
    logout:          ()        => apiPost('users/logout'),
    refreshToken:    ()        => apiPost('users/refresh'),
    getUser:         ()        => apiGet('users/get_user'),
    updateProfile:   (d: any)  => apiPut('users/profile', d),
    getPublicProfile: (username: string) => apiGet(`users/profiles/${username}`),
    searchUsers:     (q: string) => apiGet(`users/search`, { params: { q } }),
    verifyEmail:     (d: any) => apiPost('users/verify-email', d),
    resendVerification: ()     => apiPost('users/resend-verification'),
  },

  properties: {
    list: (p?: any) =>
      apiGet<{ results?: any[] }>('properties', { params: p })
        .then(res => {
          const d = res.data;
          if (Array.isArray(d)) return d;
          if (Array.isArray(d.results)) return d.results;
          return [];
        }),

    getById:        (id: number) => apiGet(`properties/${id}`),
    create:         (fd: FormData) => apiFormPost('properties/create_property', fd),
    update:         (id: number, fd: FormData) => apiFormPut(`properties/${id}`, fd),
    delete:         (id: number) => apiDelete(`properties/${id}`),
    myProperties:   () => 
      apiGet('properties/my-properties')
        .then(res => {
          const d = res.data;
          if (Array.isArray(d)) return d;
          if (Array.isArray(d.results)) return d.results;
          return [];
        }),

    buy: (p?: any) =>
      apiGet<{ count: number, next: string | null, previous: string | null, results: any[] }>('properties/buy', { params: p })
        .then(res => {
          const d = res.data;
          // Return both the results and pagination metadata
          return {
            results: Array.isArray(d.results) ? d.results : Array.isArray(d) ? d : [],
            count: d.count || (Array.isArray(d) ? d.length : 0),
            next: d.next,
            previous: d.previous
          };
        }),

    rent: (p?: any) =>
      apiGet<{ count: number, next: string | null, previous: string | null, results: any[] }>('properties/rent', { params: p })
        .then(res => {
          const d = res.data;
          // Return both the results and pagination metadata
          return {
            results: Array.isArray(d.results) ? d.results : [],
            count: d.count || 0,
            next: d.next,
            previous: d.previous
          };
        }),

    featured: (p?: { page?: number, page_size?: number }) =>
      apiGet<{ count: number, next: string | null, previous: string | null, results: any[] }>('properties/featured', { params: p })
        .then(res => {
          const d = res.data;
          return {
            results: Array.isArray(d.results) ? d.results : [],
            count: d.count || 0,
            next: d.next,
            previous: d.previous
          };
        }),

    getUserProp:    (u: string, pid: number) => apiGet(`properties/${u}/property/${pid}`),
    getUserProperty: (u: string, pid: number) => apiGet(`properties/${u}/property/${pid}`),
    getUserProps:   (u: string) => apiGet(`properties/${u}/properties`),
    
    // Bulk reorder API - reorders all images and sets primary in one call
    reorderImages: (u: string, pid: number, imageIds: number[], primaryIndex: number = 0) => {
      const formData = new FormData();
      formData.append('reorder_images', 'true');
      formData.append('primary_image_index', primaryIndex.toString());
      imageIds.forEach(id => formData.append('image_order[]', id.toString()));
      return apiFormPut(`properties/${u}/property/${pid}/edit`, formData);
    },
    
    deleteImage: (u: string, pid: number, imageId: number) =>
      apiDelete(`properties/${u}/property/${pid}/image/${imageId}/delete`),
    
    deleteDocument: (u: string, pid: number, documentId: number) =>
      apiDelete(`properties/${u}/property/${pid}/document/${documentId}/delete`),

    // Step-specific PATCH updates
    updatePropertyType: (u: string, pid: number, propertyType: string) => {
      const formData = new FormData();
      formData.append('propertyType', propertyType);
      return apiFormPatch(`properties/${u}/property/${pid}/edit`, formData);
    },

    updatePropertyDetails: (u: string, pid: number, details: Record<string, any>) => {
      const formData = new FormData();
      Object.entries(details).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });
      return apiFormPatch(`properties/${u}/property/${pid}/edit`, formData);
    },

    updateContactInfo: (u: string, pid: number, contactInfo: { contactEmail?: string; contactPhone?: string }) => {
      const formData = new FormData();
      if (contactInfo.contactEmail) formData.append('contactEmail', contactInfo.contactEmail);
      if (contactInfo.contactPhone) formData.append('contactPhone', contactInfo.contactPhone);
      return apiFormPatch(`properties/${u}/property/${pid}/edit`, formData);
    },

    myFavorites:    () => 
      apiGet('properties/my-favourites')
        .then(res => {
          const d = res.data;
          if (Array.isArray(d)) return d;
          if (Array.isArray(d.results)) return d.results;
          return [];
        }),
    toggleFavorite: (pid: number) => apiPost(`properties/${pid}/favourite`),
  },

  admin: {
    getProperties: ()        => apiGet('properties/api_admin/dashboard/properties'),
    createProperty: (fd: FormData) => apiFormPost('properties/api_admin/create-property', fd),
    getUserProps:  ()        => apiGet('properties/api_admin/properties'),
  },

  connections: {
    // Send a connection request
    sendRequest: (toUserId: number) =>
      apiPost('users/connections', { to_user_id: toUserId }),
    
    // Get all connections for current user
    getMyConnections: () =>
      apiGet('users/connections/my_connections'),
    
    // Get pending connection requests sent TO me
    getPendingRequests: () =>
      apiGet('users/connections/pending_requests'),
    
    // Get pending connection requests sent BY me
    getPendingSentRequests: () =>
      apiGet('users/connections/pending_sent_requests'),
    
    // Accept a connection request
    acceptRequest: (connectionId: string) =>
      apiPost(`users/connections/${connectionId}/accept`),
    
    // Reject a connection request
    rejectRequest: (connectionId: string) =>
      apiPost(`users/connections/${connectionId}/reject`),
    
    // Disconnect from a user
    disconnect: (connectionId: string) =>
      apiDelete(`users/connections/${connectionId}/disconnect`),
    
    // Get connection status with another user
    getStatus: (userId: number) =>
      apiGet(`users/connection-status/${userId}`),
  },

  reviews: {
    // Get all review categories
    getCategories: () =>
      apiGet('reviews/categories'),
    
    // Get reviews for a specific user
    getUserReviews: (userId: number, params?: any) =>
      apiGet(`reviews/users/${userId}`, { params }),
    
    // Get review statistics for a user
    getUserStats: (userId: number) =>
      apiGet(`reviews/users/${userId}/stats`),
    
    // Check if current user can review another user
    canReviewUser: (userId: number) =>
      apiGet(`reviews/users/${userId}/can-review`),
    
    // Create a new review
    createReview: (data: any) =>
      apiPost('reviews', data),
    
    // Get a specific review
    getReview: (reviewId: number) =>
      apiGet(`reviews/${reviewId}`),
    
    // Update a review (only reviewer can do this)
    updateReview: (reviewId: number, data: any) =>
      apiPut(`reviews/${reviewId}`, data),
    
    // Delete a review (only reviewer can do this)
    deleteReview: (reviewId: number) =>
      apiDelete(`reviews/${reviewId}`),
    
    // Mark a review as helpful/unhelpful
    toggleHelpful: (reviewId: number, isHelpful: boolean) =>
      apiPost(`reviews/${reviewId}/helpful`, { is_helpful: isHelpful }),
    
    // Remove helpful vote
    removeHelpful: (reviewId: number) =>
      apiDelete(`reviews/${reviewId}/helpful/remove`),
    
    // Report a review
    reportReview: (reviewId: number, reason: string, description?: string) =>
      apiPost(`reviews/${reviewId}/report`, { reason, description }),
    
    // Get review dashboard data for current user
    getDashboard: () =>
      apiGet('reviews/dashboard'),

    getUserOverallRating: (userId: number) => apiGet(`reviews/users/${userId}/overall_rating`),
  },

  instagram: {
    // Post a property to Instagram
    postProperty: (propertyId: number, configId?: number) =>
      apiPost(`social_int/post/${propertyId}/`, configId ? { config_id: configId } : {}),
    
    // Get Instagram posts for a specific property
    getPropertyPosts: (propertyId: number) =>
      apiGet(`social_int/property/${propertyId}/posts/`),
    
    // Get Instagram posting queue status (admin only)
    getQueueStatus: () =>
      apiGet('social_int/queue/status/'),
    
    // Retry a failed Instagram post (admin only)
    retryPost: (postId: number) =>
      apiPost(`social_int/posts/${postId}/retry/`),
  },
};

export default api;
