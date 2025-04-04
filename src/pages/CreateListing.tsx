import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ListingForm {
  title: string;
  description: string;
  price: string;
  location: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  images: FileList | null;
  amenities: string[];
}

// Define available amenities
const AVAILABLE_AMENITIES = [
  { id: 'parking', label: 'Parking' },
  { id: 'pool', label: 'Swimming Pool' },
  { id: 'gym', label: 'Gym' },
  { id: 'security', label: 'Security System' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'heating', label: 'Central Heating' },
  { id: 'laundry', label: 'Laundry Facilities' },
  { id: 'pets', label: 'Pet Friendly' },
  { id: 'furnished', label: 'Furnished' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'storage', label: 'Storage Space' },
  { id: 'wifi', label: 'High-Speed Internet' }
];

const CreateListing = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ListingForm>({
    title: '',
    description: '',
    price: '',
    location: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    images: null,
    amenities: []
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityChange = (amenityId: string) => {
    setFormData(prev => {
      const updatedAmenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId];
      
      return {
        ...prev,
        amenities: updatedAmenities
      };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        images: e.target.files
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
  
    try {
      const formDataToSend = new FormData();
  
      // Add regular fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images' && value) {
          Array.from(value as FileList).forEach((file) => {
            formDataToSend.append('images[]', file); // Ensure backend expects array
          });
        } else if (key === 'amenities' && Array.isArray(value)) {
          value.forEach((amenity) => {
            formDataToSend.append('amenities[]', amenity); // Send amenities as array items
          });
        } else if (key === 'propertyType' && value) {
          formDataToSend.append('property_type', value); // Make sure property_type is added
        } else {
          formDataToSend.append(key, value as string);
        }
      });
  
      const response = await axios.post(
        'https://propertprobackend.onrender.com/api/properties/create_property',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
  
      if (response.status === 201) {
        navigate('/my-listings');
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'An error occurred while creating the listing');
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Listing</h1>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select type</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </div>
            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                id="bathrooms"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                Area (sq ft)
              </label>
              <input
                type="number"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Amenities Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {AVAILABLE_AMENITIES.map((amenity) => (
                <div key={amenity.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={amenity.id}
                    checked={formData.amenities.includes(amenity.id)}
                    onChange={() => handleAmenityChange(amenity.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={amenity.id} className="ml-2 text-sm text-gray-700">
                    {amenity.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
              Images
            </label>
            <input
              type="file"
              id="images"
              name="images"
              onChange={handleImageChange}
              multiple
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${
                isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } text-white px-6 py-2 rounded-lg transition-colors flex items-center`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing; 
