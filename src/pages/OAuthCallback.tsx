import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const OAuthCallback = () => {
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(true);
  
  useEffect(() => {
    // Get all query parameters from the URL
    const queryParams = location.search; // Already includes the ? at the beginning
    
    // Forward to backend with all parameters intact (including state)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const callbackUrl = `${backendUrl}/accounts/google/login/callback${queryParams}`;
    
    // Log the redirect for debugging
    console.log(`Redirecting Google OAuth callback to backend: ${callbackUrl}`);
    
    // Redirect while preserving all parameters
    window.location.href = callbackUrl;
    
    // Safety timeout in case redirect fails
    const timeout = setTimeout(() => {
      setIsRedirecting(false);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [location]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center px-4">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md text-center">
        {isRedirecting ? (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Processing Authentication</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
            <p className="mt-4 text-gray-600">Please wait while we complete your sign-in...</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Redirect Failed</h2>
            <p className="text-gray-600 mb-4">We were unable to complete the authentication process.</p>
            <a 
              href="/" 
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Return to Homepage
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback; 