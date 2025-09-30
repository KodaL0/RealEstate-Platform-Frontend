import React, { useState, useEffect } from 'react';
import './PublicProfile.css';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Home, User, AlertCircle, 
  Star, MapPin, Mail, Phone, Globe, 
  Clock, ThumbsUp, Send, UserPlus, Flag, 
  Bookmark, CheckCircle, Copy
} from 'lucide-react';
import { motion } from 'framer-motion';
import PropertyCard from '../components/cards/PropertyCard';
import ReviewForm from '../components/ReviewForm';
import { normalizePropertyData, Property, PublicProfileData, Review, ReviewStats, CanReviewResponse } from '../types';
import api from '../config/api';
import { useChat } from '../context/ChatContext';
import LLMProfileData from '../components/llm-profile';

const formatDateOnly = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { getOrCreateDmThread } = useChat();
  
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [canReview, setCanReview] = useState<CanReviewResponse | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [overallReviewsCount, setOverallReviewsCount] = useState<number | null>(null);
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);
  
  // Cache connection data to avoid repeated API calls
  const [connectionCache, setConnectionCache] = useState<{
    connections: any[];
    pendingSent: any[];
    pendingReceived: any[];
    lastUpdated: number;
  } | null>(null);


  const sidebarTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'listings', label: 'Listings', icon: Home },
    { id: 'reviews', label: 'Reviews', icon: Star },
    // { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    // { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'contact', label: 'Contact Info', icon: Mail },
  ];

  useEffect(() => {
    if (!username) {
      navigate('/404');
      return;
    }

    const fetchProfile = async () => {
      console.log('PublicProfile: Starting to fetch profile data for username:', username);
      setIsLoadingProfile(true);
      setError(null);
      try {
        // Fetch profile data
        console.log('PublicProfile: Calling api.auth.getPublicProfile with username:', username);
        const response = await api.auth.getPublicProfile(username);
        console.log('PublicProfile: API response received:', response);
        const data = response.data;
        console.log('PublicProfile: Response data:', data);

        if (data.status === 200 && data.profile) {
          console.log('PublicProfile: Profile data received:', data.profile);
          console.log('PublicProfile: Initial connection status from API:', data.profile.connection_status);
          console.log('PublicProfile: Profile fields check:', {
            name: data.profile.name,
            bio: data.profile.bio,
            location: data.profile.location,
            office: data.profile.office,
            avatar: data.profile.avatar,
            website: data.profile.website
          });
          
          // Set initial profile data
          let profileData = data.profile;
          
          // Also check connections directly to get accurate connection status
          const actualStatus = await checkActualConnectionStatus(profileData.username);
          if (actualStatus !== 'none') {
            // Override the connection status with the correct one
            profileData = {...profileData, connection_status: actualStatus};
            console.log(`Corrected connection status to ${actualStatus} on initial load`);
          }
          
          setProfileData(profileData);
          // Normalize properties
          const normalizedProps = profileData.published_properties.map(normalizePropertyData);
          setProperties(normalizedProps);
          
          // Fetch lightweight overall rating
          try {
            const ratingResp = await api.reviews.getUserOverallRating(profileData.id);
            const ratingData = ratingResp.data;
            setOverallRating(ratingData.average_rating);
            setOverallReviewsCount(ratingData.reviews_received_count);
          } catch (ratingErr) {
            console.error('Error fetching overall rating:', ratingErr);
          }
          
          // NOTE: We defer fetching full reviews until the Reviews tab is opened
          // Check if current user can review this profile (needed on reviews tab)
          checkCanReview(profileData.id);
        } else {
          console.log('PublicProfile: Invalid response structure - no profile data found');
          console.log('PublicProfile: Full response structure:', data);
          setError('Profile not found');
        }
      } catch (err: any) {
        console.error('PublicProfile: Error fetching profile:', err);
        console.error('PublicProfile: Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          config: err.config
        });
        if (err.response?.status === 404) {
          setError('Profile not found');
        } else {
          setError('Failed to load profile. Please try again.');
        }
      } finally {
        console.log('PublicProfile: Profile loading completed');
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [username, navigate]);

  useEffect(() => {
    if (profileData) {
      document.title = `${profileData.username} - Profile | PROPERTPRO`;
    }
    return () => {
      document.title = 'PROPERTPRO Media';
    };
  }, [profileData]);

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Cache connection data for 30 seconds to avoid repeated API calls
  const getConnectionData = async () => {
    const now = Date.now();
    const cacheExpiry = 30000; // 30 seconds
    
    if (connectionCache && (now - connectionCache.lastUpdated) < cacheExpiry) {
      return connectionCache;
    }
    
    try {
      const [connectionsRes, pendingSentRes, pendingReceivedRes] = await Promise.all([
        api.connections.getMyConnections(),
        api.connections.getPendingSentRequests(),
        api.connections.getPendingRequests()
      ]);
      
      const newCache = {
        connections: connectionsRes.data,
        pendingSent: pendingSentRes.data,
        pendingReceived: pendingReceivedRes.data,
        lastUpdated: now
      };
      
      setConnectionCache(newCache);
      return newCache;
    } catch (error) {
      console.error('Error fetching connection data:', error);
      return connectionCache; // Return old cache if available
    }
  };

  const checkActualConnectionStatus = async (targetUsername: string): Promise<string> => {
    try {
      // Use cached connection data to avoid repeated API calls
      const connectionData = await getConnectionData();
      
      if (!connectionData) {
        return 'none';
      }
      
      // Check if user is in our accepted connections
      const isConnected = connectionData.connections.some((conn: any) => 
        conn.user.username === targetUsername
      );
      
      if (isConnected) {
        console.log(`Direct connection check for ${targetUsername}: connected`);
        return 'connected';
      }
      
      // Check if we have a pending request TO this user (requests we sent)
      const hasPendingSentToThem = connectionData.pendingSent.some((req: any) => 
        req.to_user_username === targetUsername
      );
      
      if (hasPendingSentToThem) {
        console.log(`Direct connection check for ${targetUsername}: pending_sent`);
        return 'pending_sent';
      }
      
      // Check if we have a pending request FROM this user (requests sent to us)
      const hasPendingFromThem = connectionData.pendingReceived.some((req: any) => 
        req.from_user_username === targetUsername
      );
      
      if (hasPendingFromThem) {
        console.log(`Direct connection check for ${targetUsername}: pending_received`);
        return 'pending_received';
      }
      
      console.log(`Direct connection check for ${targetUsername}: none`);
      return 'none';
    } catch (error) {
      console.error('Error checking actual connection status:', error);
      return 'none';
    }
  };

  const refreshConnectionStatus = async () => {
    if (!profileData) return;
    
    try {
      console.log('Refreshing connection status...');
      
      // Invalidate connection cache to get fresh data
      setConnectionCache(null);
      
      // First get the latest status from the API
      const response = await api.auth.getPublicProfile(username!);
      const data = response.data;
      
      if (data.status === 200 && data.profile) {
        console.log('New connection status after refresh:', data.profile.connection_status);
        
        let finalStatus = data.profile.connection_status;
        
        // Only override with direct checks if the API says 'none' but we have a different actual status
        if (finalStatus === 'none') {
          const actualStatus = await checkActualConnectionStatus(profileData.username);
          if (actualStatus !== 'none') {
            finalStatus = actualStatus;
            console.log(`Corrected none status to ${actualStatus} via direct API checks`);
          }
        }
        
        // Update profile with the correct status
        setProfileData({...data.profile, connection_status: finalStatus});
        console.log('Final connection status set to:', finalStatus);
      }
    } catch (error) {
      console.error('Error refreshing connection status:', error);
    }
  };

  const handleConnectionAction = async () => {
    if (!profileData || isConnecting) return;
    
    // Prevent action if already connected or request already sent
    if (profileData.connection_status === 'connected' || profileData.connection_status === 'pending_sent') {
      console.log('Action blocked - already connected or pending');
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const status = profileData.connection_status;
      console.log('Current connection status before action:', status);
      
      if (status === 'none' || status === 'rejected') {
        // Send connection request
        console.log('Sending connection request...');
        const response = await api.connections.sendRequest(profileData.id);
        console.log('Connection request response:', response);
        console.log('Response data:', response.data);
        
        // Immediately update UI to show pending status (optimistic update)
        setProfileData(prev => prev ? {...prev, connection_status: 'pending_sent'} : null);
        console.log('Optimistically updated to pending_sent');
        
        // Invalidate connection cache since we made a change
        setConnectionCache(null);
        
        // Don't refresh immediately - let the optimistic update persist
        // The user will see "Request Sent" which is accurate
        console.log('Keeping optimistic pending_sent status - not refreshing immediately');
        
      } else if (status === 'pending_received') {
        // Accept pending request
        console.log('Auto-accepting pending connection...');
        const response = await api.connections.sendRequest(profileData.id);
        console.log('Auto-accept response:', response);
        
        // Optimistically update to connected
        setProfileData(prev => prev ? {...prev, connection_status: 'connected'} : null);
        console.log('Optimistically updated to connected');
        
        // Invalidate connection cache since we made a change
        setConnectionCache(null);
        
        // Add a delay and then refresh to confirm
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshConnectionStatus();
      }
    } catch (error) {
      console.error('Error handling connection:', error);
      setError('Failed to update connection. Please try again.');
      // Revert optimistic update on error
      await refreshConnectionStatus();
    } finally {
      setIsConnecting(false);
    }
  };

  const getConnectionButtonText = () => {
    if (!profileData) return 'Connect';
    
    switch (profileData.connection_status) {
      case 'connected':
        return 'Connected';
      case 'pending_sent':
        return 'Request Sent';
      case 'pending_received':
        return 'Accept Request';
      case 'rejected':
        return 'Connect';
      case 'none':
        return 'Connect';
      default:
        return 'Connect';
    }
  };

  const getConnectionButtonIcon = () => {
    if (!profileData) return UserPlus;
    
    switch (profileData.connection_status) {
      case 'connected':
        return CheckCircle;
      case 'pending_sent':
        return Clock;
      case 'pending_received':
        return CheckCircle;
      default:
        return UserPlus;
    }
  };

  const handleToggleHelpful = async (reviewId: number, isHelpful: boolean) => {
    try {
      await api.reviews.toggleHelpful(reviewId, isHelpful);
      // Refresh reviews to show updated helpful count
      if (profileData) {
        fetchReviews(profileData.id);
      }
    } catch (error) {
      console.error('Error toggling helpful vote:', error);
    }
  };

  const handleReportReview = async (reviewId: number) => {
    const reason = prompt('Please select a reason for reporting this review:\n1. Spam\n2. Fake Review\n3. Inappropriate Content\n4. Harassment\n5. Other');
    if (!reason) return;
    
    try {
      await api.reviews.reportReview(reviewId, reason.toLowerCase());
      alert('Review reported successfully');
    } catch (error) {
      console.error('Error reporting review:', error);
      alert('Failed to report review');
    }
  };

  const fetchReviews = async (userId: number) => {
    setIsLoadingReviews(true);
    try {
      const [reviewsResponse, statsResponse] = await Promise.all([
        api.reviews.getUserReviews(userId),
        api.reviews.getUserStats(userId)
      ]);
      
      setReviews(reviewsResponse.data);
      setReviewStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoadingReviews(false);
      setHasLoadedReviews(true);
    }
  };

  const checkCanReview = async (userId: number) => {
    try {
      const response = await api.reviews.canReviewUser(userId);
      setCanReview(response.data);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const handleReviewSuccess = () => {
    // Refresh reviews and check can review status
    if (profileData) {
      fetchReviews(profileData.id);
      checkCanReview(profileData.id);
    }
  };

  const renderStarRating = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* LLM structured data for AI agents and search engines */}
            {profileData && (
              <LLMProfileData 
                user={profileData} 
                propertiesCount={profileData.properties_count}
              />
            )}
            
            {/* Bio Section */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                About {profileData?.name || profileData?.username}
              </h3>
              {profileData?.bio ? (
                <p className="text-gray-700 leading-relaxed mb-4">{profileData.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No bio available</p>
              )}
              {/*
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {enhancedProfile.specializations.map((spec, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
              <div> 
                <h4 className="font-semibold text-gray-900 mb-2">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {enhancedProfile.languages.map((lang, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Certifications</h4>
              <div className="space-y-2">
                {enhancedProfile.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <Award className="h-4 w-4 mr-2 text-yellow-600" />
                    {cert}
                  </div>
                ))}
              </div> */}
            </div>
             

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{profileData?.properties_count || 0}</div>
                <div className="text-gray-600 text-xs sm:text-sm">Active Listings</div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md text-center">
                <div className="text-xl sm:text-2xl font-bold text-pink-600">{profileData?.connections_count || 0}</div>
                <div className="text-gray-600 text-xs sm:text-sm">Connections</div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md text-center sm:col-span-1 col-span-2">
                <div className="text-xl sm:text-2xl font-bold text-indigo-600">{profileData?.mutual_connections_count || 0}</div>
                <div className="text-gray-600 text-xs sm:text-sm">Mutual Connections</div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md text-center">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{overallRating !== null ? overallRating.toFixed(1) : 'N/A'}</div>
                <div className="text-gray-600 text-xs sm:text-sm">Avg Rating</div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{overallReviewsCount ?? 'N/A'}</div>
                <div className="text-gray-600 text-xs sm:text-sm">Total Reviews</div>
              </div>
            </div>


          </div>
        );

      case 'listings':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Home className="h-5 w-5 mr-2 text-blue-600" />
                  Published Listings ({profileData?.properties_count || 0})
                </h3>
              </div>

              {properties.length === 0 ? (
                <div className="text-center py-16">
                  <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">No Published Listings</h4>
                  <p className="text-gray-600">This user has no published listings yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {properties.map((property, index) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                    >
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-6">
            {/* Review Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-600" />
                Reviews & Ratings
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    {reviewStats?.average_rating?.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex justify-center mb-2">
                    {renderStarRating(reviewStats?.average_rating || 0, 'md')}
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base">Overall Rating</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    {reviewStats?.reviews_received_count || 0}
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base">Total Reviews</p>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewStats?.rating_distribution[rating.toString()] || 0;
                  const totalReviews = reviewStats?.reviews_received_count || 1;
                  const percentage = (count / totalReviews) * 100;
                  return (
                    <div key={rating} className="flex items-center space-x-3">
                      <span className="text-sm font-medium w-8">{rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-10">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4">
              {isLoadingReviews ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-16">
                  <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h4>
                  <p className="text-gray-600">
                    This user hasn't received any reviews yet.
                    {canReview?.can_review && " Be the first to write one!"}
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                <div key={review.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm sm:text-base">
                        {review.reviewer.username.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{review.reviewer.username}</h4>
                          {review.is_verified && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="text-xs">Verified</span>
                            </div>
                          )}
                        </div>
                        <span className="text-gray-500 text-xs sm:text-sm">{formatDateOnly(review.created_at)}</span>
                      </div>
                      {review.title && (
                        <h5 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{review.title}</h5>
                      )}
                      <div className="flex items-center mb-3">
                        {renderStarRating(review.overall_rating)}
                        <span className="ml-2 text-xs sm:text-sm text-gray-600">({review.overall_rating}/5)</span>
                      </div>
                      <p className="text-gray-700 mb-3 text-sm sm:text-base">{review.content}</p>
                      {review.interaction_context && (
                        <p className="text-xs sm:text-sm text-gray-500 mb-3 italic">Context: {review.interaction_context}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <button 
                          onClick={() => handleToggleHelpful(review.id, true)}
                          className="flex items-center hover:text-blue-600 p-1"
                        >
                          <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Helpful ({review.helpful_count})
                        </button>
                        <button 
                          onClick={() => handleReportReview(review.id)}
                          className="flex items-center hover:text-red-600 p-1"
                        >
                          <Flag className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Report
                        </button>
                      </div>
                      {review.response && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center mb-2">
                            <h6 className="font-medium text-gray-900">Response from {profileData?.username}</h6>
                            <span className="ml-auto text-xs text-gray-500">
                              {formatDateOnly(review.response.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.response.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        );

    /*  case 'analytics':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Profile Analytics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Profile Views</p>
                      <p className="text-2xl font-bold text-blue-900">{mockAnalytics.profileViews.toLocaleString()}</p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600">+12% this month</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Listings Viewed</p>
                      <p className="text-2xl font-bold text-green-900">{mockAnalytics.listingsViewed.toLocaleString()}</p>
                    </div>
                    <Home className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600">+18% this month</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Messages Received</p>
                      <p className="text-2xl font-bold text-purple-900">{mockAnalytics.messagesReceived}</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600">+8% this month</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 text-sm font-medium">Total Likes</p>
                      <p className="text-2xl font-bold text-yellow-900">{mockAnalytics.totalLikes}</p>
                    </div>
                    <Heart className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600">+25% this month</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-600 text-sm font-medium">Response Rate</p>
                      <p className="text-2xl font-bold text-indigo-900">{mockAnalytics.responseRate}%</p>
                    </div>
                    <Target className="h-8 w-8 text-indigo-500" />
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-blue-600">Avg: {mockAnalytics.avgResponseTime}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-600 text-sm font-medium">Connections</p>
                      <p className="text-2xl font-bold text-pink-900">{profileData?.connections_count || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-pink-500" />
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600">+{mockAnalytics.monthlyGrowth}% growth</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ); 

             case 'activity':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Recent Activity Log
              </h3>
              
              <div className="space-y-4">
                {mockActivities.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'listing' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'review' ? 'bg-yellow-100 text-yellow-600' :
                        activity.type === 'profile' ? 'bg-purple-100 text-purple-600' :
                        activity.type === 'message' ? 'bg-green-100 text-green-600' :
                        activity.type === 'post' ? 'bg-indigo-100 text-indigo-600' :
                        activity.type === 'connection' ? 'bg-pink-100 text-pink-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-gray-600 text-sm">{activity.details}</p>
                        <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ); */

      case 'contact':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                Contact Information
              </h3>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  {profileData?.website && (
                    <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">Website</p>
                        <a 
                          href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm sm:text-base break-all"
                        >
                          {profileData.website}
                        </a>
                      </div>
                      <button className="ml-auto p-2 hover:bg-gray-200 rounded-lg flex-shrink-0">
                        <Copy className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  )}

                  {profileData?.office && (
                    <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">Office</p>
                        <p className="text-gray-600 text-sm sm:text-base">{profileData.office}</p>
                      </div>
                      <button className="ml-auto p-2 hover:bg-gray-200 rounded-lg flex-shrink-0">
                        <Copy className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  )}

                  {profileData?.phone && (
                    <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">Phone</p>
                        <p className="text-gray-600 text-sm sm:text-base">{profileData.phone}</p>
                      </div>
                      <button className="ml-auto p-2 hover:bg-gray-200 rounded-lg flex-shrink-0">
                        <Copy className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  )}

                  <div className="text-center py-4 text-gray-500">
                    <p className="text-xs sm:text-sm">
                      For direct contact, use the "Message" button above or connect with this user.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Lazy-load reviews when the Reviews tab is opened
  useEffect(() => {
    if (activeTab === 'reviews' && profileData && !hasLoadedReviews) {
      fetchReviews(profileData.id);
    }
  }, [activeTab, profileData, hasLoadedReviews]);

  if (isLoadingProfile) {
    return (
      <div className="pt-20 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error === 'Profile not found' ? 'Profile Not Found' : 'Error Loading Profile'}
            </h1>
            <p className="text-gray-600 mb-6">
              {error === 'Profile not found'
                ? "The user profile you're looking for doesn't exist."
                : error
              }
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <section className="py-6 sm:py-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center space-y-6"
          >
            {/* Profile Info */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {profileData.name || profileData.username}
                  </h1>
                  {profileData.name && (
                    <span className="text-white/70 text-base sm:text-lg">@{profileData.username}</span>
                  )}
                </div>
                <div className="flex items-center justify-center text-white/90 text-sm sm:text-base">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{profileData?.location || 'Location not specified'}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4 text-white/90 text-sm sm:text-base">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                    <span>{overallRating !== null ? overallRating.toFixed(1) : 'N/A'} ({overallReviewsCount ?? '0'} reviews)</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Since {formatJoinDate(profileData.date_joined)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
              <button 
                onClick={async () => {
                  try {
                    const threadId = await getOrCreateDmThread(profileData.id);
                    navigate(`/chat/${threadId}`);
                  } catch (error) {
                    console.error('Error creating DM thread:', error);
                  }
                }}
                className="flex-1 min-w-[120px] px-4 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                <Send className="h-4 w-4 mr-2" />
                Message
              </button>
              
              {/* Write Review Button - Only show if user can review */}
              {canReview?.can_review && (
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="flex-1 min-w-[120px] px-4 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center text-sm sm:text-base"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Write Review
                </button>
              )}
              
              <button 
                onClick={handleConnectionAction}
                disabled={isConnecting || profileData?.connection_status === 'connected' || profileData?.connection_status === 'pending_sent'}
                className={`flex-1 min-w-[120px] px-4 py-3 font-semibold rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base ${
                  profileData?.connection_status === 'connected'
                    ? 'bg-green-500 text-white cursor-default'
                    : profileData?.connection_status === 'pending_sent'
                    ? 'bg-gray-400 text-white cursor-default'
                    : profileData?.connection_status === 'pending_received'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                } ${isConnecting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isConnecting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2" />
                ) : (
                  React.createElement(getConnectionButtonIcon(), { className: "h-4 w-4 mr-2" })
                )}
                {isConnecting ? 'Processing...' : getConnectionButtonText()}
              </button>
              
              <button className="px-4 py-3 bg-blue-500/20 text-white rounded-lg hover:bg-blue-500/30 transition-colors">
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Mobile Tab Navigation */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-xl shadow-md p-2">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {sidebarTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors min-w-[80px] ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <nav className="space-y-2">
                {sidebarTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-3/4">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Review Form Modal */}
      {profileData && (
        <ReviewForm
          reviewee={{
            id: profileData.id,
            username: profileData.username,
            email: '' // Not needed for the form
          }}
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};

export default PublicProfile;
