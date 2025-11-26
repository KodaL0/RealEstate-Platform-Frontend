import {
  ArrowLeft,
  ArrowRight,
  Bath,
  Bed,
  Building2,
  MapPin,
  Square,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useImageCache } from "../../context/ImageCacheContext";
import { useImageLazyLoad } from "../../hooks/useImageLazyLoad";
import { useImagePreload } from "../../hooks/useImagePreload";
import { generateProjectSlug } from "../../utils/developerUtils";

interface ProjectImage {
  image: string;
  is_primary: boolean;
  display_order: number;
  created_at?: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  location: string;
  country: string;
  images?: ProjectImage[];
  url?: string;
  // Unit counts
  total_units?: number;
  available_units?: number;
  // Range fields (for sale or rent depending on endpoint)
  sale_bedrooms_min?: number;
  sale_bedrooms_max?: number;
  sale_bathrooms_min?: number;
  sale_bathrooms_max?: number;
  sale_area_min?: number;
  sale_area_max?: number;
  sale_price_min?: number;
  sale_price_max?: number;
  rent_bedrooms_min?: number;
  rent_bedrooms_max?: number;
  rent_bathrooms_min?: number;
  rent_bathrooms_max?: number;
  rent_area_min?: number;
  rent_area_max?: number;
  rent_price_min?: number;
  rent_price_max?: number;
  _type: "project";
}

