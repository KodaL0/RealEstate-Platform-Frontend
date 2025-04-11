import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  images: string[];
  created_at: string;
  updated_at: string;
}

const MyListings = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Assume useUser() returns the currently logged-in user. Omitted here for brevity.
  // const { user, isLoading: userLoading } = useUser();

  useEffect(() => {
    // For demo purposes, we assume the user is already loaded.
    const fetchMyListings = async () => {
      try {
        setLoading(true);
        // Let the browser automatically send cookies (which include your token)
        const response = await axios.get<Property[]>('https://propertprodjango.onrender.com/api/properties/my-properties', {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        });
        if (Array.isArray(response.data)) {
          setProperties(response.data);
        } else {
          setProperties([]);
        }
        setError(null);
      } catch (err: any) {
        console.error('Error fetching listings:', err.response || err);
        const errorMessage = err?.response?.data?.message || 'Failed to fetch your listings. Please try again later.';
        if (err?.response?.status === 401) {
          navigate('/login');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          <button
            onClick={() => navigate('/create-listing')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Create New Listing
          </button>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No Properties Listed Yet</h2>
              <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                Get started by creating your first property listing.
              </p>
              <button
                onClick={() => navigate('/create-listing')}
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Listing
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/property/${property.id}`)}
              >
                <div className="relative h-48">
                  <img
                    src={property.images[0] || '/placeholder-property.jpg'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 m-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      {property.property_type}
                    </span>
                  </div>
                </div>
                <div className="p-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{property.title}</h3>
                  <p className="text-gray-600 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {property.location}
                  </p>
                  <p className="text-blue-600 font-semibold mb-4">${property.price.toLocaleString()}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>{property.bedrooms} beds</span>
                    <span>{property.bathrooms} baths</span>
                    <span>{property.area} sqft</span>
                  </div>
                  <div className="flex justify-between items-center">
                    {/* Removed "View Details" button since the entire card is clickable.
                        Added "Edit Listing" button. StopPropagation ensures clicking it doesn't trigger card onClick. */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/create-listing/${property.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit Listing
                    </button>
                    <span className="text-sm text-gray-500">
                      Listed {new Date(property.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListings;
