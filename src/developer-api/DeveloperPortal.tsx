import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { organizationsApi } from "../config/developers-api";
import { useUser } from "../context/UserContext";
import EnhancedLayout from "./components/EnhancedLayout";
import OrganizationCreationForm from "./OrganizationCreationForm.tsx";
import OrganizationPage from "./OrganizationPage";
import ProjectsPage from "./ProjectsPage";

type Organization = {
  id: number;
  name: string;
  description?: string;
  country: string;
  website?: string;
  email?: string;
  phone?: string;
  logo?: string;
  established?: number;
  created_at: string;
  updated_at: string;
};

export default function DeveloperPortal() {
  const location = useLocation();
  const { user, isLoading: authLoading } = useUser();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch organization data for layout purposes
  useEffect(() => {
    // Only fetch organization data if user is authenticated and is a developer
    if (authLoading || !user || !user.is_developer) {
      return;
    }

    const fetchOrganization = async () => {
      try {
        const res = await organizationsApi.getMine();
        const data = res as { organization?: Organization | null };
        const org = data?.organization || null;
        if (org) {
          setOrganization(org);
        } else {
          // No organization found - show creation form
          setShowCreateForm(true);
        }
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number } };
        const status = axiosError.response?.status;
        if (status === 401) {
          setError("Authentication required. Please log in again.");
        } else {
          setError("Failed to fetch organization data.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [user, authLoading]);

  const handleCreateOrganization = async (formData: Partial<Organization>) => {
    setIsCreating(true);
    try {
      const newOrg = await organizationsApi.create(formData);
      setOrganization(newOrg);
      setShowCreateForm(false);
      setError(null);
    } catch (error: unknown) {
      console.error("Error creating organization:", error);
      const apiError = error as { response?: { data?: { error?: string } } };
      setError(
        apiError.response?.data?.error || "Failed to create organization. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full bg-blue-600/10 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800">Authenticating</h3>
            <p className="text-slate-600 text-sm">Verifying your credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user is not a developer
  if (!user || !user.is_developer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">{!user ? "🔐" : "🚫"}</span>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-3">
              {!user ? "Authentication Required" : "Access Restricted"}
            </h3>

            <p className="text-slate-600 mb-6 leading-relaxed">
              {!user
                ? "Please sign in to your PropertyPro developer account to access the API portal."
                : "Developer access is required to use this portal. Contact our team to request developer privileges."}
            </p>

            {/* Debug information */}
            {window.location.hostname === "localhost" && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
                <p className="font-semibold text-slate-700 mb-2 text-sm">Debug Information</p>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>
                    <span className="font-medium">User:</span>{" "}
                    {user ? "Authenticated" : "Not logged in"}
                  </p>
                  <p>
                    <span className="font-medium">User ID:</span> {user?.id || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {user?.email || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Developer Status:</span>{" "}
                    {user?.is_developer ? "Active" : "Inactive"}
                  </p>
                  <p>
                    <span className="font-medium">Auth Loading:</span> {authLoading ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="font-medium">Cookies:</span>{" "}
                    {Object.keys(
                      document.cookie.split(";").reduce((acc: Record<string, boolean>, cookie) => {
                        const [name] = cookie.trim().split("=");
                        acc[name] = true;
                        return acc;
                      }, {}),
                    ).join(", ") || "None"}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!user ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/login";
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Sign In to PropertyPro
                  </button>
                  <p className="text-sm text-slate-500">
                    New to PropertyPro?{" "}
                    <a
                      href="/login"
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                    >
                      Create an account
                    </a>
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/developers";
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    View Developer Resources
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/contact";
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Request API Access
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show organization creation form if no organization exists
  if (showCreateForm) {
    return <OrganizationCreationForm onSubmit={handleCreateOrganization} isLoading={isCreating} />;
  }

  // Show loading while fetching organization data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-blue-600/10 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800">Loading Developer Portal</h3>
            <p className="text-slate-600 text-sm">Setting up your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if organization fetch failed
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-3">Unable to Load Portal</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{error}</p>

            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no organization found (fallback)
  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🏢</span>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-3">Organization Required</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Create an organization profile to access PropertyPro's developer tools and API
              resources.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowCreateForm(true);
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Create Organization
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 w-full">
      <EnhancedLayout
        organization={
          organization
            ? {
                ...organization,
                owner: user?.id || 0,
                is_published: false,
              }
            : null
        }
        showBackButton={false}
        mainDashboardPath="/"
      >
        {/* Navigation Tabs - Enhanced Design */}
        <div className="mb-8">
          <div className="flex justify-center sm:justify-start">
            <nav className="inline-flex bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg border border-white/20">
              <Link
                to="/developer-api/organization"
                className={`relative px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  location.pathname.includes("/organization")
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105"
                    : "text-slate-700 hover:text-blue-600 hover:bg-blue-50/80"
                }`}
              >
                {location.pathname.includes("/organization") && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl opacity-10"></div>
                )}
                <span className="relative">My Organization</span>
              </Link>
              <Link
                to="/developer-api/projects"
                className={`relative px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  location.pathname.includes("/projects") ||
                  location.pathname === "/developer-api/" ||
                  location.pathname === "/developer-api"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105"
                    : "text-slate-700 hover:text-blue-600 hover:bg-blue-50/80"
                }`}
              >
                {(location.pathname.includes("/projects") ||
                  location.pathname === "/developer-api/" ||
                  location.pathname === "/developer-api") && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl opacity-10"></div>
                )}
                <span className="relative">My Projects</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Route Content - Enhanced Container */}
        {/* Route Content */}
        <div className="w-full">
          <Routes>
            <Route path="/organization" element={<OrganizationPage />} />
            <Route path="/projects/*" element={<ProjectsPage />} />
            <Route path="/" element={<ProjectsPage />} />
          </Routes>
        </div>
      </EnhancedLayout>
    </div>
  );
}
