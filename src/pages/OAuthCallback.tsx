import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * Component to handle OAuth callbacks from providers like Google
 * This component is responsible for:
 * 1. Receiving the OAuth callback from providers
 * 2. Forwarding the callback to our backend
 * 3. Handling any error states during the OAuth flow
 */
const OAuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchCurrentUser } = useUser();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check if this is a backend auth complete callback with success flag
        if (location.search.includes('auth_success=true')) {
          console.log('Auth success detected, fetching current user');
          // We've already been authenticated by the backend
          // Just need to fetch the current user to update UI state
          const userResult = await fetchCurrentUser();
          
          if (userResult.success) {
            setStatus('success');
            // Redirect to home page after successful login
            setTimeout(() => navigate('/', { replace: true }), 1000);
          } else {
            throw new Error('Failed to fetch user data after authentication');
          }
          
          return;
        }

        // Otherwise, this is the initial OAuth callback from Google
        // Forward the callback to our backend through the Vercel rewrite
        console.log("Handling Google OAuth callback");
        
        // Ensure the callback URL is properly formatted
        // The search string already includes the leading "?" character
        const callbackUrl = `/accounts/google/login/callback${location.search}`;
        console.log("Redirecting to backend callback:", callbackUrl);
        
        // Redirect to backend
        window.location.href = callbackUrl;
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setErrorMessage('Authentication failed. Please try again.');
        
        // Redirect to login page after a short delay
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    processCallback();
  }, [location, navigate, fetchCurrentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {status === 'processing' && (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Completing Authentication</h2>
          <p className="text-gray-600 mt-2">Please wait while we complete your login...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4">
            <h2 className="text-xl font-semibold">Authentication Successful!</h2>
            <p>Redirecting you to the homepage...</p>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            <h2 className="text-xl font-semibold">Authentication Error</h2>
            <p>{errorMessage}</p>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default OAuthCallback; 