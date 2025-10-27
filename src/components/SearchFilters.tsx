import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import AmenityFilter from './AmenityFilter';
import { getAmenityLabel, PROPERTY_TYPES, COUNTRY_OPTIONS } from '../types';

// Define a more specific type for the filters passed to onSearch
interface ParsedFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  country?: string;
  forSale: boolean;
}

interface SearchFiltersProps {
  forSale: boolean;  // Required: true for Buy page, false for Rent page
  onSearch: (filters: ParsedFilters) => void;  // Required: callback when filters change
  initialLocation?: string;  // Optional: pre-fill location from URL
  isExpanded?: boolean;  // Optional: true = show full form, false = show only active filter badges (default: true)
}

// Helper function to parse min number string (e.g., "3+", "Any")
const parseMinNumber = (numberString: string): number | undefined => {
  if (numberString === 'Any') {
    return undefined;
  }
  return parseInt(numberString.replace('+', ''), 10);
};

// Helper to get property type label from value
const getPropertyTypeLabel = (value: string): string => {
  const type = PROPERTY_TYPES.find(t => t.value === value);
  return type?.label || value;
};

// Reusable FilterBadge component
interface FilterBadgeProps {
  label: string;
  emoji: string;
  onRemove: () => void;
  colorClass: string;
  maxWidth?: string;
}

