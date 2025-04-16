import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import SearchFilters from '../components/SearchFilters';
import PropertyCard from '../components/PropertyCard';

const PAGE_SIZE = 9; // Show 9 property cards per page
const API_BASE_URL = 'https://propertprodjango.onrender.com';

const Rent = () => {
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<any>({});

  // Fetch properties data dynamically from the rent endpoint
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query parameters based on filters and sort option
        const queryParams = new URLSearchParams();
        
        if (sortOption !== 'recommended') {
          queryParams.append('sort', sortOption);
        }
        
        if (searchFilters.minPrice) queryParams.append('minPrice', searchFilters.minPrice);
        if (searchFilters.maxPrice) queryParams.append('maxPrice', searchFilters.maxPrice);
        if (searchFilters.bedrooms) queryParams.append('bedrooms', searchFilters.bedrooms);
        if (searchFilters.bathrooms) queryParams.append('bathrooms', searchFilters.bathrooms);
        if (searchFilters.propertyType) queryParams.append('propertyType', searchFilters.propertyType);
        if (searchFilters.location) queryParams.append('location', searchFilters.location);
        
        // Construct URL with the query parameters
        const url = `${API_BASE_URL}/api/properties/rent${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        console.log("Fetching properties from:", url);
        
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`Error fetching properties: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Received non-JSON response:', contentType);
          const text = await response.text();
          console.error('Response body:', text);
          throw new Error('Server returned non-JSON response');
        }
        
        const data = await response.json();
        console.log("Properties data received:", data);
        
        // Data might be an array directly, or come within a "results" property
        if (Array.isArray(data)) {
          setAllProperties(data);
          setFilteredProperties(data);
        } else if (data.results && Array.isArray(data.results)) {
          setAllProperties(data.results);
          setFilteredProperties(data.results);
        } else {
          setAllProperties([]);
          setFilteredProperties([]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Failed to load properties. Please try again.');
        setAllProperties([]);
        setFilteredProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [sortOption, searchFilters]);

  // Calculate the properties to display on the current page
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const displayedProperties = filteredProperties.slice(startIndex, startIndex + PAGE_SIZE);
  const totalPages = Math.ceil(filteredProperties.length / PAGE_SIZE);

  const handleSearch = (filters: any) => {
    console.log('Search filters:', filters);
    setSearchFilters(filters);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 bg-gradient-to-r from-indigo-600 to-purple-600 h-auto">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Properties for Rent</h1>
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
        <SearchFilters forSale={false} onSearch={handleSearch} />
      </section>

      {/* Properties List */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Properties</h2>
            <p className="text-gray-600">
              {isLoading ? 'Loading properties...' : `${filteredProperties.length} properties found`}
            </p>
          </div>

          <div className="flex items-center">
            <label htmlFor="sort" className="mr-2 text-gray-700">Sort by:</label>
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

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">No properties match your search criteria</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or explore our other listings</p>
            <button 
              onClick={() => {
                setSearchFilters({});
                setSortOption('recommended');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mt-4"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredProperties.length > 0 && totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                className={`px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
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
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={handleNextPage}
                className={`px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Looking for a Specific Type of Rental?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Our rental specialists can help you find the perfect temporary or long-term home.
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Speak to a Rental Specialist
          </button>
        </div>
      </section>
    </div>
  );
};

export default Rent;
