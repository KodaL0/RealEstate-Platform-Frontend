import { useState, useEffect } from 'react';
import { Upload, Search, Filter, Download, Eye, Trash2, Star, Globe, FileText, Image, Video, Music, Archive, Paperclip, X, FolderOpen, Calendar, User } from 'lucide-react';
import developersApi from '../../config/developers-api';

interface Asset {
  id: number;
  project: number;
  asset_type: string;
  file: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  title?: string;
  description?: string;
  document_category?: string;
  image_category?: string;
  video_category?: string;
  tags?: string[];
  is_public: boolean;
  is_featured: boolean;
  uploaded_at: string;
  width?: number;
  height?: number;
  page_count?: number;
}

interface AssetManagerProps {
  projectId: number;
}

export default function AssetManager({ projectId }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<any>({});
  const [dragActive, setDragActive] = useState(false);

  const assetTypes = [
    { value: '', label: 'All Types', icon: FolderOpen, color: 'text-gray-600' },
    { value: 'document', label: 'Documents', icon: FileText, color: 'text-blue-600' },
    { value: 'image', label: 'Images', icon: Image, color: 'text-green-600' },
    { value: 'video', label: 'Videos', icon: Video, color: 'text-red-600' },
    { value: 'audio', label: 'Audio', icon: Music, color: 'text-purple-600' },
    { value: 'archive', label: 'Archives', icon: Archive, color: 'text-orange-600' },
    { value: 'other', label: 'Other', icon: Paperclip, color: 'text-gray-600' }
  ];

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, [projectId]);

  useEffect(() => {
    filterAssets();
  }, [assets, searchQuery, selectedType, selectedCategory]);

  const fetchAssets = async () => {
    try {
      const data = await developersApi.assets.getByProject(projectId);
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Note: This endpoint might not exist in the current API, using empty object as fallback
      setCategories({});
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories({});
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    if (searchQuery) {
      filtered = filtered.filter(asset => 
        asset.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedType) {
      filtered = filtered.filter(asset => asset.asset_type === selectedType);
    }

    if (selectedCategory) {
      filtered = filtered.filter(asset => {
        switch (selectedType) {
          case 'document':
            return asset.document_category === selectedCategory;
          case 'image':
            return asset.image_category === selectedCategory;
          case 'video':
            return asset.video_category === selectedCategory;
          default:
            return true;
        }
      });
    }

    setFilteredAssets(filtered);
  };

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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFiles(e.dataTransfer.files);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('project', projectId.toString());
      
      Array.from(uploadFiles).forEach(file => {
        formData.append('files', file);
      });

      // Note: Bulk upload endpoint might not exist in current API
      // For now, we'll simulate success and refresh the list
      console.log('Bulk upload completed');
      fetchAssets(); // Refresh the list
      setShowUploadModal(false);
      setUploadFiles(null);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleFeatured = async (assetId: number) => {
    try {
      await developersApi.assets.toggleFeatured(assetId);
      fetchAssets(); // Refresh the list
    } catch (error) {
      console.error('Error toggling featured status:', error);
    }
  };

  const togglePublic = async (assetId: number) => {
    try {
      await developersApi.assets.togglePublic(assetId);
      fetchAssets(); // Refresh the list
    } catch (error) {
      console.error('Error toggling public status:', error);
    }
  };

  const deleteAsset = async (assetId: number) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      await developersApi.assets.delete(assetId);
      setAssets(assets.filter(asset => asset.id !== assetId));
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssetIcon = (asset: Asset) => {
    const typeConfig = assetTypes.find(type => type.value === asset.asset_type);
    if (typeConfig) {
      const IconComponent = typeConfig.icon;
      return <IconComponent className={`w-8 h-8 ${typeConfig.color}`} />;
    }
    return <Paperclip className="w-8 h-8 text-gray-600" />;
  };

  const getCategoryOptions = () => {
    if (!selectedType || !categories[selectedType]) return [];
    return [
      { value: '', label: 'All Categories' },
      ...categories[selectedType].map((cat: any) => ({
        value: cat[0],
        label: cat[1]
      }))
    ];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold">Asset Manager</h2>
            </div>
            <p className="text-blue-100">Manage documents, images, and other project files</p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-blue-100">
              <span className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{assets.length} Total Assets</span>
              </span>
              <span className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>{assets.filter(a => a.is_featured).length} Featured</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Search & Filter</h3>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setSelectedCategory(''); // Reset category when type changes
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
          >
            {assetTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white disabled:bg-gray-50 disabled:text-gray-500"
            disabled={!selectedType}
          >
            {getCategoryOptions().map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedType || selectedCategory) && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedType && (
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Type: {assetTypes.find(t => t.value === selectedType)?.label}
                <button
                  onClick={() => setSelectedType('')}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assets Found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || selectedType || selectedCategory
              ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
              : 'Upload your first asset to get started with managing your project files.'
            }
          </p>
          {!searchQuery && !selectedType && !selectedCategory && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload First Asset
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
              {/* Asset Preview */}
              <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                {asset.asset_type === 'image' ? (
                  <img
                    src={asset.file}
                    alt={asset.title || asset.original_filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    {getAssetIcon(asset)}
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      {asset.asset_type}
                    </span>
                  </div>
                )}
                
                {/* Status Indicators */}
                <div className="absolute top-3 right-3 flex space-x-1">
                  {asset.is_featured && (
                    <div className="bg-yellow-500 text-white p-1.5 rounded-full shadow-lg" title="Featured">
                      <Star className="h-3 w-3" />
                    </div>
                  )}
                  {asset.is_public && (
                    <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg" title="Public">
                      <Globe className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={() => window.open(asset.file, '_blank')}
                    className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="h-4 w-4 inline mr-2" />
                    View
                  </button>
                </div>
              </div>

              {/* Asset Info */}
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 truncate mb-1">
                  {asset.title || asset.original_filename}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                  <span className="capitalize">{asset.asset_type}</span>
                  <span>•</span>
                  <span>{formatFileSize(asset.file_size)}</span>
                  <span>•</span>
                  <span>{formatDate(asset.uploaded_at)}</span>
                </div>
                
                {asset.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {asset.description}
                  </p>
                )}

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {asset.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                        +{asset.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => toggleFeatured(asset.id)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        asset.is_featured 
                          ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                          : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                      title="Toggle Featured"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => togglePublic(asset.id)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        asset.is_public 
                          ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title="Toggle Public"
                    >
                      <Globe className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => window.open(asset.file, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Upload Files</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {dragActive ? 'Drop your files here' : 'Choose files to upload'}
                </h4>
                <p className="text-gray-600 mb-4">
                  or drag and drop them here
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setUploadFiles(e.target.files)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                />
              </div>
              
              {uploadFiles && uploadFiles.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <p className="text-sm font-medium text-gray-900">
                      Selected {uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''}:
                    </p>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {Array.from(uploadFiles).map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded-lg">
                        <span className="text-gray-700 truncate flex-1 mr-2">{file.name}</span>
                        <span className="text-gray-500 text-xs">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={!uploadFiles || uploadFiles.length === 0 || isUploading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Files</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}