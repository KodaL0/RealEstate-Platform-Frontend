import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import ModalContainer from './ui/ModalContainer';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (consents: ConsentPreferences) => Promise<void>;
  onDecline: () => void;
  initialConsents?: ConsentPreferences;
  mode?: 'initial' | 'update' | 'required';
  showSocialConsent?: boolean; // NEW: control whether social consent is shown (default true for backward compatibility)
}

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
}

const GDPRConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  initialConsents = { analytics: false, marketing: false },
  mode = 'initial',
  showSocialConsent = false // Deprecated parameter, kept for compatibility
}) => {
  const [consents, setConsents] = useState<ConsentPreferences>(initialConsents);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allSelectedOnce, setAllSelectedOnce] = useState(false);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({
    analytics: false,
    marketing: false
  });

  console.log('🟣 [GDPRConsentModal] Rendering - isOpen:', isOpen, 'mode:', mode, 'initialConsents:', JSON.stringify(initialConsents));

  if (!isOpen) {
    console.log('🟣 [GDPRConsentModal] Not open - returning null');
    return null;
  }
  
  console.log('🟣 [GDPRConsentModal] Modal is OPEN - rendering modal');

  const consentOptions = [
    {
      key: 'analytics' as keyof ConsentPreferences,
      title: 'Analytics & Performance',
      description: 'Help us improve the platform by understanding usage patterns and performance metrics.',
      legalBasis: 'Legitimate Interest (Article 6.1.f GDPR) - Can opt-out (Article 21)',
      details: 'We use analytics to understand how users interact with our platform, identify areas for improvement, and ensure optimal performance. This data is aggregated and anonymized. For registered users, analytics is enabled by default under legitimate interest, but you can opt-out at any time.',
      required: false
    },
    {
      key: 'marketing' as keyof ConsentPreferences,
      title: 'Marketing & Recommendations',
      description: 'Receive property recommendations, platform updates, and promotional content.',
      legalBasis: 'Consent (Article 6.1.a GDPR)',
      details: 'We may send you personalized property recommendations, platform updates, and occasional promotional content. You can unsubscribe at any time.',
      required: false
    }
  ];

  const handleConsentChange = (key: keyof ConsentPreferences, value: boolean) => {
    console.log('🟣 [GDPRConsentModal] Consent toggled:', key, '=', value);
    setConsents(prev => ({ ...prev, [key]: value }));
  };

  const handleAccept = async () => {
    console.log('🟣 [GDPRConsentModal] Save Preferences clicked with consents:', JSON.stringify(consents));
    setIsSubmitting(true);
    try {
      await onAccept(consents);
      console.log('🟣 [GDPRConsentModal] onAccept completed successfully');
      onClose();
    } catch (error) {
      console.error('❌ [GDPRConsentModal] Failed to save consents:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAllAndSave = async () => {
    const allSelected = consents.analytics && consents.marketing;
    
    if (!allSelected || !allSelectedOnce) {
      // First click or not all selected - select all
      console.log('🟣 [GDPRConsentModal] Select All & Save - First click: Selecting all consents');
      setConsents({ analytics: true, marketing: true });
      setAllSelectedOnce(true);
    } else {
      // Second click - save
      console.log('🟣 [GDPRConsentModal] Select All & Save - Second click: Saving with consents:', JSON.stringify(consents));
      setIsSubmitting(true);
      try {
        await onAccept(consents);
        console.log('🟣 [GDPRConsentModal] onAccept completed successfully');
        onClose();
      } catch (error) {
        console.error('❌ [GDPRConsentModal] Failed to save consents:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'initial':
        return 'Privacy & Consent Preferences';
      case 'update':
        return 'Update Your Privacy Preferences';
      case 'required':
        return 'Required Privacy Settings';
      default:
        return 'Privacy Settings';
    }
  };

  const getModalDescription = () => {
    switch (mode) {
      case 'initial':
        return 'To provide you with the best experience, please let us know how you\'d like us to use your data. You can change these preferences at any time in your privacy settings.';
      case 'update':
        return 'You can update your consent preferences at any time. Changes will take effect immediately.';
      case 'required':
        return 'Some privacy settings are required for basic platform functionality.';
      default:
        return 'Manage your privacy and consent preferences.';
    }
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      description={getModalDescription()}
      showCloseButton={true}
      contentClassName="flex flex-col"
    >
      {/* Content */}
      <div className="space-y-4 sm:space-y-6">
        {consentOptions.map((option) => (
          <div key={option.key} className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  id={option.key}
                  checked={consents[option.key]}
                  onChange={(e) => handleConsentChange(option.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <label htmlFor={option.key} className="text-xs sm:text-sm font-medium text-gray-900 cursor-pointer">
                    {option.title}
                    {!option.required && (
                      <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-gray-500">(Optional)</span>
                    )}
                  </label>

                  <button
                    onClick={() => setShowDetails(prev => ({
                      ...prev,
                      [option.key]: !prev[option.key]
                    }))}
                    className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 flex items-center flex-shrink-0"
                  >
                    <Info className="h-3 w-3 mr-0.5 sm:mr-1" />
                    {showDetails[option.key] ? 'Hide' : 'Details'}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 leading-relaxed">
                  {option.description}
                </p>

                {showDetails[option.key] && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-md">
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{option.details}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2">
                      Legal basis: {option.legalBasis}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Essential Processing Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm sm:text-base font-medium text-blue-900">Essential Processing</h4>
              <p className="text-xs sm:text-sm text-blue-800 mt-0.5 sm:mt-1 leading-relaxed">
                Account management, security, and basic platform functionality operate under legitimate interest
                (Article 6.1.f GDPR) and do not require consent.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-4 sm:px-8 sm:py-6 border-t border-gray-200 -mx-4 -mb-4 sm:-mx-8 sm:-mb-6">
        <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="leading-relaxed">You can change these preferences anytime in your privacy settings.</span>
        </div>

        <div className="flex flex-row gap-2 sm:gap-3">
          {/* Save Current Selection Button */}
          <button
            onClick={handleAccept}
            disabled={isSubmitting}
            className="flex-1 px-2 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? 'Saving...' : 'Save Current Selection'}
          </button>

          {/* Save All Button - Primary Action */}
          <button
            onClick={handleSelectAllAndSave}
            disabled={isSubmitting}
            className="flex-1 px-2 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? 'Saving...' : 
             (consents.analytics && consents.marketing && allSelectedOnce) ? 
             'Save All' : 'Select All & Save'}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

export default GDPRConsentModal;
