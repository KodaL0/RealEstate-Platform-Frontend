// src/pages/PropertyDetails.tsx

import {
  Accessibility,
  Anchor,
  Archive,
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  Baby,
  Bath,
  Bed,
  Bell,
  Building2,
  Calculator,
  Calendar,
  Car,
  CheckCircle,
  Crown,
  DoorOpen,
  Droplet,
  Dumbbell,
  Eye,
  Flame,
  Flower,
  Glasses,
  Home,
  MapPin,
  Package,
  Palette,
  Satellite,
  Shield,
  Smile,
  Square,
  Sun,
  Thermometer,
  TreePine,
  Umbrella,
  UserCheck,
  Utensils,
  Wifi,
  Wind,
  X,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ChatButton from "../components/ChatButton";
import FavouriteButton from "../components/FavouriteButton";
import { geocodeAddress } from "../components/geocode";
import LLMPropertyData from "../components/llms/llm-properties";
import MapView from "../components/MapView";
import PropertyDocuments from "../components/PropertyDocuments";
import SEO from "../components/SEO";
import api from "../config/api";
import { useUser } from "../context/UserContext";
import { AMENITIES, type Property, type PropertyImage } from "../types";
import analytics from "../utils/analytics";

const normaliseImages = (imgs: any[] = []): PropertyImage[] =>
  imgs.map((i) => (typeof i === "string" ? { image: i } : i));

// --- responsive helpers for thumbnail row ---
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    // Safari compat
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
    } else {
      // Safari legacy support
      (mql as { addListener: (callback: (e: MediaQueryListEvent) => void) => void }).addListener(
        onChange,
      );
    }
    setMatches(mql.matches);
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange);
      } else {
        // Safari legacy support
        (
          mql as { removeListener: (callback: (e: MediaQueryListEvent) => void) => void }
        ).removeListener(onChange);
      }
    };
  }, [query]);
  return matches;
};

const useThumbsPerRow = () => {
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isMd = useMediaQuery("(min-width: 768px)");
  // Keep in sync with: grid-cols-5 md:grid-cols-8 lg:grid-cols-10
  return isLg ? 10 : isMd ? 8 : 5;
};

const mapPropertyData = (raw: any): Property => ({
  id: raw?.id ?? 0,
  title: raw?.title ?? "Untitled Property",
  description: raw?.description ?? "",
  price: raw?.price ? +raw.price : 0,
  location: raw?.location ?? "",
  country: raw?.country ?? "",
  property_type: raw?.property_type ?? "",
  bedrooms: raw?.bedrooms ?? 0,
  bathrooms: raw?.bathrooms ? +raw.bathrooms : 0,
  area: raw?.area ? +raw.area : 0,
  year_built: raw?.year_built ?? "",
  parking_spaces: raw?.parking_spaces ?? 0,
  lot_size: raw?.lot_size ?? "",
  property_status: raw?.property_status ?? "unavailable",
  energy_rating: raw?.energy_rating ?? "",
  construction_material: raw?.construction_material ?? "",
  floor_level: raw?.floor_level ?? "",
  total_floors: raw?.total_floors ?? "",
  available_from: raw?.available_from ?? "",
  contact_phone: raw?.contact_phone ?? "",
  contact_email: raw?.contact_email ?? "",
  virtual_tour_url: raw?.virtual_tour_url ?? "",
  video_url: raw?.video_url ?? "",
  amenities: raw?.amenities ?? [],

  owner: raw?.owner ?? null,
  is_published: raw?.is_published ?? false,
  created_at: raw?.created_at ?? "",
  updated_at: raw?.updated_at ?? "",
  images: normaliseImages(raw?.images),
  documents: raw?.documents ?? [],
  is_favourite: raw?.is_favourite ?? false,
  // Add latitude/longitude if API returns them:
  latitude: raw?.latitude != null ? +raw.latitude : undefined,
  longitude: raw?.longitude != null ? +raw.longitude : undefined,
  // Add canonical URL for SEO
  url: raw?.url ?? undefined,
});

// Which specs are relevant per property_type
const PTYPE_FIELDS: Record<
  string,
  Array<
    | "bedrooms"
    | "bathrooms"
    | "area"
    | "year_built"
    | "parking_spaces"
    | "lot_size"
    | "floor_level"
    | "total_floors"
    | "energy_rating"
    | "construction_material"
  >
