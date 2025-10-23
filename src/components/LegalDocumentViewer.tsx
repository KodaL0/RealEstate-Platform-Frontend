/**
 * Reusable Legal Document Viewer Component
 * Displays versioned legal documents with loading states and acceptance tracking
 */
import React, { useState, useEffect } from 'react';
import { Building2, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import LegalDocumentsAPI, { LegalDocument } from '../services/legalApi';

interface LegalDocumentViewerProps {
  documentType: 'privacy_policy' | 'terms_conditions' | 'cookie_policy';
  showAcceptButton?: boolean;
  onAccept?: () => void;
}

const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({
  documentType,
  showAcceptButton = false,
  onAccept
}) => {
  const { user } = useUser();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [documentType]);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await LegalDocumentsAPI.getDocument(documentType);
      setDocument(data);
    } catch (err: any) {
      console.error('Failed to load legal document:', err);
      setError(err.response?.data?.error || 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !document) return;

    try {
      setIsAccepting(true);
      await LegalDocumentsAPI.acceptDocument(documentType);
      
      // Refresh document to update acceptance status
      await loadDocument();
      
      // Call parent callback
      onAccept?.();
    } catch (err: any) {
      console.error('Failed to accept document:', err);
      alert('Failed to accept document. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Document Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            We couldn't load this document. Please try again later.
          </p>
          <button
            onClick={loadDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-center items-center mb-6">
              <Link to="/" className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                  PROPERTPRO
                </span>
              </Link>
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{document.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Version {document.version}</span>
                  <span>•</span>
                  <span>Effective {new Date(document.effective_date).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center text-blue-600 hover:text-blue-800 print:hidden"
              >
                <Download className="h-5 w-5 mr-1" />
                <span className="text-sm">Print</span>
              </button>
            </div>

            {/* Acceptance Status for Authenticated Users */}
            {user && document.requires_acceptance && (
              <div className={`mt-4 p-3 rounded-lg ${
                document.has_accepted
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <CheckCircle className={`h-5 w-5 ${
                    document.has_accepted ? 'text-green-600' : 'text-yellow-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    document.has_accepted ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {document.has_accepted
                      ? `You accepted this version on ${new Date().toLocaleDateString()}`
                      : 'You have not accepted this version yet'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Document Content */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: document.content }}
            />
          </div>

          {/* Privacy Policy Specific Sections */}
          {document.document_type === 'privacy_policy' && document.processing_purposes && (
            <div className="bg-white rounded-lg shadow-md p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How We Process Your Data</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(document.processing_purposes).map(([key, purpose]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{purpose.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        purpose.required
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {purpose.required ? 'Required' : 'Optional'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Legal basis: {purpose.legal_basis}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accept Button */}
          {showAcceptButton && user && !document.has_accepted && document.requires_acceptance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Accept {document.title}</h3>
                  <p className="text-blue-800 mb-4">
                    Please review and accept this document to continue using PropertPro.
                  </p>
                  <button
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAccepting ? 'Accepting...' : 'Accept Document'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex space-x-4">
                <Link
                  to="/privacy-settings"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage Privacy Settings
                </Link>
                {document.controller_info && (
                  <a
                    href={`mailto:${document.controller_info.email}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Contact Us
                  </a>
                )}
              </div>

              <div className="text-sm text-gray-500">
                Last updated: {new Date(document.effective_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentViewer;


