/* eslint-disable react/no-array-index-key */

// Global Leaflet marker icon fix
import "../components/leafletMarkerFix";

import {
  useState, useEffect, useCallback,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapPin, Bed, Bath, Square, Calendar,
  Heart, Share2, CheckCircle, Car, Droplet, Dumbbell, Shield, Wind, Flame,
  Smile, DoorOpen, Archive, Wifi, Package, ArrowUpCircle,
  Flower, Sun, UserCheck, Anchor,
  X, ArrowLeft, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { apiClient } from "../middleware/auth";
import { useUser }   from "../context/UserContext";
import { Property }  from "../types";
import MapView       from "../components/MapView";

/* ───────────────── helpers ───────────────── */

async function geocodeAddress(address: string) {
  const q   = encodeURIComponent(address);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json`);
  const js  = await res.json();
  if (js?.length) return { lat: +js[0].lat, lng: +js[0].lon };
  throw new Error("geocoding failed");
}

const normaliseImages = (imgs: any[] = []) =>
  imgs.map(i => (typeof i === "string" ? { image: i } : i));

const mapPropertyData = (raw: any): Property => ({
  id: raw?.id ?? 0,
  title: raw?.title ?? "Untitled Property",
  description: raw?.description ?? "",
  price: raw?.price ? +raw.price : 0,
  location: raw?.location ?? "",
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
  additional_features: raw?.additional_features ?? [],
  owner: raw?.owner ?? null,
  is_published: raw?.is_published ?? false,
  created_at: raw?.created_at ?? "",
  updated_at: raw?.updated_at ?? "",
  images: normaliseImages(raw?.images),
});

/* amenity → icon */
const amenityIcons: Record<string, JSX.Element> = {
  parking:    <Car          className="h-5 w-5 mr-3 text-emerald-600" />,
  pool:       <Droplet      className="h-5 w-5 mr-3 text-emerald-600" />,
  gym:        <Dumbbell     className="h-5 w-5 mr-3 text-emerald-600" />,
  security:   <Shield       className="h-5 w-5 mr-3 text-emerald-600" />,
  ac:         <Wind         className="h-5 w-5 mr-3 text-emerald-600" />,
  heating:    <Flame        className="h-5 w-5 mr-3 text-emerald-600" />,
  laundry:    <CheckCircle  className="h-5 w-5 mr-3 text-emerald-600" />,
  pets:       <Smile        className="h-5 w-5 mr-3 text-emerald-600" />,
  furnished:  <Bed          className="h-5 w-5 mr-3 text-emerald-600" />,
  balcony:    <DoorOpen     className="h-5 w-5 mr-3 text-emerald-600" />,
  storage:    <Archive      className="h-5 w-5 mr-3 text-emerald-600" />,
  wifi:       <Wifi         className="h-5 w-5 mr-3 text-emerald-600" />,
  dishwasher: <Package      className="h-5 w-5 mr-3 text-emerald-600" />,
  elevator:   <ArrowUpCircle className="h-5 w-5 mr-3 text-emerald-600" />,
  fireplace:  <Flame        className="h-5 w-5 mr-3 text-emerald-600" />,
  garden:     <Flower       className="h-5 w-5 mr-3 text-emerald-600" />,
  roofDeck:   <Sun          className="h-5 w-5 mr-3 text-emerald-600" />,
  doorman:    <UserCheck    className="h-5 w-5 mr-3 text-emerald-600" />,
  garage:     <Car          className="h-5 w-5 mr-3 text-emerald-600" />,
  waterfront: <Anchor       className="h-5 w-5 mr-3 text-emerald-600" />,
  default:    <CheckCircle  className="h-5 w-5 mr-3 text-emerald-600" />,
};

/* ───────────────── component ───────────────── */

const THUMBS_PER_PAGE = 4;          // thumbnails beside hero image

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: userLoading } = useUser();

  /* core state */
  const [property,    setProperty]    = useState<Property | null>(null);
  const [coords,      setCoords]      = useState<{ lat: number; lng: number } | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading,     setLoading]     = useState(true);

  /* light-box */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx,  setLightboxIdx]  = useState(0);

  /* thumbnail carousel page */
  const [thumbPage, setThumbPage] = useState(0);

  /* ─── fetch property (same logic you already had) ─── */
  useEffect(() => {
    if (!id || userLoading) return;

    const API = "https://propertprodjango.onrender.com/api";

    const scanEndpoint = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      const txt = await res.text();
      if (txt.includes("<html")) return null;
      const js = JSON.parse(txt);
      const list = Array.isArray(js) ? js : js.results ?? [];
      return list.find((p: any) => p.id.toString() === id) ?? null;
    };

    (async () => {
      setLoading(true);
      try {
        let raw =
          (await scanEndpoint(`${API}/properties/buy`)) ??
          (await scanEndpoint(`${API}/properties/rent`));

        if (!raw && user) {
          const mine = await apiClient.get("/properties/my-properties");
          const arr  = Array.isArray(mine.data) ? mine.data : mine.data.results ?? [];
          raw = arr.find((p: any) => p.id.toString() === id) ?? null;
        }

        if (raw) {
          const mapped = mapPropertyData(raw);
          setProperty(mapped);

          if (!raw.latitude && mapped.location) {
            try { setCoords(await geocodeAddress(mapped.location)); }
            catch (e) { console.error("geocode fail", e); }
          }
        } else {
          setProperty(null);
        }
      } catch (e) {
        console.error(e);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, userLoading]);

  /* derived thumbnail info */
  const totalImages    = property?.images.length ?? 0;
  const lastThumbPage  = Math.max(0, Math.ceil(totalImages / THUMBS_PER_PAGE) - 1);
  const startIdx       = thumbPage * THUMBS_PER_PAGE;
  const endIdx         = Math.min(startIdx + THUMBS_PER_PAGE, totalImages);
  const visibleThumbs  = property?.images.slice(startIdx, endIdx) ?? [];

  /* light-box helpers */
  const openLightbox  = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const prevImg = useCallback(
    () => setLightboxIdx(i => (i === 0 ? totalImages - 1 : i - 1)),
    [totalImages]
  );
  const nextImg = useCallback(
    () => setLightboxIdx(i => (i === totalImages - 1 ? 0 : i + 1)),
    [totalImages]
  );

  /* key navigation inside light-box */
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prevImg();
      if (e.key === "ArrowRight") nextImg();
      if (e.key === "Escape")     closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, prevImg, nextImg]);

  /* early states */
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

  const toUrl = (img: { image: string }) => img.image;

  /* unpublished notice */
  const unpublishedBanner = !property.is_published && (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
      <p className="text-sm text-amber-700">
        This property is not published. Only you can see it.
      </p>
    </div>
  );

  /* ───────────────── render ───────────────── */
  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* light-box overlay */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
          <button onClick={closeLightbox} className="absolute top-6 right-6 text-white hover:text-red-400">
            <X className="w-8 h-8" />
          </button>
          {totalImages > 1 && (
            <>
              <button onClick={prevImg} className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300">
                <ArrowLeft className="w-10 h-10" />
              </button>
              <button onClick={nextImg} className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300">
                <ArrowRight className="w-10 h-10" />
              </button>
            </>
          )}
          <img
            src={toUrl(property.images[lightboxIdx])}
            alt=""
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {unpublishedBanner}

        {/* ───── Hero + Thumbnails ───── */}
        <section className="bg-white">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* hero image */}
            <div className="lg:w-2/3">
              <div
                className="relative h-96 lg:h-[500px] rounded-xl overflow-hidden cursor-zoom-in"
                onClick={() => openLightbox(activeImage)}
              >
                <img
                  src={toUrl(property.images[activeImage])}
                  className="w-full h-full object-cover"
                  alt=""
                />
                {/* status badges */}
                <div className="absolute top-4 left-4 flex gap-2 z-30">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      property.property_status === "for_sale"
                        ? "bg-emerald-500 text-white"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {property.property_status === "for_sale" ? "For Sale" : "For Rent"}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gray-900/70 text-white text-xs font-semibold">
                    {property.property_type}
                  </span>
                </div>
                {/* fav / share */}
                <div className="absolute top-4 right-4 flex gap-2 z-30">
                  <button className="p-2 bg-white/80 hover:bg-white rounded-full shadow-md">
                    <Heart className="h-5 w-5 text-gray-600 hover:text-red-500" />
                  </button>
                  <button className="p-2 bg-white/80 hover:bg-white rounded-full shadow-md">
                    <Share2 className="h-5 w-5 text-gray-600 hover:text-blue-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* thumbnail carousel */}
            <div className="lg:w-1/3 flex flex-col">
              {/*
                MATCH HERO HEIGHT (500px) AND STOP CONTENT FROM BLEEDING OUT
              */}
              <div className="relative flex-1 lg:h-[500px] overflow-hidden">
                {/* nav arrows */}
                {thumbPage > 0 && (
                  <button
                    onClick={() => setThumbPage(p => p - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-1 hover:bg-gray-50 z-10"
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                  </button>
                )}
                {thumbPage < lastThumbPage && (
                  <button
                    onClick={() => setThumbPage(p => p + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-1 hover:bg-gray-50 z-10"
                  >
                    <ArrowRight className="w-6 h-6 text-gray-600" />
                  </button>
                )}

                {/* animated grid of thumbs */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={thumbPage}
                    initial={{ x: thumbPage > 0 ? 200 : -200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: thumbPage > 0 ? -200 : 200, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    /*
                      grid-rows-2 + h-full makes two equal rows that stretch
                      to consume the full 500px height so the bottom thumbnails
                      sit flush with the container bottom.
                    */
                    className="grid grid-cols-2 grid-rows-2 h-full gap-4 pt-8"
                  >
                    {visibleThumbs.map((img, idx) => {
                      const realIdx = startIdx + idx;
                      return (
                        <img
                          key={realIdx}
                          src={toUrl(img)}
                          onClick={() => {
                            setActiveImage(realIdx);
                            openLightbox(realIdx);
                          }}
                          className={`h-full w-full object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform ${
                            realIdx === activeImage ? "ring-2 ring-blue-600" : ""}`}
                          alt=""
                        />
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ───── DETAILS / DESCRIPTION / AMENITIES / MAP ───── */}
        <section className="mt-8">
          <div className="flex flex-col lg:flex-row lg:gap-8">
            {/* main content */}
            <div className="lg:w-2/3">
              {/* info card */}
              <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                {/* title & price */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {property.title}
                    </h1>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{property.location}</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mt-4 md:mt-0">
                    €{Number.isFinite(property.price) ? property.price.toLocaleString() : "0"}
                  </p>
                </div>

                {/* basic stats */}
                <div className="flex flex-wrap gap-6 py-4 border-y border-gray-100">
                  <div className="flex items-center text-gray-700">
                    <Bed className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Bath className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Square className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{Number.isFinite(property.area) ? property.area.toLocaleString() : "0"} sqm</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{property.year_built ? `Built in ${property.year_built}` : "Year built n/a"}</span>
                  </div>
                </div>

                {/* description */}
                <div className="mt-6">
                  <h2 className="text-xl font-bold mb-4">Description</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              </div>

              {/* amenities */}
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

              {/* map */}
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

            {/* sidebar */}
            <div className="lg:w-1/3 mt-8 lg:mt-0">
              <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24">
                <h3 className="text-xl font-bold mb-6">Contact Information</h3>
                {property.contact_phone || property.contact_email ? (
                  <div className="space-y-4">
                    {property.contact_phone && (
                      <div>
                        <p className="text-gray-500 text-sm uppercase">Phone</p>
                        <p className="text-gray-900 font-medium">
                          <a href={`tel:${property.contact_phone}`} className="text-emerald-600">
                            {property.contact_phone}
                          </a>
                        </p>
                      </div>
                    )}
                    {property.contact_email && (
                      <div>
                        <p className="text-gray-500 text-sm uppercase">Email</p>
                        <p className="text-gray-900 font-medium">
                          <a href={`mailto:${property.contact_email}`} className="text-emerald-600">
                            {property.contact_email}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">Contact details not provided.</p>
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
