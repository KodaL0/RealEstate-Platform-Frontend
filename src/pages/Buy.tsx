// src/pages/Buy.tsx
import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchFilters from "../components/SearchFilters";
import PropertyCard from "../components/PropertyCard";
import { normalizePropertyData, Property } from "../types";
import api from '../config/api';

const PAGE_SIZE = 9;

interface SearchFiltersType {
  location?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  property_type?: string;
  order?: string;
}

const Buy = () => {
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get('location') || '';

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount]      = useState(0);
  const [totalPages, setTotalPages]      = useState(1);
  const [currentPage, setCurrentPage]    = useState(1);
  const [isLoading, setIsLoading]        = useState(false);
  const [error, setError]                = useState<string | null>(null);
  const [sortOption, setSortOption]      = useState("recommended");
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

      try {
        const queryParams: Record<string, string> = {
          pageSize: PAGE_SIZE.toString(),
          page:     currentPage.toString(),
          sort:     sortOption,
        };
        if (searchFilters.minPrice)  queryParams.minPrice  = searchFilters.minPrice;
        if (searchFilters.maxPrice)  queryParams.maxPrice  = searchFilters.maxPrice;
        if (searchFilters.bedrooms)  queryParams.bedrooms  = searchFilters.bedrooms;
        if (searchFilters.bathrooms) queryParams.bathrooms = searchFilters.bathrooms;
        if (searchFilters.location)  queryParams.location  = searchFilters.location;
        if (searchFilters.search)    queryParams.search    = searchFilters.search;

        console.log("Fetching BUY with query params:", queryParams);

        const response = await api.properties.buy(queryParams);
        const rawData = response.data;
        console.log("BUY response.data:", rawData); // ← inspect the payload

        // Defensive extraction of the array
        const results: any[] = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData.results)
            ? rawData.results
            : Array.isArray(rawData.data)
              ? rawData.data
              : [];

        // Normalize & set state
        const normalized = results.map(normalizePropertyData);
        setAllProperties(normalized);
        setFilteredProperties(normalized);

        // Determine count (either from payload or fallback to length)
        const count =
          typeof rawData.count === 'number'
            ? rawData.count
            : normalized.length;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / PAGE_SIZE));
      } catch (err) {
        console.error("Error fetching BUY properties:", err);
        setError('Failed to fetch properties. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [sortOption, searchFilters, currentPage]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const displayedProperties = filteredProperties.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const handleSearch = (f: any) => {
    setSearchFilters(f);
    setCurrentPage(1);
  };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };
  const goToPage = (p: number) => setCurrentPage(p);
  const handlePreviousPage = () => currentPage > 1 && setCurrentPage(p => p - 1);
  const handleNextPage     = () => currentPage < totalPages && setCurrentPage(p => p + 1);

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="relative py-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-3">Properties for Sale</h1>
          <p className="text-lg text-white/90 mb-2">
            Browse our exclusive collection of properties for sale
          </p>
          <div className="flex items-center text-white/80">
            <MapPin className="h-5 w-5 mr-2" />
            <span>Properties available nationwide</span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 mt-4">
        <SearchFilters
          forSale
          onSearch={handleSearch}
          buttonClassName="bg-green-600 text-white font-semibold py-1 px-3 rounded-md"
          initialLocation={initialLocation}
        />
      </section>

      {/* Listings */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Available Properties</h2>
            <p className="text-gray-600">
              {isLoading
                ? "Loading properties..."
                : `${filteredProperties.length} properties found`}
            </p>
          </div>
          <div className="flex items-center">
            <label htmlFor="sort" className="mr-2">Sort by:</label>
            <select
              id="sort"
              value={sortOption}
              onChange={handleSortChange}
              disabled={isLoading}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
          </div>
        ) : displayedProperties.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">No properties match your search criteria</h3>
            <button
              onClick={() => {
                setSearchFilters({});
                setSortOption("recommended");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {displayedProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-md"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
};

export default Buy;
