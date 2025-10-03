// src/pages/CreateListing.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import api from '../config/api';
import { useUser } from '../context/UserContext';

import { ListingWizardProvider, useListingWizard } from '../context/ListingWizardContext';
import ProgressBar from '../components/ProgressBar';

import EditSectionModal from '../components/modals/EditSectionModal';

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
  handlePropertyDataLoaded: (data: any) => void;
  existingDocuments: any[];
  setExistingDocuments: React.Dispatch<React.SetStateAction<any[]>>;
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
      isEditing={props.isEditing}
      propertyId={props.propertyId}
      onPropertyDataLoaded={props.handlePropertyDataLoaded}
      countryCode={props.countryCode}
      setCountryCode={props.setCountryCode}
      username={props.username}
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
  
  // Get initial step from URL query parameter (safely clamped 0..4)
  const searchParams = new URLSearchParams(window.location.search);
  const stepParam = searchParams.get('step');
  const parsed = Number.isInteger(Number(stepParam)) ? parseInt(String(stepParam), 10) : 0;
  const initialStep = Math.max(0, Math.min(4, parsed));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [propertyPrefetched, setPropertyPrefetched] = useState(false);
  const [propertyLoaded, setPropertyLoaded] = useState(!isEditing);
  
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
  const [existingDocuments, setExistingDocuments] = useState<any[]>([]);
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

  // 🔧 Reset any persisted step when editing so the modal choice/URL always wins
  useEffect(() => {
    if (isEditing) {
      localStorage.removeItem('createListing_currentStep');
    }
  }, [isEditing]);

  // 🔑 helper: merge server payload into formData so ANY step has values right away
  function mergePropertyIntoForm(d: any) {
    setFormData(prev => ({
      ...prev,

      // core
      title: d.title ?? d.name ?? prev.title ?? '',
      description: d.description ?? prev.description ?? '',
      propertyType: d.property_type ?? d.propertyType ?? prev.propertyType ?? '',

      // location
      address: d.address ?? prev.address ?? '',
      city: d.city ?? prev.city ?? '',
      region: d.region ?? d.state ?? prev.region ?? '',
      postalCode: d.postal_code ?? d.postalCode ?? prev.postalCode ?? '',
      latitude: (d.latitude ?? d.lat ?? prev.latitude ?? '') as any,
      longitude: (d.longitude ?? d.lng ?? prev.longitude ?? '') as any,

      // specs
      bedrooms: d.bedrooms ?? prev.bedrooms ?? '',
      bathrooms: d.bathrooms ?? prev.bathrooms ?? '',
      floorLevel: d.floor_level ?? d.floorLevel ?? prev.floorLevel ?? '',
      totalFloors: d.total_floors ?? d.totalFloors ?? prev.totalFloors ?? '',
      parkingSpaces: d.parking_spaces ?? d.parkingSpaces ?? prev.parkingSpaces ?? '',
      energyRating: d.energy_rating ?? d.energyRating ?? prev.energyRating ?? '',
      lotSize: d.lot_size ?? d.lotSize ?? prev.lotSize ?? '',
      area: d.area ?? d.square_meters ?? prev.area ?? '',
      yearBuilt: d.year_built ?? d.yearBuilt ?? prev.yearBuilt ?? '',
      constructionMaterial:
        d.construction_material ?? d.constructionMaterial ?? prev.constructionMaterial ?? '',

      // arrays
      amenities: d.amenities ?? prev.amenities ?? [],

      // dates
      availableFrom: d.available_from ?? d.availableFrom ?? prev.availableFrom ?? '',

      // contact
      contactName: d.contact_name ?? d.contactName ?? prev.contactName ?? '',
      contactEmail: d.contact_email ?? d.contactEmail ?? prev.contactEmail ?? '',
      contactPhone: (d.contact_phone ?? d.contactPhone ?? prev.contactPhone ?? '').toString(),
    }));
  }

  // 🔧 prefetch property data once when editing so Steps 3/5/Contact/Details have data immediately
  useEffect(() => {
    if (!isEditing || !id || !user?.username || propertyPrefetched) return;

    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`properties/${username}/property/${id}`);
        const data = res.data || res;

        // images/documents/date
        handlePropertyDataLoaded(data);

        // 🔑 merge all other fields into form right away
        mergePropertyIntoForm(data);

        setPropertyPrefetched(true);
      } catch (e) {
        console.error('Prefetch failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isEditing, id, user?.username, username, propertyPrefetched]);

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
        if (value === 'land') {
          updated = { ...updated, ...reset };
        } else {
          updated = { ...updated, ...reset };
        }
      }
      return updated;
    });
  };

  // ========== HELPER FUNCTIONS FOR FORM SUBMISSION ==========
  function appendImagesToFormData(fd: FormData) {
    const hasDeletedAllExisting = isEditing && existingImageIds.length === 0 && previewImages.length > 0;
    const hasNewImages = formData.images.length > 0;
    if (hasDeletedAllExisting && hasNewImages) {
      fd.append('replace_images', 'true');
      formData.images.forEach(f => fd.append('images[]', f));
      fd.append('primary_image_index', String(primaryIndex));
    } else if (formData.images.length) {
      formData.images.forEach(f => fd.append('images[]', f));
      fd.append('primary_image_index', String(primaryIndex));
    }
  }

  function appendDocumentsToFormData(fd: FormData) {
    if (documents.length > 0) {
      documents.forEach((doc) => {
        fd.append('documents[]', doc.file);
        fd.append('document_types[]', doc.type);
        fd.append('document_titles[]', doc.title);
        fd.append('document_descriptions[]', doc.description || '');
      });
    }
  }

  function appendFormFieldsToFormData(fd: FormData) {
    Object.entries(formData).forEach(([k, v]) => {
      if (k === 'images') return; // Handled separately
      if (k === 'amenities') {
        (v as string[]).forEach(a => fd.append('amenities[]', a));
        return;
      }
      if (k === 'devUnits') {
        fd.append('devUnits', JSON.stringify(v));
        return;
      }
      if (v !== undefined && v !== null && v !== '') {
        fd.append(k, String(v));
      }
    });
  }

  function normalizeSpecialFields(fd: FormData) {
    fd.set('contactPhone', `${countryCode} ${formData.contactPhone}`.trim());
    if (formData.latitude && formData.longitude) {
      fd.set('latitude', formData.latitude);
      fd.set('longitude', formData.longitude);
    } else if (locationCoords) {
      fd.append('latitude', String(locationCoords.lat));
      fd.append('longitude', String(locationCoords.lng));
    }
    if (formData.floorLevel !== undefined && formData.floorLevel !== null && formData.floorLevel !== '') {
      fd.set('floor_level', String(formData.floorLevel));
    }
    if (formData.totalFloors !== undefined && formData.totalFloors !== null && formData.totalFloors !== '') {
      fd.set('total_floors', String(formData.totalFloors));
    }
    fd.delete('floorLevel');
    fd.delete('totalFloors');
  }
  // ========== END HELPER FUNCTIONS ==========

  // Property data loading is now handled by Step2_PropertyDetails component
  const handlePropertyDataLoaded = (d: any) => {
    const imgs = d.images || [];
    setPreviewImages(imgs.map((i: any) => i.image));
    setExistingImageIds(
      imgs
        .map((i: any) => {
          if (i.id && typeof i.id === 'number') return String(i.id);
          console.warn('Image missing valid ID:', i);
          return null;
        })
        .filter((id: string | null) => id !== null) as string[]
    );
    const primary = imgs.find((i: any) => i.is_primary);
    setPrimaryIndex(primary ? imgs.indexOf(primary) : 0);

    const existingDocs = d.documents || [];
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
    setExistingDocuments(existingDocs);
    setPropertyLoaded(true);

    if (d.available_from) {
      const date = new Date(d.available_from);
      if (!isNaN(date.getTime())) setAvailableFromDate(date);
    }

    // 🔑 Ensure details/contact/etc. are also in formData
    mergePropertyIntoForm(d);

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      appendImagesToFormData(fd);
      appendDocumentsToFormData(fd);
      appendFormFieldsToFormData(fd);
      normalizeSpecialFields(fd);

      const res = isEditing
        ? await api.formPut(`properties/${username}/property/${id}/edit`, fd)
        : await api.properties.create(fd);

      if (res.status >= 200 && res.status < 300) {
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
      <ListingShell
        isEditing={isEditing}
        error={error}
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
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
        propertyId={id}
        username={username}
        availableFromDate={availableFromDate}
        setAvailableFromDate={setAvailableFromDate}
        handlePropertyDataLoaded={handlePropertyDataLoaded}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
        setLocationCoords={setLocationCoords}
        existingDocuments={existingDocuments}
        setExistingDocuments={setExistingDocuments}
      />
    </ListingWizardProvider>
  );
};

