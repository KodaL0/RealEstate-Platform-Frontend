import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Star,
  Send,
  UserPlus,
  CheckCircle,
  Clock,
  Globe,
  Phone,
  Building2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PropertyCard from "../components/cards/PropertyCard";
import { SEO } from "../components/SEO";
import api from "../config/api";
import { useChat } from "../context/ChatContext";
import {
  normalizePropertyData,
  type Property,
  type PublicProfileData
} from "../types";
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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const totalPages = Math.ceil(properties.length / pageSize);
  const paginatedProperties = properties.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // -----------------------------
  // Fetch Profile + ALL Properties
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
          setProfileData(profile);

          // Fetch ALL properties this agent owns
          try {
            const propsRes = await api.properties.getUserProps(profile.username);

            const raw =
              (propsRes.data as any)?.results ??
              propsRes.data ??
              [];

            const normalized = raw.map((p: any) => normalizePropertyData(p));
            setProperties(normalized);
          } catch (err) {
            console.error("Failed to load full property list:", err);
          }

          // Fetch rating summary
          try {
            const ratingRes = await api.reviews.getUserOverallRating(profile.id);
            const ratingData = ratingRes.data as any;
            setOverallRating(ratingData.average_rating ?? null);
            setOverallReviewsCount(ratingData.reviews_received_count ?? null);
          } catch {}
        } else {
          setError("Profile not found");
        }
      } catch {
        setError("Failed to load profile.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [username, navigate]);

  // -----------------------------
  // Connection Button
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
    } finally {
      setIsConnecting(false);
    }
  };

  const getConnectionButtonText = () => {
    switch (profileData?.connection_status) {
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
    switch (profileData?.connection_status) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------
  // SEO
  // -----------------------------
  const profileTitle = profileData.name || `@${profileData.username}`;
  const profileDescription =
    profileData.bio ||
    `${profileTitle} is a real estate professional on PropertPro with ${profileData.properties_count} listings.`;

  return (
    <div className="pt-16 bg-gray-50 min-h-screen">

      <SEO
        title={profileTitle}
        description={profileDescription}
        url={`/${profileData.username}`}
        image={profileData.avatar}
        type="profile"
      />

      {/* HEADER */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row md:items-center md:justify-between">

          {/* LEFT */}
          <div className="flex items-center space-x-5">
            {/* Avatar with fallback initials */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg overflow-hidden"
              style={{
                background: profileData.avatar
                  ? `url(${profileData.avatar}) center/cover no-repeat`
                  : "linear-gradient(135deg, #4f8ef7, #6a5af9)"
              }}
            >
              {!profileData.avatar &&
                (profileData.name || profileData.username)
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
            </div>

            <div>
              <h1 className="text-2xl font-bold">{profileTitle}</h1>
              <p className="opacity-80">@{profileData.username}</p>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm opacity-90">
                <span>{properties.length} Listings</span>
                <span>{overallRating ?? "N/A"} ★</span>
                <span>{overallReviewsCount ?? 0} Reviews</span>
                <span>{profileData.connections_count} Connections</span>
              </div>
            </div>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex space-x-3 mt-6 md:mt-0">
            <button
              onClick={async () => {
                const thread = await getOrCreateDmThread(profileData.id);
                navigate(`/chat/${thread}`);
              }}
              className="px-4 py-2 bg-white text-blue-700 font-medium rounded-lg flex items-center shadow-md"
            >
              <Send className="h-4 w-4 mr-2" />
              Message
            </button>

            <button
              onClick={handleConnectionAction}
              disabled={isConnecting || profileData.connection_status === "pending_sent"}
              className={`
                px-4 py-2 rounded-lg flex items-center text-white shadow-md
                ${
                  profileData.connection_status === "connected"
                    ? "bg-green-500"
                    : profileData.connection_status === "pending_sent"
                    ? "bg-gray-400"
                    : "bg-blue-500"
                }
              `}
            >
              {React.createElement(getConnectionButtonIcon(), {
                className: "h-4 w-4 mr-2"
              })}
              {getConnectionButtonText()}
            </button>

            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg flex items-center shadow-md"
            >
              <Star className="h-4 w-4 mr-2" />
              Write Review
            </button>
          </div>
        </div>
      </div>

      {/* ABOUT */}
      <div className="container mx-auto px-4 mt-8">
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="font-semibold text-lg mb-2">About</h2>
          <p className="text-gray-700">{profileData.bio || "This user has not added a bio."}</p>
        </div>
      </div>

      {/* CONTACT INFO */}
      <div className="container mx-auto px-4 mt-4">
        <div className="bg-white p-5 rounded-xl shadow-sm space-y-3">
          <h2 className="font-semibold text-lg mb-2">Contact Information</h2>

          {profileData.website && (
            <div className="flex items-center gap-3 text-gray-700">
              <Globe className="h-5 w-5 text-blue-600" />
              <a
                href={
                  profileData.website.startsWith("http")
                    ? profileData.website
                    : `https://${profileData.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {profileData.website}
              </a>
            </div>
          )}

          {profileData.phone && (
            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="h-5 w-5 text-green-600" />
              {profileData.phone}
            </div>
          )}

          {profileData.office && (
            <div className="flex items-center gap-3 text-gray-700">
              <Building2 className="h-5 w-5 text-purple-600" />
              {profileData.office}
            </div>
          )}

          {!profileData.website && !profileData.phone && !profileData.office && (
            <p className="text-gray-500 italic">No contact details provided.</p>
          )}
        </div>
      </div>

      {/* LISTINGS */}
      <div className="container mx-auto px-4 mt-6 pb-16">
        <h2 className="text-lg font-semibold mb-4">Listings</h2>

        {properties.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No listings yet.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-40"
                >
                  Prev
                </button>

                <span className="px-4 py-2 bg-white rounded-lg shadow">
                  Page {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* REVIEW MODAL */}
      {profileData && (
        <ReviewForm
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          reviewee={{
            id: profileData.id,
            username: profileData.username,
            email: ""
          }}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default PublicProfile;
