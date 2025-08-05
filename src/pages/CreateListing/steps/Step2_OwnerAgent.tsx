import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  MapPin,
  Building2,
  Bed,
  Bath,
  DotSquare as SquareFootage,
  Euro,
  Home,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

import { useListingWizard } from '../../../context/ListingWizardContext';
import {
  ListingForm,
  PROPERTY_TYPES,
  PROPERTY_STATUS,
  AMENITIES,
  COUNTRY_OPTIONS,
} from '../../../types';

import LocationAutocomplete from '../../LocationAutocomplete';

interface Props {
  formData: ListingForm;
  onChange: (e: React.ChangeEvent<any>) => void;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  availableFromDate: Date | undefined;
  setAvailableFromDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  showCalendar: boolean;
  setShowCalendar: React.Dispatch<React.SetStateAction<boolean>>;
  setLocationCoords: (v: { lat: number; lng: number } | null) => void;
}

const Step2_OwnerAgent: React.FC<Props> = ({
  formData,
  onChange,
  setFormData,
  availableFromDate,
  setAvailableFromDate,
  showCalendar,
  setShowCalendar,
  setLocationCoords,
}) => {
  const { next, back } = useListingWizard();
  
  // Helper function to find amenity by ID
  const findAmenityById = (amenityId: string) => {
    // Clean the amenity ID (trim whitespace and convert to lowercase for comparison)
    const cleanAmenityId = amenityId.trim().toLowerCase();
    
    // First try to find in current AMENITIES (case-insensitive)
    let amenity = AMENITIES.find(a => a.id.toLowerCase() === cleanAmenityId);
    
    // If not found, check legacy mappings
    if (!amenity) {
      const legacyMappings: { [key: string]: string } = {
        // Common legacy amenity ID mappings
        'Attic': 'attic',
        'Pet Friendly': 'pets', 
        'High-Speed Internet': 'wifi',
        'Swimming Pool': 'swimming_pool', // Map to exterior swimming pool
        // Add more mappings as needed
      };
      
      const mappedId = legacyMappings[amenityId];
      if (mappedId) {
        amenity = AMENITIES.find(a => a.id === mappedId);
      }
    }
    
    return amenity;
  };
  
  // State for active amenities category
  const [activeCategory, setActiveCategory] = useState(() => {
    // If editing and there are selected amenities, find the category with the most selected amenities
    if (formData.amenities.length > 0) {
      const categoryCounts: { [key: string]: number } = {};
      
      // Count amenities by category
      formData.amenities.forEach(amenityId => {
        const amenity = AMENITIES.find(a => a.id === amenityId);
        if (amenity) {
          categoryCounts[amenity.category] = (categoryCounts[amenity.category] || 0) + 1;
        }
      });
      
      // Find the category with the most selected amenities
      const categoryKeys = Object.keys(categoryCounts);
      if (categoryKeys.length > 0) {
        const mostSelectedCategory = categoryKeys.reduce((a, b) => 
          categoryCounts[a] > categoryCounts[b] ? a : b
        );
        return mostSelectedCategory;
      }
    }
    
    const defaultCategory = AMENITIES[0]?.category || 'Building & Infrastructure';
    return defaultCategory;
  });

  const valid =
    formData.title.trim() &&
    formData.description.trim() &&
    Number(formData.price) > 0 &&
    formData.propertyType &&
    formData.propertyStatus &&
    formData.country &&
    formData.location.trim();

  const toggleAmenity = (id: string) =>
    setFormData((f: ListingForm) => {
      // Check if this amenity is already selected (using findAmenityById for proper matching)
      const isCurrentlySelected = f.amenities.some(amenityId => {
        const foundAmenity = findAmenityById(amenityId);
        return foundAmenity && foundAmenity.id === id;
      });
      
      if (isCurrentlySelected) {
        // Remove the amenity (remove all matching IDs)
        const updatedAmenities = f.amenities.filter(amenityId => {
          const foundAmenity = findAmenityById(amenityId);
          return !foundAmenity || foundAmenity.id !== id;
        });
        return { ...f, amenities: updatedAmenities };
      } else {
        // Add the amenity
        const updatedAmenities = [...f.amenities, id];
        return { ...f, amenities: updatedAmenities };
      }
    });

  const removeAmenity = (amenityIdToRemove: string) =>
    setFormData((f: ListingForm) => {
      // Remove the specific amenity ID from the array
      const updatedAmenities = f.amenities.filter(id => id !== amenityIdToRemove);
      
      return { ...f, amenities: updatedAmenities };
    });

  const handleDateSelect = React.useCallback((date: Date | undefined) => {
    try {
      if (date) {
        setAvailableFromDate(date);
        setFormData(f => ({
          ...f,
          availableFrom: format(date, 'yyyy-MM-dd'),
        }));
      } else {
        setAvailableFromDate(undefined);
        setFormData(f => ({
          ...f,
          availableFrom: '',
        }));
      }
      setShowCalendar(false);
    } catch (error) {
      console.error('Error in handleDateSelect:', error);
    }
  }, [setAvailableFromDate, setFormData, setShowCalendar]);

  // Helper functions to check if sections are filled
  const isBasicInfoFilled = () => {
    return formData.title.trim() && 
           formData.description.trim() && 
           formData.price && 
           formData.propertyType && 
           formData.propertyStatus && 
           formData.country && 
           formData.location.trim();
  };

  const isPropertyDetailsFilled = () => {
    return formData.bedrooms || 
           formData.bathrooms || 
           formData.area || 
           formData.yearBuilt || 
           formData.parkingSpaces || 
           formData.lotSize || 
           formData.energyRating || 
           formData.constructionMaterial || 
           formData.floorLevel || 
           formData.totalFloors || 
           availableFromDate;
  };

  const isAmenitiesFilled = () => {
    return formData.amenities.length > 0;
  };

  // Helper function to check if a field is filled
  const isFieldFilled = (value: string | number | undefined) => {
    return value !== undefined && value !== null && value !== '';
  };

  // Helper function to get field status class
  const getFieldStatusClass = (value: string | number | undefined) => {
    return isFieldFilled(value) ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white';
  };

  // Track if this is the initial load (for editing)
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Update active category when amenities are loaded (for editing) - only run once
  useEffect(() => {
    // Only auto-switch categories on initial load when editing
    if (!hasInitialized && formData.amenities.length > 0) {
      const categoryCounts: { [key: string]: number } = {};
      
      // Count amenities by category
      formData.amenities.forEach(amenityId => {
        const amenity = findAmenityById(amenityId);
        if (amenity) {
          categoryCounts[amenity.category] = (categoryCounts[amenity.category] || 0) + 1;
        }
      });
      
      // Find the category with the most selected amenities
      const categoryKeys = Object.keys(categoryCounts);
      if (categoryKeys.length > 0) {
        const mostSelectedCategory = categoryKeys.reduce((a, b) => 
          categoryCounts[a] > categoryCounts[b] ? a : b
        );
        
        if (mostSelectedCategory && mostSelectedCategory !== activeCategory) {
          setActiveCategory(mostSelectedCategory);
        }
      }
      
      // Mark as initialized so this doesn't run again
      setHasInitialized(true);
    }
  }, [formData.amenities, hasInitialized, activeCategory]);

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-6 lg:p-8 rounded-2xl shadow-xl border border-gray-100 w-full pb-8">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-2">
          <Home className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Property Details</h2>
        <p className="text-gray-600 text-sm">Tell us about your property</p>
      </div>

      <div className="space-y-8">
        {/* Basic Information Card */}
        <div className={`bg-white p-6 rounded-xl shadow-md border transition-all duration-200 ${
          isBasicInfoFilled() ? 'border-green-300 bg-green-50' : 'border-gray-100'
        }`}>
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            Basic Information
            {isBasicInfoFilled() && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Complete
              </span>
            )}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Title */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={onChange}
                placeholder="e.g., Luxurious Waterfront Penthouse"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  getFieldStatusClass(formData.title)
                }`}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (€) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={onChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    getFieldStatusClass(formData.price)
                  }`}
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="country"
                  value={formData.country}
                  onChange={onChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
                >
                  <option value="" disabled>Select country</option>
                  {COUNTRY_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                <LocationAutocomplete
                  value={formData.location}
                  onChange={(val: string) => setFormData(f => ({ ...f, location: val }))}
                  onSelect={(addr: string, lat: number, lng: number, structuredData?: any) => {
                    setFormData(f => ({ 
                      ...f, 
                      location: addr,
                      latitude: lat.toString(),
                      longitude: lng.toString(),
                      ...(structuredData && {
                        country: structuredData.country || f.country,
                        region: structuredData.region || '',
                        city: structuredData.city || '',
                        postal_code: structuredData.postal_code || '',
                        street: structuredData.street || ''
                      })
                    }));
                    setLocationCoords({ lat, lng });
                  }}
                  selectedCountry={formData.country}
                  placeholder="Type address…"
                  inputClassName="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                />
              </div>
            </div>

            {/* Structured Location Details */}
            {(formData.city || formData.region || formData.postal_code) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">Location Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {formData.city && (
                    <div>
                      <span className="text-blue-600 font-medium">City:</span> {formData.city}
                    </div>
                  )}
                  {formData.region && (
                    <div>
                      <span className="text-blue-600 font-medium">Region:</span> {formData.region}
                    </div>
                  )}
                  {formData.postal_code && (
                    <div>
                      <span className="text-blue-600 font-medium">Postal Code:</span> {formData.postal_code}
                    </div>
                  )}
                  {formData.street && (
                    <div>
                      <span className="text-blue-600 font-medium">Street:</span> {formData.street}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onChange}
              rows={4}
              placeholder="Provide a detailed description of your property..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white resize-none"
            />
          </div>
        </div>

        {/* Property Specifications Card */}
        <div className={`bg-white p-6 rounded-xl shadow-md border transition-all duration-200 ${
          isPropertyDetailsFilled() ? 'border-green-300 bg-green-50' : 'border-gray-100'
        }`}>
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Home className="w-5 h-5 mr-2 text-blue-600" />
            Property Specifications
            {isPropertyDetailsFilled() && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Complete
              </span>
            )}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={onChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
                >
                  <option value="" disabled>Select property type</option>
                  {PROPERTY_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="propertyStatus"
                  value={formData.propertyStatus}
                  onChange={onChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
                >
                  <option value="" disabled>Select status</option>
                  {PROPERTY_STATUS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Area (m²) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <SquareFootage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={onChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  min={0}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bedrooms <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Bed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={onChange}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    formData.propertyType === 'land' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  disabled={formData.propertyType === 'land'}
                  min={0}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bathrooms <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                <input
                  type="number"
                  step="0.5"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={onChange}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    formData.propertyType === 'land' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  disabled={formData.propertyType === 'land'}
                  min={0}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Year Built */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year Built <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                <input
                  type="number"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={onChange}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    formData.propertyType === 'land' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  disabled={formData.propertyType === 'land'}
                  min={1800}
                  max={new Date().getFullYear()}
                  placeholder="e.g., 2020"
                />
              </div>
            </div>
          </div>

          {/* Available From */}
          <div className="relative mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Available From <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCalendar(v => !v);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left transition-all duration-200 hover:border-gray-400"
            >
              <div className="flex items-center justify-between">
                <span className={availableFromDate ? 'text-gray-900' : 'text-gray-500'}>
                  {availableFromDate ? format(availableFromDate, 'MMMM dd, yyyy') : 'Select availability date'}
                </span>
                <CalendarIcon className="ml-2 h-5 w-5 text-gray-400" />
              </div>
            </button>

            {showCalendar && (
              <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
                <div className="mb-4">
                  <input
                    type="date"
                    value={availableFromDate ? format(availableFromDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      handleDateSelect(date);
                    }}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCalendar(false);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Amenities Card */}
        <div className={`bg-white p-6 rounded-xl shadow-md border transition-all duration-200 ${
          isAmenitiesFilled() ? 'border-green-300 bg-green-50' : 'border-gray-100'
        }`}>
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Home className="w-5 h-5 mr-2 text-blue-600" />
            Property Amenities
          </h3>
          
          {/* Mobile: Fixed Category Selector + Scrollable Amenities */}
          <div className="md:hidden">
            {/* Fixed Category Selector */}
            <div className="sticky top-0 bg-white z-10 pb-4 mb-4 border-b border-gray-200">
              <div className="flex gap-2 overflow-x-auto pb-2 amenity-category-scroll" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                  .amenity-category-scroll::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {(() => {
                  const categories = Array.from(new Set(AMENITIES.map(a => a.category)));
                  return categories.map(category => {
                    const selectedCount = formData.amenities.filter(amenityId => {
                      const amenity = findAmenityById(amenityId);
                      return amenity && amenity.category === category;
                    }).length;
                    
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-center min-w-max ${
                          activeCategory === category
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                                              <div className="text-sm font-semibold text-gray-800">
                        {category}
                      </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
            
            {/* Mobile: Amenities Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
              {(() => {
                const filteredAmenities = AMENITIES.filter(a => a.category === activeCategory);
                return filteredAmenities.map(a => {
                  const isSelected = formData.amenities.some(amenityId => {
                    const foundAmenity = findAmenityById(amenityId);
                    return foundAmenity && foundAmenity.id === a.id;
                  });
                  
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAmenity(a.id)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                        isSelected
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          isSelected ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          {a.label}
                        </span>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Desktop: Category Tabs */}
          <div className="hidden md:block mb-6">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
              {(() => {
                const categories = Array.from(new Set(AMENITIES.map(a => a.category)));
                
                return categories.map(category => {
                  const selectedCount = formData.amenities.filter(amenityId => {
                    const amenity = findAmenityById(amenityId);
                    return amenity && amenity.category === category;
                  }).length;
                  
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeCategory === category
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                      {selectedCount > 0 && (
                        <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
                          activeCategory === category
                            ? 'bg-white text-blue-500'
                            : 'bg-green-500 text-white'
                        }`}>
                          {selectedCount}
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
          
          {/* Desktop: Amenities Grid */}
          <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {(() => {
              const filteredAmenities = AMENITIES.filter(a => a.category === activeCategory);
              return filteredAmenities.map(a => {
                // Check if this amenity is selected using the findAmenityById function
                const isSelected = formData.amenities.some(amenityId => {
                  const foundAmenity = findAmenityById(amenityId);
                  return foundAmenity && foundAmenity.id === a.id;
                });
                
                return (
                  <label key={a.id} className={`group flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-green-300 bg-green-50 hover:border-green-400'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAmenity(a.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-green-500 border-green-500'
                          : 'bg-white border-gray-300 group-hover:border-blue-400'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium transition-colors duration-200 ${
                      isSelected
                        ? 'text-green-700 group-hover:text-green-800'
                        : 'text-gray-700 group-hover:text-blue-700'
                    }`}>
                      {a.label}
                    </span>
                  </label>
                );
              });
            })()}
          </div>
          
          
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
        <button 
          type="button" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            back();
          }}
          className="group inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>
        
        <button
          type="button"
          disabled={!valid}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            next();
          }}
          className={`group relative px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${
            valid
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center">
            Continue
            <ChevronRight className={`w-5 h-5 ml-2 transition-transform duration-200 ${
              valid ? 'group-hover:translate-x-1' : ''
            }`} />
          </span>
          
          {valid && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          )}
        </button>
      </div>


    </section>
  );
};

export default Step2_OwnerAgent;