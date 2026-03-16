import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../config/api";
import { normalizePropertyData, type Property, type UnifiedListingItem } from "../types";
import analytics from "../utils/analytics";
import {
  type CanonicalExtras,
  decodeCanonicalPath,
  decodeLegacyQuery,
  encodeCanonicalPath,
  type ListingType as RouteListingType,
  type SearchFilterState,
} from "../utils/searchCanonical";
import ActiveFilters from "./ActiveFilters";
import ProjectCard from "./cards/ProjectCard";
import PropertyCard from "./cards/PropertyCard";
import SEO from "./SEO";
import SearchFilters from "./SearchFilters";

const PAGE_SIZE = 12;
const SITE_URL = "https://www.propertpro.com";
const LEGACY_QUERY_KEY_MAP: Record<string, string> = {
  location: "location",
  country: "country",
  minprice: "minPrice",
  maxprice: "maxPrice",
  type: "type",
  beds: "beds",
  baths: "baths",
  amenities: "amenities",
  sort: "sort",
  page: "page",
};
const LEGACY_QUERY_KEY_SET = new Set(Object.keys(LEGACY_QUERY_KEY_MAP));

const capitalizeWords = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatPropertyType = (value: string): string => capitalizeWords(value.replace(/_/g, " "));

type FilterState = SearchFilterState;

export type ListingType = "sale" | "rent";

interface ListingsPageProps {
  /** Type of listings to display: 'sale' for Buy page, 'rent' for Rent page */
  listingType: ListingType;
}

interface ThemeConfig {
  gradient: string;
  radialGradient1: string;
  radialGradient2: string;
  borderColor: string;
  textGradient: string;
  iconColor: string;
  title: string;
  subtitle: string;
  spinnerColor: string;
  spinnerBgColor: string;
  filterIconColor: string;
  focusRingColor: string;
  focusBorderColor: string;
  emptyStateGradient: string;
  emptyStateIconColor: string;
  emptyStateText: string;
  buttonGradient: string;
  buttonHoverGradient: string;
  paginationActiveGradient: string;
  paginationActiveShadow: string;
  paginationHoverBg: string;
  paginationHoverText: string;
  loadingText: string;
}

const themeConfigs: Record<ListingType, ThemeConfig> = {
  sale: {
    gradient: "from-slate-900 via-blue-900 to-slate-900",
    radialGradient1: "bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]",
    radialGradient2: "bg-[radial-gradient(circle_at_70%_50%,rgba(14,165,233,0.1),transparent_50%)]",
    borderColor: "via-blue-500",
    textGradient: "from-white via-blue-100 to-white",
    iconColor: "text-blue-100",
    title: "Properties for Sale",
    subtitle: "Discover your dream home today",
    spinnerColor: "border-blue-600",
    spinnerBgColor: "border-blue-200",
    filterIconColor: "text-blue-600",
    focusRingColor: "focus:ring-blue-500",
    focusBorderColor: "focus:border-blue-500",
    emptyStateGradient: "from-blue-100 to-blue-200",
    emptyStateIconColor: "text-blue-600",
    emptyStateText: "properties",
    buttonGradient: "from-blue-600 to-blue-700",
    buttonHoverGradient: "hover:from-blue-700 hover:to-blue-800",
    paginationActiveGradient: "from-blue-600 to-blue-700",
    paginationActiveShadow: "shadow-blue-200",
    paginationHoverBg: "hover:bg-blue-50",
    paginationHoverText: "hover:text-blue-600",
    loadingText: "Finding perfect properties for you...",
  },
  rent: {
    gradient: "from-emerald-900 via-teal-900 to-emerald-900",
    radialGradient1: "bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1),transparent_50%)]",
    radialGradient2: "bg-[radial-gradient(circle_at_70%_50%,rgba(20,184,166,0.1),transparent_50%)]",
    borderColor: "via-emerald-500",
    textGradient: "from-white via-emerald-100 to-white",
    iconColor: "text-emerald-100",
    title: "Properties for Rent",
    subtitle: "Find your perfect rental home today",
    spinnerColor: "border-emerald-600",
    spinnerBgColor: "border-emerald-200",
    filterIconColor: "text-emerald-600",
    focusRingColor: "focus:ring-emerald-500",
    focusBorderColor: "focus:border-emerald-500",
    emptyStateGradient: "from-emerald-100 to-emerald-200",
    emptyStateIconColor: "text-emerald-600",
    emptyStateText: "rental properties",
    buttonGradient: "from-emerald-600 to-emerald-700",
    buttonHoverGradient: "hover:from-emerald-700 hover:to-emerald-800",
    paginationActiveGradient: "from-emerald-600 to-emerald-700",
    paginationActiveShadow: "shadow-emerald-200",
    paginationHoverBg: "hover:bg-emerald-50",
    paginationHoverText: "hover:text-emerald-600",
    loadingText: "Finding perfect rental properties for you...",
  },
};

