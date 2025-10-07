// src/components/FavouriteButton.tsx
import React, { useState, MouseEvent, useCallback } from 'react';
import { Heart } from 'lucide-react';
import api from '../config/api'; // Use the main API client
import { useUser } from '../context/UserContext'; // Import useUser
import analytics from '../utils/analytics';

interface FavouriteButtonProps {
  propertyId: string | number; // Accept both string and number
  defaultLiked?: boolean;
  onToggle?: (liked: boolean) => void; // Keep onToggle for immediate UI feedback if needed
  onUnlikeSuccess?: (propertyId: number) => void; // Optional: Callback on successful unlike
  onLikeSuccess?: (propertyId: number) => void; // Optional: Callback on successful like
}

const FavouriteButton: React.FC<FavouriteButtonProps> = ({
  propertyId, // Destructure propertyId
  defaultLiked = false,
  onToggle,
  onUnlikeSuccess, // Destructure the new prop
  onLikeSuccess, // Destructure the new prop
}) => {
  const [liked, setLiked] = useState(defaultLiked);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const { user } = useUser(); // Get user context
  
  // Convert propertyId to number for API calls
  const numericPropertyId = typeof propertyId === 'string' ? parseInt(propertyId, 10) : propertyId;

  const handleClick = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent parent onClick

    if (!user) {
      console.warn("User not logged in. Cannot toggle favourite.");
      // Optionally: trigger login modal or redirect
      return;
    }

    if (isLoading) return; // Prevent multiple clicks while loading

    const previousLikedState = liked;
    const nextLikedState = !liked;

    // ---> Confirmation Step <----
    if (previousLikedState === true) { // Only ask for confirmation when unliking
      const userConfirmed = window.confirm(
        'Are you sure you want to remove this property from your favourites?'
      );
      if (!userConfirmed) {
        return; // Stop execution if user cancels
      }
    }
    // ---> End Confirmation Step <----

    // Optimistic UI update (proceed only if confirmed or if liking)
    setLiked(nextLikedState);
    setIsLoading(true);
    onToggle?.(nextLikedState);

    try {
      // Use the correct API client that includes the /api/ prefix
      const response = await api.properties.toggleFavorite(numericPropertyId);
      console.log('Favourite toggled successfully:', response);
      const actualLikedState = response.data.is_favourite;
      setLiked(actualLikedState);

      // Call appropriate callback based on the action
      if (previousLikedState === false && actualLikedState === true) {
        // Property was liked
        analytics.trackPropertyFavorite(String(numericPropertyId), 'add');
        onLikeSuccess?.(numericPropertyId);
      } else if (previousLikedState === true && actualLikedState === false) {
        // Property was unliked
        analytics.trackPropertyFavorite(String(numericPropertyId), 'remove');
        onUnlikeSuccess?.(numericPropertyId);
      }

    } catch (error) {
      console.error('Failed to toggle favourite:', error);
      // Revert optimistic UI update on error
      setLiked(previousLikedState);
      onToggle?.(previousLikedState); // Notify parent of reversion
      // Optionally: show error message to user
    } finally {
      setIsLoading(false);
    }
  }, [liked, isLoading, numericPropertyId, onToggle, onUnlikeSuccess, onLikeSuccess, user]); // Add onLikeSuccess to dependencies

  // Update local state if defaultLiked prop changes (e.g., after initial data load)
  React.useEffect(() => {
    setLiked(defaultLiked);
  }, [defaultLiked]);


  return (
    <button
      onClick={handleClick}
      // Disable button while loading
      disabled={isLoading}
      className={`p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-opacity ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} // Adjusted position slightly
      aria-pressed={liked}
      aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          liked ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500' // Added fill
        }`}
      />
    </button>
  );
};

export default FavouriteButton;
