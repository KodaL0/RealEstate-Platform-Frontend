import * as React from 'react';
import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Save, MapPin, Phone, Building, Globe, Camera, FileText, Loader2 } from 'lucide-react';
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
  const { user, setUser, refreshUser } = useUser();
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
        setUser({ ...user, username: newUsername });
        setValidationError('');
        
        // Refresh user context to ensure consistency
        await refreshUser();
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
        // Update user context with new profile data
        const updatedUser = { ...user, ...profileData };
        console.log('Updating user context:', updatedUser);
        setUser(updatedUser);
        
        // Refresh user context to ensure consistency
        await refreshUser();
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
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center mb-6">
          <UserIcon className="h-10 w-10 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold">Profile Management</h1>
        </div>

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
      </div>
    </div>
  );
};

export default ProfilePage;
