// src/config/developers-api.ts
import axios from 'axios';
import environment from './environment';

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
    (p as any).then((r: any) => {
      console.log('API Response in toPromise:', r);
      console.log('Response data:', r?.data);
      console.log('Response type:', typeof r);
      const result = (r?.data ?? r) as T;
      console.log('Final result:', result);
      resolve(result);
    }).catch(reject);
  });
}

const devApiGet = <T = any>(endpoint: string, config?: any): Promise<T> =>
  toPromise<T>(devApiClient.get<T>(endpoint, config));
const devApiPost = <T = any>(endpoint: string, data?: any, config?: any): Promise<T> =>
  toPromise<T>(devApiClient.post<T>(endpoint, data, config));
const devApiPut = <T = any>(endpoint: string, data?: any, config?: any): Promise<T> =>
  toPromise<T>(devApiClient.put<T>(endpoint, data, config));
const devApiDelete = <T = any>(endpoint: string, config?: any): Promise<T> =>
  toPromise<T>(devApiClient.delete<T>(endpoint, config));
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
  // List projects
  list: (): Promise<Project[]> =>
    devApiGet<Project[]>(formatDevEndpoint('projects')),

  // Get specific project
  get: (id: number): Promise<Project> =>
    devApiGet<Project>(formatDevEndpoint(`projects/${id}`)),

  // Create project
  create: (data: Partial<Project>): Promise<Project> =>
    devApiPost<Project>(formatDevEndpoint('projects'), data),

  // Update project
  update: (id: number, data: Partial<Project>): Promise<Project> =>
    devApiPut<Project>(formatDevEndpoint(`projects/${id}`), data),

  // Partial update project
  patch: (id: number, data: Partial<Project>): Promise<Project> =>
    devApiPatch<Project>(formatDevEndpoint(`projects/${id}`), data),

  // Delete project
  delete: (id: number): Promise<void> =>
    devApiDelete<void>(formatDevEndpoint(`projects/${id}`)),

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
  // List units
  list: (): Promise<Unit[]> =>
    devApiGet<Unit[]>(formatDevEndpoint('units')),

  // Get specific unit
  get: (id: number): Promise<Unit> =>
    devApiGet<Unit>(formatDevEndpoint(`units/${id}`)),

  // Create unit
  create: (data: Partial<Unit>): Promise<Unit> =>
    devApiPost<Unit>(formatDevEndpoint('units'), data),

  // Update unit
  update: (id: number, data: Partial<Unit>): Promise<Unit> =>
    devApiPut<Unit>(formatDevEndpoint(`units/${id}`), data),

  // Partial update unit
  patch: (id: number, data: Partial<Unit>): Promise<Unit> =>
    devApiPatch<Unit>(formatDevEndpoint(`units/${id}`), data),

  // Delete unit
  delete: (id: number): Promise<void> =>
    devApiDelete<void>(formatDevEndpoint(`units/${id}`)),

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
  // List project assets
  list: (): Promise<ProjectAsset[]> =>
    devApiGet<ProjectAsset[]>(formatDevEndpoint('project-assets')),

  // Get specific project asset
  get: (id: number): Promise<ProjectAsset> =>
    devApiGet<ProjectAsset>(formatDevEndpoint(`project-assets/${id}`)),

  // Create project asset
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

  // Update project asset
  update: (id: number, data: Partial<ProjectAsset>): Promise<ProjectAsset> =>
    devApiPut<ProjectAsset>(formatDevEndpoint(`project-assets/${id}`), data),

  // Delete project asset
  delete: (id: number): Promise<void> =>
    devApiDelete<void>(formatDevEndpoint(`project-assets/${id}`)),
};

// ────────────────────────────────────────────────────────────────────────────
// Developer Assets API (Enhanced)
// ────────────────────────────────────────────────────────────────────────────

export const assetsApi = {
  // List assets
  list: (): Promise<DeveloperAsset[]> =>
    devApiGet<DeveloperAsset[]>(formatDevEndpoint('assets')),

  // Get specific asset
  get: (id: number): Promise<DeveloperAsset> =>
    devApiGet<DeveloperAsset>(formatDevEndpoint(`assets/${id}`)),

  // Create asset
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

  // Update asset
  update: (id: number, data: Partial<DeveloperAsset>): Promise<DeveloperAsset> =>
    devApiPut<DeveloperAsset>(formatDevEndpoint(`assets/${id}`), data),

  // Partial update asset
  patch: (id: number, data: Partial<DeveloperAsset>): Promise<DeveloperAsset> =>
    devApiPatch<DeveloperAsset>(formatDevEndpoint(`assets/${id}`), data),

  // Delete asset
  delete: (id: number): Promise<void> =>
    devApiDelete<void>(formatDevEndpoint(`assets/${id}`)),

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
