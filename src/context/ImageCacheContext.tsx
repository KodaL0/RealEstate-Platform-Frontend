import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

interface ImageLoadingState {
  loading: boolean;
  loaded: boolean;
  error: boolean;
}

interface ImageCacheContextValue {
  preloadImage: (url: string) => Promise<void>;
  getCachedImage: (url: string) => HTMLImageElement | undefined;
  getLoadingState: (url: string) => ImageLoadingState;
  isCached: (url: string) => boolean;
  getCacheStats: () => { size: number; urls: string[] };
}

const ImageCacheContext = createContext<ImageCacheContextValue | undefined>(undefined);

export const ImageCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global image cache - persists across component lifecycles
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  
  // Track loading states for all images
  const [loadingStates, setLoadingStates] = useState<Record<string, ImageLoadingState>>({});
  
  // Check if an image is already cached
  const isCached = useCallback((url: string): boolean => {
    return cacheRef.current.has(url);
  }, []);
  
  // Get cached image element
  const getCachedImage = useCallback((url: string): HTMLImageElement | undefined => {
    return cacheRef.current.get(url);
  }, []);
  
  // Get loading state for a specific URL
  const getLoadingState = useCallback((url: string): ImageLoadingState => {
    return loadingStates[url] || { loading: false, loaded: false, error: false };
  }, [loadingStates]);
  
  // Preload and cache an image
  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Already cached - resolve immediately
      if (cacheRef.current.has(url)) {
        resolve();
        return;
      }
      
      // Already loading - wait for existing load
      const currentState = loadingStates[url];
      if (currentState?.loading) {
        // Set up a listener for when this image finishes loading
        const checkInterval = setInterval(() => {
          const state = loadingStates[url];
          if (state && !state.loading) {
            clearInterval(checkInterval);
            if (state.loaded) {
              resolve();
            } else if (state.error) {
              reject(new Error(`Failed to load image: ${url}`));
            }
          }
        }, 50);
        return;
      }
      
      // Set loading state
      setLoadingStates(prev => ({
        ...prev,
        [url]: { loading: true, loaded: false, error: false }
      }));
      
      // Create new image element
      const img = new Image();
      
      img.onload = () => {
        // Cache the image
        cacheRef.current.set(url, img);
        
        // Update state
        setLoadingStates(prev => ({
          ...prev,
          [url]: { loading: false, loaded: true, error: false }
        }));
        
        resolve();
      };
      
      img.onerror = () => {
        // Update state - mark as error
        setLoadingStates(prev => ({
          ...prev,
          [url]: { loading: false, loaded: false, error: true }
        }));
        
        // Log only in development to avoid console spam in production
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Image failed to load: ${url}`);
        }
        
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      // Start loading
      img.src = url;
    });
  }, [loadingStates]);
  
  // Get cache statistics for debugging
  const getCacheStats = useCallback(() => {
    return {
      size: cacheRef.current.size,
      urls: Array.from(cacheRef.current.keys())
    };
  }, []);
  
  const value: ImageCacheContextValue = {
    preloadImage,
    getCachedImage,
    getLoadingState,
    isCached,
    getCacheStats
  };
  
  return (
    <ImageCacheContext.Provider value={value}>
      {children}
    </ImageCacheContext.Provider>
  );
};

export const useImageCache = () => {
  const context = useContext(ImageCacheContext);
  if (!context) {
    throw new Error('useImageCache must be used within ImageCacheProvider');
  }
  return context;
};

