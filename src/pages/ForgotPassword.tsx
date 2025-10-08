import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../config/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.auth.requestPasswordReset(email);
      
      if (response.status === 200 || response.data.status === 200) {
        setEmailSent(true);
        toast.success('Password reset email sent!');
      } else {
        setError(response.data?.message || 'Failed to send reset email');
        toast.error('Failed to send reset email');
      }
    } catch (err: any) {
      console.error('Password reset request error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center space-x-2 mb-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800">PROPERTPRO</span>
            </div>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Check Your Email
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-700">
                  We've sent password reset instructions to
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {email}
                </p>
              </div>
              
              <div className="text-left space-y-3 mb-6 text-sm text-gray-600">
                <p>
                  <strong>Next steps:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Check your inbox (and spam folder)</li>
                  <li>Click the reset link in the email</li>
                  <li>Create your new password</li>
                  <li>The link expires in 2 hours</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full py-2 px-4 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Send Another Email
                </button>
                
                <Link
                  to="/auth"
                  className="block w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Didn't receive the email?{' '}
              <button
                onClick={() => setEmailSent(false)}
                className="text-blue-600 hover:text-blue-500 font-semibold"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center space-x-2 mb-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">PROPERTPRO</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <Link
              to="/auth"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Forgot Password?
          </h2>
          <p className="text-gray-600 mb-6">
            No worries! Enter your email and we'll send you reset instructions.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
                disabled={isLoading}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/auth" className="text-blue-600 hover:text-blue-500 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

