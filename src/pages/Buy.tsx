import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,          // ← NEW
} from "react";
import { useSearchParams } from "react-router-dom"; // Import useSearchParams
import { MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // ← NEW
import SearchFilters from "../components/SearchFilters";
import PropertyCard from "../components/PropertyCard";
import { normalizePropertyData } from "../types";

const PAGE_SIZE = 9; // Show 9 property cards per page
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const Buy = () => {
  const [searchParams] = useSearchParams(); // Get search params
  const initialLocation = searchParams.get('location') || ''; // Get initial location

  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState("recommended");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<any>({ location: initialLocation });

  /* ───────── scroll back to top on page change ───────── */
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [currentPage]);

  /* ───────── FETCH PROPERTIES (unchanged) ───────── */
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
      try {
        /* ---------- build query string ---------- */
        const queryParams = new URLSearchParams();
        if (sortOption !== "recommended") queryParams.append("sort", sortOption);
        if (searchFilters.minPrice)   queryParams.append("minPrice",   searchFilters.minPrice);
        if (searchFilters.maxPrice)   queryParams.append("maxPrice",   searchFilters.maxPrice);
        if (searchFilters.bedrooms)   queryParams.append("bedrooms",   searchFilters.bedrooms);
        if (searchFilters.bathrooms)  queryParams.append("bathrooms",  searchFilters.bathrooms);
        if (searchFilters.propertyType) queryParams.append("propertyType", searchFilters.propertyType);
        if (searchFilters.location)   queryParams.append("location",   searchFilters.location);

        const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";

        /* ---------- try direct URL first ---------- */
        const DIRECT_API_URL = "https://propertprodjango.onrender.com/api";
        const proxyUrl  = `${API_BASE_URL}/properties/buy${qs}`;
        const directUrl = `${DIRECT_API_URL}/properties/buy${qs}`;

        let response: Response | undefined;
        let succeeded = false;

        try {
          response = await fetch(directUrl, {
            method: "GET",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            credentials: "omit",
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) succeeded = true;
        } catch (_) {/* ignore and fall back */}

        /* ---------- if direct fails, try proxy ---------- */
        if (!succeeded) {
          try {
            response = await fetch(proxyUrl, {
              method: "GET",
              headers: { Accept: "application/json", "Content-Type": "application/json" },
              credentials: "omit",
            });
          } catch (proxyErr: unknown) {
            throw new Error(
              `Error fetching properties via proxy: ${
                proxyErr instanceof Error ? proxyErr.message : String(proxyErr)
              }`
            );
          }
        }

        if (!response) throw new Error("No valid response from either API");

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Error ${response.status}: ${errText.slice(0, 100)}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Server returned non-JSON: ${text.slice(0, 100)}`);
        }

        const raw = await response.text();
        let data: any;
        try {
          data = JSON.parse(raw);
        } catch (parseErr: unknown) {
          throw new Error(`JSON parse error: ${
            parseErr instanceof Error ? parseErr.message : String(parseErr)
          }`);
        }

        /* ---------- normalize & save ---------- */
        if (Array.isArray(data)) {
          const normalized = normalizePropertyData(data);
          setAllProperties(normalized);
          setFilteredProperties(normalized);
        } else if (data.results && Array.isArray(data.results)) {
          const normalized = normalizePropertyData(data.results);
          setAllProperties(normalized);
          setFilteredProperties(normalized);
        } else {
          setAllProperties([]);
          setFilteredProperties([]);
        }
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

  /* ───────── pagination helpers ───────── */
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const displayedProperties = filteredProperties.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredProperties.length / PAGE_SIZE);

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
  const handleNextPage = () =>
    currentPage < totalPages && setCurrentPage(p => p + 1);

  /* ───────── JSX ───────── */
  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 bg-gradient-to-r from-blue-600 to-indigo-600 h-auto">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Properties for Sale
            </h1>
            <p className="text-lg text-white/90 mb-2">
              Browse our exclusive collection of properties for sale
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
          forSale
          onSearch={handleSearch}
          buttonClassName="bg-green-600 text-white font-semibold py-1 px-3 rounded-md"
          initialLocation={initialLocation}
        />
      </section>

      {/* Properties List */}
      <section className="container mx-auto px-4 py-8">
        {/* header */}
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
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

        {/* Loading Indicator / Empty */}
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
          /* ------------- animated grid ------------- */
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
                      ? "bg-blue-600 text-white"
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

export default Buy;
