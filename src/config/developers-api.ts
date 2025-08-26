// src/config/developers-api.ts
import axios from 'axios';
import environment from './environment';

// ────────────────────────────────────────────────────────────────────────────
// Cache Management
// ────────────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStore {
  units: CacheEntry<any[]> | null;
  assets: CacheEntry<any[]> | null;
  projects: CacheEntry<any[]> | null;
  projectAssets: CacheEntry<any[]> | null;
}

class DeveloperApiCache {
  private cache: CacheStore = {
    units: null,
    assets: null,
    projects: null,
    projectAssets: null,
  };

  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private backgroundRefreshInterval: NodeJS.Timeout | null = null;

  private isCacheValid(entry: CacheEntry<any> | null): boolean {
    if (!entry) return false;
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  get<T>(key: keyof CacheStore): T | null {
    const entry = this.cache[key];
    if (this.isCacheValid(entry)) {
      return entry.data as T;
    }
    return null;
  }

  set<T>(key: keyof CacheStore, data: T): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl: this.TTL,
    };
  }

  updateItem<T extends { id: number }>(key: keyof CacheStore, updatedItem: T): void {
    const entry = this.cache[key];
    if (entry && Array.isArray(entry.data)) {
      const index = entry.data.findIndex((item: any) => item.id === updatedItem.id);
      if (index !== -1) {
        entry.data[index] = updatedItem;
        entry.timestamp = Date.now();
      }
    }
  }

  addItem<T>(key: keyof CacheStore, newItem: T): void {
    const entry = this.cache[key];
    if (entry && Array.isArray(entry.data)) {
      entry.data.unshift(newItem);
      entry.timestamp = Date.now();
    }
  }

  removeItem(key: keyof CacheStore, itemId: number): void {
    const entry = this.cache[key];
    if (entry && Array.isArray(entry.data)) {
      entry.data = entry.data.filter((item: any) => item.id !== itemId);
      entry.timestamp = Date.now();
    }
  }

  invalidate(key: keyof CacheStore): void {
    this.cache[key] = null;
  }

  clear(): void {
    this.cache = {
      units: null,
      assets: null,
      projects: null,
      projectAssets: null,
    };
  }

  private getPendingRequest(key: string): Promise<any> | null {
    return this.pendingRequests.get(key) || null;
  }

  private setPendingRequest(key: string, promise: Promise<any>): void {
    this.pendingRequests.set(key, promise);
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  async getCachedData<T>(
    key: keyof CacheStore,
    apiCall: () => Promise<T>,
    requestKey?: string
  ): Promise<T> {
    const cachedData = this.get<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }

    const pendingKey = requestKey || key;
    const pendingRequest = this.getPendingRequest(pendingKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    const apiPromise = apiCall().then((data) => {
      this.set(key, data);
      return data;
    });

    this.setPendingRequest(pendingKey, apiPromise);
    return apiPromise;
  }

  async bulkFetch(api: any): Promise<void> {
    try {
      const [units, assets, projects, projectAssets] = await Promise.all([
        api.units.list(),
        api.assets.list(),
        api.projects.list(),
        api.projectAssets.list(),
      ]);

      this.set('units', units);
      this.set('assets', assets);
      this.set('projects', projects);
      this.set('projectAssets', projectAssets);

      console.log('Developer API: Bulk data cached successfully');
    } catch (error) {
      console.error('Developer API: Failed to bulk fetch data:', error);
    }
  }

  startBackgroundRefresh(api: any, intervalMinutes: number = 4): void {
    if (this.backgroundRefreshInterval) {
      clearInterval(this.backgroundRefreshInterval);
    }

    this.backgroundRefreshInterval = setInterval(async () => {
      try {
        await this.bulkFetch(api);
      } catch (error) {
        console.error('Developer API: Background refresh failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  stopBackgroundRefresh(): void {
    if (this.backgroundRefreshInterval) {
      clearInterval(this.backgroundRefreshInterval);
      this.backgroundRefreshInterval = null;
    }
  }

  getCacheStatus(): Record<string, { hasData: boolean; age: number; isValid: boolean }> {
    const now = Date.now();
    const status: Record<string, any> = {};

    Object.entries(this.cache).forEach(([key, entry]) => {
      if (entry) {
        const age = now - entry.timestamp;
        status[key] = {
          hasData: true,
          age: Math.round(age / 1000),
          isValid: this.isCacheValid(entry),
        };
      } else {
        status[key] = {
          hasData: false,
          age: 0,
          isValid: false,
        };
      }
    });

    return status;
  }
}

// Create singleton cache instance
const developerApiCache = new DeveloperApiCache();

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Setup
// ────────────────────────────────────────────────────────────────────────────

// Create a dedicated Axios client for the Developer Portal that ALWAYS targets the API domain
// This avoids accidental same-origin calls to www.propertpro.com, which would miss JWT cookies.
const devApiClient = axios.create({
  baseURL: `${environment.baseUrl}/api`,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Attach Authorization (from cookies) and CSRF headers centrally
devApiClient.interceptors.request.use((cfg) => {
  const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [cookieName, ...cookieValueParts] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValueParts.join('=');
      }
    }
    return null;
  };

  let token = getCookieValue('access_token');
  if (!token) token = getCookieValue('mobile_access_token');
  if (token) {
    cfg.headers = { ...cfg.headers, Authorization: `Bearer ${token}` } as any;
  }

  const csrfToken = getCookieValue('csrftoken');
  if (csrfToken) {
    cfg.headers = { ...cfg.headers, 'X-CSRFToken': csrfToken } as any;
  }

  return cfg;
});

// Helper wrappers bound to the devApiClient
function toPromise<T>(p: any): Promise<T> {
  return new Promise((resolve, reject) => {
    (p as any).then((r: any) => resolve((r?.data ?? r) as T)).catch(reject);
  });
}

const devApiGet = <T = any>(endpoint: string, config?: any): Promise<T> =>
  toPromise<T>(devApiClient.get<T>(endpoint, config));
const devApiPost = <T = any>(endpoint: string, data?: any, config?: any): Promise<T> =>
  toPromise<T>(devApiClient.post<T>(endpoint, data, config));
const devApiPut = <T = any>(endpoint: string, data?: any, config?: any): Promise<T> =>
  toPromise<T>(devApiClient.put<T>(endpoint, data, config));
const devApiDelete = <T = any>(endpoint: string, config?: any): Promise<void> =>
  toPromise<T>(devApiClient.delete<void>(endpoint, config));
const devApiFormPost = <T = any>(endpoint: string, data?: any, config?: any): Promise<T> =>
  toPromise<T>(devApiClient.post<T>(endpoint, data, { ...(config || {}), headers: { ...(config?.headers || {}), 'Content-Type': 'multipart/form-data' } }));
const devApiPatch = <T = any>(endpoint: string, data?: any, config?: any): Promise<T> =>
  toPromise<T>(devApiClient.patch<T>(endpoint, data, config));

// ────────────────────────────────────────────────────────────────────────────
// TypeScript Interfaces
// ────────────────────────────────────────────────────────────────────────────

export interface DeveloperOrganization {
  id: number;
  owner: number;
  name: string;
  description?: string;
  country: string;
  website?: string;
  email?: string;
  phone?: string;
  logo?: string;
  established?: number;
  created_at: string;
  updated_at: string;
}

export interface DeveloperMembership {
  id: number;
  user: number;
  organization: number;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  organization: number;
  name: string;
  description?: string;
  location: string;
  country: string;
  status: 'planning' | 'construction' | 'completed' | 'available';
  start_date?: string;
  completion_date?: string;
  total_units: number;
  available_units: number;
  price_min?: number;
  price_max?: number;
  currency: string;
  property_types: string[];
  amenities: string[];
  features: string[];
  metadata: Record<string, any>;
  main_image?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  assets?: ProjectAsset[];
  units?: Unit[];
}

export interface ProjectAsset {
  id: number;
  project: number;
  file: string;
  category: 'floor_plans' | 'brochures' | 'legal_documents' | 'photos' | 'videos' | 'presentations' | 'specifications' | 'contracts' | 'permits' | 'other';
  title?: string;
  description?: string;
  metadata: Record<string, any>;
  uploaded_at: string;
}

export interface Unit {
  id: number;
  project: number;
  code: string;
  block?: string;
  unit_type: 'studio' | 'apartment' | 'house';
  bedrooms: number;
  bathrooms?: number;
  area_internal?: number;
  area_veranda?: number;
  area_total?: number;
  floor?: string;
  view?: string;
  price?: number;
  currency: string;
  vat_included: boolean;
  status: 'available' | 'reserved' | 'sold';
  pool_type?: string;
  delivery_months?: number;
  price_min_furniture_package?: number;
  price_max_furniture_package?: number;
  external_ref?: string;
  created_at: string;
  updated_at: string;
  media?: UnitMedia[];
}

export interface UnitMedia {
  id: number;
  unit: number;
  image: string;
  is_primary: boolean;
  created_at: string;
}

export interface DeveloperAsset {
  id: number;
  project: number;
  asset_type: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  file: string;
  file_url?: string;
  original_filename: string;
  file_size: number;
  file_size_mb?: number;
  mime_type: string;
  title?: string;
  description?: string;
  document_category?: string;
  image_category?: string;
  video_category?: string;
  tags: string[];
  metadata: Record<string, any>;
  width?: number;
  height?: number;
  duration?: string;
  page_count?: number;
  is_public: boolean;
  is_featured: boolean;
  uploaded_at: string;
  updated_at: string;
  category_display?: string;
  thumbnail_url?: string;
}

export interface PricelistIngestionResult {
  created: number;
  updated: number;
  errors: Array<{ code?: string; error: string }>;
  total_units: number;
  available_units: number;
}

export interface FileStructure {
  organization: DeveloperOrganization;
  projects: Array<{
    project: Project;
    assets: DeveloperAsset[];
    statistics: AssetStatistics;
  }>;
}

export interface AssetStatistics {
  total_assets: number;
  by_type: Record<string, number>;
  by_category: Record<string, number>;
  total_size_mb: number;
  featured_count: number;
  public_count: number;
}

export interface AssetCategories {
  document?: Array<[string, string]>;
  image?: Array<[string, string]>;
  video?: Array<[string, string]>;
}

// ────────────────────────────────────────────────────────────────────────────
// API Response Types
// ────────────────────────────────────────────────────────────────────────────

export interface OrganizationResponse {
  organization: DeveloperOrganization | null;
}

export interface LogoUploadResponse {
  logo_url: string;
  message: string;
}

export interface BulkUploadResponse {
  created_assets: DeveloperAsset[];
  errors: Array<{ filename: string; errors?: any; error?: string }>;
  total_created: number;
  total_errors: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Base API Configuration
// ────────────────────────────────────────────────────────────────────────────

const DEV_API_BASE = '/dev/v1';

const formatDevEndpoint = (endpoint: string): string => {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${DEV_API_BASE}/${cleanEndpoint}${cleanEndpoint.endsWith('/') ? '' : '/'}`;
};

// ────────────────────────────────────────────────────────────────────────────
// Organizations API
// ────────────────────────────────────────────────────────────────────────────

export const organizationsApi = {
  // Get user's organization
  getMine: (): Promise<OrganizationResponse> =>
    devApiGet<OrganizationResponse>(formatDevEndpoint('orgs/mine')),

  // List organizations user belongs to
  list: (): Promise<DeveloperOrganization[]> =>
    devApiGet<DeveloperOrganization[]>(formatDevEndpoint('orgs')),

  // Get specific organization
  get: (id: number): Promise<DeveloperOrganization> =>
    devApiGet<DeveloperOrganization>(formatDevEndpoint(`orgs/${id}`)),

  // Create organization
  create: (data: Partial<DeveloperOrganization>): Promise<DeveloperOrganization> =>
    devApiPost<DeveloperOrganization>(formatDevEndpoint('orgs'), data),

  // Update organization
  update: (id: number, data: Partial<DeveloperOrganization>): Promise<DeveloperOrganization> =>
    devApiPut<DeveloperOrganization>(formatDevEndpoint(`orgs/${id}`), data),

  // Partial update organization
  patch: (id: number, data: Partial<DeveloperOrganization>): Promise<DeveloperOrganization> =>
    devApiPatch<DeveloperOrganization>(formatDevEndpoint(`orgs/${id}`), data),

  // Delete organization
  delete: (id: number): Promise<void> =>
    devApiDelete<void>(formatDevEndpoint(`orgs/${id}`)),

  // Upload organization logo
  uploadLogo: (id: number, logoFile: File) => {
    const formData = new FormData();
    formData.append('logo', logoFile);
    return devApiFormPost<LogoUploadResponse>(formatDevEndpoint(`orgs/${id}/upload_logo`), formData);
  },

  // Get organization file structure
  getFileStructure: (): Promise<FileStructure> =>
    devApiGet<FileStructure>(formatDevEndpoint('orgs/file_structure')),
};

// ────────────────────────────────────────────────────────────────────────────
// Projects API
// ────────────────────────────────────────────────────────────────────────────

export const projectsApi = {
  // Raw API methods
  list: (): Promise<Project[]> =>
    devApiGet<Project[]>(formatDevEndpoint('projects')),

  get: (id: number): Promise<Project> =>
    devApiGet<Project>(formatDevEndpoint(`projects/${id}`)),

  create: (data: Partial<Project>): Promise<Project> =>
    devApiPost<Project>(formatDevEndpoint('projects'), data),

  update: (id: number, data: Partial<Project>): Promise<Project> =>
    devApiPut<Project>(formatDevEndpoint(`projects/${id}`), data),

  patch: (id: number, data: Partial<Project>): Promise<Project> =>
    devApiPatch<Project>(formatDevEndpoint(`projects/${id}`), data),

  delete: (id: number): Promise<void> =>
    devApiDelete<void>(formatDevEndpoint(`projects/${id}`)),

  // Cache-integrated methods
  listCached: (): Promise<Project[]> =>
    developerApiCache.getCachedData('projects', () => devApiGet<Project[]>(formatDevEndpoint('projects'))),

  getCached: (id: number): Promise<Project> =>
    devApiGet<Project>(formatDevEndpoint(`projects/${id}`)),

  createAndCache: async (data: Partial<Project>): Promise<Project> => {
    const result = await devApiPost<Project>(formatDevEndpoint('projects'), data);
    developerApiCache.addItem('projects', result);
    return result;
  },

  updateAndCache: async (id: number, data: Partial<Project>): Promise<Project> => {
    const result = await devApiPut<Project>(formatDevEndpoint(`projects/${id}`), data);
    developerApiCache.updateItem('projects', result);
    return result;
  },

  patchAndCache: async (id: number, data: Partial<Project>): Promise<Project> => {
    const result = await devApiPatch<Project>(formatDevEndpoint(`projects/${id}`), data);
    developerApiCache.updateItem('projects', result);
    return result;
  },

  deleteAndCache: async (id: number): Promise<void> => {
    await devApiDelete<void>(formatDevEndpoint(`projects/${id}`));
    developerApiCache.removeItem('projects', id);
  },

  // Upload project asset
  uploadAsset: (projectId: number, data: {
    file: File;
    type?: string;
    title?: string;
    metadata?: Record<string, any>;
    progress_date?: string;
  }): Promise<ProjectAsset> => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.type) formData.append('type', data.type);
    if (data.title) formData.append('title', data.title);
    if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata));
    if (data.progress_date) formData.append('progress_date', data.progress_date);
    
    return devApiFormPost<ProjectAsset>(formatDevEndpoint(`projects/${projectId}/upload_asset`), formData);
  },

  // Ingest pricelist from text
  ingestPricelist: (projectId: number, text: string): Promise<PricelistIngestionResult> =>
    devApiPost<PricelistIngestionResult>(formatDevEndpoint(`projects/${projectId}/ingest_pricelist`), { text }),

  // Ingest pricelist from PDF
  ingestPricelistPdf: (projectId: number, file: File): Promise<PricelistIngestionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return devApiFormPost<PricelistIngestionResult>(formatDevEndpoint(`projects/${projectId}/ingest_pricelist_pdf`), formData);
  },

  // Ingest description from DOCX
  ingestDescriptionDocx: (projectId: number, file: File, target: 'description' | 'location' = 'description'): Promise<{ ok: boolean }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', target);
    return devApiFormPost<{ ok: boolean }>(formatDevEndpoint(`projects/${projectId}/ingest_description_docx`), formData);
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Units API
// ────────────────────────────────────────────────────────────────────────────

export const unitsApi = {
  // Raw API methods
  list: (): Promise<Unit[]> =>
    devApiGet<Unit[]>(formatDevEndpoint('units')),

  get: (id: number): Promise<Unit> =>
    devApiGet<Unit>(formatDevEndpoint(`units/${id}`)),

  create: (data: Partial<Unit>): Promise<Unit> =>
    devApiPost<Unit>(formatDevEndpoint('units'), data),

  update: (id: number, data: Partial<Unit>): Promise<Unit> =>
    devApiPut<Unit>(formatDevEndpoint(`units/${id}`), data),

  patch: (id: number, data: Partial<Unit>): Promise<Unit> =>
    devApiPatch<Unit>(formatDevEndpoint(`units/${id}`), data),

  delete: (id: number): Promise<void> =>
    devApiDelete<void>(formatDevEndpoint(`units/${id}`)),

  // Cache-integrated methods
  listCached: (): Promise<Unit[]> =>
    developerApiCache.getCachedData('units', () => devApiGet<Unit[]>(formatDevEndpoint('units'))),

  getCached: (id: number): Promise<Unit> =>
    devApiGet<Unit>(formatDevEndpoint(`units/${id}`)),

  createAndCache: async (data: Partial<Unit>): Promise<Unit> => {
    const result = await devApiPost<Unit>(formatDevEndpoint('units'), data);
    developerApiCache.addItem('units', result);
    return result;
  },

  updateAndCache: async (id: number, data: Partial<Unit>): Promise<Unit> => {
    const result = await devApiPut<Unit>(formatDevEndpoint(`units/${id}`), data);
    developerApiCache.updateItem('units', result);
    return result;
  },

  patchAndCache: async (id: number, data: Partial<Unit>): Promise<Unit> => {
    const result = await devApiPatch<Unit>(formatDevEndpoint(`units/${id}`), data);
    developerApiCache.updateItem('units', result);
    return result;
  },

  deleteAndCache: async (id: number): Promise<void> => {
    await devApiDelete<void>(formatDevEndpoint(`units/${id}`));
    developerApiCache.removeItem('units', id);
  },

  // Upload unit media
  uploadMedia: (unitId: number, data: {
    image: File;
    is_primary?: boolean;
  }): Promise<UnitMedia> => {
    const formData = new FormData();
    formData.append('image', data.image);
    if (data.is_primary !== undefined) formData.append('is_primary', String(data.is_primary));
    
    return devApiFormPost<UnitMedia>(formatDevEndpoint(`units/${unitId}/upload_media`), formData);
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Project Assets API (Legacy)
// ────────────────────────────────────────────────────────────────────────────

export const projectAssetsApi = {
  // Raw API methods
  list: (): Promise<ProjectAsset[]> =>
    devApiGet<ProjectAsset[]>(formatDevEndpoint('project-assets')),

  get: (id: number): Promise<ProjectAsset> =>
    devApiGet<ProjectAsset>(formatDevEndpoint(`project-assets/${id}`)),

  create: (data: Partial<ProjectAsset> & { file?: File }): Promise<ProjectAsset> => {
    if (data.file) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'metadata' && typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });
      return devApiFormPost<ProjectAsset>(formatDevEndpoint('project-assets'), formData);
    }
    return devApiPost<ProjectAsset>(formatDevEndpoint('project-assets'), data);
  },

  update: (id: number, data: Partial<ProjectAsset>): Promise<ProjectAsset> =>
    devApiPut<ProjectAsset>(formatDevEndpoint(`project-assets/${id}`), data),

  delete: (id: number): Promise<void> =>
    devApiDelete<void>(formatDevEndpoint(`project-assets/${id}`)),

  // Cache-integrated methods
  listCached: (): Promise<ProjectAsset[]> =>
    developerApiCache.getCachedData('projectAssets', () => devApiGet<ProjectAsset[]>(formatDevEndpoint('project-assets'))),

  getCached: (id: number): Promise<ProjectAsset> =>
    devApiGet<ProjectAsset>(formatDevEndpoint(`project-assets/${id}`)),

  createAndCache: async (data: Partial<ProjectAsset> & { file?: File }): Promise<ProjectAsset> => {
    const result = await projectAssetsApi.create(data);
    developerApiCache.addItem('projectAssets', result);
    return result;
  },

  updateAndCache: async (id: number, data: Partial<ProjectAsset>): Promise<ProjectAsset> => {
    const result = await devApiPut<ProjectAsset>(formatDevEndpoint(`project-assets/${id}`), data);
    developerApiCache.updateItem('projectAssets', result);
    return result;
  },

  deleteAndCache: async (id: number): Promise<void> => {
    await devApiDelete<void>(formatDevEndpoint(`project-assets/${id}`));
    developerApiCache.removeItem('projectAssets', id);
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Developer Assets API (Enhanced)
// ────────────────────────────────────────────────────────────────────────────

export const assetsApi = {
  // Raw API methods
  list: (): Promise<DeveloperAsset[]> =>
    devApiGet<DeveloperAsset[]>(formatDevEndpoint('assets')),

  get: (id: number): Promise<DeveloperAsset> =>
    devApiGet<DeveloperAsset>(formatDevEndpoint(`assets/${id}`)),

  create: (data: Partial<DeveloperAsset> & { file?: File }): Promise<DeveloperAsset> => {
    if (data.file) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'metadata' && typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else if (key === 'tags' && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });
      return devApiFormPost<DeveloperAsset>(formatDevEndpoint('assets'), formData);
    }
    return devApiPost<DeveloperAsset>(formatDevEndpoint('assets'), data);
  },

  update: (id: number, data: Partial<DeveloperAsset>): Promise<DeveloperAsset> =>
    devApiPut<DeveloperAsset>(formatDevEndpoint(`assets/${id}`), data),

  patch: (id: number, data: Partial<DeveloperAsset>): Promise<DeveloperAsset> =>
    devApiPatch<DeveloperAsset>(formatDevEndpoint(`assets/${id}`), data),

  delete: (id: number): Promise<void> =>
    devApiDelete<void>(formatDevEndpoint(`assets/${id}`)),

  // Cache-integrated methods
  listCached: (): Promise<DeveloperAsset[]> =>
    developerApiCache.getCachedData('assets', () => devApiGet<DeveloperAsset[]>(formatDevEndpoint('assets'))),

  getCached: (id: number): Promise<DeveloperAsset> =>
    devApiGet<DeveloperAsset>(formatDevEndpoint(`assets/${id}`)),

  createAndCache: async (data: Partial<DeveloperAsset> & { file?: File }): Promise<DeveloperAsset> => {
    const result = await assetsApi.create(data);
    developerApiCache.addItem('assets', result);
    return result;
  },

  updateAndCache: async (id: number, data: Partial<DeveloperAsset>): Promise<DeveloperAsset> => {
    const result = await devApiPut<DeveloperAsset>(formatDevEndpoint(`assets/${id}`), data);
    developerApiCache.updateItem('assets', result);
    return result;
  },

  patchAndCache: async (id: number, data: Partial<DeveloperAsset>): Promise<DeveloperAsset> => {
    const result = await devApiPatch<DeveloperAsset>(formatDevEndpoint(`assets/${id}`), data);
    developerApiCache.updateItem('assets', result);
    return result;
  },

  deleteAndCache: async (id: number): Promise<void> => {
    await devApiDelete<void>(formatDevEndpoint(`assets/${id}`));
    developerApiCache.removeItem('assets', id);
  },

  // Filter assets by type
  getByType: (type: string): Promise<DeveloperAsset[]> =>
    devApiGet<DeveloperAsset[]>(formatDevEndpoint('assets/by_type'), { params: { type } }),

  // Filter assets by category
  getByCategory: (type: string, category: string): Promise<DeveloperAsset[]> =>
    devApiGet<DeveloperAsset[]>(formatDevEndpoint('assets/by_category'), { params: { type, category } }),

  // Get assets for specific project
  getByProject: (projectId: number): Promise<DeveloperAsset[]> =>
    devApiGet<DeveloperAsset[]>(formatDevEndpoint('assets/by_project'), { params: { project: projectId } }),

  // Get featured assets
  getFeatured: (): Promise<DeveloperAsset[]> =>
    devApiGet<DeveloperAsset[]>(formatDevEndpoint('assets/featured')),

  // Get public assets
  getPublic: (): Promise<DeveloperAsset[]> =>
    devApiGet<DeveloperAsset[]>(formatDevEndpoint('assets/public')),

  // Toggle featured status
  toggleFeatured: (id: number): Promise<DeveloperAsset> =>
    devApiPost<DeveloperAsset>(formatDevEndpoint(`assets/${id}/toggle_featured`), {}),

  // Toggle public visibility
  togglePublic: (id: number): Promise<DeveloperAsset> =>
    devApiPost<DeveloperAsset>(formatDevEndpoint(`assets/${id}/toggle_public`), {}),

  // Add tags to asset
  addTags: (id: number, tags: string[]): Promise<DeveloperAsset> =>
    devApiPost<DeveloperAsset>(formatDevEndpoint(`assets/${id}/add_tags`), { tags }),

  // Remove tags from asset
  removeTags: (id: number, tags: string[]): Promise<DeveloperAsset> =>
    devApiPost<DeveloperAsset>(formatDevEndpoint(`assets/${id}/remove_tags`), { tags }),

  // Search assets
  search: (params: {
    q?: string;
    type?: string;
    category?: string;
    project?: number;
  }): Promise<DeveloperAsset[]> =>
    devApiGet<DeveloperAsset[]>(formatDevEndpoint('assets/search'), { params }),

  // Get asset statistics for project
  getStatistics: (projectId: number): Promise<AssetStatistics> =>
    devApiGet<AssetStatistics>(formatDevEndpoint('assets/statistics'), { params: { project: projectId } }),

  // Get project asset structure
  getStructure: (projectId: number): Promise<any> =>
    devApiGet<any>(formatDevEndpoint('assets/structure'), { params: { project: projectId } }),

  // Bulk upload assets
  bulkUpload: (projectId: number, files: File[]): Promise<BulkUploadResponse> => {
    const formData = new FormData();
    formData.append('project', String(projectId));
    files.forEach(file => {
      formData.append('files', file);
    });
    return devApiFormPost<BulkUploadResponse>(formatDevEndpoint('assets/bulk_upload'), formData);
  },

  // Get available categories
  getCategories: (type?: string): Promise<AssetCategories> =>
    devApiGet<AssetCategories>(formatDevEndpoint('assets/categories'), { params: type ? { type } : {} }),
};

// ────────────────────────────────────────────────────────────────────────────
// Unified Developer API Export
// ────────────────────────────────────────────────────────────────────────────

export const developersApi = {
  organizations: organizationsApi,
  projects: projectsApi,
  units: unitsApi,
  projectAssets: projectAssetsApi, // Legacy support
  assets: assetsApi,
  
  // Cache management methods
  cache: developerApiCache,
  
  // Initialize developer data (call when user is identified as developer)
  initializeDeveloperData: async (): Promise<void> => {
    await developerApiCache.bulkFetch(developersApi);
    developerApiCache.startBackgroundRefresh(developersApi);
  },
  
  // Stop background refresh (call when user logs out)
  cleanup: (): void => {
    developerApiCache.stopBackgroundRefresh();
    developerApiCache.clear();
  },
  
  // Get cache status for debugging
  getCacheStatus: (): Record<string, { hasData: boolean; age: number; isValid: boolean }> => {
    return developerApiCache.getCacheStatus();
  },
};

export default developersApi;

// ────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────────────────────────────────────────

export const getFileTypeFromMime = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word') || 
      mimeType.includes('excel') || mimeType.includes('powerpoint')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
  return 'other';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getAssetCategoryDisplay = (asset: DeveloperAsset): string => {
  if (asset.category_display) return asset.category_display;
  
  switch (asset.asset_type) {
    case 'document':
      return asset.document_category || 'Document';
    case 'image':
      return asset.image_category || 'Image';
    case 'video':
      return asset.video_category || 'Video';
    default:
      return asset.asset_type || 'Other';
  }
};
