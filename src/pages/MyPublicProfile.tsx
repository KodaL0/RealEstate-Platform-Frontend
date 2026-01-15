import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  Building,
  Building2,
  CheckCircle2,
  FileText,
  Globe,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  Shield,
  Sliders,
  Star,
  TrendingUp,
  User as UserIcon,
  UserPlus,
  Pencil,
  X,
  Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MyPropertyCard from "../components/cards/MyPropertyCard";
import EditSectionModal from "../components/modals/EditSectionModal";
import PropertyAnalytics from "../components/analytics/PropertyAnalytics";
import { SEO } from "../components/SEO";
import api from "../config/api";
import { useUser } from "../context/UserContext";
import { normalizePropertyData, type Property } from "../types";

interface ProfileData {
  name: string;
  bio: string;
  location: string;
  phone: string;
  office: string;
  avatar: string;
  website: string;
}

interface UserResponse {
  user: {
    id: number;
    email: string;
    username: string;
    name?: string;
    bio?: string;
    location?: string;
    phone?: string;
    office?: string;
    avatar?: string;
    website?: string;
    date_joined: string;
    is_developer?: boolean;
    connections_count?: number;
  };
}

const MyPublicProfile: React.FC = () => {
  const { user, updateUserData } = useUser();
  const navigate = useNavigate();

  // --- Core profile state ---
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    bio: "",
    location: "",
    phone: "",
    office: "",
    avatar: "",
    website: "",
  });
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [overallReviewsCount, setOverallReviewsCount] = useState<number | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Editing state (modal) ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [originalProfileData, setOriginalProfileData] =
    useState<ProfileData | null>(null);

  // --- Username state (now edited inside modal too) ---
  const [newUsername, setNewUsername] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [validationError, setValidationError] = useState("");

  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const totalPages = Math.ceil(properties.length / pageSize);
  const paginatedProperties = properties.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Listing management modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null
  );
  const [selectedPropertyTitle, setSelectedPropertyTitle] =
    useState<string>("");

  // Analytics modal
  const [analyticsPropertyId, setAnalyticsPropertyId] = useState<string | null>(
    null
  );

  // --------------------------------
  // Validation helpers
  // --------------------------------
  const validateUsername = (uname: string): string | null => {
    if (!uname || uname.length < 3) {
      return "Username must be at least 3 characters long";
    }
    const regex = /^[a-z0-9_-]+$/;
    if (!regex.test(uname)) {
      return "Username can only contain lowercase letters, numbers, underscores, and hyphens";
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone) return null;
    const phoneRegex = /^\+?1?\d{9,15}$/;
    const cleaned = phone.replace(/\s+/g, "");
    if (!phoneRegex.test(cleaned)) {
      return "Please enter a valid phone number (9–15 digits)";
    }
    return null;
  };

  const validateWebsite = (website: string): string | null => {
    if (!website) return null;
    try {
      // Allow missing protocol by trying to prepend https if needed
      new URL(website.startsWith("http") ? website : `https://${website}`);
      return null;
    } catch {
      return "Please enter a valid website URL (e.g., https://example.com)";
    }
  };

  // --------------------------------
  // Load current user + profile + listings + rating
  // --------------------------------
  const loadMyProfile = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setLoadError(null);
    setProfileMessage("");
    setProfileError("");
    setUsernameMessage("");
    setUsernameError("");
    setValidationError("");

    try {
      // 1. Get user from backend (authoritative)
      const response = await api.auth.getUser();
      const data = response.data as UserResponse;
      const u = data.user;

      setUserId(u.id);
      setUsername(u.username);
      setNewUsername(u.username);

      const pd: ProfileData = {
        name: u.name || "",
        bio: u.bio || "",
        location: u.location || "",
        phone: u.phone || "",
        office: u.office || "",
        avatar: u.avatar || "",
        website: u.website || "",
      };

      setProfileData(pd);
      setOriginalProfileData(pd);

      // 2. Get ALL listings for this user
      try {
        const propsRes = await api.properties.getUserProps(u.username);
        const raw = propsRes.data as unknown;

        let rawList: any[] = [];
        if (Array.isArray(raw)) {
          rawList = raw;
        } else if (
          raw &&
          typeof raw === "object" &&
          "results" in raw &&
          Array.isArray((raw as { results: unknown[] }).results)
        ) {
          rawList = (raw as { results: unknown[] }).results;
        }

        const normalized = rawList.map((p) =>
          normalizePropertyData(p as Record<string, unknown>)
        );
        setProperties(normalized);
      } catch (err) {
        console.error("Failed to load full property list:", err);
      }

      // 3. Get rating summary
      try {
        const ratingRes = await api.reviews.getUserOverallRating(u.id);
        const ratingData = ratingRes.data as {
          average_rating?: number;
          reviews_received_count?: number;
        };
        setOverallRating(ratingData.average_rating ?? null);
        setOverallReviewsCount(ratingData.reviews_received_count ?? null);
      } catch (err) {
        console.error("Failed to load rating summary:", err);
      }
    } catch (err) {
      console.error("Failed to load my profile:", err);
      setLoadError("Failed to load your profile.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    void loadMyProfile();
  }, [user, navigate, loadMyProfile]);

  // --------------------------------
  // Handlers: editing
  // --------------------------------
  const handleProfileFieldChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    if (profileMessage) setProfileMessage("");
    if (profileError) setProfileError("");
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setNewUsername(value);

    const err = validateUsername(value);
    setValidationError(err || "");
    if (usernameMessage) setUsernameMessage("");
    if (usernameError) setUsernameError("");
  };

  const handleCancelProfileEdit = () => {
    if (originalProfileData) {
      setProfileData(originalProfileData);
    }
    setNewUsername(username);
    setProfileError("");
    setProfileMessage("");
    setUsernameError("");
    setUsernameMessage("");
    setValidationError("");
    setIsEditingProfile(false);
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    const unameError = validateUsername(newUsername);
    const phoneError = validatePhone(profileData.phone);
    const websiteError = validateWebsite(profileData.website);

    if (unameError) {
      setValidationError(unameError);
      return;
    }

    if (phoneError || websiteError) {
      setProfileError(phoneError || websiteError || "");
      return;
    }

    setIsSavingProfile(true);
    setProfileError("");
    setProfileMessage("");
    setUsernameError("");
    setUsernameMessage("");

    try {
      const payload = { ...profileData, username: newUsername };
      const response = await api.auth.updateProfile(payload);

      if (response.status === 200) {
        setProfileMessage("Profile updated successfully!");
        setUsernameMessage("Username updated successfully!");
        setOriginalProfileData(profileData);
        setUsername(newUsername);
        setValidationError("");

        updateUserData({
          username: newUsername,
          name: profileData.name,
          bio: profileData.bio,
          location: profileData.location,
          phone: profileData.phone,
          office: profileData.office,
          avatar: profileData.avatar,
          website: profileData.website,
        });

        setIsEditingProfile(false);
      }
    } catch (err: any) {
      console.error("Profile update failed:", err);
      const apiError = err as {
        response?: { data?: { error?: string }; status?: number };
      };
      const msg = apiError.response?.data?.error || "Failed to update profile.";
      setProfileError(msg);
      setUsernameError(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // =============================
  // LISTING MANAGEMENT FUNCTIONS
  // =============================

  const handleEditClick = (id: string | number) => {
    const idNum = Number(id);
    const property = properties.find((p) => String(p.id) === String(idNum));
    setSelectedPropertyId(String(idNum));
    setSelectedPropertyTitle(property?.title || "Property");
    setIsEditModalOpen(true);
  };

  const handlePublish = async (id: string | number) => {
    if (!username) return alert("User info unavailable");
    if (!window.confirm("Publish this listing?")) return;

    const idNum = Number(id);

    try {
      await api.put(`properties/${username}/property/${idNum}/publish`);
      setProperties((ps) =>
        ps.map((p) =>
          String(p.id) === String(idNum) ? { ...p, is_published: true } : p
        )
      );

    } catch (err) {
      console.error(err);
      alert("Failed to publish listing.");
    }
  };

  const handleUnpublish = async (id: string | number) => {
    if (!username) return alert("User info unavailable");
    if (!window.confirm("Unpublish this listing?")) return;

    const idNum = Number(id);

    try {
      await api.put(`properties/${username}/property/${idNum}/unpublish`);
      setProperties((ps) =>
        ps.map((p) =>
          String(p.id) === String(idNum) ? { ...p, is_published: false } : p
        )
      );

    } catch (err) {
      console.error(err);
      alert("Failed to unpublish listing.");
    }
  };

  const handleRemove = async (id: string | number) => {
    if (!username) return alert("User info unavailable");
    if (!window.confirm("Remove this listing?")) return;

    const idNum = Number(id);

    try {
      await api.delete(`properties/${username}/property/${idNum}/delete`);
      setProperties((ps) => ps.filter((p) => String(p.id) !== String(idNum)));
    } catch (err) {
      console.error(err);
      alert("Failed to remove listing.");
    }
  };

  const handleViewAnalytics = (id: string | number) => {
    setAnalyticsPropertyId(String(id));
  };
  const handleSectionSelect = (section: number) => {
  if (selectedPropertyId !== null) {
    navigate(`/edit-listing/${selectedPropertyId}?step=${section}`);
  }
  setIsEditModalOpen(false);
  setSelectedPropertyId(null);
};

  // --------------------------------
  // Loading / error UI
  // --------------------------------
  if (!user) return null;

  if (isLoading) {
    return (
      <div className="pt-16 bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pt-16 bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {loadError}
            </h1>
            <p className="text-gray-600 mb-6">
              Please refresh the page or try again in a moment.
            </p>
            <button
              onClick={() => void loadMyProfile()}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------
  // SEO + computed
  // --------------------------------
  const profileTitle = profileData.name || `@${username}`;
  const profileDescription =
    profileData.bio ||
    `${profileTitle} is a real estate professional on PropertPro with ${properties.length} listings.`;

  const connectionsCount =
    (user as any)?.connections_count !== undefined
      ? (user as any).connections_count
      : 0;

  return (
    <div className="pt-16 bg-white min-h-screen">
      <SEO
        title={`My Public Profile | ${profileTitle}`}
        description={profileDescription}
        url={`/users/${username}`}
        image={profileData.avatar}
        type="profile"
      />

      {/* MAIN WRAPPER CARD (everything except listings) */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-10">
            {/* TOP HEADER ROW (avatar, stats, buttons) */}
            <div className="px-6 pt-8 pb-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                {/* Left: avatar + name + stats */}
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl flex items-center justify-center text-white font-bold text-4xl sm:text-5xl border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600"
                      style={{
                        background: profileData.avatar
                          ? `url(${profileData.avatar}) center/cover no-repeat`
                          : undefined,
                      }}
                    >
                      {!profileData.avatar &&
                        (profileData.name || username)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                    </div>

                    {overallRating !== null && overallRating >= 4.5 && (
                      <div className="absolute -bottom-3 -right-3 bg-yellow-400 text-slate-900 rounded-full p-3 shadow-xl border-4 border-white">
                        <Award className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Name + stats */}
                  <div className="pb-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                      {profileTitle}
                    </h1>
                    <p className="text-gray-600 text-base sm:text-lg mb-4">
                      @{username}
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
                          {overallRating !== null
                            ? overallRating.toFixed(1)
                            : "N/A"}
                        </span>
                        <span className="text-gray-600">
                          ({overallReviewsCount ?? 0} reviews)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-gray-500" />
                        <span className="text-lg font-semibold text-gray-900">
                          {connectionsCount}
                        </span>
                        <span className="text-gray-600">Connections</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: buttons (Edit + Analytics) */}
                <div className="flex gap-3 flex-wrap md:flex-nowrap">
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                  </Link>

                  <Link
                    to="/analytics"
                    className="flex-1 md:flex-none px-7 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>

                  <button
                    onClick={() => navigate("/create-listing")}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    Create Listing
                  </button>
                </div>
              </div>
            </div>

            {/* ABOUT + CONTACT + PERFORMANCE (view-only, like PublicProfile) */}
            <div className="px-6 pb-8 pt-6 bg-gray-50">
              {/* ABOUT SECTION */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
                {profileData.bio || "You haven't added a bio yet."}
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Info (view-only) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileData.website && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mt-1">
                          <Globe className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Website
                          </p>
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
                          <p className="text-sm font-medium text-gray-600">
                            Phone
                          </p>
                          <p className="font-medium text-gray-900">
                            {profileData.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    {profileData.office && (
                      <div className="flex items-start gap-4 md:col-span-2">
                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mt-1">
                          <Building2 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Office
                          </p>
                          <p className="font-medium text-gray-900">
                            {profileData.office}
                          </p>
                        </div>
                      </div>
                    )}

                    {!profileData.website &&
                      !profileData.phone &&
                      !profileData.office && (
                        <p className="text-gray-500 italic col-span-full">
                          No contact details provided.
                        </p>
                      )}
                  </div>
                </div>

                {/* PERFORMANCE */}
                {overallRating !== null && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-yellow-600" />
                      Performance
                    </h3>

                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-medium text-gray-600">
                            Rating
                          </span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          {overallRating.toFixed(1)}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-medium text-gray-600">
                            Reviews
                          </span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          {overallReviewsCount ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LISTINGS SECTION */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 mb-12">
            <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Listings</h2>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                <Sliders className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">Filter</span>
              </div>
            </div>

            <div className="px-6 pb-8 pt-4">
              {properties.length === 0 ? (
                <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                  <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Listings Yet</h3>
                  <p className="text-gray-600">
                    You haven&apos;t posted any properties yet. Create your first listing.
                  </p>
                </div>
              ) : (
                <>
                  {/* GRID OF PROPERTY CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {paginatedProperties.map((property) => (
                      <MyPropertyCard
                        key={property.id}
                        property={property}
                        onEdit={handleEditClick}
                        onRemove={handleRemove}
                        onPublish={handlePublish}
                        onUnpublish={handleUnpublish}
                        onNavigate={(id) => navigate(`/property/${id}`)}
                        onViewAnalytics={handleViewAnalytics}
                      />
                    ))}
                  </div>

                  {/* PAGINATION */}
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
                          if (totalPages <= 7) pageNum = i + 1;
                          else if (currentPage <= 4) pageNum = i + 1;
                          else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                          else pageNum = currentPage - 3 + i;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 shadow-sm ${
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

            {/* EDIT LISTING MODAL */}
            <EditSectionModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedPropertyId(null);
              }}
              onSelectSection={handleSectionSelect}
              propertyTitle={selectedPropertyTitle}
            />

          </div> {/* closes max-width container */}
        </div> {/* closes HERO SECTION WRAPPER */}

        {/* FULL SCREEN PROFILE EDIT MODAL */}
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6">
              {/* ... keep modal content ... */}
            </div>
          </div>
        )}

        {/* ANALYTICS MODAL */}
        {analyticsPropertyId && (
          <div
            className="fixed top-20 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setAnalyticsPropertyId(null)}
          >
            <div
              className="w-full max-w-4xl max-h-[calc(100vh-6rem)] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <PropertyAnalytics
                propertyId={analyticsPropertyId}
                onClose={() => setAnalyticsPropertyId(null)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  export default MyPublicProfile;


