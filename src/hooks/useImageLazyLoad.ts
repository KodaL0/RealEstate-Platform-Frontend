import { type RefObject, useEffect, useState } from "react";

interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
}

interface LazyLoadResult {
  isVisible: boolean;
  hasBeenVisible: boolean;
}

/**
 * Hook to detect when an element is visible in the viewport using Intersection Observer
 * @param elementRef - Ref to the element to observe
 * @param options - Intersection Observer options
 * @returns Object with isVisible and hasBeenVisible booleans
 */
export const useImageLazyLoad = (
  elementRef: RefObject<HTMLElement>,
  options: LazyLoadOptions = {},
): LazyLoadResult => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  const { rootMargin = "200px", threshold = 0.01 } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!("IntersectionObserver" in window)) {
      // Fallback: assume visible if no support
      setIsVisible(true);
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visible = entry.isIntersecting;
          setIsVisible(visible);

          // Once visible, always mark as has been visible
          if (visible) {
            setHasBeenVisible(true);
          }
        });
      },
      {
        rootMargin,
        threshold,
      },
    );

    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [elementRef, rootMargin, threshold]);

  return { isVisible, hasBeenVisible };
};
