import { useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

// Define a more specific type for the filters passed to onSearch
interface ParsedFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  forSale: boolean;
}

interface SearchFiltersProps {
  forSale?: boolean;
  onSearch: (filters: ParsedFilters) => void;
}

// Helper function to parse price string (e.g., "$100k - $300k", "$2M+", "Any")
const parsePriceRange = (rangeString: string): { minPrice?: number; maxPrice?: number } => {
  if (rangeString === 'Any') {
    return { minPrice: undefined, maxPrice: undefined };
  }

  const cleaned = rangeString.replace(/[$|,]/g, '');
  let minPrice: number | undefined;
  let maxPrice: number | undefined;

  const parseValue = (value: string): number => {
    if (value.endsWith('k')) {
      return parseFloat(value.replace('k', '')) * 1000;
    }
    if (value.endsWith('M')) {
      return parseFloat(value.replace('M', '')) * 1000000;
    }
    return parseFloat(value);
  };

  if (cleaned.includes(' - ')) {
    const [minStr, maxStr] = cleaned.split(' - ');
    minPrice = parseValue(minStr);
    maxPrice = parseValue(maxStr);
  } else if (cleaned.endsWith('+')) {
    minPrice = parseValue(cleaned.replace('+', ''));
    maxPrice = undefined; // No upper limit
  }

  return { minPrice, maxPrice };
};

// Helper function to parse min number string (e.g., "3+", "Any")
const parseMinNumber = (numberString: string): number | undefined => {
  if (numberString === 'Any') {
    return undefined;
  }
  return parseInt(numberString.replace('+', ''), 10);
};

const SearchFilters: React.FC<SearchFiltersProps> = ({ forSale = true, onSearch }) => {
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('Any');
  const [propertyType, setPropertyType] = useState('Any');
  const [bedrooms, setBedrooms] = useState('Any');
  const [bathrooms, setBathrooms] = useState('Any');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const { minPrice, maxPrice } = parsePriceRange(priceRange);
    const parsedBedrooms = parseMinNumber(bedrooms);
    const parsedBathrooms = parseMinNumber(bathrooms);

    onSearch({
      location: location || undefined, // Ensure empty string becomes undefined
      minPrice,
      maxPrice,
      propertyType: propertyType === 'Any' ? undefined : propertyType,
      bedrooms: parsedBedrooms,
      bathrooms: parsedBathrooms,
      forSale,
    });
  };

  const clearFilters = () => {
    setLocation('');
    setPriceRange('Any');
    setPropertyType('Any');
    setBedrooms('Any');
    setBathrooms('Any');
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Location */}
          <div className="lg:col-span-2">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              placeholder="City, neighborhood, or address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Price Range */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price Range
            </label>
            <select
              id="price"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option>Any</option>
              {forSale ? (
                <>
                  <option>$100k - $300k</option>
                  <option>$300k - $500k</option>
                  <option>$500k - $750k</option>
                  <option>$750k - $1M</option>
                  <option>$1M - $2M</option>
                  <option>$2M+</option>
                </>
              ) : (
                <>
                  <option>$500 - $1,000</option>
                  <option>$1,000 - $2,000</option>
                  <option>$2,000 - $3,500</option>
                  <option>$3,500 - $5,000</option>
                  <option>$5,000 - $10,000</option>
                  <option>$10,000+</option>
                </>
              )}
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              id="type"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              <option>Any</option>
              <option>House</option>
              <option>Apartment</option>
              <option>Condo</option>
              <option>Townhouse</option>
              <option>Villa</option>
              <option>Land</option>
            </select>
          </div>

          {/* Search Button */}
          <div>
            {/* Invisible label to align the button with other fields */}
            <label className="block text-sm font-medium text-transparent mb-1 select-none">
              &nbsp;
            </label>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-colors py-1 px-3 text-sm"
            >
              <Search className="h-4 w-4 mr-1" />
              Search
            </button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            Advanced Filters
            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </button>
        </div>

        {advancedOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <select
                id="bedrooms"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
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
              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <select
                id="bathrooms"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
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

            <div>
              <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-1">
                Features
              </label>
              <select
                id="features"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
              >
                <option>Any Features</option>
                <option>Pool</option>
                <option>Garden</option>
                <option>Garage</option>
                <option>Air Conditioning</option>
                <option>Gym</option>
                <option>Waterfront</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchFilters;
