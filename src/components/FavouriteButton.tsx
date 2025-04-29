// src/components/FavouriteButton.tsx
import React, { useState } from 'react';
import { Heart as HeartOutline, HeartFill } from 'lucide-react'; // if you have a filled heart icon
// If you don’t have a filled icon, you can just swap colors on the outline

interface FavouriteButtonProps {
  /** initial favourite state */
  defaultLiked?: boolean;
  /** callback when toggled: new liked state */
  onToggle?: (liked: boolean) => void;
}

const FavouriteButton: React.FC<FavouriteButtonProps> = ({
  defaultLiked = false,
  onToggle,
}) => {
  const [liked, setLiked] = useState(defaultLiked);

  const handleClick = () => {
    const next = !liked;
    setLiked(next);
    onToggle?.(next);
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-md"
      aria-pressed={liked}
      aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
    >
      {liked ? (
        <HeartFill className="h-5 w-5 text-red-500 transition-colors" />
      ) : (
        <HeartOutline className="h-5 w-5 text-gray-600 hover:text-red-500 transition-colors" />
      )}
    </button>
  );
};

export default FavouriteButton;
