import { useState, useEffect, KeyboardEvent } from 'react';
import developersApi from '../../../config/developers-api';

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

export default function AssetUploadForm({ projectId, onClose, onUpload }: AssetUploadFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('other');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const assetCategories = [
    { value: 'floor_plans', label: 'Floor Plans', icon: '📐' },
    { value: 'brochures', label: 'Brochures', icon: '📋' },
    { value: 'legal_documents', label: 'Legal Documents', icon: '⚖️' },
    { value: 'photos', label: 'Photos', icon: '📸' },
    { value: 'videos', label: 'Videos', icon: '🎥' },
    { value: 'presentations', label: 'Presentations', icon: '📊' },
    { value: 'specifications', label: 'Specifications', icon: '📝' },
    { value: 'contracts', label: 'Contracts', icon: '📄' },
    { value: 'permits', label: 'Permits', icon: '✅' },
    { value: 'other', label: 'Other', icon: '📎' }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!customTitle) {
        const fileName = selectedFile.name.split('.')[0];
        setCustomTitle(fileName.replace(/[_-]/g, ' '));
      }
    }
  };

  const addTagFromInput = () => {
    const cleaned = tagInput.trim().replace(/\s+/g, ' ');
    if (!cleaned) return;
    if (!tags.includes(cleaned)) setTags(prev => [...prev, cleaned]);
    setTagInput('');
  };

  const onTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagFromInput();
    }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);

    try {
      const finalTitle = (customTitle && customTitle.trim()) ? customTitle.trim() : (selectedSuggestion || 'Untitled');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('project', projectId.toString());
      formData.append('category', selectedCategory);
      formData.append('title', finalTitle);
      formData.append('description', description);
      // Include tags in metadata for quick filtering
      formData.append('metadata', JSON.stringify({ tags }));

      const newAsset = await developersApi.projectAssets.create({
        file: file,
        project: projectId,
        category: selectedCategory,
        title: finalTitle,
        description: description,
        metadata: { tags }
      });
      onUpload(newAsset);
      onClose();
    } catch (error) {
      console.error('Error uploading asset:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const selectedCategoryData = assetCategories.find(cat => cat.value === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold">Upload Asset</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {assetCategories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setSelectedCategory(category.value as AssetCategory)}
                  className={`p-3 rounded-lg border-2 transition-colors text-center ${
                    selectedCategory === category.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-lg mb-1">{category.icon}</div>
                  <div className="text-xs font-medium">{category.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov"
                required
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📤</div>
                <div className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </div>
                <div className="text-xs text-gray-500">
                  PDF, DOC, XLS, PPT, Images, Videos
                </div>
              </label>
              {file && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                  <strong>Selected:</strong> {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Title Suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suggested Title
            </label>
            <select
              value={selectedSuggestion}
              onChange={(e) => setSelectedSuggestion(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {(titleSuggestions[selectedCategory] || []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">You can use a suggested title or provide your own.</p>
          </div>

          {/* Custom Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Title (optional)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Enter a personal title to override the suggestion"
            />
            <p className="mt-1 text-xs text-gray-500">If provided, this will be used instead of the suggestion.</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (press Enter or comma to add)
            </label>
            <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded px-2 py-2">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="ml-1 text-gray-500 hover:text-gray-700">×</button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKeyDown}
                placeholder="Add tag"
                className="flex-1 min-w-[120px] outline-none text-sm py-1"
              />
            </div>
            {!!tags.length && (
              <p className="mt-1 text-xs text-gray-500">{tags.length} tag{tags.length > 1 ? 's' : ''} added</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 resize-vertical"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          {/* Selected Category Preview */}
          {selectedCategoryData && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{selectedCategoryData.icon}</span>
                <span className="text-sm font-medium text-blue-700">
                  Uploading to: {selectedCategoryData.label}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isUploading || !file}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Asset'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

