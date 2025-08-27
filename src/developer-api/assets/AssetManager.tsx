import { useState, useEffect, useMemo } from 'react';
import { Upload, Search, Filter, Download, Eye, Trash2, Star, Globe, FileText, Image, Video, Music, Archive, Paperclip, FolderOpen, LayoutGrid, ListTree, X } from 'lucide-react';
import developersApi from '../config/developers-api';
import AssetUploadForm from './AssetUploadForm';

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
  // Upload is handled by AssetUploadForm modal
  const [categories, setCategories] = useState<any>({});
  const [organizedView, setOrganizedView] = useState(false);

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
      const categoriesData = await developersApi.assets.getCategories();
      setCategories(categoriesData || {});
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

  // Drag-and-drop and bulk upload were replaced by AssetUploadForm

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

  // Build a map from category code to label for documents
  const documentCategoryLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    const docs = categories?.document || [];
    docs.forEach((pair: [string, string]) => {
      map[pair[0]] = pair[1];
    });
    return map;
  }, [categories]);

  // Group documents by category when organized view is enabled
  const groupedDocuments = useMemo(() => {
    if (!organizedView || selectedType !== 'document') return null;
    const groups: Record<string, Asset[]> = {};
    const docs = filteredAssets.filter(a => a.asset_type === 'document');
    for (const a of docs) {
      const key = a.document_category || 'uncategorized';
      if (!groups[key]) groups[key] = [] as Asset[];
      groups[key].push(a);
    }
    return groups;
  }, [organizedView, selectedType, filteredAssets]);

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
    <div className="space-y-6">
      {/* Header with Actions (neutral, responsive) */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Asset Manager</h2>
              <p className="text-sm text-gray-500">Manage documents, images and files for this project</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedType === 'document' && (
              <div className="rounded-xl p-1 flex items-center bg-gray-100">
                <button
                  onClick={() => setOrganizedView(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${!organizedView ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4 mr-1" /> Grid
                </button>
                <button
                  onClick={() => setOrganizedView(true)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${organizedView ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'}`}
                  title="Organized View"
                >
                  <ListTree className="w-4 h-4 mr-1" /> Organized
                </button>
              </div>
            )}
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload
            </button>
          </div>
        </div>
        {/* Type tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {assetTypes.map((t) => {
            const Icon = t.icon;
            const active = selectedType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => { setSelectedType(t.value); setSelectedCategory(''); }}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm border transition-all ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                title={t.label}
              >
                <Icon className={`w-4 h-4 mr-1 ${active ? 'text-white' : t.color}`} />
                {t.label}
              </button>
            );
          })}
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

      {/* Assets Grid or Organized Documents */}
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
      ) : organizedView && selectedType === 'document' && groupedDocuments ? (
        <div className="space-y-8">
          {Object.entries(groupedDocuments).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  {cat === 'uncategorized' ? 'Uncategorized' : (documentCategoryLabelMap[cat] || cat)}
                  <span className="ml-2 text-xs text-gray-500">({items.length})</span>
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map(asset => (
                  <div key={asset.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                      <div className="flex flex-col items-center space-y-2">
                        {getAssetIcon(asset)}
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                          {asset.asset_type}
                        </span>
                      </div>
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
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 truncate mb-1">{asset.title || asset.original_filename}</h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                        <span className="capitalize">{documentCategoryLabelMap[asset.document_category || ''] || 'Document'}</span>
                        <span>•</span>
                        <span>{formatFileSize(asset.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(asset.uploaded_at)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex space-x-1">
                          <button onClick={() => toggleFeatured(asset.id)} className={`p-2 rounded-lg transition-all duration-200 ${asset.is_featured ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'}`} title="Toggle Featured">
                            <Star className="h-4 w-4" />
                          </button>
                          <button onClick={() => togglePublic(asset.id)} className={`p-2 rounded-lg transition-all duration-200 ${asset.is_public ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title="Toggle Public">
                            <Globe className="h-4 w-4" />
                          </button>
                          <button onClick={() => window.open(asset.file, '_blank')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200" title="Download">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                        <button onClick={() => deleteAsset(asset.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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

      {/* Upload Modal (render form directly; it provides its own overlay) */}
      {showUploadModal && (
        <AssetUploadForm
          projectId={projectId}
          onClose={() => setShowUploadModal(false)}
          onUpload={(newAsset) => {
            setAssets(prev => [newAsset as unknown as Asset, ...prev]);
            setShowUploadModal(false);
            fetchAssets();
          }}
        />
      )}
    </div>
  );
}


