import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Building2, MapPin, Filter, Grid, List, ChevronLeft, ChevronRight, Star, Award, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Developer } from "../types";
import api from "../config/api";

const PAGE_SIZE = 12;

interface SearchFiltersType {
  search?: string;
  country?: string;
  specialty?: string;
  minProjects?: string;
  order?: string;
}

type ApiDevelopersResponse =
  | { results: any[]; count: number }
  | any[];

const Developers = () => {
  const [searchParams] = useSearchParams();
  
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState("recommended");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCountry, setSelectedCountry] = useState<'Cyprus' | 'Greece' | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({});

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
    const fetchDevelopers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const qp: Record<string, string> = {
          page_size: PAGE_SIZE.toString(),
        };

        // ordering map (only send if it exists server-side)
        const orderingMap: Record<string, string | undefined> = {
          // remove "recommended" if your API doesn't support it
          "name-asc": "name",
          "name-desc": "-name",
          "projects-desc": "-total_projects", // only if the field exists
          "rating-desc": "-rating",           // only if the field exists
          newest: "-created_at",
        };

        const ordering = orderingMap[sortOption];
        if (ordering) qp.ordering = ordering; // do not send qp.ordering if undefined


        if (searchFilters.search) qp.search = searchFilters.search;
        if (currentPage !== 1) qp.page = currentPage.toString();
        if (searchFilters.country) qp.country = searchFilters.country;
        if (searchFilters.specialty) qp.specialty = searchFilters.specialty;
        if (searchFilters.minProjects) qp.min_projects = searchFilters.minProjects;

        // 🔌 Real API call — your api wrapper prefixes /api automatically
        const { data } = await api.get("dev/v1/orgs", { params: qp });

        // Normalize response (supports DRF-style or plain array)
        const results: any[] = Array.isArray(data) ? data : (data.results ?? []);
        const count: number =
          Array.isArray(data) ? results.length : (typeof data.count === "number" ? data.count : results.length);

        // Map backend objects -> UI Developer shape
        const normalized: Developer[] = results.map((d) => normalizeDeveloper(d));

        setDevelopers(normalized);
        setTotalCount(count);
        setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
      } catch (err) {
        console.error("Error fetching developers:", err);
        setError("Failed to fetch developers. Please try again.");
        setDevelopers([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevelopers();
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
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
    { value: "projects-desc", label: "Most Projects" },
    { value: "rating-desc", label: "Highest Rated" },
    { value: "newest", label: "Newest First" },
  ];

  const countryOptions = [
    { value: 'all', label: 'All Countries', flag: '🌍' },
    { value: 'Cyprus', label: '🇨🇾 Cyprus', flag: '🇨🇾' },
    { value: 'Greece', label: '🇬🇷 Greece', flag: '🇬🇷' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-3xl font-bold text-gray-900">Property Developers</h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>Discover trusted developers and their projects</span>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
                <span className="text-gray-600">Loading developers...</span>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span> developers found
                </p>
                {selectedCountry !== 'all' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Showing developers in {countryOptions.find(c => c.value === selectedCountry)?.label}
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
                {[
                  { value: "recommended", label: "Recommended" },
                  { value: "name-asc", label: "Name: A to Z" },
                  { value: "name-desc", label: "Name: Z to A" },
                  { value: "projects-desc", label: "Most Projects" },
                  { value: "rating-desc", label: "Highest Rated" },
                  { value: "newest", label: "Newest First" },
                ].map(option => (
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
                <h3 className="text-sm font-medium text-red-800">Error loading developers</h3>
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

        {/* Developers Grid/List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Finding trusted developers for you...</p>
            </div>
          </div>
        ) : developers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No developers found
              </h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any developers matching your search criteria.
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
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  : "space-y-6"
              }
            >
              {developers.map((developer, index) => (
                <motion.div
                  key={developer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DeveloperCard developer={developer} viewMode={viewMode} />
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

// Developer Card Component
const DeveloperCard = ({ developer, viewMode }: { developer: Developer; viewMode: 'grid' | 'list' }) => {
  const cardClass = viewMode === 'grid' 
    ? "bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
    : "bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group flex";

  return (
    <Link to={`/developer/${developer.id}`} className={cardClass}>
      <div className={viewMode === 'grid' ? "" : "w-1/3 flex-shrink-0"}>
        <div className="relative h-48 overflow-hidden">
          <img
            src={developer.image || "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800"}
            alt={developer.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {developer.country === 'Cyprus' ? '🇨🇾' : '🇬🇷'} {developer.country}
            </span>
          </div>
        </div>
      </div>
      
      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {developer.name}
          </h3>
          {developer.rating && (
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm font-medium text-gray-700">{developer.rating}</span>
              <span className="ml-1 text-sm text-gray-500">({developer.reviewCount})</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{developer.location}</span>
          {developer.established && (
            <>
              <Calendar className="h-4 w-4 ml-4 mr-1" />
              <span className="text-sm">Est. {developer.established}</span>
            </>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {developer.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {developer.specialties?.slice(0, 3).map((specialty, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {specialty}
            </span>
          ))}
          {developer.specialties && developer.specialties.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{developer.specialties.length - 3} more
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Award className="h-4 w-4 mr-1" />
            <span>{developer.totalProjects} Projects</span>
          </div>
          <div className="flex items-center">
            <Building2 className="h-4 w-4 mr-1" />
            <span>{developer.activeProjects} Active</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Map backend payload to your UI's Developer type
function normalizeDeveloper(d: any): Developer {
  return {
    id: String(d.id ?? d.uuid ?? d.slug ?? ""),
    name: d.name ?? d.title ?? "Unnamed Developer",
    description: d.description ?? "",
    established: d.established ?? d.founded_year ?? undefined,
    location: d.location ?? d.city ?? "",
    country: d.country ?? d.country_name ?? "Cyprus",
    totalProjects: d.total_projects ?? d.projects_total ?? d.totalProjects ?? 0,
    activeProjects: d.active_projects ?? d.projects_active ?? d.activeProjects ?? 0,
    completedProjects: d.completed_projects ?? d.projects_completed ?? d.completedProjects ?? 0,
    specialties: d.specialties ?? d.tags ?? [],
    rating: d.rating ?? d.avg_rating ?? undefined,
    reviewCount: d.review_count ?? d.reviews ?? 0,
    image: d.image ?? d.logo_url ?? d.logo ?? d.cover_image ?? undefined,
    createdAt: d.created_at ?? d.createdAt ?? undefined,
    updatedAt: d.updated_at ?? d.updatedAt ?? undefined,
  };
}

export default Developers;
