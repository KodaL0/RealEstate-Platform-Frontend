import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Plus } from 'lucide-react';
import { apiClient } from '../middleware/auth';

interface Property {
  id: number;
  title: string;
  description: string;
  price: string | number;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  images: { image: string }[];
  created_at: string;
  updated_at: string;
  property_status: string;
}

const MyListings = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;
  const navigate = useNavigate();

  const totalPages = Math.ceil(properties.length / itemsPerPage);
  const currentProperties = properties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const fetchUserAndListings = async () => {
      setLoading(true);
      try {
        const userRes = await apiClient.get('/users/get_user/', { withCredentials: true });
        const user = userRes.data?.user;
        if (!user?.username) {
          setError('Username not found in profile data');
          return;
        }
        setUsername(user.username);

        const listingsRes = await apiClient.get<Property[]>('/properties/my-properties', {
          withCredentials: true
        });

        const normalized = listingsRes.data.map(p => ({
          ...p,
          price: Number(p.price) || 0,
        }));
        setProperties(normalized);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching user or listings:', err);
        const msg =
          err?.response?.data?.message ||
          'Failed to fetch your listings. Please try again later.';
        if (err?.response?.status === 401) {
          navigate('/login');
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndListings();
  }, [navigate]);

  const handlePublish = async (id: number) => {
    if (!username) return alert('Still loading user info...');
    if (!window.confirm('Are you sure you want to publish this listing?')) return;
    try {
      await apiClient.patch(`/properties/${username}/property/${id}/publish/`, null, {
        withCredentials: true,
      });
      setProperties(prev =>
        prev.map(p => (p.id === id ? { ...p, property_status: 'for_sale' } : p))
      );
    } catch (err: any) {
      console.error('Error publishing listing:', err.response || err);
      setError(
        err?.response?.data?.error || 'Failed to publish listing. Please try again later.'
      );
    }
  };

  const handleRemove = async (id: number) => {
    if (!username) return alert('Still loading user info...');
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    try {
      await apiClient.delete(`/properties/${username}/property/${id}/delete/`, {
        withCredentials: true,
      });
      const updated = properties.filter(p => p.id !== id);
      setProperties(updated);
      const newTotalPages = Math.ceil(updated.length / itemsPerPage);
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
    } catch (err: any) {
      console.error('Error removing listing:', err.response || err);
      setError(
        err?.response?.data?.error || 'Failed to remove listing. Please try again later.'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
              <Home className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                No Properties Listed Yet
              </h2>
              <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                Get started by creating your first property listing.
              </p>
              <button
                onClick={() => navigate('/create-listing')}
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Listing
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProperties.map(property => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/property/${property.id}`)}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={property.images[0]?.image || '/placeholder-property.jpg'}
                      alt={property.title}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-4 left-4 flex space-x-2 z-10">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        property.property_status === 'for_sale' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {property.property_status === 'for_sale' ? 'For Sale' : 'For Rent'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        property.property_type.toLowerCase() === 'apartment' ? 'bg-gray-900/70 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {property.property_type}
                      </span>
                    </div>
                  </div>

                  <div className="p-5" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 hover:text-emerald-600 transition-colors">
                        {property.title}
                      </h3>
                      <p className="text-lg font-bold text-blue-600">
                        €{(property.price as number).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="flex items-center text-gray-500 mb-4">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{property.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100 mb-4 text-sm text-gray-500">
                      <span>{property.bedrooms} beds</span>
                      <span>{property.bathrooms} baths</span>
                      <span>{property.area} sqft</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/edit-listing/${property.id}`);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit Listing
                        </button>
                        <button
                          disabled={!username}
                          onClick={e => {
                            e.stopPropagation();
                            handleRemove(property.id);
                          }}
                          className="ml-4 text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          Remove Listing
                        </button>
                        <button
                          disabled={!username}
                          onClick={e => {
                            e.stopPropagation();
                            handlePublish(property.id);
                          }}
                          className="ml-4 text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
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

            {/* Pagination */}
            <div className="flex justify-center items-center mt-8 space-x-4 mb-12">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
