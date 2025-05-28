// src/pages/Rent.tsx
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
import api from "../config/api";

const PAGE_SIZE = 9;

interface SearchFiltersType {
  location?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
}

const Rent = () => {
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get("location") || "";

  const [properties, setProperties]       = useState<Property[]>([]);
  const [totalPages, setTotalPages]       = useState(1);
  const [currentPage, setCurrentPage]     = useState(1);
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [sortOption, setSortOption]       = useState("recommended");
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({
    location:    initialLocation,
    search:      "",
    minPrice:    "",
    maxPrice:    "",
    bedrooms:    "",
    bathrooms:   "",
    propertyType:""
  });

  // Scroll to top on page change
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
        const qp: Record<string, string> = {
          page_size: PAGE_SIZE.toString(),
        };
        if (searchFilters.search)      qp.search        = searchFilters.search;
        if (currentPage !== 1)         qp.page          = currentPage.toString();
        if (searchFilters.minPrice)    qp.price_min     = searchFilters.minPrice;
        if (searchFilters.maxPrice)    qp.price_max     = searchFilters.maxPrice;
        if (searchFilters.bedrooms)    qp.bedrooms      = searchFilters.bedrooms;
        if (searchFilters.bathrooms)   qp.bathrooms     = searchFilters.bathrooms;
        if (searchFilters.propertyType)qp.property_type = searchFilters.propertyType;
        if (sortOption)                qp.sort_by       = sortOption;
        if (sortOption === "price-asc" || sortOption === "price-desc") {
          qp.order = sortOption === "price-asc" ? "asc" : "desc";
        }
        if (searchFilters.location)    qp.location      = searchFilters.location;

        console.log("Fetching RENT with query params:", qp);

        // rent() now returns pagination data with results
        const paginatedData = await api.properties.rent(qp);
        console.log("RENT pagination data:", paginatedData);

        // Extract results array and normalize
        const resultsArr = paginatedData.results || [];
        const normalized = resultsArr.map(normalizePropertyData);

        setProperties(normalized);
        
        // Calculate total pages from the total count returned by API
        const totalCount = paginatedData.count || 0;
        setTotalPages(Math.ceil(totalCount / PAGE_SIZE));
      } catch (err) {
        console.error("Error fetching RENT properties:", err);
        setError("Failed to fetch properties. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [sortOption, searchFilters, currentPage]);

  // With server-side pagination, we no longer need to slice the properties array
  // Each API response already contains the correct page of properties
  const displayed = properties;

  const handleSearch = (filters: SearchFiltersType) => {
    setSearchFilters(filters);
    setCurrentPage(1);
  };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };
  const goToPage = (p: number) => setCurrentPage(p);
  const prev = () => currentPage > 1 && setCurrentPage(p => p - 1);
  const next = () => currentPage < totalPages && setCurrentPage(p => p + 1);

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="py-12 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-3">
            Properties for Rent
          </h1>
          <p className="text-lg text-white/90 mb-2">
            Explore our curated selection of premium rental properties
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
          forSale={false}
          onSearch={handleSearch}
          initialLocation={initialLocation}
          buttonClassName="bg-purple-600 hover:bg-purple-700 text-white"
        />
      </section>

      {/* Listings */}
      <section className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Available Properties
            </h2>
            <p className="text-gray-600">
              {isLoading
                ? "Loading properties..."
                : `${properties.length} properties found`}
            </p>
          </div>
          <div className="flex items-center">
            <label htmlFor="sort" className="mr-2 text-gray-700">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortOption}
              onChange={handleSortChange}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* Error */}
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

        {/* Loading / Empty / Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">
              No properties match your search criteria
            </h3>
            <button
              onClick={() => {
                setSearchFilters({
                  location: initialLocation,
                  search: "",
                  minPrice: "",
                  maxPrice: "",
                  bedrooms: "",
                  bathrooms: "",
                  propertyType: ""
                });
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
              {displayed.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={prev}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === p
                      ? "bg-indigo-600 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={next}
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

export default Rent;
