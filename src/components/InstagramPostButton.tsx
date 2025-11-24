import { CheckCircle2, Instagram, Loader2 } from "lucide-react";
import type React from "react";
import { useState, useEffect } from "react";
import api from "../config/api";

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
  className = "",
}) => {
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState(isPosted);
  const [error, setError] = useState<string | null>(null);

  // Update posted state when isPosted prop changes
  useEffect(() => {
    setPosted(isPosted);
  }, [isPosted]);

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
    } catch (err) {
      console.error("Failed to post to Instagram:", err);
      const errorMsg =
        (err as { response?: { data?: { error?: string; details?: string } } })?.response?.data
          ?.error ||
        (err as { response?: { data?: { error?: string; details?: string } } })?.response?.data
          ?.details ||
        "Failed to post to Instagram";
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
          type="button"
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
        type="button"
        className={`group flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-2 border-purple-200 rounded-xl font-semibold text-sm transition-all duration-300 cursor-wait ${className}`}
        disabled
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        <span>Posting...</span>
      </button>
    );
  }

  // Show posted state - disabled to prevent reposting
  if (posted) {
    return (
      <button
        type="button"
        disabled
        className={`group flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-50 text-emerald-700 border-2 border-emerald-200 rounded-xl font-semibold text-sm transition-all duration-300 cursor-not-allowed opacity-75 ${className}`}
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        <span>Posted {postCount > 1 && `(${postCount}x)`}</span>
      </button>
    );
  }

  // Show default "Post to Instagram" state
  return (
    <button
      type="button"
      onClick={handlePost}
      className={`group flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-purple-500/20 ${className}`}
    >
      <Instagram className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
      <span>Post to Instagram</span>
    </button>
  );
};

export default InstagramPostButton;
