/**
 * Custom hook for legal document management
 * Handles checking acceptance status and prompting users
 */
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import LegalDocumentsAPI, { AcceptanceStatus } from '../services/legalApi';
import { apiCache, cacheKey } from '../utils/apiCache';

export const useLegalDocuments = () => {
  const { user } = useUser();
  const [acceptanceStatus, setAcceptanceStatus] = useState<AcceptanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once when user becomes available
    if (user && !hasChecked) {
      setHasChecked(true);
      // Clear any stale cache for this user
      if (user.id) {
        apiCache.invalidate(cacheKey.legalAcceptance(user.id));
      }
      checkAcceptanceStatus();
    } else if (!user) {
      // Reset when user logs out
      setAcceptanceStatus(null);
      setNeedsAcceptance(false);
      setHasChecked(false);
    }
  }, [user?.id]); // Only re-run when user ID changes

  const checkAcceptanceStatus = async () => {
    if (!user) return;
    
    // Prevent concurrent calls
    if (isLoading) {
      console.log('Legal documents check already in progress, skipping...');
      return;
    }

    try {
      setIsLoading(true);
      const status = await LegalDocumentsAPI.getAcceptanceStatus(user.id);
      setAcceptanceStatus(status);
      
      // Check both required and optional
      const hasRequired = (status.needs_acceptance_required?.length || 0) > 0;
      const hasOptional = (status.needs_acceptance_optional?.length || 0) > 0;
      
      setNeedsAcceptance(hasRequired || hasOptional);
      
      console.log('[Legal Documents] Acceptance check:', {
        userId: user.id,
        required: status.needs_acceptance_required?.length || 0,
        optional: status.needs_acceptance_optional?.length || 0,
        needsAcceptance: hasRequired || hasOptional
      });
    } catch (error) {
      console.error('Failed to check legal document acceptance status:', error);
      setAcceptanceStatus(null);
      setNeedsAcceptance(false);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptDocument = async (documentType: string, version?: string) => {
    try {
      console.log(`[useLegalDocuments] Accepting document: ${documentType} v${version || 'current'}`);
      await LegalDocumentsAPI.acceptDocument(documentType, version, user?.id);
      
      // Clear cache and refresh status after acceptance
      if (user?.id) {
        apiCache.invalidate(cacheKey.legalAcceptance(user.id));
      }
      
      setHasChecked(false); // Allow re-check
      
      // Small delay to ensure backend has processed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force refresh from API (skip cache)
      if (user) {
        const status = await LegalDocumentsAPI.getAcceptanceStatus(user.id, true);
        setAcceptanceStatus(status);
        const hasRequired = (status.needs_acceptance_required?.length || 0) > 0;
        const hasOptional = (status.needs_acceptance_optional?.length || 0) > 0;
        setNeedsAcceptance(hasRequired || hasOptional);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to accept document:', error);
      return false;
    }
  };

  return {
    acceptanceStatus,
    needsAcceptance,
    isLoading,
    checkAcceptanceStatus,
    acceptDocument,
  };
};

export default useLegalDocuments;

