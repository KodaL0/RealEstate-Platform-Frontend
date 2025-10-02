import React, { useState } from 'react';
import { Upload, FileText, X, ChevronLeft, File, AlertCircle, ArrowRight } from 'lucide-react';
import { useListingWizard } from '../../../context/ListingWizardContext';

interface DocumentFile {
  id: string;
  file?: File; // Optional for existing documents
  existingDocId?: number; // For existing documents from backend
  documentUrl?: string; // URL for existing documents
  fileName?: string; // Name for existing documents
  fileSize?: number; // Size for existing documents
  type: string;
  title: string;
  description: string;
  uploadedAt?: string; // When document was uploaded
}

interface Props {
  documents: DocumentFile[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentFile[]>>;
  isSubmitting: boolean;
  isEditing: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'floor_plan', label: 'Floor Plan', icon: '📐' },
  { value: 'energy_certificate', label: 'Energy Certificate', icon: '⚡' },
  { value: 'title_deed', label: 'Title Deed', icon: '📜' },
  { value: 'building_permit', label: 'Building Permit', icon: '🏗️' },
  { value: 'contract', label: 'Contract', icon: '📄' },
  { value: 'inspection_report', label: 'Inspection Report', icon: '🔍' },
  { value: 'other', label: 'Other Document', icon: '📎' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const Step5_Documents: React.FC<Props> = ({
  documents,
  setDocuments,
}) => {
  const { back, next } = useListingWizard();
  const [uploadError, setUploadError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    const newDocuments: DocumentFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(`${file.name}: File type not allowed. Please use PDF, DOC, DOCX, JPG, or PNG.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`${file.name}: File too large. Maximum size is 10MB.`);
        continue;
      }

      // Check total documents limit
      if (documents.length + newDocuments.length >= 20) {
        setUploadError('Maximum 20 documents allowed per property.');
        break;
      }

      newDocuments.push({
        id: `${Date.now()}-${i}`,
        file,
        type: 'other',
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        description: '',
      });
    }

    if (newDocuments.length > 0) {
      setDocuments([...documents, ...newDocuments]);
    }

    // Reset input
    e.target.value = '';
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const updateDocument = (id: string, field: keyof DocumentFile, value: string) => {
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-4 sm:p-8 rounded-2xl shadow-xl border border-gray-100 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-2">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Property Documents</h2>
        <p className="text-gray-600 text-sm">Upload supporting documents (optional)</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Optional but recommended</p>
            <p>Add documents like floor plans, energy certificates, or title deeds to increase buyer confidence. You can skip this step and add documents later.</p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-indigo-600" />
          Upload Documents
        </h3>

        <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-8 text-center transition-colors duration-300">
          <input
            type="file"
            id="document-upload"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor="document-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">
                Click to upload documents
              </h4>
              <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-500">
                <span>• PDF, DOC, DOCX, JPG, PNG</span>
                <span>• Max 10MB per file</span>
                <span>• Up to 20 documents</span>
              </div>
            </div>
          </label>
        </div>

        {uploadError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {uploadError}
            </p>
          </div>
        )}
      </div>

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <File className="w-5 h-5 mr-2 text-indigo-600" />
            Uploaded Documents ({documents.length})
          </h3>

          <div className="space-y-4">
            {documents.map((doc) => {
              const isExisting = !!doc.existingDocId;
              const fileName = doc.file?.name || doc.fileName || 'Document';
              const fileSize = doc.file?.size || doc.fileSize || 0;
              
              return (
              <div
                key={doc.id}
                className={`border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors duration-200 ${isExisting ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1">
                    <span className="text-2xl mr-3">{getFileIcon(fileName)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800">{fileName}</p>
                        {isExisting && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded">Existing</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
                      {isExisting && doc.documentUrl && (
                        <a 
                          href={doc.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                        >
                          View document
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="p-2 hover:bg-red-50 rounded-full transition-colors duration-200"
                    title={isExisting ? "Remove from listing (will be deleted)" : "Remove from upload"}
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Document Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type
                    </label>
                    <select
                      value={doc.type}
                      onChange={(e) => updateDocument(doc.id, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={doc.title}
                      onChange={(e) => updateDocument(doc.id, 'title', e.target.value)}
                      placeholder="e.g., First Floor Plan"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={doc.description}
                      onChange={(e) => updateDocument(doc.id, 'description', e.target.value)}
                      placeholder="Brief description of the document"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 mb-6">
          <div className="text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No documents uploaded</h3>
            <p className="text-sm">This step is optional. You can add documents now or skip to continue.</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={back}
          className="group inline-flex items-center px-4 sm:px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>

        <button
          type="button"
          onClick={next}
          className="group relative px-6 sm:px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="flex items-center">
            Continue to Contact
            <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
          </span>

          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>
      </div>
    </section>
  );
};

export default Step5_Documents;
