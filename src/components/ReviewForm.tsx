import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Send, Star, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import api from "../config/api";
import type { UserBasic } from "../types";

interface ReviewFormProps {
  reviewee: UserBasic;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ReviewFormData {
  overall_rating: number;
  content: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ reviewee, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    overall_rating: 0,
    content: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleOverallRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, overall_rating: rating }));
  };

  const handleInputChange = (field: keyof ReviewFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (formData.overall_rating === 0) {
      return "Please select an overall rating";
    }
    if (!formData.content.trim()) {
      return "Please write a review comment";
    }
    if (formData.content.trim().length < 10) {
      return "Review comment must be at least 10 characters long";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        reviewee_id: reviewee.id,
        overall_rating: formData.overall_rating,
        content: formData.content,
      };

      await api.reviews.createReview(submitData);
      setSuccess(true);

      // Show success message briefly then close
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 2000);
    } catch (error: unknown) {
      console.error("Error submitting review:", error);
      const apiError = error as { response?: { data?: { detail?: string } } };
      setError(apiError.response?.data?.detail || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      overall_rating: 0,
      content: "",
    });
    setError(null);
    setSuccess(false);
  };

  const renderStarRating = (
    currentRating: number,
    onRatingChange: (rating: number) => void,
    size: "sm" | "md" = "md",
  ) => {
    const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`${sizeClass} transition-colors hover:scale-110 transform ${
              star <= currentRating
                ? "text-yellow-400 fill-current"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          >
            <Star className={sizeClass} />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h3>
            <p className="text-gray-600">
              Thank you for your feedback. Your review has been published.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                Write a Review for {reviewee.username}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Overall Rating */}
              <div>
                <label
                  htmlFor="overall-rating"
                  className="block text-sm font-semibold text-gray-900 mb-3"
                  id="overall-rating-label"
                >
                  Overall Rating *
                </label>
                <fieldset
                  id="overall-rating"
                  className="flex items-center space-x-3"
                  aria-labelledby="overall-rating-label"
                >
                  {renderStarRating(formData.overall_rating, handleOverallRatingChange)}
                  <span className="text-sm text-gray-600">
                    {formData.overall_rating > 0 ? `${formData.overall_rating}/5` : "Select rating"}
                  </span>
                </fieldset>
              </div>

              {/* Review Content */}
              <div>
                <label
                  htmlFor="review-content"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Your Review *
                </label>
                <textarea
                  id="review-content"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="Share your experience working with this person. What made them stand out?"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.content.length} characters (minimum 10 required)
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || formData.overall_rating === 0}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center ${
                    isSubmitting || formData.overall_rating === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ReviewForm;
