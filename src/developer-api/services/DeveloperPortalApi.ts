// Centralized API service for Developer Portal
// Handles all API calls, caching, and data management for the portal

import developersApi, { 
  DeveloperOrganization, 
  Project, 
  Unit, 
  DeveloperAsset 
} from '../../config/developers-api';
import environment from '../../config/environment';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface ProjectStats {
  unitsCount: number;
  assetsCount: number;
  photosCount: number;
  firstPhotoUrl?: string;
}

export interface PortalData {
  organization: DeveloperOrganization | null;
  projects: Project[];
  units: Unit[];
  assets: DeveloperAsset[];
  projectStats: Record<number, ProjectStats>;
}

// ────────────────────────────────────────────────────────────────────────────
// Developer Portal API Service
// ────────────────────────────────────────────────────────────────────────────

class DeveloperPortalApiService {
  private dataCache: PortalData | null = null;
  private isLoading = false;
  private loadPromise: Promise<PortalData> | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.dataCache) return false;
    return Date.now() - this.lastFetchTime < this.CACHE_TTL;
  }

  /**
   * Initialize and load all portal data
   * Uses caching to avoid redundant API calls
   */
  async initialize(): Promise<PortalData> {
    // Return cached data if valid
    if (this.isCacheValid() && this.dataCache) {
      return this.dataCache;
    }

    // If already loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Start new load
    this.isLoading = true;
    this.loadPromise = this.loadAllData();

    try {
      const data = await this.loadPromise;
      this.dataCache = data;
      this.lastFetchTime = Date.now();
      return data;
    } catch (error) {
      console.error('Failed to initialize portal data:', error);
      throw error;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * Load all portal data in parallel
   */
  private async loadAllData(): Promise<PortalData> {
    try {
      // Fetch all data in parallel using cached APIs
      const [orgResponse, projects, units, assets] = await Promise.all([
        developersApi.organizations.getMine(),
        developersApi.projects.listCached(),
        developersApi.units.listCached(),
        developersApi.assets.listCached(),
      ]);

      const organization = orgResponse.organization || null;

      // Calculate project stats
      const projectStats: Record<number, ProjectStats> = {};
      
      projects.forEach(project => {
        const projectUnits = units.filter(u => u.project === project.id);
        const projectDocuments = assets.filter(a => a.project === project.id); // DeveloperAsset (documents)
        
        // Photos come from project.assets (ProjectAsset with category='photos')
        // Documents come from assets endpoint (DeveloperAsset)
        const projectPhotos = (project.assets || []).filter((asset: any) => asset.category === 'photos');
        
        // Sort photos by upload date (most recent first)
        const sortedPhotos = [...projectPhotos].sort((a, b) => {
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
        });

        // Resolve relative file URLs to absolute URLs
        const resolveFileUrl = (fileUrl: string | undefined): string | undefined => {
          if (!fileUrl) return undefined;
          if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            return fileUrl; // Already absolute
          }
          // If relative URL, prepend API base URL
          const apiBaseUrl = environment.baseUrl;
          return fileUrl.startsWith('/') ? `${apiBaseUrl}${fileUrl}` : `${apiBaseUrl}/${fileUrl}`;
        };

        projectStats[project.id] = {
          unitsCount: projectUnits.length,
          assetsCount: projectDocuments.length, // Document count from DeveloperAsset
          photosCount: projectPhotos.length, // Photo count from ProjectAsset
          firstPhotoUrl: resolveFileUrl(sortedPhotos[0]?.file) || project.main_image,
        };
      });

      return {
        organization,
        projects,
        units,
        assets,
        projectStats,
      };
    } catch (error) {
      console.error('Error loading portal data:', error);
      throw error;
    }
  }

  /**
   * Get organization data
   */
  async getOrganization(): Promise<DeveloperOrganization | null> {
    const data = await this.initialize();
    return data.organization;
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    const data = await this.initialize();
    return data.projects;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: number): Promise<Project | null> {
    const data = await this.initialize();
    return data.projects.find(p => p.id === projectId) || null;
  }

  /**
   * Get units for a project
   */
  async getProjectUnits(projectId: number): Promise<Unit[]> {
    const data = await this.initialize();
    return data.units.filter(u => u.project === projectId);
  }

  /**
   * Get assets for a project
   */
  async getProjectAssets(projectId: number): Promise<DeveloperAsset[]> {
    const data = await this.initialize();
    return data.assets.filter(a => a.project === projectId);
  }

  /**
   * Get photos for a project
   */
  async getProjectPhotos(projectId: number): Promise<DeveloperAsset[]> {
    const assets = await this.getProjectAssets(projectId);
    return assets.filter(a => 
      a.asset_type === 'image' && a.image_category === 'photos'
    );
  }

  /**
   * Get stats for a project
   */
  async getProjectStats(projectId: number): Promise<ProjectStats | null> {
    const data = await this.initialize();
    return data.projectStats[projectId] || null;
  }

  /**
   * Get stats for all projects
   */
  async getAllProjectStats(): Promise<Record<number, ProjectStats>> {
    const data = await this.initialize();
    return data.projectStats;
  }

  /**
   * Invalidate cache and reload data
   */
  async refresh(): Promise<PortalData> {
    this.dataCache = null;
    this.lastFetchTime = 0;
    developersApi.cache.clear();
    return this.initialize();
  }

  /**
   * Invalidate cache for specific project
   */
  async invalidateProject(projectId: number): Promise<void> {
    // Remove from cache
    if (this.dataCache) {
      this.dataCache.projects = this.dataCache.projects.filter(p => p.id !== projectId);
      delete this.dataCache.projectStats[projectId];
    }
    
    // Invalidate API cache
    developersApi.cache.invalidate('projects');
    developersApi.cache.invalidate('units');
    developersApi.cache.invalidate('assets');
  }

  /**
   * Update project in cache
   */
  async updateProject(project: Project): Promise<void> {
    if (this.dataCache) {
      const index = this.dataCache.projects.findIndex(p => p.id === project.id);
      if (index !== -1) {
        this.dataCache.projects[index] = project;
      } else {
        this.dataCache.projects.push(project);
      }
      
      // Recalculate stats for this project
      // Photos come from project.assets (ProjectAsset), not DeveloperAsset
      const projectUnits = this.dataCache.units.filter(u => u.project === project.id);
      const projectDocuments = this.dataCache.assets.filter(a => a.project === project.id); // DeveloperAsset (documents)
      const projectPhotos = (project.assets || []).filter((asset: any) => asset.category === 'photos');

      // Sort photos by upload date (most recent first)
      const sortedPhotos = [...projectPhotos].sort((a, b) => {
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      });

      // Resolve relative file URLs to absolute URLs
      const resolveFileUrl = (fileUrl: string | undefined): string | undefined => {
        if (!fileUrl) return undefined;
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
          return fileUrl; // Already absolute
        }
        const apiBaseUrl = environment.baseUrl;
        return fileUrl.startsWith('/') ? `${apiBaseUrl}${fileUrl}` : `${apiBaseUrl}/${fileUrl}`;
      };

      this.dataCache.projectStats[project.id] = {
        unitsCount: projectUnits.length,
        assetsCount: projectDocuments.length, // Document count from DeveloperAsset
        photosCount: projectPhotos.length, // Photo count from ProjectAsset
        firstPhotoUrl: resolveFileUrl(sortedPhotos[0]?.file) || project.main_image,
      };
    }
  }

  /**
   * Add new project to cache
   */
  async addProject(project: Project): Promise<void> {
    if (this.dataCache) {
      this.dataCache.projects.push(project);
      this.dataCache.projectStats[project.id] = {
        unitsCount: 0,
        assetsCount: 0,
        photosCount: 0,
        firstPhotoUrl: project.main_image,
      };
    }
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    return {
      hasData: !!this.dataCache,
      age: this.dataCache ? Date.now() - this.lastFetchTime : 0,
      isValid: this.isCacheValid(),
      isLoading: this.isLoading,
    };
  }
}

// Export singleton instance
export const developerPortalApi = new DeveloperPortalApiService();

// Export default
export default developerPortalApi;

