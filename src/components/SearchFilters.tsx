import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import AmenityFilter from './AmenityFilter';
import { PROPERTY_TYPES, COUNTRY_OPTIONS } from '../types';
import type { SearchFilterState } from '../utils/searchCanonical';

// Filter types
type FilterState = SearchFilterState;

interface SearchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  // Only keep UI state
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Clear filters
  const clearFilters = () => {
    onFiltersChange({
      location: '',
      country: 'All',
      minPrice: '',
      maxPrice: '',
      propertyType: 'Any',
      bedrooms: 'Any',
      bathrooms: 'Any',
      amenities: [],
    });
  };

  // Always show expanded filter form
  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-5 transition-all duration-300">
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3">
            <div className="md:col-span-7">
              <label htmlFor="location" className="block text-xs font-medium text-gray-700 mb-1">📍 Location</label>
              <input
                type="text"
                id="location"
                placeholder="City, neighborhood..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.location || ''}
                onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
              />
            </div>
            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-gray-700 mb-1">🌍 Country</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, country: 'All' })}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${(filters.country || 'All') === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  🌍
                </button>
                {COUNTRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onFiltersChange({ ...filters, country: opt.value })}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${filters.country === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    title={opt.label}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3">
            <div>
              <label htmlFor="minPrice" className="block text-xs font-medium text-gray-700 mb-1">💰 Min</label>
              <input
                type="number"
                id="minPrice"
                placeholder="Min price"
                className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={filters.minPrice || ''}
                onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="maxPrice" className="block text-xs font-medium text-gray-700 mb-1">💰 Max</label>
              <input
                type="number"
                id="maxPrice"
                placeholder="Max price"
                className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={filters.maxPrice || ''}
                onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
                min="0"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="type" className="block text-xs font-medium text-gray-700 mb-1">🏠 Type</label>
              <select
                id="type"
                className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                value={filters.propertyType || 'Any'}
                onChange={(e) => onFiltersChange({ ...filters, propertyType: e.target.value })}
              >
                <option value="Any">Any</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bedrooms" className="block text-xs font-medium text-gray-700 mb-1">🛏️ Beds</label>
              <select
                id="bedrooms"
                className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                value={filters.bedrooms || 'Any'}
                onChange={(e) => onFiltersChange({ ...filters, bedrooms: e.target.value })}
              >
                <option>Any</option>
                <option>1+</option>
                <option>2+</option>
                <option>3+</option>
                <option>4+</option>
                <option>5+</option>
              </select>
            </div>
            <div>
              <label htmlFor="bathrooms" className="block text-xs font-medium text-gray-700 mb-1">🚿 Baths</label>
              <select
                id="bathrooms"
                className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                value={filters.bathrooms || 'Any'}
                onChange={(e) => onFiltersChange({ ...filters, bathrooms: e.target.value })}
              >
                <option>Any</option>
                <option>1+</option>
                <option>2+</option>
                <option>3+</option>
                <option>4+</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex items-center"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            ✨ Amenities
            {filters.amenities && filters.amenities.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                {filters.amenities.length}
              </span>
            )}
            <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm font-medium flex items-center"
            onClick={clearFilters}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </button>
        </div>

        {advancedOpen && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <AmenityFilter 
              selectedAmenities={filters.amenities || []} 
              onChange={(amenities) => onFiltersChange({ ...filters, amenities })} 
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchFilters;
