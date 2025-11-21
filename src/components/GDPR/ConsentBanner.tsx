/**
 * GDPR Consent Banner
 *
 * Displays a center-screen modal on first visit requiring user to make a consent choice.
 * Blocks site navigation until consent is given (except navbar for login).
 *
 * GDPR Compliance:
 * - Consent required before any tracking
 * - Clear information about data usage
 * - Easy to accept, reject, or customize
 * - No pre-checked boxes
 */

import { Check, Settings, Shield, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { ConsentPreferences } from "../../services/ConsentManager";
import GDPRConsentModal from "../GDPRConsentModal";

interface ConsentBannerProps {
  onConsent: (consents: ConsentPreferences) => void;
  isAuthenticated?: boolean;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({ onConsent, isAuthenticated }) => {
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAcceptAll = async () => {
    setIsProcessing(true);
    try {
      await onConsent({
        analytics: true,
        marketing: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptMinimum = async () => {
    setIsProcessing(true);
    try {
      await onConsent({
        analytics: false,
        marketing: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomize = () => {
    setShowCustomizeModal(true);
  };

  const handleCustomizeAccept = async (consents: ConsentPreferences) => {
    setIsProcessing(true);
    try {
      await onConsent(consents);
      setShowCustomizeModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Full-screen overlay with blur effect */}
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" />

      {/* Consent Modal - Center Screen - Hide when customize modal is open */}
      {!showCustomizeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Privacy Matters</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    We respect your data rights under GDPR
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Welcome to PropertPro! We use cookies and similar technologies to provide you with
                  a better experience. Before you continue, please let us know how we can use your
                  data.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong className="text-blue-900">Essential operations</strong> like account
                    management and security are always active. We need your consent for:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        <strong>Analytics:</strong> Help us improve by understanding how you use our
                        platform
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        <strong>Marketing:</strong> Receive personalized property recommendations
                        and updates
                      </span>
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500">
                  You can change your preferences at any time in your privacy settings. By clicking
                  "Accept All" you consent to our use of cookies and data processing. Read our{" "}
                  <a
                    href="/legal/privacy-policy/"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 underline"
                    rel="noopener"
                  >
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a
                    href="/cookies"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 underline"
                    rel="noopener"
                  >
                    Cookie Policy
                  </a>{" "}
                  for more information.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Essential Only */}
                <button
                  type="button"
                  onClick={handleAcceptMinimum}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-600 hover:bg-gray-700 
                         disabled:bg-gray-400 text-white font-medium text-sm rounded-lg transition-all duration-200
                         transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <X className="w-4 h-4" />
                  {isProcessing ? "Processing..." : "Essential Only"}
                </button>

                {/* Accept All - Primary Action (Center) */}
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 
                         disabled:bg-blue-400 text-white font-medium text-sm rounded-lg transition-all duration-200
                         shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40
                         transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  {isProcessing ? "Processing..." : "Accept All"}
                </button>

                {/* Customize */}
                <button
                  type="button"
                  onClick={handleCustomize}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 
                         disabled:bg-gray-100 text-gray-700 font-medium text-sm rounded-lg border-2 border-gray-300
                         hover:border-gray-400 transition-all duration-200
                         transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Settings className="w-4 h-4" />
                  Customize
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                  {isAuthenticated ? (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-600" />
                        You're logged in
                      </span>{" "}
                      — Your choices will be saved to your account
                    </>
                  ) : (
                    <>
                      Not logged in? Your choices will be saved locally.
                      <a href="/login" className="text-blue-600 hover:text-blue-700 underline ml-1">
                        Log in
                      </a>{" "}
                      to sync across devices.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customize Modal */}
      {showCustomizeModal && (
        <GDPRConsentModal
          isOpen={showCustomizeModal}
          onClose={() => setShowCustomizeModal(false)}
          onAccept={handleCustomizeAccept}
          onDecline={handleAcceptMinimum}
          initialConsents={{ analytics: false, marketing: false }}
          mode="initial"
        />
      )}
    </>
  );
};

export default ConsentBanner;
