import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';

export const AuthPage: React.FC = () => {
  const handleGoogleLogin = () => {
    // Clear storage before new login
    sessionStorage.clear();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.toLowerCase().includes('google') || key.toLowerCase().includes('oauth') || key.toLowerCase().includes('token'))) {
        localStorage.removeItem(key);
      }
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth_state', state);

    // Set redirect_uri to frontend callback
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const frontendUrl = window.location.origin;
    const redirectUri = `${frontendUrl}/auth/google/callback`;

    // Build login URL through backend - this is more secure
    const loginUrl = `${backendUrl}/accounts/google/login/` +
                     `?prompt=select_account` +
                     `&hd=propertpro.com` +
                     `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                     `&state=${state}`;

    // Navigate in same window
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
