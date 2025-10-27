import React, { useState, useEffect } from 'react';
import { BarChart3, Eye, Users, Phone, Mail, MessageCircle, TrendingUp, X, Heart } from 'lucide-react';
import api from '../../config/api';

interface PropertyAnalyticsProps {
  propertyId: number | string;
  onClose?: () => void;
}

interface AnalyticsData {
  property_id: number;
  property_title: string;
  property_status: string;
  is_published: boolean;
  period_days: string | number;
  analytics: {
    total_views: number;
    unique_viewers: number;
    anonymous_views: number;
    total_contacts: number;
    phone_clicks: number;
    email_clicks: number;
    chat_clicks: number;
    conversion_rate: number;
    favorites: number;
    unfavorites: number;
    net_favorites: number;
  };
  permissions: {
    is_owner: boolean;
    is_admin: boolean;
  };
}

const PropertyAnalytics: React.FC<PropertyAnalyticsProps> = ({ propertyId, onClose }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [propertyId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all-time analytics (no days parameter)
      const response = await api.get(`/analytics/property/${propertyId}/`);
      setAnalytics(response.data);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to view analytics for this property.');
      } else if (err.response?.status === 404) {
        setError('Property not found.');
      } else {
        setError('Failed to load analytics. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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

  if (!analytics) return null;

  const { analytics: data } = analytics;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Property Analytics</h2>
              <p className="text-sm text-purple-100">{analytics.property_title}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center space-x-2 text-sm text-purple-100">
          <span className="px-2 py-1 bg-white/20 rounded-md">
            {analytics.period_days === 'all_time' ? 'All Time' : `Last ${analytics.period_days} days`}
          </span>
          <span className={`px-2 py-1 rounded-md ${
            analytics.is_published 
              ? 'bg-emerald-500/20 text-emerald-100' 
              : 'bg-red-500/20 text-red-100'
          }`}>
            {analytics.is_published ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Views */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-700">{data.total_views}</span>
            </div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Total Views</h3>
            <p className="text-xs text-blue-600">
              {data.unique_viewers} unique, {data.anonymous_views} anonymous
            </p>
          </div>

          {/* Unique Viewers */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-5 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-emerald-700">{data.unique_viewers}</span>
            </div>
            <h3 className="text-sm font-semibold text-emerald-900 mb-1">Unique Viewers</h3>
            <p className="text-xs text-emerald-600">
              Registered users who viewed
            </p>
          </div>

          {/* Total Contacts */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-orange-700">{data.total_contacts}</span>
            </div>
            <h3 className="text-sm font-semibold text-orange-900 mb-1">Total Contacts</h3>
            <p className="text-xs text-orange-600">
              People reached out
            </p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-purple-700">{data.conversion_rate}%</span>
            </div>
            <h3 className="text-sm font-semibold text-purple-900 mb-1">Conversion Rate</h3>
            <p className="text-xs text-purple-600">
              Views to contacts
            </p>
          </div>

          {/* Net Favorites */}
          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-5 border border-rose-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-rose-700">{data.net_favorites}</span>
            </div>
            <h3 className="text-sm font-semibold text-rose-900 mb-1">Favorites</h3>
            <p className="text-xs text-rose-600">
              {data.favorites} added, {data.unfavorites} removed
            </p>
          </div>
        </div>

        {/* Contact Breakdown */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            Contact Method Breakdown
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Phone Clicks */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Phone Clicks</p>
                <p className="text-lg font-bold text-gray-900">{data.phone_clicks}</p>
              </div>
            </div>

            {/* Email Clicks */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Email Clicks</p>
                <p className="text-lg font-bold text-gray-900">{data.email_clicks}</p>
              </div>
            </div>

            {/* Chat Clicks */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Chat Started</p>
                <p className="text-lg font-bold text-gray-900">{data.chat_clicks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        {data.total_views > 0 && (
          <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Insights</h3>
            <div className="space-y-2 text-sm">
              {data.conversion_rate >= 5 ? (
                <p className="text-green-700">
                  ✨ Great! Your conversion rate of {data.conversion_rate}% is above average (typical is 2-5%).
                </p>
              ) : data.conversion_rate > 0 ? (
                <p className="text-blue-700">
                  Your conversion rate is {data.conversion_rate}%. Consider improving property photos or description to increase engagement.
                </p>
              ) : (
                <p className="text-gray-700">
                  No contacts yet. Make sure your contact information is clearly visible and property details are complete.
                </p>
              )}
              
              {data.anonymous_views > data.unique_viewers && (
                <p className="text-gray-600">
                  💡 Most viewers are anonymous. Encourage sign-ups to track user journeys better.
                </p>
              )}
            </div>
          </div>
        )}

        {data.total_views === 0 && (
          <div className="mt-6 bg-amber-50 rounded-xl p-5 border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>No views yet.</strong> Your property was just listed or needs more visibility. 
              Consider promoting it or checking that it's published.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyAnalytics;

