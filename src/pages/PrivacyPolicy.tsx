import React, { useState, useEffect } from 'react';
import { Shield, Download, Loader2, AlertCircle } from 'lucide-react';

interface LegalDocument {
  title: string;
  version: string;
  effective_date: string;
  content: string;
  summary?: string;
}

const PrivacyPolicy: React.FC = () => {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocument();
  }, []);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/legal/privacy_policy/');
      if (!response.ok) {
        throw new Error('Failed to fetch privacy policy');
      }
      const data = await response.json();
      setDocument(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatContent = (htmlContent: string) => {
    // Simple HTML to JSX conversion for basic formatting
    return htmlContent
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '<h1 class="text-2xl font-bold text-gray-900 mb-4 mt-8">$1</h1>')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '<h2 class="text-xl font-semibold text-gray-900 mb-3 mt-6">$1</h2>')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '<h3 class="text-lg font-medium text-gray-900 mb-2 mt-4">$1</h3>')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '<p class="text-gray-700 mb-4 leading-relaxed">$1</p>')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '<ul class="list-disc list-inside mb-4 text-gray-700">$1</ul>')
      .replace(/<ol[^>]*>(.*?)<\/ol>/gi, '<ol class="list-decimal list-inside mb-4 text-gray-700">$1</ol>')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '<li class="mb-1">$1</li>')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '<em class="italic">$1</em>')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '<a href="$1" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$2</a>');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Privacy Policy...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600">Failed to load Privacy Policy</p>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
          </div>
          <p className="text-lg text-gray-600 mb-2">
            How we collect, use, and protect your personal information
          </p>
          <p className="text-sm text-gray-500">
            Version {document.version} • Effective: {new Date(document.effective_date).toLocaleDateString()}
          </p>
          
          {/* Download Button */}
          <div className="mt-6">
            <a 
              href="/api/users/legal/privacy_policy/pdf/" 
              download="PropertPro-Privacy-Policy.pdf"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>

        {/* Document Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div 
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: formatContent(document.content) }}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>This privacy policy complies with GDPR and EU data protection regulations.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;