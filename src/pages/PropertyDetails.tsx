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
import { geocodePropertyLocation } from "../components/geocode";
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

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
    } else {
      (mql as { addListener: (callback: (e: MediaQueryListEvent) => void) => void }).addListener(
        onChange,
      );
    }
    setMatches(mql.matches);
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange);
      } else {
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
  return isLg ? 10 : isMd ? 8 : 5;
};

const mapPropertyData = (raw: any): Property => ({
  id: raw?.id ?? 0,
  title: raw?.title ?? "Untitled Property",
  description: raw?.description ?? "",
  price: raw?.price ? Math.round(+raw.price) : 0,
  location: raw?.location ?? "",
  country: raw?.country ?? "",
  property_type: raw?.property_type ?? "",
  bedrooms: raw?.bedrooms ?? 0,
  bathrooms: raw?.bathrooms ? Math.round(+raw.bathrooms) : 0,
  area: raw?.area ? Math.round(+raw.area) : 0,
  year_built: raw?.year_built ?? "",
  parking_spaces: raw?.parking_spaces ? Math.round(+raw.parking_spaces) : 0,
  lot_size: raw?.lot_size ? Math.round(+raw.lot_size) : 0,
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

  has_units: raw?.has_units ?? false,   // ← 🔥 THIS WAS MISSING

  units: raw?.units ?? [],              // ← Optional: handle backend-provided units

  owner: raw?.owner ?? null,
  is_published: raw?.is_published ?? false,
  created_at: raw?.created_at ?? "",
  updated_at: raw?.updated_at ?? "",
  images: normaliseImages(raw?.images),
  documents: raw?.documents ?? [],
  is_favourite: raw?.is_favourite ?? false,
  latitude: raw?.latitude != null ? +raw.latitude : undefined,
  longitude: raw?.longitude != null ? +raw.longitude : undefined,
  city: raw?.city ?? undefined,
  region: raw?.region ?? undefined,
  postal_code: raw?.postal_code ?? undefined,
  street: raw?.street ?? undefined,
  url: raw?.url ?? undefined,
});


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
  land: ["lot_size", "construction_material"],
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

const hasNum = (v: any) =>
  v !== undefined && v !== null && String(v).trim() !== "" && Number(v) > 0;
const hasText = (v: any) => v !== undefined && v !== null && String(v).trim() !== "";

const amenityIcons: Record<string, JSX.Element> = {
  elevator: <ArrowUpCircle className="h-5 w-5 text-blue-600" />,
  internal_staircase: <ArrowUpCircle className="h-5 w-5 text-blue-600" />,
  secure_door: <Shield className="h-5 w-5 text-blue-600" />,
  manned_reception: <UserCheck className="h-5 w-5 text-blue-600" />,
  attic: <Home className="h-5 w-5 text-blue-600" />,
  facade: <Building2 className="h-5 w-5 text-blue-600" />,
  corner: <MapPin className="h-5 w-5 text-blue-600" />,
  frames_wooden: <TreePine className="h-5 w-5 text-blue-600" />,
  floor_marble: <Square className="h-5 w-5 text-blue-600" />,
  single_glass: <Glasses className="h-5 w-5 text-blue-600" />,
  bright: <Sun className="h-5 w-5 text-blue-600" />,
  airy: <Wind className="h-5 w-5 text-blue-600" />,
  fireplace: <Flame className="h-5 w-5 text-blue-600" />,
  furnished: <Bed className="h-5 w-5 text-blue-600" />,
  storage: <Archive className="h-5 w-5 text-blue-600" />,
  painted: <Palette className="h-5 w-5 text-blue-600" />,
  luxury_home: <Crown className="h-5 w-5 text-blue-600" />,
  playroom: <Baby className="h-5 w-5 text-blue-600" />,
  underfloor_heating: <Thermometer className="h-5 w-5 text-blue-600" />,
  air_conditioning: <Wind className="h-5 w-5 text-blue-600" />,
  solar_water_heating: <Sun className="h-5 w-5 text-blue-600" />,
  night_power: <Zap className="h-5 w-5 text-blue-600" />,
  garden: <Flower className="h-5 w-5 text-blue-600" />,
  swimming_pool: <Droplet className="h-5 w-5 text-blue-600" />,
  awning: <Umbrella className="h-5 w-5 text-blue-600" />,
  built_in_bbq: <Utensils className="h-5 w-5 text-blue-600" />,
  window_screens: <Glasses className="h-5 w-5 text-blue-600" />,
  balcony: <DoorOpen className="h-5 w-5 text-blue-600" />,
  parking_space: <Car className="h-5 w-5 text-blue-600" />,
  garage: <Car className="h-5 w-5 text-blue-600" />,
  access_disabled: <Accessibility className="h-5 w-5 text-blue-600" />,
  ev_charging: <Zap className="h-5 w-5 text-blue-600" />,
  alarm: <Bell className="h-5 w-5 text-blue-600" />,
  security_system: <Shield className="h-5 w-5 text-blue-600" />,
  doorman: <UserCheck className="h-5 w-5 text-blue-600" />,
  satellite_receiver: <Satellite className="h-5 w-5 text-blue-600" />,
  wifi: <Wifi className="h-5 w-5 text-blue-600" />,
  dishwasher: <Package className="h-5 w-5 text-blue-600" />,
  laundry: <CheckCircle className="h-5 w-5 text-blue-600" />,
  residential_zone: <MapPin className="h-5 w-5 text-blue-600" />,
  view: <Eye className="h-5 w-5 text-blue-600" />,
  waterfront: <Anchor className="h-5 w-5 text-blue-600" />,
  gym: <Dumbbell className="h-5 w-5 text-blue-600" />,
  pool: <Droplet className="h-5 w-5 text-blue-600" />,
  roof_deck: <Sun className="h-5 w-5 text-blue-600" />,
  pets: <Smile className="h-5 w-5 text-blue-600" />,
  parking: <Car className="h-5 w-5 text-blue-600" />,
  ac: <Wind className="h-5 w-5 text-blue-600" />,
  heating: <Flame className="h-5 w-5 text-blue-600" />,
  default: <CheckCircle className="h-5 w-5 text-blue-600" />,
};

