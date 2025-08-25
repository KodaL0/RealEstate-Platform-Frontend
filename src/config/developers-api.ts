// src/config/developers-api.ts
import { apiClient, apiGet, apiPost, apiPut, apiDelete, apiFormPost } from './api';

// Add PATCH helper for consistency
const apiPatch = <T = any>(endpoint: string, data?: any, config?: any) =>
  apiClient.patch<T>(endpoint, data, config);

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
    apiGet<OrganizationResponse>(formatDevEndpoint('orgs/mine')).then(r => r.data),

  // List organizations user belongs to
  list: (): Promise<DeveloperOrganization[]> =>
    apiGet<DeveloperOrganization[]>(formatDevEndpoint('orgs')),

  // Get specific organization
  get: (id: number): Promise<DeveloperOrganization> =>
    apiGet<DeveloperOrganization>(formatDevEndpoint(`orgs/${id}`)),

  // Create organization
  create: (data: Partial<DeveloperOrganization>): Promise<DeveloperOrganization> =>
    apiPost<DeveloperOrganization>(formatDevEndpoint('orgs'), data),

  // Update organization
  update: (id: number, data: Partial<DeveloperOrganization>): Promise<DeveloperOrganization> =>
    apiPut<DeveloperOrganization>(formatDevEndpoint(`orgs/${id}`), data),

  // Partial update organization
  patch: (id: number, data: Partial<DeveloperOrganization>): Promise<DeveloperOrganization> =>
    apiPatch<DeveloperOrganization>(formatDevEndpoint(`orgs/${id}`), data),

  // Delete organization
  delete: (id: number): Promise<void> =>
    apiDelete<void>(formatDevEndpoint(`orgs/${id}`)),

  // Upload organization logo
  uploadLogo: (id: number, logoFile: File) => {
    const formData = new FormData();
    formData.append('logo', logoFile);
    return apiFormPost<LogoUploadResponse>(formatDevEndpoint(`orgs/${id}/upload_logo`), formData);
  },

  // Get organization file structure
  getFileStructure: (): Promise<FileStructure> =>
    apiGet<FileStructure>(formatDevEndpoint('orgs/file_structure')),
};

// ────────────────────────────────────────────────────────────────────────────
// Projects API
// ────────────────────────────────────────────────────────────────────────────

export const projectsApi = {
  // List projects
  list: (): Promise<Project[]> =>
    apiGet<Project[]>(formatDevEndpoint('projects')).then(r => r.data),

  // Get specific project
  get: (id: number): Promise<Project> =>
    apiGet<Project>(formatDevEndpoint(`projects/${id}`)).then(r => r.data),

  // Create project
  create: (data: Partial<Project>): Promise<Project> =>
    apiPost<Project>(formatDevEndpoint('projects'), data).then(r => r.data),

  // Update project
  update: (id: number, data: Partial<Project>): Promise<Project> =>
    apiPut<Project>(formatDevEndpoint(`projects/${id}`), data).then(r => r.data),

  // Partial update project
  patch: (id: number, data: Partial<Project>): Promise<Project> =>
    apiPatch<Project>(formatDevEndpoint(`projects/${id}`), data).then(r => r.data),

  // Delete project
  delete: (id: number): Promise<void> =>
    apiDelete<void>(formatDevEndpoint(`projects/${id}`)).then(() => undefined),

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
    
    return apiFormPost<ProjectAsset>(formatDevEndpoint(`projects/${projectId}/upload_asset`), formData);
  },

  // Ingest pricelist from text
  ingestPricelist: (projectId: number, text: string): Promise<PricelistIngestionResult> =>
    apiPost<PricelistIngestionResult>(formatDevEndpoint(`projects/${projectId}/ingest_pricelist`), { text }),

  // Ingest pricelist from PDF
  ingestPricelistPdf: (projectId: number, file: File): Promise<PricelistIngestionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFormPost<PricelistIngestionResult>(formatDevEndpoint(`projects/${projectId}/ingest_pricelist_pdf`), formData);
  },

  // Ingest description from DOCX
  ingestDescriptionDocx: (projectId: number, file: File, target: 'description' | 'location' = 'description'): Promise<{ ok: boolean }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', target);
    return apiFormPost<{ ok: boolean }>(formatDevEndpoint(`projects/${projectId}/ingest_description_docx`), formData);
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Units API
// ────────────────────────────────────────────────────────────────────────────

