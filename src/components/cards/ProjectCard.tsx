import { ArrowLeft, ArrowRight, Bath, Bed, Building2, MapPin, Square } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useImageCache } from "../../context/ImageCacheContext";
import { useImageLazyLoad } from "../../hooks/useImageLazyLoad";
import { useImagePreload } from "../../hooks/useImagePreload";

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

  // Use the URL from API if available
  const projectUrl = url || `/project/${id}`;

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

  const currentImageData = imgCount > 0 ? images[currentImage] : null;
  const imageUrl = currentImageData?.image || "/placeholder-property.jpg";
  const currentImageState = getLoadingState(imageUrl);
  const isCurrentImageLoading = currentImageState.loading;
  const isCurrentImageLoaded = currentImageState.loaded;
  const [imageError, setImageError] = useState(false);
  const effectiveImageUrl = imageError ? "/placeholder-property.jpg" : imageUrl;

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
    if (min === max) return `€${min?.toLocaleString()}`;
    if (min && max) return `€${min.toLocaleString()} - €${max.toLocaleString()}`;
    if (min) return `From €${min.toLocaleString()}`;
    if (max) return `Up to €${max.toLocaleString()}`;
    return null;
  };

  const formatRange = (min?: number, max?: number, unit: string = "") => {
    if (min === undefined && max === undefined) return null;
    if (min === max) return `${min}${unit}`;
    if (min && max) return `${min}${unit} - ${max}${unit}`;
    if (min) return `From ${min}${unit}`;
    if (max) return `Up to ${max}${unit}`;
    return null;
  };

  // Build stats array
  const stats = [];

  if (bedroomsMin !== undefined || bedroomsMax !== undefined) {
    const bedsRange = formatRange(bedroomsMin, bedroomsMax);
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
    const bathsRange = formatRange(bathroomsMin, bathroomsMax);
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

  if (areaMin !== undefined || areaMax !== undefined) {
    const areaRange = formatRange(areaMin, areaMax, " m²");
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

  const priceRange = formatPriceRange(priceMin, priceMax);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200"
    >
      <Link to={projectUrl} className="block">
        {/* Image Container */}
        <div
          className="relative w-full h-64 bg-gray-200 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {imgCount > 0 ? (
            <>
              <img
                src={effectiveImageUrl}
                alt={name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isCurrentImageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onError={() => setImageError(true)}
                loading="lazy"
              />
              {isCurrentImageLoading && !isCurrentImageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Navigation Arrows */}
              {imgCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>

                  {/* Image Indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.slice(0, 5).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentImage ? "w-6 bg-white" : "w-1.5 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Building2 className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Project Type Badge */}
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              Project
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
            {name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-600 mb-3">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{location}</span>
            {country && (
              <>
                <span className="mx-1">•</span>
                <span className="text-sm">
                  {getCountryFlag(country)} {country}
                </span>
              </>
            )}
          </div>

          {/* Price */}
          {priceRange && <div className="text-xl font-bold text-blue-600 mb-3">{priceRange}</div>}

          {/* Stats */}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {stats.map((stat) => (
                <div
                  key={stat.key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50"
                >
                  <div className={stat.iconWrapClass}>{stat.icon}</div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">{stat.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProjectCard;
