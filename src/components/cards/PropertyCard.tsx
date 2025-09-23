// src/components/PropertyCard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, ArrowLeft, ArrowRight } from 'lucide-react';
import { Property } from '../../types';
import FavouriteButton from '../FavouriteButton';

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
  onUnlikeSuccess?: (propertyId: number) => void;
  showFavoriteButton?: boolean;
}

/* helper: turn "2.0" → "2", keep 1 ½ etc. */
const cleanNumber = (value: unknown): number | string => {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value); // fallback to string
  return Number.isInteger(num) ? num : num; // 1.5 stays 1.5
};

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  featured = false,
  onUnlikeSuccess,
  showFavoriteButton = true
}) => {
  const {
    id,
    title,
    price,
    location,
    images = [],
    property_status,
    property_type,
    bedrooms,
    bathrooms,
    area,
    is_favourite,
  } = property;

  // slideshow state
  const [currentImage, setCurrentImage] = useState(0);
  const imgCount = images.length;

  const prevImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (imgCount > 0) {
      setCurrentImage(i => (i - 1 + imgCount) % imgCount);
    }
  };
  const nextImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (imgCount > 0) {
      setCurrentImage(i => (i + 1) % imgCount);
    }
  };

  const imageUrl =
    (imgCount > 0 && images[currentImage]?.image) || '/placeholder-property.jpg';

  const isForSale = property_status === 'for_sale';

  const bedsDisp = cleanNumber(bedrooms);
  const bathsDisp = cleanNumber(bathrooms);
  const areaDisp = Number.isFinite(Number(area))
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
      {/* Exclusive Header Section - Compact */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-3 py-1.5">
        <div className="flex items-center justify-between">
          {/* Left: Property Type */}
          <span className="px-1.5 py-0.5 bg-gray-700 text-white text-xs font-medium rounded-full">
            {property_type.charAt(0).toUpperCase() + property_type.slice(1)}
          </span>
          
          {/* Right: Country & Status */}
          <div className="flex items-center space-x-1.5">
            <span
              className={`
                px-1.5 py-0.5 text-white text-xs font-medium rounded-full
                ${property.country === 'Greece' ? 'bg-blue-600' : ''}
                ${property.country === 'Cyprus' ? 'bg-orange-500' : ''}
                ${property.country !== 'Greece' && property.country !== 'Cyprus' ? 'bg-gray-600' : ''}
              `}
            >
              {property.country === 'Greece' && '🇬🇷 Greece'}
              {property.country === 'Cyprus' && '🇨🇾 Cyprus'}
              {property.country !== 'Greece' && property.country !== 'Cyprus' && property.country}
            </span>
            <span
              className={`
                px-1.5 py-0.5 text-white text-xs font-medium rounded-full
                ${isForSale ? 'bg-emerald-500' : 'bg-blue-500'}
              `}
            >
              {isForSale ? 'For Sale' : 'For Rent'}
            </span>
          </div>
        </div>
      </div>

      {/* Image Section with Navigation */}
      <div className="relative">
        {imgCount > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full shadow z-10"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full shadow z-10"
            >
              <ArrowRight className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}

        <Link to={`/property/${id}`}>
          <img
            src={imageUrl}
            alt={title}
            className={`w-full object-cover ${featured ? 'h-80' : 'h-64'}`}
          />
        </Link>

        {showFavoriteButton && (
          <div className="absolute top-4 right-4 z-20">
            <FavouriteButton
              propertyId={id}
              defaultLiked={!!is_favourite}
              onUnlikeSuccess={onUnlikeSuccess}
            />
          </div>
        )}
      </div>

      {/* content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title Section */}
        <div className="mb-3">
          <h3 className="text-xl font-bold text-gray-900 hover:text-emerald-600 line-clamp-2 leading-tight">
            <Link to={`/property/${id}`}>{title}</Link>
          </h3>
        </div>

        {/* Price Section */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-gray-900 text-left">
            {Number.isFinite(Number(price))
              ? isForSale
                ? `€${Number(price).toLocaleString()}`
                : `€${Number(price).toLocaleString()}/mo`
              : isForSale
              ? '€0'
              : '€0/mo'}
          </p>
        </div>

        <div className="flex-1" />

        {/* address */}
        <div className="flex items-center text-gray-500 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{location}</span>
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
            <span>{areaDisp} m²</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
