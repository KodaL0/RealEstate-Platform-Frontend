import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import GDPRApiService, { ConsentPreferences } from '../services/gdprApi';

export interface GDPRConsentState {
  hasConsented: boolean;
  consents: ConsentPreferences;
  consentGivenAt: string | null;
  needsConsentCollection: boolean;
  isLoading: boolean;
}

export const useGDPRConsent = () => {
  const { user, updateGDPRConsent, getGDPRStatus } = useUser();
  const [consentState, setConsentState] = useState<GDPRConsentState>({
    hasConsented: false,
    consents: { analytics: false, marketing: false, social: false },
    consentGivenAt: null,
    needsConsentCollection: false,
    isLoading: true
  });

  // Check if user needs consent collection
  useEffect(() => {
    checkConsentStatus();
  }, [user]);

  const checkConsentStatus = async () => {
    if (!user) {
      setConsentState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setConsentState(prev => ({ ...prev, isLoading: true }));

      // Get current consent status from API
      const consentResponse = await GDPRApiService.getConsentStatus();
      const gdprStatus = getGDPRStatus();

      // Determine if consent collection is needed
      const hasAnyConsent = consentResponse.consents.analytics ||
                           consentResponse.consents.marketing ||
                           consentResponse.consents.social;

      const needsCollection = !consentResponse.consent_given_at ||
                             consentResponse.consent_given_at === null;

      setConsentState({
        hasConsented: hasAnyConsent,
        consents: consentResponse.consents,
        consentGivenAt: consentResponse.consent_given_at,
        needsConsentCollection: needsCollection,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to check consent status:', error);
      setConsentState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const collectConsent = async (consents: ConsentPreferences): Promise<boolean> => {
    try {
      // Update consents via API
      await GDPRApiService.updateConsent(consents);

      // Update local state
      setConsentState(prev => ({
        ...prev,
        hasConsented: consents.analytics || consents.marketing || consents.social,
        consents,
        consentGivenAt: new Date().toISOString(),
        needsConsentCollection: false
      }));

      return true;
    } catch (error) {
      console.error('Failed to collect consent:', error);
      return false;
    }
  };

  const updateConsent = async (consentType: keyof ConsentPreferences, value: boolean): Promise<boolean> => {
    try {
      const success = await updateGDPRConsent(consentType, value);

      if (success) {
        // Update local state
        setConsentState(prev => ({
          ...prev,
          consents: { ...prev.consents, [consentType]: value },
          consentGivenAt: prev.consentGivenAt || new Date().toISOString()
        }));
      }

      return success;
    } catch (error) {
      console.error('Failed to update consent:', error);
      return false;
    }
  };

  const showConsentModal = (mode: 'initial' | 'update' | 'required' = 'initial') => {
    // This would trigger the GDPRConsentModal component
    // For now, we'll implement a simple prompt-based approach
    return new Promise<ConsentPreferences>((resolve) => {
      const defaultConsents = consentState.consents;

      // Simple prompt for demo - in production, use a proper modal
      const analytics = confirm('Allow analytics and performance tracking? (Optional)');
      const marketing = confirm('Allow marketing and recommendations? (Optional)');
      const social = confirm('Allow social features? (Optional)');

      resolve({
        analytics,
        marketing,
        social
      });
    });
  };

  return {
    ...consentState,
    collectConsent,
    updateConsent,
    showConsentModal,
    refreshConsentStatus: checkConsentStatus
  };
};

export default useGDPRConsent;