const FilterBadge: React.FC<FilterBadgeProps> = ({ label, emoji, onRemove, colorClass, maxWidth = 'max-w-[120px] sm:max-w-none' }) => (
  <button
    onClick={onRemove}
    className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 ${colorClass} rounded-full text-xs sm:text-sm hover:brightness-95 transition-all active:scale-95`}
  >
    <span className={`truncate ${maxWidth}`}>{emoji} {label}</span>
    <X className="h-3 w-3 flex-shrink-0" />
  </button>
);

const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  forSale, 
  onSearch, 
  initialLocation = '',
  isExpanded = true,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use ref to store latest onSearch to avoid infinite loops
  const onSearchRef = useRef(onSearch);
  
  // Initialize state from URL params
  const [location, setLocation] = useState(searchParams.get('location') || initialLocation);
  const [country, setCountry] = useState(searchParams.get('country') || 'All');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'Any');
  const [bedrooms, setBedrooms] = useState(searchParams.get('beds') || 'Any');
  const [bathrooms, setBathrooms] = useState(searchParams.get('baths') || 'Any');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get('amenities')?.split(',').filter(Boolean) || []
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Keep ref updated with latest onSearch function
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (location) params.set('location', location);
    if (country !== 'All') params.set('country', country);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (propertyType !== 'Any') params.set('type', propertyType);
    if (bedrooms !== 'Any') params.set('beds', bedrooms);
    if (bathrooms !== 'Any') params.set('baths', bathrooms);
    if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));
    
    setSearchParams(params, { replace: true });
  }, [location, country, minPrice, maxPrice, propertyType, bedrooms, bathrooms, selectedAmenities, setSearchParams]);

  // Trigger search when filters change (for URL sync, badges, and initial load)
  useEffect(() => {
    const parsedBedrooms = parseMinNumber(bedrooms);
    const parsedBathrooms = parseMinNumber(bathrooms);

    onSearchRef.current({
      location: location || undefined,
      country: country !== 'All' ? country : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      propertyType: propertyType === 'Any' ? undefined : propertyType,
      bedrooms: parsedBedrooms,
      bathrooms: parsedBathrooms,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      forSale,
    });
  }, [location, country, minPrice, maxPrice, propertyType, bedrooms, bathrooms, selectedAmenities, forSale]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now handled by the useEffect above
    // This just prevents form submission
  };

  const clearFilters = () => {
    setLocation('');
    setCountry('All');
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('Any');
    setBedrooms('Any');
    setBathrooms('Any');
    setSelectedAmenities([]);
    // Search will be triggered automatically by the useEffect
  };

  // Check if there are active filters
  const hasActiveFilters = location || country !== 'All' || minPrice || maxPrice || 
    propertyType !== 'Any' || bedrooms !== 'Any' || bathrooms !== 'Any' || 
    selectedAmenities.length > 0;

  // If collapsed and no active filters, hide completely
  if (!isExpanded && !hasActiveFilters) {
    return null;
  }

  // Collapsed view - show only active filters
  if (!isExpanded && hasActiveFilters) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-3 transition-all duration-200 ease-out">
        <div className="flex items-center gap-2 flex-wrap fade-in">
            {location && (
              <FilterBadge 
                label={location} 
                emoji="📍" 
                onRemove={() => setLocation('')} 
                colorClass="bg-emerald-50 text-emerald-700"
              />
            )}

            {country !== 'All' && (
              <FilterBadge 
                label={country} 
                emoji="🌍" 
                onRemove={() => setCountry('All')} 
                colorClass="bg-indigo-50 text-indigo-700"
                maxWidth=""
              />
            )}

            {(minPrice || maxPrice) && (
              <FilterBadge 
                label={
                  minPrice && maxPrice 
                    ? `€${parseInt(minPrice).toLocaleString()} - €${parseInt(maxPrice).toLocaleString()}`
                    : minPrice 
                      ? `€${parseInt(minPrice).toLocaleString()}+`
                      : `Up to €${parseInt(maxPrice).toLocaleString()}`
                } 
                emoji="💰" 
                onRemove={() => {
                  setMinPrice('');
                  setMaxPrice('');
                }} 
                colorClass="bg-blue-50 text-blue-700"
                maxWidth="max-w-[140px] sm:max-w-none"
              />
            )}

            {propertyType !== 'Any' && (
              <FilterBadge 
                label={getPropertyTypeLabel(propertyType)} 
                emoji="🏠" 
                onRemove={() => setPropertyType('Any')} 
                colorClass="bg-purple-50 text-purple-700"
                maxWidth="max-w-[100px] sm:max-w-none"
              />
            )}

            {bedrooms !== 'Any' && (
              <FilterBadge 
                label={bedrooms} 
                emoji="🛏️" 
                onRemove={() => setBedrooms('Any')} 
                colorClass="bg-pink-50 text-pink-700"
                maxWidth=""
              />
            )}

            {bathrooms !== 'Any' && (
              <FilterBadge 
                label={bathrooms} 
                emoji="🚿" 
                onRemove={() => setBathrooms('Any')} 
                colorClass="bg-cyan-50 text-cyan-700"
                maxWidth=""
              />
            )}

            {selectedAmenities.slice(0, 3).map(amenityId => (
              <FilterBadge 
                key={amenityId}
                label={getAmenityLabel(amenityId)} 
                emoji="✨" 
                onRemove={() => setSelectedAmenities(prev => prev.filter(id => id !== amenityId))} 
                colorClass="bg-amber-50 text-amber-700"
              />
            ))}

            {selectedAmenities.length > 3 && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs sm:text-sm font-medium">
                +{selectedAmenities.length - 3} more
              </span>
            )}

            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-gray-500 hover:text-gray-700 text-xs sm:text-sm font-medium flex items-center"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </button>
        </div>
      </div>
    );
  }

  // Expanded view - show full form
  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-5 transition-all duration-200 ease-out">
      <form onSubmit={handleSearch}>
        {/* Compact 2-row layout */}
        <div className="space-y-2">
          {/* Row 1: Location + Country */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3">
            <div className="md:col-span-7">
              <label htmlFor="location" className="block text-xs font-medium text-gray-700 mb-1">
                📍 Location
              </label>
              <input
                type="text"
                id="location"
                placeholder="City, neighborhood..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                🌍 Country
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCountry('All')}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                    country === 'All'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🌍
                </button>
                {COUNTRY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCountry(opt.value)}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      country === opt.value
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

          {/* Row 2: Price + Type + Beds + Baths */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3">
            <div>
              <label htmlFor="minPrice" className="block text-xs font-medium text-gray-700 mb-1">
                💰 Min
              </label>
              <input
                type="number"
                id="minPrice"
                placeholder={forSale ? "100k" : "500"}
                className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
              />
            </div>

            <div>
              <label htmlFor="maxPrice" className="block text-xs font-medium text-gray-700 mb-1">
                💰 Max
              </label>
              <input
                type="number"
                id="maxPrice"
                placeholder={forSale ? "500k" : "2000"}
                className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="type" className="block text-xs font-medium text-gray-700 mb-1">
                🏠 Type
              </label>
              <select
                id="type"
                className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="Any">Any</option>
                {PROPERTY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bedrooms" className="block text-xs font-medium text-gray-700 mb-1">
                🛏️ Beds
              </label>
              <select
                id="bedrooms"
                className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
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
              <label htmlFor="bathrooms" className="block text-xs font-medium text-gray-700 mb-1">
                🚿 Baths
              </label>
              <select
                id="bathrooms"
                className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
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

        {/* Action Buttons - Compact */}
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex items-center"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            ✨ Amenities
            {selectedAmenities.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                {selectedAmenities.length}
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

        {/* Advanced Filters - Amenities */}
        {advancedOpen && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <AmenityFilter 
              selectedAmenities={selectedAmenities}
              onChange={setSelectedAmenities}
            />
          </div>
        )}
      </form>

      {/* Active Filters Display - Compact */}
      {(location || country !== 'All' || minPrice || maxPrice || propertyType !== 'Any' || bedrooms !== 'Any' || bathrooms !== 'Any' || selectedAmenities.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
              {location && (
                <FilterBadge 
                  label={location} 
                  emoji="📍" 
                  onRemove={() => setLocation('')} 
                  colorClass="bg-emerald-50 text-emerald-700"
                />
              )}

              {country !== 'All' && (
                <FilterBadge 
                  label={country} 
                  emoji="🌍" 
                  onRemove={() => setCountry('All')} 
                  colorClass="bg-indigo-50 text-indigo-700"
                  maxWidth=""
                />
              )}

              {(minPrice || maxPrice) && (
                <FilterBadge 
                  label={
                    minPrice && maxPrice 
                      ? `€${parseInt(minPrice).toLocaleString()} - €${parseInt(maxPrice).toLocaleString()}`
                      : minPrice 
                        ? `€${parseInt(minPrice).toLocaleString()}+`
                        : `Up to €${parseInt(maxPrice).toLocaleString()}`
                  } 
                  emoji="💰" 
                  onRemove={() => {
                    setMinPrice('');
                    setMaxPrice('');
                  }} 
                  colorClass="bg-blue-50 text-blue-700"
                  maxWidth="max-w-[140px] sm:max-w-none"
                />
              )}

              {propertyType !== 'Any' && (
                <FilterBadge 
                  label={getPropertyTypeLabel(propertyType)} 
                  emoji="🏠" 
                  onRemove={() => setPropertyType('Any')} 
                  colorClass="bg-purple-50 text-purple-700"
                  maxWidth="max-w-[100px] sm:max-w-none"
                />
              )}

              {bedrooms !== 'Any' && (
                <FilterBadge 
                  label={bedrooms} 
                  emoji="🛏️" 
                  onRemove={() => setBedrooms('Any')} 
                  colorClass="bg-pink-50 text-pink-700"
                  maxWidth=""
                />
              )}

              {bathrooms !== 'Any' && (
                <FilterBadge 
                  label={bathrooms} 
                  emoji="🚿" 
                  onRemove={() => setBathrooms('Any')} 
                  colorClass="bg-cyan-50 text-cyan-700"
                  maxWidth=""
                />
              )}

              {selectedAmenities.slice(0, 3).map(amenityId => (
                <FilterBadge 
                  key={amenityId}
                  label={getAmenityLabel(amenityId)} 
                  emoji="✨" 
                  onRemove={() => setSelectedAmenities(prev => prev.filter(id => id !== amenityId))} 
                  colorClass="bg-amber-50 text-amber-700"
                />
              ))}

              {selectedAmenities.length > 3 && (
                <button
                  onClick={() => setAdvancedOpen(true)}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs sm:text-sm hover:bg-amber-200 transition-all font-medium"
                >
                  +{selectedAmenities.length - 3} more
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
