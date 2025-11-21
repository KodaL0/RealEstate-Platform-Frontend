/**
 * GDPR Consent Manager
 *
 * Centralized consent management for both authenticated and anonymous users.
 * Handles localStorage persistence, backend API sync, and analytics initialization.
 *
 * GDPR Compliance:
 * - Article 6.1.a: Consent before processing
 * - Article 7.3: Easy withdrawal of consent
 * - Recital 32: No pre-checked boxes (all default to false)
 */

import api from "../config/api";

export interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentState {
  preferences: ConsentPreferences;
  timestamp: string | null;
  hasConsented: boolean; // True if user has made ANY choice (even if all false)
}

class ConsentManager {
  // LocalStorage keys
  private readonly CONSENT_KEY = "propertpro_gdpr_consents";
  private readonly CONSENT_TIMESTAMP_KEY = "propertpro_gdpr_timestamp";
  private readonly CONSENT_VERSION_KEY = "propertpro_consent_version";

  // Current consent version (increment when consent requirements change)
  private readonly CONSENT_VERSION = "1.0";

  /**
   * Check if user has given any consent (made a choice)
   */
  hasConsent(): boolean {
    try {
      const timestamp = localStorage.getItem(this.CONSENT_TIMESTAMP_KEY);
      const version = localStorage.getItem(this.CONSENT_VERSION_KEY);

      // Check version matches (force re-consent if version changed)
      if (version !== this.CONSENT_VERSION) {
        console.log("Consent version mismatch, forcing re-consent");
        return false;
      }

      return timestamp !== null;
    } catch (error) {
      console.error("Error checking consent:", error);
      return false;
    }
  }

  /**
   * Get current consent preferences
   */
  getConsents(): ConsentPreferences {
    try {
      const stored = localStorage.getItem(this.CONSENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          analytics: parsed.analytics || false,
          marketing: parsed.marketing || false,
        };
      }
    } catch (error) {
      console.error("Error reading consents from localStorage:", error);
    }

