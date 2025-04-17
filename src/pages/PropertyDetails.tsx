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
  CheckCircle,
  Car,
  Droplet,
  Dumbbell,
  Shield,
  Wind,
  Flame,
  Smile,
  DoorOpen,
  Archive,
  Wifi,
  Package,
  ArrowUpCircle,
  Flower,
  Sun,
  UserCheck,
  Anchor
} from 'lucide-react';
import { apiClient } from '../middleware/auth';
import { Property } from '../types';
import MapView from '../components/MapView';

// Geocoding function
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const encodedAddress = encodeURIComponent(address);
  const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json`);
  const data = await response.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  throw new Error('Geocoding failed');
}

// Mapping function
const mapPropertyData = (data: any): Property => {
  if (!data) {
    console.error("Attempted to map null or undefined property data");
    return {
      id: "0", // Convert to string to match interface
      title: "Property data unavailable",
      description: "",
      price: 0,
      location: "",
      property_type: "",
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      year_built: 0, // Use number to match interface
      parking_spaces: 0,
      lot_size: 0, // Use number to match interface
      property_status: "unavailable",
      energy_rating: "",
      construction_material: "",
      floor_level: 0, // Use number to match interface
      total_floors: 0, // Use number to match interface
      available_from: "",
      contact_phone: "",
      contact_email: "",
      virtual_tour_url: "",
      video_url: "",
      amenities: [],
      additional_features: [],
      owner: { id: "0", email: "" }, // Provide a default Owner object
      is_published: false,
      created_at: "",
      updated_at: "",
      images: [],
    };
  }

  try {
    return {
      id: data.id ? data.id.toString() : "0", // Convert to string
      title: data.title || "Untitled Property",
      description: data.description || "",
      price: data.price ? parseFloat(data.price) : 0,
      location: data.location || "",
      property_type: data.property_type || "",
      bedrooms: data.bedrooms ? parseInt(data.bedrooms) : 0,
      bathrooms: data.bathrooms ? parseFloat(data.bathrooms) : 0,
      area: data.area ? parseFloat(data.area) : 0,
      year_built: data.year_built ? parseInt(data.year_built) : 0, // Convert to number
      parking_spaces: data.parking_spaces ? parseInt(data.parking_spaces) : 0,
      lot_size: data.lot_size ? parseFloat(data.lot_size) : 0, // Convert to number
      property_status: data.property_status || "unavailable",
      energy_rating: data.energy_rating || "",
      construction_material: data.construction_material || "",
      floor_level: data.floor_level ? parseInt(data.floor_level) : 0, // Convert to number
      total_floors: data.total_floors ? parseInt(data.total_floors) : 0, // Convert to number
      available_from: data.available_from || "",
      contact_phone: data.contact_phone || "",
      contact_email: data.contact_email || "",
      virtual_tour_url: data.virtual_tour_url || "",
      video_url: data.video_url || "",
      amenities: data.amenities || [],
      additional_features: data.additional_features || [],
      owner: data.owner || { id: "0", email: "" }, // Provide a default Owner object
      is_published: data.is_published || false,
      created_at: data.created_at || "",
      updated_at: data.updated_at || "",
      images: data.images || [],
    };
  } catch (error) {
    console.error("Error mapping property data:", error);
    return {
      id: "0", // Convert to string
      title: "Error loading property",
      description: "",
      price: 0,
      location: "",
      property_type: "",
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      year_built: 0, // Use number to match interface
      parking_spaces: 0,
      lot_size: 0, // Use number to match interface
      property_status: "unavailable",
      energy_rating: "",
      construction_material: "",
      floor_level: 0, // Use number to match interface
      total_floors: 0, // Use number to match interface
      available_from: "",
      contact_phone: "",
      contact_email: "",
      virtual_tour_url: "",
      video_url: "",
      amenities: [],
      additional_features: [],
      owner: { id: "0", email: "" }, // Provide a default Owner object
      is_published: false,
      created_at: "",
      updated_at: "",
      images: [],
    };
  }
};

const formatValue = (val: number | undefined, unit: string = '') => {
  return typeof val === 'number' && isFinite(val) ? `${val.toLocaleString()}${unit}` : 'Not specified';
};

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    // Check if the browser is serving the app directly instead of through the API
    const checkIfHtmlResponse = (data: any) => {
      if (typeof data === 'string' && data.includes('<!doctype html>')) {
        console.error('Received HTML instead of JSON');
        throw new Error('API returned HTML instead of JSON. This likely indicates a routing issue.');
      }
      return data;
    };

    // Add explicit JSON content type to request
    apiClient.get(`/api/properties/${id}/`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log("API Response data:", response.data);
        // Check if response is HTML
        checkIfHtmlResponse(response.data);
        const data = mapPropertyData(response.data);
        console.log("Mapped property data:", data);
        setProperty(data);
        return geocodeAddress(data.location);
      })
      .then(coords => setCoords(coords))
      .catch(error => {
        console.error('Error fetching property details:', error);
        // Attempt to load using a direct API call as a fallback
        if (error.message.includes('API returned HTML')) {
          console.log('Trying alternative API endpoint...');
          // Get the API URL dynamically based on the current environment
          const apiBaseUrl = window.location.origin; // Use the same origin as the current page
          fetch(`${apiBaseUrl}/api/properties/${id}/`)
            .then(response => response.json())
            .then(data => {
              console.log("Fallback API response:", data);
              const mappedData = mapPropertyData(data);
              setProperty(mappedData);
              return geocodeAddress(mappedData.location);
            })
            .then(coords => setCoords(coords))
            .catch(fallbackError => console.error('Fallback API request failed:', fallbackError))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!property) return <div>Property not found</div>;

  return (
    <div>
      <h1>{property.title || 'Unnamed Property'}</h1>
      <p>{property.location || 'Location not specified'}</p>
      <p>
        Price: €
        {typeof property.price === 'number' && isFinite(property.price)
          ? property.price.toLocaleString()
          : '0'}
      </p>
      <div>
        <p>Bedrooms: {property.bedrooms ?? 0}</p>
        <p>Bathrooms: {property.bathrooms ?? 0}</p>
        <p>Area: {formatValue(property.area as number, ' sq ft')}</p>
        <p>Year Built: {property.year_built ? property.year_built : 'Not specified'}</p>
      </div>
    </div>
  );
};

export default PropertyDetails;
