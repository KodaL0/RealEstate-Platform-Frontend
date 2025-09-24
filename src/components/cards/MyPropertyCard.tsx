import React from 'react';
import { Edit, Trash2, Eye, EyeOff, Calendar, Clock } from 'lucide-react';
import PropertyCard from './PropertyCard';

interface MyPropertyCardProps {
  property: any; // Flexible type to handle different property interfaces
  onEdit: (id: string | number) => void;
  onRemove: (id: string | number) => void;
  onPublish: (id: string | number) => void;
  onUnpublish: (id: string | number) => void;
  onNavigate: (id: string | number) => void;
}

const MyPropertyCard: React.FC<MyPropertyCardProps> = ({
  property,
  onEdit,
  onRemove,
  onPublish,
  onUnpublish,
  onNavigate
}) => {
  const {
    id,
    property_status,
    is_published,
    created_at
  } = property;

  // Convert MyListings property to PropertyCard format
  const propertyCardData = {
    ...property,
    // Ensure required fields for PropertyCard
    country: property.country || 'Unknown',
    listing_type: property.property_status,
    forSale: property.property_status === 'for_sale',
    is_favourite: false, // Not relevant for own listings
  };

  // Enhanced badges overlay for MyListings
  const renderMyListingsBadges = () => (
    <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
      {/* Publication Status Badge - Enhanced */}
      <div className="flex items-center space-x-1">
        <span
          className={`
            px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm
            flex items-center space-x-1.5 border-2
            ${is_published 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-300/50' 
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-300/50'
            }
          `}
        >
          <div className={`w-2 h-2 rounded-full ${is_published ? 'bg-emerald-200' : 'bg-red-200'}`}></div>
          <span>{is_published ? 'Live' : 'Draft'}</span>
        </span>
      </div>
      
      {/* Property Status Badge */}
      {property_status === 'draft' && (
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg backdrop-blur-sm border-2 border-amber-300/50 flex items-center space-x-1.5">
          <Clock className="w-3 h-3" />
          <span>In Progress</span>
        </span>
      )}
    </div>
  );

  // Enhanced Management Actions Section
  const renderActionsSection = () => (
    <div className="bg-white border-t border-gray-200 rounded-b-2xl overflow-hidden">
      {/* Enhanced Header with Better Typography */}
      <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm"></div>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Property Management
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                Listed {new Date(created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons Section */}
      <div className="p-6 bg-gradient-to-b from-white to-gray-50/50">
        {/* Primary Actions Row - Enhanced Design */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(id);
            }}
            className="group flex items-center justify-center px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-blue-500/20"
          >
            <Edit className="h-4 w-4 mr-2.5 group-hover:scale-110 transition-transform duration-200" />
            <span>Edit Property</span>
          </button>
          
          {is_published ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnpublish(id);
              }}
              className="group flex items-center justify-center px-5 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-orange-400/20"
            >
              <EyeOff className="h-4 w-4 mr-2.5 group-hover:scale-110 transition-transform duration-200" />
              <span>Unpublish</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPublish(id);
              }}
              className="group flex items-center justify-center px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-emerald-500/20"
            >
              <Eye className="h-4 w-4 mr-2.5 group-hover:scale-110 transition-transform duration-200" />
              <span>Publish Now</span>
            </button>
          )}
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className={`
            flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-medium
            ${is_published 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
            }
          `}>
            <div className={`w-2 h-2 rounded-full ${is_published ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
            <span>
              {is_published ? 'Currently visible to buyers' : 'Hidden from public view'}
            </span>
          </div>
        </div>
        
        {/* Danger Action - Enhanced Design */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="group w-full flex items-center justify-center px-5 py-3 bg-gradient-to-r from-red-50 to-red-50 hover:from-red-100 hover:to-red-100 text-red-700 hover:text-red-800 border-2 border-red-200 hover:border-red-300 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-md"
        >
          <Trash2 className="h-4 w-4 mr-2.5 group-hover:scale-110 transition-transform duration-200" />
          <span>Remove Listing</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 ease-out border border-gray-100 hover:border-gray-200 hover:-translate-y-1">
      {/* PropertyCard without favorite button */}
      <div 
        className="flex-1 cursor-pointer relative overflow-hidden"
        onClick={() => onNavigate(id)}
      >
        <PropertyCard 
          property={propertyCardData}
          onUnlikeSuccess={() => {}} // Not needed for own listings
          showFavoriteButton={false} // Hide favorite button for own listings - badges will replace it
        />
        
        {/* Overlay MyListings-specific badges */}
        {renderMyListingsBadges()}
        
        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 pointer-events-none" />
      </div>
      
      {/* Enhanced Management Actions Section */}
      {renderActionsSection()}
    </div>
  );
};

export default MyPropertyCard;