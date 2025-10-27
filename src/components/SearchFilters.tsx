import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import AmenityFilter from './AmenityFilter';
import { getAmenityLabel, PROPERTY_TYPES, COUNTRY_OPTIONS } from '../types';

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
  forSale?: boolean;
  onSearch: (filters: ParsedFilters) => void;
  initialLocation?: string;
}

const parseMinNumber = (numberString: string): number | undefined => {
  if (numberString === 'Any') return undefined;
  return parseInt(numberString.replace('+', ''), 10);
};

const getPropertyTypeLabel = (value: string): string => {
  const type = PROPERTY_TYPES.find(t => t.value === value);
  return type?.label || value;
};

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
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${colorClass} rounded-full text-sm font-medium hover:brightness-95 transition-all active:scale-95 shadow-sm border`}
  >
    <span className={`truncate ${maxWidth}`}>{emoji} {label}</span>
    <X className="h-3.5 w-3.5 flex-shrink-0" />
  </button>
);

const SearchFilters: React.FC<SearchFiltersProps> = ({
  forSale = true,
  onSearch,
  initialLocation = '',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const onSearchRef = useRef(onSearch);

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

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

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
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <form onSubmit={handleSearch}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-7">
              <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Location
              </label>
              <input
                type="text"
                id="location"
                placeholder="City, neighborhood..."
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="md:col-span-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌍 Country
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCountry('All')}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                    country === 'All'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  All
                </button>
                {COUNTRY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCountry(opt.value)}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xl font-medium transition-all shadow-sm ${
                      country === opt.value
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                    title={opt.label}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label htmlFor="minPrice" className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Min
              </label>
              <input
                type="number"
                id="minPrice"
                placeholder={forSale ? "100k" : "500"}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
              />
            </div>

            <div>
              <label htmlFor="maxPrice" className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Max
              </label>
              <input
                type="number"
                id="maxPrice"
                placeholder={forSale ? "500k" : "2000"}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
                🏠 Type
              </label>
              <select
                id="type"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all"
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
              <label htmlFor="bedrooms" className="block text-sm font-semibold text-gray-700 mb-2">
                🛏️ Beds
              </label>
              <select
                id="bedrooms"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all"
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
              <label htmlFor="bathrooms" className="block text-sm font-semibold text-gray-700 mb-2">
                🚿 Baths
              </label>
              <select
                id="bathrooms"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all"
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

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            ✨ Amenities
            {selectedAmenities.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                {selectedAmenities.length}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm font-semibold transition-colors"
            onClick={clearFilters}
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>

        {advancedOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <AmenityFilter
              selectedAmenities={selectedAmenities}
              onChange={setSelectedAmenities}
            />
          </div>
        )}
      </form>

      {(location || country !== 'All' || minPrice || maxPrice || propertyType !== 'Any' || bedrooms !== 'Any' || bathrooms !== 'Any' || selectedAmenities.length > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
              {location && (
                <FilterBadge
                  label={location}
                  emoji="📍"
                  onRemove={() => setLocation('')}
                  colorClass="bg-emerald-50 text-emerald-700 border-emerald-200"
                />
              )}

              {country !== 'All' && (
                <FilterBadge
                  label={country}
                  emoji="🌍"
                  onRemove={() => setCountry('All')}
                  colorClass="bg-blue-50 text-blue-700 border-blue-200"
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
                  colorClass="bg-green-50 text-green-700 border-green-200"
                  maxWidth="max-w-[140px] sm:max-w-none"
                />
              )}

              {propertyType !== 'Any' && (
                <FilterBadge
                  label={getPropertyTypeLabel(propertyType)}
                  emoji="🏠"
                  onRemove={() => setPropertyType('Any')}
                  colorClass="bg-orange-50 text-orange-700 border-orange-200"
                  maxWidth="max-w-[100px] sm:max-w-none"
                />
              )}

              {bedrooms !== 'Any' && (
                <FilterBadge
                  label={bedrooms}
                  emoji="🛏️"
                  onRemove={() => setBedrooms('Any')}
                  colorClass="bg-pink-50 text-pink-700 border-pink-200"
                  maxWidth=""
                />
              )}

              {bathrooms !== 'Any' && (
                <FilterBadge
                  label={bathrooms}
                  emoji="🚿"
                  onRemove={() => setBathrooms('Any')}
                  colorClass="bg-cyan-50 text-cyan-700 border-cyan-200"
                  maxWidth=""
                />
              )}

              {selectedAmenities.slice(0, 3).map(amenityId => (
                <FilterBadge
                  key={amenityId}
                  label={getAmenityLabel(amenityId)}
                  emoji="✨"
                  onRemove={() => setSelectedAmenities(prev => prev.filter(id => id !== amenityId))}
                  colorClass="bg-amber-50 text-amber-700 border-amber-200"
                />
              ))}

              {selectedAmenities.length > 3 && (
                <button
                  onClick={() => setAdvancedOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold hover:bg-amber-200 transition-all shadow-sm border border-amber-200"
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
