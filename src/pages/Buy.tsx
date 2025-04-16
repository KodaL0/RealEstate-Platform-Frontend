import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import SearchFilters from '../components/SearchFilters';
import PropertyCard from '../components/PropertyCard';

const Buy = () => {
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState('recommended');

  // Fetch properties data dynamically
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties/buy'); // adjust the endpoint as needed
        const data = await response.json();
        setFilteredProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    fetchProperties();
  }, []);

  const handleSearch = (filters: any) => {
    console.log('Search filters:', filters);
    // Implement filtering logic here based on the filters.
    // For example, you could filter the current properties or trigger a re-fetch with filter parameters.
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);

    // Create a copy for sorting without mutating the state directly
    const sortedProperties = [...filteredProperties];

    switch (e.target.value) {
      case 'price-asc':
        sortedProperties.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sortedProperties.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // Assuming properties include a date property such as 'dateListed'
        sortedProperties.sort((a, b) => new Date(b.dateListed).getTime() - new Date(a.dateListed).getTime());
        break;
      case 'oldest':
        sortedProperties.sort((a, b) => new Date(a.dateListed).getTime() - new Date(b.dateListed).getTime());
        break;
      default:
        // 'recommended' - no sort or implement your own custom sorting logic
        break;
    }

    setFilteredProperties(sortedProperties);
  };

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 bg-gradient-to-r from-blue-600 to-indigo-600 h-auto">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Properties for Sale</h1>
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
        <SearchFilters forSale={true} onSearch={handleSearch} />
      </section>

      {/* Properties List */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Properties</h2>
            <p className="text-gray-600">{filteredProperties.length} properties found</p>
          </div>

          <div className="flex items-center">
            <label htmlFor="sort" className="mr-2 text-gray-700">Sort by:</label>
            <select
              id="sort"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              value={sortOption}
              onChange={handleSortChange}
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-12 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              2
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              3
            </button>
            <span className="px-2 text-gray-500">...</span>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              10
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </nav>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Our expert agents can help you find the perfect property that meets all your requirements.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Contact an Agent
          </button>
        </div>
      </section>
    </div>
  );
};

export default Buy;
