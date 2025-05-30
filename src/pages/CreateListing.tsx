// src/pages/CreateListing.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import {
  Home,
  DollarSign,
  Euro,
  MapPin,
  Building2,
  Bed,
  Bath,
  DotSquare as SquareFootage,
  Upload,
  X,
  Loader2,
} from 'lucide-react';

import api from '../config/api';
import { useUser } from '../context/UserContext';
import LocationAutocomplete from '../pages/LocationAutocomplete';

/* ───────────── types ───────────── */
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
}

/* ───────────── reference data ───────────── */
const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'land', label: 'Land' },
  //{ value: 'condo', label: 'Condo' },
  //{ value: 'townhouse', label: 'Townhouse' },
  //{ value: 'villa', label: 'Villa' },
  //{ value: 'studio', label: 'Studio' },
  //{ value: 'duplex', label: 'Duplex' },
  //{ value: 'penthouse', label: 'Penthouse' }
];

const PROPERTY_STATUS = [
  { value: 'forSale', label: 'For Sale' },
  { value: 'forRent', label: 'For Rent' },
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
  { id: 'waterfront', label: 'Waterfront', category: 'Location' },
];

const COUNTRY_CODES = [
  { code: '+357', label: '🇨🇾' },
  { code: '+1',   label: '🇺🇸' },
  { code: '+44',  label: '🇬🇧' },
  { code: '+30',  label: '🇬🇷' },
  { code: '+49',  label: '🇩🇪' },
  { code: '+33',  label: '🇫🇷' },
  { code: '+39',  label: '🇮🇹' },
  { code: '+61',  label: '🇦🇺' },
  { code: '+91',  label: '🇮🇳' },
];

/* ───────────── defaults ───────────── */
const DEFAULT_FORM_STATE: ListingForm = {
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
};

const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const { user } = useUser();
  const username = user?.username || '';

  /* state */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ListingForm>(DEFAULT_FORM_STATE);

  const [availableFromDate, setAvailableFromDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);

  // new: hold selected coords
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  // country code for phone
  const [countryCode, setCountryCode] = useState('+357');

  /* image state */
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);

  /* drop-zone */
  const onDrop = useCallback((files: File[]) => {
    setFormData(p => ({ ...p, images: [...p.images, ...files] }));
    setPreviewImages(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024,
  });

  /* remove image */
  const removeImage = (idx: number) => {
    setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
    if (idx < previewImages.length) URL.revokeObjectURL(previewImages[idx]);
    setPreviewImages(p => p.filter((_, i) => i !== idx));
    if (idx < existingImageIds.length)
      setExistingImageIds(p => p.filter((_, i) => i !== idx));
    if (idx === primaryIndex) setPrimaryIndex(0);
    else if (idx < primaryIndex) setPrimaryIndex(i => i - 1);
  };

  /* generic inputs */
const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;
  setFormData(prev => {
    let updated = { ...prev, [name]: value };

    if (name === 'propertyType') {
      if (value === 'land') {
        // when switching *to* Land
        updated = {
          ...updated,
          bedrooms: '0',
          bathrooms: '0',
          yearBuilt: '',
        };
      } else {
        // when switching *off* Land, clear those forced zeros
        updated = {
          ...updated,
          bedrooms: '',
          bathrooms: '',
          yearBuilt: '',
        };
      }
    }

    return updated;
  });
};


  const handleCheckboxChange = (id: string) => {
    setFormData(p => ({
      ...p,
      amenities: p.amenities.includes(id)
        ? p.amenities.filter(a => a !== id)
        : [...p.amenities, id],
    }));
  };

      /* validation */
  const validateForm = () => {
    if (!formData.title.trim())       { setError('Please enter a title'); return false; }
    if (!formData.description.trim()) { setError('Please enter a description'); return false; }
    if (!formData.price || +formData.price <= 0)
                                       { setError('Please enter a valid price'); return false; }
    if (!formData.location.trim())
                                       { setError('Please select a valid location'); return false; }
    if (!formData.propertyType)       { setError('Please select a property type'); return false; }
    if (!formData.propertyStatus)     { setError('Please select a property status'); return false; }
    if (formData.images.length === 0 && previewImages.length === 0)
                                       { setError('Please upload at least one image'); return false; }
    // Optional: skip beds/baths for land
    if (formData.propertyType !== 'land') {
      if (!formData.bedrooms) { setError('Please enter number of bedrooms'); return false; }
      if (!formData.bathrooms) { setError('Please enter number of bathrooms'); return false; }
    }
    return true;
  };

