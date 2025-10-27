import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchFilters from "./SearchFilters";
import PropertyCard from "./cards/PropertyCard";
import { normalizePropertyData, Property } from "../types";
import api from "../config/api";
import analytics from "../utils/analytics";

const PAGE_SIZE = 12;

interface SearchFiltersType {
  location?: string;
  search?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  bedrooms?: string | number;
  bathrooms?: string | number;
  propertyType?: string;
  amenities?: string[];
  order?: string;
  country?: string;
}

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
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get("location") || "";
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollVelocity = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const debounceTimer = useRef<number | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState("recommended");
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({
    location: initialLocation,
  });

  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [currentPage]);

  // Optimized scroll handling with velocity detection and debouncing
  useEffect(() => {
    const COLLAPSE_THRESHOLD = 30;      // Pixels scrolled down before collapsing
    const EXPAND_THRESHOLD = 20;        // Pixels scrolled up before expanding
    const VELOCITY_MULTIPLIER = 0.3;    // Sensitivity to scroll speed
    const TOP_ZONE = 100;               // Always show filters near top
    const MIN_SCROLL_FOR_HIDE = 200;    // Minimum scroll position before hiding
    const DEBOUNCE_DELAY = 150;         // Delay before state update (ms)

    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const now = Date.now();
        const timeDelta = Math.max(now - lastScrollTime.current, 1);
        const scrollDiff = currentScrollY - lastScrollY.current;
        
        // Calculate scroll velocity (pixels per ms)
        const velocity = Math.abs(scrollDiff) / timeDelta;
        scrollVelocity.current = velocity;
        
        // Clear any pending debounce
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        // Function to update filter visibility
        const updateFilterVisibility = () => {
          // Always expand at the very top
          if (currentScrollY < TOP_ZONE) {
            setIsFiltersExpanded(true);
          }
          // Scrolling up - expand with velocity consideration
          else if (scrollDiff < 0) {
            const expandThreshold = EXPAND_THRESHOLD - (velocity * VELOCITY_MULTIPLIER);
            if (scrollDiff < -expandThreshold) {
              setIsFiltersExpanded(true);
            }
          }
          // Scrolling down - collapse with velocity consideration
          else if (scrollDiff > 0 && currentScrollY > MIN_SCROLL_FOR_HIDE) {
            const collapseThreshold = COLLAPSE_THRESHOLD - (velocity * VELOCITY_MULTIPLIER);
            if (scrollDiff > collapseThreshold) {
              setIsFiltersExpanded(false);
            }
          }
        };

        // Debounce the state update for smoother transitions
        debounceTimer.current = setTimeout(updateFilterVisibility, DEBOUNCE_DELAY);
        
        lastScrollY.current = currentScrollY;
        lastScrollTime.current = now;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);

      const qp: Record<string, string> = {
        page_size: PAGE_SIZE.toString(),
      };
      if (searchFilters.search)        qp.search        = searchFilters.search;
      if (currentPage !== 1)           qp.page          = currentPage.toString();
      if (searchFilters.minPrice)      qp.price_min     = String(searchFilters.minPrice);
      if (searchFilters.maxPrice)      qp.price_max     = String(searchFilters.maxPrice);
      if (searchFilters.bedrooms)      qp.bedrooms      = String(searchFilters.bedrooms);
      if (searchFilters.bathrooms)     qp.bathrooms     = String(searchFilters.bathrooms);
      if (searchFilters.propertyType)  qp.property_type = searchFilters.propertyType;
      if (sortOption)                  qp.sort          = sortOption;
      if (searchFilters.location)      qp.location      = searchFilters.location;
      if (searchFilters.country)       qp.country       = searchFilters.country;
      if (searchFilters.amenities && searchFilters.amenities.length > 0) {
        qp.amenities = searchFilters.amenities.join(',');
      }

      console.log(`Fetching ${listingType.toUpperCase()} with query params:`, qp);

      try {
        // Call the appropriate API endpoint based on listing type
        const apiFn = listingType === "sale" ? api.properties.buy : api.properties.rent;
        const paginatedData = await apiFn(qp);
        console.log(`${listingType.toUpperCase()} pagination data:`, paginatedData);

        const normalized = (paginatedData.results || []).map(normalizePropertyData);
        setProperties(normalized);
        setTotalCount(paginatedData.count || 0);
        setTotalPages(Math.ceil((paginatedData.count || 0) / PAGE_SIZE));

        analytics.trackPropertySearch({
          search_term: searchFilters.search,
          property_type: searchFilters.propertyType,
          min_price: searchFilters.minPrice ? Number(searchFilters.minPrice) : undefined,
          max_price: searchFilters.maxPrice ? Number(searchFilters.maxPrice) : undefined,
          bedrooms: searchFilters.bedrooms ? Number(searchFilters.bedrooms) : undefined,
          bathrooms: searchFilters.bathrooms ? Number(searchFilters.bathrooms) : undefined,
          location: searchFilters.location,
          property_status: listingType,
          sort_by: sortOption,
          results_count: paginatedData.count,
        });
      } catch (err) {
        console.error(`Error fetching ${listingType.toUpperCase()} properties:`, err);
        setError("Failed to fetch properties. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [sortOption, searchFilters.search, searchFilters.minPrice, searchFilters.maxPrice, searchFilters.bedrooms, searchFilters.bathrooms, searchFilters.propertyType, searchFilters.location, searchFilters.country, searchFilters.amenities, currentPage, listingType]);


  const displayed = properties;

  const handleSearch = (f: SearchFiltersType) => {
    setSearchFilters(f);
    setCurrentPage(1);
  };

  // Check if there are active filters
  const hasActiveFilters = searchFilters.location || searchFilters.country || 
    searchFilters.minPrice || searchFilters.maxPrice || searchFilters.propertyType || 
    searchFilters.bedrooms || searchFilters.bathrooms || 
    (searchFilters.amenities && searchFilters.amenities.length > 0);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    analytics.trackSortChange(newSort, totalCount);
    setSortOption(newSort);
    setCurrentPage(1);
  };

  const goToPage = (p: number) => setCurrentPage(p);
  const prev = () => currentPage > 1 && setCurrentPage(p => p - 1);
  const next = () => currentPage < totalPages && setCurrentPage(p => p + 1);

  const sortOptions = [
    { value: "recommended", label: "Recommended" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Enhanced Hero Header */}
      <div className={`relative bg-gradient-to-br ${theme.gradient} text-white overflow-hidden`}>
        <div className={`absolute inset-0 ${theme.radialGradient1}`}></div>
        <div className={`absolute inset-0 ${theme.radialGradient2}`}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r ${theme.textGradient} bg-clip-text text-transparent`}>
              {theme.title}
            </h1>
            <div className={`flex items-center justify-center mt-3 ${theme.iconColor}`}>
              <MapPin className="h-5 w-5 mr-2 animate-pulse" />
              <span className="text-lg">{theme.subtitle}</span>
            </div>
          </motion.div>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${theme.borderColor} to-transparent`}></div>
      </div>

      {/* Enhanced Sticky Search Filters - Only show when expanded OR when collapsed with active filters */}
      {(isFiltersExpanded || hasActiveFilters) && (
        <motion.div 
          initial={false}
          animate={{ 
            opacity: 1,
            y: 0,
          }}
          transition={{ 
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1], // Custom easing for smooth motion
          }}
          className="bg-white/98 backdrop-blur-md border-b border-gray-200 sticky top-16 z-40 shadow-lg"
        >
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="sync">
              {isFiltersExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ 
                    duration: 0.25,
                    ease: [0.4, 0.0, 0.2, 1],
                  }}
                  className="px-4 sm:px-6 lg:px-8 pt-5 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <SlidersHorizontal className={`h-4 w-4 ${theme.filterIconColor}`} />
                    <span className="text-sm font-semibold text-gray-700">Refine Your Search</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <SearchFilters
              forSale={listingType === "sale"}
              onSearch={handleSearch}
              initialLocation={initialLocation}
              isExpanded={isFiltersExpanded}
            />
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Results Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center">
                  <div className="relative">
                    <div className={`animate-spin rounded-full h-8 w-8 border-3 ${theme.spinnerColor} border-t-transparent`}></div>
                    <div className={`absolute inset-0 rounded-full border-3 ${theme.spinnerBgColor}`}></div>
                  </div>
                  <span className="text-gray-600 text-sm ml-4 font-medium">Searching properties...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <p className="text-gray-900 font-bold text-2xl sm:text-3xl">
                      {totalCount.toLocaleString()}
                    </p>
                    <p className="text-gray-600 font-medium text-lg">
                      {totalCount === 1 ? 'Property' : 'Properties'} Available
                    </p>
                  </div>
                  {searchFilters.country && (
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{searchFilters.country}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortOption}
                onChange={handleSortChange}
                disabled={isLoading}
                className={`px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 ${theme.focusRingColor} ${theme.focusBorderColor} bg-white text-sm font-medium text-gray-700 transition-all hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
              >
                {sortOptions.map(option => (
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
                <div className={`animate-spin rounded-full h-16 w-16 border-4 ${theme.spinnerColor} border-t-transparent`}></div>
                <div className={`absolute inset-0 rounded-full border-4 ${theme.spinnerBgColor}`}></div>
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
              <div className={`w-24 h-24 bg-gradient-to-br ${theme.emptyStateGradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                <MapPin className={`h-12 w-12 ${theme.emptyStateIconColor}`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Properties Found
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We couldn't find any {theme.emptyStateText} matching your search criteria. Try adjusting your filters or search in a different area.
              </p>
              <button
                onClick={() => {
                  setSearchFilters({});
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              {displayed.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  onClick={() => {
                    try {
                      if (navigator.sendBeacon) {
                        const data = JSON.stringify({
                          property_id: property.id,
                          position: index + 1
                        });
                        const blob = new Blob([data], { type: 'application/json' });
                        navigator.sendBeacon('/api/analytics/search/click/', blob);
                      }
                    } catch (err) {
                      console.error('Failed to track search click:', err);
                    }
                  }}
                  className="group"
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
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
            <nav className="inline-flex items-center gap-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
              <button
                onClick={prev}
                disabled={currentPage === 1}
                className={`p-3 rounded-xl transition-all ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : `text-gray-700 ${theme.paginationHoverBg} ${theme.paginationHoverText} active:scale-95`
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNumber;
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
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber)}
                      className={`min-w-[44px] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        currentPage === pageNumber
                          ? `bg-gradient-to-br ${theme.paginationActiveGradient} text-white shadow-md ${theme.paginationActiveShadow} scale-105`
                          : 'text-gray-700 hover:bg-gray-100 active:scale-95'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={next}
                disabled={currentPage === totalPages}
                className={`p-3 rounded-xl transition-all ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : `text-gray-700 ${theme.paginationHoverBg} ${theme.paginationHoverText} active:scale-95`
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </motion.div>
        )}

        {/* Subtle page indicator text */}
        {totalPages > 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-6 text-sm text-gray-500"
          >
            Page {currentPage} of {totalPages}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default ListingsPage;

