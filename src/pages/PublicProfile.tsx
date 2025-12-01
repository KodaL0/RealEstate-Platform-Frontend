import React, { useCallback, useEffect, useState } from "react";
import "./PublicProfile.css";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Bookmark,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Flag,
  Globe,
  Home,
  Mail,
  MapPin,
  Phone,
  Send,
  Star,
  ThumbsUp,
  User,
  UserPlus,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PropertyCard from "../components/cards/PropertyCard";
import LLMProfileData from "../components/llms/llm-profile";
import ReviewForm from "../components/ReviewForm";
import { SEO } from "../components/SEO";
import api from "../config/api";
import { useChat } from "../context/ChatContext";
import {
  type CanReviewResponse,
  normalizePropertyData,
  type Property,
  type PublicProfileData,
  type Review,
  type ReviewStats,
} from "../types";

const formatDateOnly = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const PublicProfile: React.FC = () => {
  const { username, tab } = useParams<{ username: string; tab?: string }>();
  const navigate = useNavigate();
  const { getOrCreateDmThread } = useChat();

  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [canReview, setCanReview] = useState<CanReviewResponse | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(tab || "overview");
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [overallReviewsCount, setOverallReviewsCount] = useState<number | null>(null);
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);

  // Cache state for faster tab navigation
  const [isDataCached, setIsDataCached] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Cache connection data to avoid repeated API calls
  const [connectionCache, setConnectionCache] = useState<{
    connections: any[];
    pendingSent: any[];
    pendingReceived: any[];
    lastUpdated: number;
  } | null>(null);

  const sidebarTabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "listings", label: "Listings", icon: Home },
    { id: "reviews", label: "Reviews", icon: Star },
    // { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    // { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: "contact", label: "Contact Info", icon: Mail },
  ];

  // Handle tab changes from URL
  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
      // Don't show loading spinner for tab switches with cached data
      if (isDataCached) {
        setIsLoadingProfile(false);
      }
    } else if (!tab && activeTab !== "overview") {
      setActiveTab("overview");
      if (isDataCached) {
        setIsLoadingProfile(false);
      }
    }
  }, [tab, activeTab, isDataCached]);

  // Navigate to overview if no tab is specified
  useEffect(() => {
    if (username && !tab) {
      navigate(`/${username}/overview`, { replace: true });
    }
  }, [username, tab, navigate]);

  // Cache connection data for 30 seconds to avoid repeated API calls
  const getConnectionData = useCallback(async (): Promise<{
    connections: unknown[];
    pendingSent: unknown[];
    pendingReceived: unknown[];
    lastUpdated: number;
  } | null> => {
    const now = Date.now();
    const cacheExpiry = 30000; // 30 seconds

    if (connectionCache && now - connectionCache.lastUpdated < cacheExpiry) {
      return connectionCache;
    }

    try {
      const [connectionsRes, pendingSentRes, pendingReceivedRes] = await Promise.all([
        api.connections.getMyConnections(),
        api.connections.getPendingSentRequests(),
        api.connections.getPendingRequests(),
      ]);

      const newCache = {
        connections: (connectionsRes.data as unknown[]) || [],
        pendingSent: (pendingSentRes.data as unknown[]) || [],
        pendingReceived: (pendingReceivedRes.data as unknown[]) || [],
        lastUpdated: now,
      };

      setConnectionCache(newCache);
      return newCache;
    } catch (error) {
      console.error("Error fetching connection data:", error);
      return connectionCache; // Return old cache if available
    }
  }, [connectionCache]);

  const checkActualConnectionStatus = useCallback(
    async (targetUsername: string): Promise<string> => {
      try {
        // Use cached connection data to avoid repeated API calls
        const connectionData = await getConnectionData();

        if (!connectionData) {
          return "none";
        }

        // Check if user is in our accepted connections
        const isConnected = connectionData.connections.some(
          (conn: any) => conn.user.username === targetUsername,
        );

        if (isConnected) {
          console.log(`Direct connection check for ${targetUsername}: connected`);
          return "connected";
        }

        // Check if we have a pending request TO this user (requests we sent)
        const pendingSentArray = Array.isArray(connectionData.pendingSent)
          ? connectionData.pendingSent
          : [];
        const hasPendingSentToThem = pendingSentArray.some(
          (req: any) => req.to_user_username === targetUsername,
        );

        if (hasPendingSentToThem) {
          console.log(`Direct connection check for ${targetUsername}: pending_sent`);
          return "pending_sent";
        }

        // Check if we have a pending request FROM this user (requests sent to us)
        const pendingReceivedArray = Array.isArray(connectionData.pendingReceived)
          ? connectionData.pendingReceived
          : [];
        const hasPendingFromThem = pendingReceivedArray.some(
          (req: any) => req.from_user_username === targetUsername,
        );

        if (hasPendingFromThem) {
          console.log(`Direct connection check for ${targetUsername}: pending_received`);
          return "pending_received";
        }

        console.log(`Direct connection check for ${targetUsername}: none`);
        return "none";
      } catch (error) {
        console.error("Error checking connection status:", error);
        return "none";
      }
    },
    [getConnectionData],
  );

  const fetchReviews = useCallback(
    async (userId: number, useCache: boolean = false) => {
      // Skip loading if we already have cached reviews and we're using cache
      if (useCache && hasLoadedReviews && reviews.length > 0) {
        return;
      }

      setIsLoadingReviews(true);
      try {
        const [reviewsResponse, statsResponse] = await Promise.all([
          api.reviews.getUserReviews(userId),
          api.reviews.getUserStats(userId),
        ]);

        const reviewsData = reviewsResponse.data as Review[];
        const statsData = statsResponse.data as ReviewStats;
        setReviews(reviewsData);
        setReviewStats(statsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoadingReviews(false);
        setHasLoadedReviews(true);
      }
    },
    [hasLoadedReviews, reviews.length],
  );

  const checkCanReview = useCallback(async (userId: number) => {
    try {
      const response = await api.reviews.canReviewUser(userId);
      const canReviewData = response.data as CanReviewResponse;
      setCanReview(canReviewData);
    } catch (error) {
      console.error("Error checking review eligibility:", error);
    }
  }, []);

  useEffect(() => {
    if (!username) {
      navigate("/404");
      return;
    }

    const fetchProfile = async () => {
      console.log("PublicProfile: Starting to fetch profile data for username:", username);
      setIsLoadingProfile(true);
      setError(null);
      try {
        // Fetch profile data
        console.log("PublicProfile: Calling api.auth.getPublicProfile with username:", username);
        const response = await api.auth.getPublicProfile(username);
        console.log("PublicProfile: API response received:", response);
        const data = response.data as {
          status?: number;
          profile?: PublicProfileData;
        };
        console.log("PublicProfile: Response data:", data);

        if (data.status === 200 && data.profile) {
          console.log("PublicProfile: Profile data received:", data.profile);
          console.log(
            "PublicProfile: Initial connection status from API:",
            data.profile.connection_status,
          );
          console.log("PublicProfile: Profile fields check:", {
            name: data.profile.name,
            bio: data.profile.bio,
            location: data.profile.location,
            office: data.profile.office,
            avatar: data.profile.avatar,
            website: data.profile.website,
          });

          // Set initial profile data
          let profileData = data.profile;

          // Also check connections directly to get accurate connection status
          const actualStatus = await checkActualConnectionStatus(profileData.username);
          if (actualStatus !== "none") {
            // Override the connection status with the correct one
            profileData = {
              ...profileData,
              connection_status: actualStatus as
                | "none"
                | "connected"
                | "pending_sent"
                | "pending_received"
                | "rejected"
                | "self",
            };
            console.log(`Corrected connection status to ${actualStatus} on initial load`);
          }

          setProfileData(profileData);
          // Normalize properties
          const normalizedProps = profileData.published_properties.map((prop: unknown) =>
            normalizePropertyData(prop as Partial<Property> & Record<string, unknown>),
          );
          setProperties(normalizedProps);

          // Fetch lightweight overall rating
          try {
            const ratingResp = await api.reviews.getUserOverallRating(profileData.id);
            const ratingData = ratingResp.data as {
              average_rating?: number;
              reviews_received_count?: number;
            };
            setOverallRating(ratingData.average_rating ?? null);
            setOverallReviewsCount(ratingData.reviews_received_count ?? null);
          } catch (ratingErr) {
            console.error("Error fetching overall rating:", ratingErr);
          }

          // Preload all data for faster tab navigation
          console.log("Preloading all profile data for faster navigation...");

          // Preload reviews data in background
          fetchReviews(profileData.id, false);

          // Check if current user can review this profile (needed on reviews tab)
          checkCanReview(profileData.id);

          // Mark data as cached after initial load
          setIsDataCached(true);
          setIsInitialLoad(false);
        } else {
          console.log("PublicProfile: Invalid response structure - no profile data found");
          console.log("PublicProfile: Full response structure:", data);
          setError("Profile not found");
        }
      } catch (err: unknown) {
        console.error("PublicProfile: Error fetching profile:", err);
        const apiError = err as {
          response?: { status?: number; data?: unknown };
          message?: string;
          config?: unknown;
        };
        console.error("PublicProfile: Error details:", {
          message: apiError.message,
          response: apiError.response?.data,
          status: apiError.response?.status,
          config: apiError.config,
        });
        if (apiError.response?.status === 404) {
          setError("Profile not found");
        } else {
          setError("Failed to load profile. Please try again.");
        }
      } finally {
        console.log("PublicProfile: Profile loading completed");
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [
    username,
    navigate,
    checkActualConnectionStatus, // Check if current user can review this profile (needed on reviews tab)
    checkCanReview, // Preload reviews data in background
    fetchReviews,
  ]);

  useEffect(() => {
    if (profileData) {
      document.title = `${profileData.username} - Profile | PROPERTPRO`;
    }
    return () => {
      document.title = "PROPERTPRO Media";
    };
  }, [profileData]);

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const refreshConnectionStatus = async () => {
    if (!profileData) return;

    try {
      console.log("Refreshing connection status...");

      // Invalidate connection cache to get fresh data
      setConnectionCache(null);

      // First get the latest status from the API
      const response = await api.auth.getPublicProfile(username!);
      const data = response.data as {
        status?: number;
        profile?: PublicProfileData;
      };

      if (data.status === 200 && data.profile) {
        console.log("New connection status after refresh:", data.profile.connection_status);

        let finalStatus = data.profile.connection_status;

        // Only override with direct checks if the API says 'none' but we have a different actual status
        if (finalStatus === "none") {
          const actualStatus = await checkActualConnectionStatus(profileData.username);
          if (actualStatus !== "none") {
            finalStatus = actualStatus as
              | "none"
              | "connected"
              | "pending_sent"
              | "pending_received"
              | "rejected"
              | "self";
            console.log(`Corrected none status to ${actualStatus} via direct API checks`);
          }
        }

        // Update profile with the correct status
        setProfileData({ ...data.profile, connection_status: finalStatus });
        console.log("Final connection status set to:", finalStatus);
      }
    } catch (error) {
      console.error("Error refreshing connection status:", error);
    }
  };

  const handleConnectionAction = async () => {
    if (!profileData || isConnecting) return;

    // Prevent action if already connected or request already sent
    if (
      profileData.connection_status === "connected" ||
      profileData.connection_status === "pending_sent"
    ) {
      console.log("Action blocked - already connected or pending");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const status = profileData.connection_status;
      console.log("Current connection status before action:", status);

      if (status === "none" || status === "rejected") {
        // Send connection request
        console.log("Sending connection request...");
        const response = await api.connections.sendRequest(profileData.id);
        console.log("Connection request response:", response);
        console.log("Response data:", response.data);

        // Immediately update UI to show pending status (optimistic update)
        setProfileData((prev) => (prev ? { ...prev, connection_status: "pending_sent" } : null));
        console.log("Optimistically updated to pending_sent");

        // Invalidate connection cache since we made a change
        setConnectionCache(null);

        // Don't refresh immediately - let the optimistic update persist
        // The user will see "Request Sent" which is accurate
        console.log("Keeping optimistic pending_sent status - not refreshing immediately");
      } else if (status === "pending_received") {
        // Accept pending request
        console.log("Auto-accepting pending connection...");
        const response = await api.connections.sendRequest(profileData.id);
        console.log("Auto-accept response:", response);

        // Optimistically update to connected
        setProfileData((prev) => (prev ? { ...prev, connection_status: "connected" } : null));
        console.log("Optimistically updated to connected");

        // Invalidate connection cache since we made a change
        setConnectionCache(null);

        // Add a delay and then refresh to confirm
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await refreshConnectionStatus();
      }
    } catch (error) {
      console.error("Error handling connection:", error);
      setError("Failed to update connection. Please try again.");
      // Revert optimistic update on error
      await refreshConnectionStatus();
    } finally {
      setIsConnecting(false);
    }
  };

  const getConnectionButtonText = () => {
    if (!profileData) return "Connect";

    switch (profileData.connection_status) {
      case "connected":
        return "Connected";
      case "pending_sent":
        return "Request Sent";
      case "pending_received":
        return "Accept Request";
      case "rejected":
        return "Connect";
      case "none":
        return "Connect";
      default:
        return "Connect";
    }
  };

  const getConnectionButtonIcon = () => {
    if (!profileData) return UserPlus;

    switch (profileData.connection_status) {
      case "connected":
        return CheckCircle;
      case "pending_sent":
        return Clock;
      case "pending_received":
        return CheckCircle;
      default:
        return UserPlus;
    }
  };

  const handleToggleHelpful = async (reviewId: number, isHelpful: boolean) => {
    try {
      await api.reviews.toggleHelpful(reviewId, isHelpful);
      // Refresh reviews to show updated helpful count
      if (profileData) {
        fetchReviews(profileData.id);
      }
    } catch (error) {
      console.error("Error toggling helpful vote:", error);
    }
  };

  const handleReportReview = async (reviewId: number) => {
    const reason = prompt(
      "Please select a reason for reporting this review:\n1. Spam\n2. Fake Review\n3. Inappropriate Content\n4. Harassment\n5. Other",
    );
    if (!reason) return;

    try {
      await api.reviews.reportReview(reviewId, reason.toLowerCase());
      alert("Review reported successfully");
    } catch (error) {
      console.error("Error reporting review:", error);
      alert("Failed to report review");
    }
  };

  const handleReviewSuccess = () => {
    // Refresh reviews and check can review status
    if (profileData) {
      fetchReviews(profileData.id, false); // Force refresh, don't use cache
      checkCanReview(profileData.id);
    }
  };

  const renderStarRating = (rating: number, size: "sm" | "md" = "sm") => {
    const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const handleTabClick = (tabId: string) => {
    if (username) {
      // If we have cached data, navigation should be instant
      if (isDataCached) {
        console.log("Using cached data for instant tab navigation");
      }
      navigate(`/${username}/${tabId}`);
    }
  };

  const renderTabContent = () => {
  switch (activeTab) {
    case "overview":
      return (
        <div className="space-y-6">
          {/* LLM structured data for AI agents and search engines */}
          {profileData && (
            <LLMProfileData
              user={profileData}
              propertiesCount={profileData.properties_count}
            />
          )}

          {/* Bio Section */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              About {profileData?.name || profileData?.username}
            </h3>

            {profileData?.bio ? (
              <p className="text-gray-700 leading-relaxed mb-4">
                {profileData.bio}
              </p>
            ) : (
              <p className="text-gray-500 italic">No bio available</p>
            )}

            {/* COMMENTED OUT SECTION — SAFE */}
            {/*
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              ...
            </div>
            */}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {profileData?.properties_count || 0}
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">Active Listings</div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md text-center">
              <div className="text-xl sm:text-2xl font-bold text-pink-600">
                {profileData?.connections_count || 0}
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">Connections</div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md text-center col-span-2 sm:col-span-1">
              <div className="text-xl sm:text-2xl font-bold text-indigo-600">
                {profileData?.mutual_connections_count || 0}
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">Mutual Connections</div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {overallRating !== null ? overallRating.toFixed(1) : "N/A"}
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">Avg Rating</div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {overallReviewsCount ?? "N/A"}
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">Total Reviews</div>
            </div>
          </div>
        </div>
      );

    case "listings":
      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Home className="h-5 w-5 mr-2 text-blue-600" />
                Published Listings ({profileData?.properties_count || 0})
              </h3>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-16">
                <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  No Published Listings
                </h4>
                <p className="text-gray-600">This user has no published listings yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {properties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                  >
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case "reviews":
      return (
        <div className="space-y-6">
          {/* Review Summary */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-600" />
              Reviews & Ratings
            </h3>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {reviewStats?.average_rating?.toFixed(1) || "0.0"}
                </div>

                <div className="flex justify-center mb-2">
                  {renderStarRating(reviewStats?.average_rating || 0, "md")}
                </div>

                <p className="text-gray-600 text-sm sm:text-base">Overall Rating</p>
              </div>

              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {reviewStats?.reviews_received_count || 0}
                </div>

                <p className="text-gray-600 text-sm sm:text-base">Total Reviews</p>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviewStats?.rating_distribution[rating.toString()] || 0;
                const total = reviewStats?.reviews_received_count || 1;
                const pct = (count / total) * 100;

                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-8">{rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-10">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {isLoadingReviews ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16">
                <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  No Reviews Yet
                </h4>
                <p className="text-gray-600">
                  This user hasn't received any reviews yet.
                  {canReview?.can_review && " Be the first to write one!"}
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
                  {/* Review block */}
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm sm:text-base">
                        {review.reviewer.username.substring(0, 2).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {review.reviewer.username}
                          </h4>

                          {review.is_verified && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="text-xs">Verified</span>
                            </div>
                          )}
                        </div>

                        <span className="text-gray-500 text-xs sm:text-sm">
                          {formatDateOnly(review.created_at)}
                        </span>
                      </div>

                      {review.title && (
                        <h5 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">
                          {review.title}
                        </h5>
                      )}

                      <div className="flex items-center mb-3">
                        {renderStarRating(review.overall_rating)}
                        <span className="ml-2 text-xs sm:text-sm text-gray-600">
                          ({review.overall_rating}/5)
                        </span>
                      </div>

                      <p className="text-gray-700 mb-3 text-sm sm:text-base">
                        {review.content}
                      </p>

                      {review.interaction_context && (
                        <p className="text-xs sm:text-sm text-gray-500 mb-3 italic">
                          Context: {review.interaction_context}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <button
                          onClick={() => handleToggleHelpful(review.id, true)}
                          className="flex items-center hover:text-blue-600 p-1"
                        >
                          <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Helpful ({review.helpful_count})
                        </button>

                        <button
                          onClick={() => handleReportReview(review.id)}
                          className="flex items-center hover:text-red-600 p-1"
                        >
                          <Flag className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Report
                        </button>
                      </div>

                      {review.response && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center mb-2">
                            <h6 className="font-medium text-gray-900">
                              Response from {profileData?.username}
                            </h6>
                            <span className="ml-auto text-xs text-gray-500">
                              {formatDateOnly(review.response.created_at)}
                            </span>
                          </div>

                          <p className="text-gray-700">{review.response.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );

    case "contact":
      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              Contact Information
            </h3>

            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                {profileData?.website && (
                  <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Website</p>
                      <a
                        href={
                          profileData.website.startsWith("http")
                            ? profileData.website
                            : `https://${profileData.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm sm:text-base break-all"
                      >
                        {profileData.website}
                      </a>
                    </div>
                    <button type="button" className="ml-auto p-2 hover:bg-gray-200 rounded-lg">
                      <Copy className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}

                {profileData?.office && (
                  <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Office</p>
                      <p className="text-gray-600 text-sm sm:text-base">
                        {profileData.office}
                      </p>
                    </div>
                    <button type="button" className="ml-auto p-2 hover:bg-gray-200 rounded-lg">
                      <Copy className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}

                {profileData?.phone && (
                  <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Phone</p>
                      <p className="text-gray-600 text-sm sm:text-base">
                        {profileData.phone}
                      </p>
                    </div>
                    <button type="button" className="ml-auto p-2 hover:bg-gray-200 rounded-lg">
                      <Copy className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}

                <div className="text-center py-4 text-gray-500">
                  <p className="text-xs sm:text-sm">
                    For direct contact, use the "Message" button above or connect with this user.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};


  // Lazy-load reviews when the Reviews tab is opened
  useEffect(() => {
    if (activeTab === "reviews" && profileData) {
      // Use cache if available, otherwise fetch fresh data
      const useCache = isDataCached && hasLoadedReviews;
      fetchReviews(profileData.id, useCache);
    }
  }, [activeTab, profileData, isDataCached, hasLoadedReviews, fetchReviews]);

  // Show loading only on initial load, not on tab switches with cached data
  if (isLoadingProfile && isInitialLoad) {
    return (
      <div className="pt-20 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error === "Profile not found" ? "Profile Not Found" : "Error Loading Profile"}
            </h1>
            <p className="text-gray-600 mb-6">
              {error === "Profile not found"
                ? "The user profile you're looking for doesn't exist."
                : error}
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  // Generate SEO data
  const profileTitle = profileData.name || `@${profileData.username}`;
  const profileDescription = profileData.bio
    ? profileData.bio
    : `${profileTitle} is a real estate professional on PropertPro with ${profileData.properties_count} ${profileData.properties_count === 1 ? "listing" : "listings"} and ${profileData.connections_count} connections. ${overallRating ? `Rated ${overallRating.toFixed(1)}/5 from ${overallReviewsCount} reviews.` : ""}`;

  const profileUrl = `/${profileData.username}`;
  const profileImage = profileData.avatar || undefined;

  // Build social links array if website exists
  const socialLinks = profileData.website ? [profileData.website] : undefined;

  return (
  <div className="pt-20 bg-gray-50 min-h-screen">
    {/* SEO */}
    <SEO
      title={profileTitle}
      description={profileDescription}
      url={profileUrl}
      image={profileImage}
      imageAlt={`${profileTitle} profile picture`}
      type="profile"
      profileType="Person"
      location={profileData.location}
      author={profileData.name || profileData.username}
      modifiedTime={profileData.date_joined}
      personData={{
        name: profileData.name || profileData.username,
        jobTitle: "Real Estate Professional",
        telephone: profileData.phone,
        url: profileData.website,
        address: profileData.location,
        image: profileData.avatar,
        sameAs: socialLinks,
        memberSince: profileData.date_joined,
      }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Profiles", url: "/profiles" },
        { name: profileData.username, url: profileUrl },
      ]}
    />

    {/* Profile Header */}
    <section className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-600 to-indigo-600 -mx-4"></div>

        <div className="-mt-16 sm:-mt-20 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">

            {/* Avatar */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-full flex items-center justify-center shadow-xl ring-4 ring-white">
              {profileData?.avatar ? (
                <img
                  src={profileData.avatar}
                  alt={profileData.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-14 w-14 sm:h-18 sm:w-18 text-blue-600" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {profileData?.name || profileData?.username}
                  </h1>

                  <p className="text-gray-600 text-base sm:text-lg">@{profileData?.username}</p>

                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profileData?.location || "Location not specified"}</span>

                    <span className="mx-2">•</span>

                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Joined {formatJoinDate(profileData?.date_joined)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 sm:mt-0">
                  {/* MESSAGE */}
                  <button
                    onClick={async () => {
                      const threadId = await getOrCreateDmThread(profileData!.id);
                      navigate(`/chat/${threadId}`);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Message
                  </button>

                  {/* CONNECT */}
                  <button
                    onClick={handleConnectionAction}
                    disabled={isConnecting}
                    className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center text-sm"
                  >
                    {React.createElement(getConnectionButtonIcon(), { className: "h-4 w-4 mr-2" })}
                    {getConnectionButtonText()}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-gray-900">{profileData?.properties_count}</span>
                  <span className="text-gray-600">Listings</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-gray-900">{profileData?.connections_count}</span>
                  <span className="text-gray-600">Connections</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-bold text-gray-900">{overallRating ?? "N/A"}</span>
                  <span className="text-gray-600">({overallReviewsCount ?? 0})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profileData?.bio && (
            <div className="mt-4 max-w-2xl">
              <p className="text-gray-900 leading-relaxed">{profileData.bio}</p>
            </div>
          )}
        </div>
      </div>
    </section>

    {/* Horizontal Tabs */}
    <div className="border-t bg-white">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-1 -mb-px overflow-x-auto" role="tablist">
          {[
            { id: "overview", label: "Overview", icon: User },
            { id: "listings", label: "Listings", icon: Home },
            { id: "reviews", label: "Reviews", icon: Star },
            { id: "contact", label: "Contact", icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>

    {/* Main Content */}
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>

    {/* Review Form Modal */}
    {profileData && (
      <ReviewForm
        reviewee={{
          id: profileData.id,
          username: profileData.username,
          email: "",
        }}
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        onSuccess={handleReviewSuccess}
      />
    )}

  </div> 
);  
}

export default PublicProfile;
