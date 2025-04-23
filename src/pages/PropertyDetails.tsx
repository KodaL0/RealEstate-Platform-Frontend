// Import the marker fix at the top so it applies globally
import '../components/leafletMarkerFix'; // Adjust the path if needed

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Heart,
  Share2,
  // Amenity icons:
  CheckCircle,
  Car,
  Droplet,
  Dumbbell,
  Shield,
  Wind,
  Flame, // replacing 'Fire' with Flame
  Smile,
  DoorOpen, // using DoorOpen instead of Door
  Archive,
  Wifi,
  Package,
  ArrowUpCircle,
  Flower,
  Sun,
  UserCheck,
  Anchor // using Anchor for waterfront
} from 'lucide-react';
import { apiClient } from '../middleware/auth';
import { Property } from '../types';
import MapView from '../components/MapView'; // Ensure that MapView exists and uses React Leaflet

// Geocoding function using Nominatim
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const encodedAddress = encodeURIComponent(address);
  const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json`);
  const data = await response.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  throw new Error('Geocoding failed');
}

// Mapping function to convert API data to our Property type.
const mapPropertyData = (data: any): Property => {
  if (!data) {
    console.error("Attempted to map null or undefined property data");
    // Return a minimal property object to prevent rendering errors
    return {
      id: 0,
      title: "Property data unavailable",
      description: "",
      price: 0,
      location: "",
      property_type: "",
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      year_built: "",
      parking_spaces: 0,
      lot_size: "",
      property_status: "unavailable",
      energy_rating: "",
      construction_material: "",
      floor_level: "",
      total_floors: "",
      available_from: "",
      contact_phone: "",
      contact_email: "",
      virtual_tour_url: "",
      video_url: "",
      amenities: [],
      additional_features: [],
      owner: null,
      is_published: false,
      created_at: "",
      updated_at: "",
      images: [],
    };
  }

  try {
    return {
      id: data.id || 0,
      title: data.title || "Untitled Property",
      description: data.description || "",
      price: data.price ? parseFloat(data.price) : 0,
      location: data.location || "",
      property_type: data.property_type || "",
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms ? parseFloat(data.bathrooms) : 0,
      area: data.area ? parseFloat(data.area) : 0,
      year_built: data.year_built || "",
      parking_spaces: data.parking_spaces || 0,
      lot_size: data.lot_size || "",
      property_status: data.property_status || "unavailable",
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
    };
  } catch (error) {
    console.error("Error mapping property data:", error);
    // Return a minimal property object to prevent rendering errors
    return {
      id: 0,
      title: "Error loading property",
      description: "",
      price: 0,
      location: "",
      property_type: "",
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      year_built: "",
      parking_spaces: 0,
      lot_size: "",
      property_status: "unavailable",
      energy_rating: "",
      construction_material: "",
      floor_level: "",
      total_floors: "",
      available_from: "",
      contact_phone: "",
      contact_email: "",
      virtual_tour_url: "",
      video_url: "",
      amenities: [],
      additional_features: [],
      owner: null,
      is_published: false,
      created_at: "",
      updated_at: "",
      images: [],
    };
  }
};

// Define the amenity-to-icon mapping.
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
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchPropertyData() {
      try {
        setLoading(true);
        
        const DIRECT_API_URL = 'https://propertprodjango.onrender.com/api';
        
        // Instead of trying to fetch a single property, get all properties and filter
        console.log("Fetching all properties to find property ID:", id);
        
        // Try to fetch from buy listings first
        try {
          console.log("Fetching buy properties from:", `${DIRECT_API_URL}/properties/buy`);
          const buyResponse = await fetch(`${DIRECT_API_URL}/properties/buy`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            credentials: 'omit',
          });
          
          if (buyResponse.ok) {
            const contentType = buyResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const rawText = await buyResponse.text();
              
              // Check if the response is HTML
              if (rawText.includes('<!doctype html>') || rawText.includes('<html')) {
                console.error("Received HTML instead of JSON from buy API:", rawText.substring(0, 200));
              } else {
                try {
                  const buyData = JSON.parse(rawText);
                  const properties = Array.isArray(buyData) ? buyData : (buyData.results || []);
                  const foundProperty = properties.find(p => p.id.toString() === id);
                  
                  if (foundProperty) {
                    console.log('Found property in buy listings:', foundProperty);
                    
                    // Map the property data
                    const mappedProperty = mapPropertyData(foundProperty);
                    setProperty(mappedProperty);
                    
                    // Try to geocode if needed
                    if (!foundProperty.latitude && mappedProperty.location) {
                      try {
                        const geocoded = await geocodeAddress(mappedProperty.location);
                        setCoords(geocoded);
                      } catch (error) {
                        console.error("Error geocoding address:", error);
                      }
                    }
                    
                    setLoading(false);
                    return; // Exit early if found
                  }
                } catch (parseError) {
                  console.error("JSON parse error for buy listings:", parseError);
                }
              }
            }
          }
        } catch (buyError) {
          console.error("Error fetching buy properties:", buyError);
        }
        
        // If not found in buy listings, try rent listings
        try {
          console.log("Fetching rent properties from:", `${DIRECT_API_URL}/properties/rent`);
          const rentResponse = await fetch(`${DIRECT_API_URL}/properties/rent`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            credentials: 'omit',
          });
          
          if (rentResponse.ok) {
            const contentType = rentResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const rawText = await rentResponse.text();
              
              // Check if the response is HTML
              if (rawText.includes('<!doctype html>') || rawText.includes('<html')) {
                console.error("Received HTML instead of JSON from rent API:", rawText.substring(0, 200));
              } else {
                try {
                  const rentData = JSON.parse(rawText);
                  const properties = Array.isArray(rentData) ? rentData : (rentData.results || []);
                  const foundProperty = properties.find(p => p.id.toString() === id);
                  
                  if (foundProperty) {
                    console.log('Found property in rent listings:', foundProperty);
                    
                    // Map the property data
                    const mappedProperty = mapPropertyData(foundProperty);
                    setProperty(mappedProperty);
                    
                    // Try to geocode if needed
                    if (!foundProperty.latitude && mappedProperty.location) {
                      try {
                        const geocoded = await geocodeAddress(mappedProperty.location);
                        setCoords(geocoded);
                      } catch (error) {
                        console.error("Error geocoding address:", error);
                      }
                    }
                    
                    setLoading(false);
                    return; // Exit early if found
                  }
                } catch (parseError) {
                  console.error("JSON parse error for rent listings:", parseError);
                }
              }
            }
          }
        } catch (rentError) {
          console.error("Error fetching rent properties:", rentError);
        }
        
        // If we get here, we couldn't find the property in either listing
        console.error("Property not found in any listings:", id);
        setProperty(null);
      } catch (error) {
        console.error("Error in property details flow:", error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchPropertyData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Not Found</h2>
          <p className="text-gray-600 mb-6">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Determine main and additional images.
  const mainImageUrl = property.images && property.images.length > 0
    ? property.images[activeImage].image
    : '';
  const additionalImages = property.images && property.images.length > 0
    ? property.images.map(img => img.image)
    : [];

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Property Images Section */}
        <section className="bg-white">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Main Image */}
            <div className="lg:w-2/3">
              <div className="relative h-96 lg:h-[500px] rounded-xl overflow-hidden">
                <img
                  src={mainImageUrl || 'https://via.placeholder.com/800x600?text=No+Image+Available'}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex space-x-2 z-30">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    property.property_status === 'for_sale'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {property.property_status === 'for_sale' ? 'For Sale' : 'For Rent'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gray-900/70 text-white text-xs font-semibold">
                    {property.property_type || 'Property'}
                  </span>
                </div>
                <div className="absolute top-4 right-4 flex space-x-2 z-30">
                  <button className="p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors">
                    <Heart className="h-5 w-5 text-gray-600 hover:text-red-500 transition-colors" />
                  </button>
                  <button className="p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors">
                    <Share2 className="h-5 w-5 text-gray-600 hover:text-blue-500 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
            {/* Thumbnail Grid */}
            <div className="lg:w-1/3 grid grid-cols-2 gap-4">
              {additionalImages.slice(1, 5).map((img, index) => (
                <div
                  key={index}
                  className="relative h-44 rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => setActiveImage(index + 1)}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  {index === 3 && additionalImages.length > 5 && (
                    <div
                      className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      +{additionalImages.length - 5} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Property Details Section */}
        <section className="mt-8">
          <div className="flex flex-col lg:flex-row lg:space-x-8">
            {/* Main Content */}
            <div className="lg:w-2/3">
              <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {property.title || 'Unnamed Property'}
                    </h1>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{property.location || 'Location not specified'}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 text-right">
                    <p className="text-3xl font-bold text-blue-600">
                      €{typeof property.price === 'number' && isFinite(property.price) ? property.price.toLocaleString() : '0'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 py-4 border-t border-b border-gray-100">
                  <div className="flex items-center text-gray-700">
                    <Bed className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{property.bedrooms || 0} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Bath className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{property.bathrooms || 0} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Square className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{typeof property.area === 'number' && isFinite(property.area) ? property.area.toLocaleString() : '0'} sq ft</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{property.year_built ? `Built in ${property.year_built}` : 'Year built not specified'}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {property.description}
                  </p>
                </div>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.amenities.map((amenity, idx) => {
                      const icon = amenityIcons[amenity] || amenityIcons.default;
                      return (
                        <div key={idx} className="flex items-center">
                          {icon}
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
                {coords ? (
                  <MapView lat={coords.lat} lng={coords.lng} />
                ) : (
                  <p className="text-gray-600">Location coordinates not available.</p>
                )}
                <div className="flex items-start mt-4">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  <p className="text-gray-700">{property.location}</p>
                </div>
              </div>
            </div>

            {/* Sidebar: Listing Owner Information */}
            <div className="lg:w-1/3 mt-8 lg:mt-0">
              <div className="bg-white p-6 rounded-xl shadow-sm mb-8 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Listing Owner
                </h3>
                {property.owner ? (
                  <div className="space-y-4">
                    {property.owner.name && (
                      <div>
                        <p className="text-gray-500 text-sm uppercase">Name</p>
                        <p className="text-gray-900 font-medium">{property.owner.name}</p>
                      </div>
                    )}
                    {property.owner.phone && (
                      <div>
                        <p className="text-gray-500 text-sm uppercase">Phone</p>
                        <p className="text-gray-900 font-medium">
                          <a href={`tel:${property.owner.phone}`} className="text-emerald-600">
                            {property.owner.phone}
                          </a>
                        </p>
                      </div>
                    )}
                    {property.owner.email && (
                      <div>
                        <p className="text-gray-500 text-sm uppercase">Email</p>
                        <p className="text-gray-900 font-medium">
                          <a href={`mailto:${property.owner.email}`} className="text-emerald-600">
                            {property.owner.email}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">Owner details not available.</p>
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
