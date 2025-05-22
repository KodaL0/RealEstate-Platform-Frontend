import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Extract tokens from URL if they're present
    const searchParams = new URLSearchParams(location.search);
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const authSuccess = searchParams.get('auth_success');
    const userEmail = searchParams.get('user_email');
    
    // If we already have tokens (from backend redirect), store them and navigate home
    if (accessToken && refreshToken && authSuccess === 'true') {
      console.log("Auth success: Received tokens from backend");
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      if (userEmail) {
        localStorage.setItem('userEmail', userEmail);
      }
      
      // Navigate to home page after successful login
      navigate('/', { replace: true });
      return;
    }
    
    // Otherwise, this is the initial OAuth callback from Google
    // Forward the callback to our backend through the Vercel rewrite
    console.log("Handling Google OAuth callback");
    
    // Simply redirect to the same path, Vercel will rewrite it to the backend
    // No need for backend URL since our Vercel config handles the redirect
    window.location.href = `/accounts/google/login/callback${location.search}`;
    
    // Safety timeout in case redirect fails
    const timeout = setTimeout(() => {
      setIsRedirecting(false);
      setError("Redirect timeout. Authentication process took too long.");
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [location, navigate]);
  
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
            <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{error || "We were unable to complete the authentication process."}</p>
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