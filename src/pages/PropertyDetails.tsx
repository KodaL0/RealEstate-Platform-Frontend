// src/pages/PropertyDetails.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Square, Calendar,
  Share2, CheckCircle, Car, Droplet, Dumbbell, Shield, Wind, Flame,
  Smile, DoorOpen, Archive, Wifi, Package, ArrowUpCircle,
  Flower, Sun, UserCheck, Anchor,
  X, ArrowLeft, ArrowRight, Layers, Ruler, CalendarDays, Calculator,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import { useUser } from '../context/UserContext';
import { Property, PropertyImage } from '../types';
import MapView from '../components/MapView';
import FavouriteButton from '../components/FavouriteButton';
import ChatButton from "../components/ChatButton";
import { geocodeAddress } from '../components/geocode';


const normaliseImages = (imgs: any[] = []): PropertyImage[] =>
  imgs.map(i => (typeof i === 'string' ? { image: i } : i));

const mapPropertyData = (raw: any): Property => ({
  id: raw?.id ?? 0,
  title: raw?.title ?? 'Untitled Property',
  description: raw?.description ?? '',
  price: raw?.price ? +raw.price : 0,
  location: raw?.location ?? '',
  property_type: raw?.property_type ?? '',
  bedrooms: raw?.bedrooms ?? 0,
  bathrooms: raw?.bathrooms ? +raw.bathrooms : 0,
  area: raw?.area ? +raw.area : 0,
  year_built: raw?.year_built ?? '',
  parking_spaces: raw?.parking_spaces ?? 0,
  lot_size: raw?.lot_size ?? '',
  property_status: raw?.property_status ?? 'unavailable',
  energy_rating: raw?.energy_rating ?? '',
  construction_material: raw?.construction_material ?? '',
  floor_level: raw?.floor_level ?? '',
  total_floors: raw?.total_floors ?? '',
  available_from: raw?.available_from ?? '',
  contact_phone: raw?.contact_phone ?? '',
  contact_email: raw?.contact_email ?? '',
  virtual_tour_url: raw?.virtual_tour_url ?? '',
  video_url: raw?.video_url ?? '',
  amenities: raw?.amenities ?? [],
  additional_features: raw?.additional_features ?? [],
  owner: raw?.owner ?? null,
  is_published: raw?.is_published ?? false,
  created_at: raw?.created_at ?? '',
  updated_at: raw?.updated_at ?? '',
  images: normaliseImages(raw?.images),
  is_favourite: raw?.is_favourite ?? false,
  // Add latitude/longitude if API returns them:
  latitude: raw?.latitude != null ? +raw.latitude : undefined,
  longitude: raw?.longitude != null ? +raw.longitude : undefined,
});

const amenityIcons: Record<string, JSX.Element> = {
  parking: <Car className="h-5 w-5 mr-3 text-emerald-600" />,
  pool: <Droplet className="h-5 w-5 mr-3 text-emerald-600" />,
  gym: <Dumbbell className="h-5 w-5 mr-3 text-emerald-600" />,
  security: <Shield className="h-5 w-5 mr-3 text-emerald-600" />,
  ac: <Wind className="h-5 w-5 mr-3 text-emerald-600" />,
  heating: <Flame className="h-5 w-5 mr-3 text-emerald-600" />,
  laundry: <CheckCircle className="h-5 w-5 mr-3 text-emerald-600" />,
  pets: <Smile className="h-5 w-5 mr-3 text-emerald-600" />,
  furnished: <Bed className="h-5 w-5 mr-3 text-emerald-600" />,
  balcony: <DoorOpen className="h-5 w-5 mr-3 text-emerald-600" />,
  storage: <Archive className="h-5 w-5 mr-3 text-emerald-600" />,
  wifi: <Wifi className="h-5 w-5 mr-3 text-emerald-600" />,
  dishwasher: <Package className="h-5 w-5 mr-3 text-emerald-600" />,
  elevator: <ArrowUpCircle className="h-5 w-5 mr-3 text-emerald-600" />,
  fireplace: <Flame className="h-5 w-5 mr-3 text-emerald-600" />,
  garden: <Flower className="h-5 w-5 mr-3 text-emerald-600" />,
  roofDeck: <Sun className="h-5 w-5 mr-3 text-emerald-600" />,
  doorman: <UserCheck className="h-5 w-5 mr-3 text-emerald-600" />,
  garage: <Car className="h-5 w-5 mr-3 text-emerald-600" />,
  waterfront: <Anchor className="h-5 w-5 mr-3 text-emerald-600" />,
  default: <CheckCircle className="h-5 w-5 mr-3 text-emerald-600" />,
};

