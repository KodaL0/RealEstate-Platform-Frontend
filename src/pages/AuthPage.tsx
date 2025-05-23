import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { useUser } from '../context/UserContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // Clear any existing auth state before starting new OAuth flow
    // This prevents issues with stale tokens or session state
    sessionStorage.clear();
    localStorage.removeItem('userInfo');
    
    // Clear any cookies that might interfere with the auth flow
    // by setting expiration to past date
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure';
    document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure';

    // Use the correct backend endpoint to start the OAuth flow
    // This endpoint will handle redirecting to Google and back
    const loginUrl = `/accounts/google/login/?process=login`;
    console.log("Starting Google OAuth flow:", loginUrl);
    
    // Redirect in the same window
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md">
        {/* Logo & Title */}
        <div className="flex justify-center items-center space-x-3 mb-6">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="text-3xl font-bold text-gray-800">PROPERTPRO</span>
        </div>

        <h2 className="text-center text-2xl font-extrabold text-gray-900 mb-2">
          Sign in to your account
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Secure sign-in with your Google account
        </p>
        
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center border border-gray-300 rounded-md py-3 text-sm font-medium
                     text-gray-700 bg-white hover:bg-blue-50 transition-all duration-150 shadow-md hover:shadow-lg"
        >
          <SiGoogle className="h-5 w-5 mr-3 text-[#4285F4]" />
          Continue with Google
        </button>
      </div>
    </div>
  );
};
