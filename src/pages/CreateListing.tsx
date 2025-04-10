import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { 
  Home, 
  DollarSign, 
  MapPin, 
  Building2, 
  Bed, 
  Bath, 
  DotSquare as SquareFootage, 
  Upload,
  X,
  Loader2
} from 'lucide-react';

import { apiClient } from ../middleware/auth


// Define the ListingForm interface
interface ListingForm {
  title: string;
  description: string;
  price: string;
  location: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  images: File[];
  amenities: string[];
  yearBuilt: string;
  parkingSpaces: string;
  lotSize: string;
  propertyStatus: string;
  energyRating: string;
  constructionMaterial: string;
  floorLevel: string;
  totalFloors: string;
  availableFrom: string;
  contactPhone: string;
  contactEmail: string;
  virtualTourUrl?: string;
  videoUrl?: string;
  additionalFeatures: string[];
}

// Lists for select options and checkboxes
const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'penthouse', label: 'Penthouse' }
];

const PROPERTY_STATUS = [
  { value: 'forSale', label: 'For Sale' },
  { value: 'forRent', label: 'For Rent' },
  { value: 'newConstruction', label: 'New Construction' },
  { value: 'foreclosure', label: 'Foreclosure' }
];

const AMENITIES = [
  { id: 'parking', label: 'Parking', category: 'Exterior' },
  { id: 'pool', label: 'Swimming Pool', category: 'Exterior' },
  { id: 'gym', label: 'Gym', category: 'Community' },
  { id: 'security', label: 'Security System', category: 'Safety' },
  { id: 'ac', label: 'Air Conditioning', category: 'Climate' },
  { id: 'heating', label: 'Central Heating', category: 'Climate' },
  { id: 'laundry', label: 'Laundry Facilities', category: 'Interior' },
  { id: 'pets', label: 'Pet Friendly', category: 'Policy' },
  { id: 'furnished', label: 'Furnished', category: 'Interior' },
  { id: 'balcony', label: 'Balcony', category: 'Exterior' },
  { id: 'storage', label: 'Storage Space', category: 'Interior' },
  { id: 'wifi', label: 'High-Speed Internet', category: 'Utilities' },
  { id: 'dishwasher', label: 'Dishwasher', category: 'Appliances' },
  { id: 'elevator', label: 'Elevator', category: 'Building' },
  { id: 'fireplace', label: 'Fireplace', category: 'Interior' },
  { id: 'garden', label: 'Garden', category: 'Exterior' },
  { id: 'roofDeck', label: 'Roof Deck', category: 'Exterior' },
  { id: 'doorman', label: 'Doorman', category: 'Security' },
  { id: 'garage', label: 'Garage', category: 'Parking' },
  { id: 'waterfront', label: 'Waterfront', category: 'Location' }
];

const ADDITIONAL_FEATURES = [
  { id: 'smartHome', label: 'Smart Home Technology' },
  { id: 'solarPanels', label: 'Solar Panels' },
  { id: 'rainwaterHarvesting', label: 'Rainwater Harvesting' },
  { id: 'evCharging', label: 'EV Charging Station' },
  { id: 'soundproofing', label: 'Soundproofing' },
  { id: 'homeTheater', label: 'Home Theater' },
  { id: 'wineRoom', label: 'Wine Room' },
  { id: 'motherInLaw', label: 'Mother-in-law Suite' }
];

