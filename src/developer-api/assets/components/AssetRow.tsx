import React from 'react';
import { Download, Eye, Globe, Star, Trash2 } from 'lucide-react';
import type { Asset } from './AssetCard';

type AssetRowProps = {
  asset: Asset;
  onToggleFeatured: (id: number) => void;
  onTogglePublic: (id: number) => void;
  onDelete: (id: number) => void;
  onView: (file: string) => void;
  renderIcon: (asset: Asset) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  categoryLabel?: string;
};

export default function AssetRow({
  asset,
  onToggleFeatured,
  onTogglePublic,
  onDelete,
  onView,
  renderIcon,
  formatFileSize,
  formatDate,
  categoryLabel,
}: AssetRowProps) {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {asset.asset_type === 'image' ? (
              <img src={asset.file} alt={asset.title || asset.original_filename} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center">
                {renderIcon(asset)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 truncate">
                {asset.title || asset.original_filename}
              </h4>
              {asset.is_featured && <Star className="w-4 h-4 text-yellow-500" title="Featured" />}
              {asset.is_public && <Globe className="w-4 h-4 text-green-600" title="Public" />}
            </div>
            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="capitalize">{categoryLabel || asset.asset_type}</span>
              <span>•</span>
              <span>{formatFileSize(asset.file_size)}</span>
              <span>•</span>
              <span>{formatDate(asset.uploaded_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => onToggleFeatured(asset.id)} className={`p-2 rounded-lg transition-colors ${asset.is_featured ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'}`} aria-label="Toggle featured">
            <Star className="w-4 h-4" />
          </button>
          <button onClick={() => onTogglePublic(asset.id)} className={`p-2 rounded-lg transition-colors ${asset.is_public ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} aria-label="Toggle public">
            <Globe className="w-4 h-4" />
          </button>
          <button onClick={() => onView(asset.file)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" aria-label="View">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => onView(asset.file)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" aria-label="Download">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(asset.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {asset.description && (
        <div className="px-4 pb-4 -mt-2 text-sm text-gray-600">
          {asset.description}
        </div>
      )}
    </div>
  );
}