useEffect(() => {
  if (!isEditing || !id) return;
  setLoading(true);
  api.properties.getUserProperty(username, Number(id))
    .then(res => {
      const d = res.data;
      const imgs = d.images || [];
      setPreviewImages(imgs.map((i: any) => i.image));
      setExistingImageIds(imgs.map((i: any) => i.id || i.image));
      const primary = imgs.find((i: any) => i.is_primary);
      setPrimaryIndex(primary ? imgs.indexOf(primary) : 0);

      let propertyStatus = d.property_status || '';
      if (propertyStatus === 'for_sale') propertyStatus = 'forSale';
      if (propertyStatus === 'for_rent') propertyStatus = 'forRent';

      /* split phone to code + local part */
      let phone = d.contact_phone || '';
      let cc = countryCode;
      const m = phone.match(/^\+[\d]{1,4}/);
      if (m) {
        cc = m[0];
        phone = phone.replace(cc, '').trim();
      }
      setCountryCode(cc);

      setFormData({
        ...DEFAULT_FORM_STATE,
        title: d.title || '',
        description: d.description || '',
        price: d.price?.toString() || '',
        location: d.location || '',
        propertyType: d.property_type || '',
        bedrooms: d.bedrooms?.toString() || '',
        bathrooms: d.bathrooms?.toString() || '',
        area: d.area?.toString() || '',
        amenities: (d.amenities || []).map((lab: string) => {
          const match = AMENITIES.find(a => a.label.toLowerCase() === lab.toLowerCase());
          return match ? match.id : lab;
        }),
        yearBuilt: d.year_built?.toString() || '',
        parkingSpaces: d.parking_spaces?.toString() || '',
        lotSize: d.lot_size?.toString() || '',
        propertyStatus,
        energyRating: d.energy_rating || '',
        constructionMaterial: d.construction_material || '',
        floorLevel: d.floor_level?.toString() || '',
        totalFloors: d.total_floors?.toString() || '',
        availableFrom: d.available_from || '',
        contactPhone: phone,
        contactEmail: d.contact_email || '',
        virtualTourUrl: d.virtual_tour_url || '',
        videoUrl: d.video_url || '',
        images: [],
      });

      // ⬇️ Set the calendar selection for DayPicker
      if (d.available_from) {
        setAvailableFromDate(new Date(d.available_from));
      }

      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError('Failed to load property data. Please try again.');
      setLoading(false);
    });
}, [isEditing, id, username]);


  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isEditing && !username) {
      toast.error('User not loaded');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const fd = new FormData();

      /* images */
      if (formData.images.length) {
        const prim = Math.min(primaryIndex, formData.images.length - 1);
        [formData.images[prim], ...formData.images.filter((_, i) => i !== prim)].forEach(f =>
          fd.append('images[]', f)
        );
      }
      if (isEditing && previewImages.length) {
        previewImages.forEach((url, i) => {
          if (!formData.images.length || i >= formData.images.length) {
            fd.append('existing_images[]', existingImageIds[i] || url);
            if (i === primaryIndex)
              fd.append('primary_image_id', existingImageIds[i] || url);
          }
        });
      }
      fd.append('primary_is_first', 'true');

      /* rest of fields */
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'images') return;
        if (k === 'amenities') {
          (v as string[]).forEach(a => fd.append('amenities[]', a));
          return;
        }
        if (v) fd.append(k, v.toString());
      });

      /* phone */
      fd.set('contactPhone', `${countryCode} ${formData.contactPhone}`.trim());

      /* include coords */
      if (locationCoords) {
        fd.append('latitude',  locationCoords.lat.toString());
        fd.append('longitude', locationCoords.lng.toString());
      }

      /* endpoint */
      let res;
      if (isEditing) {
        res = await api.formPut(`properties/${username}/property/${id}/edit`, fd);
      } else {
        res = await api.properties.create(fd);
      }

      if (res.status >= 200 && res.status < 300) {
        toast.success(isEditing ? 'Listing updated!' : 'Listing created!');
        navigate('/my-listings');
      } else {
        setError(`Unexpected response ${res.status}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to process listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* loading screens */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading property data…</p>
      </div>
    );
  if (isEditing && !user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading user data…</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* ===== header ===== */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Home className="mr-3 h-8 w-8" />
              {isEditing ? 'Edit Property Listing' : 'Create New Property Listing'}
            </h1>
            <p className="text-blue-100 mt-2">
              {isEditing
                ? 'Update the details below to modify your listing'
                : 'Fill in the details below to list your property'}
            </p>
            <p className="text-blue-100 mt-2 text-sm italic">
              Required fields: title, description, price, location, property type, property status, bedrooms, bathrooms, area, year built, contact phone, contact email, and at least one image
            </p>
          </div>

          {/* ===== inline error ===== */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-8 my-6">
              <div className="flex">
                <X className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* ===== form ===== */}
          <form onSubmit={handleSubmit} className="p-8 space-y-10" noValidate>
            {/* ――― Basic Information ――― */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
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

                {/* listing type */}
                <div>
                  <label
                    htmlFor="propertyStatus"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Listing Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="propertyStatus"
                    name="propertyStatus"
                    value={formData.propertyStatus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="" disabled>
                      Select status
                    </option>  
                    {PROPERTY_STATUS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Euro
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
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

                {/* location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <LocationAutocomplete
                      value={formData.location}
                      onChange={val =>
                        setFormData(f => ({ ...f, location: val }))
                      }
                      onSelect={(addr, lat, lng) => {
                        setFormData(f => ({ ...f, location: addr }));
                        setLocationCoords({ lat, lng });
                      }}
                      placeholder="Type address…"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ――― Property Details ――― */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* property type */}
                <div>
                  <label
                    htmlFor="propertyType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {PROPERTY_TYPES.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* bedrooms */}
                <div>
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Bed
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="number"
                      id="bedrooms"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      disabled={formData.propertyType === 'land'}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      required
                      min="0"
                      placeholder="Number of bedrooms"
                    />
                  </div>
                </div>

                {/* bathrooms */}
                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Bath
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="number"
                      id="bathrooms"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      disabled={formData.propertyType === 'land'}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      required
                      min="0"
                      step="0.5"
                      placeholder="Number of bathrooms"
                    />
                  </div>
                </div>

                {/* area */}
                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                    Living Area (sq&nbsp;m) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <SquareFootage
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="number"
                      id="area"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      placeholder="Square metres"
                    />
                  </div>
                </div>

                {/* year built */}
                <div>
                  <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700 mb-1">
                    Year Built <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="yearBuilt"
                    name="yearBuilt"
                    value={formData.yearBuilt}
                    onChange={handleInputChange}
                    disabled={formData.propertyType === 'land'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    min="1800"
                    max={new Date().getFullYear()}
                    placeholder="Year of construction"
                  />
                </div>

                {/* lot size */}
                <div>
                  <label htmlFor="lotSize" className="block text-sm font-medium text-gray-700 mb-1">
                    Lot Size (sq&nbsp;m)
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

              {/* floor level */}
              <div>
                <label htmlFor="floorLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Floor Level
                </label>
                <input
                  type="number"
                  id="floorLevel"
                  value={formData.floorLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  placeholder="e.g., 2"
                />
              </div>
              
              {/* available from using DayPicker */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available From <span className="text-red-500">*</span>
                  </label>
                <button
                  type="button"
                  onClick={() => setShowCalendar(prev => !prev)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left"
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {availableFromDate ? format(availableFromDate, 'yyyy-MM-dd') : 'Select date'}
                    </span>
                    <CalendarIcon className="ml-2 h-4 w-4 text-gray-500" />
                  </div>
                </button>

                {showCalendar && (
                  <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-md">
                    <DayPicker
                      mode="single"
                      selected={availableFromDate}
                      onSelect={(date) => {
                        setAvailableFromDate(date);
                        setShowCalendar(false);
                      }}
                      disabled={{ before: new Date() }}
                    />
                  </div>
                 )}
                </div>
            </section>

            {/* ――― Property Images ――― */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Property Images <span className="text-red-500">*</span></h2>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag &amp; drop images here, or click to select files
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 10 images, up to 5&nbsp;MB each. Supported formats: JPG, PNG, WebP
                </p>
              </div>

              {previewImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewImages.map((preview, index) => (
                    <div key={preview} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className={`h-24 w-full object-cover rounded-lg ${
                          index === primaryIndex ? 'border-4 border-blue-500' : ''
                        }`}
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
                        onClick={() => setPrimaryIndex(index)}
                        className="absolute bottom-1 left-1 bg-blue-500 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        Set as Primary
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ――― Amenities ――― */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AMENITIES.map(a => (
                  <div key={a.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`amenity-${a.id}`}
                      checked={formData.amenities.includes(a.id)}
                      onChange={() => handleCheckboxChange(a.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`amenity-${a.id}`} className="text-sm text-gray-700">
                      {a.label}
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* ――― Description ――― */}
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
                placeholder="Provide a detailed description of the property…"
              />
              <p className="text-sm text-red-500 mt-1">* Required</p>
            </section>

            {/* ――― Contact Information ――― */}
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* email */}
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="your@email.com"
                  />
                </div>

                {/* phone with drop-down */}
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      className="rounded-l-lg border border-gray-300 bg-gray-100 px-3 text-sm focus:outline-none"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.label} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2 border-t border-b border-r border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="phone number"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ――― Virtual Tour / Video ――― */}
            {/* 
            <section className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Virtual Tour &amp; Video</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="virtualTourUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Virtual&nbsp;Tour&nbsp;URL&nbsp;(optional)
                  </label>
                  <input
                    type="url"
                    id="virtualTourUrl"
                    name="virtualTourUrl"
                    value={formData.virtualTourUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Matterport link"
                  />
                </div>
                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Video&nbsp;URL&nbsp;(optional)
                  </label>
                  <input
                    type="url"
                    id="videoUrl"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., YouTube link"
                  />
                </div>
              </div>
            </section>
            */}

            {/* ――― submit ――― */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center px-8 py-4 rounded-xl text-white font-semibold text-lg
                  ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                  transition-colors duration-200 shadow-lg`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
                    {isEditing ? 'Updating Listing…' : 'Creating Listing…'}
                  </>
                ) : isEditing ? (
                  'Update Listing'
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