const CreateListing = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<ListingForm>({
    title: '',
    description: '',
    price: '',
    location: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    images: [],
    amenities: [],
    yearBuilt: '',
    parkingSpaces: '',
    lotSize: '',
    propertyStatus: '',
    energyRating: '',
    constructionMaterial: '',
    floorLevel: '',
    totalFloors: '',
    availableFrom: '',
    contactPhone: '',
    contactEmail: '',
    virtualTourUrl: '',
    videoUrl: '',
    additionalFeatures: []
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...acceptedFiles]
    }));

    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 10,
    maxSize: 5242880
  });

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (id: string, type: 'amenities' | 'additionalFeatures') => {
    setFormData(prev => {
      const currentArray = prev[type];
      const updatedArray = currentArray.includes(id)
        ? currentArray.filter(item => item !== id)
        : [...currentArray, id];
      
      return {
        ...prev,
        [type]: updatedArray
      };
    });
  };

  const validateForm = (): boolean => {
    if (!formData.images.length) {
      toast.error('Please upload at least one image');
      return false;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return false;
    }

    if (!formData.contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!formData.contactPhone.match(/^\+?[\d\s-]{10,}$/)) {
      toast.error('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') {
          value.forEach((file: File) => {
            formDataToSend.append('images[]', file);
          });
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            formDataToSend.append(`${key}[]`, item);
          });
        } else if (value) {
          formDataToSend.append(key, value);
        }
      });

      // Use apiClient here instead of axios.post
      const response = await apiClient.post(
        '/api/properties/create_property/',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Adjust status check if your backend returns 200, 201, or both
      if (response.status === 200 || response.status === 201) {
        toast.success('Listing created successfully!');
        navigate('/my-listings');
      } else {
        console.warn('Unexpected status code:', response.status);
      }
    } catch (error: any) {
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err.response?.data?.error || 'An error occurred while creating the listing';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Home className="mr-3 h-8 w-8" />
              Create New Property Listing
            </h1>
            <p className="text-blue-100 mt-2">Fill in the details below to list your property</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-8 my-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Basic Information</h2>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., Luxurious Waterfront Penthouse"
                  />
                </div>
                
                <div>
                  <label htmlFor="propertyStatus" className="block text-sm font-medium text-gray-700 mb-1">
                    Listing Type
                  </label>
                  <select
                    id="propertyStatus"
                    name="propertyStatus"
                    value={formData.propertyStatus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select status</option>
                    {PROPERTY_STATUS.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      step="0.01"
                      placeholder="Enter price"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Full address"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select type</option>
                      {PROPERTY_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      id="bedrooms"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      placeholder="Number of bedrooms"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <div className="relative">
                    <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      id="bathrooms"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      step="0.5"
                      placeholder="Number of bathrooms"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                    Living Area (sq ft)
                  </label>
                  <div className="relative">
                    <SquareFootage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      id="area"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      placeholder="Square footage"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700 mb-1">
                    Year Built
                  </label>
                  <input
                    type="number"
                    id="yearBuilt"
                    name="yearBuilt"
                    value={formData.yearBuilt}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1800"
                    max={new Date().getFullYear()}
                    placeholder="Year of construction"
                  />
                </div>

                <div>
                  <label htmlFor="lotSize" className="block text-sm font-medium text-gray-700 mb-1">
                    Lot Size (sq ft)
                  </label>
                  <input
                    type="number"
                    id="lotSize"
                    name="lotSize"
                    value={formData.lotSize}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    placeholder="Total lot size"
                  />
                </div>
              </div>
            </section>

            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Property Images</h2>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag & drop images here, or click to select files
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 10 images, up to 5MB each. Supported formats: JPG, PNG, WebP
                </p>
              </div>

              {previewImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewImages.map((preview, index) => (
                    <div key={preview} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-24 w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AMENITIES.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={amenity.id}
                      checked={formData.amenities.includes(amenity.id)}
                      onChange={() => handleCheckboxChange(amenity.id, 'amenities')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={amenity.id} className="text-sm text-gray-700">
                      {amenity.label}
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Additional Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ADDITIONAL_FEATURES.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={feature.id}
                      checked={formData.additionalFeatures.includes(feature.id)}
                      onChange={() => handleCheckboxChange(feature.id, 'additionalFeatures')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={feature.id} className="text-sm text-gray-700">
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Description</h2>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="Provide a detailed description of the property..."
              />
            </section>

            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Your email address"
                  />
                </div>
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Your phone number"
                  />
                </div>
              </div>
            </section>

            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Virtual Tour & Video</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="virtualTourUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Virtual Tour URL (optional)
                  </label>
                  <input
                    type="url"
                    id="virtualTourUrl"
                    name="virtualTourUrl"
                    value={formData.virtualTourUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Matterport or similar virtual tour link"
                  />
                </div>
                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Video URL (optional)
                  </label>
                  <input
                    type="url"
                    id="videoUrl"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., YouTube or Vimeo video link"
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  flex items-center px-8 py-4 rounded-xl text-white font-semibold text-lg
                  ${isSubmitting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
                  transition-colors duration-200 shadow-lg
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
                    Creating Listing...
                  </>
                ) : (
                  'Create Listing'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;
