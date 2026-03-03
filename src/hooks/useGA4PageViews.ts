import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_ID = "G-7S7FKWE6F7";

export function useGA4PageViews() {
  const location = useLocation();

  useEffect(() => {
    // Only track after GA is initialized (which only happens after consent in your setup)
    if (!window.gtag || !window.gaInitialized) return;

    window.gtag("config", GA_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location]);
}
