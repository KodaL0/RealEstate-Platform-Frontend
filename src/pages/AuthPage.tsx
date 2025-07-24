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
    const loginUrl = 'https://api.propertpro.com/accounts/google/login/';
    console.log("Starting Google OAuth flow:", loginUrl);
    window.location.href = loginUrl;
  };

  const handleNativeSuccess = () => {
    // Redirect to intended page or home
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  const handleBackToOptions = () => {
    setAuthMode('native');
  };

  // If user is already authenticated, redirect
  if (user) {
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-800">PROPERTPRO</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Welcome to PropertPro
          </h1>
          <p className="text-gray-600 mt-2">
            Choose your preferred sign-in method
          </p>
        </div>

        {/* Auth Options */}
        {authMode === 'native' ? (
          <>
            {/* Native Login Component */}
            <NativeLogin onSuccess={handleNativeSuccess} />
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-blue-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => setAuthMode('google')}
              className="w-full flex items-center justify-center border border-gray-300 rounded-md py-3 text-sm font-medium
                         text-gray-700 bg-white hover:bg-blue-50 transition-all duration-150 shadow-md hover:shadow-lg"
            >
              <SiGoogle className="h-5 w-5 mr-3 text-[#4285F4]" />
              Continue with Google
            </button>
          </>
        ) : (
          /* Google OAuth Mode */
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Sign in with Google
              </h2>
              <p className="text-gray-600">
                You'll be redirected to Google to complete your sign-in
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center border border-gray-300 rounded-md py-3 text-sm font-medium
                         text-gray-700 bg-white hover:bg-blue-50 transition-all duration-150 shadow-md hover:shadow-lg mb-4"
            >
              <SiGoogle className="h-5 w-5 mr-3 text-[#4285F4]" />
              Continue with Google
            </button>
            
            <button
              type="button"
              onClick={handleBackToOptions}
              className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              ← Back to sign-in options
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