> = {
  land: ["lot_size", "construction_material"], // no energy for land
  house: [
    "bedrooms",
    "bathrooms",
    "area",
    "year_built",
    "parking_spaces",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
    "lot_size",
  ],
  apartment: [
    "bedrooms",
    "bathrooms",
    "area",
    "year_built",
    "parking_spaces",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
  ],
  condo: [
    "bedrooms",
    "bathrooms",
    "area",
    "year_built",
    "parking_spaces",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
  ],
  townhouse: [
    "bedrooms",
    "bathrooms",
    "area",
    "year_built",
    "parking_spaces",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
    "lot_size",
  ],
  hotel: ["area", "year_built", "total_floors", "energy_rating", "construction_material"],
  shop: [
    "area",
    "year_built",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
    "parking_spaces",
  ],
  office: [
    "area",
    "year_built",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
    "parking_spaces",
  ],
  residential_building: [
    "area",
    "year_built",
    "total_floors",
    "energy_rating",
    "construction_material",
  ],
};

// accept both strings ("15") and numbers; treat 0/"" as missing
const hasNum = (v: any) =>
  v !== undefined && v !== null && String(v).trim() !== "" && Number(v) > 0;
const hasText = (v: any) => v !== undefined && v !== null && String(v).trim() !== "";

const amenityIcons: Record<string, JSX.Element> = {
  // Building & Infrastructure
  elevator: <ArrowUpCircle className="h-5 w-5 mr-3 text-emerald-600" />,
  internal_staircase: <ArrowUpCircle className="h-5 w-5 mr-3 text-emerald-600" />,
  secure_door: <Shield className="h-5 w-5 mr-3 text-emerald-600" />,
  manned_reception: <UserCheck className="h-5 w-5 mr-3 text-emerald-600" />,
  attic: <Home className="h-5 w-5 mr-3 text-emerald-600" />,
  facade: <Building2 className="h-5 w-5 mr-3 text-emerald-600" />,
  corner: <MapPin className="h-5 w-5 mr-3 text-emerald-600" />,

  // Interior Features
  frames_wooden: <TreePine className="h-5 w-5 mr-3 text-emerald-600" />,
  floor_marble: <Square className="h-5 w-5 mr-3 text-emerald-600" />,
  single_glass: <Glasses className="h-5 w-5 mr-3 text-emerald-600" />,
  bright: <Sun className="h-5 w-5 mr-3 text-emerald-600" />,
  airy: <Wind className="h-5 w-5 mr-3 text-emerald-600" />,
  fireplace: <Flame className="h-5 w-5 mr-3 text-emerald-600" />,
  furnished: <Bed className="h-5 w-5 mr-3 text-emerald-600" />,
  storage: <Archive className="h-5 w-5 mr-3 text-emerald-600" />,
  painted: <Palette className="h-5 w-5 mr-3 text-emerald-600" />,
  luxury_home: <Crown className="h-5 w-5 mr-3 text-emerald-600" />,
  playroom: <Baby className="h-5 w-5 mr-3 text-emerald-600" />,

  // Climate & Comfort
  underfloor_heating: <Thermometer className="h-5 w-5 mr-3 text-emerald-600" />,
  air_conditioning: <Wind className="h-5 w-5 mr-3 text-emerald-600" />,
  solar_water_heating: <Sun className="h-5 w-5 mr-3 text-emerald-600" />,
  night_power: <Zap className="h-5 w-5 mr-3 text-emerald-600" />,

  // Exterior & Outdoor
  garden: <Flower className="h-5 w-5 mr-3 text-emerald-600" />,
  swimming_pool: <Droplet className="h-5 w-5 mr-3 text-emerald-600" />,
  awning: <Umbrella className="h-5 w-5 mr-3 text-emerald-600" />,
  built_in_bbq: <Utensils className="h-5 w-5 mr-3 text-emerald-600" />,
  window_screens: <Glasses className="h-5 w-5 mr-3 text-emerald-600" />,
  balcony: <DoorOpen className="h-5 w-5 mr-3 text-emerald-600" />,

  // Parking & Access
  parking_space: <Car className="h-5 w-5 mr-3 text-emerald-600" />,
  garage: <Car className="h-5 w-5 mr-3 text-emerald-600" />,
  access_disabled: <Accessibility className="h-5 w-5 mr-3 text-emerald-600" />,
  ev_charging: <Zap className="h-5 w-5 mr-3 text-emerald-600" />,

  // Security & Safety
  alarm: <Bell className="h-5 w-5 mr-3 text-emerald-600" />,
  security_system: <Shield className="h-5 w-5 mr-3 text-emerald-600" />,
  doorman: <UserCheck className="h-5 w-5 mr-3 text-emerald-600" />,

  // Utilities & Technology
  satellite_receiver: <Satellite className="h-5 w-5 mr-3 text-emerald-600" />,
  wifi: <Wifi className="h-5 w-5 mr-3 text-emerald-600" />,
  dishwasher: <Package className="h-5 w-5 mr-3 text-emerald-600" />,
  laundry: <CheckCircle className="h-5 w-5 mr-3 text-emerald-600" />,

  // Location & Views
  residential_zone: <MapPin className="h-5 w-5 mr-3 text-emerald-600" />,
  view: <Eye className="h-5 w-5 mr-3 text-emerald-600" />,
  waterfront: <Anchor className="h-5 w-5 mr-3 text-emerald-600" />,

  // Community & Shared
  gym: <Dumbbell className="h-5 w-5 mr-3 text-emerald-600" />,
  pool: <Droplet className="h-5 w-5 mr-3 text-emerald-600" />,
  roof_deck: <Sun className="h-5 w-5 mr-3 text-emerald-600" />,

  // Policy & Lifestyle
  pets: <Smile className="h-5 w-5 mr-3 text-emerald-600" />,

  // Legacy amenities
  parking: <Car className="h-5 w-5 mr-3 text-emerald-600" />,
  ac: <Wind className="h-5 w-5 mr-3 text-emerald-600" />,
  heating: <Flame className="h-5 w-5 mr-3 text-emerald-600" />,

  default: <CheckCircle className="h-5 w-5 mr-3 text-emerald-600" />,
};