const ListingsPage: React.FC<ListingsPageProps> = ({ listingType }) => {
  const theme = themeConfigs[listingType];
  const navigate = useNavigate();
  const location = useLocation();
  const { "*": slugParam = "" } = useParams();
  const listingRouteType: RouteListingType = listingType === "sale" ? "buy" : "rent";

  // Track if we've already converted legacy query to prevent loops
  const legacyConvertedRef = useRef(false);

  // Handle legacy query string conversion (only once on mount or when search changes)
  useEffect(() => {
    if (!location.search) {
      legacyConvertedRef.current = false; // Reset when no query string
      return;
    }

    if (legacyConvertedRef.current) return; // Already converted

    const searchParams = new URLSearchParams(location.search);
    let hasLegacyKey = false;
    const normalized = new URLSearchParams();

    searchParams.forEach((value, key) => {
      const normalizedKey = key.toLowerCase();
      if (LEGACY_QUERY_KEY_SET.has(normalizedKey)) {
        hasLegacyKey = true;
        const canonicalKey = LEGACY_QUERY_KEY_MAP[normalizedKey];
        if (canonicalKey && !normalized.has(canonicalKey)) {
          normalized.set(canonicalKey, value);
        }
      }
    });

    if (!hasLegacyKey) {
      legacyConvertedRef.current = true;
      return;
    }

    legacyConvertedRef.current = true;
    const { filters, extras } = decodeLegacyQuery(normalized);
    const canonicalPath = encodeCanonicalPath(listingRouteType, filters, {
      sort: extras.sort,
      page: extras.page,
    });

    if (canonicalPath !== location.pathname) {
      navigate(canonicalPath, { replace: true });
    }
  }, [location.search, location.pathname, listingRouteType, navigate]);

  // Decode canonical path from URL slug
  const decodedCanonical = useMemo(() => {
    return decodeCanonicalPath(slugParam || "");
  }, [slugParam]);

  const canonicalFilters = useMemo<FilterState>(
    () => ({
      location: decodedCanonical.filters.location,
      country: decodedCanonical.filters.country,
      minPrice: decodedCanonical.filters.minPrice,
      maxPrice: decodedCanonical.filters.maxPrice,
      propertyType: decodedCanonical.filters.propertyType,
      bedrooms: decodedCanonical.filters.bedrooms,
      bathrooms: decodedCanonical.filters.bathrooms,
      amenities: decodedCanonical.filters.amenities,
    }),
    [
      decodedCanonical.filters.location,
      decodedCanonical.filters.country,
      decodedCanonical.filters.minPrice,
      decodedCanonical.filters.maxPrice,
      decodedCanonical.filters.propertyType,
      decodedCanonical.filters.bedrooms,
      decodedCanonical.filters.bathrooms,
      decodedCanonical.filters.amenities,
    ],
  );

  useEffect(() => {
    if (!import.meta?.env?.DEV) return;

    const slugFromLocation = slugParam || "";
    const canonicalSlug = encodeCanonicalPath(listingRouteType, decodedCanonical.filters, {
      sort: decodedCanonical.extras.sort,
      page: decodedCanonical.extras.page,
      results: decodedCanonical.extras.results,
    }).replace(`/${listingRouteType}/`, "");

    if (slugFromLocation && slugFromLocation !== canonicalSlug) {
      if (lastMismatchSlugRef.current !== slugFromLocation) {
        lastMismatchSlugRef.current = slugFromLocation;
        // eslint-disable-next-line no-console
        console.warn("[canonical-sync] slug mismatch", {
          slugFromLocation,
          canonicalSlug,
          filters: decodedCanonical.filters,
          extras: decodedCanonical.extras,
        });
      }
    } else if (lastMismatchSlugRef.current) {
      lastMismatchSlugRef.current = null;
    }
  }, [decodedCanonical, listingRouteType, slugParam]);

  const [properties, setProperties] = useState<UnifiedListingItem[]>([]);
  const [totalPages, setTotalPages] = useState(
    Math.max(1, Math.ceil((decodedCanonical.extras.results ?? 0) / PAGE_SIZE)),
  );
  const [totalCount, setTotalCount] = useState(decodedCanonical.extras.results ?? 0);
  const [currentPage, setCurrentPage] = useState(decodedCanonical.extras.page);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState(decodedCanonical.extras.sort);
  const [searchEventId, setSearchEventId] = useState<number | null>(null);

  const [filters, setFilters] = useState<FilterState>(canonicalFilters);
  const [localFilters, setLocalFilters] = useState<FilterState>(canonicalFilters);
  const debounceTimerRef = useRef<number | null>(null);
  const isHydratingRef = useRef(true);
  const lastSyncedSlugRef = useRef<string | null>(slugParam || "");
  const lastResultsSyncedRef = useRef<number | undefined>(decodedCanonical.extras.results);
  const isSyncingRef = useRef(false);
  const lastMismatchSlugRef = useRef<string | null>(null);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setLocalFilters(newFilters);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      setFilters({
        ...newFilters,
        amenities: [...(newFilters.amenities || [])],
      });
      analytics.trackFiltersApplied(newFilters as Record<string, unknown>);
    }, 500);
  }, []);

  const handleRemoveFilter = useCallback(
    (key: keyof FilterState, value?: string) => {
      if (key === "amenities") {
        const updatedAmenities = value ? value.split(",").filter(Boolean) : [];
        handleFiltersChange({
          ...localFilters,
          amenities: updatedAmenities,
        });
      } else if (key === "minPrice" || key === "maxPrice") {
        handleFiltersChange({
          ...localFilters,
          minPrice: "",
          maxPrice: "",
        });
      } else {
        const defaults: Record<keyof FilterState, string | string[]> = {
          location: "",
          country: "All",
          minPrice: "",
          maxPrice: "",
          propertyType: "Any",
          bedrooms: "Any",
          bathrooms: "Any",
          amenities: [],
        };
        handleFiltersChange({
          ...localFilters,
          [key]: defaults[key],
        });
      }
    },
    [localFilters, handleFiltersChange],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Initialize hydration state - prevent initial sync loop
  useEffect(() => {
    // On mount, wait a bit before allowing sync
    const initTimer = setTimeout(() => {
      if (isHydratingRef.current) {
        isHydratingRef.current = false;
      }
    }, 400);

    return () => clearTimeout(initTimer);
  }, []);

  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Only scroll if user is below filter area
    if (window.scrollY > 400) {
      window.scrollTo({ top: 200, left: 0, behavior: "smooth" });
    }
  }, []);

  // Hydrate filters from URL when slug changes (but prevent loops)
  useEffect(() => {
    const normalizedSlug = slugParam || "";

    // Skip if slug hasn't changed
    if (lastSyncedSlugRef.current === normalizedSlug) {
      return;
    }

    // Skip if we're already syncing to prevent loops
    if (isSyncingRef.current) {
      return;
    }

    // Compare current filters with canonical filters to avoid unnecessary updates
    const filtersChanged =
      filters.location !== canonicalFilters.location ||
      filters.country !== canonicalFilters.country ||
      filters.minPrice !== canonicalFilters.minPrice ||
      filters.maxPrice !== canonicalFilters.maxPrice ||
      filters.propertyType !== canonicalFilters.propertyType ||
      filters.bedrooms !== canonicalFilters.bedrooms ||
      filters.bathrooms !== canonicalFilters.bathrooms ||
      (filters.amenities?.join(",") || "") !== (canonicalFilters.amenities?.join(",") || "");

    // Only update if filters actually changed or if this is a new slug
    if (!filtersChanged && lastSyncedSlugRef.current) {
      lastSyncedSlugRef.current = normalizedSlug;
      return;
    }

    const nextFilters: FilterState = {
      ...canonicalFilters,
      amenities: canonicalFilters.amenities || [],
    };

    isHydratingRef.current = true;
    setFilters(nextFilters);
    setLocalFilters(nextFilters);
    setSortOption(decodedCanonical.extras.sort);
    setCurrentPage(decodedCanonical.extras.page);
    setTotalCount(decodedCanonical.extras.results ?? 0);
    setTotalPages(Math.max(1, Math.ceil((decodedCanonical.extras.results ?? 0) / PAGE_SIZE)));
    lastResultsSyncedRef.current = decodedCanonical.extras.results;
    lastSyncedSlugRef.current = normalizedSlug;

    // Mark hydration complete after state updates settle
    const timeout = window.setTimeout(() => {
      isHydratingRef.current = false;
    }, 200);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    slugParam,
    canonicalFilters,
    decodedCanonical.extras.page,
    decodedCanonical.extras.results,
    decodedCanonical.extras.sort,
    filters.amenities?.join,
    filters.bathrooms,
    filters.bedrooms,
    filters.country,
    filters.location,
    filters.maxPrice,
    filters.minPrice,
    filters.propertyType,
  ]);

  // Unified canonical URL sync - only runs when user changes filters, not during hydration
  const syncCanonicalUrl = useCallback(
    (results?: number) => {
      if (isHydratingRef.current || isSyncingRef.current) return;

      const extras: CanonicalExtras = {
        sort: sortOption,
        page: currentPage,
      };
      if (typeof results === "number") {
        extras.results = results;
      }

      const nextPath = encodeCanonicalPath(listingRouteType, filters, extras);
      const slugOnly = nextPath.replace(`/${listingRouteType}/`, "");

      // Only navigate if path actually changed
      if (lastSyncedSlugRef.current !== slugOnly && location.pathname !== nextPath) {
        isSyncingRef.current = true;
        lastSyncedSlugRef.current = slugOnly;
        navigate(nextPath, { replace: true });
        // Reset sync flag after navigation completes
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 300);
      } else if (lastSyncedSlugRef.current !== slugOnly) {
        // Update ref even if we don't navigate (pathname might match)
        lastSyncedSlugRef.current = slugOnly;
      }
    },
    [filters, sortOption, currentPage, listingRouteType, navigate, location.pathname],
  );

  // Sync URL when filters/sort/page change (but not during hydration)
  useEffect(() => {
    if (isHydratingRef.current || isSyncingRef.current) return;

    // Debounce sync to avoid rapid updates
    const syncTimer = setTimeout(() => {
      syncCanonicalUrl();
    }, 100);

    return () => clearTimeout(syncTimer);
  }, [syncCanonicalUrl]);

  useEffect(() => {
    if (isHydratingRef.current) return;
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
      setSearchEventId(null); // Reset search_event_id for new search

      const qp: Record<string, string> = {
        page_size: PAGE_SIZE.toString(),
      };
      if (filters.location) qp.location = filters.location;
      if (filters.country && filters.country !== "All") qp.country = filters.country;
      if (currentPage !== 1) qp.page = currentPage.toString();
      if (filters.minPrice) qp.price_min = filters.minPrice;
      if (filters.maxPrice) qp.price_max = filters.maxPrice;
      if (filters.bedrooms && filters.bedrooms !== "Any")
        qp.bedrooms = filters.bedrooms.replace("+", "");
      if (filters.bathrooms && filters.bathrooms !== "Any")
        qp.bathrooms = filters.bathrooms.replace("+", "");
      if (filters.propertyType && filters.propertyType !== "Any")
        qp.property_type = filters.propertyType;
      if (sortOption) qp.sort = sortOption;
      if (filters.amenities && filters.amenities.length > 0) {
        qp.amenities = filters.amenities.join(",");
      }

      console.log(`Fetching ${listingType.toUpperCase()} with query params:`, qp);

      try {
        // Call the unified listings API endpoint
        const apiFn = listingType === "sale" ? api.listings.buy : api.listings.rent;
        const paginatedData = await apiFn(qp);
        console.log(`${listingType.toUpperCase()} pagination data:`, paginatedData);

        // Handle mixed results (Properties and Projects)
        const normalized = (paginatedData.results || []).map((item: unknown) => {
          const unifiedItem = item as UnifiedListingItem;
          if (unifiedItem._type === "property") {
            const normalizedProperty = normalizePropertyData(
              unifiedItem as unknown as Partial<Property> & Record<string, unknown>,
            );
            return { ...normalizedProperty, _type: "property" as const } as UnifiedListingItem;
          }
          // For projects, return as-is (no normalization needed)
          return unifiedItem;
        });
        
        const count = paginatedData.count ?? 0;
        setProperties(normalized as UnifiedListingItem[]);
        setTotalCount(count); // Use API total count (across all pages)
        setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
        
        // Extract search_event_id from API response for click tracking
        if (paginatedData.search_event_id) {
          setSearchEventId(paginatedData.search_event_id);
        }

        // Update results count in URL after fetch completes
        if (!isHydratingRef.current && !isSyncingRef.current) {
          if (lastResultsSyncedRef.current !== count) {
            lastResultsSyncedRef.current = count;
            syncCanonicalUrl(count);
          }
        } else {
          lastResultsSyncedRef.current = count;
        }

        analytics.trackPropertySearch({
          search_term: undefined,
          property_type: filters.propertyType !== "Any" ? filters.propertyType : undefined,
          min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
          max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
          bedrooms:
            filters.bedrooms && filters.bedrooms !== "Any"
              ? Number(filters.bedrooms.replace("+", ""))
              : undefined,
          bathrooms:
            filters.bathrooms && filters.bathrooms !== "Any"
              ? Number(filters.bathrooms.replace("+", ""))
              : undefined,
          location: filters.location,
          property_status: listingType,
          sort_by: sortOption,
          results_count: count,
        });
        analytics.trackSearchToBackend({
          search_term: undefined,
          property_type: filters.propertyType !== "Any" ? filters.propertyType : undefined,
          min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
          max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
          bedrooms:
            filters.bedrooms && filters.bedrooms !== "Any"
              ? Number(filters.bedrooms.replace("+", ""))
              : undefined,
          bathrooms:
            filters.bathrooms && filters.bathrooms !== "Any"
              ? Number(filters.bathrooms.replace("+", ""))
              : undefined,
          location: filters.location,
          property_status: listingType,
          sort_by: sortOption,
          results_count: count,
        });
      } catch (err) {
        console.error(`Error fetching ${listingType.toUpperCase()} properties:`, err);
        setError("Failed to fetch properties. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [
    sortOption,
    filters.location,
    filters.country,
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
    filters.bathrooms,
    filters.propertyType,
    currentPage,
    listingType,
    filters.amenities,
    syncCanonicalUrl,
  ]);

  const canonicalPath = location.pathname || `/${listingRouteType}`;
  const locationLabel =
    filters.location || (filters.country && filters.country !== "All" ? filters.country : "");
  const propertyLabel =
    filters.propertyType && filters.propertyType !== "Any"
      ? formatPropertyType(filters.propertyType)
      : "Properties";
  const actionLabel = listingType === "sale" ? "for Sale" : "for Rent";
  const metaTitle = `${propertyLabel} ${actionLabel}${locationLabel ? ` in ${locationLabel}` : ""} | PropertPro`;
  const resultsDescriptor = totalCount > 0 ? `${totalCount.toLocaleString()} ` : "the latest ";
  const locationDescriptor = locationLabel
    ? ` in ${locationLabel}`
    : filters.country && filters.country !== "All"
      ? ` in ${filters.country}`
      : "";
  const metaDescription = `Explore ${resultsDescriptor}${propertyLabel.toLowerCase()} ${actionLabel.toLowerCase()}${locationDescriptor}. Refine by price, bedrooms, bathrooms, and amenities on PropertPro.`;

  const breadcrumbs = useMemo(() => {
    const crumbs = [
      { name: "Home", url: "/" },
      { name: listingType === "sale" ? "Buy" : "Rent", url: `/${listingRouteType}` },
    ];
    if (filters.location) {
      crumbs.push({ name: filters.location, url: canonicalPath });
    } else if (filters.country && filters.country !== "All") {
      crumbs.push({ name: filters.country, url: canonicalPath });
    }
    return crumbs;
  }, [listingType, listingRouteType, filters.location, filters.country, canonicalPath]);

  const itemListSchema = useMemo(() => {
    if (!properties.length) return null;
    const basePosition = (currentPage - 1) * PAGE_SIZE;

    const elements = properties.map((item, index) => {
      const url =
        (item._type === "property" ? item.url : undefined) ||
        (item._type === "project" ? `/project/${item.id}` : `/property/${item.id}`);
      const urlString = typeof url === "string" ? url : "";
      const absoluteUrl = urlString.startsWith("http") ? urlString : `${SITE_URL}${urlString}`;
      const primaryImage =
        item._type === "property"
          ? typeof item.images?.[0] === "object" && item.images[0] !== null
            ? item.images[0].image
            : undefined
          : item._type === "project"
            ? item.images?.[0]
            : undefined;
      const imageUrl =
        primaryImage && typeof primaryImage === "string"
          ? primaryImage.startsWith("http")
            ? primaryImage
            : `${SITE_URL}${primaryImage}`
          : undefined;

      const schemaItem: Record<string, unknown> = {
        "@type": "ListItem",
        position: basePosition + index + 1,
        url: absoluteUrl,
        name: item._type === "project" ? item.name : (item as Property).title,
      };

      if (imageUrl) {
        schemaItem.image = imageUrl;
      }

      return schemaItem;
    });

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: totalCount,
      itemListElement: elements,
    };
  }, [properties, currentPage, totalCount]);

  const displayed = properties;

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    analytics.trackSortChange(newSort, totalCount);
    setSortOption(newSort);
  };

  const goToPage = (p: number) => setCurrentPage(p);
  const prev = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  const next = () => currentPage < totalPages && setCurrentPage((p) => p + 1);

  const sortOptions = [
    { value: "recommended", label: "Recommended" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
  ];

  return (
    <>
      <SEO
        title={metaTitle}
        description={metaDescription}
        canonical={canonicalPath}
        url={canonicalPath}
        location={locationLabel || undefined}
        propertyType={filters.propertyType !== "Any" ? filters.propertyType : undefined}
        breadcrumbs={breadcrumbs}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON.stringify escapes content safely
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}

      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Enhanced Hero Header */}
        <div className={`relative bg-gradient-to-br ${theme.gradient} text-white overflow-hidden`}>
          <div className={`absolute inset-0 ${theme.radialGradient1}`}></div>
          <div className={`absolute inset-0 ${theme.radialGradient2}`}></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r ${theme.textGradient} bg-clip-text text-transparent`}
              >
                {theme.title}
              </h1>
              <div className={`flex items-center justify-center mt-2 sm:mt-3 ${theme.iconColor}`}>
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-pulse" />
                <span className="text-base sm:text-lg">{theme.subtitle}</span>
              </div>
            </motion.div>
          </div>

          <div
            className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${theme.borderColor} to-transparent`}
          ></div>
        </div>

        {/* Search Filters - Static position (scrolls away naturally) */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto">
            <div className="px-4 sm:px-6 lg:px-8 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className={`h-4 w-4 ${theme.filterIconColor}`} />
                <span className="text-sm font-semibold text-gray-700">Refine Your Search</span>
              </div>
            </div>
            <SearchFilters filters={localFilters} onFiltersChange={handleFiltersChange} />
            <ActiveFilters filters={localFilters} onRemoveFilter={handleRemoveFilter} />
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* Enhanced Results Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1">
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="relative">
                      <div
                        className={`animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-3 ${theme.spinnerColor} border-t-transparent`}
                      ></div>
                      <div
                        className={`absolute inset-0 rounded-full border-3 ${theme.spinnerBgColor}`}
                      ></div>
                    </div>
                    <span className="text-gray-600 text-xs sm:text-sm ml-3 sm:ml-4 font-medium">
                      Searching properties...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2 sm:gap-3">
                      <p className="text-gray-900 font-bold text-xl sm:text-2xl lg:text-3xl">
                        {totalCount.toLocaleString()}
                      </p>
                      <span className="text-gray-600 text-base sm:text-lg lg:text-xl font-medium">
                        available
                      </span>
                    </div>
                    {filters.country && filters.country !== "All" && (
                      <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>{filters.country}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <label
                  htmlFor="sort"
                  className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap"
                >
                  Sort by:
                </label>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={handleSortChange}
                  disabled={isLoading}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 ${theme.focusRingColor} ${theme.focusBorderColor} bg-white text-xs sm:text-sm font-medium text-gray-700 transition-all hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto`}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-2xl p-8 mb-8 shadow-lg"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-xl">!</span>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-1">Unable to Load Properties</h3>
                  <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Enhanced Loading State */}
          {isLoading ? (
            <div className="flex justify-center py-24">
              <div className="text-center">
                <div className="relative inline-block">
                  <div
                    className={`animate-spin rounded-full h-16 w-16 border-4 ${theme.spinnerColor} border-t-transparent`}
                  ></div>
                  <div
                    className={`absolute inset-0 rounded-full border-4 ${theme.spinnerBgColor}`}
                  ></div>
                </div>
                <p className="text-gray-700 font-medium mt-6 text-lg">{theme.loadingText}</p>
                <p className="text-gray-500 text-sm mt-2">This won't take long</p>
              </div>
            </div>
          ) : displayed.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div className="max-w-md mx-auto">
                <div
                  className={`w-24 h-24 bg-gradient-to-br ${theme.emptyStateGradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                >
                  <MapPin className={`h-12 w-12 ${theme.emptyStateIconColor}`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Properties Found</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  We couldn't find any {theme.emptyStateText} matching your search criteria. Try
                  adjusting your filters or search in a different area.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    // Clear debounce timer
                    if (debounceTimerRef.current) {
                      clearTimeout(debounceTimerRef.current);
                    }

                    const clearedFilters = {
                      location: "",
                      country: "All",
                      minPrice: "",
                      maxPrice: "",
                      propertyType: "Any",
                      bedrooms: "Any",
                      bathrooms: "Any",
                      amenities: [],
                    };

                    // Update both local and actual filters immediately
                    setLocalFilters(clearedFilters);
                    setFilters(clearedFilters);
                    setSortOption("recommended");
                  }}
                  className={`px-8 py-3.5 bg-gradient-to-r ${theme.buttonGradient} ${theme.buttonHoverGradient} text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                >
                  Clear All Filters
                </button>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
              >
                {displayed.map((item, index) => {
                  // Global position in full result set (1-indexed), not just page-local
                  const globalPosition = (currentPage - 1) * PAGE_SIZE + index + 1;
                  return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    onClick={() => {
                      try {
                        if (navigator.sendBeacon && searchEventId) {
                          const isProject = item._type === "project";
                          const payload = {
                            position: globalPosition,
                            item_type: item._type || "property",
                            search_event_id: searchEventId,
                          };
                          if (isProject) {
                            (payload as Record<string, unknown>).project_id = item.id;
                          } else {
                            (payload as Record<string, unknown>).property_id = item.id;
                          }
                          const blob = new Blob([JSON.stringify(payload)], {
                            type: "application/json",
                          });
                          navigator.sendBeacon("/api/analytics/search/click/", blob);
                        }
                      } catch (err) {
                        console.error("Failed to track search click:", err);
                      }
                    }}
                    className="group"
                  >
                    {item._type === "project" ? (
                      <ProjectCard
                        project={{
                          ...item,
                          id: typeof item.id === "string" ? parseInt(item.id, 10) : item.id,
                          images: Array.isArray(item.images)
                            ? item.images.map((img) =>
                                typeof img === "string"
                                  ? { image: img, is_primary: false, display_order: 0 }
                                  : img,
                              )
                            : undefined,
                        }}
                        listingType={listingType}
                      />
                    ) : (
                      <PropertyCard property={item as Property} />
                    )}
                  </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-16 flex justify-center"
            >
              <nav className="inline-flex items-center gap-1 sm:gap-2 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-1.5 sm:p-2">
                <button
                  type="button"
                  onClick={prev}
                  disabled={currentPage === 1}
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : `text-gray-700 ${theme.paginationHoverBg} ${theme.paginationHoverText} active:scale-95`
                  }`}
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNumber: number;
                    if (totalPages <= 7) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 4) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNumber = totalPages - 6 + i;
                    } else {
                      pageNumber = currentPage - 3 + i;
                    }

                    return (
                      <button
                        type="button"
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`min-w-[36px] sm:min-w-[44px] px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                          currentPage === pageNumber
                            ? `bg-gradient-to-br ${theme.paginationActiveGradient} text-white shadow-md ${theme.paginationActiveShadow} scale-105`
                            : "text-gray-700 hover:bg-gray-100 active:scale-95"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={next}
                  disabled={currentPage === totalPages}
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : `text-gray-700 ${theme.paginationHoverBg} ${theme.paginationHoverText} active:scale-95`
                  }`}
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </nav>
            </motion.div>
          )}

          {/* Subtle page indicator text */}
          {totalPages > 1 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500"
            >
              Page {currentPage} of {totalPages}
            </motion.p>
          )}
        </div>
      </div>
    </>
  );
};

export default ListingsPage;
