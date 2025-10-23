import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import GDPRApiService, { ConsentPreferences, handleGDPRError } from '../services/gdprApi';
import IdentityVerificationModal from '../components/IdentityVerificationModal';

// Local interface for processing restriction data
interface ProcessingRestrictionData {
  reason: string;
  reasonDetail: string;
  restrictAnalytics?: boolean;
  restrictMarketing?: boolean;
  restrictProfileUpdates?: boolean;
}

const PrivacySettings: React.FC = () => {
  const { refreshGDPRStatus, updateGDPRConsent, getGDPRStatus } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'consents' | 'rights' | 'account'>('consents');
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    operation: string;
    onVerify: (password: string) => Promise<void>;
  } | null>(null);

  const [showRestrictionForm, setShowRestrictionForm] = useState(false);

  // Get current GDPR status
  const gdprStatus = getGDPRStatus();

  // Load GDPR status on component mount (ONCE)
  useEffect(() => {
    loadGDPRStatus();
  }, []); // Empty dependency array - only run once on mount

  // REMOVED: Auto-showing consent modal on PrivacySettings page
  // Users come to this page TO set preferences, they shouldn't be forced with a modal
  // The cookie banner already handles initial consent collection
  // This page is for managing existing preferences, not forcing initial collection

  const loadGDPRStatus = async () => {
    try {
      setIsLoading(true);
      await refreshGDPRStatus();
    } catch (error) {
      console.error('Failed to load GDPR status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsent = async (consentType: keyof ConsentPreferences, value: boolean) => {
    try {
      setIsUpdating(true);
      const success = await updateGDPRConsent(consentType, value);

      if (success) {
        showToast('Consent preferences updated successfully', 'success');
      } else {
        showToast('Failed to update consent preferences', 'error');
      }
    } catch (error) {
      console.error('Failed to update consent:', error);
      showToast('Failed to update consent preferences', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDataExport = async () => {
    const password = await showPasswordVerificationModal('data export', async (password: string) => {
      await GDPRApiService.exportData(password);
    }, setVerificationModal);
    if (!password) return;

    try {
      const response = await GDPRApiService.exportData(password);

      // Create download link for the JSON data
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `propertpro-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Data export downloaded successfully', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      const gdprError = handleGDPRError(error);
      showToast(gdprError.message, 'error');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.'
    );

    if (!confirmed) return;

    const password = await showPasswordVerificationModal('account deletion', async (password: string) => {
      await GDPRApiService.deleteAccount(password);
    }, setVerificationModal);
    if (!password) return;

    try {
      const response = await GDPRApiService.deleteAccount(password);

      if (response.status === 'deletion_scheduled') {
        showToast(
          `Account deletion scheduled for ${response.deletion_date}. You can cancel within ${response.grace_period_days} days.`,
          'warning'
        );
        // Optionally redirect to login or show deletion confirmation
      }
    } catch (error) {
      console.error('Account deletion failed:', error);
      const gdprError = handleGDPRError(error);
      showToast(gdprError.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Privacy Settings</h1>
                <p className="text-gray-600">Manage your data and privacy preferences</p>
              </div>
            </div>

            {/* GDPR Status Banner */}
            {gdprStatus?.processingRestricted && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <h3 className="font-semibold text-red-800">Processing Restricted</h3>
                    <p className="text-red-700 text-sm">
                      Your data processing is restricted. Some features may be limited.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'consents', label: 'Consent Preferences', icon: CheckCircle },
                  { id: 'rights', label: 'Data Rights', icon: Shield },
                  { id: 'account', label: 'Account Control', icon: AlertTriangle }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-md">
            {activeTab === 'consents' && (
              <ConsentManagementTab
                consents={gdprStatus?.consents || { analytics: false, marketing: false, social: false }}
                onUpdate={updateConsent}
                isUpdating={isUpdating}
                consentGivenAt={gdprStatus?.consentGivenAt || null}
              />
            )}

            {activeTab === 'rights' && (
              <DataRightsTab
                onExport={handleDataExport}
                restrictionStatus={gdprStatus?.processingRestricted}
                showRestrictionForm={showRestrictionForm}
                setShowRestrictionForm={setShowRestrictionForm}
              />
            )}

            {activeTab === 'account' && (
              <AccountControlTab
                onDeleteAccount={handleDeleteAccount}
                restrictionStatus={gdprStatus?.processingRestricted}
                showRestrictionForm={showRestrictionForm}
                setShowRestrictionForm={setShowRestrictionForm}
              />
            )}
          </div>
        </div>
      </div>

      {/* Identity Verification Modal */}
      {verificationModal && (
        <IdentityVerificationModal
          isOpen={verificationModal.isOpen}
          onClose={() => setVerificationModal(null)}
          onVerify={verificationModal.onVerify}
          operation={verificationModal.operation}
        />
      )}

      {/* Consent Collection Modal - Removed auto-show behavior
          Users can manage consents directly on the page without a forced modal
          The cookie banner handles initial consent collection
      */}
    </div>
  );
};

// Consent Management Tab Component
const ConsentManagementTab: React.FC<{
  consents: ConsentPreferences;
  onUpdate: (type: keyof ConsentPreferences, value: boolean) => void;
  isUpdating: boolean;
  consentGivenAt: string | null;
}> = ({ consents, onUpdate, isUpdating, consentGivenAt }) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Your Consent Preferences</h2>
    <p className="text-gray-600 mb-4">
      Control how we use your data for different purposes. You can change these preferences at any time.
    </p>

    {consentGivenAt && (
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Consent given:</strong> {new Date(consentGivenAt).toLocaleDateString()}
        </p>
      </div>
    )}

    <p className="text-gray-600 mb-6">
      Review our <Link to="/privacy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</Link> to understand how we process your data.
    </p>

    <div className="space-y-6">
      {/* Analytics Consent */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h3 className="font-medium">Analytics & Performance</h3>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                consents.analytics ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {consents.analytics ? 'Enabled' : 'Opted Out'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              We use analytics to improve the platform and understand how you use our services. 
              You can opt out at any time.
            </p>
          </div>
          <button
            onClick={() => onUpdate('analytics', !consents.analytics)}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              consents.analytics
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {consents.analytics ? 'Opt Out' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Marketing Consent */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h3 className="font-medium">Marketing & Recommendations</h3>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                consents.marketing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {consents.marketing ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Receive property recommendations, platform updates, and promotional content.
            </p>
            <p className="text-xs text-gray-500">
              Legal basis: Consent (Article 6.1.a GDPR)
            </p>
          </div>
          <button
            onClick={() => onUpdate('marketing', !consents.marketing)}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              consents.marketing
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {consents.marketing ? 'Withdraw Consent' : 'Give Consent'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Data Rights Tab Component
const DataRightsTab: React.FC<{
  onExport: () => void;
  restrictionStatus?: boolean;
  showRestrictionForm: boolean;
  setShowRestrictionForm: (show: boolean) => void;
}> = ({ onExport, restrictionStatus, showRestrictionForm, setShowRestrictionForm }) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Your Data Rights (GDPR)</h2>
    <p className="text-gray-600 mb-6">
      Exercise your rights under the EU General Data Protection Regulation.
    </p>

    <div className="space-y-6">
      {/* Data Export */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium mb-2">Export Your Data (Article 15 & 20)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Download a copy of all your personal data in machine-readable JSON format.
              Includes profile, properties, messages, reviews, and activity history.
            </p>
          </div>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            📥 Export My Data
          </button>
        </div>
      </div>

      {/* Processing Restriction */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium mb-2">Restrict Processing (Article 18)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Request limitation of how we process your personal data for specific legal reasons.
            </p>
            {restrictionStatus && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                <p className="text-red-800 text-sm">
                  🚫 Your data processing is currently restricted.
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowRestrictionForm(!showRestrictionForm)}
            className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            ⚙️ {showRestrictionForm ? 'Hide Form' : 'Request Restriction'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Account Control Tab Component
const AccountControlTab: React.FC<{
  onDeleteAccount: () => void;
  restrictionStatus?: boolean;
  showRestrictionForm: boolean;
  setShowRestrictionForm: (show: boolean) => void;
}> = ({ onDeleteAccount, restrictionStatus, showRestrictionForm, setShowRestrictionForm }) => {
  const [restrictionForm, setRestrictionForm] = useState<ProcessingRestrictionData>({
    reason: 'accuracy_contested',
    reasonDetail: '',
    restrictAnalytics: true,
    restrictMarketing: true,
    restrictProfileUpdates: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRestrictionSubmit = async () => {
    if (!restrictionForm.reasonDetail.trim()) {
      showToast('Please provide details for your restriction request', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await GDPRApiService.requestRestriction({
        reason: restrictionForm.reason as any,
        reason_detail: restrictionForm.reasonDetail,
        restrict_analytics: restrictionForm.restrictAnalytics,
        restrict_marketing: restrictionForm.restrictMarketing,
        restrict_profile_updates: restrictionForm.restrictProfileUpdates
      });

      showToast('Processing restriction request submitted successfully', 'success');
      setShowRestrictionForm(false);
      // Refresh GDPR status to show new restriction
      window.location.reload(); // Simple refresh for demo
    } catch (error) {
      console.error('Failed to submit restriction request:', error);
      showToast('Failed to submit restriction request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Account Control</h2>

    {restrictionStatus && (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <div>
            <h3 className="font-semibold text-red-800">Processing Restricted</h3>
            <p className="text-red-700 text-sm">
              Account deletion and some features are restricted while processing is limited.
            </p>
          </div>
        </div>
      </div>
    )}

      {/* Processing Restriction Form */}
      {showRestrictionForm && (
        <div className="border border-orange-200 rounded-lg p-4 mb-6 bg-orange-50">
          <h3 className="font-semibold text-orange-900 mb-4">Request Processing Restriction</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Restriction *
              </label>
              <select
                value={restrictionForm.reason}
                onChange={(e) => setRestrictionForm((prev: ProcessingRestrictionData) => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="accuracy_contested">Data accuracy is contested</option>
                <option value="unlawful_processing">Processing is unlawful</option>
                <option value="legal_claims">Data needed for legal claims</option>
                <option value="objection_pending">Objection to processing pending</option>
                <option value="other">Other legitimate reason</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Explanation *
              </label>
              <textarea
                value={restrictionForm.reasonDetail}
                onChange={(e) => setRestrictionForm((prev: ProcessingRestrictionData) => ({ ...prev, reasonDetail: e.target.value }))}
                placeholder="Please explain why you need to restrict processing..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What would you like to restrict? (Optional)
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={restrictionForm.restrictAnalytics}
                    onChange={(e) => setRestrictionForm((prev: ProcessingRestrictionData) => ({ ...prev, restrictAnalytics: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Analytics and performance tracking</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={restrictionForm.restrictMarketing}
                    onChange={(e) => setRestrictionForm((prev: ProcessingRestrictionData) => ({ ...prev, restrictMarketing: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Marketing and recommendations</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={restrictionForm.restrictProfileUpdates}
                    onChange={(e) => setRestrictionForm((prev: ProcessingRestrictionData) => ({ ...prev, restrictProfileUpdates: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Profile updates and changes</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRestrictionSubmit}
                disabled={isSubmitting || !restrictionForm.reasonDetail.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                onClick={() => setShowRestrictionForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="space-y-6">
      {/* Account Deletion */}
      <div className="border border-red-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-red-800 mb-2">Delete Account (Article 17)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h4 className="font-medium text-red-800 text-sm mb-2">What happens when you delete your account?</h4>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• Your profile and all personal data will be removed</li>
                <li>• Your properties will be anonymized</li>
                <li>• Your messages and reviews will be deleted</li>
                <li>• You'll lose access to your account permanently</li>
              </ul>
            </div>
          </div>
          <button
            onClick={onDeleteAccount}
            disabled={restrictionStatus}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              restrictionStatus
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            🗑️ Delete My Account
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

// Helper function for toast notifications (implement based on your toast system)
const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
  // For now, use browser alert - replace with your toast system
  alert(`${type.toUpperCase()}: ${message}`);
};

// Show identity verification modal (now using the actual modal component)
const showPasswordVerificationModal = (
  operation: string,
  onVerify: (password: string) => Promise<void>,
  setVerificationModal: (modal: any) => void
): Promise<string | null> => {
  return new Promise((resolve) => {
    // Set modal state to show the verification modal
    setVerificationModal({
      isOpen: true,
      operation,
      onVerify: async (password: string) => {
        try {
          await onVerify(password);
          setVerificationModal(null);
          resolve(password);
        } catch (error) {
          // Keep modal open on error for retry
          resolve(null);
        }
      }
    });
  });
};

export default PrivacySettings;
