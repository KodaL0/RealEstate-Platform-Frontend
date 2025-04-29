// src/components/PropertyCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square } from 'lucide-react';
import { Property } from '../types';
import FavouriteButton from './FavouriteButton';

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
}

/* helper: turn "2.0" → "2", keep 1 ½ etc. */
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
    location,
    images,
    property_status,
    property_type,
    bedrooms,
    bathrooms,
    area,
    listing_type,
    forSale,
    is_favourite,
  } = property;

  const imageUrl =
    (Array.isArray(images) && images[0]?.image) ||
    '/placeholder-property.jpg';

  const isForSale = property_status
    ? property_status === 'for_sale'
    : typeof forSale === 'boolean'
    ? forSale
    : listing_type?.toLowerCase() === 'sale';

  const propertyType = property_type || (property as any).type;
  const propertyAddress = location;

  /* numbers cleaned for display */
  const bedsDisp  = cleanNumber(bedrooms);
  const bathsDisp = cleanNumber(bathrooms);
  const areaDisp  = Number.isFinite(Number(area))
    ? Number(area).toLocaleString()
    : area;

  return (
    <div
      className={`
        bg-white rounded-xl overflow-hidden
        shadow-lg hover:shadow-xl transition-shadow duration-300
        flex flex-col h-full
        ${featured ? 'col-span-2' : ''}
      `}
    >
      {/* image + badges + favourite */}
      <div className="relative">
        <Link to={`/property/${id}`}>
          <img
            src={imageUrl}
            alt={title}
            className={`w-full object-cover ${featured ? 'h-80' : 'h-64'}`}
          />
        </Link>
        <div className="absolute top-4 left-4 flex space-x-2">
          <span
            className={`
              px-3 py-1 rounded-full text-xs font-semibold
              ${isForSale ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}
            `}
          >
            {isForSale ? 'For Sale' : 'For Rent'}
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-900/70 text-white text-xs font-semibold">
            {propertyType}
          </span>
        </div>

        {/* favourite button component */}
        <FavouriteButton
          propertyId={id}
          defaultLiked={!!is_favourite}
        />
      </div>

      {/* content */}
      <div className="p-5 flex flex-col flex-1">
        {/* title + price */}
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-900 hover:text-emerald-600 transition-colors">
            <Link to={`/property/${id}`}>{title}</Link>
          </h3>
          <p className="text-lg font-bold text-blue-600 whitespace-nowrap">
            {Number.isFinite(Number(price))
              ? isForSale
                ? `€${Number(price).toLocaleString()}`
                : `€${Number(price).toLocaleString()}/mo`
              : isForSale
              ? '€0'
              : '€0/mo'}
          </p>
        </div>

        {/* spacer grows to push address down */}
        <div className="flex-1" />

        {/* address */}
        <div className="flex items-center text-gray-500 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{propertyAddress}</span>
        </div>

        {/* stats bar */}
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center text-gray-700">
            <Bed className="h-5 w-5 mr-2 text-gray-500" />
            <span>{bedsDisp} {bedsDisp === 1 ? 'Bed' : 'Beds'}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Bath className="h-5 w-5 mr-2 text-gray-500" />
            <span>{bathsDisp} {bathsDisp === 1 ? 'Bath' : 'Baths'}</span>
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
