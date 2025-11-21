import {
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  Bath,
  Bed,
  Calendar,
  Car,
  Layers, // for Total Floors
  MapPin,
  Square,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useImageCache } from "../../context/ImageCacheContext";
import { useImageLazyLoad } from "../../hooks/useImageLazyLoad";
import { useImagePreload } from "../../hooks/useImagePreload";
import type { Property } from "../../types";
import FavouriteButton from "../FavouriteButton";

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
  onUnlikeSuccess?: (propertyId: number) => void;
  showFavoriteButton?: boolean;
}

// tiny helpers for stats
const isSet = (v: unknown) =>
  v !== null && v !== undefined && (typeof v !== "string" || v.trim() !== "");

const asInt = (v: unknown) => {
  if (v === null || v === undefined || v === "") return undefined;
  const num = Number(v);
  return Number.isFinite(num) ? num : undefined;
};

type Stat = {
  key: string;
  label: string;
  value: string; // always a string for TS safety
  icon: JSX.Element;
  iconWrapClass: string; // the colored bubble behind the icon
  extraClasses?: string; // optional layout helpers (e.g. center single stat)
};

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  featured = false,
  onUnlikeSuccess,
  showFavoriteButton = true,
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
    url,
  } = property;

  // Use the URL from API if available, otherwise fall back to legacy format
  const propertyUrl = url || `/property/${id}`;

  // Slideshow state
  const [currentImage, setCurrentImage] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const imgCount = images.length;

  // Touch/swipe state for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px) to trigger a swipe
  const minSwipeDistance = 50;

  // Lazy loading setup
  const cardRef = useRef<HTMLDivElement>(null);
  const { hasBeenVisible } = useImageLazyLoad(cardRef, { rootMargin: "200px" });

  // Get image cache utilities
  const { getLoadingState } = useImageCache();

  // Prepare image URLs
  const imageUrls = images.map((img) => img.image);
  const primaryImageUrl = imgCount > 0 ? imageUrls[0] : "";

  // Preload strategy:
  // 1. Load primary image when card becomes visible
  // 2. Load all images after user interaction or after 500ms of being visible
  const shouldPreloadAll = hasInteracted || hasBeenVisible;
  const urlsToPreload = shouldPreloadAll ? imageUrls : primaryImageUrl ? [primaryImageUrl] : [];

  // Use the preload hook (we only care about the side effect, not the loading states)
  useImagePreload(urlsToPreload, {
    enabled: hasBeenVisible,
    priority: hasInteracted ? "high" : "normal",
  });

  // Auto-preload all images after being visible for 500ms
  useEffect(() => {
    if (!hasBeenVisible || hasInteracted) return;

    const timer = setTimeout(() => {
      setHasInteracted(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [hasBeenVisible, hasInteracted]);

  // Reset image error state when current image changes
  useEffect(() => {
    setImageError(false);
  }, []);

  const prevImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (imgCount > 0) {
      setHasInteracted(true);
      const newIndex = (currentImage - 1 + imgCount) % imgCount;
      setCurrentImage(newIndex);
    }
  };

  const nextImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (imgCount > 0) {
      setHasInteracted(true);
      const newIndex = (currentImage + 1) % imgCount;
      setCurrentImage(newIndex);
    }
  };

  // Touch handlers for swipe functionality
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && imgCount > 0) {
      // Swipe left = next image
      setHasInteracted(true);
      const newIndex = (currentImage + 1) % imgCount;
      setCurrentImage(newIndex);
    }

    if (isRightSwipe && imgCount > 0) {
      // Swipe right = previous image
      setHasInteracted(true);
      const newIndex = (currentImage - 1 + imgCount) % imgCount;
      setCurrentImage(newIndex);
    }
  };

  const currentImageData = imgCount > 0 ? images[currentImage] : null;
  const imageUrl = currentImageData?.image || "/placeholder-property.jpg";
  const currentImageState = getLoadingState(imageUrl);
  const isCurrentImageLoading = currentImageState.loading;
  const isCurrentImageLoaded = currentImageState.loaded;
  const hasImageError = currentImageState.error;

  // Handle image load errors by falling back to placeholder
  const [imageError, setImageError] = useState(false);
  const effectiveImageUrl = hasImageError || imageError ? "/placeholder-property.jpg" : imageUrl;

  const isForSale = property_status === "for_sale";

  const getCountryFlag = (country: string) => {
    switch (country) {
      case "Greece":
        return "🇬🇷";
      case "Cyprus":
        return "🇨🇾";
      default:
        return "🌍";
    }
  };

  const getCountryColor = (country: string) => {
    switch (country) {
      case "Greece":
        return "from-blue-600 to-blue-700";
      case "Cyprus":
        return "from-orange-500 to-orange-600";
      default:
        return "from-gray-600 to-gray-700";
    }
  };

  // ────────────────────────── DYNAMIC STATS (3 items) ──────────────────────────
  const getCardStats = (p: Property): Stat[] => {
    const t = String(p.property_type || "").toLowerCase();

    const _area = asInt(p.area);
    const _beds = asInt(p.bedrooms);
    const _baths = asInt(p.bathrooms);
    const _lot = asInt(p.lot_size);
    // Display "G" for ground floor (0), otherwise show the floor number
    const _floorRaw = asInt(p.floor_level);
    const _floor = _floorRaw !== undefined ? (_floorRaw === 0 ? "G" : String(_floorRaw)) : "";
    const _floors = asInt(p.total_floors);
    const _year = isSet(p.year_built) ? String(p.year_built) : "";
    const _parking = asInt(p.parking_spaces);

    // unified builders with colored icon bubbles — ALL values returned as strings
    const S = {
      area: (): Stat | null =>
        _area !== undefined
          ? {
              key: "area",
              label: "sq m",
              value: _area.toLocaleString(),
              icon: <Square className="h-5 w-5 text-purple-600" />,
              iconWrapClass: "p-2 rounded-lg bg-purple-100",
            }
          : null,
      beds: (): Stat | null =>
        _beds !== undefined
          ? {
              key: "beds",
              label: _beds === 1 ? "Bedroom" : "Bedrooms",
              value: String(_beds),
              icon: <Bed className="h-5 w-5 text-blue-600" />,
              iconWrapClass: "p-2 rounded-lg bg-blue-100",
            }
          : null,
      baths: (): Stat | null =>
        _baths !== undefined
          ? {
              key: "baths",
              label: _baths === 1 ? "Bathroom" : "Bathrooms",
              value: String(_baths),
              icon: <Bath className="h-5 w-5 text-emerald-600" />,
              iconWrapClass: "p-2 rounded-lg bg-emerald-100",
            }
          : null,
      lot: (): Stat | null =>
        _lot !== undefined
          ? {
              key: "lot",
              label: "Lot m²",
              value: _lot.toLocaleString(),
              icon: <MapPin className="h-5 w-5 text-fuchsia-600" />,
              iconWrapClass: "p-2 rounded-lg bg-fuchsia-100",
            }
          : null,
      floor: (): Stat | null =>
        _floor
          ? {
              key: "floor",
              label: "Floor",
              value: _floor,
              icon: <ArrowUpCircle className="h-5 w-5 text-slate-700" />,
              iconWrapClass: "p-2 rounded-lg bg-slate-100",
            }
          : null,
      floors: (): Stat | null =>
        _floors !== undefined
          ? {
              key: "floors",
              label: "Total Floors",
              value: String(_floors),
              icon: <Layers className="h-5 w-5 text-indigo-600" />,
              iconWrapClass: "p-2 rounded-lg bg-indigo-100",
            }
          : null,
      year: (): Stat | null =>
        _year
          ? {
              key: "year",
              label: "Year Built",
              value: _year,
              icon: <Calendar className="h-5 w-5 text-amber-600" />,
              iconWrapClass: "p-2 rounded-lg bg-amber-100",
            }
          : null,
      parking: (): Stat | null =>
        _parking !== undefined
          ? {
              key: "parking",
              label: "Parking",
              value: String(_parking),
              icon: <Car className="h-5 w-5 text-rose-600" />,
              iconWrapClass: "p-2 rounded-lg bg-rose-100",
            }
          : null,
    };

    // LAND: show lot size if available, otherwise area, otherwise show placeholder
    if (t === "land") {
      const lot = S.lot();
      if (lot) {
        return [{ ...lot, extraClasses: "col-start-2" }]; // center in grid-cols-3
      }
      const a = S.area();
      if (a) {
        return [{ ...a, extraClasses: "col-start-2" }]; // center in grid-cols-3
      }
      // If no lot size or area, show a placeholder for land properties
      return [
        {
          key: "lot",
          label: "Lot Size",
          value: "N/A",
          icon: <MapPin className="h-5 w-5 text-fuchsia-600" />,
          iconWrapClass: "p-2 rounded-lg bg-fuchsia-100",
          extraClasses: "col-start-2",
        },
      ];
    }

    // HOTEL
    if (t === "hotel") {
      const stats = [S.area(), S.floors(), S.year()].filter(Boolean) as Stat[];
      return stats.slice(0, 3);
    }

    // SHOP / OFFICE
    if (t === "shop" || t === "office") {
      const stats = [S.area(), S.floor(), S.floors()].filter(Boolean) as Stat[];
      return stats.slice(0, 3);
    }

    // RESIDENTIAL BUILDING
    if (t === "residential_building") {
      const stats = [S.area(), S.floors(), S.year()].filter(Boolean) as Stat[];
      return stats.slice(0, 3);
    }

    // HOMES
    if (t === "house" || t === "apartment" || t === "condo" || t === "townhouse") {
      const primary = [S.beds(), S.baths(), S.area()].filter(Boolean) as Stat[];
      if (primary.length >= 3) return primary.slice(0, 3);
      const fallback = [S.year(), S.floor(), S.parking(), S.floors(), S.lot(), S.area()].filter(
        Boolean,
      ) as Stat[];
      return [...primary, ...fallback].slice(0, 3);
    }

    // DEFAULT
    const any = [
      S.area(),
      S.year(),
      S.floor(),
      S.floors(),
      S.beds(),
      S.baths(),
      S.parking(),
      S.lot(),
    ].filter(Boolean) as Stat[];
    return any.slice(0, 3);
  };

  const stats = getCardStats(property);

  return (
    <div
      ref={cardRef}
      className={`
        group bg-white rounded-2xl overflow-hidden
        shadow-md hover:shadow-2xl transition-all duration-500 ease-out
        flex flex-col h-full border border-gray-100
        hover:-translate-y-1 hover:border-gray-200
        ${featured ? "col-span-2" : ""}
      `}
    >
      {/* Enhanced Header Section */}
      <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Property Type */}
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs font-semibold rounded-full tracking-wide uppercase">
              {property_type.replace("_", " ")}
            </span>
          </div>

          {/* Right: Country & Status */}
          <div className="flex items-center space-x-2">
            <span
              className={`
              px-3 py-1.5 bg-gradient-to-r ${getCountryColor(property.country)} 
              text-white text-xs font-medium rounded-full shadow-sm
              flex items-center space-x-1
            `}
            >
              <span>{getCountryFlag(property.country)}</span>
              <span>{property.country}</span>
            </span>
            <span
              className={`
              px-3 py-1.5 text-white text-xs font-semibold rounded-full shadow-sm
              ${
                isForSale
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                  : "bg-gradient-to-r from-indigo-500 to-indigo-600"
              }
            `}
            >
              {isForSale ? "For Sale" : "For Rent"}
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
              type="button"
              onClick={prevImage}
              className="absolute top-1/2 left-2 sm:left-3 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white p-2 sm:p-2.5 rounded-full shadow-lg z-10 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
            </button>
            <button
              type="button"
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
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentImage(index);
                }}
                aria-label={`View image ${index + 1}`}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${
                    index === currentImage
                      ? "bg-white shadow-lg w-6"
                      : "bg-white/60 hover:bg-white/80"
                  }
                `}
              />
            ))}
          </div>
        )}

        <Link to={propertyUrl} className="block">
          <div
            className="relative overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Loading overlay */}
            {isCurrentImageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <img
              src={effectiveImageUrl}
              alt={title}
              onError={() => {
                // Fallback to placeholder on error
                setImageError(true);
              }}
              className={`
                w-full object-cover transition-all duration-300 ease-out
                group-hover:scale-105
                ${featured ? "h-80" : "h-64"}
                ${isCurrentImageLoaded || imageError || hasImageError ? "opacity-100" : "opacity-0"}
                ${isCurrentImageLoading ? "opacity-50" : ""}
              `}
              style={{
                transition:
                  isCurrentImageLoaded || imageError || hasImageError
                    ? "opacity 0.3s ease-in-out"
                    : "none",
              }}
            />
            {/* Subtle hover overlay without "View Property" button */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300" />
          </div>
        </Link>

        {showFavoriteButton && (
          <div className="absolute top-4 right-4 z-20">
            <FavouriteButton
              itemId={id}
              itemType="property"
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
          <Link to={propertyUrl}>
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
              €{Number.isFinite(Number(price)) ? Number(price).toLocaleString() : "0"}
            </span>
            {property_status !== "for_sale" && (
              <span className="text-lg font-semibold text-gray-600">/mo</span>
            )}
          </div>
          {property_status === "for_sale" && (
            <p className="text-sm text-emerald-600 font-medium mt-1">Purchase Price</p>
          )}
        </div>

        <div className="flex-1" />

        {/* Dynamic 3 stats (land = only 1, centered) */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.key} className={`text-center ${s.extraClasses || ""}`}>
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
