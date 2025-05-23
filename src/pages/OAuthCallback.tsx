import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Component to handle OAuth callbacks from providers like Google
 * This component is responsible for:
 * 1. Receiving the OAuth callback from providers
 * 2. Forwarding the callback to our backend
 * 3. Handling any error states during the OAuth flow
 */
const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = () => {
      try {
        // Check if this is already a success callback from our backend
        if (location.search.includes('auth_success=true')) {
          console.log('Auth success detected, redirecting to home');
          // If authentication was successful, redirect to home
          navigate('/', { replace: true });
          return;
        }

        // Otherwise, this is the initial OAuth callback from Google
        // We need to forward it to the backend
        console.log("Handling OAuth callback, forwarding to backend");
        
        // Simply forward the callback to our backend
        const callbackUrl = `/accounts/google/login/callback${location.search}`;
        console.log("Redirecting to:", callbackUrl);
        
        // Redirect to the backend callback URL
        window.location.href = callbackUrl;
      } catch (error) {
        console.error('Error in OAuth callback:', error);
        // If there's an error, redirect to login page
        navigate('/login', { replace: true });
      }
    };

    // Handle the callback immediately when component mounts
    handleCallback();
  }, [location, navigate]);

  // Show a simple loading spinner
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Completing Authentication</h2>
        <p className="text-gray-600 mt-2">Please wait while we complete your login...</p>
      </div>
    </div>
  );
};

export default OAuthCallback; 