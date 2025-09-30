// src/pages/CreateListing.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

import api from '../config/api';
import { useUser } from '../context/UserContext';

import { ListingWizardProvider, useListingWizard } from '../context/ListingWizardContext';
import ProgressBar from '../components/ProgressBar';

// ⬇️ New step order imports
import Step1_PropertyType from './CreateListing/steps/Step1_PropertyType';
import Step2_PropertyDetails from './CreateListing/steps/Step2_PropertyDetails';
import Step3_Images from './CreateListing/steps/Step3_Images';
import Step4_Contact from './CreateListing/steps/Step4_Contact';

import {
  DEFAULT_FORM_STATE,
  ListingForm,
  COUNTRY_CODES,
} from '../types';

/* ---------- WizardContent ---------- */
type WizardProps = {
  formData: ListingForm;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  handleInputChange: (e: React.ChangeEvent<any>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void> | void;

  // images
  previewImages: string[];
  setPreviewImages: React.Dispatch<React.SetStateAction<string[]>>;
  primaryIndex: number;
  setPrimaryIndex: React.Dispatch<React.SetStateAction<number>>;
  existingImageIds: string[];
  setExistingImageIds: React.Dispatch<React.SetStateAction<string[]>>;
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  removeImage: (idx: number) => void;
  reorderImages: (fromIndex: number, toIndex: number) => void;

  // misc
  countryCode: string;
  setCountryCode: (v: string) => void;
  isSubmitting: boolean;
  isEditing: boolean;

  // step2 extras
  availableFromDate: Date | undefined;
  setAvailableFromDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  showCalendar: boolean;
  setShowCalendar: React.Dispatch<React.SetStateAction<boolean>>;
  setLocationCoords: (v: { lat: number; lng: number } | null) => void;
};

const WizardContent: React.FC<WizardProps> = (props) => {
  const { currentStep } = useListingWizard();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // ⬇️ Steps: Step 1 (Property Type), Step 2 (Property Details), Step 3 (Images), Step 4 (Contact)
  const steps = [
    <Step1_PropertyType
      formData={props.formData}
      setFormData={props.setFormData}
    />,
    <Step2_PropertyDetails
      formData={props.formData}
      setFormData={props.setFormData}
      onChange={props.handleInputChange}
      availableFromDate={props.availableFromDate}
      setAvailableFromDate={props.setAvailableFromDate}
      showCalendar={props.showCalendar}
      setShowCalendar={props.setShowCalendar}
      setLocationCoords={props.setLocationCoords}
    />,
    <Step3_Images {...props} />,
    <Step4_Contact
      formData={props.formData}
      onChange={props.handleInputChange}
      countryCode={props.countryCode}
      setCountryCode={props.setCountryCode}
      isSubmitting={props.isSubmitting}
      isEditing={props.isEditing}
    />,
  ];

  return (
    <form onSubmit={props.handleSubmit} noValidate className="h-full flex flex-col">
      <div className="flex-shrink-0">
        <ProgressBar isEditing={props.isEditing} scrollContainerRef={scrollContainerRef} />
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto mt-4 px-2 sm:mt-4 pt-12 sm:pt-0">
        <div className="w-full">
          {steps[currentStep]}
        </div>
      </div>
    </form>
  );
};

/* ---------- Main component ---------- */
const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const { user } = useUser();
  const username = user?.username || '';
  
  // Get initial step from URL query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const stepParam = searchParams.get('step');
  const initialStep = stepParam ? parseInt(stepParam, 10) : 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form data from localStorage or default
  const [formData, setFormData] = useState<ListingForm>(() => {
    if (isEditing) return DEFAULT_FORM_STATE;
    const saved = localStorage.getItem('createListing_formData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_FORM_STATE, ...parsed };
      } catch (e) {
        console.warn('Failed to parse saved form data:', e);
        return DEFAULT_FORM_STATE;
      }
    }
    return DEFAULT_FORM_STATE;
  });

  // Ensure userType has a safe default for the 4-step wizard
  useEffect(() => {
    if (!formData.userType) {
      setFormData(prev => ({ ...prev, userType: 'owner_Agent' as typeof prev.userType }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(() => {
    if (isEditing) return null;
    const saved = localStorage.getItem('createListing_locationCoords');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved location coords:', e);
        return null;
      }
    }
    return null;
  });
  
  const [countryCode, setCountryCode] = useState(() => {
    if (isEditing) return COUNTRY_CODES[0].code;
    const saved = localStorage.getItem('createListing_countryCode');
    return saved || COUNTRY_CODES[0].code;
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);
  
  // Step 2 date picker states
  const [availableFromDate, setAvailableFromDate] = useState<Date | undefined>(() => {
    if (isEditing) return undefined;
    const saved = localStorage.getItem('createListing_availableFromDate');
    if (saved) {
      try {
        return new Date(saved);
      } catch (e) {
        console.warn('Failed to parse saved date:', e);
        return undefined;
      }
    }
    return undefined;
  });
  const [showCalendar, setShowCalendar] = useState(false);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('createListing_formData', JSON.stringify(formData));
    }
  }, [formData, isEditing]);

  // Save location coords to localStorage whenever it changes
  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('createListing_locationCoords', JSON.stringify(locationCoords));
    }
  }, [locationCoords, isEditing]);

  // Save country code to localStorage whenever it changes
  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('createListing_countryCode', countryCode);
    }
  }, [countryCode, isEditing]);

  // Save available from date to localStorage whenever it changes
  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('createListing_availableFromDate', availableFromDate?.toISOString() || '');
    }
  }, [availableFromDate, isEditing]);

  const onDrop = useCallback((files: File[]) => {
    setFormData((p: ListingForm) => ({ ...p, images: [...p.images, ...files] }));
    setPreviewImages((p: string[]) => [...p, ...files.map(f => URL.createObjectURL(f))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 20,
    maxSize: 5 * 1024 * 1024,
  });

  const removeImage = (idx: number) => {
    setFormData((p: ListingForm) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
    if (idx < previewImages.length) URL.revokeObjectURL(previewImages[idx]);
    setPreviewImages((p: string[]) => p.filter((_, i) => i !== idx));
    setExistingImageIds((p: string[]) => p.filter((_, i) => i !== idx));
    setPrimaryIndex((i: number) => (idx === i ? 0 : idx < i ? i - 1 : i));
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setFormData((p: ListingForm) => {
      const newImages = [...p.images];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return { ...p, images: newImages };
    });
    
    setPreviewImages((p: string[]) => {
      const newPreviews = [...p];
      const [removed] = newPreviews.splice(fromIndex, 1);
      newPreviews.splice(toIndex, 0, removed);
      return newPreviews;
    });
    
    setExistingImageIds((p: string[]) => {
      const newIds = [...p];
      const [removed] = newIds.splice(fromIndex, 1);
      newIds.splice(toIndex, 0, removed);
      return newIds;
    });
    
    // Update primary index if needed
    setPrimaryIndex((i: number) => {
      if (i === fromIndex) return toIndex;
      if (fromIndex < i && toIndex >= i) return i - 1;
      if (fromIndex > i && toIndex <= i) return i + 1;
      return i;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev: ListingForm) => {
      let updated: ListingForm = { ...prev, [name]: value } as ListingForm;
      if (name === 'propertyType') {
        // Reset fields based on property type
        const reset = {
          bedrooms: '',
          bathrooms: '',
          floorLevel: '',
          totalFloors: '',
          parkingSpaces: '',
          energyRating: '',
          lotSize: '',
          area: '',
          amenities: [] as string[],
          yearBuilt: '',
          constructionMaterial: '',
          availableFrom: '',
        };
        
        // For land properties, we don't need bedrooms/bathrooms
        if (value === 'land') {
          updated = { ...updated, ...reset };
        } else {
          updated = { ...updated, ...reset };
        }
      }
      return updated;
    });
  };

  // load existing
  useEffect(() => {
    if (!isEditing || !id) return;
    setLoading(true);
    api.properties
      .getUserProperty(username, Number(id))
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

        let phone = d.contact_phone || '';
        let cc = countryCode;
        const m = phone.match(/^\+[\d]{1,4}/);
        if (m) {
          cc = m[0];
          phone = phone.replace(cc, '').trim();
        }
        setCountryCode(cc);

        setFormData(prev => ({
          ...prev,
          title: d.title || '',
          description: d.description || '',
          price: d.price?.toString() || '',
          location: d.location || '',
          country: d.country || 'Cyprus',
          region: d.region || '',
          city: d.city || '',
          postal_code: d.postal_code || '',
          street: d.street || '',
          latitude: d.latitude?.toString() || '',
          longitude: d.longitude?.toString() || '',
          propertyType: d.property_type || '',
          bedrooms: d.bedrooms?.toString() || '',
          bathrooms: d.bathrooms?.toString() || '',
          area: d.area?.toString() || '',
          amenities: d.amenities || [],
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
          // keep existing userType if returned, otherwise keep whatever we already have
          userType: d.user_type || prev.userType || 'owner_agent',
        }));

        // Set available from date if it exists
        if (d.available_from) {
          const date = new Date(d.available_from);
          if (!isNaN(date.getTime())) {
            setAvailableFromDate(date);
          }
        }

        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load property data.');
        setLoading(false);
      });
  }, [isEditing, id, username, countryCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const fd = new FormData();

      // images - maintain order and set primary index
      if (formData.images.length) {
        // Append images in their current order
        formData.images.forEach(f => fd.append('images[]', f));
        // Set which index is primary (backend will use display_order)
        fd.append('primary_image_index', String(primaryIndex));
      }
      if (isEditing && previewImages.length) {
        previewImages.forEach((url, i) => {
          if (!formData.images.length || i >= formData.images.length) {
            fd.append('existing_images[]', existingImageIds[i] || url);
            if (i === primaryIndex) fd.append('primary_image_id', existingImageIds[i] || url);
          }
        });
      }

      // other fields (generic loop)
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'images') return;
        if (k === 'amenities') {
          (v as string[]).forEach(a => fd.append('amenities[]', a));
          return;
        }
        if (k === 'devUnits') {
          fd.append('devUnits', JSON.stringify(v));
          return;
        }
        if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
      });

      // normalize phone
      fd.set('contactPhone', `${countryCode} ${formData.contactPhone}`.trim());
      
      // coords: prefer explicit lat/lng from form; else from map picker
      if (formData.latitude && formData.longitude) {
        fd.set('latitude', formData.latitude);
        fd.set('longitude', formData.longitude);
      } else if (locationCoords) {
        fd.append('latitude', String(locationCoords.lat));
        fd.append('longitude', String(locationCoords.lng));
      }

      // 🔁 Normalize floor fields to snake_case for backend
      if (formData.floorLevel !== undefined && formData.floorLevel !== null && formData.floorLevel !== '') {
        fd.set('floor_level', String(formData.floorLevel));
      }
      if (formData.totalFloors !== undefined && formData.totalFloors !== null && formData.totalFloors !== '') {
        fd.set('total_floors', String(formData.totalFloors));
      }
      // avoid duplicate camelCase keys if appended by generic loop
      fd.delete('floorLevel');
      fd.delete('totalFloors');

      const res = isEditing
        ? await api.formPut(`properties/${username}/property/${id}/edit`, fd)
        : await api.properties.create(fd);

      if (res.status >= 200 && res.status < 300) {
        // Clear saved form data on successful submission
        if (!isEditing) {
          localStorage.removeItem('createListing_formData');
          localStorage.removeItem('createListing_locationCoords');
          localStorage.removeItem('createListing_countryCode');
          localStorage.removeItem('createListing_availableFromDate');
          localStorage.removeItem('createListing_currentStep');
        }
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading…</p>
      </div>
    );
  if (isEditing && !user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading user…</p>
      </div>
    );

  // ⬇️ totalSteps is always 4 now; initialStep from URL or 0
  return (
    <ListingWizardProvider initialStep={isEditing ? initialStep : 0} totalSteps={4}>
      <div className="fixed inset-0 bg-gray-50 pt-24">
        <div className="h-full w-full max-w-7xl mx-auto px-4 lg:px-8 flex flex-col">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 flex-shrink-0">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
      <WizardContent
        formData={formData}
        setFormData={setFormData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        previewImages={previewImages}
        setPreviewImages={setPreviewImages}
        primaryIndex={primaryIndex}
        setPrimaryIndex={setPrimaryIndex}
        existingImageIds={existingImageIds}
        setExistingImageIds={setExistingImageIds}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        removeImage={removeImage}
        reorderImages={reorderImages}
        countryCode={countryCode}
        setCountryCode={setCountryCode}
        isSubmitting={isSubmitting}
        isEditing={isEditing}
        availableFromDate={availableFromDate}
        setAvailableFromDate={setAvailableFromDate}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
        setLocationCoords={setLocationCoords}
      />
          </div>
        </div>
      </div>
    </ListingWizardProvider>
  );
};

export default CreateListing;
