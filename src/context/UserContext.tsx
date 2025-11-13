import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../config/api";
import analytics from "../utils/analytics";
import { apiCache } from "../utils/apiCache";
import { clearAuthCookies } from "../middleware/auth";

// Define the User type (using number since TypeScript doesn't have "integer")
type User = {
  id: number;
  username: string;
  email: string;
  is_developer?: boolean;
  name?: string;
  bio?: string;
  location?: string;
  phone?: string;
  office?: string;
  avatar?: string;
  website?: string;
  email_verified?: boolean;
  email_verified_at?: string;
  date_joined?: string;
  // GDPR fields
  gdpr_consent_analytics?: boolean;
  gdpr_consent_marketing?: boolean;
  gdpr_consent_given_at?: string;
  gdpr_consents_updated_at?: string;
  processing_restricted?: boolean;
  restriction_reason?: string;
  restriction_requested_at?: string;
};

// Define the context type
interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  updateUserData: (userData: Partial<User>) => void;
  // GDPR-specific methods
  refreshGDPRStatus: () => Promise<void>;
  updateGDPRConsent: (consentType: string, value: boolean) => Promise<boolean>;
  getGDPRStatus: () => {
    consents: { analytics: boolean; marketing: boolean };
    processingRestricted: boolean;
    consentGivenAt: string | null;
  } | null;
}

// Create a safe default value for the context
const defaultContextValue: UserContextType = {
  user: null,
  setUser: () => {},
  isLoading: true,
  refreshUser: async () => {},
  updateUserData: () => {},
  refreshGDPRStatus: async () => {},
  updateGDPRConsent: async () => false,
  getGDPRStatus: () => null,
};

// Create the context with a safe default value
const UserContext = createContext<UserContextType>(defaultContextValue);

