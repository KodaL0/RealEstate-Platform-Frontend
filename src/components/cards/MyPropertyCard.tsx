import React from 'react';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
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

  // Custom badges overlay for MyListings
  const renderMyListingsBadges = () => (
    <div className="absolute top-4 left-4 flex flex-col space-y-2 z-20">
      {/* Publication Status Badge */}
      <span
        className={`
          px-3 py-1 rounded-full text-xs font-semibold shadow-md
          ${is_published ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
        `}
      >
        {is_published ? 'Published' : 'Unpublished'}
      </span>
      
      {/* Draft Status Badge */}
      {property_status === 'draft' && (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-300 text-gray-700 shadow-md">
          Draft
        </span>
      )}
    </div>
  );

  // Management Actions Tab - Clean Design
  const renderActionsTab = () => (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 rounded-b-xl">
      {/* Clean Header */}
      <div className="px-4 py-3 bg-white/80 backdrop-blur-sm rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Listed {new Date(created_at).toLocaleDateString()}
            </span>
          </div>
          
        </div>
      </div>

      {/* Clean Action Buttons */}
      <div className="p-4 space-y-3">
        {/* Primary Actions Row */}
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(id);
            }}
            className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          
          {is_published ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnpublish(id);
              }}
              className="flex-1 flex items-center justify-center px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Unpublish
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPublish(id);
              }}
              className="flex-1 flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </button>
          )}
        </div>
        
        {/* Danger Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="w-full flex items-center justify-center px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg font-medium text-sm transition-all duration-200"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Listing
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* PropertyCard without favorite button */}
      <div 
        className="flex-1 cursor-pointer"
        onClick={() => onNavigate(id)}
      >
        <PropertyCard 
          property={propertyCardData}
          onUnlikeSuccess={() => {}} // Not needed for own listings
          showFavoriteButton={false} // Hide favorite button for own listings
        />
        
        {/* Overlay MyListings-specific badges */}
        {renderMyListingsBadges()}
      </div>
      
      {/* Management Actions Tab - Always Visible */}
      {renderActionsTab()}
    </div>
  );
};

export default MyPropertyCard;
