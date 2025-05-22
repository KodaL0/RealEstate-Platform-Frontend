import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,             // ← NEW
} from "react";
import { useSearchParams } from "react-router-dom"; // Import useSearchParams
import { MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // ← NEW
import SearchFilters from "../components/SearchFilters";
import PropertyCard from "../components/PropertyCard";
import { normalizePropertyData } from "../types";

const PAGE_SIZE = 9;                     // 9 cards per page
const API_URL = "https://api.propertpro.com";

const Rent = () => {
  const [searchParams] = useSearchParams(); // Get search params
  const initialLocation = searchParams.get('location') || ''; // Get initial location

  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState("recommended");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<any>({ location: initialLocation });

  /* ───── scroll back to top when page changes ───── */
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [currentPage]);

  /* ───── FETCH PROPERTIES ───── */
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
      try {
        /* build query params */
        const qs = new URLSearchParams();
        if (sortOption !== "recommended") qs.append("sort", sortOption);
        if (searchFilters.minPrice)   qs.append("minPrice",   searchFilters.minPrice);
        if (searchFilters.maxPrice)   qs.append("maxPrice",   searchFilters.maxPrice);
        if (searchFilters.bedrooms)   qs.append("bedrooms",   searchFilters.bedrooms);
        if (searchFilters.bathrooms)  qs.append("bathrooms",  searchFilters.bathrooms);
        if (searchFilters.propertyType) qs.append("propertyType", searchFilters.propertyType);
        if (searchFilters.location)   qs.append("location",   searchFilters.location);

        const query = qs.toString() ? `?${qs.toString()}` : "";

        /* fetch properties from API */
        const url = `${API_URL}/api/properties/rent${query}`;

        const response = await fetch(url, {
          method: "GET",
          headers: { 
            Accept: "application/json", 
            "Content-Type": "application/json" 
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error fetching properties (${response.status})`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Non-JSON response: ${text.slice(0, 100)}`);
        }

        const data = await response.json();

        /* normalise */
        const arr = Array.isArray(data)
          ? data
          : data.results && Array.isArray(data.results)
          ? data.results
          : [];

        const normal = normalizePropertyData(arr);
        setAllProperties(normal);
        setFilteredProperties(normal);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties. Please try again.");
        setAllProperties([]);
        setFilteredProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [sortOption, searchFilters]);

  /* ───── pagination helpers ───── */
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const displayedProperties = filteredProperties.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredProperties.length / PAGE_SIZE);

  const handleSearch = (filters: any) => {
    setSearchFilters(filters);
    setCurrentPage(1);
  };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  const goToPage = (p: number) => setCurrentPage(p);
  const handlePreviousPage = () => currentPage > 1 && setCurrentPage(p => p - 1);
  const handleNextPage = () =>
    currentPage < totalPages && setCurrentPage(p => p + 1);

  /* ───── JSX ───── */
  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 bg-gradient-to-r from-indigo-600 to-purple-600 h-auto">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
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
        </div>
      </section>

      {/* Search Filters */}
      <section className="container mx-auto px-4 mt-4">
        <SearchFilters
          forSale={false}
          onSearch={handleSearch}
          initialLocation={initialLocation}
          buttonClassName="bg-purple-600 hover:bg-purple-700 text-white"
        />
      </section>

      {/* Properties List */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Available Properties
            </h2>
            <p className="text-gray-600">
              {isLoading
                ? "Loading properties..."
                : `${filteredProperties.length} properties found`}
            </p>
          </div>

          <div className="flex items-center">
            <label htmlFor="sort" className="mr-2 text-gray-700">
              Sort by:
            </label>
            <select
              id="sort"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
              value={sortOption}
              onChange={handleSortChange}
              disabled={isLoading}
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading / Empty / Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              No properties match your search criteria
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or explore our other listings
            </p>
            <button
              onClick={() => {
                setSearchFilters({});
                setSortOption("recommended");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mt-4"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          /* -------- animated grid -------- */
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

        {/* Pagination */}
        {!isLoading && filteredProperties.length > 0 && totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                className={`px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === page
                      ? "bg-indigo-600 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={handleNextPage}
                className={`px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={currentPage === totalPages}
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
