import React, { useState } from 'react';
import { Instagram, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../config/api';

interface InstagramPostButtonProps {
  propertyId: number | string;
  isPosted?: boolean;
  postCount?: number;
  onPostSuccess?: () => void;
  className?: string;
}

const InstagramPostButton: React.FC<InstagramPostButtonProps> = ({
  propertyId,
  isPosted = false,
  postCount = 0,
  onPostSuccess,
  className = ''
}) => {
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState(isPosted);
  const [error, setError] = useState<string | null>(null);

  const handlePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      setIsPosting(true);
      setError(null);

      await api.instagram.postProperty(Number(propertyId));

      setPosted(true);
      onPostSuccess?.();

      // Show success message briefly
      setTimeout(() => {
        setError(null);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to post to Instagram:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.details || 'Failed to post to Instagram';
      setError(errorMsg);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setIsPosting(false);
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className={`flex flex-col ${className}`}>
        <button
          className="group flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-50 text-red-700 border-2 border-red-200 rounded-xl font-semibold text-sm transition-all duration-300 cursor-not-allowed"
          disabled
        >
          <Instagram className="h-4 w-4 mr-2" />
          <span>Instagram Error</span>
        </button>
        <p className="text-xs text-red-600 mt-1 px-1">{error}</p>
      </div>
    );
  }

  // Show posting state
  if (isPosting) {
    return (
      <button
        className={`group flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-2 border-purple-200 rounded-xl font-semibold text-sm transition-all duration-300 cursor-wait ${className}`}
        disabled
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        <span>Posting...</span>
      </button>
    );
  }

  // Show posted state
  if (posted) {
    return (
      <button
        onClick={handlePost}
        className={`group flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-50 hover:from-emerald-100 hover:to-emerald-100 text-emerald-700 border-2 border-emerald-200 hover:border-emerald-300 rounded-xl font-semibold text-sm transition-all duration-300 ${className}`}
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        <span>
          Posted {postCount > 1 && `(${postCount}x)`}
        </span>
      </button>
    );
  }

  // Show default "Post to Instagram" state
  return (
    <button
      onClick={handlePost}
      className={`group flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-purple-500/20 ${className}`}
    >
      <Instagram className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
      <span>Post to Instagram</span>
    </button>
  );
};

export default InstagramPostButton;

