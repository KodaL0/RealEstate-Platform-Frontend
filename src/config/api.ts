// src/config/api.ts
import axios from 'axios';

type RequestConfig = {
  headers?: Record<string,string>;
  params?: Record<string,any>;
  withCredentials?: boolean;
  [k:string]: any;
};

const API_HOST = 'https://api.propertpro.com';
const API_BASE = `${API_HOST}/api`;

// Use the real URL in prod, proxy in dev
const baseURL = import.meta.env.PROD
  ? API_BASE
  : '/api';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Accept':           'application/json',
    'Content-Type':     'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// ──────── 2) Simple formatter ────────
const formatEndpoint = (ep: string): string => {
  let clean = ep.replace(/^\/+/, '');
  if (clean.includes('?')) {
    const [path, query] = clean.split('?');
    const p = path.endsWith('/') ? path : path + '/';
    return `/${p}?${query}`;
  }
  return '/' + (clean.endsWith('/') ? clean : clean + '/');
};

// ──────── 3) Typed request wrappers ────────
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

// ──────── 4) Logging (optional) ────────
apiClient.interceptors.request.use(cfg => {
  if (cfg.headers) {
    delete cfg.headers['If-None-Match'];
    cfg.headers['Cache-Control'] = 'no-cache';
  }
  console.log(`→ ${cfg.method?.toUpperCase()} ${cfg.baseURL}${cfg.url}`);
  return cfg;
});

apiClient.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error', err.response?.status, err.response?.data);
    return Promise.reject(err);
  }
);

// ──────── 5) Export organized endpoints ────────
const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  formPost: apiFormPost,
  formPut: apiFormPut,

  auth: {
    login:           (d: any) => apiPost('users/login', d),
    register:        (d: any) => apiPost('users/register', d),
    logout:          ()        => apiPost('users/logout'),
    refreshToken:    ()        => apiPost('users/refresh'),
    getUser:         ()        => apiGet('users/get_user'),
    updateProfile:   (d: any)  => apiPut('users/profile', d),
    socialVerify:    (d: any)  => apiPost('users/social-login-verify', d),
    complete:        (d: any)  => apiPost('users/auth-complete', d),
  },

  properties: {
    list:           (p?: any) => apiGet('properties', { params: p }),
    getById:        (id: number) => apiGet(`properties/${id}`),
    create:         (fd: FormData) => apiFormPost('properties/create_property', fd),
    update:         (id: number, fd: FormData) => apiFormPut(`properties/${id}`, fd),
    delete:         (id: number) => apiDelete(`properties/${id}`),
    myProperties:   () => apiGet('properties/my-properties'),
    buy:            (p?: any) => apiGet('properties/buy', { params: p }),
    rent:           (p?: any) => apiGet('properties/rent', { params: p }),
    featured:       ()        => apiGet('properties/featured'),
    getUserProp:    (u: string, pid: number) => apiGet(`properties/${u}/property/${pid}`),
    getUserProps:   (u: string) => apiGet(`properties/${u}/properties`),
    myFavorites:    ()        => apiGet('properties/my-favourites'),
    toggleFavorite: (pid: number) => apiPost(`properties/${pid}/favourite`),
  },

  admin: {
    getProperties: ()        => apiGet('properties/api_admin/dashboard/properties'),
    createProperty:(fd: FormData) => apiFormPost('properties/api_admin/create-property', fd),
    getUserProps:  ()        => apiGet('properties/api_admin/properties'),
  },
};

export default api;
