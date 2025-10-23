import api from '../config/api';

// TypeScript interfaces for GDPR API responses
export interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  social?: boolean; // Optional - not used for anonymous users
}

export interface GDPRConsentResponse {
  consents: ConsentPreferences;
  consent_given_at: string | null;
  last_updated: string | null;
  purposes: Record<string, {
    legal_basis: string;
    description: string;
    required: boolean;
    retention?: string;
  }>;
}

export interface GDPRRestrictionResponse {
  is_restricted: boolean;
  restriction_reason: string | null;
  restriction_requested_at: string | null;
  active_restriction?: {
    id: number;
    reason: string;
    reason_detail: string;
    requested_at: string;
    restrict_analytics: boolean;
    restrict_marketing: boolean;
    restrict_profile_updates: boolean;
  };
  restriction_history: Array<{
    id: number;
    reason: string;
    status: string;
    requested_at: string;
    reviewed_at?: string;
  }>;
}

export interface DataExportResponse {
  status: 'success';
  generated_at: string;
  data: {
    personal_data: Record<string, any>;
    properties: Array<Record<string, any>>;
    messages: Array<Record<string, any>>;
    reviews: Array<Record<string, any>>;
    analytics_events?: Array<Record<string, any>>;
    login_history?: Array<Record<string, any>>;
    rectifications?: Array<Record<string, any>>;
    consent_logs?: Array<Record<string, any>>;
  };
}

export interface DeletionResponse {
  status: 'deletion_scheduled' | 'already_scheduled';
  deletion_date: string;
  grace_period_days: number;
  message: string;
}

export interface ProcessingRestrictionRequest {
  reason: 'accuracy_contested' | 'unlawful_processing' | 'legal_claims' | 'objection_pending' | 'other';
  reason_detail: string;
  restrict_analytics?: boolean;
  restrict_marketing?: boolean;
  restrict_profile_updates?: boolean;
}

export interface PrivacyPolicyResponse {
  version: string;
  effective_date: string;
  content: string;
  processing_purposes: Record<string, {
    legal_basis: string;
    description: string;
    required: boolean;
  }>;
  data_retention: Record<string, string>;
  user_rights: Record<string, {
    article: string;
    description: string;
    endpoint: string;
  }>;
  controller_info: {
    name: string;
    email: string;
  };
}

export class GDPRApiService {
  /**
   * Get current consent status and processing purposes
   */
  static async getConsentStatus(): Promise<GDPRConsentResponse> {
    const response = await api.get('users/gdpr/consent');
    return response.data;
  }

  /**
   * Update consent preferences
   */
  static async updateConsent(consents: ConsentPreferences): Promise<void> {
    await api.post('users/gdpr/consent', consents);
  }

  /**
   * Update specific consent type
   */
  static async updateConsentType(consentType: keyof ConsentPreferences, value: boolean): Promise<void> {
    await api.post('users/gdpr/consent', { [consentType]: value });
  }

  /**
   * Export all user data (requires password verification)
   */
  static async exportData(password: string): Promise<DataExportResponse> {
    const response = await api.post('users/gdpr/export', { password });
    return response.data;
  }

  /**
   * Get processing restriction status
   */
  static async getRestrictionStatus(): Promise<GDPRRestrictionResponse> {
    const response = await api.get('users/gdpr/restriction');
    return response.data;
  }

  /**
   * Request processing restriction
   */
  static async requestRestriction(restrictionData: ProcessingRestrictionRequest): Promise<void> {
    await api.post('users/gdpr/restriction', restrictionData);
  }

  /**
   * Cancel pending restriction request
   */
  static async cancelRestriction(restrictionId: number): Promise<void> {
    await api.delete('users/gdpr/restriction', {
      data: { restriction_id: restrictionId }
    });
  }

  /**
   * Request to lift active restriction
   */
  static async liftRestriction(reason: string): Promise<void> {
    await api.post('users/gdpr/restriction/lift', { reason });
  }

  /**
   * Schedule account deletion (requires password verification)
   */
  static async deleteAccount(password: string): Promise<DeletionResponse> {
    const response = await api.post('users/gdpr/delete-account', { password });
    return response.data;
  }

  /**
   * Cancel scheduled account deletion
   */
  static async cancelDeletion(): Promise<void> {
    await api.delete('users/gdpr/delete-account');
  }

  /**
   * Get current privacy policy
   */
  static async getPrivacyPolicy(): Promise<PrivacyPolicyResponse> {
    const response = await api.get('users/privacy/policy');
    return response.data;
  }

  /**
   * Accept privacy policy update
   */
  static async acceptPolicy(acceptTerms: boolean): Promise<void> {
    await api.post('users/gdpr/accept-policy', { accept_terms: acceptTerms });
  }
}

// Error types for GDPR operations
export class GDPRError extends Error {
  constructor(
    message: string,
    public code: string,
    public article?: string,
    public help?: string
  ) {
    super(message);
    this.name = 'GDPRError';
  }
}

// Helper function to handle GDPR API errors
export const handleGDPRError = (error: any): GDPRError => {
  if (error.response?.data) {
    const { error: message, code, article, help } = error.response.data;
    return new GDPRError(message, code, article, help);
  }

  return new GDPRError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR'
  );
};

export default GDPRApiService;
