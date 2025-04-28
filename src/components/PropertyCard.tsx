import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
}

/* helper: turn “2.0” → “2”, keep 1 ½ etc. */
const cleanNumber = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return value; // fallback to raw
  return Number.isInteger(num) ? num : num; // 1.5 stays 1.5
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, featured = false }) => {
  const {
    id,
    title,
    price,
    address,
    bedrooms,
    bathrooms,
    area,
    forSale,
    listing_type,
  } = property;

  const imageUrl =
    (Array.isArray(property.images) && property.images[0]?.image) ||
    (Array.isArray(property.property_images) && property.property_images[0]) ||
    '/placeholder-property.jpg';

  const isForSale = property.property_status
    ? property.property_status === 'for_sale'
    : typeof forSale === 'boolean'
    ? forSale
    : listing_type?.toLowerCase() === 'sale';

  const propertyType = property.property_type || (property as any).type;
  const propertyAddress = property.location || address;

  /* numbers cleaned for display */
  const bedsDisp  = cleanNumber(bedrooms);
  const bathsDisp = cleanNumber(bathrooms);
  const areaDisp  = Number.isFinite(Number(area))
    ? Number(area).toLocaleString()
    : area;

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

        {/* badges */}
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

        {/* favourite */}
        <button className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-md">
          <Heart className="h-5 w-5 text-gray-600 hover:text-red-500 transition-colors" />
        </button>
      </div>

      <div className="p-5">
        {/* title + price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 hover:text-emerald-600 transition-colors">
            <Link to={`/property/${id}`}>{title}</Link>
          </h3>
          <p className="text-lg font-bold text-blue-600">
            {Number.isFinite(Number(price))
              ? isForSale
                ? `€${Number(price).toLocaleString()}`
                : `€${Number(price).toLocaleString()}/mo`
              : isForSale
              ? '€0'
              : '€0/mo'}
          </p>
        </div>

        {/* address */}
        <div className="flex items-center text-gray-500 mb-4">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{propertyAddress}</span>
        </div>

        {/* stats */}
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center text-gray-700">
            <Bed className="h-5 w-5 mr-2 text-gray-500" />
            <span>
              {bedsDisp} {bedsDisp === 1 ? 'Bed' : 'Beds'}
            </span>
          </div>
          <div className="flex items-center text-gray-700">
            <Bath className="h-5 w-5 mr-2 text-gray-500" />
            <span>
              {bathsDisp} {bathsDisp === 1 ? 'Bath' : 'Baths'}
            </span>
          </div>
          <div className="flex items-center text-gray-700">
            <Square className="h-5 w-5 mr-2 text-gray-500" />
            <span>{areaDisp} sq&nbsp;m</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
