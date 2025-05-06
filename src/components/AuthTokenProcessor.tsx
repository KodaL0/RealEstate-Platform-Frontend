import { useEffect } from 'react';
import { setAuthCookies } from '../middleware/auth'; // Adjust the path as needed

const AuthTokenProcessor = () => {
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const accessToken = queryParams.get('access_token');
    const refreshToken = queryParams.get('refresh_token');
    const authSuccess = queryParams.get('auth_success');
    // const userEmail = queryParams.get('user_email'); // Optional: if you want to use it

    if (authSuccess === 'true' && accessToken && refreshToken) {
      console.log('[AuthTokenProcessor] Tokens found in URL. Setting cookies...');
      try {
        setAuthCookies(accessToken, refreshToken);
        console.log('[AuthTokenProcessor] Auth cookies should now be set.');
        console.log('[AuthTokenProcessor] Current cookies:', document.cookie);

        // Clean the tokens from the URL
        const cleanURL = window.location.pathname; // Get current path without query params
        window.history.replaceState({}, document.title, cleanURL);
        console.log('[AuthTokenProcessor] URL cleaned.');

        // TODO: Optionally, trigger a user state update here if you use a global state manager
        // e.g., dispatch(userLoggedIn({ email: userEmail, accessToken }));
        // Or, you might want to trigger a fetch of the user's data now that cookies are set.
        // This could also involve a page reload or a redirect to a dashboard, 
        // though often just updating state and cleaning URL is enough for SPAs.
        // For example, to force a re-fetch of user data via an existing mechanism:
        // window.dispatchEvent(new CustomEvent('authTokensProcessed'));

      } catch (error) {
        console.error('[AuthTokenProcessor] Error processing auth tokens:', error);
      }
    } else {
      const errorParam = queryParams.get('error');
      if (errorParam) {
        console.error(`[AuthTokenProcessor] Auth failed with error: ${errorParam}`);
        // Potentially display this error to the user or redirect to login with error message
        // Example: window.history.replaceState({}, document.title, `/login?error=${errorParam}`);
      }
    }
    // This effect should only run once on component mount when the page loads with URL params
  }, []); // Empty dependency array ensures it runs once on mount

  return null; // This component does not render anything
};

export default AuthTokenProcessor; 
