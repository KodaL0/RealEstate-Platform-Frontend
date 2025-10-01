import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  ArrowLeft,
  ArrowRight,
  Eye,
  Calendar,
  Car,
  ArrowUpCircle,
  Layers, // for Total Floors
} from 'lucide-react';
import { Property } from '../../types';
import FavouriteButton from '../FavouriteButton';

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
  onUnlikeSuccess?: (propertyId: number) => void;
  showFavoriteButton?: boolean;
}

// tiny helpers for stats
const isSet = (v: unknown) =>
  v !== null && v !== undefined && (typeof v !== 'string' || v.trim() !== '');

const asInt = (v: unknown) =>
  Number.isFinite(Number(v)) ? Number(v) : undefined;

type Stat = {
  key: string;
  label: string;
  value: string;            // always a string for TS safety
  icon: JSX.Element;
  iconWrapClass: string;    // the colored bubble behind the icon
  extraClasses?: string;    // optional layout helpers (e.g. center single stat)
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
    is_favourite,
  } = property;

  // slideshow state
  const [currentImage, setCurrentImage] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const imgCount = images.length;
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Preload images for faster navigation
  useEffect(() => {
    if (images.length === 0) return;

    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if already cached
        if (imageCacheRef.current.has(src)) {
          resolve();
          return;
        }

        // Check if already loaded
        if (loadedImages.has(src)) {
          resolve();
          return;
        }

        // Set loading state
        setImageLoadingStates(prev => ({ ...prev, [src]: true }));

        const img = new Image();
        img.onload = () => {
          // Cache the image
          imageCacheRef.current.set(src, img);
          setLoadedImages(prev => new Set(prev).add(src));
          setImageLoadingStates(prev => ({ ...prev, [src]: false }));
          resolve();
        };
        img.onerror = () => {
          setImageLoadingStates(prev => ({ ...prev, [src]: false }));
          reject(new Error(`Failed to load image: ${src}`));
        };
        img.src = src;
      });
    };

    // Preload all images
    const preloadPromises = images.map(img => preloadImage(img.image));
    
    Promise.allSettled(preloadPromises).then(() => {
      console.log(`Preloaded ${images.length} images for property ${id}`);
    });

    // Cleanup function
    return () => {
      // Don't clear cache on unmount to keep images cached for other instances
    };
  }, [images, id, loadedImages]);

  const prevImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (imgCount > 0) {
      const newIndex = (currentImage - 1 + imgCount) % imgCount;
      setCurrentImage(newIndex);
      
      // Preload adjacent images for smoother navigation
      const prevIndex = (newIndex - 1 + imgCount) % imgCount;
      if (images[prevIndex] && !loadedImages.has(images[prevIndex].image)) {
        const img = new Image();
        img.src = images[prevIndex].image;
        img.onload = () => {
          imageCacheRef.current.set(images[prevIndex].image, img);
          setLoadedImages(prev => new Set(prev).add(images[prevIndex].image));
        };
      }
    }
  };
  
  const nextImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (imgCount > 0) {
      const newIndex = (currentImage + 1) % imgCount;
      setCurrentImage(newIndex);
      
      // Preload adjacent images for smoother navigation
      const nextIndex = (newIndex + 1) % imgCount;
      if (images[nextIndex] && !loadedImages.has(images[nextIndex].image)) {
        const img = new Image();
        img.src = images[nextIndex].image;
        img.onload = () => {
          imageCacheRef.current.set(images[nextIndex].image, img);
          setLoadedImages(prev => new Set(prev).add(images[nextIndex].image));
        };
      }
    }
  };

  const currentImageData = imgCount > 0 ? images[currentImage] : null;
  const imageUrl = currentImageData?.image || '/placeholder-property.jpg';
  const isCurrentImageLoaded = loadedImages.has(imageUrl);
  const isCurrentImageLoading = imageLoadingStates[imageUrl] || false;

  const isForSale = property_status === 'for_sale';

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

  // ────────────────────────── DYNAMIC STATS (3 items) ──────────────────────────
  const getCardStats = (p: Property): Stat[] => {
    const t = String(p.property_type || '').toLowerCase();

    const _area = asInt(p.area);
    const _beds = asInt(p.bedrooms);
    const _baths = asInt(p.bathrooms);
    const _lot = asInt(p.lot_size);
    // Display "G" for ground floor (0), otherwise show the floor number
    const _floorRaw = asInt(p.floor_level);
    const _floor = _floorRaw !== undefined ? (_floorRaw === 0 ? 'G' : String(_floorRaw)) : '';
    const _floors = asInt(p.total_floors);
    const _year = isSet(p.year_built) ? String(p.year_built) : '';
    const _parking = asInt(p.parking_spaces);

    // unified builders with colored icon bubbles — ALL values returned as strings
    const S = {
      area: (): Stat | null =>
        _area !== undefined
          ? {
              key: 'area',
              label: 'sq m',
              value: _area.toLocaleString(),
              icon: <Square className="h-5 w-5 text-purple-600" />,
              iconWrapClass: 'p-2 rounded-lg bg-purple-100',
            }
          : null,
      beds: (): Stat | null =>
        _beds !== undefined
          ? {
              key: 'beds',
              label: _beds === 1 ? 'Bedroom' : 'Bedrooms',
              value: String(_beds),
              icon: <Bed className="h-5 w-5 text-blue-600" />,
              iconWrapClass: 'p-2 rounded-lg bg-blue-100',
            }
          : null,
      baths: (): Stat | null =>
        _baths !== undefined
          ? {
              key: 'baths',
              label: _baths === 1 ? 'Bathroom' : 'Bathrooms',
              value: String(_baths),
              icon: <Bath className="h-5 w-5 text-emerald-600" />,
              iconWrapClass: 'p-2 rounded-lg bg-emerald-100',
            }
          : null,
      lot: (): Stat | null =>
        _lot !== undefined
          ? {
              key: 'lot',
              label: 'Lot m²',
              value: _lot.toLocaleString(),
              icon: <MapPin className="h-5 w-5 text-fuchsia-600" />,
              iconWrapClass: 'p-2 rounded-lg bg-fuchsia-100',
            }
          : null,
      floor: (): Stat | null =>
        _floor
          ? {
              key: 'floor',
              label: 'Floor',
              value: _floor,
              icon: <ArrowUpCircle className="h-5 w-5 text-slate-700" />,
              iconWrapClass: 'p-2 rounded-lg bg-slate-100',
            }
          : null,
      floors: (): Stat | null =>
        _floors !== undefined
          ? {
              key: 'floors',
              label: 'Total Floors',
              value: String(_floors),
              icon: <Layers className="h-5 w-5 text-indigo-600" />,
              iconWrapClass: 'p-2 rounded-lg bg-indigo-100',
            }
          : null,
      year: (): Stat | null =>
        _year
          ? {
              key: 'year',
              label: 'Year Built',
              value: _year,
              icon: <Calendar className="h-5 w-5 text-amber-600" />,
              iconWrapClass: 'p-2 rounded-lg bg-amber-100',
            }
          : null,
      parking: (): Stat | null =>
        _parking !== undefined
          ? {
              key: 'parking',
              label: 'Parking',
              value: String(_parking),
              icon: <Car className="h-5 w-5 text-rose-600" />,
              iconWrapClass: 'p-2 rounded-lg bg-rose-100',
            }
          : null,
    };

    // LAND: show lot size if available, otherwise area
    if (t === 'land') {
      const lot = S.lot();
      if (lot) {
        return [{ ...lot, extraClasses: 'col-start-2' }]; // center in grid-cols-3
      }
      const a = S.area();
      if (!a) return []; // if no area or lot, show nothing
      return [{ ...a, extraClasses: 'col-start-2' }]; // center in grid-cols-3
    }

    // HOTEL
    if (t === 'hotel') {
      const stats = [S.area(), S.floors(), S.year()].filter(Boolean) as Stat[];
      return stats.slice(0, 3);
    }

    // SHOP / OFFICE
    if (t === 'shop' || t === 'office') {
      const stats = [S.area(), S.floor(), S.floors()].filter(Boolean) as Stat[];
      return stats.slice(0, 3);
    }

    // RESIDENTIAL BUILDING
    if (t === 'residential_building') {
      const stats = [S.area(), S.floors(), S.year()].filter(Boolean) as Stat[];
      return stats.slice(0, 3);
    }

    // HOMES
    if (t === 'house' || t === 'apartment' || t === 'condo' || t === 'townhouse') {
      const primary = [S.beds(), S.baths(), S.area()].filter(Boolean) as Stat[];
      if (primary.length >= 3) return primary.slice(0, 3);
      const fallback = [S.year(), S.floor(), S.parking(), S.floors(), S.lot(), S.area()]
        .filter(Boolean) as Stat[];
      return [...primary, ...fallback].slice(0, 3);
    }

    // DEFAULT
    const any = [S.area(), S.year(), S.floor(), S.floors(), S.beds(), S.baths(), S.parking(), S.lot()]
      .filter(Boolean) as Stat[];
    return any.slice(0, 3);
  };

  const stats = getCardStats(property);

  return (
    <div
      className={`
        group bg-white rounded-2xl overflow-hidden
        shadow-md hover:shadow-2xl transition-all duration-500 ease-out
        flex flex-col h-full border border-gray-100
        hover:-translate-y-1 hover:border-gray-200
        ${featured ? 'col-span-2' : ''}
      `}
    >
      {/* Enhanced Header Section */}
      <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Property Type */}
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
        {/* Navigation Arrows - Always visible */}
        {imgCount > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute top-1/2 left-2 sm:left-3 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white p-2 sm:p-2.5 rounded-full shadow-lg z-10 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white p-2 sm:p-2.5 rounded-full shadow-lg z-10 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Image Indicators - Always visible */}
        {imgCount > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentImage(index);
                }}
                aria-label={`View image ${index + 1}`}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === currentImage 
                    ? 'bg-white shadow-lg w-6' 
                    : 'bg-white/60 hover:bg-white/80'
                  }
                `}
              />
            ))}
          </div>
        )}

        <Link to={`/property/${id}`} className="block">
          <div className="relative overflow-hidden">
            {/* Loading overlay */}
            {isCurrentImageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            <img
              src={imageUrl}
              alt={title}
              className={`
                w-full object-cover transition-all duration-300 ease-out
                group-hover:scale-105
                ${featured ? 'h-80' : 'h-64'}
                ${isCurrentImageLoaded ? 'opacity-100' : 'opacity-0'}
                ${isCurrentImageLoading ? 'opacity-50' : ''}
              `}
              style={{
                transition: isCurrentImageLoaded ? 'opacity 0.3s ease-in-out' : 'none'
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
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
        {/* Title */}
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

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold text-gray-900">
              €{Number.isFinite(Number(price)) ? Number(price).toLocaleString() : '0'}
            </span>
            {property_status !== 'for_sale' && (
              <span className="text-lg font-semibold text-gray-600">/mo</span>
            )}
          </div>
          {property_status === 'for_sale' && (
            <p className="text-sm text-emerald-600 font-medium mt-1">Purchase Price</p>
          )}
        </div>

        <div className="flex-1" />

        {/* Dynamic 3 stats (land = only 1, centered) */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.key} className={`text-center ${s.extraClasses || ''}`}>
                <div className="flex items-center justify-center mb-2">
                  <div className={s.iconWrapClass}>{s.icon}</div>
                </div>
                <div className="text-lg font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-600 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
