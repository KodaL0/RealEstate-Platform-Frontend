import * as React from 'react';
import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Save, MapPin, Phone, Building, Globe, Camera, FileText, Loader2 } from 'lucide-react';
import { apiClient as authFetch } from '../middleware/auth';

interface ProfileData {
  name: string;
  bio: string;
  location: string;
  phone: string;
  office: string;
  avatar: string;
  website: string;
}

interface ProfileResponse {
  id?: number;
  name?: string;
  bio?: string;
  location?: string;
  phone?: string;
  office?: string;
  avatar?: string;
  website?: string;
  is_complete?: boolean;
  completion_percentage?: number;
  user_username?: string;
  user_email?: string;
}

const ProfilePage: React.FC = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  
  // Username state
  const [newUsername, setNewUsername] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // Profile form state
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    bio: '',
    location: '',
    phone: '',
    office: '',
    avatar: '',
    website: ''
  });
  
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [completionStats, setCompletionStats] = useState<{
    is_complete: boolean;
    completion_percentage: number;
    missing_fields: string[];
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      setNewUsername(user.username ?? '');
      loadProfile();
      loadCompletionStats();
    }
  }, [user, navigate]);

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const response = await authFetch.get('/api/users/get_user/');
      if (response.status === 200) {
        const profile = response.data as ProfileResponse;
        setProfileData({
          name: profile.name || '',
          bio: profile.bio || '',
          location: profile.location || '',
          phone: profile.phone || '',
          office: profile.office || '',
          avatar: profile.avatar || '',
          website: profile.website || ''
        });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Profile doesn't exist yet, keep empty form
        console.log('Profile not found, will create new one');
      } else {
        setProfileError('Failed to load profile data');
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadCompletionStats = async () => {
    // compute completion locally or ignore
    setCompletionStats(null);
  };

  if (!user) return null;

  const validateUsername = (username: string): string | null => {
    if (!username || username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    
    const regex = /^[a-z0-9_-]+$/;
    if (!regex.test(username)) {
      return 'Username can only contain lowercase letters, numbers, underscores, and hyphens';
    }
    
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone) return null; // Optional field
    const phoneRegex = /^\+?1?\d{9,15}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      return 'Please enter a valid phone number (9-15 digits)';
    }
    return null;
  };

  const validateWebsite = (website: string): string | null => {
    if (!website) return null; // Optional field
    try {
      new URL(website);
      return null;
    } catch {
      return 'Please enter a valid website URL (e.g., https://example.com)';
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setNewUsername(value);
    
    const validationMsg = validateUsername(value);
    setValidationError(validationMsg || '');
    
    if (usernameMessage) setUsernameMessage('');
    if (usernameError) setUsernameError('');
  };

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Clear messages when user starts editing
    if (profileMessage) setProfileMessage('');
    if (profileError) setProfileError('');
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameMessage('');
    
    const validationMsg = validateUsername(newUsername);
    if (validationMsg) {
      setValidationError(validationMsg);
      return;
    }
    
    try {
      const response = await authFetch.put('/api/users/profile', { 
        username: newUsername
      });
      if (response.status === 200) {
        setUsernameMessage('Username updated successfully!');
        setUser({ ...user, username: newUsername });
        setValidationError('');
      }
    } catch (err: any) {
      setUsernameError(err.response?.data?.error || 'Failed to update username.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setIsSavingProfile(true);

    // Validate fields
    const phoneError = validatePhone(profileData.phone);
    const websiteError = validateWebsite(profileData.website);
    
    if (phoneError || websiteError) {
      setProfileError(phoneError || websiteError || '');
      setIsSavingProfile(false);
      return;
    }

    try {
      const response = await authFetch.put('/api/users/profile/', profileData);
      if (response.status === 200) {
        setProfileMessage('Profile updated successfully!');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center mb-6">
          <UserIcon className="h-10 w-10 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold">Profile Management</h1>
        </div>

        {/* Profile Completion Stats */}
        {completionStats && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-bold text-blue-600">
                {completionStats.completion_percentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionStats.completion_percentage}%` }}
              ></div>
            </div>
            {completionStats.missing_fields.length > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                Missing: {completionStats.missing_fields.join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Username Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Username
            </h2>
            
            {usernameMessage && <p className="text-green-600 mb-4">{usernameMessage}</p>}
            {usernameError && <p className="text-red-600 mb-4">{usernameError}</p>}
            
            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Current: <span className="font-normal text-blue-600">{user.username}</span>
                </label>
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={handleUsernameChange}
                  className={`border rounded w-full p-3 ${validationError ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter new username"
                />
                {validationError && (
                  <p className="text-red-500 text-sm mt-1">{validationError}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Lowercase letters, numbers, underscores, and hyphens only
                </p>
              </div>
              <button 
                type="submit" 
                disabled={!!validationError || !newUsername.trim()}
                className={`w-full font-bold py-2 px-4 rounded transition-colors ${
                  validationError || !newUsername.trim()
                    ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Update Username
              </button>
            </form>
          </div>

          {/* Profile Information Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Profile Information
            </h2>
            
            {profileMessage && <p className="text-green-600 mb-4">{profileMessage}</p>}
            {profileError && <p className="text-red-600 mb-4">{profileError}</p>}
            
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading profile...</span>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="border border-gray-300 rounded w-full p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium text-gray-700 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location
                  </label>
                  <input 
                    type="text" 
                    value={profileData.location}
                    onChange={(e) => handleProfileChange('location', e.target.value)}
                    className="border border-gray-300 rounded w-full p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium text-gray-700 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="border border-gray-300 rounded w-full p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium text-gray-700 flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    Office/Workplace
                  </label>
                  <input 
                    type="text" 
                    value={profileData.office}
                    onChange={(e) => handleProfileChange('office', e.target.value)}
                    className="border border-gray-300 rounded w-full p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Company or office name"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSavingProfile}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Extended Profile Section */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Bio</label>
              <textarea 
                value={profileData.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                className="border border-gray-300 rounded w-full p-3 h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{profileData.bio.length}/500 characters</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-medium text-gray-700 flex items-center">
                  <Camera className="h-4 w-4 mr-1" />
                  Avatar URL
                </label>
                <input 
                  type="url" 
                  value={profileData.avatar}
                  onChange={(e) => handleProfileChange('avatar', e.target.value)}
                  className="border border-gray-300 rounded w-full p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700 flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  Website
                </label>
                <input 
                  type="url" 
                  value={profileData.website}
                  onChange={(e) => handleProfileChange('website', e.target.value)}
                  className="border border-gray-300 rounded w-full p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
