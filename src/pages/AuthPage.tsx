// src/pages/AuthPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';

export const AuthPage: React.FC = () => {
  const handleGoogleLogin = () => {
    sessionStorage.clear();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.toLowerCase().includes('google') || key.toLowerCase().includes('oauth') || key.toLowerCase().includes('token'))) {
        localStorage.removeItem(key);
      }
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const uniqueId = Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().getTime();

    const loginUrl = `${backendUrl}/accounts/google/login/` +
                     `?prompt=select_account consent` +
                     `&include_granted_scopes=false` +
                     `&login_hint=_force_new_${uniqueId}` +
                     `&state=${uniqueId}` +
                     `&t=${timestamp}` +
                     `&authuser=-1`;

    window.open(loginUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center space-x-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">PROPERTPRO</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Only Google login */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center border border-gray-300 rounded-md py-2 text-sm
                         hover:bg-gray-50 transition"
            >
              <SiGoogle className="h-5 w-5 mr-2 text-[#4285F4]" />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
