import React from 'react';
import { Building2 } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';

export const AuthPage: React.FC = () => {
  const handleGoogleLogin = () => {
    // Fix: Use absolute URL to backend domain for OAuth initiation
    const loginUrl = 'https://api.propertpro.com/accounts/google/login/';
    console.log("Starting Google OAuth flow:", loginUrl);
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md">
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
