/**
 * Google Analytics 4 Enhanced Tracking Utility
 * 
 * This module provides comprehensive event tracking for the PropertPro platform.
 * It wraps the Google Analytics gtag function with type-safe, business-specific events.
 */

// Type-safe gtag declaration
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set' | 'get',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

// ============================================================================
// PROPERTY EVENTS
// ============================================================================

export interface PropertyViewParams {
  property_id: string;
  property_type: string;
  price: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  property_status: string;
  owner_username?: string;
  is_featured?: boolean;
}

export const trackPropertyView = (params: PropertyViewParams) => {
  if (typeof window.gtag !== 'function') return;

  // GA4 ecommerce view_item event
  window.gtag('event', 'view_item', {
    currency: 'EUR',
    value: params.price,
    items: [{
      item_id: params.property_id,
      item_name: `Property ${params.property_id}`,
      item_category: params.property_type,
      item_category2: params.property_status,
      item_category3: params.location,
      price: params.price,
      quantity: 1,
      item_brand: params.owner_username || 'Unknown',
    }]
  });

  // Custom property view event with additional details
  window.gtag('event', 'property_view', {
    property_id: params.property_id,
    property_type: params.property_type,
    property_status: params.property_status,
    price: params.price,
    location: params.location,
    bedrooms: params.bedrooms,
    bathrooms: params.bathrooms,
    area: params.area,
    is_featured: params.is_featured,
  });
};

export const trackPropertyImageView = (propertyId: string, imageIndex: number, totalImages: number) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'property_image_navigation', {
    property_id: propertyId,
    image_index: imageIndex,
    total_images: totalImages,
    image_progress: Math.round((imageIndex / Math.max(totalImages - 1, 1)) * 100),
  });
};

export const trackPropertyContact = (propertyId: string, contactMethod: 'phone' | 'email' | 'chat' | 'whatsapp') => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'contact_property_owner', {
    property_id: propertyId,
    contact_method: contactMethod,
    event_category: 'engagement',
    event_label: `${contactMethod}_click`,
  });

  // This is a conversion event
  window.gtag('event', 'generate_lead', {
    currency: 'EUR',
    value: 1,
  });
};

export const trackPropertyFavorite = (propertyId: string, action: 'add' | 'remove', propertyType?: string) => {
  if (typeof window.gtag !== 'function') return;
  
  const eventName = action === 'add' ? 'add_to_wishlist' : 'remove_from_wishlist';
  
  window.gtag('event', eventName, {
    property_id: propertyId,
    property_type: propertyType,
    event_category: 'engagement',
  });
};

export const trackDocumentView = (propertyId: string, documentType: string, documentName: string) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'view_document', {
    property_id: propertyId,
    document_type: documentType,
    document_name: documentName,
    event_category: 'engagement',
  });
};

export const trackMapInteraction = (propertyId: string, action: 'open' | 'zoom' | 'drag') => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'map_interaction', {
    property_id: propertyId,
    interaction_type: action,
    event_category: 'engagement',
  });
};

// ============================================================================
// SEARCH & DISCOVERY EVENTS
// ============================================================================

export interface SearchParams {
  search_term?: string;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  property_status?: string;
  sort_by?: string;
  results_count?: number;
}

export const trackPropertySearch = (params: SearchParams) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'search', {
    search_term: params.search_term || 'browse',
    property_type: params.property_type,
    min_price: params.min_price,
    max_price: params.max_price,
    bedrooms: params.bedrooms,
    bathrooms: params.bathrooms,
    location: params.location,
    property_status: params.property_status,
    sort_by: params.sort_by,
    results_count: params.results_count,
  });
};

export const trackFilterChange = (filterName: string, filterValue: any, resultsCount?: number) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'filter_applied', {
    filter_name: filterName,
    filter_value: String(filterValue),
    results_count: resultsCount,
    event_category: 'search',
  });
};

export const trackSortChange = (sortBy: string, resultsCount?: number) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'sort_changed', {
    sort_by: sortBy,
    results_count: resultsCount,
    event_category: 'search',
  });
};

// ============================================================================
// USER ENGAGEMENT EVENTS
// ============================================================================

export const trackUserRegistration = (method: 'email' | 'google' | 'facebook', isDeveloper: boolean) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'sign_up', {
    method: method,
    user_type: isDeveloper ? 'developer' : 'regular',
  });
};

export const trackUserLogin = (method: 'email' | 'google' | 'facebook') => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'login', {
    method: method,
  });
};

export const trackProfileView = (username: string, viewerIsOwner: boolean, tab?: string) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'profile_view', {
    profile_username: username,
    is_own_profile: viewerIsOwner,
    tab_viewed: tab,
    event_category: 'engagement',
  });
};

