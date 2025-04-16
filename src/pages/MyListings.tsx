import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Home, Plus } from 'lucide-react';
import { apiClient } from '../middleware/auth';

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
  images: { image: string }[]; // Assumes each image is an object with an "image" property.
  created_at: string;
  updated_at: string;
  property_status: string;
}

const MyListings = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  // Add state for current username
  const [username, setUsername] = useState<string>('');
  const [loadingUsername, setLoadingUsername] = useState<boolean>(true);

  // Pagination states
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = Math.ceil(properties.length / itemsPerPage);

  // Fetch current user's username
  useEffect(() => {
    setLoadingUsername(true);
    apiClient
      .get('/api/users/get_user/')
      .then(response => {
        console.log("Fetched current user data:", response.data);
        if (response.data && response.data.user && response.data.user.username) {
          console.log("Setting username to:", response.data.user.username);
          setUsername(response.data.user.username);
        } else {
          console.warn("Username not found in user data:", response.data);
          setError("Username not found in profile data");
        }
      })
      .catch(error => {
        console.error("Error fetching user profile:", error);
        setError("Failed to fetch user profile. Please try again.");
      })
      .finally(() => {
        setLoadingUsername(false);
      });
  }, []);

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<Property[]>(
          '/api/properties/my-properties',
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
          }
        );
        if (Array.isArray(response.data)) {
          setProperties(response.data);
        } else {
          setProperties([]);
        }
        setError(null);
      } catch (err: any) {
        console.error('Error fetching listings:', err.response || err);
        const errorMessage =
          err?.response?.data?.message ||
          'Failed to fetch your listings. Please try again later.';
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

  // New handler for publishing a listing
  const handlePublish = async (id: number) => {
    if (!window.confirm("Are you sure you want to publish this listing?")) return;
    if (!username) {
      setError("Unable to publish listing: username not available");
      return;
    }
    try {
      // Adjust the endpoint as needed
      await apiClient.patch(`/api/properties/${username}/property/${id}/publish/`, null, {
        withCredentials: true,
      });
      // Optionally update the UI to reflect the published status.
      setProperties(prev =>
        prev.map(property =>
          property.id === id ? { ...property, property_status: 'for_sale' } : property
        )
      );
    } catch (err: any) {
      console.error("Error publishing listing:", err.response || err);
      const errorMessage =
        err?.response?.data?.error ||
        'Failed to publish listing. Please try again later.';
      setError(errorMessage);
    }
  };

  // Calculate the properties to display on the current page.
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProperties = properties.slice(startIndex, startIndex + itemsPerPage);

  // Handlers for pagination
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevious = () => {
    goToPage(currentPage - 1);
  };

  const handleNext = () => {
    goToPage(currentPage + 1);
  };

  // Updated handler for removing a listing using the new username-based endpoint
  const handleRemove = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this listing?")) return;
    
    // Check if we have the username
    if (!username) {
      setError("Unable to delete listing: username not available");
      return;
    }
    
    try {
      // Use the new username-based endpoint
      await apiClient.delete(`/api/properties/${username}/property/${id}/delete/`, {
        withCredentials: true,
      });
      
      setProperties(prev => prev.filter(property => property.id !== id));
      
      // Adjust current page if necessary.
      const newTotalPages = Math.ceil((properties.length - 1) / itemsPerPage);
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }
    } catch (err: any) {
      console.error("Error removing listing:", err.response || err);
      const errorMessage =
        err?.response?.data?.error ||
        'Failed to remove listing. Please try again later.';
      setError(errorMessage);
    }
  };

  // Show loading if we're loading the username or properties
  if (loading || loadingUsername) {
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
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
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
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors"
          >
            <Plus className="h-8 w-8" />
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => navigate(`/property/${property.id}`)}
                >
                  {/* Image Section */}
                  <div className="relative">
                    <img
                      src={
                        (property.images &&
                          property.images.length > 0 &&
                          property.images[0]?.image) ||
                        '/placeholder-property.jpg'
                      }
                      alt={property.title || 'Property Image'}
                      className="w-full h-64 object-cover"
                    />
                    {/* Badges: Sale Status and Property Type */}
                    <div className="absolute top-4 left-4 flex space-x-2 z-10">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          property.property_status === 'for_sale'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {property.property_status === 'for_sale' ? 'For Sale' : 'For Rent'}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          property.property_type?.toLowerCase() === 'apartment'
                            ? 'bg-gray-900/70 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {property.property_type}
                      </span>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 hover:text-emerald-600 transition-colors">
                        {property.title}
                      </h3>
                      <p className="text-lg font-bold text-blue-600">
                        {`€${property.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      </p>
                    </div>
                    <div className="flex items-center text-gray-500 mb-4">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-sm">{property.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100 mb-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <span>{property.bedrooms} beds</span>
                      </div>
                      <div className="flex items-center">
                        <span>{property.bathrooms} baths</span>
                      </div>
                      <div className="flex items-center">
                        <span>{property.area} sqft</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit-listing/${property.id}`);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit Listing
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(property.id);
                          }}
                          className="ml-4 text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove Listing
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(property.id);
                          }}
                          className="ml-4 text-green-600 hover:text-green-700 font-medium"
                        >
                          Publish
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">
                        Listed {new Date(property.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
  
            {/* Pagination Controls */}
            <div className="flex justify-center items-center mt-8 space-x-4 mb-12">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index + 1)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyListings;
