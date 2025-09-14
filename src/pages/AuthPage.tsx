import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { NativeLogin } from '../components/NativeLogin';
import { useUser } from '../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'native' | 'google'>('native');
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleLogin = () => {
    const loginUrl = '/accounts/google/login/';
    console.log("Starting Google OAuth flow:", loginUrl);
    window.location.href = loginUrl;
  };

  const handleNativeSuccess = () => {
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  const handleBackToOptions = () => {
    setAuthMode('native');
  };

  if (user) {
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center space-x-2 mb-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">PROPERTPRO</span>
          </div>
        </div>

        {/* Auth Options */}
        {authMode === 'native' ? (
          <>
            {/* Native Login Component */}
            <NativeLogin onSuccess={handleNativeSuccess} />
            
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => setAuthMode('google')}
              className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-3 text-sm font-medium
                         text-gray-700 bg-white hover:bg-blue-50 transition-all duration-150 shadow-sm hover:shadow-md mt-4"
            >
              <SiGoogle className="h-4 w-4 mr-2 text-[#4285F4]" />
              Continue with Google
            </button>
          </>
        ) : (
          /* Google OAuth Mode */
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Sign in with Google
              </h2>
              <p className="text-sm text-gray-600">
                Redirecting to Google...
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-3 text-sm font-medium
                         text-gray-700 bg-white hover:bg-blue-50 transition-all duration-150 shadow-sm hover:shadow-md mb-3"
            >
              <SiGoogle className="h-4 w-4 mr-2 text-[#4285F4]" />
              Continue with Google
            </button>
            
            <button
              type="button"
              onClick={handleBackToOptions}
              className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              ← Back to options
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
