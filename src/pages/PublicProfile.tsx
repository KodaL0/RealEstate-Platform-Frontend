// FULL UPDATED PUBLICPROFILE — UNIFIED INFO CONTAINER

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
  Sliders
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
  const [overallReviewsCount, setOverallReviewsCount] =
    useState<number | null>(null);

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

  // -----------------------------
  // Fetch profile + full listings
  // -----------------------------
  useEffect(() => {
    if (!username) {
      navigate("/404");
      return;
    }

    const fetchData = async () => {
      setIsLoadingProfile(true);

      try {
        const res = await api.auth.getPublicProfile(username);
        const data = res.data as any;

        if (!(data.status === 200 && data.profile)) {
          setError("Profile not found");
          return;
        }

        const profile = data.profile as PublicProfileData;
        setProfileData(profile);

        // Fetch ALL properties owned by this agent
        try {
          const propsRes = await api.properties.getUserProps(profile.username);
          const raw =
            (propsRes.data as any)?.results ?? propsRes.data ?? [];

          const normalized = raw.map((p: any) => normalizePropertyData(p));
          setProperties(normalized);
        } catch (err) {
          console.error("Failed to load full property list:", err);
        }

        // Rating summary
        try {
          const ratingRes = await api.reviews.getUserOverallRating(profile.id);
          const rd = ratingRes.data as any;
          setOverallRating(rd.average_rating ?? null);
          setOverallReviewsCount(rd.reviews_received_count ?? null);
        } catch {}
      } catch {
        setError("Failed to load profile.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchData();
  }, [username, navigate]);

  // -----------------------------
  // Connect button
  // -----------------------------
  const handleConnectionAction = async () => {
    if (!profileData || isConnecting) return;

    const status = profileData.connection_status;
    if (status === "connected" || status === "pending_sent") return;

    setIsConnecting(true);

    try {
      await api.connections.sendRequest(profileData.id);

      if (status === "none" || status === "rejected") {
        setProfileData({
          ...profileData,
          connection_status: "pending_sent"
        });
      } else if (status === "pending_received") {
        setProfileData({
          ...profileData,
          connection_status: "connected"
        });
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

  // -----------------------------
  // Loading / Error
  // -----------------------------
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
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
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

  // -----------------------------
  // MAIN UI
  // -----------------------------
  return (
    <div className="pt-16 bg-white">
      {/* SEO */}
      <SEO
        title={profileTitle}
        description={profileDescription}
        url={`/${profileData.username}`}
        image={profileData.avatar}
        type="profile"
      />

      {/* ========================================================= */}
      {/*                      HEADER BANNER                        */}
      {/* ========================================================= */}
      <div className="w-full">
        <div className="h-96 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* ========================================================= */}
        {/*               PROFILE HEADER CONTENT (unchanged)          */}
        {/* ========================================================= */}
        <div className="px-6 pb-8">
          <div
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
            style={{ marginTop: "-90px" }}
          >
            {/* Avatar + Name */}
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative flex-shrink-0">
                <div
                  className="w-48 h-48 rounded-3xl flex items-center justify-center text-white font-bold text-5xl border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600"
                  style={{
                    background: profileData.avatar
                      ? `url(${profileData.avatar}) center/cover no-repeat`
                      : undefined
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

                {overallRating && overallRating >= 4.5 && (
                  <div className="absolute -bottom-3 -right-3 bg-yellow-400 text-slate-900 rounded-full p-3 shadow-xl border-4 border-white">
                    <Award className="h-6 w-6" />
                  </div>
                )}
              </div>

              {/* Profile Name + Stats */}
              <div className="pb-2">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {profileTitle}
                </h1>
                <p className="text-gray-600 text-lg mb-4">
                  @{profileData.username}
                </p>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      {properties.length}
                    </span>
                    <span className="text-gray-600">Listings</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      {overallRating?.toFixed(1) ?? "N/A"}
                    </span>
                    <span className="text-gray-600">
                      ({overallReviewsCount ?? 0} reviews)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-gray-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      {profileData.connections_count}
                    </span>
                    <span className="text-gray-600">Connections</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap md:flex-nowrap">
              {/* Message */}
              <button
                onClick={async () => {
                  const thread = await getOrCreateDmThread(profileData.id);
                  navigate(`/chat/${thread}`);
                }}
                className="flex-1 md:flex-none px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition"
              >
                <Send className="h-4 w-4 inline-block mr-2" />
                Message
              </button>

              {/* Connect */}
              <button
                onClick={handleConnectionAction}
                disabled={
                  isConnecting ||
                  profileData.connection_status === "pending_sent"
                }
                className={`flex-1 md:flex-none px-7 py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2
                  ${
                    profileData.connection_status === "connected"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : profileData.connection_status === "pending_sent"
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  }
                `}
              >
                {React.createElement(getConnectionButtonIcon(), {
                  className: "h-4 w-4"
                })}
                {getConnectionButtonText()}
              </button>

              {/* Review */}
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-5 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <Star className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/*     UNIFIED INFO CONTAINER (About + Performance + Contact) */}
      {/* ========================================================= */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-10">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-10 max-w-7xl mx-auto">

          {/* -------------------- About -------------------- */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {profileData.bio || "This user has not added a bio yet."}
            </p>
          </div>

          {/* -------------------- Performance -------------------- */}
          {overallRating && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                Performance
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Rating Box */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl py-6 px-6 shadow-sm border border-yellow-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium text-gray-600">
                      Rating
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-gray-900">
                    {overallRating.toFixed(1)}
                  </p>
                </div>

                {/* Reviews Box */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl py-6 px-6 shadow-sm border border-yellow-200">
                  <div className="flex items-center gap-2 mb-3">
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

          {/* -------------------- Contact Info -------------------- */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {profileData.website && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Website</p>
                    <a
                      href={
                        profileData.website.startsWith("http")
                          ? profileData.website
                          : `https://${profileData.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline break-all"
                    >
                      {profileData.website}
                    </a>
                  </div>
                </div>
              )}

              {profileData.phone && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-1">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                    <p className="text-gray-900 font-medium">{profileData.phone}</p>
                  </div>
                </div>
              )}

              {profileData.office && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 mt-1">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Office</p>
                    <p className="text-gray-900 font-medium">{profileData.office}</p>
                  </div>
                </div>
              )}

              {!profileData.website &&
                !profileData.phone &&
                !profileData.office && (
                  <p className="text-gray-500 italic col-span-full py-4 text-center">
                    No contact details provided
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/*                       LISTINGS SECTION                    */}
      {/* ========================================================= */}
      <div className="bg-white px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Listings</h2>

            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40 shadow-sm"
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
                          className={`w-10 h-10 rounded-lg font-medium shadow-sm ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40 shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {profileData && (
        <ReviewForm
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          reviewee={{
            id: profileData.id,
            username: profileData.username,
            email: ""
          }}
          onSuccess={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
};

export default PublicProfile;
