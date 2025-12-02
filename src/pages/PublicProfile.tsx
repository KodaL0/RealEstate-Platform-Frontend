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
  Building2,
  Award,
  TrendingUp,
  MessageCircle,
  Sliders,
} from "lucide-react";
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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const totalPages = Math.ceil(properties.length / pageSize);
  const paginatedProperties = properties.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

          try {
            const propsRes = await api.properties.getUserProps(profile.username);
            const propsData = propsRes.data as any;

            const raw =
              propsData?.results ??
              propsData ??
              [];

            const normalized = raw.map((p: any) => normalizePropertyData(p));
            setProperties(normalized);
          } catch (err) {
            console.error("Failed to load full property list:", err);
          }

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

  const handleConnectionAction = async () => {
    if (!profileData || isConnecting) return;

    const status = profileData.connection_status;

    if (status === "connected" || status === "pending_sent") return;

    setIsConnecting(true);

    try {
      await api.connections.sendRequest(profileData.id);

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
        return "Pending";
      case "pending_received":
        return "Accept";
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

  if (isLoadingProfile) {
    return (
      <div className="pt-16 bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="pt-16 bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {error || "Profile Not Found"}
            </h1>
            <p className="text-gray-600 mb-6">
              This profile may have been removed or doesn't exist.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const profileTitle = profileData.name || `@${profileData.username}`;
  const profileDescription =
    profileData.bio ||
    `${profileTitle} is a real estate professional on PropertPro with ${properties.length} listings.`;

  return (
    <div className="pt-16 bg-white">
      <SEO
        title={profileTitle}
        description={profileDescription}
        url={`/${profileData.username}`}
        image={profileData.avatar}
        type="profile"
      />

      {/* ======================= */}
      {/* BEAUTIFUL NEW HEADER */}
      {/* ======================= */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white pb-14 pt-20">
        <div className="container mx-auto px-6 flex flex-col items-center text-center">

          {/* Avatar */}
          <div
            className="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white bg-gradient-to-br from-blue-500 to-cyan-500 overflow-hidden"
            style={{
              background: profileData.avatar
                ? `url(${profileData.avatar}) center/cover no-repeat`
                : undefined,
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

          {/* Name */}
          <h1 className="mt-4 text-3xl font-bold">{profileTitle}</h1>
          <p className="opacity-80">@{profileData.username}</p>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{properties.length}</span>
              <span className="opacity-80">Listings</span>
            </div>

            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="font-semibold">
                {overallRating?.toFixed(1) ?? "N/A"}
              </span>
              <span className="opacity-80">({overallReviewsCount ?? 0})</span>
            </div>

            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="font-semibold">
                {profileData.connections_count}
              </span>
              <span className="opacity-80">Connections</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={async () => {
                const thread = await getOrCreateDmThread(profileData.id);
                navigate(`/chat/${thread}`);
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-md"
            >
              <Send className="h-4 w-4" />
              Message
            </button>

            <button
              onClick={handleConnectionAction}
              disabled={isConnecting || profileData.connection_status === "pending_sent"}
              className={`
                px-6 py-3 rounded-lg flex items-center gap-2 shadow-md
                ${
                  profileData.connection_status === "connected"
                    ? "bg-green-500 text-white"
                    : profileData.connection_status === "pending_sent"
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }
              `}
            >
              {React.createElement(getConnectionButtonIcon(), {
                className: "h-4 w-4",
              })}
              {getConnectionButtonText()}
            </button>

            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-lg flex items-center gap-2 shadow-md"
            >
              <Star className="h-4 w-4 text-slate-900" />
              Review
            </button>
          </div>
        </div>
      </div>

      {/* ======================= */}
      {/* PROFILE INFO CONTAINER */}
      {/* ======================= */}
      <div className="container mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* ABOUT */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
          <p className="text-gray-700 leading-relaxed mb-8">
            {profileData.bio || "This user has not added a bio yet."}
          </p>

          {/* CONTACT + PERFORMANCE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                Contact Information
              </h3>

              <div className="space-y-4">
                {profileData.website && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mt-1">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Website</p>
                      <a
                        href={
                          profileData.website.startsWith("http")
                            ? profileData.website
                            : `https://${profileData.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {profileData.website}
                      </a>
                    </div>
                  </div>
                )}

                {profileData.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mt-1">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">
                        {profileData.phone}
                      </p>
                    </div>
                  </div>
                )}

                {profileData.office && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mt-1">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Office</p>
                      <p className="font-medium text-gray-900">
                        {profileData.office}
                      </p>
                    </div>
                  </div>
                )}

                {!profileData.website &&
                  !profileData.phone &&
                  !profileData.office && (
                    <p className="text-gray-500 italic">
                      No contact details provided.
                    </p>
                  )}
              </div>
            </div>

            {/* Performance */}
            {overallRating !== null && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                  Performance
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium text-gray-600">Rating</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900">
                      {overallRating.toFixed(1)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-600">
                        Reviews
                      </span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900">
                      {overallReviewsCount ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================= */}
      {/* LISTINGS SECTION */}
      {/* ======================= */}
      <div className="bg-white px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Listings</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
              <Sliders className="h-4 w-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Filter</span>
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-16 text-center">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Listings Yet
              </h3>
              <p className="text-gray-600">
                This agent hasn't posted any properties yet.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {paginatedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`
                            w-10 h-10 rounded-lg font-medium transition-all duration-200 shadow-sm
                            ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }
                          `}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* -------------------------- */}
      {/* REVIEW MODAL */}
      {/* -------------------------- */}
      {profileData && (
        <ReviewForm
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          reviewee={{
            id: profileData.id,
            username: profileData.username,
            email: "",
          }}
          onSuccess={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
};

export default PublicProfile;
