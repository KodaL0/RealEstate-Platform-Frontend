import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setAuthCookies } from '../middleware/auth';
import { useUser } from '../context/UserContext';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useUser();
  
  useEffect(() => {
    // Extract tokens from URL if they're present
    const searchParams = new URLSearchParams(location.search);
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const authSuccess = searchParams.get('auth_success');
    const userEmail = searchParams.get('user_email');
    
    // If we already have tokens (from backend redirect), store them as cookies and navigate home
    if (accessToken && refreshToken && authSuccess === 'true') {
      console.log("Auth success: Received tokens from backend");
      
      // Set cookies instead of localStorage
      setAuthCookies(accessToken, refreshToken);
      
      // Refresh user data
      refreshUser().then(() => {
        // Navigate to home page after successful login
        navigate('/', { replace: true });
      }).catch(err => {
        console.error("Error refreshing user data:", err);
        setError("Authentication successful but couldn't load user data");
        setIsRedirecting(false);
      });
      
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
    
    // Safety timeout in case redirect fails
    const timeout = setTimeout(() => {
      setIsRedirecting(false);
      setError("Redirect timeout. Authentication process took too long.");
    }, 10000); // Increased timeout to 10 seconds
    
    return () => clearTimeout(timeout);
  }, [location, navigate, refreshUser]);
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {isRedirecting && (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Processing Authentication</h2>
          <p className="text-gray-600 mt-2">Please wait while we complete your login...</p>
        </div>
      )}
    </div>
  );
};

export default OAuthCallback; 