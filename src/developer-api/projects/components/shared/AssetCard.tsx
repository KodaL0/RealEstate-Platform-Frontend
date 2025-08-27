import React from 'react';
import { Eye, Download, Star, Globe } from 'lucide-react';
import { Asset, ToggleHandler } from './types';
import { cardContainer, cardPreview, toggleButtonBase, actionIconButton } from './styles';
import { formatDate, formatFileSize } from './utils';

interface AssetCardProps {
  asset: Asset;
  icon: React.ReactNode;
  onToggleFeatured: ToggleHandler;
  onTogglePublic: ToggleHandler;
  onDelete: ToggleHandler;
  categoryLabel?: string;
}

export default function AssetCard({ asset, icon, onToggleFeatured, onTogglePublic, onDelete, categoryLabel }: AssetCardProps) {
  return (
    <div className={cardContainer}>
      <div className={cardPreview}>
        {asset.asset_type === 'image' ? (
          <img
            src={asset.file}
            alt={asset.title || asset.original_filename}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center space-y-2">
            {icon}
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {asset.asset_type}
            </span>
          </div>
        )}

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
          <span className="capitalize">{categoryLabel || asset.asset_type}</span>
          <span>•</span>
          <span>{formatFileSize(asset.file_size)}</span>
          <span>•</span>
          <span>{formatDate(asset.uploaded_at)}</span>
        </div>

        {asset.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{asset.description}</p>
        )}

        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {asset.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
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

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex space-x-1">
            <button
              onClick={() => onToggleFeatured(asset.id)}
              className={`${toggleButtonBase} ${asset.is_featured ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'}`}
              title="Toggle Featured"
            >
              <Star className="h-4 w-4" />
            </button>
            <button
              onClick={() => onTogglePublic(asset.id)}
              className={`${toggleButtonBase} ${asset.is_public ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
              title="Toggle Public"
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.open(asset.file, '_blank')}
              className={actionIconButton}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => onDelete(asset.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200" title="Delete">
            {/* Reuse Download icon set for consistency in parent */}
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14H7L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


