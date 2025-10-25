import * as React from 'react';
import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, Save, MapPin, Phone, Building, FileText, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import api from '../config/api';

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
  };
}

const ProfilePage: React.FC = () => {
  const { user, updateUserData } = useUser();
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

  useEffect(() => {
    console.log('ProfilePage useEffect triggered:', { user: user?.username, hasUser: !!user });
    if (!user) {
      console.log('No user found, navigating to auth');
      navigate('/auth');
    } else {
      console.log('Setting initial username:', user.username);
      // Set initial username from UserContext, but it will be updated by loadProfile
      setNewUsername(user.username ?? '');
      loadProfile();
    }
  }, [user, navigate]);

  const loadProfile = async () => {
    console.log('Loading profile data...');
    setIsLoadingProfile(true);
    try {
      const response = await api.auth.getUser();
      console.log('Profile API response:', response);
      
      if (response.status === 200) {
        const data = response.data as UserResponse;
        const userData = data.user;
        console.log('User data received:', userData);
        
        // Update username from API response (this is the key fix!)
        if (userData.username) {
          console.log('Setting username from API:', userData.username);
          setNewUsername(userData.username);
        }
        
        const profileDataToSet = {
          name: userData.name || '',
          bio: userData.bio || '',
          location: userData.location || '',
          phone: userData.phone || '',
          office: userData.office || '',
          avatar: userData.avatar || '',
          website: userData.website || ''
        };
        
        console.log('Setting profile data:', profileDataToSet);
        setProfileData(profileDataToSet);
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setProfileError('Failed to load profile data');
    } finally {
      setIsLoadingProfile(false);
      console.log('Profile loading completed');
    }
  };

  console.log('ProfilePage render state:', {
    hasUser: !!user,
    username: user?.username,
    profileData,
    isLoadingProfile,
    isSavingProfile,
    newUsername,
    validationError,
    profileError,
    profileMessage
  });

  if (!user) return null;

  const validateUsername = (username: string): string | null => {
    console.log('Validating username:', username);
    
    if (!username || username.length < 3) {
      console.log('Username validation failed: too short');
      return 'Username must be at least 3 characters long';
    }
    
    const regex = /^[a-z0-9_-]+$/;
    if (!regex.test(username)) {
      console.log('Username validation failed: invalid characters');
      return 'Username can only contain lowercase letters, numbers, underscores, and hyphens';
    }
    
    console.log('Username validation passed');
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    console.log('Validating phone:', phone);
    
    if (!phone) {
      console.log('Phone validation passed: empty (optional field)');
      return null; // Optional field
    }
    
    const phoneRegex = /^\+?1?\d{9,15}$/;
    const cleanedPhone = phone.replace(/\s+/g, '');
    console.log('Cleaned phone for validation:', cleanedPhone);
    
    if (!phoneRegex.test(cleanedPhone)) {
      console.log('Phone validation failed: invalid format');
      return 'Please enter a valid phone number (9-15 digits)';
    }
    
    console.log('Phone validation passed');
    return null;
  };

  const validateWebsite = (website: string): string | null => {
    console.log('Validating website:', website);
    
    if (!website) {
      console.log('Website validation passed: empty (optional field)');
      return null; // Optional field
    }
    
    try {
      new URL(website);
      console.log('Website validation passed');
      return null;
    } catch (error) {
      console.log('Website validation failed:', error);
      return 'Please enter a valid website URL (e.g., https://example.com)';
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    console.log('Username input changed:', { 
      originalValue: e.target.value, 
      processedValue: value,
      currentUsername: user?.username 
    });
    
    setNewUsername(value);
    
    const validationMsg = validateUsername(value);
    console.log('Username validation result:', validationMsg);
    setValidationError(validationMsg || '');
    
    if (usernameMessage) setUsernameMessage('');
    if (usernameError) setUsernameError('');
  };

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    console.log('Profile field changed:', { field, value, currentProfileData: profileData });
    
    setProfileData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('Updated profile data:', newData);
      return newData;
    });
    
    // Clear messages when user starts editing
    if (profileMessage) setProfileMessage('');
    if (profileError) setProfileError('');
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Username update form submitted:', { newUsername, currentUsername: user?.username });
    
    setUsernameError('');
    setUsernameMessage('');
    
    const validationMsg = validateUsername(newUsername);
    console.log('Username validation before submit:', validationMsg);
    
    if (validationMsg) {
      setValidationError(validationMsg);
      return;
    }
    
    try {
      console.log('Sending username update request:', { username: newUsername });
      const response = await api.auth.updateProfile({ 
        username: newUsername
      });
      console.log('Username update response:', response);
      
      if (response.status === 200) {
        console.log('Username updated successfully');
        setUsernameMessage('Username updated successfully!');
        
        // Update user context locally with new username
        updateUserData({ username: newUsername });
        setValidationError('');
      }
    } catch (err: any) {
      console.error('Username update failed:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setUsernameError(err.response?.data?.error || 'Failed to update username.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Profile update form submitted:', profileData);
    
    setProfileError('');
    setProfileMessage('');
    setIsSavingProfile(true);

    // Validate fields
    const phoneError = validatePhone(profileData.phone);
    const websiteError = validateWebsite(profileData.website);
    
    console.log('Profile validation results:', { phoneError, websiteError });
    
    if (phoneError || websiteError) {
      console.log('Profile validation failed:', phoneError || websiteError);
      setProfileError(phoneError || websiteError || '');
      setIsSavingProfile(false);
      return;
    }

    try {
      console.log('Sending profile update request:', profileData);
      const response = await api.auth.updateProfile(profileData);
      console.log('Profile update response:', response);
      
      if (response.status === 200) {
        console.log('Profile updated successfully');
        setProfileMessage('Profile updated successfully!');
        
        // Update user context locally with new profile data
        updateUserData(profileData);
      }
    } catch (err: any) {
      console.error('Profile update failed:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
      console.log('Profile update process completed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <UserIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile Management</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your account settings and personal information
          </p>
        </div>

        {/* Developer Portal Link */}
        {user?.is_developer && (
          <div className="mb-8 flex justify-center">
            <Link
              to="/developer-api"
              className="group inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Building className="h-5 w-5" />
              <span>Open Developer Portal</span>
            </Link>
          </div>
        )}

        {/* Main Content - stacked vertically for mobile friendliness */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
          {/* Profile Information Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-4 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl mr-4">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
            </div>
            
            {/* Success/Error Messages */}
            {profileMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <p className="text-emerald-800 font-medium">{profileMessage}</p>
              </div>
            )}
            {profileError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 font-medium">{profileError}</p>
              </div>
            )}
            
            {isLoadingProfile ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading your profile...</p>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Single column layout for all fields */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all duration-200"
                    placeholder="Enter your full name"
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
                    onChange={(e) => handleProfileChange('location', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all duration-200"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="mb-2 text-sm font-semibold text-gray-700 flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-500" />
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all duration-200"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="mb-2 text-sm font-semibold text-gray-700 flex items-center">
                    <Building className="h-4 w-4 mr-1 text-gray-500" />
                    Office/Workplace
                  </label>
                  <input 
                    type="text" 
                    value={profileData.office}
                    onChange={(e) => handleProfileChange('office', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all duration-200"
                    placeholder="Company or office name"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Bio</label>
                  <div className="relative">
                    <textarea 
                      value={profileData.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 resize-none"
                      placeholder="Tell us about yourself..."
                      maxLength={500}
                      rows={4}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded-lg shadow-sm">
                      {profileData.bio.length}/500
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSavingProfile}
                  className="w-full py-4 px-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
          {/* Username Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-4 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mr-4">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Username Settings</h2>
            </div>
            
            {/* Success/Error Messages */}
            {usernameMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <p className="text-emerald-800 font-medium">{usernameMessage}</p>
              </div>
            )}
            {usernameError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 font-medium">{usernameError}</p>
              </div>
            )}
            
            <form onSubmit={handleUpdateUsername} className="space-y-6">
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Current Username
                </label>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <span className="text-lg font-semibold text-blue-700">{user.username}</span>
                </div>
              </div>
              
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  New Username
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newUsername} 
                    onChange={handleUsernameChange}
                    className={`w-full px-4 py-4 text-base sm:text-lg border-2 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 ${
                      validationError 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-300'
                    }`}
                    placeholder="Enter new username"
                  />
                </div>
                {validationError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{validationError}</p>
                  </div>
                )}
                <p className="text-gray-500 text-sm mt-2 italic">
                  Use lowercase letters, numbers, underscores, and hyphens only
                </p>
              </div>
              
              <button 
                type="submit" 
                disabled={!!validationError || !newUsername.trim()}
                className={`w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-200 transform ${
                  validationError || !newUsername.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                }`}
              >
                Update Username
              </button>
            </form>
          </div>

          {/* Privacy Settings Link */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-4 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mr-4">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Privacy & GDPR</h2>
            </div>

            <p className="text-gray-600 mb-4">Manage consent preferences and privacy controls.</p>
            <Link
              to="/privacy-settings"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span>Open Privacy Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;