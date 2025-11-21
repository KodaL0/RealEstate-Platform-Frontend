// src/components/FavouriteButton.tsx

import { Heart } from "lucide-react";
import React, { type MouseEvent, useCallback, useState } from "react";
import api from "../config/api"; // Use the main API client
import { useUser } from "../context/UserContext"; // Import useUser
import analytics from "../utils/analytics";

interface FavouriteButtonProps {
  itemId: string | number; // Accept both string and number
  itemType: "property" | "project"; // Type discriminator
  defaultLiked?: boolean;
  onToggle?: (liked: boolean) => void; // Keep onToggle for immediate UI feedback if needed
  onUnlikeSuccess?: (itemId: number) => void; // Optional: Callback on successful unlike
  onLikeSuccess?: (itemId: number) => void; // Optional: Callback on successful like
  // Legacy support - will be deprecated
  propertyId?: string | number;
}

const FavouriteButton: React.FC<FavouriteButtonProps> = ({
  itemId,
  itemType = "property", // Default to property for backward compatibility
  defaultLiked = false,
  onToggle,
  onUnlikeSuccess,
  onLikeSuccess,
  propertyId, // Legacy support
}) => {
  const [liked, setLiked] = useState(defaultLiked);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  // Support legacy propertyId prop
  const effectiveItemId = itemId ?? propertyId;
  const effectiveItemType = propertyId && !itemId ? "property" : itemType;

  // Convert itemId to number for API calls
  const numericItemId =
    typeof effectiveItemId === "string" ? parseInt(effectiveItemId, 10) : effectiveItemId;

  const handleClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
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
      if (previousLikedState === true) {
        // Only ask for confirmation when unliking
        const itemLabel = effectiveItemType === "property" ? "property" : "project";
        const userConfirmed = window.confirm(
          `Are you sure you want to remove this ${itemLabel} from your favourites?`,
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
        // Use the new unified favourites API
        const payload =
          effectiveItemType === "property"
            ? { property_id: numericItemId }
            : { project_id: numericItemId };

        const response = await api.favourites.toggle(payload);
        console.log("Favourite toggled successfully:", response);
        const responseData = response.data as { is_favourite: boolean };
        const actualLikedState = responseData.is_favourite;
        setLiked(actualLikedState);

        // Call appropriate callback based on the action
        if (previousLikedState === false && actualLikedState === true) {
          // Item was liked
          analytics.trackPropertyFavorite(String(numericItemId), "add");
          onLikeSuccess?.(numericItemId);
        } else if (previousLikedState === true && actualLikedState === false) {
          // Item was unliked
          analytics.trackPropertyFavorite(String(numericItemId), "remove");
          onUnlikeSuccess?.(numericItemId);
        }
      } catch (error) {
        console.error("Failed to toggle favourite:", error);
        // Revert optimistic UI update on error
        setLiked(previousLikedState);
        onToggle?.(previousLikedState); // Notify parent of reversion
        // Optionally: show error message to user
      } finally {
        setIsLoading(false);
      }
    },
    [
      liked,
      isLoading,
      numericItemId,
      effectiveItemType,
      onToggle,
      onUnlikeSuccess,
      onLikeSuccess,
      user,
    ],
  );

  // Update local state if defaultLiked prop changes (e.g., after initial data load)
  React.useEffect(() => {
    setLiked(defaultLiked);
  }, [defaultLiked]);

  return (
    <button
      type="button"
      onClick={handleClick}
      // Disable button while loading
      disabled={isLoading}
      className={`p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-opacity ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`} // Adjusted position slightly
      aria-pressed={liked}
      aria-label={liked ? "Remove from favourites" : "Add to favourites"}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          liked ? "text-red-500 fill-current" : "text-gray-600 hover:text-red-500" // Added fill
        }`}
      />
    </button>
  );
};

export default FavouriteButton;