/* ───────────────── component ───────────────── */

const THUMBS_PER_PAGE = 4;

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const { user, isLoading: userLoading } = useUser();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeImage, setActiveImage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [thumbPage, setThumbPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!numericId || userLoading) return;
    let isMounted = true;
  
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const response = await api.properties.getById(numericId);
        const mapped = mapPropertyData(response.data);
        if (!isMounted) return;
        setProperty(mapped);
  
        // ── COORDINATE LOGIC ───────────────────────────────────────
        if (mapped.latitude != null && mapped.longitude != null) {
          // 1) Use API‑provided coords if available
          setCoords({ lat: mapped.latitude, lng: mapped.longitude });
  
        } else if (mapped.location) {
          // 2) Otherwise forward‑geocode the human address
          try {
            const real = await geocodeAddress(mapped.location, user?.email);
            if (isMounted) setCoords(real);
          } catch (geoErr) {
            console.error('Geocoding failed:', geoErr);
            // coords remains null → shows "Location coordinates unavailable"
          }
        }
        // ───────────────────────────────────────────────────────────
  
        if (mapped.images.length > 0) {
          setActiveImage(0);
          setLightboxIdx(0);
        }
  
      } catch (err) {
        console.error('Failed to fetch property details:', err);
        if (isMounted)
          setError('Failed to fetch property details. Please try again later.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
  
    fetchProperty();
    return () => {
      isMounted = false;
    };
  }, [numericId, userLoading, user?.email]);

  const totalImages = property?.images.length ?? 0;
  const lastThumbPage = Math.max(0, Math.ceil(totalImages / THUMBS_PER_PAGE) - 1);
  const startIdx = thumbPage * THUMBS_PER_PAGE;
  const endIdx = Math.min(startIdx + THUMBS_PER_PAGE, totalImages);
  const visibleThumbs = property?.images.slice(startIdx, endIdx) ?? [];

  const openLightbox = (idx: number) => {
    if (totalImages > 0) {
      setLightboxIdx(idx);
      setLightboxOpen(true);
    }
  };
  const closeLightbox = () => setLightboxOpen(false);
  const prevImg = useCallback(() => {
    setLightboxIdx(i => (i === 0 ? totalImages - 1 : i - 1));
  }, [totalImages]);
  const nextImg = useCallback(() => {
    setLightboxIdx(i => (i === totalImages - 1 ? 0 : i + 1));
  }, [totalImages]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImg();
      if (e.key === 'ArrowRight') nextImg();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, prevImg, nextImg]);

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

  const formatOrdinal = (n: string | number): string => {
    const num = Number(n);
    if (isNaN(num)) return String(n);
    const absNum = Math.abs(num);
    const tens = absNum % 100;
    if (tens >= 11 && tens <= 13) {
      return `${num}th`;
    }
    const unit = absNum % 10;
    switch (unit) {
      case 1: return `${num}st`;
      case 2: return `${num}nd`;
      case 3: return `${num}rd`;
      default: return `${num}th`;
    }
  };

  const toUrl = (img: { image: string }) => img.image;
  const unpublishedBanner = !property.is_published ? (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
      <p className="text-sm text-amber-700">
        This property is not published. Only you can see it.
      </p>
    </div>
  ) : null;

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {lightboxOpen && totalImages > 0 && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white hover:text-red-400"
          >
            <X className="w-8 h-8" />
          </button>
          {totalImages > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
              >
                <ArrowLeft className="w-10 h-10" />
              </button>
              <button
                onClick={nextImg}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
              >
                <ArrowRight className="w-10 h-10" />
              </button>
            </>
          )}
          <img
            src={toUrl(property.images[lightboxIdx])}
            alt={property.title || 'Property image'}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {unpublishedBanner}

        {/* Hero + Thumbnails */}
        <section className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-2/3">
              {totalImages > 0 ? (
                <div
                  className="relative h-96 lg:h-[500px] cursor-zoom-in"
                  onClick={() => openLightbox(activeImage)}
                >
                  <img
                    src={toUrl(property.images[activeImage])}
                    className="w-full h-full object-cover"
                    alt={property.title || 'Property image'}
                  />
                  <div className="absolute top-4 left-4 flex gap-2 z-30">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        property.property_status === 'for_sale'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {property.property_status === 'for_sale' ? 'For Sale' : 'For Rent'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-900/70 text-white text-xs font-semibold">
                      {property.property_type}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 flex flex-col items-center gap-2 z-30">
                    <FavouriteButton
                      propertyId={numericId}
                      defaultLiked={!!property?.is_favourite}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative h-96 lg:h-[500px] bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No images available</span>
                </div>
              )}
            </div>

            <div className="lg:w-1/3 lg:h-[500px] bg-gray-50">
              <div className="relative h-auto lg:h-full">
                {thumbPage > 0 && totalImages > THUMBS_PER_PAGE && (
                  <button
                    onClick={() => setThumbPage(p => p - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-1 hover:bg-gray-50 z-10"
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                  </button>
                )}
                {thumbPage < lastThumbPage && totalImages > THUMBS_PER_PAGE && (
                  <button
                    onClick={() => setThumbPage(p => p + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-1 hover:bg-gray-50 z-10"
                  >
                    <ArrowRight className="w-6 h-6 text-gray-600" />
                  </button>
                )}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={thumbPage}
                    initial={{ x: thumbPage > 0 ? 200 : -200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: thumbPage > 0 ? -200 : 200, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="grid grid-cols-2 grid-rows-2 h-full gap-4 p-4"
                  >
                    {visibleThumbs.map((img, idx) => {
                      const realIdx = startIdx + idx;
                      return (
                        <div
                          key={realIdx}
                          className={`relative w-full pt-[100%] overflow-hidden rounded-xl ${
                            realIdx === activeImage ? 'ring-2 ring-blue-600' : ''
                          }`}
                        >
                          <img
                            src={toUrl(img)}
                            onClick={() => {
                              setActiveImage(realIdx);
                              openLightbox(realIdx);
                            }}
                            className="absolute inset-0 w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                            alt={`Thumbnail ${realIdx + 1}`}
                          />
                        </div>
                      );
                    })}
                    {Array(THUMBS_PER_PAGE - visibleThumbs.length)
                      .fill(0)
                      .map((_, idx) => (
                        <div key={idx} className="aspect-square w-full bg-gray-100 rounded-xl" />
                      ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* Details / Description / Amenities / Map */}
        <section className="mt-8">
          <div className="flex flex-col lg:flex-row lg:gap-8">
            <div className="lg:w-2/3">
              <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-baseline md:gap-8 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{property.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <p className="text-3xl font-bold text-blue-600">
                      €{Number.isFinite(property.price) ? property.price.toLocaleString() : '0'}
                    </p>
                    
                    {property.property_status === 'for_sale' && (
                     <button
                       onClick={() => {
                        if (property.price && property.price > 0) {
                          navigate(`/mortgage-calculator?price=${property.price}&down=20&term=30&rate=5.5`);
                        }
                      }}
                      disabled={!property.price || property.price <= 0}
                      className={`mt-3 sm:mt-0 inline-flex items-center px-4 py-2 ${
                        property.price && property.price > 0
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-gray-300 cursor-not-allowed'
                      } text-white text-sm font-medium rounded-lg shadow-sm transition`}
                    >
                      <Calculator className="w-5 h-5 mr-2" />
                      Calculate Mortgage
                     </button>
                   )}
                 </div>
               </div>

                <div className="flex flex-wrap gap-6 py-4 border-y border-gray-100">
                  <div className="flex items-center text-gray-700">
                    <Bed className="h-5 w-5 mr-2 text-gray-500" />
                    <span>
                      {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Bath className="h-5 w-5 mr-2 text-gray-500" />
                    <span>
                      {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Square className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{property.area.toLocaleString()} m²</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                    <span>
                      {property.year_built
                        ? `Built in ${property.year_built}`
                        : 'Year built n/a'}
                    </span>
                  </div>
                  {property.lot_size && (
                    <div className="flex items-center text-gray-700">
                      <Ruler className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{parseInt(property.lot_size, 10)} m² lot</span>
                    </div>
                  )}
                  {property.floor_level && (
                    <div className="flex items-center text-gray-700">
                      <Layers className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{formatOrdinal(property.floor_level)} Floor</span>
                    </div>
                  )}
                  {property.available_from && (
                    <div className="flex items-center text-gray-700">
                      <CalendarDays className="h-5 w-5 mr-2 text-gray-500" />
                      <span>Available {property.available_from}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-bold mb-4">Description</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              </div>

              {property.amenities.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                  <h2 className="text-xl font-bold mb-4">Amenities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.amenities.map((a, i) => (
                      <div key={i} className="flex items-center">
                        {amenityIcons[a] ?? amenityIcons.default}
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold mb-4">Location</h2>
                {coords ? (
                  <MapView lat={coords.lat} lng={coords.lng} />
                ) : (
                  <p className="text-gray-600">Location coordinates unavailable.</p>
                )}
                <div className="flex items-start mt-4">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  <p className="text-gray-700">{property.location}</p>
                </div>
              </div>
            </div>

            <div className="lg:w-1/3 mt-8 lg:mt-0">
              <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24">
                <h3 className="text-xl font-bold mb-6">Contact Information</h3>
                
                {/* Show contact details only for authenticated users */}
                {user ? (
                  // Authenticated user - show contact information
                  (property.contact_phone || property.contact_email) ? (
                    <div className="space-y-4">
                      {property.contact_phone && (
                        <div>
                          <p className="text-gray-500 text-sm uppercase">Phone</p>
                          <p className="text-gray-900">
                            <a href={`tel:${property.contact_phone}`} className="text-emerald-600">
                              {property.contact_phone}
                            </a>
                          </p>
                        </div>
                      )}
                      {property.contact_email && (
                        <div>
                          <p className="text-gray-500 text-sm uppercase">Email</p>
                          <p className="text-gray-900">
                            <a href={`mailto:${property.contact_email}`} className="text-emerald-600">
                              {property.contact_email}
                            </a>
                          </p>
                        </div>
                      )}

                      {/* Chat button */}
                      <ChatButton
                        sellerId={property.owner.id}
                        propertyId={property.id}
                        title={property.title}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-600">Contact details not provided.</p>
                  )
                ) : (
                  // Unauthenticated user - show login prompt
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-3">
                        <div className="bg-blue-100 rounded-full p-2">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Contact Details Protected
                      </h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Please log in to view contact information and send messages to property owners.
                      </p>
                      <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Log In to View Contact Info
                      </button>
                    </div>
                    
                    {/* Alternative contact method note */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Already have an account? <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-700 underline">Sign in here</button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PropertyDetails;
