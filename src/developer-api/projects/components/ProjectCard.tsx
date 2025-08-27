import { useState, useEffect } from 'react';
import { Building } from 'lucide-react';
import ProjectToolbar from './ProjectToolbar';
import developersApi from '../../../config/developers-api';

type Project = {
  id: number;
  name: string;
  location?: string;
  status?: string;
  main_image?: string;
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
      <div className="h-36 bg-gray-100 relative cursor-pointer" onClick={() => onClick(project)}>
        {project.main_image ? (
          <img 
            src={project.main_image} 
            alt={project.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${project.main_image ? 'hidden' : ''}`}>
          <Building className="w-16 h-16 text-gray-400" />
        </div>
        {project.status && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
              {project.status}
            </span>
          </div>
        )}
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
          <button
            onClick={() => setShowManage(v => !v)}
            className="ml-3 inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            aria-expanded={showManage}
            aria-controls={`project-toolbar-${project.id}`}
            title="Manage project"
          >
            {showManage ? 'Hide' : 'Manage'}
          </button>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>📊 {units.length} units • {assets.length} assets • {photos.length} photos</span>
          <span className="text-xs text-gray-400">ID: {project.id}</span>
        </div>
      </div>

      {/* Collapsible Project Management Toolbar (compact) */}
      {showManage && (
        <div id={`project-toolbar-${project.id}`} className="px-3 pb-3">
          <ProjectToolbar
            projectId={project.id}
            projectName={project.name}
            onViewChange={onViewChange || (() => {})}
            onEdit={onEdit}
            onDelete={onDelete}
            stats={{
              units: units.length,
              assets: assets.length,
              photos: photos.length
            }}
            compact
            showHeader={false}
            showQuickActions={false}
          />
        </div>
      )}
    </div>
  );
}