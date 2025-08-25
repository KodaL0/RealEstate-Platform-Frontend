import { useState, useEffect } from 'react';
import UnitForm from './UnitForm';
import AssetUploadForm from './AssetUploadForm';
import PhotoUploadForm from './PhotoUploadForm';
import EnhancedUnitsManager from './EnhancedUnitsManager';
import AssetManager from '../../components/AssetManager';
import developersApi, { Unit, ProjectAsset } from '../../../config/developers-api';
import { useUser } from '../../../context/UserContext';

type Project = {
  id: number;
  name: string;
  location?: string;
  status?: string;
  description?: string;
  start_date?: string;       
  finish_date?: string;      
};

<<<<<<< HEAD

type Asset = {
  id: number;
  project: number;
  category: string;
  title?: string;
  description?: string;
  file: string;
  uploaded_at: string;
};

=======
>>>>>>> 5988e03016e2eb504d09fc6df797123b482a8452
interface ProjectManagementProps {
  project: Project;
  activeSection: 'overview' | 'units' | 'assets' | 'photos' | 'team';
}

export default function ProjectManagement({ project, activeSection }: ProjectManagementProps) {
  const { user } = useUser();
  const [units, setUnits] = useState<Unit[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [photos, setPhotos] = useState<ProjectAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showAssetUpload, setShowAssetUpload] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  useEffect(() => {
    const loadProjectData = async () => {
      setIsLoading(true);
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
        console.error('Failed to load project data:', error);
        // Set empty arrays on error
        setUnits([]);
        setAssets([]);
        setPhotos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [project.id]);

  const getMockImage = () => {
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&h=300';
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    
    console.log('Attempting to delete unit:', unitId);
    console.log('Current user:', user);
    console.log('User is_developer:', user?.is_developer);
    console.log('Project:', project);
    
    // Log the unit being deleted
    const unitToDelete = units.find(unit => unit.id === unitId);
    console.log('Unit to delete:', unitToDelete);
    
    try {
      await developersApi.units.delete(unitId);
      setUnits(units.filter(unit => unit.id !== unitId));
      console.log('Unit deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete unit:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // Log more details about the request
      if (error.config) {
        console.error('Request config:', {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers,
          withCredentials: error.config.withCredentials
        });
      }
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await developersApi.projectAssets.delete(photoId);
      setPhotos(photos.filter(photo => photo.id !== photoId));
      // Also remove from assets since photos are stored as assets
      setAssets(assets.filter(asset => asset.id !== photoId));
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleSaveUnit = (savedUnit: Unit) => {
    if (editingUnit) {
      // Update existing unit
      setUnits(units.map(unit => unit.id === savedUnit.id ? savedUnit : unit));
    } else {
      // Add new unit
      setUnits([...units, savedUnit]);
    }
    setShowUnitForm(false);
    setEditingUnit(null);
  };

  const handleCancelUnitForm = () => {
    setShowUnitForm(false);
    setEditingUnit(null);
  };

  const handleAssetUpload = (newAsset: ProjectAsset) => {
    setAssets([newAsset, ...assets]);
    setShowAssetUpload(false);
  };

  const handlePhotoUpload = (newPhoto: ProjectAsset) => {
    setPhotos([newPhoto, ...photos]);
    setShowPhotoUpload(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  // Render safe empty overview if no data (avoid blank screen)
  if (!units.length && !assets.length && activeSection === 'overview') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-3xl mb-2">🏗️</div>
        <h3 className="text-lg font-semibold mb-2">No data yet</h3>
        <p className="text-gray-600">Start by adding units or uploading assets.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-4 md:space-y-6">
      {/* Dynamic Content Based on Active Section */}
      {activeSection === 'overview' && (
        <>
          {/* Project Card Header - Mobile Optimized */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Image - Responsive Height */}
            <div className="h-32 sm:h-40 md:h-48 bg-gray-100 relative">
              <img 
                src={getMockImage()} 
                alt={project.name}
                className="w-full h-full object-cover"
              />
              {project.status && (
                <div className="absolute top-2 right-2 md:top-3 md:right-3">
                  <span className="px-2 py-1 text-xs md:text-sm bg-green-100 text-green-800 rounded-full">
                    {project.status}
                  </span>
                </div>
              )}
            </div>

            {/* Content - Mobile Responsive */}
            <div className="p-4 md:p-6">
              {/* Title */}
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {project.name}
              </h1>
              
              {/* Location */}
              <div className="flex items-center text-gray-600 mb-4 md:mb-6">
                <span className="mr-1">📍</span>
                <span className="text-sm md:text-base">{project.location}</span>
              </div>

              {/* Stats - Mobile Responsive Grid */}
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                    {units.length}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Units</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                    {assets.length}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Assets</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                    {photos.length}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Photos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Overview Content */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Project Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Project Details</h4>
                <div className="space-y-2 text-sm">
                  {project.description && (
                    <div><span className="text-gray-500">Description:</span> {project.description}</div>
                  )}
                  {project.start_date && (
                    <div><span className="text-gray-500">Start Date:</span> {new Date(project.start_date).toLocaleDateString()}</div>
                  )}
                  {project.finish_date && (
                    <div><span className="text-gray-500">Finish Date:</span> {new Date(project.finish_date).toLocaleDateString()}</div>
                  )}
                  <div><span className="text-gray-500">Total Units:</span> {units.length}</div>
                  <div><span className="text-gray-500">Available Units:</span> {units.filter(u => u.status === 'available').length}</div>
                  <div><span className="text-gray-500">Reserved:</span> {units.filter(u => u.status === 'reserved').length}</div>
                  <div><span className="text-gray-500">Sold:</span> {units.filter(u => u.status === 'sold').length}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• {assets.length} assets uploaded</div>
                  <div>• {units.length} units configured</div>
                  <div>• Project status: {project.status}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'units' && (
        <EnhancedUnitsManager
          projectId={project.id}
          units={units}
          onUnitCreate={async (unit) => {
            try {
              const savedUnit = await developersApi.units.create(unit);
              setUnits(prev => [...prev, savedUnit]);
            } catch (error) {
              console.error('Failed to create unit:', error);
            }
          }}
          onUnitUpdate={async (unit) => {
            try {
              const updatedUnit = await developersApi.units.update(unit.id, unit);
              setUnits(prev => prev.map(u => u.id === unit.id ? updatedUnit : u));
            } catch (error) {
              console.error('Failed to update unit:', error);
            }
          }}
          onUnitDelete={handleDeleteUnit}
          onUnitDuplicate={async (unit) => {
            try {
              const savedUnit = await developersApi.units.create(unit);
              setUnits(prev => [...prev, savedUnit]);
            } catch (error) {
              console.error('Failed to duplicate unit:', error);
            }
          }}
        />
      )}

      {activeSection === 'assets' && (
        <AssetManager projectId={project.id} />
      )}

      {activeSection === 'photos' && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-lg font-semibold">Photos Gallery</h3>
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="text-lg">📸</span>
              <span className="hidden sm:inline">Upload Photos</span>
            </button>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <div className="text-3xl md:text-4xl mb-4">📸</div>
              <h4 className="text-base md:text-lg font-medium mb-2">No Photos Yet</h4>
              <p className="text-sm md:text-base text-gray-600">Click the upload button to add project photos to showcase your development</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={photo.file} 
                      alt={photo.title || `Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    
                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                        <button 
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200"
                          title="Delete photo"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Photo Info */}
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-600 truncate">
                      {photo.title || `Photo ${index + 1}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'team' && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-lg font-semibold">Project Team</h3>
            <button
              className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="text-lg">👥</span>
              <span className="hidden sm:inline">Add Team Member</span>
            </button>
          </div>

          <div className="text-center py-8 md:py-12">
            <div className="text-3xl md:text-4xl mb-4">👥</div>
            <h4 className="text-base md:text-lg font-medium mb-2">Team Management Coming Soon</h4>
            <p className="text-sm md:text-base text-gray-600">
              Manage project team members, roles, and permissions. This feature will be available in the next update.
            </p>
          </div>
        </div>
      )}

      {/* Unit Form Modal */}
      {showUnitForm && (
        <UnitForm
          projectId={project.id}
          unit={editingUnit}
          onSave={handleSaveUnit}
          onCancel={handleCancelUnitForm}
        />
      )}

      {/* Asset Upload Modal */}
      {showAssetUpload && (
        <AssetUploadForm
          projectId={project.id}
          onClose={() => setShowAssetUpload(false)}
          onUpload={handleAssetUpload}
        />
      )}

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <PhotoUploadForm
          projectId={project.id}
          onClose={() => setShowPhotoUpload(false)}
          onUpload={handlePhotoUpload}
        />
      )}
    </div>
  );
}