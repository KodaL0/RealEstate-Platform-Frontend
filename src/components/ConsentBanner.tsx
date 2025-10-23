/**
 * GDPR Consent Banner
 * 
 * Displays a center-screen modal on first visit requiring user to make a consent choice.
 * Blocks site navigation until consent is given (except navbar for login).
 * 
 * GDPR Compliance:
 * - Consent required before any tracking
 * - Clear information about data usage
 * - Easy to accept or reject
 * - No pre-checked boxes
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Check, X } from 'lucide-react';
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
    <>
      <ModalContainer
        isOpen={true}
        onClose={() => {}} // No close button for consent banner
        title=""
        description=""
        showCloseButton={false}
        contentClassName="flex flex-col p-0"
      >
        {/* Professional Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 sm:px-8 py-5 sm:py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 sm:p-2.5 rounded-lg backdrop-blur-sm">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Welcome to PropertPro</h2>
              <p className="text-blue-100 text-xs sm:text-sm">Your privacy matters to us</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 space-y-4">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            We use cookies to provide you with the best experience. This includes essential 
            functionality and analytics to help us improve our platform.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 mb-2">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Essential & Analytics</p>
                <p className="text-xs text-gray-600 mt-0.5">Account security and platform improvements</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            By continuing, you agree to our use of cookies.{' '}
            <Link to="/legal/privacy-policy/" className="text-blue-600 hover:text-blue-700 underline font-medium">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 sm:px-8 pb-5 sm:pb-6 pt-2">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Accept - Primary Action (prominent) */}
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="order-1 sm:order-2 flex-[3] flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 
                       bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg 
                       transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="w-5 h-5" />
              {isProcessing ? 'Processing...' : 'Accept & Continue'}
            </button>

            {/* Reject - Secondary Action (less prominent) */}
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="order-2 sm:order-1 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3.5 
                       bg-white hover:bg-gray-50 disabled:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg 
                       transition-all duration-200 border border-gray-300 hover:border-gray-400"
            >
              <X className="w-4 h-4" />
              {isProcessing ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </div>
      </ModalContainer>
    </>
  );
};

export default ConsentBanner;

