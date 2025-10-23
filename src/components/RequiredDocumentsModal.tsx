/**
 * Modal that prompts users to accept required and optional legal documents
 * Shows when user logs in and hasn't accepted current versions
 */
import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import LegalDocumentsAPI from '../services/legalApi';

interface DocumentInfo {
  document_type: string;
  version: string;
  display_name: string;
}

interface RequiredDocumentsModalProps {
  documentsToAccept: DocumentInfo[];
  optionalDocuments?: DocumentInfo[];
  onClose: () => void;
  onAcceptAll: () => void;
}

const RequiredDocumentsModal: React.FC<RequiredDocumentsModalProps> = ({
  documentsToAccept,
  optionalDocuments = [],
  onClose,
  onAcceptAll,
}) => {
  const [acceptedDocs, setAcceptedDocs] = useState<Set<string>>(new Set());
  const [isAccepting, setIsAccepting] = useState(false);
  
  // Debug: Log what documents are being shown
  useEffect(() => {
    console.log('[RequiredDocumentsModal] Rendered with:', {
      required: documentsToAccept,
      optional: optionalDocuments,
      total: documentsToAccept.length + optionalDocuments.length
    });
  }, []);

  const documentLinks: Record<string, string> = {
    privacy_policy: '/legal/privacy-policy/',
    terms_conditions: '/legal/terms-conditions/',
    cookie_policy: '/legal/cookie-policy/',
    acceptable_use: '/acceptable-use',
    data_processing: '/data-processing',
  };

  const allDocuments = [...documentsToAccept, ...optionalDocuments];

  const toggleDocument = (docType: string) => {
    const newAccepted = new Set(acceptedDocs);
    if (newAccepted.has(docType)) {
      newAccepted.delete(docType);
    } else {
      newAccepted.add(docType);
    }
    setAcceptedDocs(newAccepted);
  };

  const handleAcceptAll = async () => {
    // Check if all required documents are checked
    const allRequiredChecked = documentsToAccept.every(doc => acceptedDocs.has(doc.document_type));
    
    if (!allRequiredChecked && documentsToAccept.length > 0) {
      alert('Please check all required documents before continuing.');
      return;
    }

    try {
      setIsAccepting(true);
      
      // Accept all checked documents (required + any optional ones selected)
      const docsToAccept = allDocuments.filter(doc => acceptedDocs.has(doc.document_type));
      
      console.log('[Modal] Accepting documents:', docsToAccept.map(d => d.document_type));
      
      for (const doc of docsToAccept) {
        await LegalDocumentsAPI.acceptDocument(doc.document_type, doc.version);
      }
      
      console.log('[Modal] All documents accepted successfully');
      
      // Notify parent
      onAcceptAll();
    } catch (error) {
      console.error('Failed to accept documents:', error);
      alert('Failed to accept documents. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const allRequiredChecked = documentsToAccept.every(doc => acceptedDocs.has(doc.document_type));

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Prevent closing by clicking outside if required documents exist
        if (e.target === e.currentTarget && documentsToAccept.length === 0) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {documentsToAccept.length > 0 ? 'Action Required: Updated Legal Documents' : 'Legal Documents'}
              </h2>
              <p className="text-gray-600">
                {documentsToAccept.length > 0 
                  ? 'We\'ve updated our legal documents. You must review and accept to continue using PropertPro.'
                  : 'We\'ve updated our legal documents. Please review and accept to continue.'
                }
              </p>
            </div>
            {/* Only show X button if NO required documents */}
            {documentsToAccept.length === 0 && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Required Documents */}
          {documentsToAccept.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs mr-2">REQUIRED</span>
                You must accept these to continue
              </h3>
              <div className="space-y-3">
                {documentsToAccept.map((doc) => (
                  <div
                    key={doc.document_type}
                    className="border-2 border-red-200 rounded-lg p-4 hover:border-red-300 transition-colors bg-red-50"
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={`accept-${doc.document_type}`}
                        checked={acceptedDocs.has(doc.document_type)}
                        onChange={() => toggleDocument(doc.document_type)}
                        className="mt-1 h-5 w-5 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`accept-${doc.document_type}`}
                          className="block cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="h-5 w-5 text-red-600" />
                            <span className="font-semibold text-gray-900">
                              {doc.display_name}
                            </span>
                            <span className="text-xs text-gray-500">v{doc.version}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            I have read and agree to the {doc.display_name}
                          </p>
                          {documentLinks[doc.document_type] && (
                            <Link
                              to={documentLinks[doc.document_type]}
                              target="_blank"
                              className="text-sm text-blue-600 hover:text-blue-800 underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Read full document →
                            </Link>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Documents */}
          {optionalDocuments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">OPTIONAL</span>
                You can accept these now or later
              </h3>
              <div className="space-y-3">
                {optionalDocuments.map((doc) => (
                  <div
                    key={doc.document_type}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={`accept-${doc.document_type}`}
                        checked={acceptedDocs.has(doc.document_type)}
                        onChange={() => toggleDocument(doc.document_type)}
                        className="mt-1 h-5 w-5 text-green-600 rounded"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`accept-${doc.document_type}`}
                          className="block cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-gray-900">
                              {doc.display_name}
                            </span>
                            <span className="text-xs text-gray-500">v{doc.version}</span>
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-medium">
                              Optional
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            I have read and agree to the {doc.display_name}
                          </p>
                          {documentLinks[doc.document_type] && (
                            <Link
                              to={documentLinks[doc.document_type]}
                              target="_blank"
                              className="text-sm text-blue-600 hover:text-blue-800 underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Read full document →
                            </Link>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Boxes */}
          {documentsToAccept.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Why are required documents mandatory?</p>
                  <p>
                    These documents outline your rights and our legal obligations under GDPR and EU law.
                    Your acceptance is required to continue using PropertPro.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {optionalDocuments.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Optional documents</p>
                  <p>
                    These documents are informational. You can review and accept them now,
                    or access them later from the footer or privacy settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p className="font-medium">
                {acceptedDocs.size} of {allDocuments.length} documents selected
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {documentsToAccept.length} required • {optionalDocuments.length} optional
              </p>
            </div>
            <div className="flex space-x-3">
              {/* Only show "Close" button if NO required documents */}
              {documentsToAccept.length === 0 && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>
              )}
              
              {/* Show logout option if required documents exist */}
              {documentsToAccept.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('You must accept the updated terms to continue using PropertPro. Would you like to log out instead?')) {
                      window.location.href = '/logout';
                    }
                  }}
                  className="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                >
                  Decline & Logout
                </button>
              )}
              
              <button
                onClick={handleAcceptAll}
                disabled={!allRequiredChecked || isAccepting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAccepting ? 'Accepting...' : acceptedDocs.size > 0 ? 'Accept & Continue' : 'Accept Required'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequiredDocumentsModal;

