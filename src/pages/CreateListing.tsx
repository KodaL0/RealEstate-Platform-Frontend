// src/pages/CreateListing.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

import api from '../config/api';
import { useUser } from '../context/UserContext';

import { ListingWizardProvider, useListingWizard } from '../context/ListingWizardContext';
import ProgressBar from '../components/ProgressBar';

import Step1_UserType   from './CreateListing/steps/Step1_UserType';
import Step2_Developer  from './CreateListing/steps/Step2_Developer';
import Step2_OwnerAgent from './CreateListing/steps/Step2_OwnerAgent';
import Step3_Images     from './CreateListing/steps/Step3_Images';
import Step4_Contact    from './CreateListing/steps/Step4_Contact';

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

const step2 =
  props.formData.userType === 'developer' ? (
    <Step2_Developer
      formData={props.formData}
      setFormData={props.setFormData}
      onChange={props.handleInputChange}
      availableFromDate={props.availableFromDate}
      setAvailableFromDate={props.setAvailableFromDate}
      showCalendar={props.showCalendar}
      setShowCalendar={props.setShowCalendar}
      setLocationCoords={props.setLocationCoords}
    />
  ) : (
    <Step2_OwnerAgent
      formData={props.formData}
      setFormData={props.setFormData}
      onChange={props.handleInputChange}
      availableFromDate={props.availableFromDate}
      setAvailableFromDate={props.setAvailableFromDate}
      showCalendar={props.showCalendar}
      setShowCalendar={props.setShowCalendar}
      setLocationCoords={props.setLocationCoords}
    />
  );

  const steps = [
    <Step1_UserType formData={props.formData} setFormData={props.setFormData} />,
    step2,
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
    <form onSubmit={props.handleSubmit} noValidate>
      <ProgressBar />
      <div className="mt-6">{steps[currentStep]}</div>
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ListingForm>(DEFAULT_FORM_STATE);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);
  
  // Step 2 date picker states
  const [availableFromDate, setAvailableFromDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);



  const onDrop = useCallback((files: File[]) => {
    setFormData((p: ListingForm) => ({ ...p, images: [...p.images, ...files] }));
    setPreviewImages((p: string[]) => [...p, ...files.map(f => URL.createObjectURL(f))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024,
  });

  const removeImage = (idx: number) => {
    setFormData((p: ListingForm) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
    if (idx < previewImages.length) URL.revokeObjectURL(previewImages[idx]);
    setPreviewImages((p: string[]) => p.filter((_, i) => i !== idx));
    setExistingImageIds((p: string[]) => p.filter((_, i) => i !== idx));
    setPrimaryIndex((i: number) => (idx === i ? 0 : idx < i ? i - 1 : i));
  };

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev: ListingForm) => {
      let updated: ListingForm = { ...prev, [name]: value } as ListingForm;
      if (name === 'propertyType') {
        updated =
          value === 'land'
            ? { ...updated, bedrooms: '0', bathrooms: '0', yearBuilt: '' }
            : { ...updated, bedrooms: '', bathrooms: '', yearBuilt: '' };
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

      // images
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
            if (i === primaryIndex) fd.append('primary_image_id', existingImageIds[i] || url);
          }
        });
      }
      fd.append('primary_is_first', 'true');

      // other fields
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

      fd.set('contactPhone', `${countryCode} ${formData.contactPhone}`.trim());
      
      // Use coordinates from form data if available, otherwise from locationCoords state
      if (formData.latitude && formData.longitude) {
        fd.set('latitude', formData.latitude);
        fd.set('longitude', formData.longitude);
      } else if (locationCoords) {
        fd.append('latitude', String(locationCoords.lat));
        fd.append('longitude', String(locationCoords.lng));
      }

      const res = isEditing
        ? await api.formPut(`properties/${username}/property/${id}/edit`, fd)
        : await api.properties.create(fd);

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

  return (
    <ListingWizardProvider>
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-6xl">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

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
    </ListingWizardProvider>
  );
};

export default CreateListing;
