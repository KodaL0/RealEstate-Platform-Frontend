import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      {status === 'processing' && (
        <>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Completing authentication...
          </Typography>
        </>
      )}
      
      {status === 'success' && (
        <Typography variant="h6" color="success.main">
          Authentication successful! Redirecting...
        </Typography>
      )}
      
      {status === 'error' && (
        <Typography variant="h6" color="error">
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
};

export default OAuthCallback; 