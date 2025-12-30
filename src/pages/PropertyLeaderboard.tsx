import { useEffect, useState } from "react";
import api from "../config/api";
import { developersApi, type Project } from "../config/developers-api";
import { normalizePropertyData } from "../types";
import type { Property } from "../types";
import PropertyCard from "../components/cards/PropertyCard";
import ProjectCard from "../components/cards/ProjectCard";

type UnifiedListingItem =
  | (Property & { _type: "property"; view_count: number })
  | (Project & { _type: "project"; view_count: number });

const PropertyLeaderboard = () => {
  const [listings, setListings] = useState<UnifiedListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Get leaderboard with IDs, view_count, and _type
        const leaderboard = await api.properties.leaderboard({ limit: 10 });

        if (leaderboard.results.length === 0) {
          setListings([]);
          setIsLoading(false);
          return;
        }

        // Step 2: Fetch full listing data in parallel using Promise.allSettled for resilience
        const fetchPromises = leaderboard.results.map(async (item) => {
          try {
            if (item._type === 'project') {
              const project = await developersApi.projects.getPublic(item.id);
              return {
                ...project,
                _type: 'project' as const,
                view_count: item.view_count,
              };
            } else {
              const response = await api.get(`properties/${item.id}`);
              const normalized = normalizePropertyData(response.data as Partial<Property> & Record<string, unknown>);
              return {
                ...normalized,
                _type: 'property' as const,
                view_count: item.view_count,
              } as UnifiedListingItem;
            }
          } catch (err) {
            console.error(`Error fetching ${item._type} ${item.id}:`, err);
            return null; // Return null for failed fetches
          }
        });

        // Use allSettled to handle partial failures gracefully
        const results = await Promise.allSettled(fetchPromises);
        
        // Filter out failed fetches and null results
        const successfulListings: UnifiedListingItem[] = [];
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value !== null) {
            successfulListings.push(result.value);
          }
        }

        setListings(successfulListings);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading properties...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Listings Leaderboard</h1>
          <p className="text-lg text-gray-600">
            Top 10 listings (properties & projects) ranked by total views
          </p>
        </div>

        {/* Leaderboard Cards */}
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing, index) => {
              const rank = index + 1;
              return (
                <div key={`${listing._type}-${listing.id}`} className="relative">
                  {/* Rank Badge */}
                  <div className="absolute top-4 left-4 z-30">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg">
                      #{rank}
                    </span>
                  </div>
                  {/* View Count Badge */}
                  <div className="absolute top-4 right-4 z-30">
                    <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-blue-500/90 backdrop-blur-sm text-white text-xs font-semibold shadow-lg">
                      👁 {listing.view_count?.toLocaleString() || "0"}
                    </span>
                  </div>
                  {/* Card Component */}
                  {listing._type === 'property' ? (
                    <PropertyCard
                      property={listing}
                      showFavoriteButton={true}
                    />
                  ) : (
                    <ProjectCard
                      project={listing}
                      listingType={listing.sale_price_min && listing.sale_price_min > 0 ? "sale" : "rent"}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No listings found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyLeaderboard;