/* ---------- Inner shell (has access to wizard context) ---------- */
const ListingShell: React.FC<any> = (props) => {
  const { goto } = useListingWizard();

  return (
    <div className="fixed inset-0 bg-gray-50 pt-24">
      <div className="h-full w-full max-w-7xl mx-auto px-4 lg:px-8 flex flex-col">
        {props.error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 flex-shrink-0">
            <p className="text-sm text-red-700">{props.error}</p>
          </div>
        )}

        {/* Optional trigger to open the modal when editing */}
        {props.isEditing && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => props.setModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Edit Sections
            </button>
          </div>
        )}

        {/* Modal */}
        <EditSectionModal
          isOpen={props.isModalOpen}
          onClose={() => props.setModalOpen(false)}
          onSelectSection={(id: number) => {
            goto(id); // ✅ jump to the exact step immediately

            // ✅ sync the URL with the chosen step (prevents weirdness across reloads/browsers)
            const sp = new URLSearchParams(window.location.search);
            sp.set('step', String(id));
            window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);

            props.setModalOpen(false);
          }}
          propertyTitle={props.isEditing ? 'Edit Listing' : 'New Listing'}
        />

        <div className="flex-1 overflow-hidden">
          <WizardContent
            formData={props.formData}
            setFormData={props.setFormData}
            handleInputChange={props.handleInputChange}
            handleSubmit={props.handleSubmit}
            previewImages={props.previewImages}
            setPreviewImages={props.setPreviewImages}
            primaryIndex={props.primaryIndex}
            setPrimaryIndex={props.setPrimaryIndex}
            existingImageIds={props.existingImageIds}
            setExistingImageIds={props.setExistingImageIds}
            documents={props.documents}
            setDocuments={props.setDocuments}
            countryCode={props.countryCode}
            setCountryCode={props.setCountryCode}
            isSubmitting={props.isSubmitting}
            isEditing={props.isEditing}
            propertyId={props.propertyId}
            username={props.username}
            availableFromDate={props.availableFromDate}
            setAvailableFromDate={props.setAvailableFromDate}
            handlePropertyDataLoaded={props.handlePropertyDataLoaded}
            showCalendar={props.showCalendar}
            setShowCalendar={props.setShowCalendar}
            setLocationCoords={props.setLocationCoords}
            existingDocuments={props.existingDocuments}
            setExistingDocuments={props.setExistingDocuments}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateListing;
