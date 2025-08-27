import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Image, Video, Music, Archive, Paperclip, Folder, Tag } from 'lucide-react';
import developersApi from '../../../config/developers-api';

// Mock API types (replace with your actual types)
// (Removed unused Unit type)

type AssetCategory = 
  | 'floor_plans'
  | 'brochures' 
  | 'legal_documents'
  | 'photos'
  | 'videos'
  | 'presentations'
  | 'specifications'
  | 'contracts'
  | 'permits'
  | 'other';

interface AssetUploadFormProps {
  projectId: number;
  onClose: () => void;
  onUpload: (asset: any) => void;
}

function AssetUploadForm({ projectId, onClose, onUpload }: AssetUploadFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('other');
  const [selectedType, setSelectedType] = useState<'document' | 'image' | 'video' | 'audio' | 'archive' | 'other'>('document');
  const [availableCategories, setAvailableCategories] = useState<Array<[string, string]>>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const assetTypes = [
    { value: 'document' as const, label: 'Document', icon: FileText, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'image' as const, label: 'Image', icon: Image, color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'video' as const, label: 'Video', icon: Video, color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'audio' as const, label: 'Audio', icon: Music, color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'archive' as const, label: 'Archive', icon: Archive, color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'other' as const, label: 'Other', icon: Paperclip, color: 'bg-gray-100 text-gray-700 border-gray-200' }
  ];

  // Title defaults to filename when file selected

  // Fetch categories for selected type
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const data = await developersApi.assets.getCategories(selectedType);
        const cats = (data && (data as any)[selectedType]) || [];
        if (isMounted) {
          setAvailableCategories(cats);
          if (cats.length > 0) {
            setSelectedCategory(cats[0][0] as AssetCategory);
          } else {
            setSelectedCategory('other');
          }
        }
      } catch (e) {
        if (isMounted) {
          setAvailableCategories([]);
          setSelectedCategory('other');
        }
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [selectedType]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setFile(selectedFile);
    if (!customTitle) {
      const fileName = selectedFile.name.split('.')[0];
      setCustomTitle(fileName.replace(/[_-]/g, ' '));
    }
    // Clear file error when file is selected
    if (errors.file) {
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const addTagFromInput = () => {
    const cleaned = tagInput.trim().replace(/\s+/g, ' ');
    if (!cleaned) return;
    if (!tags.includes(cleaned)) setTags(prev => [...prev, cleaned]);
    setTagInput('');
  };

  const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagFromInput();
    }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!file) {
      newErrors.file = 'Please select a file to upload';
    }
    // Require category only when categories are available for type
    if ((selectedType === 'document' || selectedType === 'image' || selectedType === 'video') && availableCategories.length > 0 && !selectedCategory) {
      newErrors.category = 'Please select a category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setErrors({});

    try {
      const defaultFromFile = file ? file.name.split('.')[0].replace(/[_-]/g, ' ') : '';
      const finalTitle = (customTitle && customTitle.trim()) ? customTitle.trim() : (defaultFromFile || 'Untitled');

      // Determine asset type based on selection (fallback to MIME type detection)
      const getAssetType = (file: File): string => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        if (file.type === 'application/pdf' || 
            file.type.includes('document') || 
            file.type.includes('text') ||
            file.type.includes('spreadsheet') ||
            file.type.includes('presentation')) return 'document';
        if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('tar')) return 'archive';
        return 'other';
      };
      const assetType = selectedType || getAssetType(file!);
      const category = selectedCategory;

      console.log('Uploading asset:', {
        file: file?.name,
        project: projectId,
        asset_type: assetType,
        category: category,
        title: finalTitle,
        description,
        tags
      });

      // Prepare asset data for API
      const assetData: any = {
        project: projectId,
        asset_type: assetType,
        file: file!,
        original_filename: file!.name,
        title: finalTitle,
        description: description || undefined,
        tags: tags.length > 0 ? tags : undefined
      };

      // Add category-specific fields based on asset type
      if (assetType === 'document' && category) {
        assetData.document_category = category;
      } else if (assetType === 'image' && category) {
        assetData.image_category = category;
      } else if (assetType === 'video' && category) {
        assetData.video_category = category;
      }

      // Create asset using the real API
      const newAsset = await developersApi.assets.create(assetData);
      
      console.log('Asset uploaded successfully:', newAsset);
      
      onUpload(newAsset);
      onClose();
    } catch (error) {
      console.error('Error uploading asset:', error);
      
      // Handle specific API errors
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle API response errors
        const apiError = error as any;
        if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        } else if (apiError.response?.data) {
          errorMessage = JSON.stringify(apiError.response.data);
        }
      }
      
      setErrors({ submit: `Error uploading asset: ${errorMessage}` });
    } finally {
      setIsUploading(false);
    }
  };

  const selectedTypeData = assetTypes.find(t => t.value === selectedType);
  const TypeIcon = selectedTypeData?.icon || Folder;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Upload Asset</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Type & Category Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Folder className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Asset Type & Category</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              {/* Type selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {assetTypes.map((type) => {
                  const IconComp = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSelectedType(type.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-center hover:scale-105 ${
                        selectedType === type.value
                          ? `${type.color} border-current shadow-lg`
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <IconComp className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-xs font-medium leading-tight">{type.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Category selection for applicable types */}
              {(selectedType === 'document' || selectedType === 'image' || selectedType === 'video') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as AssetCategory)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white ${errors.category ? 'border-red-300' : 'border-gray-300'}`}
                  >
                    {availableCategories.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
                </div>
              )}
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Upload className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">File Upload</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : errors.file
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    {dragActive ? 'Drop your file here' : 'Click to upload or drag and drop'}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    PDF, DOC, XLS, PPT, Images, Videos (Max 50MB)
                  </div>
                </label>
                {file && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {errors.file && <p className="text-sm text-red-600">{errors.file}</p>}
            </div>

            {/* Title & Description Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Asset Details</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder={file ? file.name.split('.')[0].replace(/[_-]/g, ' ') : 'Enter title'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-vertical"
                    rows={3}
                    placeholder="Optional description for this asset"
                  />
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Tag className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Tags</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Tags (press Enter or comma to add)
                </label>
                <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-200">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {t}
                      <button 
                        type="button" 
                        onClick={() => removeTag(t)} 
                        className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    placeholder={tags.length === 0 ? "Add tags for better organization" : "Add another tag"}
                    className="flex-1 min-w-[120px] outline-none text-sm py-1"
                  />
                </div>
                {tags.length > 0 && (
                  <p className="mt-2 text-sm text-gray-500">{tags.length} tag{tags.length > 1 ? 's' : ''} added</p>
                )}
              </div>
            </div>

            {/* Selected Type/Category Preview */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <TypeIcon className="w-5 h-5 text-gray-700" />
                <div>
                  <p className="font-medium">
                    Uploading as: {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                    {(selectedType === 'document' || selectedType === 'image' || selectedType === 'video') && selectedCategory ?
                      ` • ${availableCategories.find(([v]) => v === selectedCategory)?.[1] || selectedCategory}`
                      : ''}
                  </p>
                  <p className="text-sm opacity-75">
                    Final title: {(customTitle && customTitle.trim()) ? customTitle.trim() : (file ? file.name.split('.')[0].replace(/[_-]/g, ' ') : 'Untitled')}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={isUploading || !file}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Asset</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AssetUploadForm;