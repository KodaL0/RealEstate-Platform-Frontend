import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useUser } from '../context/UserContext';

const GoogleCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { refreshUser } = useUser();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');
      const state = params.get('state');
      
      // Clear state from sessionStorage after retrieving it
      const savedState = sessionStorage.getItem('oauth_state');
      sessionStorage.removeItem('oauth_state');

      if (error) {
        setStatus('error');
        setErrorMessage(error);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        return;
      }

      // Validate state parameter to prevent CSRF
      if (!state || !savedState || state !== savedState) {
        setStatus('error');
        setErrorMessage('Invalid state parameter - security validation failed');
        return;
      }

      try {
        // Send the code to our backend for token exchange
        const response = await fetch('/api/users/social-login-verify/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            code,
            state,
            redirect_uri: 'https://www.propertpro.com/auth/google/callback',
            provider: 'google'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Authentication failed');
        }

        // Update user context/state
        await refreshUser();
        setStatus('success');
        
        // Clean URL and redirect after short delay
        window.history.replaceState({}, document.title, '/');
        setTimeout(() => navigate('/'), 1500);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <Building2 className="h-12 w-12 text-blue-600" />
        </div>
        
        {status === 'loading' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Completing Sign In</h1>
            <p className="text-gray-600 mb-6">Verifying your account...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-green-600 mb-4">Successfully Signed In!</h1>
            <p className="text-gray-600">Redirecting you now...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Sign In Failed</h1>
            <p className="text-gray-700 mb-6">{errorMessage || 'There was a problem with your authentication'}</p>
            <button 
              onClick={() => navigate('/login')} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback; 