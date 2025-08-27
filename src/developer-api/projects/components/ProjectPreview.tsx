import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText, 
  Image, 
  Video,
  Star,
  Crown,
  Globe,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';

interface ProjectPreviewProps {
  project: {
    id: number;
    name: string;
    description?: string;
    location?: string;
    country?: string;
    status?: string;
    start_date?: string;
    completion_date?: string;
    total_units?: number;
    available_units?: number;
    price_min?: number;
    price_max?: number;
    currency?: string;
    property_types?: string[];
    amenities?: string[];
    features?: string[];
    main_image?: string;
    latitude?: number;
    longitude?: number;
    created_at?: string;
    updated_at?: string;
  };
  stats: {
    units: number;
    assets: number;
    photos: number;
  };
  onEdit?: () => void;
  onViewChange?: (view: string) => void;
}

export default function ProjectPreview({ 
  project, 
  stats, 
  onEdit, 
  onViewChange 
}: ProjectPreviewProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'planning':
        return 'bg-blue-500/90 text-white border-blue-600';
      case 'construction':
        return 'bg-orange-500/90 text-white border-orange-600';
      case 'completed':
        return 'bg-green-500/90 text-white border-green-600';
      case 'available':
        return 'bg-purple-500/90 text-white border-purple-600';
      default:
        return 'bg-gray-500/90 text-white border-gray-600';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getProgressPercentage = () => {
    if (!project.start_date || !project.completion_date) return 0;
    
    const start = new Date(project.start_date).getTime();
    const completion = new Date(project.completion_date).getTime();
    const now = new Date().getTime();
    
    if (now <= start) return 0;
    if (now >= completion) return 100;
    
    return Math.round(((now - start) / (completion - start)) * 100);
  };

  return (
    <div className="w-full max-w-none space-y-8">
      {/* Hero Section */}
      <div className="relative bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
        {/* Hero Image */}
        <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-slate-900 to-slate-700">
          {project.main_image ? (
            <img 
              src={project.main_image} 
              alt={project.name}
              className="w-full h-full object-cover opacity-80"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center ${project.main_image ? 'hidden' : ''}`}>
            <Building className="w-24 h-24 text-white/60" />
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
          
          {/* Status Badge */}
          {project.status && (
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
              <span className={`px-4 py-2 text-sm font-semibold rounded-full backdrop-blur-sm ${getStatusBadgeStyle(project.status)}`}>
                {project.status}
              </span>
            </div>
          )}
          
          {/* Project Title */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {project.name}
            </h1>
            
            {project.location && (
              <div className="flex items-center text-white/90 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <span className="text-lg font-medium drop-shadow">{project.location}</span>
                {project.country && (
                  <span className="text-white/70 ml-2">• {project.country}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
                             { 
                 label: 'Total Units', 
                 value: stats.units, 
                 icon: Building, 
                 color: 'from-blue-500 to-indigo-500',
                 action: () => onViewChange ? onViewChange('units') : undefined
               },
                             { 
                 label: 'Available Units', 
                 value: project.available_units || 0, 
                 icon: Users, 
                 color: 'from-emerald-500 to-teal-500',
                 action: () => onViewChange ? onViewChange('units') : undefined
               },
               { 
                 label: 'Assets', 
                 value: stats.assets, 
                 icon: FileText, 
                 color: 'from-violet-500 to-purple-500',
                 action: () => onViewChange ? onViewChange('assets') : undefined
               },
               { 
                 label: 'Photos', 
                 value: stats.photos, 
                 icon: Image, 
                 color: 'from-pink-500 to-rose-500',
                 action: () => onViewChange ? onViewChange('photos') : undefined
               }
            ].map((stat, index) => (
              <button
                key={index}
                onClick={stat.action}
                className="text-center group cursor-pointer transition-all duration-300 hover:scale-105"
              >
                <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200/50 group-hover:shadow-xl group-hover:shadow-slate-300/50 transition-all duration-300`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-600">{stat.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Project Description</h3>
            </div>
            
            {project.description ? (
              <div className="space-y-4">
                <p className={`text-slate-700 leading-relaxed ${!showFullDescription && project.description.length > 200 ? 'line-clamp-3' : ''}`}>
                  {project.description}
                </p>
                {project.description.length > 200 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    {showFullDescription ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No description available</p>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add description
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Timeline & Progress Card */}
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Project Timeline</h3>
            </div>
            
            <div className="space-y-6">
              {/* Progress Bar */}
              {project.start_date && project.completion_date && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Progress</span>
                    <span>{getProgressPercentage()}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Date Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.start_date && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center text-emerald-600 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm font-semibold uppercase tracking-wide">Start Date</span>
                    </div>
                    <p className="text-slate-700 font-medium">{formatDate(project.start_date)}</p>
                  </div>
                )}
                
                {project.completion_date && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center text-amber-600 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm font-semibold uppercase tracking-wide">Completion Date</span>
                    </div>
                    <p className="text-slate-700 font-medium">{formatDate(project.completion_date)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features & Amenities */}
          {(project.property_types?.length || project.amenities?.length || project.features?.length) && (
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Features & Amenities</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Property Types */}
                {project.property_types?.length && (
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-3">Property Types</h4>
                    <div className="space-y-2">
                      {project.property_types.map((type, index) => (
                        <div key={index} className="flex items-center text-slate-600">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                          {type}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Amenities */}
                {project.amenities?.length && (
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-3">Amenities</h4>
                    <div className="space-y-2">
                      {project.amenities.slice(0, 6).map((amenity, index) => (
                        <div key={index} className="flex items-center text-slate-600">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                          {amenity}
                        </div>
                      ))}
                      {project.amenities.length > 6 && (
                        <div className="text-slate-500 text-sm">
                          +{project.amenities.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Features */}
                {project.features?.length && (
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-3">Features</h4>
                    <div className="space-y-2">
                      {project.features.slice(0, 6).map((feature, index) => (
                        <div key={index} className="flex items-center text-slate-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          {feature}
                        </div>
                      ))}
                      {project.features.length > 6 && (
                        <div className="text-slate-500 text-sm">
                          +{project.features.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          {(project.price_min || project.price_max) && (
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-3">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Pricing</h3>
              </div>
              
              <div className="space-y-3">
                {project.price_min && project.price_max ? (
                  <div>
                    <div className="text-2xl font-bold text-slate-800">
                      {formatPrice(project.price_min, project.currency)} - {formatPrice(project.price_max, project.currency)}
                    </div>
                    <p className="text-slate-600 text-sm">Price range</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-slate-800">
                      {project.price_min ? formatPrice(project.price_min, project.currency) : formatPrice(project.price_max!, project.currency)}
                    </div>
                    <p className="text-slate-600 text-sm">
                      {project.price_min ? 'Starting from' : 'Up to'}
                    </p>
                  </div>
                )}
                
                <div className="text-sm text-slate-500">
                  Currency: {project.currency || 'EUR'}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
                             <button
                 onClick={() => onViewChange ? onViewChange('units') : undefined}
                 className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
               >
                <div className="flex items-center">
                  <Building className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-medium text-slate-700">Manage Units</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </button>
              
                             <button
                 onClick={() => onViewChange ? onViewChange('photos') : undefined}
                 className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors group"
               >
                <div className="flex items-center">
                  <Image className="w-5 h-5 text-emerald-600 mr-3" />
                  <span className="font-medium text-slate-700">View Photos</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>
              
                             <button
                 onClick={() => onViewChange ? onViewChange('assets') : undefined}
                 className="w-full flex items-center justify-between p-3 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors group"
               >
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-violet-600 mr-3" />
                  <span className="font-medium text-slate-700">Manage Assets</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-violet-600" />
              </button>
              
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="w-full flex items-center justify-between p-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors group"
                >
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-amber-600 mr-3" />
                    <span className="font-medium text-slate-700">Edit Project</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                </button>
              )}
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Project Information</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-slate-600">
                <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                <span>Created: {formatDate(project.created_at)}</span>
              </div>
              
              <div className="flex items-center text-slate-600">
                <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                <span>Updated: {formatDate(project.updated_at)}</span>
              </div>
              
              {project.latitude && project.longitude && (
                <div className="flex items-center text-slate-600">
                  <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                  <span>Coordinates: {project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
