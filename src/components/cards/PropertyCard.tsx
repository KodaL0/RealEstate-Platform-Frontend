import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, ArrowLeft, ArrowRight, Heart, Eye } from 'lucide-react';
import { Property } from '../../types';
import FavouriteButton from '../FavouriteButton';

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
  onUnlikeSuccess?: (propertyId: number) => void;
  showFavoriteButton?: boolean;
}

/* helper: turn "2.0" → "2", keep 1.5 etc. */
const cleanNumber = (value: unknown): number | string => {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return Number.isInteger(num) ? num : num;
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
  const [isHovered, setIsHovered] = useState(false);
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

  const getCountryFlag = (country: string) => {
    switch (country) {
      case 'Greece': return '🇬🇷';
      case 'Cyprus': return '🇨🇾';
      default: return '🌍';
    }
  };

  const getCountryColor = (country: string) => {
    switch (country) {
      case 'Greece': return 'from-blue-600 to-blue-700';
      case 'Cyprus': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };
  
  return (
    <div
      className={`
        group bg-white rounded-2xl overflow-hidden
        shadow-md hover:shadow-2xl transition-all duration-500 ease-out
        flex flex-col h-full border border-gray-100
        hover:-translate-y-1 hover:border-gray-200
        ${featured ? 'col-span-2' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Enhanced Header Section */}
      <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Property Type with Icon */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="px-3 py-1.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs font-semibold rounded-full tracking-wide uppercase">
              {property_type.replace('_', ' ')}
            </span>
          </div>
          
          {/* Right: Country & Status */}
          <div className="flex items-center space-x-2">
            <span className={`
              px-3 py-1.5 bg-gradient-to-r ${getCountryColor(property.country)} 
              text-white text-xs font-medium rounded-full shadow-sm
              flex items-center space-x-1
            `}>
              <span>{getCountryFlag(property.country)}</span>
              <span>{property.country}</span>
            </span>
            <span className={`
              px-3 py-1.5 text-white text-xs font-semibold rounded-full shadow-sm
              ${isForSale 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
              }
            `}>
              {isForSale ? 'For Sale' : 'For Rent'}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Image Section */}
      <div className="relative overflow-hidden">
        {/* Image Navigation - Only show on hover if multiple images */}
        {imgCount > 1 && isHovered && (
          <>
            <button
              onClick={prevImage}
              className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white p-2.5 rounded-full shadow-lg z-10 transition-all duration-300 hover:scale-110"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white p-2.5 rounded-full shadow-lg z-10 transition-all duration-300 hover:scale-110"
            >
              <ArrowRight className="h-4 w-4 text-gray-700" />
            </button>
          </>
        )}

        {/* Image Indicators */}
        {imgCount > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentImage(index);
                }}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === currentImage 
                    ? 'bg-white shadow-lg' 
                    : 'bg-white/60 hover:bg-white/80'
                  }
                `}
              />
            ))}
          </div>
        )}

        <Link to={`/property/${id}`} className="block">
          <div className="relative overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className={`
                w-full object-cover transition-transform duration-700 ease-out
                group-hover:scale-105
                ${featured ? 'h-80' : 'h-64'}
              `}
            />
            {/* Subtle overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
            
            {/* View Property overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
                <Eye className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">View Property</span>
              </div>
            </div>
          </div>
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

      {/* Enhanced Content Section */}
      <div className="p-6 flex flex-col flex-1">
        {/* Title Section */}
        <div className="mb-4">
          <Link to={`/property/${id}`}>
            <h3 className="text-xl font-bold text-gray-900 hover:text-emerald-600 transition-colors duration-300 line-clamp-2 leading-tight">
              {title}
            </h3>
          </Link>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="h-4 w-4 mr-2 text-emerald-500" />
          <span className="text-sm font-medium">{location}</span>
        </div>

        {/* Price Section - Enhanced */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold text-gray-900">
              €{Number.isFinite(Number(price)) ? Number(price).toLocaleString() : '0'}
            </span>
            {!isForSale && (
              <span className="text-lg font-semibold text-gray-600">/mo</span>
            )}
          </div>
          {isForSale && (
            <p className="text-sm text-emerald-600 font-medium mt-1">Purchase Price</p>
          )}
        </div>

        <div className="flex-1" />

        {/* Enhanced Stats Section */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bed className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">{bedsDisp}</div>
              <div className="text-xs text-gray-600 font-medium">
                {bedsDisp === 1 ? 'Bedroom' : 'Bedrooms'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Bath className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">{bathsDisp}</div>
              <div className="text-xs text-gray-600 font-medium">
                {bathsDisp === 1 ? 'Bathroom' : 'Bathrooms'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Square className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">{areaDisp}</div>
              <div className="text-xs text-gray-600 font-medium">sq m</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;