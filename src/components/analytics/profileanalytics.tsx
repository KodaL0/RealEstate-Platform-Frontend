import {
  Eye,
  Heart,
  MessageCircle,
  Users,
  Home,
  Share2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import api from "../../config/api";

interface SummaryData {
  total_properties: number;
  published_properties: number;
  unpublished_properties: number;
  total_views: number;
  unique_viewers: number;
  net_favorites: number;
  total_shares: number;
  total_contacts: number;
  conversion_rate: number;
  avg_views_per_property: number;
  profile_views: number;
  profile_unique_visitors: number;
}

interface TopProperty {
  property__id: number;
  property__title: string;
  property__property_type: string;
  property__property_status: string;
  views: number;
}

interface AnalyticsResponse {
  period_days: number;
  summary: SummaryData;
  top_properties: TopProperty[];
  message?: string;
}

const ProfileAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.analytics.myListingsSummary(days);
      setData(response.data as AnalyticsResponse);
    } catch (err: unknown) {
      console.error("Failed to fetch analytics:", err);
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 403) {
          setError("You do not have permission to view analytics.");
        } else {
          setError("Failed to load analytics. Please try again.");
        }
      } else {
        setError("Failed to load analytics. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-1">Error Loading Analytics</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.message) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">{data?.message || "No analytics data available"}</p>
      </div>
    );
  }

  const { summary, top_properties } = data;

  const statCards = [
    {
      title: "Total Properties",
      value: summary.total_properties,
      icon: Home,
      color: "bg-blue-500",
      subtitle: `${summary.published_properties} published, ${summary.unpublished_properties} unpublished`,
    },
    {
      title: "Property Views",
      value: summary.total_views.toLocaleString(),
      icon: Eye,
      color: "bg-purple-500",
      subtitle: `${summary.unique_viewers} unique viewers`,
    },
    {
      title: "Profile Views",
      value: summary.profile_views.toLocaleString(),
      icon: Users,
      color: "bg-indigo-500",
      subtitle: `${summary.profile_unique_visitors} unique visitors`,
    },
    {
      title: "Favorites",
      value: summary.net_favorites.toLocaleString(),
      icon: Heart,
      color: "bg-pink-500",
      subtitle: "Net favorites",
    },
    {
      title: "Shares",
      value: summary.total_shares.toLocaleString(),
      icon: Share2,
      color: "bg-green-500",
      subtitle: "Total shares",
    },
    {
      title: "Contacts",
      value: summary.total_contacts.toLocaleString(),
      icon: MessageCircle,
      color: "bg-yellow-500",
      subtitle: `${summary.conversion_rate}% conversion rate`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Time Period:</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className={`${stat.color} p-4`}>
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-white" />
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{stat.title}</p>
                    <p className="text-white text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <p className="text-sm text-gray-600">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Average Views per Property</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.avg_views_per_property.toFixed(1)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">{summary.conversion_rate}%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Published Properties</p>
            <p className="text-2xl font-bold text-gray-900">{summary.published_properties}</p>
          </div>
        </div>
      </div>

      {/* Top Properties */}
      {top_properties && top_properties.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performing Properties</h2>
          <div className="space-y-2">
            {top_properties.map((prop, index) => (
              <div
                key={prop.property__id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{prop.property__title}</p>
                    <p className="text-sm text-gray-500">
                      {prop.property__property_type} • {prop.property__property_status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-gray-400" />
                  <span className="font-bold text-gray-900">{prop.views}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAnalytics;

