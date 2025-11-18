import { useState, useEffect, useRef, memo } from 'react';
import { Building } from 'lucide-react';
import UnitPublishModal from './UnitPublishModal';
import developersApi from '../../../config/developers-api';
import { useImageLazyLoad } from '../../../hooks/useImageLazyLoad';

type Project = {
  id: number;
  name: string;
  location?: string;
  status?: string;
  main_image?: string;
  is_published?: boolean;
};

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onViewChange?: (view: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  // Pre-loaded stats to avoid N+1 queries
  preloadedStats?: {
    unitsCount?: number;
    assetsCount?: number;
    photosCount?: number;
    firstPhotoUrl?: string;
  };
}

function ProjectCard({ project, onClick, onViewChange, onEdit, onDelete, preloadedStats }: ProjectCardProps) {
  const [units, setUnits] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean>(Boolean((project as any).is_published));
  const [isBusy, setIsBusy] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const { hasBeenVisible } = useImageLazyLoad(imageRef, { rootMargin: '100px' });

  // Determine image source - prioritize main_image, then preloaded, then photos
  const getImageSource = () => {
    if (project.main_image) return project.main_image;
    if (preloadedStats?.firstPhotoUrl) return preloadedStats.firstPhotoUrl;
    if (photos[0]?.file_url) return photos[0].file_url;
    if (photos[0]?.file) return photos[0].file;
    return null;
  };

  const imageSource = getImageSource();

  // Use preloaded stats if available, otherwise fetch (lazy load stats)
  useEffect(() => {
    if (preloadedStats) {
      // Use preloaded data
      setUnits(Array(preloadedStats.unitsCount || 0).fill(null));
      setAssets(Array(preloadedStats.assetsCount || 0).fill(null));
      // Set photos array for stats display, but image will use preloadedStats.firstPhotoUrl
      setPhotos(preloadedStats.firstPhotoUrl ? [{ file_url: preloadedStats.firstPhotoUrl, file: preloadedStats.firstPhotoUrl }] : []);
      return;
    }

    // Fallback: lazy load stats only when card becomes visible
    if (!hasBeenVisible) return;

    const loadProjectStats = async () => {
      try {
        // Use cached APIs for better performance
        const [unitsData, assetsData] = await Promise.all([
          developersApi.units.listCached(),
          developersApi.assets.getByProject(project.id),
        ]);
        
        const projectUnits = unitsData.filter(unit => unit.project === project.id);
        setUnits(projectUnits);
        setAssets(assetsData);

        // Filter photos from assets (images with photo category)
        const projectPhotos = assetsData.filter(asset => 
          asset.asset_type === 'image' && asset.image_category === 'photos'
        );
        setPhotos(projectPhotos);
        
      } catch (error) {
        console.error('Failed to load project stats:', error);
        setUnits([]);
        setAssets([]);
        setPhotos([]);
      }
    };

    loadProjectStats();
  }, [project.id, preloadedStats, hasBeenVisible]);



  return (
    <div 
      className="bg-white border rounded-lg hover:border-gray-300 transition-colors overflow-hidden"
    >
      {/* Image with lazy loading */}
      <div 
        ref={imageRef}
        className="h-36 bg-gray-100 relative cursor-pointer overflow-hidden" 
        onClick={() => onClick(project)}
      >
        {/* Placeholder while loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
            <Building className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Actual image - load immediately if we have preloaded stats or main_image, otherwise wait for visibility */}
        {imageSource && !imageError && (preloadedStats?.firstPhotoUrl || project.main_image || hasBeenVisible) ? (
          <img 
            src={imageSource} 
            alt={project.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading={preloadedStats?.firstPhotoUrl || project.main_image ? "eager" : "lazy"}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
          />
        ) : null}

        {/* Fallback icon when no image or error */}
        <div className={`w-full h-full flex items-center justify-center ${(imageSource && !imageError) ? 'hidden' : ''}`}>
          <Building className="w-16 h-16 text-gray-400" />
        </div>

        {project.status && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">{project.status}</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 text-xs rounded border ${isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>


      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-medium text-gray-900 mb-1 truncate">
              {project.name}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <span className="mr-1">📍</span>
              <span className="truncate">{project.location}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isPublished ? (
              <button
                onClick={async () => {
                  if (!confirm('Unpublish this project? It will no longer be publicly visible.')) return;
                  setIsBusy(true);
                  try {
                    await developersApi.projects.unpublish(project.id);
                    setIsPublished(false);
                  } catch (e) {
                    alert('Failed to unpublish project.');
                  } finally {
                    setIsBusy(false);
                  }
                }}
                disabled={isBusy}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
                title="Unpublish project"
              >
                {isBusy ? 'Working…' : 'Unpublish'}
              </button>
            ) : (
              <button
                onClick={() => setShowPublishModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                title="Publish project"
              >
                Publish
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>📊 {
            preloadedStats 
              ? `${preloadedStats.unitsCount || 0} units • ${preloadedStats.assetsCount || 0} assets • ${preloadedStats.photosCount || 0} photos`
              : `${units.length} units • ${assets.length} assets • ${photos.length} photos`
          }</span>
          <span className="text-xs text-gray-400">ID: {project.id}</span>
        </div>
      </div>

      {/* Unit selection modal for publishing */}
      <UnitPublishModal
        projectId={project.id}
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublished={() => {
          // Best-effort update without full reload
          setIsPublished(true);
        }}
      />
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(ProjectCard);