// Define UserProvider props
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingGDPR, setIsRefreshingGDPR] = useState(false);

  // Direct API call without auth.ts wrapper
  const fetchUser = async (forceCheck = false) => {
    setIsLoading(true);
    try {
      // Always attempt the API call - HttpOnly cookies won't be visible in document.cookie
      // but will still be sent automatically with requests via withCredentials: true
      // The backend is the source of truth for authentication status
      const response = await api.auth.getUser();
      console.log("UserContext: Response from API:", response.data);
      
      // Extract user data from API response
      const userData = response.data.user || response.data;
      if (userData) {
        console.log("Setting user from API response:", userData);
        setUser(userData);

        // Sync local consent to backend if user just logged in
        await syncLocalConsentToBackend(userData.id);

        // Only set Google Analytics user properties if analytics consent is given
        if (userData.gdpr_consent_analytics) {
          const accountAgeDays = userData.date_joined 
            ? Math.floor((new Date().getTime() - new Date(userData.date_joined).getTime()) / (1000 * 60 * 60 * 24))
            : undefined;

          analytics.setUserProperties(userData.id, {
            is_developer: userData.is_developer || false,
            is_verified: userData.email_verified || false,
            account_age_days: accountAgeDays,
          });
        }
      } else {
        console.log("No valid user data found in response");
        setUser(null);
      }
    } catch (error: any) {
      console.error("Failed to fetch user:", error);
      // If 401, also clear cookies
      if (error?.response?.status === 401) {
        clearAuthCookies();
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync local consent preferences to backend when user logs in
  const syncLocalConsentToBackend = async (userId: number) => {
    try {
      // Check if user has local consents stored (from cookie banner)
      const localConsents = localStorage.getItem('propertpro-cookie-preferences');
      if (!localConsents) return;

      const consents = JSON.parse(localConsents);
      console.log('[UserContext] Syncing local consents to backend for user', userId, consents);

      // Send to backend
      await api.post('users/gdpr/consent', consents);
      console.log('[UserContext] Local consents synced to backend successfully');
    } catch (error) {
      console.error('[UserContext] Failed to sync local consents:', error);
    }
  };

  // Expose refreshUser to let other parts of the app force a refresh
  const refreshUser = async (forceCheck = false) => {
    await fetchUser(forceCheck);
  };

  // Update user data without fetching from server (for local updates)
  const updateUserData = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // GDPR-specific methods
  const refreshGDPRStatus = async () => {
    if (!user) return;
    
    // Prevent concurrent calls
    if (isRefreshingGDPR) {
      console.log('GDPR refresh already in progress, skipping...');
      return;
    }

    try {
      setIsRefreshingGDPR(true);
      
      // Use Promise.allSettled to prevent one failure from blocking the other
      const [consentResult, restrictionResult] = await Promise.allSettled([
        api.get('users/gdpr/consent'),
        api.get('users/gdpr/restriction')
      ]);

      const gdprData: Partial<User> = {};

      // Process consent data
      if (consentResult.status === 'fulfilled') {
        const consentResponse = consentResult.value;
        gdprData.gdpr_consent_analytics = consentResponse.data.consents?.analytics;
        gdprData.gdpr_consent_marketing = consentResponse.data.consents?.marketing;
        gdprData.gdpr_consent_given_at = consentResponse.data.consent_given_at;
        gdprData.gdpr_consents_updated_at = consentResponse.data.last_updated;
      } else {
        console.warn('Failed to fetch consent status:', consentResult.reason);
      }

      // Process restriction data
      if (restrictionResult.status === 'fulfilled') {
        const restrictionResponse = restrictionResult.value;
        gdprData.processing_restricted = restrictionResponse.data.is_restricted;
        gdprData.restriction_reason = restrictionResponse.data.restriction_reason;
        gdprData.restriction_requested_at = restrictionResponse.data.restriction_requested_at;
      } else {
        console.warn('Failed to fetch restriction status:', restrictionResult.reason);
      }

      // Only update if we got at least some data
      if (Object.keys(gdprData).length > 0) {
        setUser(prev => prev ? { ...prev, ...gdprData } : null);
      }
    } catch (error) {
      console.error('Failed to refresh GDPR status:', error);
    } finally {
      setIsRefreshingGDPR(false);
    }
  };

  const updateGDPRConsent = async (consentType: string, value: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`[UserContext] Updating GDPR consent: ${consentType} = ${value}`);

      // Build the consent object to send to backend
      const consents = {
        analytics: consentType === 'analytics' ? value : user.gdpr_consent_analytics,
        marketing: consentType === 'marketing' ? value : user.gdpr_consent_marketing,
      };

      // Update backend first
      await api.post('users/gdpr/consent', consents);
      console.log('[UserContext] Backend consent updated successfully');

      // Invalidate GDPR cache to force fresh fetch
      apiCache.invalidatePattern(/gdpr/);
      console.log('[UserContext] GDPR cache invalidated');

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        [`gdpr_consent_${consentType}`]: value,
        gdpr_consents_updated_at: new Date().toISOString(),
        gdpr_consent_given_at: prev.gdpr_consent_given_at || new Date().toISOString()
      } : null);

      return true;
    } catch (error) {
      console.error('Failed to update GDPR consent:', error);
      return false;
    }
  };

  const getGDPRStatus = () => {
    if (!user) return null;

    return {
      consents: {
        analytics: user.gdpr_consent_analytics || false,
        marketing: user.gdpr_consent_marketing || false
      },
      processingRestricted: user.processing_restricted || false,
      consentGivenAt: user.gdpr_consent_given_at || null
    };
  };

  useEffect(() => {
    // Clear all cache on fresh page load to prevent stale data
    if (typeof window !== 'undefined' && !window.sessionStorage.getItem('cache_cleared')) {
      console.log('[UserContext] Clearing stale cache on page load');
      apiCache.clear();
      window.sessionStorage.setItem('cache_cleared', 'true');
    }
    
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      isLoading,
      refreshUser,
      updateUserData,
      refreshGDPRStatus,
      updateGDPRConsent,
      getGDPRStatus
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext in your components
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  // Context should never be undefined/null with the default value
  // But check if we're getting the default stub (isLoading === true and no actual provider)
  return context;
};
