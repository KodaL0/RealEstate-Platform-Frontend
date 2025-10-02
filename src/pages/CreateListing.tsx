// src/pages/CreateListing.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import api from '../config/api';
import { useUser } from '../context/UserContext';

import { ListingWizardProvider, useListingWizard } from '../context/ListingWizardContext';
import ProgressBar from '../components/ProgressBar';

// ⬇️ New step order imports
import Step1_PropertyType from './CreateListing/steps/Step1_PropertyType';
import Step2_PropertyDetails from './CreateListing/steps/Step2_PropertyDetails';
import Step3_Images from './CreateListing/steps/Step3_Images';
import Step5_Documents from './CreateListing/steps/Step5_Documents';
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
  handleSubmit: (e: React.FormEvent) => Promise<void>;

  // images
  previewImages: string[];
  setPreviewImages: React.Dispatch<React.SetStateAction<string[]>>;
  primaryIndex: number;
  setPrimaryIndex: React.Dispatch<React.SetStateAction<number>>;
  existingImageIds: string[];
  setExistingImageIds: React.Dispatch<React.SetStateAction<string[]>>;

  // documents
  documents: any[];
  setDocuments: React.Dispatch<React.SetStateAction<any[]>>;

  // misc
  countryCode: string;
  setCountryCode: (v: string) => void;
  isSubmitting: boolean;
  isEditing: boolean;
  propertyId?: string;
  username: string;

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

  // ⬇️ Steps: 1=Type, 2=Details, 3=Images, 4=Documents, 5=Contact
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
    <Step3_Images
      formData={props.formData}
      setFormData={props.setFormData}
      previewImages={props.previewImages}
      setPreviewImages={props.setPreviewImages}
      primaryIndex={props.primaryIndex}
      setPrimaryIndex={props.setPrimaryIndex}
      existingImageIds={props.existingImageIds}
      setExistingImageIds={props.setExistingImageIds}
      isEditing={props.isEditing}
      propertyId={props.propertyId}
      username={props.username}
    />,
    <Step5_Documents
      documents={props.documents}
      setDocuments={props.setDocuments}
      isSubmitting={props.isSubmitting}
      isEditing={props.isEditing}
      propertyId={props.propertyId}
      username={props.username}
    />,
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-2 sm:px-4">
        <div className="w-full py-4">
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

  // Ensure userType has a safe default for the 5-step wizard
  useEffect(() => {
    if (!formData.userType) {
      setFormData(prev => ({ ...prev, userType: 'owner_Agent' as typeof prev.userType }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Document state
  const [documents, setDocuments] = useState<any[]>([]);
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
        setExistingImageIds(imgs.map((i: any) => {
          // Ensure we only store numeric IDs, not URLs
          if (i.id && typeof i.id === 'number') {
            return String(i.id);
          }
          // If no valid ID, we'll need to handle this case
          console.warn('Image missing valid ID:', i);
          return null;
        }).filter((id: string | null) => id !== null));
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

        // Backend now sends amenity IDs directly (no conversion needed)
        console.log('📋 Loaded amenities from backend:', d.amenities, 'Type:', typeof d.amenities, 'IsArray:', Array.isArray(d.amenities));
        
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
          amenities: Array.isArray(d.amenities) ? d.amenities : [],
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

        // Load existing documents
        const existingDocs = d.documents || [];
        console.log('📄 Loaded documents from backend:', existingDocs);
        
        // Transform backend documents to match DocumentFile interface
        const transformedDocs = existingDocs.map((doc: any) => ({
          id: `existing-${doc.id}`,
          existingDocId: doc.id,
          documentUrl: doc.document,
          type: doc.document_type || 'other',
          title: doc.title || doc.document.split('/').pop() || 'Document',
          description: doc.description || '',
          fileSize: doc.file_size,
          fileName: doc.document.split('/').pop() || 'document',
          uploadedAt: doc.uploaded_at,
        }));
        
        setDocuments(transformedDocs);

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

      // BATCH REPLACE: If editing and all existing images were deleted + new ones added
      const hasDeletedAllExisting = isEditing && existingImageIds.length === 0 && previewImages.length > 0;
      const hasNewImages = formData.images.length > 0;
      
      if (hasDeletedAllExisting && hasNewImages) {
        console.log('🔄 Batch replace: deleting all existing images and uploading new ones');
        fd.append('replace_images', 'true');
        formData.images.forEach(f => fd.append('images[]', f));
        fd.append('primary_image_index', String(primaryIndex));
      }
      // images - maintain order and set primary index
      else if (formData.images.length) {
        // Append images in their current order
        formData.images.forEach(f => fd.append('images[]', f));
        // Set which index is primary (backend will use display_order)
        fd.append('primary_image_index', String(primaryIndex));
      }
      // For editing: primary image is already set via reorderImages API calls
      // No need to send image order here as reordering happens in real-time

      // documents - append to FormData
      if (documents.length > 0) {
        documents.forEach((doc) => {
          fd.append('documents[]', doc.file);
          fd.append('document_types[]', doc.type);
          fd.append('document_titles[]', doc.title);
          fd.append('document_descriptions[]', doc.description || '');
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

  // ⬇️ totalSteps is now 5 (Type, Details, Images, Documents, Contact); initialStep from URL or 0
  return (
    <ListingWizardProvider initialStep={isEditing ? initialStep : 0} totalSteps={5}>
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
          documents={documents}
          setDocuments={setDocuments}
          countryCode={countryCode}
          setCountryCode={setCountryCode}
          isSubmitting={isSubmitting}
          isEditing={isEditing}
          propertyId={id}
          username={username}
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
