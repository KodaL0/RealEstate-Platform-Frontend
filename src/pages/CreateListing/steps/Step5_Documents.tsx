import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, X, ChevronLeft, File, AlertCircle, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { useWizardNavigation } from '../../../context/ListingWizardContext';
import toast from 'react-hot-toast';
import api from '../../../config/api';

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
  propertyId?: string;
  username: string;
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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const Step5_Documents: React.FC<Props> = ({
  documents,
  setDocuments,
  isEditing,
  propertyId,
  username,
}) => {
  const { back, next } = useWizardNavigation();
  const [uploadError, setUploadError] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<Map<string, SaveStatus>>(new Map());
  const [saveErrors, setSaveErrors] = useState<Map<string, string>>(new Map());
  const [suggestions, setSuggestions] = useState<Map<string, string>>(new Map());
  
  // Debounce timers for each document
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

  const removeDocument = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    // If editing and this is an existing document, delete via API
    if (isEditing && doc.existingDocId && propertyId) {
      try {
        await api.properties.deleteDocument(username, Number(propertyId), doc.existingDocId);
        toast.success('Document deleted');
      } catch (error: any) {
        toast.error(error?.response?.data?.detail || 'Failed to delete document');
        return; // Don't remove from local state if API call failed
      }
    }

    // Clear any pending save timer for this document
    const timer = saveTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      saveTimers.current.delete(id);
    }

    // Remove from local state
    setDocuments(documents.filter(d => d.id !== id));
    
    // Clean up status maps
    setSaveStatus(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    setSaveErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    setSuggestions(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  // Auto-save document changes for existing documents
  const autoSaveDocument = useCallback(async (doc: DocumentFile) => {
    if (!doc.existingDocId || !isEditing || !propertyId) return;

    // Update status to saving
    setSaveStatus(prev => new Map(prev).set(doc.id, 'saving'));
    setSaveErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(doc.id);
      return newMap;
    });
    setSuggestions(prev => {
      const newMap = new Map(prev);
      newMap.delete(doc.id);
      return newMap;
    });

    try {
      await api.properties.updateDocument(username, Number(propertyId), doc.existingDocId, {
        document_type: doc.type,
        title: doc.title,
        description: doc.description,
      });

      // Update status to saved
      setSaveStatus(prev => new Map(prev).set(doc.id, 'saved'));
      
      // Clear saved status after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => {
          const newMap = new Map(prev);
          if (newMap.get(doc.id) === 'saved') {
            newMap.set(doc.id, 'idle');
          }
          return newMap;
        });
      }, 2000);

    } catch (error: any) {
      console.error('Error saving document:', error);
      
      const errorData = error?.response?.data;
      const errorMessage = errorData?.error || errorData?.detail || 'Failed to save changes';
      
      setSaveStatus(prev => new Map(prev).set(doc.id, 'error'));
      setSaveErrors(prev => new Map(prev).set(doc.id, errorMessage));
      
      // If there's a suggestion for duplicate title
      if (errorData?.suggestion) {
        setSuggestions(prev => new Map(prev).set(doc.id, errorData.suggestion));
      }
    }
  }, [isEditing, propertyId, username]);

  const updateDocument = (id: string, field: keyof DocumentFile, value: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === id ? { ...doc, [field]: value } : doc
    ));

    const doc = documents.find(d => d.id === id);
    
    // Only auto-save for existing documents
    if (doc?.existingDocId && isEditing && propertyId) {
      // Clear existing timer
      const existingTimer = saveTimers.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer for debounced save
      const timer = setTimeout(() => {
        const updatedDoc = documents.find(d => d.id === id);
        if (updatedDoc) {
          // Update the doc with the new value before saving
          const docToSave = { ...updatedDoc, [field]: value };
          autoSaveDocument(docToSave);
        }
      }, 1000); // 1 second debounce

      saveTimers.current.set(id, timer);
    }
  };

  // Apply suggested title
  const applySuggestion = (id: string) => {
    const suggestion = suggestions.get(id);
    if (suggestion) {
      updateDocument(id, 'title', suggestion);
    }
  };

  // Check for duplicate document titles (case-insensitive)
  const getDuplicateTitles = () => {
    const titleCounts = new Map<string, number>();
    const duplicates = new Set<string>();
    
    // Count all document titles (both new and existing)
    documents.forEach(doc => {
      const lowerTitle = doc.title.trim().toLowerCase();
      if (lowerTitle) {
        const count = (titleCounts.get(lowerTitle) || 0) + 1;
        titleCounts.set(lowerTitle, count);
        if (count > 1) {
          duplicates.add(lowerTitle);
        }
      }
    });
    
    return duplicates;
  };

  const hasDuplicateTitle = (title: string, docId: string) => {
    if (!title.trim()) return false;
    
    const lowerTitle = title.trim().toLowerCase();
    const matchingDocs = documents.filter(
      doc => doc.title.trim().toLowerCase() === lowerTitle && doc.id !== docId
    );
    
    return matchingDocs.length > 0;
  };

  // Generate unique title suggestion
  const getSuggestedTitle = (baseTitle: string, docId: string): string => {
    const cleanTitle = baseTitle.trim();
    let counter = 2;
    
    while (counter < 100) {
      const suggestion = `${cleanTitle} (${counter})`;
      if (!hasDuplicateTitle(suggestion, docId)) {
        return suggestion;
      }
      counter++;
    }
    
    return `${cleanTitle} (${Date.now()})`;
  };

  // Auto-fix all duplicates
  const autoFixDuplicates = () => {
    const duplicateTitles = getDuplicateTitles();
    if (duplicateTitles.size === 0) return;

    setDocuments(prev => {
      const titleCounts = new Map<string, number>();
      
      return prev.map(doc => {
        const lowerTitle = doc.title.trim().toLowerCase();
        
        if (duplicateTitles.has(lowerTitle)) {
          const count = (titleCounts.get(lowerTitle) || 0) + 1;
          titleCounts.set(lowerTitle, count);
          
          // First occurrence keeps original title
          if (count === 1) {
            return doc;
          }
          
          // Subsequent occurrences get numbered
          return {
            ...doc,
            title: `${doc.title.trim()} (${count})`
          };
        }
        
        return doc;
      });
    });

    toast.success('Duplicate titles fixed automatically');
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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      saveTimers.current.forEach(timer => clearTimeout(timer));
      saveTimers.current.clear();
    };
  }, []);

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
            <p>Add documents like floor plans, energy certificates, or title deeds to increase buyer confidence. {isEditing && 'You can edit document details anytime - changes are saved automatically.'}</p>
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

          {/* Duplicate Title Warning with Auto-fix */}
          {getDuplicateTitles().size > 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 font-medium">
                      {getDuplicateTitles().size} duplicate title{getDuplicateTitles().size > 1 ? 's' : ''} detected
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Each document must have a unique title
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={autoFixDuplicates}
                  className="ml-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-fix
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {documents.map((doc) => {
              const isExisting = !!doc.existingDocId;
              const fileName = doc.file?.name || doc.fileName || 'Document';
              const fileSize = doc.file?.size || doc.fileSize || 0;
              const status = saveStatus.get(doc.id) || 'idle';
              const error = saveErrors.get(doc.id);
              const suggestion = suggestions.get(doc.id);
              const isDuplicate = hasDuplicateTitle(doc.title, doc.id);
              
              return (
              <div
                key={doc.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1">
                    <span className="text-2xl mr-3">{getFileIcon(fileName)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-800">{fileName}</p>
                        
                        {/* Save Status Indicators */}
                        {isExisting && status === 'saving' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Saving...
                          </span>
                        )}
                        {isExisting && status === 'saved' && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Saved
                          </span>
                        )}
                        {isExisting && status === 'error' && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Error
                          </span>
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
                    title={isExisting ? "Delete document" : "Remove from upload"}
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2">
                    <p className="text-xs text-red-700">{error}</p>
                    {suggestion && (
                      <button
                        type="button"
                        onClick={() => applySuggestion(doc.id)}
                        className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Use "{suggestion}" instead
                      </button>
                    )}
                  </div>
                )}

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
                      Title {isDuplicate && <span className="text-red-600 text-xs">(Duplicate!)</span>}
                    </label>
                    <input
                      type="text"
                      value={doc.title}
                      onChange={(e) => updateDocument(doc.id, 'title', e.target.value)}
                      placeholder="e.g., First Floor Plan"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        isDuplicate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {isDuplicate && (
                      <div className="mt-1 flex items-start gap-2">
                        <p className="text-xs text-red-600 flex-1">
                          This title is already used. Please use a unique title.
                        </p>
                        <button
                          type="button"
                          onClick={() => updateDocument(doc.id, 'title', getSuggestedTitle(doc.title, doc.id))}
                          className="text-xs text-indigo-600 hover:text-indigo-800 underline whitespace-nowrap"
                        >
                          Auto-fix
                        </button>
                      </div>
                    )}
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

export default memo(Step5_Documents);
