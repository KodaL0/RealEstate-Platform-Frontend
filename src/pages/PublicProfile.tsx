import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Home, User, AlertCircle, MessageCircle, Heart, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import PropertyCard from '../components/PropertyCard';
import { normalizePropertyData, Property } from '../types';
import api from '../config/api';

// Types for profile, posts, and properties
interface PublicProfileData {
  username: string;
  date_joined: string;
  properties_count: number;
  published_properties: any[];
}

interface Post {
  id: string;
  title?: string;
  content: string;
  created_at: string;
  author: string;
}

const normalizePostData = (data: any): Post => ({
  id: data.id,
  title: data.title || undefined,
  content: data.content,
  created_at: data.created_at,
  author: data.author_username || data.author || '',
});

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      navigate('/404');
      return;
    }

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      setError(null);
      try {
        const response = await api.auth.getPublicProfile(username);
        const data = response.data;

        if (data.status === 200 && data.profile) {
          setProfileData(data.profile);
          // Normalize properties
          const normalizedProps = data.profile.published_properties.map(normalizePropertyData);
          setProperties(normalizedProps);
        } else {
          setError('Profile not found');
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        if (err.response?.status === 404) {
          setError('Profile not found');
        } else {
          setError('Failed to load profile. Please try again.');
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const resp = await api.posts.getUserPosts(username);
        const data = resp.data;
        if (data.status === 200 && Array.isArray(data.posts)) {
          const normalized = data.posts.map(normalizePostData);
          normalized.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setPosts(normalized);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchProfile();
    fetchPosts();
  }, [username, navigate]);

  useEffect(() => {
    if (profileData) {
      document.title = `${profileData.username} - Profile | MySocialApp`;
    }
    return () => {
      document.title = 'MySocialApp';
    };
  }, [profileData]);

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleNewPostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      setPostError('Content cannot be empty');
      return;
    }
    setIsSubmitting(true);
    setPostError(null);
    try {
      const payload: any = { content: newPostContent };
      if (newPostTitle.trim()) {
        payload.title = newPostTitle;
      }
      const resp = await api.posts.createPost(payload);
      const created = resp.data.post;
      const normalized = normalizePostData(created);
      setPosts(prev => [normalized, ...prev]);
      setNewPostTitle('');
      setNewPostContent('');
    } catch (err: any) {
      console.error('Error creating post:', err);
      setPostError('Failed to submit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="h-12 w-12 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {profileData.username}
              </h1>
              <div className="flex items-center justify-center text-white/90 mb-4">
                <Calendar className="h-5 w-5 mr-2" />
                <span>Member since {formatJoinDate(profileData.date_joined)}</span>
              </div>
              <div className="flex items-center justify-center text-white/90">
                <Home className="h-5 w-5 mr-2" />
                <span>
                  {profileData.properties_count} {profileData.properties_count === 1 ? 'listing' : 'listings'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Properties Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Published Listings</h2>
            <p className="text-gray-600">
              {profileData.properties_count === 0
                ? `${profileData.username} has no published listings yet.`
                : `Showing ${profileData.properties_count} ${profileData.properties_count === 1 ? 'property' : 'properties'} by ${profileData.username}`
              }
            </p>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-16">
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Published Listings</h3>
              <p className="text-gray-600">This user has no published listings yet.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
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
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* New Post Section */}
      <section className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-md"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <Edit className="h-5 w-5 mr-2 text-gray-600" /> Create Post
          </h2>
          <form onSubmit={handleNewPostSubmit}>
            <input
              type="text"
              placeholder="Title (optional, for articles)"
              value={newPostTitle}
              onChange={e => setNewPostTitle(e.target.value)}
              className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
              rows={4}
              className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {postError && <p className="text-red-500 mb-2">{postError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </motion.div>
      </section>

      {/* Posts Feed */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Posts</h2>
        {isLoadingPosts ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Posts Yet</h3>
            <p className="text-gray-600">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bg-white p-6 rounded-2xl shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{post.author}</p>
                      <p className="text-gray-500 text-sm">{formatDateTime(post.created_at)}</p>
                    </div>
                  </div>
                  {post.title && <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>}
                  <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>
                  <div className="flex items-center space-x-6 text-gray-500">
                    <button className="flex items-center space-x-1 hover:text-red-500">
                      <Heart className="h-5 w-5" /> <span>Like</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-blue-500">
                      <MessageCircle className="h-5 w-5" /> <span>Comment</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PublicProfile;
