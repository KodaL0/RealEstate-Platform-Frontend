import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, MapPin, Star, Send, UserPlus, CheckCircle, Clock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PropertyCard from "../components/cards/PropertyCard";
import { SEO } from "../components/SEO";
import api from "../config/api";
import { useChat } from "../context/ChatContext";
import { normalizePropertyData, type Property, type PublicProfileData } from "../types";
import ReviewForm from "../components/ReviewForm";

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { getOrCreateDmThread } = useChat();

  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [overallReviewsCount, setOverallReviewsCount] = useState<number | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Modal state
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Connection button loading state
  const [isConnecting, setIsConnecting] = useState(false);

  // -----------------------------
  // Fetch Profile
  // -----------------------------
  useEffect(() => {
    if (!username) {
      navigate("/404");
      return;
    }

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      setError(null);

      try {
        const response = await api.auth.getPublicProfile(username);
        const data = response.data as any;

        if (data.status === 200 && data.profile) {
          const profile = data.profile as PublicProfileData;

          // Normalize properties
          const normalizedProps = profile.published_properties.map((prop: any) =>
            normalizePropertyData(prop)
          );
          setProperties(normalizedProps);

          setProfileData(profile);

          // Fetch lightweight rating
          try {
            const ratingRes = await api.reviews.getUserOverallRating(profile.id);
            const ratingData = ratingRes.data as any;
            setOverallRating(ratingData.average_rating ?? null);
            setOverallReviewsCount(ratingData.reviews_received_count ?? null);
          } catch (err) {
            console.error("Rating fetch error:", err);
          }
        } else {
          setError("Profile not found");
        }
      } catch (err) {
        if ((err as any).response?.status === 404) {
          setError("Profile not found");
        } else {
          setError("Failed to load profile.");
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [username, navigate]);

  // -----------------------------
  // Connection Button Action
  // -----------------------------
  const handleConnectionAction = async () => {
    if (!profileData || isConnecting) return;

    const status = profileData.connection_status;

    if (status === "connected" || status === "pending_sent") return;

    setIsConnecting(true);

    try {
      await api.connections.sendRequest(profileData.id);

      // Optimistic UI update
      if (status === "none" || status === "rejected") {
        setProfileData({ ...profileData, connection_status: "pending_sent" });
      } else if (status === "pending_received") {
        setProfileData({ ...profileData, connection_status: "connected" });
      }
    } catch (err) {
      console.error("Connection action error:", err);
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

  // -----------------------------
  // Loading / Error UI
  // -----------------------------
  if (isLoadingProfile) {
    return (
      <div className="pt-20 bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="pt-20 bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------
  // SEO metadata
  // -----------------------------
  const profileTitle = profileData.name || `@${profileData.username}`;
  const profileDescription =
    profileData.bio ||
    `${profileTitle} is a real estate professional on PropertPro with ${profileData.properties_count} listings.`;
  const profileImage = profileData.avatar || undefined;
  const profileUrl = `/${profileData.username}`;

  // -----------------------------
  // MAIN UI LAYOUT
  // -----------------------------
  return (
    <div className="pt-20 bg-gray-50 min-h-screen">

      <SEO
        title={profileTitle}
        description={profileDescription}
        url={profileUrl}
        image={profileImage}
        imageAlt={`${profileTitle} profile picture`}
        type="profile"
        profileType="Person"
      />

      {/* Header Section */}
      <div className="w-full bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">

          {/* Left: Avatar + Info */}
          <div className="flex items-center space-x-4">
            <img
              src={profileData.avatar || "/default-avatar.png"}
              alt={profileData.username}
              className="w-20 h-20 rounded-full object-cover border"
            />

            <div>
              <h1 className="text-xl font-bold">{profileTitle}</h1>
              <p className="text-gray-500">@{profileData.username}</p>

              <div className="flex space-x-4 mt-2 text-sm text-gray-700">
                <span>{profileData.properties_count} Listings</span>
                <span>{overallRating ?? "N/A"} ★</span>
                <span>{overallReviewsCount ?? 0} Reviews</span>
                <span>{profileData.connections_count} Connections</span>
              </div>
            </div>
          </div>

          {/* Right: ACTION BUTTONS */}
          <div className="flex space-x-3 mt-4 md:mt-0">

            {/* MESSAGE */}
            <button
              onClick={async () => {
                const thread = await getOrCreateDmThread(profileData.id);
                navigate(`/chat/${thread}`);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Message
            </button>

            {/* CONNECT */}
            <button
              onClick={handleConnectionAction}
              disabled={isConnecting || profileData.connection_status === "pending_sent"}
              className={`
                px-4 py-2 rounded-lg flex items-center text-white
                ${
                  profileData.connection_status === "connected"
                    ? "bg-green-600"
                    : profileData.connection_status === "pending_sent"
                    ? "bg-gray-400"
                    : "bg-blue-500"
                }
              `}
            >
              {React.createElement(getConnectionButtonIcon(), { className: "h-4 w-4 mr-2" })}
              {getConnectionButtonText()}
            </button>

            {/* WRITE REVIEW */}
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg flex items-center"
            >
              <Star className="h-4 w-4 mr-2" />
              Write Review
            </button>
          </div>
        </div>
      </div>

      {/* BIO */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-gray-700">
            {profileData.bio || "This user has not added a bio."}
          </p>
        </div>
      </div>

      {/* FILTERS ROW */}
      <div className="container mx-auto px-4 mt-4">
        <div className="bg-white p-3 rounded-xl shadow-sm flex items-center space-x-3">
          <button className="px-3 py-2 bg-gray-100 rounded-lg">Grid</button>
          <button className="px-3 py-2 bg-gray-100 rounded-lg">List</button>
          <button className="px-3 py-2 bg-gray-100 rounded-lg">Filters</button>
          <button className="px-3 py-2 bg-gray-100 rounded-lg">Sort</button>
        </div>
      </div>

      {/* LISTINGS */}
      <div className="container mx-auto px-4 mt-6 pb-12">
        <h2 className="text-lg font-semibold mb-4">Listings</h2>

        {properties.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No listings yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {profileData && (
        <ReviewForm
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          reviewee={{
            id: profileData.id,
            username: profileData.username,
            email: "",
          }}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default PublicProfile;
