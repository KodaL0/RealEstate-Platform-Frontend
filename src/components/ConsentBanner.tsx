/**
 * GDPR Consent Banner
 *
 * Professional cookie consent banner following major websites' patterns.
 * Features:
 * - Center-screen modal on first visit
 * - Company logo and branding
 * - Clear consent options
 * - Links to privacy policy
 * - GDPR compliant
 */

import React, { useState } from 'react';
import { Shield, Check, X, Cookie } from 'lucide-react';
import { ConsentPreferences } from '../services/ConsentManager';
import ModalContainer from './ui/ModalContainer';

interface ConsentBannerProps {
  onConsent: (consents: ConsentPreferences) => void;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({ onConsent }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    console.log('✅ [ConsentBanner] User clicked: ACCEPT');
    setIsProcessing(true);
    try {
      const consents = {
        analytics: true,
        marketing: false
      };
      console.log('✅ [ConsentBanner] Sending consents:', JSON.stringify(consents));
      await onConsent(consents);
      console.log('✅ [ConsentBanner] Accept completed successfully');
    } catch (error) {
      console.error('❌ [ConsentBanner] Accept failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    console.log('❌ [ConsentBanner] User clicked: REJECT');
    setIsProcessing(true);
    try {
      const consents = {
        analytics: false,
        marketing: false
      };
      console.log('❌ [ConsentBanner] Sending consents:', JSON.stringify(consents));
      await onConsent(consents);
      console.log('✅ [ConsentBanner] Reject completed successfully');
    } catch (error) {
      console.error('❌ [ConsentBanner] Reject failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ModalContainer
      isOpen={true}
      onClose={() => {}}
      title=""
      showCloseButton={false}
      contentClassName="flex flex-col p-0"
    >
      {/* Blue Header with Logo */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 sm:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center mb-4">
          <img
            src="/favicon.svg"
            alt="PropertPro"
            className="w-16 h-16 sm:w-20 sm:h-20"
          />
        </div>
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            We value your privacy
          </h2>
          <p className="text-sm sm:text-base text-blue-50">
            We use cookies to enhance your browsing experience and analyze our traffic
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-8 py-6 space-y-4">
        {/* Cookie Information */}
        <div className="space-y-3">
          {/* Essential Cookies */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900">Essential</h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                  Always Active
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Required for site functionality, security, and your account
              </p>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Cookie className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Analytics</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Helps us understand how you use our platform to improve your experience
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Policy Link */}
        <div className="pt-2">
          <p className="text-xs text-gray-500 text-center">
            By clicking "Accept", you agree to the storing of cookies on your device.{' '}
            <a
              href="/privacy-policy"
              className="text-blue-600 hover:text-blue-700 underline font-medium transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 sm:px-8 pb-6 sm:pb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Accept - Primary Action */}
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5
                     bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                     text-white font-semibold rounded-xl
                     transition-all duration-200 shadow-lg shadow-blue-600/30
                     hover:shadow-xl hover:shadow-blue-600/40
                     transform hover:scale-[1.02] active:scale-[0.98]
                     disabled:cursor-not-allowed disabled:transform-none"
          >
            <Check className="w-5 h-5" />
            <span>{isProcessing ? 'Processing...' : 'Accept All'}</span>
          </button>

          {/* Reject - Secondary Action */}
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5
                     bg-white hover:bg-gray-50 disabled:bg-gray-50
                     text-gray-700 font-medium rounded-xl
                     transition-all duration-200
                     border-2 border-gray-300 hover:border-gray-400
                     disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            <span>{isProcessing ? 'Processing...' : 'Reject All'}</span>
          </button>
        </div>

        {/* Customize option */}
        <button
          className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          disabled={isProcessing}
        >
          Customize preferences
        </button>
      </div>
    </ModalContainer>
  );
};

export default ConsentBanner;
