import { useEffect, useState } from 'react';
import { useImageCache } from '../context/ImageCacheContext';

interface PreloadOptions {
  enabled?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface PreloadResult {
  loadingStates: Record<string, boolean>;
  isAnyLoading: boolean;
  allLoaded: boolean;
}

/**
 * Hook to preload multiple images using the global cache
 * @param urls - Array of image URLs to preload
 * @param options - Preload options
 * @returns Object with loading states
 */
export const useImagePreload = (
  urls: string[],
  options: PreloadOptions = {}
): PreloadResult => {
  const { enabled = true, priority = 'normal' } = options;
  const { preloadImage, getLoadingState } = useImageCache();
  
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (!enabled || urls.length === 0) {
      return;
    }
    
    const loadImages = async () => {
      // Initialize loading states
      const initialStates: Record<string, boolean> = {};
      urls.forEach(url => {
        const state = getLoadingState(url);
        initialStates[url] = state.loading || (!state.loaded && !state.error);
      });
      setLoadingStates(initialStates);
      
      // Preload images based on priority
      const promises = urls.map(async (url) => {
        try {
          await preloadImage(url);
          setLoadingStates(prev => ({ ...prev, [url]: false }));
        } catch (error) {
          console.error(`Failed to preload image: ${url}`, error);
          setLoadingStates(prev => ({ ...prev, [url]: false }));
        }
      });
      
      // For high priority, wait for all; for normal/low, fire and forget
      if (priority === 'high') {
        await Promise.all(promises);
      } else {
        Promise.allSettled(promises);
      }
    };
    
    loadImages();
  }, [urls.join(','), enabled, priority, preloadImage, getLoadingState]);
  
  const isAnyLoading = Object.values(loadingStates).some(loading => loading);
  const allLoaded = urls.length > 0 && Object.values(loadingStates).every(loading => !loading);
  
  return {
    loadingStates,
    isAnyLoading,
    allLoaded
  };
};

