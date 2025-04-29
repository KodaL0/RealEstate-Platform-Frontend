// src/components/FavouriteButton.tsx
import React, { useState, MouseEvent } from 'react';
import { Heart } from 'lucide-react';

interface FavouriteButtonProps {
  defaultLiked?: boolean;
  onToggle?: (liked: boolean) => void;
}

const FavouriteButton: React.FC<FavouriteButtonProps> = ({
  defaultLiked = false,
  onToggle,
}) => {
  const [liked, setLiked] = useState(defaultLiked);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Prevent the parent <div onClick> from firing
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    onToggle?.(next);
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-4 right-12 p-2 bg-white/80 hover:bg-white rounded-full shadow-md z-20"
      aria-pressed={liked}
      aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
        }`}
      />
    </button>
  );
};

export default FavouriteButton;
