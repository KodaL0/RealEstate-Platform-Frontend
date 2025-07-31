import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Filter, Grid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchFilters from "../components/SearchFilters";
import PropertyCard from "../components/PropertyCard";
import { normalizePropertyData, Property, COUNTRY_OPTIONS } from "../types";
import api from "../config/api";

const PAGE_SIZE = 10;

interface SearchFiltersType {
  location?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  order?: string;
  country?: string;
}

const Buy = () => {
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get("location") || "";

  const [properties, setProperties] = useState<Property[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState("recommended");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCountry, setSelectedCountry] = useState<'Cyprus' | 'Greece' | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
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
        page:      currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
        sort:      sortOption,
      };
      if (searchFilters.search)        qp.search        = searchFilters.search;
      if (searchFilters.minPrice)      qp.price_min     = searchFilters.minPrice;
      if (searchFilters.maxPrice)      qp.price_max     = searchFilters.maxPrice;
      if (searchFilters.bedrooms)      qp.bedrooms      = searchFilters.bedrooms;
      if (searchFilters.bathrooms)     qp.bathrooms     = searchFilters.bathrooms;
      if (searchFilters.propertyType)  qp.property_type = searchFilters.propertyType;
      if (searchFilters.location)      qp.location      = searchFilters.location;
      if (searchFilters.country)       qp.country       = searchFilters.country;
  
      try {
        const paginatedData = await api.properties.buy(qp);
        const normalized   = (paginatedData.results || []).map(normalizePropertyData);
        setProperties(normalized);
        setTotalCount(paginatedData.count || 0);
        setTotalPages(Math.ceil((paginatedData.count || 0) / PAGE_SIZE));
      } catch {
        setError("Failed to fetch properties. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchProperties();
  }, [sortOption, searchFilters, currentPage]);

    fetchProperties();
  }, [sortOption, searchFilters, currentPage]);

  // Update search filters when country changes
  useEffect(() => {
    const countryFilter = selectedCountry === 'all' ? undefined : selectedCountry;
    setSearchFilters(prev => ({
      ...prev,
      country: countryFilter
    }));
    setCurrentPage(1);
  }, [selectedCountry]);

  const displayed = properties;

  const handleSearch = (f: SearchFiltersType) => {
    setSearchFilters(f);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  const handleCountryChange = (country: 'Cyprus' | 'Greece' | 'all') => {
    setSelectedCountry(country);
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

  const countryOptions = [
    { value: 'all', label: 'All Countries', flag: '🌍' },
    { value: 'Cyprus', label: 'Cyprus', flag: '🇨🇾' },
    { value: 'Greece', label: 'Greece', flag: '🇬🇷' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-3xl font-bold text-gray-900">Properties for Sale</h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Discover your dream home</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Country Filter */}
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-3 hidden sm:block">Country:</span>
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    {countryOptions.map((country) => (
                      <button
                        key={country.value}
                        onClick={() => handleCountryChange(country.value as 'Cyprus' | 'Greece' | 'all')}
                        className={`px-3 py-2 rounded-md transition-colors text-sm font-medium flex items-center space-x-2 ${
                          selectedCountry === country.value 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <span className="text-base">{country.flag}</span>
                        <span className="hidden sm:inline">{country.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-3 hidden sm:block">View:</span>
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Filters Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-white border-b border-gray-200"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <SearchFilters
                forSale
                onSearch={handleSearch}
                buttonClassName="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                initialLocation={initialLocation}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
                <span className="text-gray-600">Loading properties...</span>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span> properties found
                </p>
                {selectedCountry !== 'all' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Showing properties in {countryOptions.find(c => c.value === selectedCountry)?.label}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700 mr-3">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortOption}
                onChange={handleSortChange}
                disabled={isLoading}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
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
                  setSelectedCountry('all');
                  setShowFilters(false);
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
              key={`${currentPage}-${viewMode}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 lg:grid-cols-2 gap-8"
                  : "space-y-6"
              }
            >
              {displayed.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PropertyCard property={property} viewMode={viewMode} />
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
