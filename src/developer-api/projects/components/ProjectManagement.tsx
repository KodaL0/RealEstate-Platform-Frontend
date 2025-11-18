import { useState, useEffect } from 'react';
import UnitForm from './UnitForm';
import AssetUploadForm from '../../assets/AssetUploadForm';
import PhotoUploadForm from './PhotoUploadForm';
import EnhancedUnitsManager from './EnhancedUnitsManager';
import AssetManager from '../../assets/AssetManager';
import ProjectPreview from './ProjectPreview';
import developersApi, { Unit, DeveloperAsset } from '../../../config/developers-api';

type Project = {
  id: number;
  name: string;
  description?: string;
  location?: string;
  status?: string;
  start_date?: string;      
  finish_date?: string;
  main_image?: string;
};

// Removed unused local Asset type

interface ProjectManagementProps {
  project: Project;
  activeSection: 'overview' | 'preview' | 'units' | 'assets' | 'photos' | 'team';
  onViewChange?: (view: string) => void;
}

export default function ProjectManagement({ project, activeSection, onViewChange }: ProjectManagementProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [assets, setAssets] = useState<DeveloperAsset[]>([]);
  const [photos, setPhotos] = useState<DeveloperAsset[]>([]);
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
        const assetsData = await developersApi.assets.getByProject(project.id);
        setAssets(assetsData);
        
        // Filter photos from assets (images with photo category)
        const projectPhotos = assetsData.filter(asset => 
          asset.asset_type === 'image' && asset.image_category === 'photos'
        );
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

  const getHeroImage = () => {
    if (photos.length > 0) {
      // Use the first uploaded photo
      return photos[0].file_url || photos[0].file;
    }
    if (project.main_image) {
      return project.main_image;
    }
    // fallback placeholder
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&h=300';
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    
    try {
      await developersApi.units.delete(unitId);
      setUnits(units.filter(unit => unit.id !== unitId));
    } catch (error) {
      console.error('Failed to delete unit:', error);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await developersApi.assets.delete(photoId);
      setPhotos(photos.filter(photo => photo.id !== photoId));
      // Also remove from assets since photos are stored as assets
      setAssets(assets.filter(asset => asset.id !== photoId));
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleSaveUnit = (savedUnit: Unit) => {
    if (savedUnit.id) {
      // Update existing unit
      setUnits(prev => prev.map(unit => unit.id === savedUnit.id ? savedUnit : unit));
    } else {
      // Add new unit
      setUnits(prev => [...prev, savedUnit]);
    }
    setShowUnitForm(false);
  };

  const handleCancelUnitForm = () => {
    setShowUnitForm(false);
    setEditingUnit(null);
  };

  const handleAssetUpload = (newAsset: DeveloperAsset) => {
    setAssets([newAsset, ...assets]);
    // If it's a photo, also add to photos
    if (newAsset.asset_type === 'image' && newAsset.image_category === 'photos') {
      setPhotos([newAsset, ...photos]);
    }
    setShowAssetUpload(false);
  };

  const handlePhotoUpload = (newPhoto: any) => {
    setPhotos([newPhoto, ...photos]);
    setShowPhotoUpload(false);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25';
      case 'pending':
      case 'in-progress':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25';
      case 'completed':
      case 'sold':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25';
      default:
        return 'bg-gradient-to-r from-slate-500 to-gray-500 text-white shadow-lg shadow-slate-500/25';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
            </div>
          </div>
          <p className="text-slate-600 font-medium">Loading project data...</p>
          <p className="text-sm text-slate-400 mt-1">Please wait while we gather your information</p>
        </div>
      </div>
    );
  }

  // Render safe empty overview if no data (avoid blank screen)
  if (!units.length && !assets.length && activeSection === 'overview') {
    return (
      <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-8 text-center shadow-xl shadow-slate-200/50">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center">
          <span className="text-4xl">🏗️</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-3">Ready to Begin</h3>
        <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
          Your project dashboard is ready. Start by adding units or uploading assets to showcase your development.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-8">
      {/* Dynamic Content Based on Active Section */}
      {activeSection === 'preview' && (
        <ProjectPreview
          project={project as any}
          stats={{ units: units.length, assets: assets.length, photos: photos.length }}
          onEdit={() => setShowAssetUpload(true)}
          onViewChange={onViewChange}
        />
      )}
      {activeSection === 'overview' && (
        <>
          {/* Enhanced Project Hero Card */}
          <div className="relative bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
            {/* Hero Image with Enhanced Overlay */}
            <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-slate-900 to-slate-700">
              <img 
                src={getHeroImage()} 
                alt={project.name}
                className="w-full h-full object-cover opacity-80"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
              
              {/* Status Badge - Enhanced */}
              {project.status && (
                <div className="absolute top-4 right-4 md:top-6 md:right-6">
                  <span className={`px-4 py-2 text-sm font-semibold rounded-full backdrop-blur-sm ${getStatusBadgeStyle(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              )}
              
              {/* Project Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  {project.name}
                </h1>
                
                {project.location && (
                  <div className="flex items-center text-white/90 mb-4">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-medium drop-shadow">{project.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Stats Section */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Total Units', value: units.length, icon: '🏠', color: 'from-blue-500 to-indigo-500' },
                  { label: 'Assets', value: assets.length, icon: '📁', color: 'from-emerald-500 to-teal-500' },
                  { label: 'Photos', value: photos.length, icon: '📸', color: 'from-purple-500 to-pink-500' }
                ].map((stat, index) => (
                  <div key={index} className="text-center group">
                    <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200/50 group-hover:shadow-xl group-hover:shadow-slate-300/50 transition-all duration-300 group-hover:scale-105`}>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-slate-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Project Overview Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Details Card */}
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Project Details</h3>
              </div>
              
              <div className="space-y-4">
                {project.description && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Description</span>
                    <p className="text-slate-700 mt-1 leading-relaxed">{project.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.start_date && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Start Date</span>
                      <p className="text-slate-700 mt-1 font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {project.finish_date && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Finish Date</span>
                      <p className="text-slate-700 mt-1 font-medium">{new Date(project.finish_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                
                {/* Unit Status Breakdown */}
                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 block">Unit Status</span>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Available', count: units.filter(u => u.status === 'available').length, color: 'text-emerald-600' },
                      { label: 'Reserved', count: units.filter(u => u.status === 'reserved').length, color: 'text-amber-600' },
                      { label: 'Sold', count: units.filter(u => u.status === 'sold').length, color: 'text-blue-600' }
                    ].map((status, index) => (
                      <div key={index} className="text-center">
                        <div className={`text-lg font-bold ${status.color}`}>{status.count}</div>
                        <div className="text-xs text-slate-500 font-medium">{status.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity & Analytics Card */}
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Project Analytics</h3>
              </div>
              
              <div className="space-y-6">
                {/* Progress Indicators */}
                <div className="space-y-4">
                  {[
                    { label: 'Project Completion', value: 75, color: 'bg-blue-500' },
                    { label: 'Units Configured', value: units.length > 0 ? 100 : 0, color: 'bg-emerald-500' },
                    { label: 'Documentation', value: assets.length > 0 ? 80 : 0, color: 'bg-purple-500' }
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                        <span className="text-sm font-bold text-slate-600">{item.value}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color} transition-all duration-1000 ease-out`}
                          style={{ width: `${item.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Recent Activity */}
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                  <h4 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-700">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                      {assets.length} assets uploaded and organized
                    </div>
                    <div className="flex items-center text-sm text-slate-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {units.length} units configured and ready
                    </div>
                    <div className="flex items-center text-sm text-slate-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Project status: {project.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'units' && (
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
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
        </div>
      )}

      {activeSection === 'assets' && (
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <AssetManager projectId={project.id} />
        </div>
      )}

      {activeSection === 'photos' && (
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Photos Gallery</h3>
                <p className="text-slate-600">Showcase your project with stunning visuals</p>
              </div>
            </div>
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Upload Photos</span>
              </div>
            </button>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl flex items-center justify-center">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-slate-800 mb-4">Visual Stories Await</h4>
              <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
                Transform your project presentation with captivating photography that tells your development story
              </p>
              <button
                onClick={() => setShowPhotoUpload(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Start Adding Photos</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {photos.map((photo, index) => (
                <div key={photo.id} className="group relative">
                  <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 group-hover:shadow-xl group-hover:shadow-slate-300/50 transition-all duration-300">
                    <img 
                      src={photo.file_url || photo.file} 
                      alt={photo.title || `Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Enhanced Overlay Controls */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <button 
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="bg-red-500/90 backdrop-blur-sm hover:bg-red-600 text-white p-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          title="Delete photo"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Photo Info */}
                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {photo.title || `Photo ${index + 1}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(photo.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'team' && (
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Project Team</h3>
                <p className="text-slate-600">Manage your project collaborators</p>
              </div>
            </div>
            <button
              className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Member</span>
              </div>
            </button>
          </div>

          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl flex items-center justify-center">
              <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-slate-800 mb-4">Team Collaboration</h4>
            <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
              Advanced team management features are coming soon. Manage roles, permissions, and collaborative workflows.
            </p>
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 px-8 py-4 rounded-xl font-semibold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Modals */}
      {showUnitForm && (
        <UnitForm
          projectId={project.id}
          unit={editingUnit as any}
          onSave={(u: any) => handleSaveUnit(u as any)}
          onCancel={handleCancelUnitForm}
        />
      )}

      {showAssetUpload && (
        <AssetUploadForm
          projectId={project.id}
          onClose={() => setShowAssetUpload(false)}
          onUpload={handleAssetUpload}
        />
      )}

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