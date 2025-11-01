import { X } from 'lucide-react';
import { PROPERTY_TYPES, COUNTRY_OPTIONS, AMENITIES } from '../types';
import type { SearchFilterState } from '../utils/searchCanonical';

interface ActiveFiltersProps {
  filters: SearchFilterState;
  onRemoveFilter: (key: keyof SearchFilterState, value?: string) => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ filters, onRemoveFilter }) => {
  const activeFilters: Array<{ key: keyof SearchFilterState; label: string; value: string }> = [];

  // Location
  if (filters.location) {
    activeFilters.push({
      key: 'location',
      label: 'Location',
      value: filters.location,
    });
  }

  // Country
  if (filters.country && filters.country !== 'All') {
    const countryLabel = COUNTRY_OPTIONS.find(c => c.value === filters.country)?.label || filters.country;
    activeFilters.push({
      key: 'country',
      label: 'Country',
      value: countryLabel,
    });
  }

  // Price range
  if (filters.minPrice || filters.maxPrice) {
    const formatPrice = (price: string) => {
      const num = parseInt(price, 10);
      return isNaN(num) ? price : `€${num.toLocaleString()}`;
    };
    const min = filters.minPrice ? formatPrice(filters.minPrice) : '';
    const max = filters.maxPrice ? formatPrice(filters.maxPrice) : '';
    const priceRange = min && max ? `${min} - ${max}` : min || max;
    activeFilters.push({
      key: 'minPrice',
      label: 'Price',
      value: priceRange,
    });
  }

  // Property type
  if (filters.propertyType && filters.propertyType !== 'Any') {
    const typeLabel = PROPERTY_TYPES.find(t => t.value === filters.propertyType)?.label || filters.propertyType;
    activeFilters.push({
      key: 'propertyType',
      label: 'Type',
      value: typeLabel,
    });
  }

  // Bedrooms
  if (filters.bedrooms && filters.bedrooms !== 'Any') {
    activeFilters.push({
      key: 'bedrooms',
      label: 'Bedrooms',
      value: filters.bedrooms,
    });
  }

  // Bathrooms
  if (filters.bathrooms && filters.bathrooms !== 'Any') {
    activeFilters.push({
      key: 'bathrooms',
      label: 'Bathrooms',
      value: filters.bathrooms,
    });
  }

  // Amenities (individual chips)
  if (filters.amenities && filters.amenities.length > 0) {
    const amenityMap = new Map(AMENITIES.map(a => [a.id, a.label]));
    filters.amenities.forEach(amenityId => {
      const amenityLabel = amenityMap.get(amenityId) || amenityId;
      activeFilters.push({
        key: 'amenities',
        label: 'Amenity',
        value: amenityLabel,
      });
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-t border-gray-200">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500 mr-1">Active filters:</span>
        {activeFilters.map((filter, index) => {
          // For amenities, we need to remove the specific amenity
          const handleRemove = () => {
            if (filter.key === 'amenities') {
              const amenityId = AMENITIES.find(a => a.label === filter.value)?.id || filter.value;
              const updatedAmenities = (filters.amenities || []).filter(a => a !== amenityId);
              onRemoveFilter('amenities', updatedAmenities.join(','));
            } else if (filter.key === 'minPrice') {
              // Special handling for price range
              onRemoveFilter('minPrice');
              onRemoveFilter('maxPrice');
            } else {
              onRemoveFilter(filter.key);
            }
          };

          return (
            <button
              key={`${filter.key}-${index}`}
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white border border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-colors"
            >
              <span className="text-gray-600">{filter.label}:</span>
              <span className="text-gray-900">{filter.value}</span>
              <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveFilters;

