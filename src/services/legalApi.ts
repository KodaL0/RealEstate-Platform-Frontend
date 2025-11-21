/**
 * Legal Documents API Service
 * Handles retrieval and acceptance of versioned legal documents
 */
import api from "../config/api";
import { apiCache, cacheKey } from "../utils/apiCache";

// TypeScript interfaces for Legal Document responses
export interface LegalDocument {
  document_type: string;
  version: string;
  title: string;
  effective_date: string;
  content: string;
  summary: string;
  is_current: boolean;
  requires_acceptance: boolean;
  has_accepted: boolean;
  // Privacy Policy specific fields
  processing_purposes?: Record<
    string,
    {
      legal_basis: string;
      description: string;
      required: boolean;
      retention?: string;
    }
  >;
  data_retention?: Record<string, string>;
  user_rights?: Record<
    string,
    {
      article: string;
      description: string;
      endpoint: string;
    }
  >;
  controller_info?: {
    name: string;
    email: string;
    address: string;
  };
}

export interface LegalDocumentListItem {
  type: string;
  display_name: string;
  version: string;
  title: string;
  effective_date: string;
  requires_acceptance: boolean;
  endpoint: string;
}

export interface LegalDocumentList {
  documents: Record<string, LegalDocumentListItem>;
  total_count: number;
}

export interface AcceptanceStatus {
  current_documents: Record<
    string,
    {
      version: string;
      requires_acceptance: boolean;
      accepted: boolean;
      accepted_at: string | null;
    }
  >;
  needs_acceptance: Array<{
    document_type: string;
    version: string;
    display_name: string;
  }>;
  needs_acceptance_required: Array<{
    document_type: string;
    version: string;
    display_name: string;
  }>;
  needs_acceptance_optional: Array<{
    document_type: string;
    version: string;
    display_name: string;
  }>;
  all_acceptances: Array<{
    document_type: string;
    version: string;
    accepted_at: string;
    is_current_version: boolean;
  }>;
}

export interface AcceptDocumentResponse {
  message: string;
  document_type: string;
  version: string;
  accepted_at: string;
}

// biome-ignore lint/complexity/noStaticOnlyClass: API service pattern - methods are logically grouped
export class LegalDocumentsAPI {
  /**
   * List all available legal documents
   */
  static async listDocuments(): Promise<LegalDocumentList> {
    const response = await api.get("users/legal");
    return response.data as LegalDocumentList;
  }

  /**
   * Get a specific legal document (current or specific version)
   * Cached for 5 minutes to reduce API calls
   */
  static async getDocument(
    documentType:
      | "privacy_policy"
      | "terms_conditions"
      | "cookie_policy"
      | "acceptable_use"
      | "data_processing",
    version?: string,
  ): Promise<LegalDocument> {
    // Check cache first
    const key = cacheKey.legalDocument(documentType, version);
    const cached = apiCache.get<LegalDocument>(key);

    if (cached) {
      console.log(`[Cache Hit] Legal document: ${documentType}`);
      return cached;
    }

    // Fetch from API
    const params = version ? { version } : {};
    const response = await api.get(`users/legal/${documentType}`, { params });

    // Cache for 5 minutes
    const documentData = response.data as LegalDocument;
    apiCache.set(key, documentData, 5 * 60 * 1000);

    return documentData;
  }

  /**
   * Get Privacy Policy
   */
  static async getPrivacyPolicy(version?: string): Promise<LegalDocument> {
    return LegalDocumentsAPI.getDocument("privacy_policy", version);
  }

  /**
   * Get Terms & Conditions
   */
  static async getTermsAndConditions(version?: string): Promise<LegalDocument> {
    return LegalDocumentsAPI.getDocument("terms_conditions", version);
  }

  /**
   * Get Cookie Policy
   */
  static async getCookiePolicy(version?: string): Promise<LegalDocument> {
    return LegalDocumentsAPI.getDocument("cookie_policy", version);
  }

  /**
   * Accept a legal document (requires authentication)
   */
  static async acceptDocument(
    documentType: string,
    version?: string,
    userId?: number,
  ): Promise<AcceptDocumentResponse> {
    const data = version ? { version } : {};
    const response = await api.post(`users/legal/${documentType}/accept`, data);

    // Invalidate acceptance status cache after accepting
    if (userId) {
      apiCache.invalidate(cacheKey.legalAcceptance(userId));
    }

    // Also invalidate the specific document cache to refresh acceptance status
    apiCache.invalidate(cacheKey.legalDocument(documentType, version));

    return response.data as AcceptDocumentResponse;
  }

  /**
   * Get user's acceptance status for all documents (requires authentication)
   * Cached for 1 minute to reduce API calls
   */
  static async getAcceptanceStatus(userId?: number, skipCache = false): Promise<AcceptanceStatus> {
    // Check cache first (unless explicitly skipped)
    if (userId && !skipCache) {
      const key = cacheKey.legalAcceptance(userId);
      const cached = apiCache.get<AcceptanceStatus>(key);

      if (cached) {
        console.log(`[Cache Hit] Legal acceptance status for user ${userId}`);
        return cached;
      }
    }

    // Fetch from API
    console.log(`[API Call] Fetching legal acceptance status for user ${userId || "current"}`);
    const response = await api.get("users/legal/acceptance-status");

    console.log("[API Response] Acceptance status:", response.data);

    // Cache for 1 minute (shorter TTL since acceptance status changes more frequently)
    const acceptanceData = response.data as AcceptanceStatus;
    if (userId) {
      apiCache.set(cacheKey.legalAcceptance(userId), acceptanceData, 1 * 60 * 1000);
    }

    return acceptanceData;
  }

  /**
   * Check if user needs to accept any documents
   */
  static async needsAcceptance(): Promise<boolean> {
    try {
      const status = await LegalDocumentsAPI.getAcceptanceStatus();
      return status.needs_acceptance.length > 0;
    } catch (_error) {
      // If not authenticated or error, return false
      return false;
    }
  }
}

export default LegalDocumentsAPI;