export const unitsApi = {
  // List units
  list: (): Promise<Unit[]> =>
    apiGet<Unit[]>(formatDevEndpoint('units')).then(r => r.data),

  // List units by project
  listByProject: (projectId: number): Promise<Unit[]> =>
    apiGet<Unit[]>(formatDevEndpoint('units'), { params: { project: projectId } }).then(r => r.data),

  // Get specific unit
  get: (id: number): Promise<Unit> =>
    apiGet<Unit>(formatDevEndpoint(`units/${id}`)).then(r => r.data),

  // Create unit
  create: (data: Partial<Unit>): Promise<Unit> =>
    apiPost<Unit>(formatDevEndpoint('units'), data).then(r => r.data),

  // Update unit
  update: (id: number, data: Partial<Unit>): Promise<Unit> =>
    apiPut<Unit>(formatDevEndpoint(`units/${id}`), data).then(r => r.data),

  // Partial update unit
  patch: (id: number, data: Partial<Unit>): Promise<Unit> =>
    apiPatch<Unit>(formatDevEndpoint(`units/${id}`), data).then(r => r.data),

  // Delete unit
  delete: (id: number): Promise<void> =>
    apiDelete<void>(formatDevEndpoint(`units/${id}`)).then(() => undefined),

  // Upload unit media
  uploadMedia: (unitId: number, data: {
    image: File;
    is_primary?: boolean;
  }): Promise<UnitMedia> => {
    const formData = new FormData();
    formData.append('image', data.image);
    if (data.is_primary !== undefined) formData.append('is_primary', String(data.is_primary));
    
    return apiFormPost<UnitMedia>(formatDevEndpoint(`units/${unitId}/upload_media`), formData);
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Project Assets API (Legacy)
// ────────────────────────────────────────────────────────────────────────────

export const projectAssetsApi = {
  // List project assets
  list: (): Promise<ProjectAsset[]> =>
    apiGet<ProjectAsset[]>(formatDevEndpoint('project-assets')).then(r => r.data),

  // List project assets filtered by project
  listByProject: (projectId: number): Promise<ProjectAsset[]> =>
    apiGet<ProjectAsset[]>(formatDevEndpoint('project-assets'), { params: { project: projectId } }).then(r => r.data),

  // Get specific project asset
  get: (id: number): Promise<ProjectAsset> =>
    apiGet<ProjectAsset>(formatDevEndpoint(`project-assets/${id}`)).then(r => r.data),

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
      return apiFormPost<ProjectAsset>(formatDevEndpoint('project-assets'), formData).then(r => r.data);
    }
    return apiPost<ProjectAsset>(formatDevEndpoint('project-assets'), data).then(r => r.data);
  },

  // Update project asset
  update: (id: number, data: Partial<ProjectAsset>): Promise<ProjectAsset> =>
    apiPut<ProjectAsset>(formatDevEndpoint(`project-assets/${id}`), data).then(r => r.data),

  // Delete project asset
  delete: (id: number): Promise<void> =>
    apiDelete<void>(formatDevEndpoint(`project-assets/${id}`)).then(() => undefined),
};

// ────────────────────────────────────────────────────────────────────────────
// Developer Assets API (Enhanced)
// ────────────────────────────────────────────────────────────────────────────

