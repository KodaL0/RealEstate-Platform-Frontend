// Centralized API service for Developer Portal
// Handles all API calls, caching, and data management for the portal

import developersApi, {
  type DeveloperAsset,
  type DeveloperOrganization,
  type Project,
  type ProjectAsset,
  type Unit,
} from "../../config/developers-api";
import environment from "../../config/environment";

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
      console.error("Failed to initialize portal data:", error);
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

      // Use denormalized count fields from API instead of calculating
      const projectStats: Record<number, ProjectStats> = {};

      projects.forEach((project) => {
        // Use count fields from project object (denormalized, maintained by signals)
        // Fallback to calculating if fields not available (backward compatibility)
        const projectUnits = units.filter((u) => u.project === project.id);
        const projectPhotos = (project.assets || []).filter(
          (asset: ProjectAsset) => asset.category === "photos",
        );

        // Sort photos by upload date (most recent first)
        const sortedPhotos = [...projectPhotos].sort((a, b) => {
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
        });

        // Resolve relative file URLs to absolute URLs
        const resolveFileUrl = (fileUrl: string | undefined): string | undefined => {
          if (!fileUrl) return undefined;
          if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
            return fileUrl; // Already absolute
          }
          // If relative URL, prepend API base URL
          const apiBaseUrl = environment.baseUrl;
          return fileUrl.startsWith("/") ? `${apiBaseUrl}${fileUrl}` : `${apiBaseUrl}/${fileUrl}`;
        };

        projectStats[project.id] = {
          unitsCount: project.total_units || projectUnits.length, // Use denormalized field
          assetsCount:
            project.assets_count ?? assets.filter((a) => a.project === project.id).length, // Use denormalized field with fallback
          photosCount: project.photos_count ?? projectPhotos.length, // Use denormalized field with fallback
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
      console.error("Error loading portal data:", error);
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
    return data.projects.find((p) => p.id === projectId) || null;
  }

  /**
   * Get units for a project
   */
  async getProjectUnits(projectId: number): Promise<Unit[]> {
    const data = await this.initialize();
    return data.units.filter((u) => u.project === projectId);
  }

  /**
   * Get assets for a project
   */
  async getProjectAssets(projectId: number): Promise<DeveloperAsset[]> {
    const data = await this.initialize();
    return data.assets.filter((a) => a.project === projectId);
  }

  /**
   * Get photos for a project
   */
  async getProjectPhotos(projectId: number): Promise<DeveloperAsset[]> {
    const assets = await this.getProjectAssets(projectId);
    return assets.filter((a) => a.asset_type === "image" && a.image_category === "photos");
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
      this.dataCache.projects = this.dataCache.projects.filter((p) => p.id !== projectId);
      delete this.dataCache.projectStats[projectId];
    }

    // Invalidate API cache
    developersApi.cache.invalidate("projects");
    developersApi.cache.invalidate("units");
    developersApi.cache.invalidate("assets");
  }

  /**
   * Update project in cache
   */
  async updateProject(project: Project): Promise<void> {
    if (this.dataCache) {
      const index = this.dataCache.projects.findIndex((p) => p.id === project.id);
      if (index !== -1) {
        this.dataCache.projects[index] = project;
      } else {
        this.dataCache.projects.push(project);
      }

      // Use denormalized count fields from project object
      const projectPhotos = (project.assets || []).filter(
        (asset: ProjectAsset) => asset.category === "photos",
      );
      const sortedPhotos = [...projectPhotos].sort((a, b) => {
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      });

      this.dataCache.projectStats[project.id] = {
        unitsCount: project.total_units || 0,
        assetsCount: project.assets_count ?? 0,
        photosCount: project.photos_count ?? 0,
        firstPhotoUrl: sortedPhotos[0]?.file || project.main_image,
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
        unitsCount: project.total_units || 0,
        assetsCount: project.assets_count ?? 0,
        photosCount: project.photos_count ?? 0,
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
