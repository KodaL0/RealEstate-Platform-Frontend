// Developer API Cache Utility
// Provides 5-minute caching with real-time updates for developer data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
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
  private readonly TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Check if cache entry is valid (not expired)
  private isCacheValid(entry: CacheEntry<any> | null): boolean {
    if (!entry) return false;
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  // Get data from cache if valid, otherwise return null
  get<T>(key: keyof CacheStore): T | null {
    const entry = this.cache[key];
    if (this.isCacheValid(entry)) {
      return entry.data as T;
    }
    return null;
  }

  // Set data in cache with current timestamp
  set<T>(key: keyof CacheStore, data: T): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl: this.TTL,
    };
  }

  // Update specific item in cached array (for PUT/PATCH operations)
  updateItem<T extends { id: number }>(key: keyof CacheStore, updatedItem: T): void {
    const entry = this.cache[key];
    if (entry && Array.isArray(entry.data)) {
      const index = entry.data.findIndex((item: any) => item.id === updatedItem.id);
      if (index !== -1) {
        entry.data[index] = updatedItem;
        entry.timestamp = Date.now(); // Refresh timestamp
      }
    }
  }

  // Add new item to cached array (for POST operations)
  addItem<T>(key: keyof CacheStore, newItem: T): void {
    const entry = this.cache[key];
    if (entry && Array.isArray(entry.data)) {
      entry.data.unshift(newItem); // Add to beginning
      entry.timestamp = Date.now(); // Refresh timestamp
    }
  }

  // Remove item from cached array (for DELETE operations)
  removeItem(key: keyof CacheStore, itemId: number): void {
    const entry = this.cache[key];
    if (entry && Array.isArray(entry.data)) {
      entry.data = entry.data.filter((item: any) => item.id !== itemId);
      entry.timestamp = Date.now(); // Refresh timestamp
    }
  }

  // Invalidate specific cache entry
  invalidate(key: keyof CacheStore): void {
    this.cache[key] = null;
  }

  // Clear all cache
  clear(): void {
    this.cache = {
      units: null,
      assets: null,
      projects: null,
      projectAssets: null,
    };
  }

  // Check if we have a pending request for the same operation
  private getPendingRequest(key: string): Promise<any> | null {
    return this.pendingRequests.get(key) || null;
  }

  // Set a pending request to prevent duplicates
  private setPendingRequest(key: string, promise: Promise<any>): void {
    this.pendingRequests.set(key, promise);
    
    // Clean up when request completes
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  // Wrapper for API calls with caching
  async getCachedData<T>(
    key: keyof CacheStore,
    apiCall: () => Promise<T>,
    requestKey?: string
  ): Promise<T> {
    // Check cache first
    const cachedData = this.get<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }

    // Check for pending requests to prevent duplicates
    const pendingKey = requestKey || key;
    const pendingRequest = this.getPendingRequest(pendingKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Make API call and cache result
    const apiPromise = apiCall().then((data) => {
      this.set(key, data);
      return data;
    });

    this.setPendingRequest(pendingKey, apiPromise);
    return apiPromise;
  }

  // Bulk fetch all developer data (called when user is identified as developer)
  async bulkFetch(api: any): Promise<void> {
    try {
      const [units, assets, projects, projectAssets] = await Promise.all([
        api.units.list(),
        api.assets.list(),
        api.projects.list(),
        api.projectAssets.list(),
      ]);

      // Cache all data
      this.set('units', units);
      this.set('assets', assets);
      this.set('projects', projects);
      this.set('projectAssets', projectAssets);

      console.log('Developer API: Bulk data cached successfully');
    } catch (error) {
      console.error('Developer API: Failed to bulk fetch data:', error);
    }
  }

  // Get cache status for debugging
  getCacheStatus(): Record<string, { hasData: boolean; age: number; isValid: boolean }> {
    const now = Date.now();
    const status: Record<string, any> = {};

    Object.entries(this.cache).forEach(([key, entry]) => {
      if (entry) {
        const age = now - entry.timestamp;
        status[key] = {
          hasData: true,
          age: Math.round(age / 1000), // Age in seconds
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

// Export singleton instance
export const developerApiCache = new DeveloperApiCache();

// Export types for use in components
export type { CacheEntry, CacheStore };

// Export cache instance as default
export default developerApiCache;
