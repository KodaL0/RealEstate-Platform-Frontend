// src/components/FavouriteButton.tsx
import React, { useState } from 'react';
import { Heart } from 'lucide-react';

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
      <Heart
        className="h-5 w-5"
        stroke={liked ? 'red' : '#4B5563'}
        fill={liked ? 'red' : 'none'}
      />
    </button>
  );
};

export default FavouriteButton;