export const trackConnectionAction = (action: 'send' | 'accept' | 'reject' | 'remove', targetUsername: string) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'connection_action', {
    action: action,
    target_username: targetUsername,
    event_category: 'social',
  });
};

export const trackChatAction = (action: 'initiate' | 'send_message' | 'view_thread', recipientUsername?: string) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'chat_action', {
    action: action,
    recipient_username: recipientUsername,
    event_category: 'engagement',
  });
};

export const trackReviewAction = (action: 'create' | 'update' | 'delete', rating: number, targetUsername: string) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'review_action', {
    action: action,
    rating: rating,
    target_username: targetUsername,
    event_category: 'engagement',
  });
};

// ============================================================================
// LISTING CREATION FUNNEL
// ============================================================================

export const trackListingStepView = (step: number, stepName: string, isEdit: boolean) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'listing_step_view', {
    step_number: step,
    step_name: stepName,
    is_edit: isEdit,
    event_category: 'listing_creation',
  });
};

export const trackListingStepComplete = (step: number, stepName: string, isEdit: boolean) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'listing_step_complete', {
    step_number: step,
    step_name: stepName,
    is_edit: isEdit,
    event_category: 'listing_creation',
  });
};

export const trackListingPublish = (propertyId: string, propertyType: string, price: number, isEdit: boolean) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', isEdit ? 'listing_updated' : 'listing_created', {
    property_id: propertyId,
    property_type: propertyType,
    price: price,
    event_category: 'listing_creation',
    value: 1,
  });

  // Conversion event
  if (!isEdit) {
    window.gtag('event', 'conversion', {
      send_to: 'ads',
      value: 1,
      currency: 'EUR',
      transaction_id: propertyId,
    });
  }
};

export const trackListingDelete = (propertyId: string, propertyType: string) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'listing_deleted', {
    property_id: propertyId,
    property_type: propertyType,
    event_category: 'listing_management',
  });
};

// ============================================================================
// DEVELOPER PORTAL EVENTS
// ============================================================================

export const trackDeveloperAction = (
  action: 'create_project' | 'update_project' | 'add_unit' | 'publish_unit' | 'upload_asset',
  details?: Record<string, any>
) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'developer_action', {
    action: action,
    ...details,
    event_category: 'developer_portal',
  });
};

// ============================================================================
// CALCULATOR & TOOLS
// ============================================================================

export const trackCalculatorUse = (calculatorType: 'mortgage' | 'rent_vs_buy', inputs: Record<string, any>) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'calculator_use', {
    calculator_type: calculatorType,
    ...inputs,
    event_category: 'tools',
  });
};

// ============================================================================
// ERROR & PERFORMANCE TRACKING
// ============================================================================

export const trackError = (errorType: string, errorMessage: string, componentName?: string) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
    component: componentName,
  });
};

export const trackPerformance = (metricName: string, value: number, unit: string) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'timing_complete', {
    name: metricName,
    value: Math.round(value),
    event_category: 'performance',
    event_label: unit,
  });
};

// ============================================================================
// SOCIAL SHARING
// ============================================================================

export const trackShare = (contentType: 'property' | 'profile' | 'project', contentId: string, method: string) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'share', {
    content_type: contentType,
    item_id: contentId,
    method: method,
  });
};

export const trackInstagramPost = (propertyId: string, success: boolean) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'instagram_post', {
    property_id: propertyId,
    success: success,
    event_category: 'social_media',
  });
};

// ============================================================================
// CUSTOM USER PROPERTIES
// ============================================================================

export const setUserProperties = (userId: string | number, properties: {
  is_developer?: boolean;
  is_verified?: boolean;
  listings_count?: number;
  connections_count?: number;
  account_age_days?: number;
  country?: string;
}) => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('set', 'user_properties', {
    user_id: String(userId),
    ...properties,
  });
};

// ============================================================================
// EXPORT ALL
// ============================================================================

const analytics = {
  // Property events
  trackPropertyView,
  trackPropertyImageView,
  trackPropertyContact,
  trackPropertyFavorite,
  trackDocumentView,
  trackMapInteraction,
  
  // Search events
  trackPropertySearch,
  trackFilterChange,
  trackSortChange,
  
  // User events
  trackUserRegistration,
  trackUserLogin,
  trackProfileView,
  trackConnectionAction,
  trackChatAction,
  trackReviewAction,
  
  // Listing creation
  trackListingStepView,
  trackListingStepComplete,
  trackListingPublish,
  trackListingDelete,
  
  // Developer portal
  trackDeveloperAction,
  
  // Tools
  trackCalculatorUse,
  
  // Errors & performance
  trackError,
  trackPerformance,
  
  // Social
  trackShare,
  trackInstagramPost,
  
  // User properties
  setUserProperties,
};

export default analytics;









