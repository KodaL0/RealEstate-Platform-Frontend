import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, featured = false }) => {
  // Destructure the needed fields
  const {
    id,
    title,
    price,
    address,
    bedrooms,
    bathrooms,
    area,
    property_images,
    type,
    forSale
  } = property;

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${
        featured ? 'col-span-2' : ''
      }`}
    >
      <div className="relative">
        {/* Image with no title in top-left (only badges) */}
        <Link to={`/property/${id}`}>
          <img
            src={property_images}
            alt=""  // alt is empty so no text appears behind the badges
            className={`w-full object-cover ${featured ? 'h-80' : 'h-64'}`}
          />
        </Link>

        {/* Badges in top-left */}
        <div className="absolute top-4 left-4 flex space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              forSale ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
            }`}
          >
            {forSale ? 'For Sale' : 'For Rent'}
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-900/70 text-white text-xs font-semibold">
            {type}
          </span>
        </div>

        {/* Favorite button in top-right */}
        <button className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors">
          <Heart className="h-5 w-5 text-gray-600 hover:text-red-500 transition-colors" />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Title & Price Row */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 hover:text-emerald-600 transition-colors">
            <Link to={`/property/${id}`}>{title}</Link>
          </h3>
          <p className="text-lg font-bold text-emerald-600">
            {forSale ? `$${price.toLocaleString()}` : `$${price.toLocaleString()}/mo`}
          </p>
        </div>

        {/* Address & Edit Listing Button */}
        <div className="flex justify-between items-center text-gray-500 mb-4">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{address}</span>
          </div>
          {/* EDIT LISTING BUTTON
              Adjust the path below to match your actual edit route.
              For example: /edit-listing/:id or /create-listing?edit=... */}
          <Link
            to={`/create-listing/${id}`}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Edit Listing
          </Link>
        </div>

        {/* Beds, Baths, Area */}
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center text-gray-700">
            <Bed className="h-5 w-5 mr-2 text-gray-500" />
            <span>
              {bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}
            </span>
          </div>
          <div className="flex items-center text-gray-700">
            <Bath className="h-5 w-5 mr-2 text-gray-500" />
            <span>
              {bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}
            </span>
          </div>
          <div className="flex items-center text-gray-700">
            <Square className="h-5 w-5 mr-2 text-gray-500" />
            <span>{area.toLocaleString()} sq ft</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
