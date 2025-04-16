import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, featured = false }) => {
  // Destructure common fields; note that the public listing data may have different keys.
  const { id, title, price, address, bedrooms, bathrooms, area, forSale, listing_type } = property;

  // Use property.images if available; fallback to property.property_images.
  const imageUrl =
    (property.images &&
      Array.isArray(property.images) &&
      property.images.length > 0 &&
      property.images[0].image) ||
    (property.property_images &&
      Array.isArray(property.property_images) &&
      property.property_images.length > 0 &&
      property.property_images[0]) ||
    '/placeholder-property.jpg';

  // Determine if the property is for sale.
  // Preference is given to property.property_status if available.
  const isForSale = property.property_status
    ? property.property_status === 'for_sale'
    : typeof forSale === 'boolean'
    ? forSale
    : listing_type && listing_type.toLowerCase() === 'sale';

  // Use property.property_type if available, otherwise fallback to the "type" field.
  const propertyType = property.property_type || property.type;

  // Use property.location if it exists; otherwise, fall back to address.
  const propertyAddress = property.location || address;

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${
        featured ? 'col-span-2' : ''
      }`}
    >
      <div className="relative">
        <Link to={`/property/${id}`}>
          <img
            src={imageUrl}
            alt={title}
            className={`w-full object-cover ${featured ? 'h-80' : 'h-64'}`}
          />
        </Link>
        {/* Badges at Top-Left */}
        <div className="absolute top-4 left-4 flex space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isForSale ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
            }`}
          >
            {isForSale ? 'For Sale' : 'For Rent'}
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-900/70 text-white text-xs font-semibold">
            {propertyType}
          </span>
        </div>
        {/* Favorite Button at Top-Right */}
        <button className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors">
          <Heart className="h-5 w-5 text-gray-600 hover:text-red-500 transition-colors" />
        </button>
      </div>

      <div className="p-5">
        {/* Title & Price Row */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 hover:text-emerald-600 transition-colors">
            <Link to={`/property/${id}`}>{title}</Link>
          </h3>
          <p className="text-lg font-bold text-blue-600">
            {isForSale
              ? `€${price.toLocaleString()}`
              : `€${price.toLocaleString()}/mo`}
          </p>
        </div>

        {/* Address */}
        <div className="flex items-center text-gray-500 mb-4">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{propertyAddress}</span>
        </div>

        {/* Stats: Beds, Baths, Area */}
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center text-gray-700">
            <Bed className="h-5 w-5 mr-2 text-gray-500" />
            <span>{bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Bath className="h-5 w-5 mr-2 text-gray-500" />
            <span>{bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Square className="h-5 w-5 mr-2 text-gray-500" />
            <span>{area.toLocaleString()} sq ft</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
