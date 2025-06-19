import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Home, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PropertyCard from '../components/PropertyCard';
import { normalizePropertyData, Property } from '../types';
import api from '../config/api';

interface PublicProfileData {
  username: string;
  date_joined: string;
  properties_count: number;
  published_properties: any[];
}

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      navigate('/404');
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.auth.getPublicProfile(username);
        const data = response.data;

        if (data.status === 200 && data.profile) {
          setProfileData(data.profile);
          
          // Normalize the properties data
          const normalizedProperties = data.profile.published_properties.map(normalizePropertyData);
          setProperties(normalizedProperties);
        } else {
          setError('Profile not found');
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        if (err.response?.status === 404) {
          setError('Profile not found');
        } else {
          setError('Failed to load profile. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username, navigate]);

  // Update document title when profile loads
  useEffect(() => {
    if (profileData) {
      document.title = `${profileData.username} - Property Profile | Propertpro`;
    }
    return () => {
      document.title = 'Propertpro - Find Your Perfect Property';
    };
  }, [profileData]);

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="pt-20 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error === 'Profile not found' ? 'Profile Not Found' : 'Error Loading Profile'}
            </h1>
            <p className="text-gray-600 mb-6">
              {error === 'Profile not found' 
                ? "The user profile you're looking for doesn't exist."
                : error
              }
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="h-12 w-12 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {profileData.username}
              </h1>
              <div className="flex items-center justify-center text-white/90 mb-4">
                <Calendar className="h-5 w-5 mr-2" />
                <span>Member since {formatJoinDate(profileData.date_joined)}</span>
              </div>
              <div className="flex items-center justify-center text-white/90">
                <Home className="h-5 w-5 mr-2" />
                <span>
                  {profileData.properties_count} {profileData.properties_count === 1 ? 'listing' : 'listings'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Properties Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Published Listings
            </h2>
            <p className="text-gray-600">
              {profileData.properties_count === 0 
                ? `${profileData.username} has no published listings yet.`
                : `Showing ${profileData.properties_count} ${profileData.properties_count === 1 ? 'property' : 'properties'} by ${profileData.username}`
              }
            </p>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-16">
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Published Listings
              </h3>
              <p className="text-gray-600">
                This user has no published listings yet.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default PublicProfile; 