import React from 'react';
import { MapPin, Bed, Bath, Square, Building2, Calendar, Phone } from 'lucide-react';
import { Property } from '../types';

interface DeveloperPropertyCardProps {
  property: Property;
  viewMode: 'grid' | 'list';
}

const DeveloperPropertyCard: React.FC<DeveloperPropertyCardProps> = ({ 
  property, 
  viewMode 
}) => {
  const handleContactClick = () => {
    // Handle contact developer logic here
    console.log('Contact developer for property:', property.id);
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/3 relative">
            <img
              src={property.images?.[0] || 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg'}
              alt={property.title}
              className="w-full h-64 lg:h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                New Development
              </span>
            </div>
            <div className="absolute top-3 right-3">
              <span className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                3D Render
              </span>
            </div>
          </div>
          
          <div className="lg:w-2/3 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {property.title}
                </h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Building2 className="h-4 w-4 mr-1" />
                  <span>Developer</span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600 mb-3">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{property.location}</span>
              </div>

              <div className="flex items-center space-x-6 mb-4 text-sm text-gray-600">
                {property.bedrooms && (
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    <span>{property.bedrooms} bed</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    <span>{property.bathrooms} bath</span>
                  </div>
                )}
                {property.area && (
                  <div className="flex items-center">
                    <Square className="h-4 w-4 mr-1" />
                    <span>{property.area}m²</span>
                  </div>
                )}
              </div>

              {property.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {property.description}
                </p>
              )}

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Completion: Q4 2024</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">Contact for Price</p>
                <p className="text-sm text-gray-500">Developer pricing available</p>
              </div>
              <button
                onClick={handleContactClick}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Developer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="relative">
        <img
          src={property.images?.[0] || 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg'}
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
            New Development
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
            3D Render
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {property.title}
          </h3>
          <div className="flex items-center text-xs text-gray-500 ml-2">
            <Building2 className="h-3 w-3 mr-1" />
            <span>Dev</span>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm truncate">{property.location}</span>
        </div>

        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
          {property.bedrooms && (
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.area && (
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1" />
              <span>{property.area}m²</span>
            </div>
          )}
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Completion: Q4 2024</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-900">Contact for Price</p>
            <p className="text-xs text-gray-500">Developer pricing</p>
          </div>
          <button
            onClick={handleContactClick}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Phone className="h-4 w-4 mr-1" />
            Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPropertyCard;