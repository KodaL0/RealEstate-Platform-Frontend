// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { login, register } from '../middleware/auth';
import { useUser } from '../context/UserContext';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const { refreshUser } = useUser();
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFeedback('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res?.status === 200) {
          setTimeout(async () => {
            try {
              await refreshUser();
              navigate('/');
            } catch {
              setFeedback('Login succeeded, but failed to load profile');
            }
          }, 500);
        } else {
          setFeedback(typeof res?.error === 'string' ? res.error : 'Login failed');
        }
      } else {
        const username = formData.get('name') as string;
        const res = await register(username, email, password);
        if (res?.status === 201) {
          setFeedback('Registration successful!');
          setTimeout(() => navigate('/login'), 1500);
        } else {
          // Now we can simply use the error field
          setFeedback(res?.error || 'Registration failed.');
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback('Error processing your request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center space-x-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">PROPERTPRO</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                               placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                             placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                             placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Social Login Buttons */}
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

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm
                           text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none
                           focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading
                  ? 'Loading…'
                  : isLogin
                  ? 'Sign in'
                  : 'Register'}
              </button>
            </div>
          </form>

          {feedback && (
            <div
              className={`mt-4 text-center text-sm ${
                feedback.toLowerCase().includes('successful')
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {feedback}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-500"
            >
              {isLogin
                ? 'Create an account'
                : 'Sign in to existing account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
