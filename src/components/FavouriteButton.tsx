// src/components/FavouriteButton.tsx
import React, { useState, MouseEvent, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { apiClient } from '../middleware/auth'; // Import apiClient
import { useUser } from '../context/UserContext'; // Import useUser

interface FavouriteButtonProps {
  propertyId: number; // Add propertyId prop
  defaultLiked?: boolean;
  onToggle?: (liked: boolean) => void; // Keep onToggle for immediate UI feedback if needed
  onUnlikeSuccess?: (propertyId: number) => void; // Optional: Callback on successful unlike
}

const FavouriteButton: React.FC<FavouriteButtonProps> = ({
  propertyId, // Destructure propertyId
  defaultLiked = false,
  onToggle,
  onUnlikeSuccess, // Destructure the new prop
}) => {
  const [liked, setLiked] = useState(defaultLiked);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const { user } = useUser(); // Get user context

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
    onToggle?.(nextLikedState); // Notify parent immediately if needed

    try {
      // Use apiClient for authenticated request
      const response = await apiClient.post(`/properties/${propertyId}/favourite/`);
      console.log('Favourite toggled successfully:', response.data);
      const actualLikedState = response.data.is_favourite;
      setLiked(actualLikedState);

      // If the action resulted in unliking, call the success callback
      if (previousLikedState === true && actualLikedState === false) {
        onUnlikeSuccess?.(propertyId);
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
  }, [liked, isLoading, propertyId, onToggle, onUnlikeSuccess, user]); // Add onUnlikeSuccess to dependencies

  // Update local state if defaultLiked prop changes (e.g., after initial data load)
  React.useEffect(() => {
    setLiked(defaultLiked);
  }, [defaultLiked]);


  return (
    <button
      onClick={handleClick}
      // Disable button while loading
      disabled={isLoading}
      className={`absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-md z-20 transition-opacity ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} // Adjusted position slightly
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
