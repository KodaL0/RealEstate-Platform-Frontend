import '../components/leafletMarkerFix';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Square, Calendar, Heart, Share2,
  CheckCircle, Car, Droplet, Dumbbell, Shield, Wind, Flame,
  Smile, DoorOpen, Archive, Wifi, Package, ArrowUpCircle,
  Flower, Sun, UserCheck, Anchor
} from 'lucide-react';
import { apiClient } from '../middleware/auth';
import { Property } from '../types';
import MapView from '../components/MapView';

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  if (!address || address.trim() === "") {
    throw new Error("Empty address for geocoding");
  }
  const encoded = encodeURIComponent(address);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json`);
  const data = await res.json();
  if (data?.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  throw new Error("Geocoding failed");
}

const mapPropertyData = (data: any): Property => ({
  id: data.id,
  title: data.title || "Untitled Property",
  description: data.description || "",
  price: parseFloat(data.price) || 0,
  location: data.location || "",
  property_type: data.property_type || "",
  bedrooms: data.bedrooms || 0,
  bathrooms: parseFloat(data.bathrooms) || 0,
  area: data.area || 0,
  year_built: data.year_built || "",
  parking_spaces: data.parking_spaces || 0,
  lot_size: data.lot_size || "",
  property_status: data.property_status || "unknown",
  energy_rating: data.energy_rating || "",
  construction_material: data.construction_material || "",
  floor_level: data.floor_level || "",
  total_floors: data.total_floors || "",
  available_from: data.available_from || "",
  contact_phone: data.contact_phone || "",
  contact_email: data.contact_email || "",
  virtual_tour_url: data.virtual_tour_url || "",
  video_url: data.video_url || "",
  amenities: data.amenities || [],
  additional_features: data.additional_features || [],
  owner: data.owner || null,
  is_published: data.is_published || false,
  created_at: data.created_at || "",
  updated_at: data.updated_at || "",
  images: data.images || [],
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

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperty() {
      try {
        if (!id || isNaN(Number(id))) {
          console.error("Invalid property ID in URL:", id);
          return;
        }

        let res;
        try {
          res = await apiClient.get(`/properties/${id}`);
        } catch (err: any) {
          if (err.response && (err.response.status === 404 || err.response.status === 401)) {
            const fallback = await apiClient.get('/properties/buy');
            const list = Array.isArray(fallback.data) ? fallback.data : fallback.data.results;
            const found = list.find((p: any) => p.id.toString() === id);
            if (!found) throw new Error("Property not found in fallback list");
            res = { data: found };
          } else {
            throw err;
          }
        }

        const mapped = mapPropertyData(res.data);
        setProperty(mapped);

        if (!res.data.latitude && mapped.location && mapped.location.trim() !== "") {
          try {
            const coords = await geocodeAddress(mapped.location);
            setCoords(coords);
          } catch (geoErr) {
            console.error("Geocode failed:", geoErr);
          }
        }
      } catch (err) {
        console.error("Final property fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  if (loading) {
    return <div className="pt-20 text-center">Loading...</div>;
  }

  if (!property) {
    return (
      <div className="pt-20 text-center">
        <h2 className="text-2xl font-bold text-red-600">Property Not Found</h2>
        <p className="text-gray-600">Check the link or return to listings.</p>
        <Link to="/" className="text-blue-500 underline">← Back to Home</Link>
      </div>
    );
  }

  const mainImage = property.images?.[0]?.image || "https://via.placeholder.com/800x600";
  const thumbnails = property.images?.slice(1, 5).map(img => img.image) || [];

  return (
    <div className="pt-20 bg-gray-50 min-h-screen px-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-2/3">
            <div className="rounded-xl overflow-hidden">
              <img src={mainImage} alt={property.title} className="w-full h-96 object-cover" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {thumbnails.map((img, idx) => (
                <img key={idx} src={img} className="h-28 object-cover rounded-md" />
              ))}
            </div>
            <h1 className="text-3xl font-bold mt-6">{property.title}</h1>
            <div className="text-gray-600 flex items-center mt-2">
              <MapPin className="h-4 w-4 mr-1" />
              {property.location || "No location"}
            </div>
            <div className="text-blue-600 text-2xl font-semibold mt-2">
              €{property.price.toLocaleString()}
            </div>

            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5" />
                {property.bedrooms} Beds
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5" />
                {property.bathrooms} Baths
              </div>
              <div className="flex items-center gap-2">
                <Square className="h-5 w-5" />
                {property.area.toLocaleString()} sq ft
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {property.year_built ? `Built in ${property.year_built}` : "Year unknown"}
              </div>
            </div>

            {property.description && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold">Description</h2>
                <p className="text-gray-700 mt-2">{property.description}</p>
              </div>
            )}

            {property.amenities?.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Amenities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {property.amenities.map((a, i) => (
                    <div key={i} className="flex items-center">
                      {amenityIcons[a] || amenityIcons.default}
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Location</h2>
              {coords ? <MapView lat={coords.lat} lng={coords.lng} /> : <p>No map data.</p>}
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white p-4 rounded-xl shadow sticky top-24">
              <h3 className="text-lg font-bold mb-2">Listing Owner</h3>
              {property.owner ? (
                <div>
                  {property.owner.name && <p><strong>Name:</strong> {property.owner.name}</p>}
                  {property.owner.email && (
                    <p>
                      <strong>Email:</strong>{' '}
                      <a href={`mailto:${property.owner.email}`} className="text-blue-600 underline">
                        {property.owner.email}
                      </a>
                    </p>
                  )}
                  {property.owner.phone && (
                    <p>
                      <strong>Phone:</strong>{' '}
                      <a href={`tel:${property.owner.phone}`} className="text-blue-600 underline">
                        {property.owner.phone}
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No owner info available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
