import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar, 
  Home, 
  Car, 
  Wifi, 
  Droplets, 
  Thermometer, 
  Shield 
} from 'lucide-react';
import { apiClient } from '../middleware/auth';
import { allProperties } from '../data/properties';
import { Property } from '../types';

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  useEffect(() => {
    async function fetchPropertyData() {
      try {
        // Use the custom apiClient to fetch property data from your backend
        const response = await apiClient.get(`/api/properties/${id}`);
        setProperty(response.data);
      } catch (error) {
        console.error("Error fetching property:", error);
      }
    }
    fetchPropertyData();
  }, [id]);

  // Fallback: If no property data is available, show "Property Not Found"
  if (!property) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Not Found</h2>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Additional property images (in a real app, these would be part of the property data)
  const additionalImages = [
    property.imageUrl,
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2053&q=80",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  ];

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* Property Images */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Main Image */}
            <div className="lg:w-2/3">
              <div className="relative h-96 lg:h-[500px] rounded-xl overflow-hidden">
                <img 
                  src={additionalImages[activeImage]} 
                  alt={property.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${property.forSale ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {property.forSale ? 'For Sale' : 'For Rent'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gray-900/70 text-white text-xs font-semibold">
                    {property.type}
                  </span>
                </div>
                <div className="absolute top-4 right-4 flex space-x-2">
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
                    alt={`${property.title} - view ${index + 1}`} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  {index === 3 && additionalImages.length > 5 && (
                    <div 
                      className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllImages(true);
                      }}
                    >
                      +{additionalImages.length - 5} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Property Details */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{property.address}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <p className="text-3xl font-bold text-emerald-600">
                    {property.forSale ? `$${property.price.toLocaleString()}` : `$${property.price.toLocaleString()}/mo`}
                  </p>
                  {property.forSale && (
                    <p className="text-gray-600 text-sm">Est. ${Math.round(property.price / 360).toLocaleString()}/mo</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6 py-4 border-t border-b border-gray-100">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">{property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">{property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Square className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">{property.area.toLocaleString()} sq ft</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">Built in 2018</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  This stunning {property.type.toLowerCase()} offers the perfect blend of luxury and comfort. Nestled in a prime location, this property boasts exceptional craftsmanship and attention to detail throughout. The spacious floor plan features {property.bedrooms} bedrooms and {property.bathrooms} bathrooms, providing ample space for both relaxation and entertainment.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  The gourmet kitchen is equipped with high-end stainless steel appliances, custom cabinetry, and a large center island, making it a chef's dream. The open-concept living area is bathed in natural light and offers seamless indoor-outdoor flow to the beautifully landscaped backyard.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Additional features include hardwood floors, custom lighting fixtures, a two-car garage, and a state-of-the-art security system. Located in a highly sought-after neighborhood with excellent schools, shopping, and dining options nearby, this property represents the epitome of luxury living.
                </p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Features & Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Home className="h-5 w-5 mr-3 text-emerald-600" />
                  <span>Central Air Conditioning</span>
                </div>
                <div className="flex items-center">
                  <Car className="h-5 w-5 mr-3 text-emerald-600" />
                  <span>2-Car Garage</span>
                </div>
                <div className="flex items-center">
                  <Wifi className="h-5 w-5 mr-3 text-emerald-600" />
                  <span>High-Speed Internet Ready</span>
                </div>
                <div className="flex items-center">
                  <Droplets className="h-5 w-5 mr-3 text-emerald-600" />
                  <span>Swimming Pool</span>
                </div>
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 mr-3 text-emerald-600" />
                  <span>Energy Efficient</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-3 text-emerald-600" />
                  <span>Security System</span>
                </div>
                <div className="flex items-center">
                  <Home className="h-5 w-5 mr-3 text-emerald-600" />
                  <span>Hardwood Floors</span>
                </div>
                <div className="flex items-center">
                  <Home className="h-5 w-5 mr-3 text-emerald-600" />
                  <span>Walk-in Closets</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
              <div className="h-80 bg-gray-200 rounded-lg mb-4">
                {/* In a real app, this would be a Google Maps or similar map component */}
                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                  Interactive Map Would Be Here
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                <p className="text-gray-700">{property.address}</p>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3 mt-8 lg:mt-0">
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Schedule a Viewing</h3>
              
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  id="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <select
                  id="time"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
                >
                  <option>Morning (9AM - 12PM)</option>
                  <option>Afternoon (12PM - 4PM)</option>
                  <option>Evening (4PM - 7PM)</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="john@example.com"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="(123) 456-7890"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                <textarea
                  id="message"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="I'm interested in this property and would like to schedule a viewing."
                ></textarea>
              </div>
              
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors">
                Schedule Viewing
              </button>
              
              <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm">
                  or call us at <a href="tel:+18001234567" className="text-emerald-600 font-medium">+1 (800) 123-4567</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PropertyDetails;