    // Default: no consent
    return { analytics: false, marketing: false };
  }

  /**
   * Get full consent state including timestamp
   */
  getConsentState(): ConsentState {
    const preferences = this.getConsents();
    const timestamp = localStorage.getItem(this.CONSENT_TIMESTAMP_KEY);
    const hasConsented = this.hasConsent();

    return {
      preferences,
      timestamp,
      hasConsented,
    };
  }

  /**
   * Save consent preferences
   * For authenticated users: syncs with backend
   * For anonymous users: saves to localStorage only
   */
  async saveConsents(consents: ConsentPreferences, userId?: number | string): Promise<boolean> {
    console.log("💾 [ConsentManager] saveConsents called");
    console.log("💾 [ConsentManager] Consents to save:", JSON.stringify(consents));
    console.log("💾 [ConsentManager] User ID:", userId || "anonymous");

    try {
      const timestamp = new Date().toISOString();

      // Save to localStorage (works for both authenticated and anonymous)
      console.log("💾 [ConsentManager] Saving to localStorage...");
      localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consents));
      localStorage.setItem(this.CONSENT_TIMESTAMP_KEY, timestamp);
      localStorage.setItem(this.CONSENT_VERSION_KEY, this.CONSENT_VERSION);
      console.log("✅ [ConsentManager] Saved to localStorage successfully");

      // If authenticated user, sync with backend
      if (userId) {
        console.log("⏳ [ConsentManager] User is authenticated, syncing with backend...");
        try {
          const response = await api.post("users/gdpr/consent", consents);
          console.log("✅ [ConsentManager] Backend sync successful:", response.data);
        } catch (apiError) {
          console.error("❌ [ConsentManager] Backend sync failed:", apiError);
          // Don't fail the whole operation if backend sync fails
          // User choice is still saved locally
        }
      } else {
        console.log(
          "ℹ️ [ConsentManager] User is anonymous, skipping backend sync (will be done separately)",
        );
      }

      // Initialize or disable analytics based on consent
      console.log("⏳ [ConsentManager] Updating analytics state...");
      this.updateAnalyticsState(consents);
      console.log("✅ [ConsentManager] Analytics state updated");

      return true;
    } catch (error) {
      console.error("❌ [ConsentManager] Error saving consents:", error);
      return false;
    }
  }

  /**
   * Accept all consents (convenience method)
   */
  async acceptAll(userId?: number | string): Promise<boolean> {
    return this.saveConsents({ analytics: true, marketing: true }, userId);
  }

  /**
   * Accept minimum (essential only - all set to false for non-essential)
   */
  async acceptMinimum(userId?: number | string): Promise<boolean> {
    return this.saveConsents({ analytics: false, marketing: false }, userId);
  }

  /**
   * Clear all consent data (used for testing or full reset)
   */
  clearConsents(): void {
    try {
      localStorage.removeItem(this.CONSENT_KEY);
      localStorage.removeItem(this.CONSENT_TIMESTAMP_KEY);
      localStorage.removeItem(this.CONSENT_VERSION_KEY);
      console.log("All consent data cleared");

      // Disable analytics
      if (typeof window.disableGoogleAnalytics === "function") {
        window.disableGoogleAnalytics();
      }
    } catch (error) {
      console.error("Error clearing consents:", error);
    }
  }

  /**
   * Initialize or disable analytics based on consent
   */
  private updateAnalyticsState(consents: ConsentPreferences): void {
    console.log("📊 [ConsentManager] updateAnalyticsState called");
    console.log("📊 [ConsentManager] Analytics consent:", consents.analytics);

    if (consents.analytics) {
      // User has given analytics consent - initialize GA
      console.log("✅ [ConsentManager] Analytics consent GRANTED - initializing Google Analytics");
      if (typeof window.initializeGoogleAnalytics === "function") {
        window.initializeGoogleAnalytics();
        console.log("✅ [ConsentManager] Google Analytics initialization function called");
      } else {
        console.warn("⚠️ [ConsentManager] window.initializeGoogleAnalytics not found");
      }
    } else {
      // User has not given analytics consent or has withdrawn it
      console.log("❌ [ConsentManager] Analytics consent DENIED - disabling Google Analytics");
      if (typeof window.disableGoogleAnalytics === "function") {
        window.disableGoogleAnalytics();
        console.log("✅ [ConsentManager] Google Analytics disabled");
      } else {
        console.warn("⚠️ [ConsentManager] window.disableGoogleAnalytics not found");
      }
    }
  }

  /**
   * Check if analytics is currently enabled
   */
  isAnalyticsEnabled(): boolean {
    const consents = this.getConsents();
    return consents.analytics && this.hasConsent();
  }

  /**
   * Check if marketing is currently enabled
   */
  isMarketingEnabled(): boolean {
    const consents = this.getConsents();
    return consents.marketing && this.hasConsent();
  }

  /**
   * Check if social features are currently enabled
   * Note: Social features are now covered by Terms & Conditions acceptance,
   * not requiring separate consent. This method is kept for compatibility.
   */
  isSocialEnabled(): boolean {
    // Social features are always enabled for authenticated users (via T&C)
    return true;
  }

  /**
   * Sync anonymous consent to backend session (Phase 5)
   * This ensures backend tracking respects frontend consent for anonymous users
   */
  async syncAnonymousConsent(): Promise<boolean> {
    console.log("🔄 [ConsentManager] syncAnonymousConsent called");

    if (!this.hasConsent()) {
      console.log("⚠️ [ConsentManager] No consent found, skipping sync");
      return false;
    }

    const consents = this.getConsents();
    console.log(
      "🔄 [ConsentManager] Current consents from localStorage:",
      JSON.stringify(consents),
    );

    const payload = {
      analytics_consent: consents.analytics,
      marketing_consent: consents.marketing,
    };
    console.log("🔄 [ConsentManager] Sending to backend:", JSON.stringify(payload));

    try {
      const response = await api.post("/analytics/set-anonymous-consent/", payload);
      console.log("✅ [ConsentManager] Backend response:", response.data);
      console.log("✅ [ConsentManager] Anonymous consent synced to backend session successfully");
      return true;
    } catch (error) {
      console.error("❌ [ConsentManager] Failed to sync anonymous consent:", error);
      return false;
    }
  }

  /**
   * Initialize analytics on page load if consent already given
   * Call this once when app starts
   */
  initializeOnLoad(): void {
    if (this.hasConsent()) {
      const consents = this.getConsents();
      this.updateAnalyticsState(consents);

      // Sync anonymous consent to backend (non-blocking)
      this.syncAnonymousConsent().catch((error) => {
        console.warn("Failed to sync anonymous consent on load:", error);
      });
    }
  }

  /**
   * Update a single consent preference
   */
  async updateConsent(
    consentType: keyof ConsentPreferences,
    value: boolean,
    userId?: number | string,
  ): Promise<boolean> {
    const currentConsents = this.getConsents();
    const updatedConsents = {
      ...currentConsents,
      [consentType]: value,
    };

    return this.saveConsents(updatedConsents, userId);
  }
}

// Export singleton instance
export const consentManager = new ConsentManager();
export default consentManager;

// Extend Window interface for TypeScript
declare global {
  interface Window {
    initializeGoogleAnalytics: () => void;
    disableGoogleAnalytics: () => void;
    gaInitialized: boolean;
  }
}
