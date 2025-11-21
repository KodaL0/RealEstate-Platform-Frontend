import {
  Archive,
  FileText,
  Filter,
  FolderOpen,
  Image,
  LayoutGrid,
  ListTree,
  Music,
  Paperclip,
  Search,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import developersApi from "../../config/developers-api";
import AssetUploadForm from "./AssetUploadForm";
import AssetCard from "./components/AssetCard";
import AssetRow from "./components/AssetRow";

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
  onStatsChange?: (stats: { assets: number; photos: number }) => void; // NEW
}

export default function AssetManager({ projectId, onStatsChange }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [categories, setCategories] = useState<{
    document?: Array<[string, string]>;
    image?: Array<[string, string]>;
    video?: Array<[string, string]>;
  }>({});
  const [organizedView, setOrganizedView] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [openFilters, setOpenFilters] = useState(false);

  const assetTypes = [
    { value: "", label: "All Types", icon: FolderOpen, color: "text-gray-600" },
    { value: "document", label: "Documents", icon: FileText, color: "text-blue-600" },
    { value: "image", label: "Images", icon: Image, color: "text-green-600" },
    { value: "video", label: "Videos", icon: Video, color: "text-red-600" },
    { value: "audio", label: "Audio", icon: Music, color: "text-purple-600" },
    { value: "archive", label: "Archives", icon: Archive, color: "text-orange-600" },
    { value: "other", label: "Other", icon: Paperclip, color: "text-gray-600" },
  ];

  const fetchAssets = useCallback(async () => {
    try {
      const data = await developersApi.assets.getByProject(projectId);
      setAssets(data || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await developersApi.assets.getCategories();
      setCategories(categoriesData || {});
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories({});
    }
  }, []);

  const filterAssets = useCallback(() => {
    let filtered = assets;

    if (searchQuery) {
      filtered = filtered.filter(
        (asset) =>
          asset.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    if (selectedType) {
      filtered = filtered.filter((asset) => asset.asset_type === selectedType);
    }

    if (selectedCategory) {
      filtered = filtered.filter((asset) => {
        switch (selectedType) {
          case "document":
            return asset.document_category === selectedCategory;
          case "image":
            return asset.image_category === selectedCategory;
          case "video":
            return asset.video_category === selectedCategory;
          default:
            return true;
        }
      });
    }

    setFilteredAssets(filtered);
  }, [assets, searchQuery, selectedType, selectedCategory]);

  // Emit totals whenever full assets list changes
  useEffect(() => {
    const assetsCount = assets.length;
    const photosCount = assets.filter(
      (a) => a.asset_type === "image" || a.mime_type?.startsWith("image/"),
    ).length;
    onStatsChange?.({ assets: assetsCount, photos: photosCount });
  }, [assets, onStatsChange]);

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, [fetchAssets, fetchCategories]);

  useEffect(() => {
    filterAssets();
  }, [filterAssets]);

  const toggleFeatured = async (assetId: number) => {
    try {
      await developersApi.assets.toggleFeatured(assetId);
      fetchAssets(); // Refresh the list
    } catch (error) {
      console.error("Error toggling featured status:", error);
    }
  };

  const togglePublic = async (assetId: number) => {
    try {
      await developersApi.assets.togglePublic(assetId);
      fetchAssets(); // Refresh the list
    } catch (error) {
      console.error("Error toggling public status:", error);
    }
  };

  const deleteAsset = async (assetId: number) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      await developersApi.assets.delete(assetId);
      setAssets(assets.filter((asset) => asset.id !== assetId));
    } catch (error) {
      console.error("Error deleting asset:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getAssetIcon = (asset: Asset) => {
    const typeConfig = assetTypes.find((type) => type.value === asset.asset_type);
    if (typeConfig) {
      const IconComponent = typeConfig.icon;
      return <IconComponent className={`w-8 h-8 ${typeConfig.color}`} />;
    }
    return <Paperclip className="w-8 h-8 text-gray-600" />;
  };

  const getCategoryOptions = () => {
    if (!selectedType) return [];
    const categoryArray =
      (selectedType === "document" && categories.document) ||
      (selectedType === "image" && categories.image) ||
      (selectedType === "video" && categories.video) ||
      [];
    return [
      { value: "", label: "All Categories" },
      ...categoryArray.map((cat: [string, string]) => ({
        value: cat[0],
        label: cat[1],
      })),
    ];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Build a map from category code to label for documents
  const documentCategoryLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    const docs = categories.document || [];
    docs.forEach((pair: [string, string]) => {
      map[pair[0]] = pair[1];
    });
    return map;
  }, [categories]);

  // Group documents by category when organized view is enabled
  const groupedDocuments = useMemo(() => {
    if (!organizedView || selectedType !== "document") return null;
    const groups: Record<string, Asset[]> = {};
    const docs = filteredAssets.filter((a) => a.asset_type === "document");
    for (const a of docs) {
      const key = a.document_category || "uncategorized";
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
      {/* Header with Actions */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Asset Manager</h2>
              <p className="text-sm text-gray-500">
                Manage documents, images and files for this project
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl p-1 flex items-center bg-gray-100">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center px-3 py-2 rounded-lg text-sm ${viewMode === "grid" ? "bg-white text-gray-900 shadow" : "text-gray-600 hover:text-gray-900"}`}
                title="Grid View"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4 mr-1" /> Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center px-3 py-2 rounded-lg text-sm ${viewMode === "list" ? "bg-white text-gray-900 shadow" : "text-gray-600 hover:text-gray-900"}`}
                title="List View"
                aria-label="List view"
              >
                <ListTree className="w-4 h-4 mr-1" /> List
              </button>
            </div>
            {selectedType === "document" && (
              <div className="rounded-xl p-1 flex items-center bg-gray-100">
                <button
                  type="button"
                  onClick={() => setOrganizedView(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${!organizedView ? "bg-white text-gray-900 shadow" : "text-gray-600 hover:text-gray-900"}`}
                  title="Flat View"
                  aria-label="Flat view"
                >
                  <LayoutGrid className="w-4 h-4 mr-1" /> Flat
                </button>
                <button
                  type="button"
                  onClick={() => setOrganizedView(true)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${organizedView ? "bg-white text-gray-900 shadow" : "text-gray-600 hover:text-gray-900"}`}
                  title="Organized View"
                  aria-label="Organized view"
                >
                  <ListTree className="w-4 h-4 mr-1" /> Organized
                </button>
              </div>
            )}
            <button
              type="button"
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
                type="button"
                onClick={() => {
                  setSelectedType(t.value);
                  setSelectedCategory("");
                }}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm border transition-all ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                title={t.label}
              >
                <Icon className={`w-4 h-4 mr-1 ${active ? "text-white" : t.color}`} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Search & Filter</h3>
          <div className="flex-1 h-px bg-gray-200"></div>
          <button
            type="button"
            className="sm:hidden text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg bg-blue-50"
            onClick={() => setOpenFilters((v) => !v)}
            aria-expanded={openFilters}
            aria-controls="asset-filters"
          >
            {openFilters ? "Hide" : "Show"}
          </button>
        </div>

        <div
          id="asset-filters"
          className={`${openFilters ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "hidden md:grid md:grid-cols-3 md:gap-4"}`}
        >
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
              setSelectedCategory(""); // Reset category when type changes
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
          >
            {assetTypes.map((type) => (
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
            {getCategoryOptions().map((cat) => (
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
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedType && (
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Type: {assetTypes.find((t) => t.value === selectedType)?.label}
                <button
                  type="button"
                  onClick={() => setSelectedType("")}
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
                  type="button"
                  onClick={() => setSelectedCategory("")}
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
              ? "Try adjusting your search criteria or filters to find what you're looking for."
              : "Upload your first asset to get started with managing your project files."}
          </p>
          {!searchQuery && !selectedType && !selectedCategory && (
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload First Asset
            </button>
          )}
        </div>
      ) : organizedView && selectedType === "document" && groupedDocuments ? (
        <div className="space-y-8">
          {Object.entries(groupedDocuments).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  {cat === "uncategorized" ? "Uncategorized" : documentCategoryLabelMap[cat] || cat}
                  <span className="ml-2 text-xs text-gray-500">({items.length})</span>
                </h4>
              </div>
              {viewMode === "list" ? (
                <div className="space-y-3">
                  {items.map((asset) => (
                    <AssetRow
                      key={asset.id}
                      asset={asset}
                      onToggleFeatured={toggleFeatured}
                      onTogglePublic={togglePublic}
                      onDelete={deleteAsset}
                      onView={(file) => window.open(file, "_blank")}
                      renderIcon={getAssetIcon}
                      formatFileSize={formatFileSize}
                      formatDate={formatDate}
                      categoryLabel={
                        documentCategoryLabelMap[asset.document_category || ""] || "Document"
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onToggleFeatured={toggleFeatured}
                      onTogglePublic={togglePublic}
                      onDelete={deleteAsset}
                      onView={(file) => window.open(file, "_blank")}
                      renderIcon={getAssetIcon}
                      formatFileSize={formatFileSize}
                      formatDate={formatDate}
                      categoryLabel={
                        documentCategoryLabelMap[asset.document_category || ""] || "Document"
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filteredAssets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              onToggleFeatured={toggleFeatured}
              onTogglePublic={togglePublic}
              onDelete={deleteAsset}
              onView={(file) => window.open(file, "_blank")}
              renderIcon={getAssetIcon}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onToggleFeatured={toggleFeatured}
              onTogglePublic={togglePublic}
              onDelete={deleteAsset}
              onView={(file) => window.open(file, "_blank")}
              renderIcon={getAssetIcon}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Upload Modal - Only render once when showUploadModal is true */}
      {showUploadModal && (
        <AssetUploadForm
          projectId={projectId}
          onClose={() => setShowUploadModal(false)}
          onUpload={(newAsset) => {
            setAssets((prev) => [newAsset as unknown as Asset, ...prev]);
            setShowUploadModal(false);
            fetchAssets();
          }}
        />
      )}
    </div>
  );
}
