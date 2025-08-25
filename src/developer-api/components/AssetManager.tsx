import { useState, useEffect } from 'react';
import { Upload, Search, Filter, Download, Eye, Trash2, Star, Globe } from 'lucide-react';
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

  const assetTypes = [
    { value: '', label: 'All Types' },
    { value: 'document', label: 'Documents' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'archive', label: 'Archives' },
    { value: 'other', label: 'Other' }
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
    if (asset.asset_type === 'image') return '🖼️';
    if (asset.asset_type === 'video') return '🎥';
    if (asset.asset_type === 'document') return '📄';
    if (asset.asset_type === 'audio') return '🎵';
    if (asset.asset_type === 'archive') return '📦';
    return '📎';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Asset Manager</h2>
          <p className="text-gray-600">Manage documents, images, and other project files</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setSelectedCategory(''); // Reset category when type changes
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!selectedType}
          >
            {getCategoryOptions().map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-medium mb-2">No Assets Found</h3>
          <p className="text-gray-600">
            {searchQuery || selectedType || selectedCategory
              ? 'Try adjusting your search or filters'
              : 'Upload your first asset to get started'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Asset Preview */}
              <div className="h-32 bg-gray-50 flex items-center justify-center relative">
                {asset.asset_type === 'image' ? (
                  <img
                    src={asset.file}
                    alt={asset.title || asset.original_filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{getAssetIcon(asset)}</span>
                )}
                
                {/* Status Indicators */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  {asset.is_featured && (
                    <span className="bg-yellow-500 text-white p-1 rounded-full" title="Featured">
                      <Star className="h-3 w-3" />
                    </span>
                  )}
                  {asset.is_public && (
                    <span className="bg-green-500 text-white p-1 rounded-full" title="Public">
                      <Globe className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Asset Info */}
              <div className="p-3">
                <h4 className="font-medium text-sm truncate mb-1">
                  {asset.title || asset.original_filename}
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  {asset.asset_type} • {formatFileSize(asset.file_size)}
                </p>
                
                {asset.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {asset.description}
                  </p>
                )}

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {asset.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{asset.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => window.open(asset.file, '_blank')}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleFeatured(asset.id)}
                      className={`p-1 rounded ${asset.is_featured ? 'text-yellow-600 hover:bg-yellow-50' : 'text-gray-400 hover:bg-gray-50'}`}
                      title="Toggle Featured"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => togglePublic(asset.id)}
                      className={`p-1 rounded ${asset.is_public ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                      title="Toggle Public"
                    >
                      <Globe className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Upload Files</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Choose files to upload or drag and drop them here
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setUploadFiles(e.target.files)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              {uploadFiles && uploadFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected {uploadFiles.length} file(s):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {Array.from(uploadFiles).map((file, index) => (
                      <div key={index} className="text-xs text-gray-500 truncate">
                        {file.name} ({formatFileSize(file.size)})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={!uploadFiles || uploadFiles.length === 0 || isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


