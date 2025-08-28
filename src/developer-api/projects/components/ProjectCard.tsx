import { useState, useEffect } from 'react';
import { Building } from 'lucide-react';
import UnitPublishModal from './UnitPublishModal';
import developersApi from '../../../config/developers-api';

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
}

export default function ProjectCard({ project, onClick, onViewChange, onEdit, onDelete }: ProjectCardProps) {
  const [units, setUnits] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean>(Boolean((project as any).is_published));
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const loadProjectStats = async () => {
      try {
        // Fetch units for this project
        const unitsData = await developersApi.units.list();
        const projectUnits = unitsData.filter(unit => unit.project === project.id);
        setUnits(projectUnits);

        // Fetch assets for this project
        const assetsData = await developersApi.projectAssets.list();
        const projectAssets = assetsData.filter(asset => asset.project === project.id);
        setAssets(projectAssets);

        // Filter photos from assets
        const projectPhotos = projectAssets.filter(asset => asset.category === 'photos');
        setPhotos(projectPhotos);
        
      } catch (error) {
        console.error('Failed to load project stats:', error);
        setUnits([]);
        setAssets([]);
        setPhotos([]);
      }
    };

    loadProjectStats();
  }, [project.id]);



  return (
    <div 
      className="bg-white border rounded-lg hover:border-gray-300 transition-colors overflow-hidden"
    >
      {/* Image */}
      <div 
        className="h-36 bg-gray-100 relative cursor-pointer" 
        onClick={() => onClick(project)}
      >
        {project.main_image || photos[0]?.file ? (
          <img 
            src={project.main_image || photos[0]?.file} 
            alt={project.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}

        <div className={`w-full h-full flex items-center justify-center ${(project.main_image || photos[0]?.file) ? 'hidden' : ''}`}>
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
          <span>📊 {units.length} units • {assets.length} assets • {photos.length} photos</span>
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