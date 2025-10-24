import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, Info, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    console.log('[RequiredDocumentsModal] Rendered with:', {
      required: documentsToAccept,
      optional: optionalDocuments,
      total: documentsToAccept.length + optionalDocuments.length
    });
  }, []);
  
  useEffect(() => {
  // Lock background scroll when modal is open
  document.body.style.overflow = 'hidden';

  // Unlock scroll when modal closes
  return () => {
    document.body.style.overflow = 'auto';
  };
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
    const allRequiredChecked = documentsToAccept.every(doc => acceptedDocs.has(doc.document_type));

    if (!allRequiredChecked && documentsToAccept.length > 0) {
      alert('Please check all required documents before continuing.');
      return;
    }

    try {
      setIsAccepting(true);

      const docsToAccept = allDocuments.filter(doc => acceptedDocs.has(doc.document_type));

      console.log('[Modal] Accepting documents:', docsToAccept.map(d => d.document_type));

      for (const doc of docsToAccept) {
        await LegalDocumentsAPI.acceptDocument(doc.document_type, doc.version);
      }

      console.log('[Modal] All documents accepted successfully');

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
      className="fixed inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-slate-900/95 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && documentsToAccept.length === 0) {
          onClose();
        }
      }}
    >
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 py-16">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 my-auto">
        <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-white to-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {documentsToAccept.length > 0 && (
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {documentsToAccept.length > 0 ? 'Action Required' : 'Legal Documents'}
                  </h2>
                  {documentsToAccept.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                      Updated Terms
                    </span>
                  )}
                </div>
              </div>
              <p className="text-base text-gray-600 leading-relaxed">
                {documentsToAccept.length > 0
                  ? 'We\'ve updated our legal documents. Please review and accept to continue using PropertPro.'
                  : 'Please review the following legal documents and accept to continue.'
                }
              </p>
            </div>
            {documentsToAccept.length === 0 && (
              <button
                onClick={onClose}
                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 p-2"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
          {documentsToAccept.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg font-semibold text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Required Documents
                </div>
                <span className="text-sm text-gray-600">You must accept these to continue</span>
              </div>
              <div className="space-y-4">
                {documentsToAccept.map((doc) => (
                  <div
                    key={doc.document_type}
                    className="border-2 border-red-200 rounded-xl p-6 bg-white hover:border-red-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        id={`accept-${doc.document_type}`}
                        checked={acceptedDocs.has(doc.document_type)}
                        onChange={() => toggleDocument(doc.document_type)}
                        className="mt-1.5 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`accept-${doc.document_type}`}
                          className="block cursor-pointer"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-red-600">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-lg">
                                  {doc.display_name}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                                  Version {doc.version}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                            I have read and agree to the {doc.display_name}
                          </p>
                          {documentLinks[doc.document_type] && (
                            <Link
                              to={documentLinks[doc.document_type]}
                              target="_blank"
                              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Read full document
                              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
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

          {optionalDocuments.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Optional Documents
                </div>
                <span className="text-sm text-gray-600">Accept now or later</span>
              </div>
              <div className="space-y-4">
                {optionalDocuments.map((doc) => (
                  <div
                    key={doc.document_type}
                    className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        id={`accept-${doc.document_type}`}
                        checked={acceptedDocs.has(doc.document_type)}
                        onChange={() => toggleDocument(doc.document_type)}
                        className="mt-1.5 h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`accept-${doc.document_type}`}
                          className="block cursor-pointer"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-lg">
                                  {doc.display_name}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                                  Version {doc.version}
                                </span>
                                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-medium">
                                  Optional
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                            I have read and agree to the {doc.display_name}
                          </p>
                          {documentLinks[doc.document_type] && (
                            <Link
                              to={documentLinks[doc.document_type]}
                              target="_blank"
                              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Read full document
                              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
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

          {documentsToAccept.length > 0 && (
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl mb-4">
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                  <Info className="h-5 w-5" />
                </div>
                <div className="text-sm text-blue-900 flex-1">
                  <p className="font-semibold mb-2">Why are required documents mandatory?</p>
                  <p className="leading-relaxed">
                    These documents outline your rights and our legal obligations under GDPR and EU law.
                    Your acceptance is required to continue using PropertPro.
                  </p>
                </div>
              </div>
            </div>
          )}

          {optionalDocuments.length > 0 && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="text-sm text-emerald-900 flex-1">
                  <p className="font-semibold mb-2">Optional documents</p>
                  <p className="leading-relaxed">
                    These documents are informational. You can review and accept them now,
                    or access them later from the footer or privacy settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm">
              <p className="font-semibold text-gray-900">
                {acceptedDocs.size} of {allDocuments.length} documents selected
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {documentsToAccept.length} required • {optionalDocuments.length} optional
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              {documentsToAccept.length === 0 && (
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  Close
                </button>
              )}

              {documentsToAccept.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('You must accept the updated terms to continue using PropertPro. Would you like to log out instead?')) {
                      window.location.href = '/logout';
                    }
                  }}
                  className="px-5 py-2.5 border-2 border-red-200 rounded-lg text-red-700 font-medium hover:bg-red-50 hover:border-red-300 transition-all"
                >
                  Decline & Logout
                </button>
              )}

              <button
                onClick={handleAcceptAll}
                disabled={!allRequiredChecked || isAccepting}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all disabled:shadow-none"
              >
                {isAccepting ? 'Accepting...' : acceptedDocs.size > 0 ? 'Accept & Continue' : 'Accept Required'}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RequiredDocumentsModal;
