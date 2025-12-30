import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../config/api";
import { developersApi, type Project } from "../config/developers-api";
import { normalizePropertyData } from "../types";
import type { Property } from "../types";

type UnifiedListingItem =
  | (Property & { _type: "property"; view_count: number })
  | (Project & { _type: "project"; view_count: number });

type LeaderboardSignature = Array<{ id: number; _type: 'property' | 'project' }>;

interface LeaderboardCache {
  signature: LeaderboardSignature;
  listings: UnifiedListingItem[];
  timestamp: number;
}

// Cache key for localStorage
const CACHE_KEY = 'leaderboard:cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes (matches backend cache)

/**
 * Compare two leaderboard signatures to check if order/IDs changed
 */
const compareSignatures = (sig1: LeaderboardSignature, sig2: LeaderboardSignature): boolean => {
  if (sig1.length !== sig2.length) return false;
  return sig1.every((item, index) => 
    item.id === sig2[index].id && item._type === sig2[index]._type
  );
};

/**
 * Get cached leaderboard data if signature matches
 */
const getCachedLeaderboard = (): LeaderboardCache | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache: LeaderboardCache = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - cache.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cache;
  } catch (error) {
    console.error('Error reading leaderboard cache:', error);
    return null;
  }
};

/**
 * Save leaderboard data to cache
 */