const PropertyDetails: React.FC = () => {
  const { id, username, country, locationSlug } = useParams<{
    id?: string;
    username?: string;
    country?: string;
    locationSlug?: string;
  }>();

  const navigate = useNavigate();
  const propertyId = id || (locationSlug ? locationSlug.split("-").pop() : null);
  const numericId = propertyId ? Number(propertyId) : 0;

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
  const [showAllThumbs, setShowAllThumbs] = useState(false);

  const toUrl = (img: { image: string }) => img.image;

  const getImageOrientation = (imageUrl: string): Promise<"portrait" | "landscape" | "square"> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        if (ratio > 1.2) resolve("landscape");
        else if (ratio < 0.8) resolve("portrait");
        else resolve("square");
      };
      img.onerror = () => resolve("landscape");
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
        // ⭐ Fetch Units for This Property (only if it has multiple units) ⭐
        if (mapped.has_units) {
          try {
            const unitsRes = await api.propertyUnits.list(numericId);
            mapped.units = Array.isArray(unitsRes.data) ? unitsRes.data : [];
          } catch (err) {
            console.error("Failed to fetch units:", err);
          }
        }

        if (!isMounted) return;
        setProperty(mapped);

        if (id && !locationSlug && mapped.url) {
          console.log(`Redirecting from legacy URL /property/${id} to canonical URL ${mapped.url}`);
          navigate(mapped.url, { replace: true });
          return;
        }

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

        if (mapped.latitude != null && mapped.longitude != null) {
          setCoords({ lat: mapped.latitude, lng: mapped.longitude });
        } else {
          // Try geocoding with fallback strategies
          try {
            const coords = await geocodePropertyLocation(
              mapped.location,
              {
                street: mapped.street,
                city: mapped.city,
                region: mapped.region,
                postal_code: mapped.postal_code,
                country: mapped.country,
              },
              user?.email
            );
            if (isMounted && coords) {
              setCoords(coords);
            }
          } catch (geoErr) {
            console.error("Geocoding failed:", geoErr);
          }
        }

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

  useEffect(() => {
    if (lightboxOpen && property?.images[lightboxIdx]) {
      getImageOrientation(toUrl(property.images[lightboxIdx])).then(setImageOrientation);
    }
  }, [lightboxOpen, lightboxIdx, property?.images, getImageOrientation, toUrl]);

  if (loading || userLoading) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-b from-slate-50 to-white flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-slate-600 font-medium">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-b from-slate-50 to-white flex justify-center items-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-900">Property not found</h2>
            <p className="text-slate-600 mb-6">This property may have been removed or doesn't exist.</p>
            <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pTypeKey = String(property.property_type || "").toLowerCase();
  const allowed = new Set(PTYPE_FIELDS[pTypeKey] || []);
  const allowedField = (k: string) => allowed.has(k as any);

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
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Eye className="h-5 w-5 text-amber-600" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-amber-800">This property is not published. Only you can see it.</p>
        </div>
      </div>
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

  const propertyUrl = property.url || `/property/${property.id}`;
  const primaryImage = property.images?.[0];
  const imageUrl = primaryImage
    ? typeof primaryImage === "string"
      ? primaryImage
      : primaryImage.image
    : undefined;

  const seoDescription = `${property.property_type} for ${property.property_status.replace("_", " ")} in ${property.city || property.location}. ${property.bedrooms} bed, ${property.bathrooms} bath, ${property.area}m². Price: €${property.price.toLocaleString()}. ${property.description.substring(0, 100)}...`;

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
    <div className="pt-14 bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen">
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

      <LLMPropertyData property={property} />

      {lightboxOpen && totalImages > 0 && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex flex-col justify-center items-center"
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

              if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) nextImg();
                else prevImg();
              }

              document.removeEventListener("touchend", handleTouchEnd);
            };

            document.addEventListener("touchend", handleTouchEnd);
          }}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 border border-white/20"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-4 pb-20 sm:pb-24 md:pb-28">
            <img
              src={toUrl(property.images[lightboxIdx])}
              alt={property.title || "Property image"}
              className={getImageClassName()}
            />
          </div>

          {totalImages > 1 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl rounded-full px-6 py-3 shadow-2xl border border-white/20">
                <button
                  onClick={prevImg}
                  className="text-white hover:text-blue-400 transition-all duration-200 p-2 hover:scale-110 active:scale-95 rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <span className="text-white text-base font-semibold px-4 min-w-[80px] text-center">
                  {lightboxIdx + 1} / {totalImages}
                </span>
                <button
                  onClick={nextImg}
                  className="text-white hover:text-blue-400 transition-all duration-200 p-2 hover:scale-110 active:scale-95 rounded-full hover:bg-white/10"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {unpublishedBanner}

        <section className="mb-8">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-200 backdrop-blur-sm bg-white/80">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-600">
              <h1 className="text-3xl font-bold text-white leading-tight text-center drop-shadow-sm">
                {property.title}
              </h1>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-lg mb-8 overflow-hidden border border-slate-200">
          <div className="px-6 py-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                    property.property_status === "for_sale"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  }`}
                >
                  {property.property_status === "for_sale" ? "For Sale" : "For Rent"}
                </span>
                <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
                  {property.property_type}
                </span>
              </div>
              <div className="scale-110">
                <FavouriteButton
                  itemId={numericId}
                  itemType="property"
                  defaultLiked={!!property?.is_favourite}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm font-medium text-slate-600 mb-1">Price</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
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
                    className={`inline-flex items-center px-6 py-3 ${
                      property.price && property.price > 0
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl"
                        : "bg-slate-300 cursor-not-allowed"
                    } text-white text-sm font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-0.5`}
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Calculate Mortgage
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 mb-12">
          <div className="flex flex-col">
            <div className="w-full">
              {totalImages > 0 ? (
                <div
                  className="relative h-96 lg:h-[500px] cursor-zoom-in group overflow-hidden"
                  onClick={() => openLightbox(activeImage)}
                >
                  <img
                    src={toUrl(property.images[activeImage])}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={property.title || "Property image"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/20">
                    Click to zoom
                  </div>
                </div>
              ) : (
                <div className="relative h-96 lg:h-[500px] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Home className="w-10 h-10 text-slate-400" />
                    </div>
                    <span className="text-slate-500 font-semibold text-lg">No images available</span>
                  </div>
                </div>
              )}
            </div>

            {totalImages > 0 && (
              <div className="bg-gradient-to-b from-slate-50 to-white p-8 border-t border-slate-200">
                {(() => {
                  const maxThumbs = thumbsPerRow;

                  const indices = showAllThumbs
                    ? property.images.map((_, i) => i)
                    : Array.from({ length: Math.min(maxThumbs, totalImages) }, (_, i) => i);

                  return (
                    <>
                      <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4">
                        {indices.map((idx) => {
                          const img = property.images[idx];
                          return (
                            <div
                              key={idx}
                              className={`relative w-full pt-[100%] overflow-hidden rounded-2xl border-2 transition-all duration-300 group cursor-pointer ${
                                idx === activeImage
                                  ? "border-blue-500 shadow-xl scale-105 ring-4 ring-blue-100"
                                  : "border-slate-200 hover:border-blue-300 hover:shadow-lg hover:scale-105"
                              }`}
                            >
                              <img
                                src={toUrl(img)}
                                onClick={() => {
                                  setActiveImage(idx);
                                  openLightbox(idx);
                                }}
                                className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                                alt={`Thumbnail ${idx + 1}`}
                              />
                              {idx === activeImage && (
                                <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                              )}
                              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-semibold">
                                {idx + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalImages > maxThumbs && (
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={() => setShowAllThumbs((v) => !v)}
                            className="inline-flex items-center px-6 py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-300 text-slate-700 text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                          >
                            {showAllThumbs ? "Show less" : `Show all ${totalImages} photos`}
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

        <section className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-xl mb-10 overflow-hidden border border-slate-200">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              Key Features
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {allowedField("bedrooms") && hasNum(property.bedrooms) && (
                <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Bed className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">BEDROOMS</p>
                  <p className="text-blue-600 text-3xl font-bold">{Number(property.bedrooms)}</p>
                </div>
              )}

              {allowedField("bathrooms") && hasNum(property.bathrooms) && (
                <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Bath className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">BATHROOMS</p>
                  <p className="text-blue-600 text-3xl font-bold">{Number(property.bathrooms)}</p>
                </div>
              )}

              {allowedField("area") && hasNum(property.area) && (
                <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Square className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">AREA</p>
                  <p className="text-blue-600 text-3xl font-bold">
                    {Number(property.area).toLocaleString()}<span className="text-lg ml-1">m²</span>
                  </p>
                </div>
              )}

              {allowedField("year_built") && hasText(property.year_built) && (
                <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">YEAR BUILT</p>
                  <p className="text-blue-600 text-3xl font-bold">{property.year_built}</p>
                </div>
              )}

              {allowedField("parking_spaces") && hasNum(property.parking_spaces) && (
                <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">PARKING</p>
                  <p className="text-blue-600 text-3xl font-bold">
                    {Number(property.parking_spaces)}
                  </p>
                </div>
              )}

              {allowedField("lot_size") && hasNum(property.lot_size) && (
                <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">LOT SIZE</p>
                  <p className="text-blue-600 text-3xl font-bold">
                    {Number(property.lot_size).toLocaleString()}<span className="text-lg ml-1">m²</span>
                  </p>
                </div>
              )}

              {allowedField("floor_level") && hasText(property.floor_level) && (
                <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <ArrowUpCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">FLOOR</p>
                  <p className="text-blue-600 text-3xl font-bold">
                    {formatFloor(property.floor_level)}
                  </p>
                </div>
              )}

              {allowedField("total_floors") && hasNum(property.total_floors) && (
                <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">TOTAL FLOORS</p>
                  <p className="text-blue-600 text-3xl font-bold">{Number(property.total_floors)}</p>
                </div>
              )}

              {allowedField("energy_rating") && hasText(property.energy_rating) && (
                <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">ENERGY</p>
                  <p className="text-blue-600 text-3xl font-bold">{property.energy_rating}</p>
                </div>
              )}

              {allowedField("construction_material") && hasText(property.construction_material) && (
                <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">CONSTRUCTION</p>
                  <p className="text-blue-600 text-xl font-bold">
                    {property.construction_material}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

      {property.units && property.units.length > 0 && (
        <section className="bg-white rounded-3xl shadow-xl mb-10 overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              Available Units
            </h2>
          </div>

          <div className="p-8 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-left">
                  <th className="px-4 py-3 text-sm font-semibold">Unit</th>
                  <th className="px-4 py-3 text-sm font-semibold">Beds</th>
                  <th className="px-4 py-3 text-sm font-semibold">Baths</th>
                  <th className="px-4 py-3 text-sm font-semibold">Area (m²)</th>
                  <th className="px-4 py-3 text-sm font-semibold">Floor</th>
                  <th className="px-4 py-3 text-sm font-semibold">Lot Size</th>
                  <th className="px-4 py-3 text-sm font-semibold">Parking</th>
                  <th className="px-4 py-3 text-sm font-semibold">Price (€)</th>
                  <th className="px-4 py-3 text-sm font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {property.units.map((u, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {u.unit_number}
                    </td>
                    <td className="px-4 py-3">{u.bedrooms ?? "—"}</td>
                    <td className="px-4 py-3">{u.bathrooms ?? "—"}</td>
                    <td className="px-4 py-3">{u.area ?? "—"}</td>
                    <td className="px-4 py-3">{u.floor_level ?? "—"}</td>
                    <td className="px-4 py-3">{u.lot_size ?? "—"}</td>
                    <td className="px-4 py-3">{u.parking_spaces ?? "—"}</td>
                    <td className="px-4 py-3 font-bold text-blue-600">
                      {u.price ? Math.round(u.price).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          u.status === "available"
                            ? "bg-emerald-100 text-emerald-700"
                            : u.status === "reserved"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}


        <section className="bg-white rounded-3xl shadow-xl mb-10 overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              Property Description
            </h2>
          </div>
          <div className="p-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-base">
                {property.description || "No description available for this property."}
              </p>
            </div>
          </div>
        </section>

        <PropertyDocuments documents={property.documents || []} />

        {property.amenities.length > 0 && (
          <section className="bg-white rounded-3xl shadow-xl mb-10 overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                Amenities & Features
              </h2>
            </div>
            <div className="p-8">
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
                  <div key={category} className="mb-10 last:mb-0">
                    <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-3"></div>
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {amenityIds.map((amenityId, i) => {
                        const amenity = AMENITIES.find((a) => a.id === amenityId);
                        return amenity ? (
                          <div
                            key={i}
                            className="flex items-center p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                          >
                            <div className="p-2 rounded-xl bg-white shadow-sm mr-4 border border-slate-100">
                              {amenityIcons[amenityId] ?? amenityIcons.default}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{amenity.label}</span>
                          </div>
                        ) : (
                          <div
                            key={i}
                            className="flex items-center p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                          >
                            <div className="p-2 rounded-xl bg-white shadow-sm mr-4 border border-slate-100">
                              {amenityIcons.default}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{amenityId}</span>
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

        <section className="bg-white rounded-3xl shadow-xl mb-10 overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              Location Map
            </h2>
          </div>
          <div className="p-8">
            {coords ? (
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <MapView lat={coords.lat} lng={coords.lng} />
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-300">
                <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Location coordinates unavailable.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl mb-10 overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              Property Address
            </h2>
          </div>
          <div className="p-8">
            <div className="flex items-start p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-md">
              <div className="p-2 rounded-xl bg-white shadow-sm mr-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-700 font-semibold text-lg">{property.location}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              Contact Information
            </h3>
          </div>
          <div className="p-8">
            {user ? (
              property.contact_phone || property.contact_email ? (
                <div className="space-y-5">
                  {property.owner && (
                    <div className="flex items-center p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="p-3 rounded-xl bg-white shadow-md mr-4">
                        <svg
                          className="w-7 h-7 text-blue-600"
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
                        <p className="text-slate-600 text-xs uppercase font-bold mb-1 tracking-wide">
                          PROPERTY OWNER
                        </p>
                        <Link
                          to={`/${property.owner.username}/listings`}
                          className="text-blue-600 font-bold text-lg hover:text-cyan-600 transition-colors duration-200"
                        >
                          {property.owner.username || property.owner.email || "Property Owner"}
                        </Link>
                      </div>
                    </div>
                  )}

                  {property.contact_phone && (
                    <div className="flex items-center p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="p-3 rounded-xl bg-white shadow-md mr-4">
                        <svg
                          className="w-7 h-7 text-emerald-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs uppercase font-bold mb-1 tracking-wide">PHONE</p>
                        <a
                          href={`tel:${encodeURIComponent(property.contact_phone.trim())}`}
                          className="text-emerald-600 font-bold text-lg hover:text-teal-600 transition-colors duration-200"
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
                    <div className="flex items-center p-5 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="p-3 rounded-xl bg-white shadow-md mr-4">
                        <svg
                          className="w-7 h-7 text-violet-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs uppercase font-bold mb-1 tracking-wide">EMAIL</p>
                        <a
                          href={`mailto:${encodeURIComponent(property.contact_email.trim())}`}
                          className="text-violet-600 font-bold text-lg hover:text-purple-600 transition-colors duration-200 break-all"
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

                  <div className="pt-6 border-t-2 border-slate-200">
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
                <div className="text-center py-12">
                  <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 shadow-md">
                    <svg className="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">No Contact Details</h4>
                  <p className="text-slate-600">
                    Contact information not provided by the property owner.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-300 rounded-2xl p-8 text-center shadow-xl">
                  <div className="flex items-center justify-center mb-5">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-4 shadow-lg">
                      <svg
                        className="w-8 h-8 text-white"
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
                  <h4 className="text-2xl font-bold text-slate-900 mb-3">
                    Contact Details Protected
                  </h4>
                  <p className="text-slate-700 mb-8 max-w-md mx-auto leading-relaxed">
                    Please log in to view contact information and send messages to property owners.
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Log In to View Contact Info
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    Already have an account?{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="text-blue-600 hover:text-cyan-600 font-bold underline transition-colors duration-200"
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