interface ProjectCardProps {
  project: Project;
  listingType?: "sale" | "rent"; // Determines which ranges to display
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, listingType = "sale" }) => {
  const { id, name, location, country, images = [], url } = project;

  // Determine which ranges to use based on listingType
  const bedroomsMin =
    listingType === "sale" ? project.sale_bedrooms_min : project.rent_bedrooms_min;
  const bedroomsMax =
    listingType === "sale" ? project.sale_bedrooms_max : project.rent_bedrooms_max;
  const bathroomsMin =
    listingType === "sale" ? project.sale_bathrooms_min : project.rent_bathrooms_min;
  const bathroomsMax =
    listingType === "sale" ? project.sale_bathrooms_max : project.rent_bathrooms_max;
  const areaMin = listingType === "sale" ? project.sale_area_min : project.rent_area_min;
  const areaMax = listingType === "sale" ? project.sale_area_max : project.rent_area_max;
  const priceMin = listingType === "sale" ? project.sale_price_min : project.rent_price_min;
  const priceMax = listingType === "sale" ? project.sale_price_max : project.rent_price_max;

  // Construct project URL
  // If URL is provided and valid, use it
  // If URL ends with '/project', replace with actual project slug
  // Otherwise fallback to /project/{id} (legacy route)
  let projectUrl = url || `/project/${id}`;
  
  if (url && url.startsWith("/developers/")) {
    // Check if URL ends with '/project' (incomplete slug)
    if (url.endsWith("/project")) {
      // Generate project slug from name and replace '/project' with the actual slug
      const projectSlug = generateProjectSlug(name);
      projectUrl = url.replace("/project", `/${projectSlug}`);
    } else {
      // URL is already complete
      projectUrl = url;
    }
  }

  // Slideshow state
  const [currentImage, setCurrentImage] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const imgCount = images.length;

  // Touch/swipe state for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  // Lazy loading setup
  const cardRef = useRef<HTMLDivElement>(null);
  const { hasBeenVisible } = useImageLazyLoad(cardRef, { rootMargin: "200px" });

  const { getLoadingState } = useImageCache();

  const imageUrls = images.map((img) => img.image);
  const primaryImageUrl = imgCount > 0 ? imageUrls[0] : "";

  const shouldPreloadAll = hasInteracted || hasBeenVisible;
  const urlsToPreload = shouldPreloadAll ? imageUrls : primaryImageUrl ? [primaryImageUrl] : [];

  useImagePreload(urlsToPreload, {
    enabled: hasBeenVisible,
    priority: hasInteracted ? "high" : "normal",
  });

  useEffect(() => {
    if (!hasBeenVisible || hasInteracted) return;
    const timer = setTimeout(() => {
      setHasInteracted(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [hasBeenVisible, hasInteracted]);

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
      setHasInteracted(true);
      const newIndex = (currentImage + 1) % imgCount;
      setCurrentImage(newIndex);
    }

    if (isRightSwipe && imgCount > 0) {
      setHasInteracted(true);
      const newIndex = (currentImage - 1 + imgCount) % imgCount;
      setCurrentImage(newIndex);
    }
  };

  // Reset image error state when current image changes
  useEffect(() => {
    setImageError(false);
  }, []);

  const currentImageData = imgCount > 0 ? images[currentImage] : null;
  const imageUrl = currentImageData?.image || "/placeholder-property.jpg";
  const currentImageState = getLoadingState(imageUrl);
  const isCurrentImageLoading = currentImageState.loading;
  const isCurrentImageLoaded = currentImageState.loaded;
  const hasImageError = currentImageState.error;

  // Handle image load errors by falling back to placeholder
  const [imageError, setImageError] = useState(false);
  const effectiveImageUrl = hasImageError || imageError ? "/placeholder-property.jpg" : imageUrl;

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

  const formatPriceRange = (min?: number, max?: number) => {
    if (min === undefined && max === undefined) return null;
    if (min === max) return `€${Math.round(min).toLocaleString()}`;
    if (min && max) return `€${Math.round(min).toLocaleString()} - €${Math.round(max).toLocaleString()}`;
    if (min) return `From €${Math.round(min).toLocaleString()}`;
    if (max) return `Up to €${Math.round(max).toLocaleString()}`;
    return null;
  };

  const formatRange = (min?: number | null, max?: number | null, unit: string = "", showDecimals: boolean = false) => {
    if ((min === undefined || min === null) && (max === undefined || max === null)) return null;
    const formatValue = (val: number) => {
      if (showDecimals) {
        const rounded = Math.round(val * 10) / 10;
        return rounded % 1 === 0 ? rounded.toLocaleString() : rounded.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      } else {
        return Math.round(val).toLocaleString();
      }
    };
    if (min !== undefined && min !== null && max !== undefined && max !== null && min === max) {
      return `${formatValue(min)}${unit}`;
    }
    if (min !== undefined && min !== null && max !== undefined && max !== null) {
      return `${formatValue(min)}${unit} - ${formatValue(max)}${unit}`;
    }
    if (min !== undefined && min !== null) {
      return `From ${formatValue(min)}${unit}`;
    }
    if (max !== undefined && max !== null) {
      return `Up to ${formatValue(max)}${unit}`;
    }
    return null;
  };

  // Build stats array
  const stats = [];

  if (bedroomsMin !== undefined || bedroomsMax !== undefined) {
    const bedsRange = formatRange(bedroomsMin, bedroomsMax, "", false);
    if (bedsRange) {
      stats.push({
        key: "beds",
        label: "Bedrooms",
        value: bedsRange,
        icon: <Bed className="h-5 w-5 text-blue-600" />,
        iconWrapClass: "p-2 rounded-lg bg-blue-100",
      });
    }
  }

  if (bathroomsMin !== undefined || bathroomsMax !== undefined) {
    const bathsRange = formatRange(bathroomsMin, bathroomsMax, "", true);
    if (bathsRange) {
      stats.push({
        key: "baths",
        label: "Bathrooms",
        value: bathsRange,
        icon: <Bath className="h-5 w-5 text-emerald-600" />,
        iconWrapClass: "p-2 rounded-lg bg-emerald-100",
      });
    }
  }

  if ((areaMin !== undefined && areaMin !== null) || (areaMax !== undefined && areaMax !== null)) {
    // Use compact format for area range to prevent wrapping
    let areaRange: string | null = null;
    if (areaMin !== undefined && areaMin !== null && areaMax !== undefined && areaMax !== null) {
      if (areaMin === areaMax) {
        areaRange = `${Math.round(areaMin).toLocaleString()} m²`;
      } else {
        // Compact format: "64-100 m²" instead of "64 m² - 100 m²"
        areaRange = `${Math.round(areaMin).toLocaleString()}-${Math.round(areaMax).toLocaleString()} m²`;
      }
    } else if (areaMin !== undefined && areaMin !== null) {
      areaRange = `From ${Math.round(areaMin).toLocaleString()} m²`;
    } else if (areaMax !== undefined && areaMax !== null) {
      areaRange = `Up to ${Math.round(areaMax).toLocaleString()} m²`;
    }
    
    if (areaRange) {
      stats.push({
        key: "area",
        label: "Area",
        value: areaRange,
        icon: <Square className="h-5 w-5 text-purple-600" />,
        iconWrapClass: "p-2 rounded-lg bg-purple-100",
      });
    }
  }

  // Add available units if we have the data
  if (project.available_units !== undefined && project.total_units !== undefined) {
    stats.push({
      key: "units",
      label: "Available",
      value: `${project.available_units.toLocaleString()} / ${project.total_units.toLocaleString()}`,
      icon: <Building2 className="h-5 w-5 text-orange-600" />,
      iconWrapClass: "p-2 rounded-lg bg-orange-100",
    });
  }

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

  const priceRange = formatPriceRange(priceMin, priceMax);

  return (
    <div
      ref={cardRef}
      className={`
        group bg-white rounded-2xl overflow-hidden
        shadow-md hover:shadow-2xl transition-all duration-500 ease-out
        flex flex-col h-full border border-gray-100
        hover:-translate-y-1 hover:border-gray-200
      `}
    >
      {/* Enhanced Header Section */}
      <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Project Type */}
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-700 to-blue-800 text-white text-xs font-semibold rounded-full tracking-wide uppercase">
              Project
            </span>
          </div>

          {/* Right: Country & Status */}
          <div className="flex items-center space-x-2">
            <span
              className={`
              px-3 py-1.5 bg-gradient-to-r ${getCountryColor(country)} 
              text-white text-xs font-medium rounded-full shadow-sm
              flex items-center space-x-1
            `}
            >
              <span>{getCountryFlag(country)}</span>
              <span>{country}</span>
            </span>
            <span
              className={`
              px-3 py-1.5 text-white text-xs font-semibold rounded-full shadow-sm
              bg-gradient-to-r from-emerald-500 to-emerald-600
            `}
            >
              For Sale
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

        <Link to={projectUrl} className="block">
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

            {imgCount > 0 ? (
              <img
                src={effectiveImageUrl}
                alt={name}
                onError={() => {
                  // Fallback to placeholder on error
                  setImageError(true);
                }}
                className={`
                  w-full object-cover transition-all duration-300 ease-out
                  group-hover:scale-105
                  h-64
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
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gray-200">
                <Building2 className="h-16 w-16 text-gray-400" />
              </div>
            )}
            {/* Subtle hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300" />
          </div>
        </Link>
      </div>

      {/* Enhanced Content Section */}
      <div className="p-6 flex flex-col flex-1">
        {/* Title */}
        <div className="mb-4">
          <Link to={projectUrl}>
            <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-300 line-clamp-2 leading-tight">
              {name}
            </h3>
          </Link>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="h-4 w-4 mr-2 text-blue-500" />
          <span className="text-sm font-medium">{location}</span>
        </div>

        {/* Price */}
        {priceRange && (
          <div className="mb-6">
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-gray-900">{priceRange}</span>
            </div>
            <p className="text-sm text-blue-600 font-medium mt-1">
              {listingType === "sale" ? "Price Range" : "Rent Range"}
            </p>
          </div>
        )}

        <div className="flex-1" />

        {/* Dynamic stats in single line layout */}
        {stats.length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between gap-4">
              {stats.slice(0, 4).map((s, index) => (
                <div key={s.key} className="flex-1 text-center min-w-0">
                  <div className="flex items-center justify-center mb-1">
                    <div className={s.iconWrapClass}>{s.icon}</div>
                  </div>
                  <div className="text-base font-bold text-gray-900 leading-tight whitespace-nowrap overflow-hidden text-ellipsis px-1">{s.value}</div>
                  <div className="text-xs text-gray-600 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
