// src/pages/Favourites.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import api from '../config/api'; // Use the main API client
import { UnifiedListingItem } from '../types';
import PropertyCard from '../components/cards/PropertyCard';
import ProjectCard from '../components/cards/ProjectCard';
import { Link } from 'react-router-dom'; // Import Link for login prompt

const Favourites: React.FC = () => {
  const { user, isLoading: userLoading } = useUser();
  const [favourites, setFavourites] = useState<UnifiedListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch if user data is still loading or user is not logged in
    if (userLoading) {
      setLoading(true); // Keep loading true while user status is determined
      return;
    }
    if (!user) {
      setLoading(false); // User is not logged in, stop loading
      setFavourites([]); // Clear any potential previous state
      setError(null); // No error, just not logged in
      return;
    }

    const fetchFavourites = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the new unified favourites API that returns both properties and projects
        const response = await api.favourites.list();
        setFavourites(response.results || []);
      } catch (err) {
        console.error("Failed to fetch favourites:", err);
        setError("Failed to load your favourites. Please try again later.");
        setFavourites([]); // Clear favourites on error
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();

  }, [user, userLoading]); // Rerun effect if user or userLoading status changes

  // Callback function to remove an item from the local state
  const handleUnlikeSuccess = useCallback((itemId: number) => {
    setFavourites(prevFavourites =>
      prevFavourites.filter(fav => Number(fav.id) !== itemId)
    );
    console.log(`Removed item ${itemId} from local favourites list.`);
  }, []); // Empty dependency array as it doesn't depend on component state

  const renderContent = () => {
    if (loading || userLoading) {
      return <p className="text-center text-gray-500">Loading favourites...</p>;
    }

    if (!user) {
      return (
        <div className="text-center text-gray-500">
          <p>Please <Link to="/login" className="text-blue-600 hover:underline">log in</Link> to view your favourites.</p>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }

    if (favourites.length === 0) {
      return <p className="text-center text-gray-500">You haven't added any favourites yet.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favourites.map((item) => {
          // Render PropertyCard or ProjectCard based on _type
          if (item._type === 'property') {
            return (
              <PropertyCard
                key={`property-${item.id}`}
                property={item}
                onUnlikeSuccess={handleUnlikeSuccess}
              />
            );
          } else if (item._type === 'project') {
            return (
              <ProjectCard
                key={`project-${item.id}`}
                project={item}
                onUnlikeSuccess={handleUnlikeSuccess}
              />
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20 min-h-screen"> {/* Added top padding and min height */}
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left">Your Favourites</h1>
      {renderContent()}
    </div>
  );
};

export default Favourites;
