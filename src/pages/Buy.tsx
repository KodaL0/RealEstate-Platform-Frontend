import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchFilters from "../components/SearchFilters";
import PropertyCard from "../components/cards/PropertyCard";
import { normalizePropertyData, Property } from "../types";
import api from "../config/api";
import analytics from "../utils/analytics";

const useScrollDirection = () => {
  const [showFilters, setShowFilters] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      if (scrollY < 100) {
        setShowFilters(true);
      } else if (scrollY < lastScrollY.current - 50) {
        setShowFilters(true);
      } else if (scrollY > lastScrollY.current + 10) {
        setShowFilters(false);
      }

      lastScrollY.current = scrollY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return showFilters;
};

const PAGE_SIZE = 10;

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

const Buy = () => {
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get("location") || "";
  const showFilters = useScrollDirection();

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

      console.log("Fetching BUY with query params:", qp);

      try {
        const paginatedData = await api.properties.buy(qp);
        console.log("BUY pagination data:", paginatedData);

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
          property_status: 'sale',
          sort_by: sortOption,
          results_count: paginatedData.count,
        });
      } catch (err) {
        console.error("Error fetching BUY properties:", err);
        setError("Failed to fetch properties. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [sortOption, searchFilters.search, searchFilters.minPrice, searchFilters.maxPrice, searchFilters.bedrooms, searchFilters.bathrooms, searchFilters.propertyType, searchFilters.location, searchFilters.country, searchFilters.amenities, currentPage]);


  const displayed = properties;

  const handleSearch = (f: SearchFiltersType) => {
    setSearchFilters(f);
    setCurrentPage(1);
  };

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
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(14,165,233,0.1),transparent_50%)]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Properties for Sale
            </h1>
            <div className="flex items-center justify-center mt-3 text-blue-100">
              <MapPin className="h-5 w-5 mr-2 animate-pulse" />
              <span className="text-lg">Discover your dream home today</span>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
      </div>

      {/* Enhanced Sticky Search Filters */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: showFilters ? 0 : -200 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-16 z-10 shadow-lg"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Refine Your Search</span>
          </div>
          <SearchFilters
            forSale
            onSearch={handleSearch}
            initialLocation={initialLocation}
          />
        </div>
      </motion.div>

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
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
                    <div className="absolute inset-0 rounded-full border-3 border-blue-200"></div>
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
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 transition-all hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              </div>
              <p className="text-gray-700 font-medium mt-6 text-lg">Finding perfect properties for you...</p>
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
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MapPin className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Properties Found
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We couldn't find any properties matching your search criteria. Try adjusting your filters or search in a different area.
              </p>
              <button
                onClick={() => {
                  setSearchFilters({});
                  setSortOption("recommended");
                }}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8"
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
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 active:scale-95'
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
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200 scale-105'
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
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 active:scale-95'
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

export default Buy;
