import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Smooth-scroll the window to the very top on every navigation that
 * actually changes the content users see:
 *   • pathname changes  → /rent → /buy
 *   • search changes    → ?page=1 → ?page=2
 *   • router key changes (same path pushed again with different state)
 * 
 * If the URL contains a #hash (anchor link), we let the browser handle
 * the jump instead of forcing the top.
 */
const ScrollToTop = () => {
  const { pathname, search, hash, key } = useLocation();

  useEffect(() => {
    if (hash) return;                           // allow in-page anchors

    // Delay very slightly so large layout shifts (mobile) finish first
    const id = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, 100);

    return () => clearTimeout(id);              // cleanup if effect re-fires
  }, [pathname, search, key]);                  // 🔑 watch search + key too

  return null;
};

export default ScrollToTop;
