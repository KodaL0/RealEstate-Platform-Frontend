import React, { useState, useEffect } from 'react';
import { X, Home, MapPin, DollarSign, BarChart3, Upload, FileText, Image, Video, FileCheck, Folder, Tag, Plus } from 'lucide-react';

// Mock API types (replace with your actual types)
interface Unit {
  id?: number;
  project: number;
  code: string;
  unit_type: 'studio' | 'apartment' | 'house';
  bedrooms: number;
  bathrooms: number;
  area_internal?: number;
  area_veranda?: number;
  area_total?: number;
  price?: number;
  currency: string;
  vat_included: boolean;
  status: 'available' | 'reserved' | 'sold';
  floor: string;
}

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
  const [customTitle, setCustomTitle] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const assetCategories = [
    { value: 'floor_plans', label: 'Floor Plans', icon: Home, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'brochures', label: 'Brochures', icon: FileText, color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'legal_documents', label: 'Legal Documents', icon: FileCheck, color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'photos', label: 'Photos', icon: Image, color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { value: 'videos', label: 'Videos', icon: Video, color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'presentations', label: 'Presentations', icon: BarChart3, color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'specifications', label: 'Specifications', icon: FileText, color: 'bg-teal-100 text-teal-700 border-teal-200' },
    { value: 'contracts', label: 'Contracts', icon: FileCheck, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { value: 'permits', label: 'Permits', icon: FileCheck, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'other', label: 'Other', icon: Folder, color: 'bg-gray-100 text-gray-700 border-gray-200' }
  ];

  // Predefined title suggestions per category
  const titleSuggestions: Record<AssetCategory, string[]> = {
    floor_plans: ['Floor Plan', 'Site Plan', 'Unit Plan', 'Level Plan'],
    brochures: ['Project Brochure', 'Marketing Brochure', 'Sales Brochure'],
    legal_documents: ['Legal Document', 'Agreement', 'Disclosure', 'Terms'],
    photos: ['Exterior Photo', 'Interior Photo', 'Amenities Photo', 'Construction Photo'],
    videos: ['Virtual Tour', 'Marketing Video', 'Construction Video'],
    presentations: ['Investor Deck', 'Sales Presentation', 'Project Overview'],
    specifications: ['Technical Specifications', 'Material Specifications'],
    contracts: ['Sales Agreement', 'Contract Addendum', 'Purchase Agreement'],
    permits: ['Building Permit', 'Occupancy Permit', 'Inspection Approval'],
    other: ['Document', 'File']
  };

  // Keep suggestion in sync with category
  useEffect(() => {
    const first = titleSuggestions[selectedCategory]?.[0] || '';
    setSelectedSuggestion(first);
  }, [selectedCategory]);

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
      const finalTitle = (customTitle && customTitle.trim()) ? customTitle.trim() : (selectedSuggestion || 'Untitled');

      console.log('Uploading asset:', {
        file: file?.name,
        project: projectId,
        category: selectedCategory,
        title: finalTitle,
        description,
        tags
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newAsset = {
        id: Date.now(),
        file: file,
        project: projectId,
        category: selectedCategory,
        title: finalTitle,
        description: description,
        metadata: { tags }
      };
      
      onUpload(newAsset);
      onClose();
    } catch (error) {
      console.error('Error uploading asset:', error);
      setErrors({ submit: `Error uploading asset: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsUploading(false);
    }
  };

  const selectedCategoryData = assetCategories.find(cat => cat.value === selectedCategory);
  const IconComponent = selectedCategoryData?.icon || Folder;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
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

            {/* Category Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Folder className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Asset Category</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {assetCategories.map((category) => {
                  const IconComp = category.icon;
                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setSelectedCategory(category.value as AssetCategory)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-center hover:scale-105 ${
                        selectedCategory === category.value
                          ? `${category.color} border-current shadow-lg`
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <IconComp className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-xs font-medium leading-tight">{category.label}</div>
                    </button>
                  );
                })}
              </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suggested Title
                  </label>
                  <select
                    value={selectedSuggestion}
                    onChange={(e) => setSelectedSuggestion(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    {(titleSuggestions[selectedCategory] || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Title (optional)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter custom title"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-vertical"
                  rows={3}
                  placeholder="Optional description for this asset"
                />
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

            {/* Selected Category Preview */}
            {selectedCategoryData && (
              <div className={`p-4 rounded-xl border ${selectedCategoryData.color}`}>
                <div className="flex items-center space-x-3">
                  <IconComponent className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Uploading to: {selectedCategoryData.label}</p>
                    <p className="text-sm opacity-75">
                      Final title: {(customTitle && customTitle.trim()) ? customTitle.trim() : (selectedSuggestion || 'Untitled')}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

interface UnitFormProps {
  projectId: number;
  unit?: Unit | null;
  onSave: (unit: Unit) => void;
  onCancel: () => void;
}

function UnitForm({ projectId, unit, onSave, onCancel }: UnitFormProps) {
  const [formData, setFormData] = useState<Partial<Unit>>({
    project: projectId,
    code: '',
    unit_type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    area_internal: undefined,
    area_veranda: undefined,
    area_total: undefined,
    price: undefined,
    currency: 'EUR',
    vat_included: false,
    status: 'available',
    floor: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (unit) {
      setFormData(unit);
    }
  }, [unit]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.code) {
      newErrors.code = 'Unit code is required';
    }
    if (!formData.unit_type) {
      newErrors.unit_type = 'Unit type is required';
    }
    if (formData.bedrooms === undefined) {
      newErrors.bedrooms = 'Number of bedrooms is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Clean up formData by removing undefined values
      const cleanFormData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined)
      );

      console.log('Submitting unit data:', cleanFormData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const savedUnit = { id: Date.now(), ...cleanFormData } as Unit;
      onSave(savedUnit);
    } catch (error) {
      console.error('Error saving unit:', error);
      setErrors({ submit: `Error saving unit: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof Unit, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'reserved': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sold': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              {unit ? 'Edit Unit' : 'Add New Unit'}
            </h3>
          </div>
          <button
            onClick={onCancel}
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

            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Basic Information</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      errors.code ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., A101"
                  />
                  {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={formData.floor || ''}
                    onChange={(e) => handleInputChange('floor', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g., Ground, 1st, 2nd"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Type *
                  </label>
                  <select
                    value={formData.unit_type || 'apartment'}
                    onChange={(e) => handleInputChange('unit_type', e.target.value as Unit['unit_type'])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value="studio">Studio</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrooms *
                  </label>
                  <select
                    value={formData.bedrooms || 1}
                    onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value={0}>Studio (0)</option>
                    <option value={1}>1 Bedroom</option>
                    <option value={2}>2 Bedrooms</option>
                    <option value={3}>3 Bedrooms</option>
                    <option value={4}>4 Bedrooms</option>
                    <option value={5}>5+ Bedrooms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bathrooms
                  </label>
                  <select
                    value={formData.bathrooms || 1}
                    onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value={1}>1 Bathroom</option>
                    <option value={2}>2 Bathrooms</option>
                    <option value={3}>3 Bathrooms</option>
                    <option value={4}>4+ Bathrooms</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Area Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Area Information</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Area (m²)
                  </label>
                  <input
                    type="number"
                    value={formData.area_internal || ''}
                    onChange={(e) => handleInputChange('area_internal', 
                      e.target.value ? Number(e.target.value) : undefined
                    )}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Covered Area (m²)
                  </label>
                  <input
                    type="number"
                    value={formData.area_veranda || ''}
                    onChange={(e) => handleInputChange('area_veranda', 
                      e.target.value ? Number(e.target.value) : undefined
                    )}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="150"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Status Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Pricing & Status</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (EUR)
                  </label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', 
                      e.target.value ? Number(e.target.value) : undefined
                    )}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="250,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status || 'available'}
                    onChange={(e) => handleInputChange('status', e.target.value as Unit['status'])}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${getStatusColor(formData.status || 'available')}`}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{unit ? 'Update Unit' : 'Create Unit'}</span>
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
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

// Demo App component
function App() {
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);

  const handleSave = (unit: Unit) => {
    console.log('Saved unit:', unit);
    setShowUnitForm(false);
  };

  const handleCancel = () => {
    setShowUnitForm(false);
  };

  const handleAssetUpload = (asset: any) => {
    console.log('Uploaded asset:', asset);
    setShowAssetForm(false);
  };

  const handleAssetCancel = () => {
    setShowAssetForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">PropertyPro Unit Management</h1>
        <p className="text-gray-600 mb-8">Professional forms with enhanced styling</p>
        
        {!showUnitForm && !showAssetForm && (
          <div className="space-y-4">
            <button
              onClick={() => setShowUnitForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors mr-4"
            >
              Open Unit Form
            </button>
            <button
              onClick={() => setShowAssetForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
            >
              Open Asset Upload Form
            </button>
          </div>
        )}

        {showUnitForm && (
          <UnitForm
            projectId={1}
            unit={null}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {showAssetForm && (
          <AssetUploadForm
            projectId={1}
            onClose={handleAssetCancel}
            onUpload={handleAssetUpload}
          />
        )}
      </div>
    </div>
  );
}