const setCachedLeaderboard = (signature: LeaderboardSignature, listings: UnifiedListingItem[]): void => {
  try {
    const cache: LeaderboardCache = {
      signature,
      listings,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving leaderboard cache:', error);
  }
};

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
        console.log('[Leaderboard] API response:', leaderboard);
        console.log('[Leaderboard] API response type:', typeof leaderboard);
        console.log('[Leaderboard] Results:', leaderboard.results);
        console.log('[Leaderboard] Results count:', leaderboard.results?.length);
        console.log('[Leaderboard] Is results array?', Array.isArray(leaderboard.results));

        if (!leaderboard || !leaderboard.results || !Array.isArray(leaderboard.results) || leaderboard.results.length === 0) {
          console.log('[Leaderboard] No results from API - leaderboard:', leaderboard);
          setListings([]);
          setIsLoading(false);
          return;
        }

        // Create signature from leaderboard response
        const newSignature: LeaderboardSignature = leaderboard.results.map(item => ({
          id: item.id,
          _type: item._type,
        }));
        console.log('[Leaderboard] New signature:', newSignature);

        // Check cache
        const cached = getCachedLeaderboard();
        console.log('[Leaderboard] Cached data:', cached);
        if (cached && compareSignatures(cached.signature, newSignature)) {
          // Signature matches - use cached data
          console.log('[Leaderboard] Using cached data (signature unchanged)');
          console.log('[Leaderboard] Cached listings count:', cached.listings.length);
          setListings(cached.listings);
          setIsLoading(false);
          return;
        }

        // Signature changed or cache expired - fetch new data
        console.log('[Leaderboard] Signature changed or cache expired, fetching new data');

        // Step 2: Fetch full listing data in parallel using Promise.allSettled for resilience
        const fetchPromises = leaderboard.results.map(async (item) => {
          try {
            if (item._type === 'project') {
              const project = await developersApi.projects.getPublic(item.id);
              console.log(`[Leaderboard] Project ${item.id} response:`, project);
              return {
                ...project,
                _type: 'project' as const,
                view_count: item.view_count,
              };
            } else {
              // Property IDs - use number directly (axios will convert to string in URL)
              const propertyId = item.id;
              console.log(`[Leaderboard] Fetching property ${propertyId} (type: ${typeof propertyId})...`);
              const response = await api.get(`properties/${propertyId}`);
              console.log(`[Leaderboard] Property ${propertyId} raw response:`, response);
              console.log(`[Leaderboard] Property ${propertyId} response.data:`, response.data);
              
              if (!response.data) {
                console.error(`[Leaderboard] Property ${propertyId} has no data in response`);
                return null;
              }
              
              const normalized = normalizePropertyData(response.data as Partial<Property> & Record<string, unknown>);
              console.log(`[Leaderboard] Property ${propertyId} normalized:`, normalized);
              
              if (!normalized || !normalized.id) {
                console.error(`[Leaderboard] Property ${propertyId} normalization failed or missing id`);
                return null;
              }
              
              return {
                ...normalized,
                _type: 'property' as const,
                view_count: item.view_count,
              } as UnifiedListingItem;
            }
          } catch (err: any) {
            console.error(`[Leaderboard] Error fetching ${item._type} ${item.id}:`, err);
            console.error(`[Leaderboard] Error details:`, {
              message: err?.message,
              status: err?.response?.status,
              statusText: err?.response?.statusText,
              data: err?.response?.data,
            });
            return null; // Return null for failed fetches
          }
        });

        // Use allSettled to handle partial failures gracefully
        const results = await Promise.allSettled(fetchPromises);
        console.log('[Leaderboard] Fetch results:', results);
        console.log('[Leaderboard] Total results:', results.length);
        
        // Filter out failed fetches and null results
        const successfulListings: UnifiedListingItem[] = [];
        let failedCount = 0;
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value !== null) {
            successfulListings.push(result.value);
          } else {
            failedCount++;
            if (result.status === 'rejected') {
              console.error('[Leaderboard] Fetch rejected:', result.reason);
            } else if (result.status === 'fulfilled' && result.value === null) {
              console.warn('[Leaderboard] Fetch returned null (likely failed silently)');
            }
          }
        }

        console.log('[Leaderboard] Successful listings count:', successfulListings.length);
        console.log('[Leaderboard] Failed fetches count:', failedCount);
        console.log('[Leaderboard] Successful listings:', successfulListings);
        
        // If all fetches failed but we have IDs, create minimal listings from leaderboard data
        if (successfulListings.length === 0 && failedCount > 0 && leaderboard.results.length > 0) {
          console.warn('[Leaderboard] All property fetches failed! Creating minimal listings from leaderboard data.');
          // Create minimal listings with just the data we have from leaderboard
          const minimalListings: UnifiedListingItem[] = leaderboard.results.map((item) => {
            // Create a minimal property object with just the data we have
            const minimalProperty: Property & { _type: 'property'; view_count: number } = {
              id: String(item.id),
              _type: 'property' as const,
              view_count: item.view_count,
              title: `Property ${item.id}`, // Fallback title
              description: '',
              location: '—',
              country: '',
              property_type: '',
              price: 0,
              bedrooms: 0,
              bathrooms: 0,
              area: 0,
              year_built: 0,
              parking_spaces: 0,
              lot_size: 0,
              property_status: 'unavailable',
              energy_rating: '',
              construction_material: '',
              floor_level: 0,
              total_floors: 0,
              available_from: '',
              contact_phone: '',
              contact_email: '',
              virtual_tour_url: '',
              video_url: '',
              amenities: [],
              has_units: false,
              units: [],
              owner: {
                id: String(item.id),
                username: '—',
                email: '',
              },
              is_published: false,
              created_at: '',
              updated_at: '',
              images: [],
              documents: [],
              is_favourite: false,
              latitude: undefined,
              longitude: undefined,
              url: undefined,
            };
            return minimalProperty;
          });
          
          console.log('[Leaderboard] Created minimal listings:', minimalListings);
          setCachedLeaderboard(newSignature, minimalListings);
          setListings(minimalListings);
          setError(`Warning: Could not load full property details. Showing basic information for ${minimalListings.length} properties.`);
        } else if (successfulListings.length === 0) {
          // No results and no failures - this shouldn't happen if leaderboard has results
          console.warn('[Leaderboard] No successful listings but also no failures - this is unexpected');
          setListings([]);
        } else {
          // We have successful listings
          setCachedLeaderboard(newSignature, successfulListings);
          setListings(successfulListings);
        }
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

  // Helper functions using PropertyCard/ProjectCard data structure
  const getTitle = (listing: UnifiedListingItem): string => {
    return listing._type === 'property' ? listing.title : listing.name;
  };

  const getLocation = (listing: UnifiedListingItem): string => {
    return listing.location || "—";
  };

  const getType = (listing: UnifiedListingItem): string => {
    if (listing._type === 'project') {
      return listing.property_types?.[0]?.replace("_", " ") || "—";
    }
    return (listing.property_type || "").replace("_", " ") || "—";
  };

  const getOwner = (listing: UnifiedListingItem): string => {
    if (listing._type === 'project') {
      // Project owner can be an object with name/username or just organization ID
      if (listing.owner && typeof listing.owner === 'object') {
        return listing.owner.name || listing.owner.username || listing.owner.email || "—";
      }
      return "—";
    }
    // Property owner is an Owner object
    if (listing.owner) {
      return listing.owner.username || listing.owner.email || "—";
    }
    return "—";
  };

  const formatPrice = (listing: UnifiedListingItem): string => {
    if (listing._type === 'project') {
      const salePrice = listing.sale_price_min;
      const rentPrice = listing.rent_price_min;
      if (salePrice && rentPrice) {
        return `€${Math.round(Number(salePrice)).toLocaleString()} - €${Math.round(Number(rentPrice)).toLocaleString()}`;
      } else if (salePrice) {
        return `€${Math.round(Number(salePrice)).toLocaleString()}`;
      } else if (rentPrice) {
        return `€${Math.round(Number(rentPrice)).toLocaleString()}/mo`;
      }
      return "—";
    }
    // Property pricing logic (same as PropertyCard)
    if (listing.has_units && listing.unit_price_min && listing.unit_price_max) {
      return `€${Math.round(Number(listing.unit_price_min)).toLocaleString()} - €${Math.round(Number(listing.unit_price_max)).toLocaleString()}`;
    }
    const price = Number.isFinite(Number(listing.price)) ? Number(listing.price) : 0;
    const suffix = listing.property_status !== "for_sale" ? "/mo" : "";
    return `€${price.toLocaleString()}${suffix}`;
  };

  const getUrl = (listing: UnifiedListingItem): string => {
    if (listing._type === 'project') {
      return listing.url || `/developers/project/${listing.id}`;
    }
    return listing.url || `/property/${listing.id}`;
  };

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

        {/* Excel-like Table */}
        {listings.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-slate-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Owner
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Price
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Beds
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Baths
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Area (m²)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Views
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.map((listing, index) => {
                    const rank = index + 1;
                    const listingUrl = getUrl(listing);
                    
                    return (
                      <tr
                        key={`${listing._type}-${listing.id}`}
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm">
                              {rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <Link
                            to={listingUrl}
                            className="text-sm font-medium text-gray-900 hover:text-emerald-600 transition-colors"
                          >
                            {getTitle(listing)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                          {getLocation(listing)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                          {getType(listing)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                          {getOwner(listing)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right border-r border-gray-200">
                          {formatPrice(listing)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                          {listing._type === 'property' ? (listing.bedrooms ?? "—") : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                          {listing._type === 'property' ? (listing.bathrooms ?? "—") : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right border-r border-gray-200">
                          {listing._type === 'property' ? (listing.area ? listing.area.toLocaleString() : "—") : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">
                          {listing.view_count ? listing.view_count.toLocaleString() : "0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

