import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchFilters from "../components/SearchFilters";
import PropertyCard from "../components/cards/PropertyCard";
import { normalizePropertyData, Property } from "../types";
import api from "../config/api";
import analytics from "../utils/analytics";

// Custom hook for scroll detection
const useScrollDirection = () => {
  const [showFilters, setShowFilters] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      
      if (scrollY < 100) {
        // Always show at top
        setShowFilters(true);
      } else if (scrollY < lastScrollY.current - 50) {
        // Scrolling up significantly (50px threshold)
        setShowFilters(true);
      } else if (scrollY > lastScrollY.current + 10) {
        // Scrolling down
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

  // scroll to top on page change
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

        // Track search with results
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
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">Properties for Sale</h1>
          <div className="flex items-center justify-center mt-2 text-blue-100">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm sm:text-base">Discover your dream home</span>
          </div>
        </div>
      </div>

      {/* Search Filters - Auto Hide/Show on Scroll */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: showFilters ? 0 : -200 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white border-b border-gray-200 sticky top-16 z-10 shadow-md"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchFilters
            forSale
            onSearch={handleSearch}
            initialLocation={initialLocation}
          />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Results Header */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
                      <span className="text-gray-600 text-sm">Loading...</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-900 font-semibold text-lg">
                        {totalCount.toLocaleString()} {totalCount === 1 ? 'Property' : 'Properties'}
                      </p>
                      {searchFilters.country && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          in {searchFilters.country}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Sort */}
                  <div className="flex items-center">
                    <label htmlFor="sort" className="text-xs sm:text-sm font-medium text-gray-700 mr-2 hidden sm:block">
                      Sort:
                    </label>
                    <select
                      id="sort"
                      value={sortOption}
                      onChange={handleSortChange}
                      disabled={isLoading}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-base"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
                </div>
              </div>
            </div>

            {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading properties</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Properties Grid/List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Finding perfect properties for you...</p>
            </div>
          </div>
        ) : displayed.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No properties found
              </h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any properties matching your search criteria.
              </p>
              <button
                onClick={() => {
                  setSearchFilters({});
                  setSortOption("recommended");
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {displayed.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 flex justify-center"
          >
            <nav className="flex items-center space-x-2">
              <button
                onClick={prev}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
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
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              <button
                onClick={next}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === totalPages
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Buy;