/* ───────────────── component ───────────────── */

const PropertyDetails: React.FC = () => {
  // Support both URL formats:
  // Legacy: /property/:id
  // New: /:username/:country/:locationSlug (where locationSlug = location-type-id)
  const { id, username, country, locationSlug } = useParams<{
    id?: string;
    username?: string;
    country?: string;
    locationSlug?: string;
  }>();

  const navigate = useNavigate();

  // Extract property ID from either format
  const propertyId = id || (locationSlug ? locationSlug.split("-").pop() : null);
  const numericId = propertyId ? Number(propertyId) : 0;

  // If we have username/country but no locationSlug, redirect to user profile
  // This handles URLs like /john_doe/cyprus (which should go to profile, not property)
  useEffect(() => {
    if (username && country && !locationSlug && !id) {
      navigate(`/${username}`, { replace: true });
    }
  }, [username, country, locationSlug, id, navigate]);

  const thumbsPerRow = useThumbsPerRow();
  const { user, isLoading: userLoading } = useUser();
  const [property, setProperty] = useState<Property | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeImage, setActiveImage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [imageOrientation, setImageOrientation] = useState<"portrait" | "landscape" | "square">(
    "landscape",
  );

  // thumbnails collapse/expand
  const [showAllThumbs, setShowAllThumbs] = useState(false);

  // Helper functions for image handling (must be declared before useEffect that uses them)
  const toUrl = (img: { image: string }) => img.image;

  // Function to detect image orientation
  const getImageOrientation = (imageUrl: string): Promise<"portrait" | "landscape" | "square"> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        if (ratio > 1.2) resolve("landscape");
        else if (ratio < 0.8) resolve("portrait");
        else resolve("square");
      };
      img.onerror = () => resolve("landscape"); // fallback
      img.src = imageUrl;
    });
  };

  useEffect(() => {
    if (!numericId || userLoading) return;
    let isMounted = true;

    const fetchProperty = async () => {
      setLoading(true);
      try {
        const response = await api.get(`properties/${numericId}`);
        const mapped = mapPropertyData(response.data);
        if (!isMounted) return;
        setProperty(mapped);

        // REDIRECT LEGACY URLs TO CANONICAL URLs
        // If we're on the old /property/:id format, redirect to the new SEO-friendly format
        if (id && !locationSlug && mapped.url) {
          console.log(`Redirecting from legacy URL /property/${id} to canonical URL ${mapped.url}`);
          navigate(mapped.url, { replace: true });
          return; // Don't continue with setup if redirecting
        }

        // Track property view
        analytics.trackPropertyView({
          property_id: String(mapped.id),
          property_type: mapped.property_type,
          price: mapped.price,
          location: mapped.city || mapped.location,
          bedrooms: mapped.bedrooms,
          bathrooms: mapped.bathrooms,
          area: mapped.area,
          property_status: mapped.property_status,
          owner_username: mapped.owner?.username,
        });

        // ── COORDINATE LOGIC ───────────────────────────────────────
        if (mapped.latitude != null && mapped.longitude != null) {
          setCoords({ lat: mapped.latitude, lng: mapped.longitude });
        } else if (mapped.location) {
          try {
            const real = await geocodeAddress(mapped.location, user?.email);
            if (isMounted) setCoords(real);
          } catch (geoErr) {
            console.error("Geocoding failed:", geoErr);
          }
        }
        // ───────────────────────────────────────────────────────────

        if (mapped.images.length > 0) {
          setActiveImage(0);
          setLightboxIdx(0);
        }
      } catch (err) {
        console.error("Failed to fetch property details:", err);
        analytics.trackError("property_fetch", String(err), "PropertyDetails");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProperty();
    return () => {
      isMounted = false;
    };
  }, [numericId, userLoading, user?.email, id, locationSlug, navigate]);

  const totalImages = property?.images.length ?? 0;

  const openLightbox = (idx: number) => {
    if (totalImages > 0) {
      setLightboxIdx(idx);
      setLightboxOpen(true);
    }
  };
  const closeLightbox = () => setLightboxOpen(false);
  const prevImg = useCallback(() => {
    setLightboxIdx((i) => {
      const newIdx = i === 0 ? totalImages - 1 : i - 1;
      if (property) {
        analytics.trackPropertyImageView(String(property.id), newIdx, totalImages);
      }
      return newIdx;
    });
  }, [totalImages, property]);
  const nextImg = useCallback(() => {
    setLightboxIdx((i) => {
      const newIdx = i === totalImages - 1 ? 0 : i + 1;
      if (property) {
        analytics.trackPropertyImageView(String(property.id), newIdx, totalImages);
      }
      return newIdx;
    });
  }, [totalImages, property]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImg();
      if (e.key === "ArrowRight") nextImg();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, prevImg, nextImg, closeLightbox]);

  // Update image orientation when lightbox image changes
  useEffect(() => {
    if (lightboxOpen && property?.images[lightboxIdx]) {
      getImageOrientation(toUrl(property.images[lightboxIdx])).then(setImageOrientation);
    }
  }, [lightboxOpen, lightboxIdx, property?.images, getImageOrientation, toUrl]);

  if (loading || userLoading) {
    return (
      <div className="pt-20 min-h-screen flex justify-center items-center">
        <p className="text-xl text-gray-600">Loading…</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-20 min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Property not found</h2>
          <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const pTypeKey = String(property.property_type || "").toLowerCase();
  const allowed = new Set(PTYPE_FIELDS[pTypeKey] || []);
  const allowedField = (k: string) => allowed.has(k as any);

  // Conditional className based on image orientation
  const getImageClassName = () => {
    const baseClasses = "object-contain rounded-lg shadow-2xl";

    switch (imageOrientation) {
      case "portrait":
        return `${baseClasses} max-h-[85vh] max-w-[70vw] md:min-w-[600px] lg:min-w-[700px] xl:min-w-[800px]`;
      case "landscape":
        return `${baseClasses} max-h-[85vh] max-w-[90vw] md:min-h-[400px] lg:min-h-[500px]`;
      default:
        return `${baseClasses} max-h-[85vh] max-w-[90vw] md:min-w-[400px] md:min-h-[400px] lg:min-w-[500px] lg:min-h-[500px]`;
    }
  };

  const unpublishedBanner = !property.is_published ? (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
      <p className="text-sm text-amber-700">This property is not published. Only you can see it.</p>
    </div>
  ) : null;

  const formatFloor = (v: string | number | undefined | null) => {
    if (v === undefined || v === null || String(v).trim() === "") return "N/A";
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    if (n === 0) return "Ground";
    const absNum = Math.abs(n);
    const tens = absNum % 100;
    if (tens >= 11 && tens <= 13) return `${n}th`;
    const unit = absNum % 10;
    return `${n}${unit === 1 ? "st" : unit === 2 ? "nd" : unit === 3 ? "rd" : "th"}`;
  };

  // Generate SEO data
  // Use canonical URL for SEO, fallback to legacy format if not available
  const propertyUrl = property.url || `/property/${property.id}`;
  const primaryImage = property.images?.[0];
  const imageUrl = primaryImage
    ? typeof primaryImage === "string"
      ? primaryImage
      : primaryImage.image
    : undefined;

  // Generate rich description for SEO
  const seoDescription = `${property.property_type} for ${property.property_status.replace("_", " ")} in ${property.city || property.location}. ${property.bedrooms} bed, ${property.bathrooms} bath, ${property.area}m². Price: €${property.price.toLocaleString()}. ${property.description.substring(0, 100)}...`;

  // Generate keywords
  const seoKeywords = [
    property.city,
    property.region,
    property.property_type,
    `${property.bedrooms} bedroom`,
    property.property_status.replace("_", " "),
    "Cyprus property",
    "real estate Cyprus",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="pt-14 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* SEO Meta Tags for Google Search */}
      <SEO
        title={property.title}
        description={seoDescription}
        keywords={seoKeywords}
        image={imageUrl}
        imageAlt={`${property.title} - ${property.city}`}
        url={propertyUrl}
        canonical={property.url ? `https://www.propertpro.com${property.url}` : undefined}
        type="property"
        price={property.price}
        currency="EUR"
        location={(() => {
          const parts = [];
          if (property.city) parts.push(property.city);
          if (property.region) parts.push(property.region);
          if (property.country) parts.push(property.country);
          return parts.length > 0 ? parts.join(', ') : (property.location || 'Unknown Location');
        })()}
        propertyType={property.property_type}
        publishedTime={property.created_at}
        modifiedTime={property.updated_at}
      />

      {/* LLM structured data for AI agents and search engines */}
      <LLMPropertyData property={property} />

      {lightboxOpen && totalImages > 0 && (
        <div
          className="fixed inset-0 bg-black z-[9999] flex flex-col justify-center items-center"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            const startX = touch.clientX;
            const startY = touch.clientY;

            const handleTouchEnd = (ev: TouchEvent) => {
              const t = ev.changedTouches[0];
              const endX = t.clientX;
              const endY = t.clientY;
              const diffX = startX - endX;
              const diffY = startY - endY;

              // Only handle horizontal swipes (ignore vertical swipes)
              if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) nextImg();
                else prevImg();
              }

              document.removeEventListener("touchend", handleTouchEnd);
            };

            document.addEventListener("touchend", handleTouchEnd);
          }}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Main image - fully centered with bottom padding for controls */}
          <div className="relative w-full h-full flex items-center justify-center p-4 pb-20 sm:pb-24 md:pb-28">
            <img
              src={toUrl(property.images[lightboxIdx])}
              alt={property.title || "Property image"}
              className={getImageClassName()}
            />
          </div>

          {/* Navigation controls - centered at bottom */}
          {totalImages > 1 && (
            <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 shadow-lg">
                <button
                  onClick={prevImg}
                  className="text-white hover:text-gray-300 transition-colors duration-200 p-1 sm:p-1.5 md:p-2 hover:scale-110 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
                <span className="text-white text-xs sm:text-sm md:text-base font-medium px-2 sm:px-3 md:px-4">
                  {lightboxIdx + 1} / {totalImages}
                </span>
                <button
                  onClick={nextImg}
                  className="text-white hover:text-gray-300 transition-colors duration-200 p-1 sm:p-1.5 md:p-2 hover:scale-110 active:scale-95"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {unpublishedBanner}

        {/* 1. Title */}
        <section className="bg-white rounded-lg shadow-md mb-6 overflow-hidden max-w-3xl mx-auto relative">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 p-0.5 animate-pulse">
            <div className="bg-white rounded-lg h-full w-full"></div>
          </div>
          <div className="relative px-6 py-5">
            <h1 className="text-xl font-semibold text-gray-800 leading-relaxed text-center">
              {property.title}
            </h1>
          </div>
        </section>

        {/* 2. Price, Status and Actions */}
        <section
          className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden w-full"
          style={{
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="px-4 py-3">
            {/* Property Status and Actions */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    property.property_status === "for_sale"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {property.property_status === "for_sale" ? "For Sale" : "For Rent"}
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                  {property.property_type}
                </span>
              </div>
              <div className="scale-100">
                <FavouriteButton
                  itemId={numericId}
                  itemType="property"
                  defaultLiked={!!property?.is_favourite}
                />
              </div>
            </div>

            {/* Price and Mortgage Calculator */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div className="text-center md:text-left mb-1 md:mb-0">
                <p className="text-2xl font-bold text-gray-900">
                  €{Number.isFinite(property.price) ? property.price.toLocaleString() : "0"}
                </p>
              </div>
              {property.property_status === "for_sale" && (
                <div className="text-center md:text-right">
                  <button
                    onClick={() => {
                      if (property.price && property.price > 0) {
                        navigate(
                          `/mortgage-calculator?price=${property.price}&down=20&term=30&rate=5.5`,
                        );
                      }
                    }}
                    disabled={!property.price || property.price <= 0}
                    className={`inline-flex items-center px-4 py-2 ${
                      property.price && property.price > 0
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-300 cursor-not-allowed"
                    } text-white text-sm font-medium rounded-lg transition-colors shadow-sm`}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Mortgage
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Property Images */}
        <section className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 mb-12">
          <div className="flex flex-col">
            {/* Main Image */}
            <div className="w-full">
              {totalImages > 0 ? (
                <div
                  className="relative h-80 lg:h-[400px] cursor-zoom-in group"
                  onClick={() => openLightbox(activeImage)}
                >
                  <img
                    src={toUrl(property.images[activeImage])}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt={property.title || "Property image"}
                  />
                  {/* Overlay gradient for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                  {/* Zoom indicator */}
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Click to zoom
                  </div>
                </div>
              ) : (
                <div className="relative h-96 lg:h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-500 font-medium">No images available</span>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Images at Bottom */}
            {totalImages > 0 && (
              <div className="bg-gray-50 p-6">
                {(() => {
                  const maxThumbs = thumbsPerRow; // <-- use the hook value from top

                  // indices to show (one row when collapsed)
                  const indices = showAllThumbs
                    ? property.images.map((_, i) => i)
                    : Array.from({ length: Math.min(maxThumbs, totalImages) }, (_, i) => i);

                  return (
                    <>
                      <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
                        {indices.map((idx) => {
                          const img = property.images[idx];
                          return (
                            <div
                              key={idx}
                              className={`relative w-full pt-[100%] overflow-hidden rounded-xl border-2 transition-all duration-200 group cursor-pointer ${
                                idx === activeImage
                                  ? "border-blue-500 shadow-lg scale-105"
                                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                              }`}
                            >
                              <img
                                src={toUrl(img)}
                                onClick={() => {
                                  setActiveImage(idx);
                                  openLightbox(idx);
                                }}
                                className="absolute inset-0 w-full h-full object-cover transition-all duration-200 group-hover:scale-110"
                                alt={`Thumbnail ${idx + 1}`}
                              />
                              {idx === activeImage && (
                                <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                              )}
                              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {idx + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalImages > maxThumbs && (
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={() => setShowAllThumbs((v) => !v)}
                            className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors"
                          >
                            {showAllThumbs ? "Show less" : `Show more (${totalImages - maxThumbs})`}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </section>

        {/* 3. Key Features */}
        <section className="bg-gray-50 rounded-xl shadow-sm mb-8 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Home className="w-6 h-6 mr-2 text-blue-600" />
              Key Features
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Bedrooms */}
              {allowedField("bedrooms") && hasNum(property.bedrooms) && (
                <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <Bed className="w-6 h-6 mx-auto mb-2 text-gray-900" />
                  <p className="text-gray-600 text-xs uppercase font-medium mb-1">BEDROOMS</p>
                  <p className="text-blue-600 text-xl font-bold">{Number(property.bedrooms)}</p>
                </div>
              )}

              {/* Bathrooms */}
              {allowedField("bathrooms") && hasNum(property.bathrooms) && (
                <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <Bath className="w-6 h-6 mx-auto mb-2 text-gray-900" />
                  <p className="text-gray-600 text-xs uppercase font-medium mb-1">BATHROOMS</p>
                  <p className="text-blue-600 text-xl font-bold">{Number(property.bathrooms)}</p>
                </div>
              )}

              {/* Area */}
              {allowedField("area") && hasNum(property.area) && (
                <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <Square className="w-6 h-6 mx-auto mb-2 text-gray-900" />
                  <p className="text-gray-600 text-xs uppercase font-medium mb-1">AREA</p>
                  <p className="text-blue-600 text-xl font-bold">
                    {Number(property.area).toLocaleString()} m²
                  </p>
                </div>
              )}

              {/* Year Built */}
              {allowedField("year_built") && hasText(property.year_built) && (
                <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-900" />
                  <p className="text-gray-600 text-xs uppercase font-medium mb-1">YEAR BUILT</p>
                  <p className="text-blue-600 text-xl font-bold">{property.year_built}</p>
                </div>
              )}

              {/* Parking Spaces */}
              {allowedField("parking_spaces") && hasNum(property.parking_spaces) && (
                <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <Car className="w-6 h-6 mx-auto mb-2 text-gray-900" />
                  <p className="text-gray-600 text-xs uppercase font-medium mb-1">PARKING SPACES</p>
                  <p className="text-blue-600 text-xl font-bold">
                    {Number(property.parking_spaces)}
                  </p>
                </div>
              )}

              {/* Lot Size */}
              {allowedField("lot_size") && hasNum(property.lot_size) && (
                <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-900" />
                  <p className="text-gray-600 text-xs uppercase font-medium mb-1">LOT SIZE</p>
                  <p className="text-blue-600 text-xl font-bold">
                    {Number(property.lot_size).toLocaleString()} m²
                  </p>
                </div>
              )}

              {/* Floor */}
              {allowedField("floor_level") && hasText(property.floor_level) && (
                <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <ArrowUpCircle className="w-6 h-6 mx-auto mb-2 text-gray-900" />
                  <p className="text-gray-600 text-xs uppercase font-medium mb-1">FLOOR</p>
                  <p className="text-blue-600 text-xl font-bold">
                    {formatFloor(property.floor_level)}
                  </p>
                </div>
              )}

              {/* Total Floors */}
              {allowedField("total_floors") && hasNum(property.total_floors) && (
                <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-gray-900" />
                  <p className="text-gray-600 text-xs uppercase font-medium mb-1">TOTAL FLOORS</p>
                  <p className="text-blue-600 text-xl font-bold">{Number(property.total_floors)}</p>
                </div>
              )}

              {/* Energy */}
              {allowedField("energy_rating") && hasText(property.energy_rating) && (
                <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-gray-900" />
                  <p className="text-gray-600 text-xs uppercase font-medium mb-1">ENERGY</p>
                  <p className="text-blue-600 text-xl font-bold">{property.energy_rating}</p>
                </div>
              )}

              {/* Construction */}
              {allowedField("construction_material") && hasText(property.construction_material) && (
                <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-gray-900" />
                  <p className="text-gray-600 text-xs uppercase font-medium mb-1">CONSTRUCTION</p>
                  <p className="text-blue-600 text-xl font-bold">
                    {property.construction_material}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. Description */}
        <section className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              Property Description
            </h2>
          </div>
          <div className="p-6">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                {property.description || "No description available for this property."}
              </p>
            </div>
          </div>
        </section>

        {/* 4.5. Property Documents - Conditionally rendered */}
        <PropertyDocuments documents={property.documents || []} />

        {/* 5. Amenities */}
        {property.amenities.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                Amenities & Features
              </h2>
            </div>
            <div className="p-6">
              {(() => {
                const categorizedAmenities: { [category: string]: string[] } = {};

                property.amenities.forEach((amenityItem) => {
                  const amenityId = typeof amenityItem === "string" ? amenityItem : amenityItem;
                  let amenity = AMENITIES.find((a) => a.id === amenityId);

                  if (!amenity) {
                    amenity = AMENITIES.find((a) => a.label === amenityId);
                  }

                  if (amenity) {
                    const category = amenity.category;
                    if (!categorizedAmenities[category]) {
                      categorizedAmenities[category] = [];
                    }
                    categorizedAmenities[category].push(amenity.id);
                  } else {
                    if (!categorizedAmenities.Other) {
                      categorizedAmenities.Other = [];
                    }
                    categorizedAmenities.Other.push(amenityId);
                  }
                });

                return Object.entries(categorizedAmenities).map(([category, amenityIds]) => (
                  <div key={category} className="mb-8 last:mb-0">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {amenityIds.map((amenityId, i) => {
                        const amenity = AMENITIES.find((a) => a.id === amenityId);
                        return amenity ? (
                          <div
                            key={i}
                            className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="p-1.5 rounded-md bg-white mr-3">
                              {amenityIcons[amenityId] ?? amenityIcons.default}
                            </div>
                            <span className="text-sm text-gray-600">{amenity.label}</span>
                          </div>
                        ) : (
                          <div
                            key={i}
                            className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="p-1.5 rounded-md bg-white mr-3">
                              {amenityIcons.default}
                            </div>
                            <span className="text-sm text-gray-600">{amenityId}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </section>
        )}

        {/* 6. Map */}
        <section className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-gray-600" />
              Location Map
            </h2>
          </div>
          <div className="p-6">
            {coords ? (
              <MapView lat={coords.lat} lng={coords.lng} />
            ) : (
              <p className="text-gray-600">Location coordinates unavailable.</p>
            )}
          </div>
        </section>

        {/* 7. Address */}
        <section className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-gray-600" />
              Property Address
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-start p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100">
              <MapPin className="h-6 w-6 mr-3 text-orange-600 mt-0.5" />
              <div>
                <p className="text-gray-700">{property.location}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Contact Information */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Contact Information
            </h3>
          </div>
          <div className="p-6">
            {/* Show contact details only for authenticated users */}
            {user ? (
              // Authenticated user - show contact information
              property.contact_phone || property.contact_email ? (
                <div className="space-y-6">
                  {/* Property Owner */}
                  {property.owner && (
                    <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                      <div className="p-2 rounded-lg bg-white shadow-sm mr-3">
                        <svg
                          className="w-6 h-6 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm uppercase font-medium">
                          PROPERTY OWNER
                        </p>
                        <Link
                          to={`/${property.owner.username}/listings`}
                          className="text-purple-600 font-semibold hover:text-purple-700 transition-colors duration-200"
                        >
                          {property.owner.username || property.owner.email || "Property Owner"}
                        </Link>
                      </div>
                    </div>
                  )}

                  {property.contact_phone && (
                    <div className="flex items-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="p-2 rounded-lg bg-white shadow-sm mr-3">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm uppercase font-medium">PHONE</p>
                        <a
                          href={`tel:${encodeURIComponent(property.contact_phone.trim())}`}
                          className="text-blue-600 font-semibold hover:text-blue-700"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            analytics.trackPropertyContact(String(property.id), "phone")
                          }
                        >
                          {property.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {property.contact_email && (
                    <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="p-2 rounded-lg bg-white shadow-sm mr-3">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm uppercase font-medium">Email</p>
                        <a
                          href={`mailto:${encodeURIComponent(property.contact_email.trim())}`}
                          className="text-blue-600 font-semibold hover:text-blue-700"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            analytics.trackPropertyContact(String(property.id), "email")
                          }
                        >
                          {property.contact_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Chat button */}
                  <div className="pt-4 border-t border-gray-100">
                    <ChatButton
                      sellerId={Number(property.owner?.id)}
                      itemId={Number(property.id)}
                      itemType="property"
                      title={property.title}
                      propertyId={Number(property.id)}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Contact Details</h4>
                  <p className="text-gray-600 text-sm">
                    Contact information not provided by the property owner.
                  </p>
                </div>
              )
            ) : (
              // Unauthenticated user - show login prompt
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Contact Details Protected
                  </h4>
                  <p className="text-gray-600 text-sm mb-6">
                    Please log in to view contact information and send messages to property owners.
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Log In to View Contact Info
                  </button>
                </div>

                {/* Alternative contact method note */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Already have an account?{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PropertyDetails;
