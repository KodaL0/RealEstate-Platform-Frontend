// src/pages/Buy.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchFilters from "../components/SearchFilters";
import PropertyCard from "../components/PropertyCard";
import { normalizePropertyData } from "../types";

const PAGE_SIZE = 9;
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const Buy: React.FC = () => {
  // ───────── safe‐area detection ─────────
  const [inApp, setInApp] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ReactNativeWebView) {
      setInApp(true);
    }
  }, []);

  // ───────── search params & initial state ─────────
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get("location") || "";

  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState("recommended");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<any>({
    location: initialLocation,
  });

  // smooth scroll to top on page change
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [currentPage]);

  // fetch properties when filters or sort change
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (sortOption !== "recommended") params.append("sort", sortOption);
        if (searchFilters.minPrice)   params.append("minPrice",   searchFilters.minPrice);
        if (searchFilters.maxPrice)   params.append("maxPrice",   searchFilters.maxPrice);
        if (searchFilters.bedrooms)   params.append("bedrooms",   searchFilters.bedrooms);
        if (searchFilters.bathrooms)  params.append("bathrooms",  searchFilters.bathrooms);
        if (searchFilters.propertyType)
          params.append("propertyType", searchFilters.propertyType);
        if (searchFilters.location)   params.append("location",   searchFilters.location);

        const qs = params.toString() ? `?${params.toString()}` : "";
        const DIRECT_URL = "https://propertprodjango.onrender.com/api/properties/buy" + qs;
        const PROXY_URL  = `${API_BASE_URL}/properties/buy${qs}`;

        // try direct first
        let response: Response;
        try {
          response = await fetch(DIRECT_URL, { signal: AbortSignal.timeout(5000) });
          if (!response.ok) throw new Error("Direct failed");
        } catch {
          // fallback to proxy
          response = await fetch(PROXY_URL);
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error ${response.status}: ${text.slice(0,100)}`);
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : data.results || [];
        const normalized = normalizePropertyData(list);
        setAllProperties(normalized);
        setFilteredProperties(normalized);
      } catch (e: any) {
        console.error(e);
        setError("Failed to load properties. Please try again.");
        setAllProperties([]);
        setFilteredProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [sortOption, searchFilters]);

  // pagination helpers
  const startIndex    = (currentPage - 1) * PAGE_SIZE;
  const displayed     = filteredProperties.slice(startIndex, startIndex + PAGE_SIZE);
  const totalPages    = Math.ceil(filteredProperties.length / PAGE_SIZE);

  const handleSearch     = (f: any) => { setSearchFilters(f); setCurrentPage(1); };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };
  const goToPage         = (p: number) => setCurrentPage(p);
  const prevPage         = () => currentPage > 1 && setCurrentPage(p => p - 1);
  const nextPage         = () => currentPage < totalPages && setCurrentPage(p => p + 1);

  return (
    <div
      className="bg-gray-50 min-h-screen"
      style={inApp ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
    >
      {/* Hero Section */}
      <section className="relative py-12 bg-gradient-to-r from-blue-600 to-indigo-600">
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Properties</h2>
            <p className="text-gray-600">
              {isLoading ? "Loading properties..." : `${filteredProperties.length} properties found`}
            </p>
          </div>
          <div className="flex items-center">
            <label htmlFor="sort" className="mr-2 text-gray-700">Sort by:</label>
            <select
              id="sort"
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              value={sortOption}
              onChange={handleSortChange}
              disabled={isLoading}
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price (Low &#8593;)</option>
              <option value="price-desc">Price (High &#8595;)</option>
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

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">No properties match your search criteria</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or explore other listings</p>
            <button
              onClick={() => { setSearchFilters({}); setSortOption("recommended"); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
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
              transition={{ duration: 0.45 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {displayed.map(p => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {!isLoading && filteredProperties.length > 0 && totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md"
              >Previous</button>
              {Array.from({length: totalPages}, (_, i) => (
                <button
                  key={i+1}
                  onClick={() => goToPage(i+1)}
                  className={`px-4 py-2 rounded-md ${currentPage===i+1? "bg-blue-600 text-white":"border"}`}
                >
                  {i+1}
                </button>
              ))}
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-md"
              >Next</button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
};

export default Buy;
