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
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  MessageCircle
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
  const [activeTab, setActiveTab] = useState<"listings" | "about">("listings");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

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

            const raw =
              (propsRes.data as any)?.results ??
              propsRes.data ??
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
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{error || "Profile Not Found"}</h1>
            <p className="text-gray-600 mb-6">This profile may have been removed or doesn't exist.</p>
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

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="h-80 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-300 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
            </div>
          </div>

          <div className="px-6 pb-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between" style={{ marginTop: '-80px' }}>
              <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-6">
                <div className="relative">
                  <div
                    className="w-40 h-40 rounded-2xl flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600"
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
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white rounded-full p-2 shadow-lg">
                      <Award className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="pb-4">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{profileTitle}</h1>
                  <p className="text-gray-600 text-lg mb-3">@{profileData.username}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{properties.length}</span>
                      <span className="text-gray-600">Listings</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{overallRating?.toFixed(1) ?? "N/A"}</span>
                      <span className="text-gray-600">({overallReviewsCount ?? 0} reviews)</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-700">
                      <UserPlus className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{profileData.connections_count}</span>
                      <span className="text-gray-600">Connections</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={async () => {
                    const thread = await getOrCreateDmThread(profileData.id);
                    navigate(`/chat/${thread}`);
                  }}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Send className="h-4 w-4" />
                  <span>Message</span>
                </button>

                <button
                  onClick={handleConnectionAction}
                  disabled={isConnecting || profileData.connection_status === "pending_sent"}
                  className={`
                    flex-1 md:flex-none px-6 py-2.5 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg
                    ${
                      profileData.connection_status === "connected"
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : profileData.connection_status === "pending_sent"
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                    }
                  `}
                >
                  {React.createElement(getConnectionButtonIcon(), {
                    className: "h-4 w-4"
                  })}
                  <span>{getConnectionButtonText()}</span>
                </button>

                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Write Review"
                >
                  <Star className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 flex gap-2">
              <button
                onClick={() => setActiveTab("listings")}
                className={`
                  px-6 py-3 font-semibold transition-all duration-200 border-b-2 -mb-px
                  ${activeTab === "listings"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                Listings
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`
                  px-6 py-3 font-semibold transition-all duration-200 border-b-2 -mb-px
                  ${activeTab === "about"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                About
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {activeTab === "about" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                About
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {profileData.bio || "This user has not added a bio yet."}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                Contact Information
              </h2>

              <div className="space-y-4">
                {profileData.website && (
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
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
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                      <p className="text-gray-900 font-medium">{profileData.phone}</p>
                    </div>
                  </div>
                )}

                {profileData.office && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-1">Office</p>
                      <p className="text-gray-900 font-medium">{profileData.office}</p>
                    </div>
                  </div>
                )}

                {!profileData.website && !profileData.phone && !profileData.office && (
                  <p className="text-gray-500 italic py-4 text-center">No contact details provided</p>
                )}
              </div>
            </div>

            {overallRating && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                  Performance
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium text-gray-600">Rating</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{overallRating.toFixed(1)}</p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-600">Reviews</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{overallReviewsCount ?? 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "listings" && (
          <div>
            {properties.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Listings Yet</h3>
                <p className="text-gray-600">This agent hasn't posted any properties yet.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    >
                      Previous
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`
                              w-10 h-10 rounded-lg font-medium transition-all duration-200 shadow-sm
                              ${currentPage === pageNum
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
        )}
      </div>

      {profileData && (
        <ReviewForm
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          reviewee={{
            id: profileData.id,
            username: profileData.username,
            email: ""
          }}
          onSuccess={() => {
            setShowReviewForm(false);
          }}
        />
      )}
    </div>
  );
};

export default PublicProfile;