export const assetsApi = {
  // List assets
  list: (): Promise<DeveloperAsset[]> =>
    apiGet<DeveloperAsset[]>(formatDevEndpoint('assets')),

  // Get specific asset
  get: (id: number): Promise<DeveloperAsset> =>
    apiGet<DeveloperAsset>(formatDevEndpoint(`assets/${id}`)),

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
      return apiFormPost<DeveloperAsset>(formatDevEndpoint('assets'), formData);
    }
    return apiPost<DeveloperAsset>(formatDevEndpoint('assets'), data);
  },

  // Update asset
  update: (id: number, data: Partial<DeveloperAsset>): Promise<DeveloperAsset> =>
    apiPut<DeveloperAsset>(formatDevEndpoint(`assets/${id}`), data),

  // Partial update asset
  patch: (id: number, data: Partial<DeveloperAsset>): Promise<DeveloperAsset> =>
    apiPatch<DeveloperAsset>(formatDevEndpoint(`assets/${id}`), data),

  // Delete asset
  delete: (id: number): Promise<void> =>
    apiDelete<void>(formatDevEndpoint(`assets/${id}`)),

  // Filter assets by type
  getByType: (type: string): Promise<DeveloperAsset[]> =>
    apiGet<DeveloperAsset[]>(formatDevEndpoint('assets/by_type'), { params: { type } }),

  // Filter assets by category
  getByCategory: (type: string, category: string): Promise<DeveloperAsset[]> =>
    apiGet<DeveloperAsset[]>(formatDevEndpoint('assets/by_category'), { params: { type, category } }),

  // Get assets for specific project
  getByProject: (projectId: number): Promise<DeveloperAsset[]> =>
    apiGet<DeveloperAsset[]>(formatDevEndpoint('assets/by_project'), { params: { project: projectId } }),

  // Get featured assets
  getFeatured: (): Promise<DeveloperAsset[]> =>
    apiGet<DeveloperAsset[]>(formatDevEndpoint('assets/featured')),

  // Get public assets
  getPublic: (): Promise<DeveloperAsset[]> =>
    apiGet<DeveloperAsset[]>(formatDevEndpoint('assets/public')),

  // Toggle featured status
  toggleFeatured: (id: number): Promise<DeveloperAsset> =>
    apiPost<DeveloperAsset>(formatDevEndpoint(`assets/${id}/toggle_featured`), {}),

  // Toggle public visibility
  togglePublic: (id: number): Promise<DeveloperAsset> =>
    apiPost<DeveloperAsset>(formatDevEndpoint(`assets/${id}/toggle_public`), {}),

  // Add tags to asset
  addTags: (id: number, tags: string[]): Promise<DeveloperAsset> =>
    apiPost<DeveloperAsset>(formatDevEndpoint(`assets/${id}/add_tags`), { tags }),

  // Remove tags from asset
  removeTags: (id: number, tags: string[]): Promise<DeveloperAsset> =>
    apiPost<DeveloperAsset>(formatDevEndpoint(`assets/${id}/remove_tags`), { tags }),

  // Search assets
  search: (params: {
    q?: string;
    type?: string;
    category?: string;
    project?: number;
  }): Promise<DeveloperAsset[]> =>
    apiGet<DeveloperAsset[]>(formatDevEndpoint('assets/search'), { params }),

  // Get asset statistics for project
  getStatistics: (projectId: number): Promise<AssetStatistics> =>
    apiGet<AssetStatistics>(formatDevEndpoint('assets/statistics'), { params: { project: projectId } }),

  // Get project asset structure
  getStructure: (projectId: number): Promise<any> =>
    apiGet<any>(formatDevEndpoint('assets/structure'), { params: { project: projectId } }),

  // Bulk upload assets
  bulkUpload: (projectId: number, files: File[]): Promise<BulkUploadResponse> => {
    const formData = new FormData();
    formData.append('project', String(projectId));
    files.forEach(file => {
      formData.append('files', file);
    });
    return apiFormPost<BulkUploadResponse>(formatDevEndpoint('assets/bulk_upload'), formData);
  },

  // Get available categories
  getCategories: (type?: string): Promise<AssetCategories> =>
    apiGet<AssetCategories>(formatDevEndpoint('assets/categories'), { params: type ? { type } : {} }),
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
