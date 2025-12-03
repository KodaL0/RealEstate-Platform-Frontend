import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  Building,
  Building2,
  CheckCircle2,
  Clock,
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
  Send,
  Pencil,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PropertyCard from "../components/cards/PropertyCard";
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
  const [overallReviewsCount, setOverallReviewsCount] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Inline editing state ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [originalProfileData, setOriginalProfileData] = useState<ProfileData | null>(null);

  // --- Username state ---
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
      // but for validation we accept both forms.
      // This is just a sanity check.
      // eslint-disable-next-line no-new
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
  // Handlers: inline profile editing
  // --------------------------------
  const handleProfileFieldChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    if (profileMessage) setProfileMessage("");
    if (profileError) setProfileError("");
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Validate phone + website
    const phoneError = validatePhone(profileData.phone);
    const websiteError = validateWebsite(profileData.website);

    if (phoneError || websiteError) {
      setProfileError(phoneError || websiteError || "");
      return;
    }

    setIsSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const response = await api.auth.updateProfile(profileData);
      if (response.status === 200) {
        setProfileMessage("Profile updated successfully!");
        setOriginalProfileData(profileData);
        // sync user context
        updateUserData({
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
      setProfileError(apiError.response?.data?.error || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelProfileEdit = () => {
    if (originalProfileData) {
      setProfileData(originalProfileData);
    }
    setProfileError("");
    setProfileMessage("");
    setIsEditingProfile(false);
  };

  // --------------------------------
  // Handlers: username editing
  // --------------------------------
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setNewUsername(value);

    const err = validateUsername(value);
    setValidationError(err || "");
    if (usernameMessage) setUsernameMessage("");
    if (usernameError) setUsernameError("");
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUsernameError("");
    setUsernameMessage("");

    const err = validateUsername(newUsername);
    if (err) {
      setValidationError(err);
      return;
    }

    try {
      const response = await api.auth.updateProfile({ username: newUsername });
      if (response.status === 200) {
        setUsernameMessage("Username updated successfully!");
        setUsername(newUsername);
        setValidationError("");
        updateUserData({ username: newUsername });
      }
    } catch (error: any) {
      console.error("Username update failed:", error);
      const apiError = error as {
        response?: { data?: { error?: string }; status?: number };
      };
      setUsernameError(apiError.response?.data?.error || "Failed to update username.");
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{loadError}</h1>
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

  return (
    <div className="pt-16 bg-white min-h-screen">
      <SEO
        title={`My Public Profile | ${profileTitle}`}
        description={profileDescription}
        url={`/users/${username}`}
        image={profileData.avatar}
        type="profile"
      />

      {/* HERO BANNER + HEADER */}
      <div className="w-full">
        {/* Gradient band */}
        <div className="h-96 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
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

          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500 rounded-full translate-y-1/2 -translate-x-1/4 opacity-20 blur-3xl" />
        </div>

        {/* MAIN WRAPPER CARD (everything except listings) */}
        <div className="max-w-7xl mx-auto px-6" style={{ marginTop: "-90px" }}>
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
                    <p className="text-gray-600 text-base sm:text-lg mb-4">@{username}</p>

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
                          {overallRating !== null ? overallRating.toFixed(1) : "N/A"}
                        </span>
                        <span className="text-gray-600">
                          ({overallReviewsCount ?? 0} reviews)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-gray-500" />
                        <span className="text-lg font-semibold text-gray-900">
                          {user?.connections_count ?? 0}
                        </span>
                        <span className="text-gray-600">Connections</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: buttons */}
                <div className="flex gap-3 flex-wrap md:flex-nowrap">
                  <Link
                    to={`/${username}`}
                    className="flex-1 md:flex-none px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Send className="h-4 w-4" />
                    <span>View Public Profile</span>
                  </Link>

                  <Link
                    to="/analytics"
                    className="flex-1 md:flex-none px-7 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* ABOUT + PERFORMANCE + CONTACT + USERNAME/PRIVACY */}
            <div className="px-6 pb-8 pt-6 bg-gray-50">
              {/* About + Performance */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">About</h2>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-black transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  {isEditingProfile ? "Cancel" : "Edit profile"}
                </button>
              </div>

              {/* Messages for profile save */}
              {profileMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-800 font-medium">
                    {profileMessage}
                  </span>
                </div>
              )}
              {profileError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800 font-medium">{profileError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Left: Bio + basic fields */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
                  {isEditingProfile ? (
                    <>
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) =>
                            handleProfileFieldChange("name", e.target.value)
                          }
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Your full name"
                        />
                      </div>

                      <div>
                        <label className="mb-2 text-sm font-semibold text-gray-700 flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                          Location
                        </label>
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) =>
                            handleProfileFieldChange("location", e.target.value)
                          }
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="City, Country"
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">
                          Bio
                        </label>
                        <div className="relative">
                          <textarea
                            value={profileData.bio}
                            onChange={(e) =>
                              handleProfileFieldChange("bio", e.target.value)
                            }
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            rows={4}
                            maxLength={500}
                            placeholder="Tell clients who you are, your expertise, and what makes you different."
                          />
                          <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                            {profileData.bio.length}/500
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Bio
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {profileData.bio || "You haven't added a bio yet."}
                      </p>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase text-gray-500 mb-1">
                            Full Name
                          </p>
                          <p className="text-gray-900 font-medium">
                            {profileData.name || "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-gray-500 mb-1">
                            Location
                          </p>
                          <p className="text-gray-900 font-medium">
                            {profileData.location || "Not set"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Performance */}
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
                          <span className="text-xs font-medium text-gray-600">Rating</span>
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

              {/* Contact + username + privacy in same container */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact information (editable inline) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    Contact Information
                  </h3>

                  {isEditingProfile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="mb-2 text-sm font-semibold text-gray-700 flex items-center">
                          <Globe className="h-4 w-4 mr-1 text-gray-500" />
                          Website
                        </label>
                        <input
                          type="text"
                          value={profileData.website}
                          onChange={(e) =>
                            handleProfileFieldChange("website", e.target.value)
                          }
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="https://example.com"
                        />
                      </div>

                      <div>
                        <label className="mb-2 text-sm font-semibold text-gray-700 flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-500" />
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) =>
                            handleProfileFieldChange("phone", e.target.value)
                          }
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="+1234567890"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 text-sm font-semibold text-gray-700 flex items-center">
                          <Building className="h-4 w-4 mr-1 text-gray-500" />
                          Office / Workplace
                        </label>
                        <input
                          type="text"
                          value={profileData.office}
                          onChange={(e) =>
                            handleProfileFieldChange("office", e.target.value)
                          }
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Company or office name"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {profileData.website && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                            <Globe className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-600 mb-1">
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
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                            <p className="text-gray-900 font-medium">
                              {profileData.phone}
                            </p>
                          </div>
                        </div>
                      )}

                      {profileData.office && (
                        <div className="flex items-start gap-4 md:col-span-2">
                          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 mt-1">
                            <Building2 className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-600 mb-1">
                              Office
                            </p>
                            <p className="text-gray-900 font-medium">
                              {profileData.office}
                            </p>
                          </div>
                        </div>
                      )}

                      {!profileData.website &&
                        !profileData.phone &&
                        !profileData.office && (
                          <p className="text-gray-500 italic col-span-full py-2 text-center">
                            No contact details provided
                          </p>
                        )}
                    </div>
                  )}

                  {/* Save / Cancel buttons for profile edit */}
                  {isEditingProfile && (
                    <div className="mt-6 flex flex-wrap gap-3 justify-end">
                      <button
                        type="button"
                        onClick={handleCancelProfileEdit}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                      >
                        {isSavingProfile ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Username + Privacy */}
                <div className="space-y-4">
                  {/* Username card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Username Settings
                      </h3>
                    </div>

                    {usernameMessage && (
                      <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs text-emerald-800 font-medium">
                          {usernameMessage}
                        </span>
                      </div>
                    )}
                    {usernameError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-red-800 font-medium">
                          {usernameError}
                        </span>
                      </div>
                    )}

                    <form onSubmit={handleUpdateUsername} className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          Current username
                        </p>
                        <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium text-gray-900">
                          @{username}
                        </div>
                      </div>

                      <div>
                        <label className="block mb-1 text-xs font-semibold text-gray-600">
                          New username
                        </label>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={handleUsernameChange}
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
                            validationError
                              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-300"
                          }`}
                          placeholder="your_new_username"
                        />
                        {validationError && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {validationError}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Lowercase letters, numbers, underscores, and hyphens only.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={!!validationError || !newUsername.trim()}
                        className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          validationError || !newUsername.trim()
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg"
                        }`}
                      >
                        Update Username
                      </button>
                    </form>
                  </div>

                  {/* Privacy card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-3">
                      <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Privacy & GDPR
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Manage consent preferences and privacy controls related to your
                      public profile and communication.
                    </p>
                    <Link
                      to="/privacy-settings"
                      className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black text-xs font-medium transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Open Privacy Settings</span>
                    </Link>
                  </div>

                  {/* Developer portal (if applicable) */}
                  {user?.is_developer && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center mb-3">
                        <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Developer Portal
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Access your API keys, integrations, and developer analytics.
                      </p>
                      <Link
                        to="/developer-api"
                        className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 text-xs font-medium transition-all"
                      >
                        <Building className="h-4 w-4" />
                        <span>Open Developer Portal</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LISTINGS SECTION (unchanged style) */}
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Listings Yet
                  </h3>
                  <p className="text-gray-600">
                    You haven&apos;t posted any properties yet. Create your first
                    listing to showcase your portfolio.
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
                          let pageNum: number;

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
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
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
        </div>
      </div>
    </div>
  );
};

export default MyPublicProfile;
