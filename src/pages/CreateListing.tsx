import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

import { apiClient } from '../middleware/auth';

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
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  // Separate state for loading listing data
  const [loadingListing, setLoadingListing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  // State for primary image selection
  const [primaryIndex, setPrimaryIndex] = useState<number>(0);
  // State to store current user's username
  const [username, setUsername] = useState<string>('');
  // Add a loading state for username
  const [loadingUsername, setLoadingUsername] = useState<boolean>(true);
  // Form data state
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

  // Add a new useEffect to fetch the current user profile
  useEffect(() => {
    setLoadingUsername(true);
    apiClient.get('/users/get_user')
      .then(response => {
        console.log("Fetched current user data:", response.data);
        if (response.data && response.data.user && response.data.user.username) {
          console.log("Setting username to:", response.data.user.username);
          setUsername(response.data.user.username);
        } else {
          console.warn("Username not found in user data:", response.data);
          toast.error("Username not found in profile data");
        }
      })
      .catch(error => {
        console.error("Error fetching user profile:", error);
        // Show error toast for username fetch failure
        toast.error("Failed to fetch user profile. Please try again.");
      })
      .finally(() => {
        setLoadingUsername(false);
      });
  }, []);

  // Function to fetch username on demand
  const fetchUsernameOnDemand = async (): Promise<string> => {
    try {
      const response = await apiClient.get('/users/get_user');
      if (response.data && response.data.user && response.data.user.username) {
        setUsername(response.data.user.username);
        return response.data.user.username;
      }
      throw new Error('Username not found in response');
    } catch (error) {
      console.error('Failed to fetch username on demand:', error);
      throw error;
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log("Files dropped:", acceptedFiles);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...acceptedFiles]
    }));
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 10,
    maxSize: 5242880
  });

  const removeImage = (index: number) => {
    console.log("Removing image at index:", index);
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    if (index === primaryIndex) {
      setPrimaryIndex(0);
    } else if (index < primaryIndex) {
      setPrimaryIndex(prev => prev - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (id: string, type: 'amenities' | 'additionalFeatures') => {
    console.log(`Checkbox toggled: ${id} in ${type}`);
    setFormData(prev => {
      const currentArray = prev[type];
      const updatedArray = currentArray.includes(id)
        ? currentArray.filter(item => item !== id)
        : [...currentArray, id];
      return { ...prev, [type]: updatedArray };
    });
  };

  const validateForm = (): boolean => {
    console.log("Validating form...", formData);
    
    // For new listings, require at least one image
    // For edits, allow if there are already preview images
    if (!formData.images.length && !previewImages.length) {
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

  // Use direct edit endpoint instead of username-based path
  const getEditEndpoint = (propId: string) => {
    return `/properties/property/${propId}/edit/`;
  };

  // Fetch listing data if in edit mode.
  useEffect(() => {
    if (isEditing && id) {
      setLoadingListing(true);
      console.log("Edit mode enabled. Fetching listing with id:", id);
      apiClient.get(`/properties/${id}`)
        .then(response => {
          const data = response.data;
          console.log("Fetched listing for edit:", data);
          // Process array fields to handle both object format and string format
          const processArrayField = (field: any, lookupTable: Array<{id: string, label: string}> = []) => {
            if (!field) return [];
            if (!Array.isArray(field)) return [];
            
            const results: string[] = [];
            
            field.forEach(item => {
              // If it's an object with an id property, return the id
              if (typeof item === 'object' && item !== null && item.id) {
                if (!results.includes(item.id)) {
                  results.push(item.id);
                }
              }
              // If it's a string that matches a label in the lookup table, convert to id
              else if (typeof item === 'string') {
                const found = lookupTable.find(lookup => lookup.label === item);
                if (found && !results.includes(found.id)) {
                  results.push(found.id);
                } 
                // If it's already in id format but not found yet
                else if (!found && !results.includes(item)) {
                  // Check if it matches an ID in the lookup table
                  const matchesId = lookupTable.some(lookup => lookup.id === item);
                  if (matchesId) {
                    results.push(item);
                  }
                }
              }
            });
            
            return results;
          };
          setFormData({
            title: data.title || '',
            description: data.description || '',
            price: data.price || '',
            location: data.location || '',
            propertyType: data.property_type || '',
            bedrooms: data.bedrooms?.toString() || '',
            bathrooms: data.bathrooms?.toString() || '',
            area: data.area?.toString() || '',
            images: [], // Keep empty for new uploads
            amenities: processArrayField(data.amenities, AMENITIES),
            yearBuilt: data.year_built?.toString() || '',
            parkingSpaces: data.parking_spaces?.toString() || '',
            lotSize: data.lot_size || '',
            propertyStatus: data.property_status || '',
            energyRating: data.energy_rating || '',
            constructionMaterial: data.construction_material || '',
            floorLevel: data.floor_level || '',
            totalFloors: data.total_floors || '',
            availableFrom: data.available_from || '',
            contactPhone: data.contact_phone || '',
            contactEmail: data.contact_email || '',
            virtualTourUrl: data.virtual_tour_url || '',
            videoUrl: data.video_url || '',
            additionalFeatures: processArrayField(data.additional_features, ADDITIONAL_FEATURES)
          });
          // Handle existing images
          if (data.images && Array.isArray(data.images)) {
            console.log("Setting existing images for preview:", data.images);
            // Extract image URLs from image objects if necessary
            const imageUrls = data.images.map(img => {
              // If image is an object with an image property that is a URL string
              if (typeof img === 'object' && img !== null) {
                // Check for common image URL properties
                if (img.url) return img.url;
                if (img.image) return typeof img.image === 'string' ? img.image : img.image.url;
                if (img.src) return img.src;
                
                // If no recognized property, try to find a string property that looks like a URL
                const possibleUrlProps = Object.entries(img)
                  .find(([_, val]) => typeof val === 'string' && (val.startsWith('http') || val.startsWith('/')));
                
                if (possibleUrlProps) return possibleUrlProps[1];
              }
              
              // If it's already a string or we couldn't find a URL property, return as is
              return img;
            });
            
            setPreviewImages(imageUrls);

            // Find the primary image if one is marked
            const primaryImageIndex = data.images.findIndex(img => 
              img && typeof img === 'object' && img.is_primary === true
            );
            
            if (primaryImageIndex >= 0) {
              setPrimaryIndex(primaryImageIndex);
            } else {
              setPrimaryIndex(0);
            }
          }
        })
        .catch(error => {
          console.error("Error fetching listing for edit:", error);
          toast.error("Could not load listing data for editing");
        })
        .finally(() => setLoadingListing(false));
    }
  }, [isEditing, id]);

  // Show loading message if edit data is being fetched.
  if (isEditing && loadingListing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading listing data...</p>
      </div>
    );
  }

  // Also show loading if username is being fetched
  if (isEditing && loadingUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading user data...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit fired, current username:", username);
    
    // Check if username is available when editing
    if (isEditing && !username) {
      console.error("Username is missing during form submission for editing");
      toast.error('User profile data is not available. Please refresh and try again.');
      try {
        // Try to fetch username one more time
        await fetchUsernameOnDemand();
      } catch (error) {
        return; // Exit if we still can't get username
      }
    }
    
    if (!validateForm()) {
      console.log("Validation failed.");
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add image handling flags for edit mode
      if (isEditing) {
        // If editing and we have new images, tell the backend to replace the existing ones
        if (formData.images.length > 0) {
          formDataToSend.append('replace_images', 'true');
          
          // Option A: Reorder images so the primary image is first.
          const rearrangedImages = [
            formData.images[primaryIndex],
            ...formData.images.filter((_, idx) => idx !== primaryIndex)
          ];
          rearrangedImages.forEach(file => {
            formDataToSend.append('images[]', file);
          });
          
          // Also send primary index explicitly
          formDataToSend.append('primary_image_index', '0'); // Always 0 since we rearranged
        } else if (previewImages.length > 0) {
          // No new uploads but we've reordered existing images
          formDataToSend.append('reorder_images', 'true');
          formDataToSend.append('primary_image_index', primaryIndex.toString());
          
          // Extract image identifiers from the preview URLs to send to the backend
          previewImages.forEach((url, index) => {
            // Try to extract an ID from the URL - look for patterns like '/12345/' or '_12345.'
            let imageId = '';
            
            // First try extracting using typical URL path patterns
            const idMatch = url.match(/\/(\d+)\/|\/image\/(\d+)|[_-](\d+)\./);
            if (idMatch) {
              // Find the first non-undefined capturing group
              imageId = idMatch.slice(1).find(group => group !== undefined) || '';
            }
            
            if (!imageId) {
              // If no ID extracted, use the last path segment or full URL as fallback
              imageId = url.split('/').pop() || url;
            }
            
            formDataToSend.append('image_order[]', imageId);
            
            // Mark primary image explicitly
            if (index === primaryIndex) {
              formDataToSend.append('primary_image_id', imageId);
            }
          });
        }
      } else {
        // For new listings
        if (formData.images.length) {
          const rearrangedImages = [
            formData.images[primaryIndex],
            ...formData.images.filter((_, idx) => idx !== primaryIndex)
          ];
          rearrangedImages.forEach(file => {
            formDataToSend.append('images[]', file);
          });
        }
      }
      
      // Append other form fields.
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'images') {
          if (Array.isArray(value)) {
            (value as string[]).forEach(item => {
              formDataToSend.append(`${key}[]`, item);
            });
          } else if (value) {
            formDataToSend.append(key, value);
          }
        }
      });
      
      // Use the backend endpoint for edit listings.
      const endpoint = isEditing 
        ? username 
          ? `/properties/${username}/property/${id}/edit/`
          : `/properties/property/${id}/edit/` // Fallback if username is empty
        : '/properties/create_property/';
      
      console.log("Sending property request to:", endpoint);
      const response = await apiClient[isEditing ? 'put' : 'post'](endpoint, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log("Response received:", response);
      if (response.status === 200 || response.status === 201) {
        toast.success(isEditing ? 'Listing updated successfully!' : 'Listing created successfully!');
        navigate('/my-listings');
      } else {
        console.warn('Unexpected status code:', response.status);
      }
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err.response?.data?.error || 'An error occurred while processing the listing';
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
              {isEditing ? 'Edit Property Listing' : 'Create New Property Listing'}
            </h1>
            <p className="text-blue-100 mt-2">
              {isEditing 
                ? 'Update the details below to modify your property listing'
                : 'Fill in the details below to list your property'}
            </p>
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
            {/* Basic Information Section */}
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
  
            {/* Property Details Section */}
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
  
            {/* Property Images Section */}
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
                        className={`h-24 w-full object-cover rounded-lg ${index === primaryIndex ? 'border-4 border-blue-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPrimaryIndex(index);
                          console.log("Set primary index:", index);
                        }}
                        className="absolute bottom-1 left-1 bg-blue-500 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        Set as Primary
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
  
            {/* Amenities Section */}
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
  
            {/* Additional Features Section */}
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
  
            {/* Description Section */}
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
  
            {/* Contact Information Section */}
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
  
            {/* Virtual Tour & Video Section */}
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
                  ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
                  transition-colors duration-200 shadow-lg
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
                    {isEditing ? 'Updating Listing...' : 'Creating Listing...'}
                  </>
                ) : (
                  isEditing ? 'Update Listing' : 'Create Listing'
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
