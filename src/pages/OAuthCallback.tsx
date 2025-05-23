import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Simplified OAuth callback handler
 * Now only needs to check for auth_success parameter since cookies are set by backend
 */
const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const authSuccess = queryParams.get('auth_success');
        const error = queryParams.get('error');

        if (error) {
          console.error(`OAuth error: ${error}`);
          navigate('/login?error=' + error, { replace: true });
          return;
        }

        if (authSuccess === 'true') {
          console.log('OAuth success detected, cookies should be set by backend');
          
          // Clean the URL and redirect to home
          navigate('/', { replace: true });
          return;
        }

        // If neither success nor error, this might be the initial OAuth callback from Google
        // Forward it to the backend
        console.log("Forwarding OAuth callback to backend");
        const callbackUrl = `https://api.propertpro.com/accounts/google/login/callback${location.search}`;
        window.location.href = callbackUrl;
        
      } catch (error) {
        console.error('Error in OAuth callback:', error);
        navigate('/login?error=callback_error', { replace: true });
      }
    };

    handleCallback();
  }, [location, navigate]);

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