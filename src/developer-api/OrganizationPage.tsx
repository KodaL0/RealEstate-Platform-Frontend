import { useEffect, useState } from "react";
import developersApi, { type DeveloperOrganization } from "../config/developers-api";
import Profile from "./components/Profile";

export default function OrganizationPage() {
  const [organization, setOrganization] = useState<DeveloperOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        // Debug: Authentication method info
        console.log("🔐 Authentication method: Django session-based (working correctly)");
        console.log("🔍 Available cookies:", document.cookie);

        const response = await developersApi.organizations.getMine();
        console.log("Organization API response:", response); // Debug log
        if (response.organization) {
          setOrganization(response.organization);
        } else {
          setError("No organization found. Please create an organization first.");
        }
      } catch (error: unknown) {
        console.error("Error fetching organization:", error);
        const axiosError = error as { response?: unknown };
        console.error("Error details:", axiosError.response); // Debug log
        setError("An error occurred while fetching organization data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  const handleOrganizationUpdate = async () => {
    try {
      const response = await developersApi.organizations.getMine();
      console.log("Organization update response:", response); // Debug log
      if (response.organization) {
        setOrganization(response.organization);
      }
    } catch (error: unknown) {
      console.error("Error refreshing organization:", error);
      const axiosError = error as { response?: unknown };
      console.error("Error details:", axiosError.response); // Debug log
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium mb-2">Unable to Load Organization</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏢</div>
        <h3 className="text-lg font-medium mb-2">No Organization Found</h3>
        <p className="text-gray-600 mb-4">
          You need to create an organization to access the developer portal.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/developers";
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Developers Page
        </button>
      </div>
    );
  }

  return <Profile organization={organization} onUpdate={handleOrganizationUpdate} />;
}
