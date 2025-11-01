import React, { useMemo, useEffect, memo, useCallback } from 'react';
import {
  Home,
  Bed,
  Bath,
  Ruler,
  ParkingCircle,
  Calendar,
  Layers,
  MapPin,
  Euro,
  Hash,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useWizardNavigation } from '../../../context/ListingWizardContext';
import { ListingForm, PROPERTY_STATUS, COUNTRY_OPTIONS } from '../../../types';
import LocationAutocomplete from '../../LocationAutocomplete';
import AmenitySelector from '../../../components/AmenitySelector';
import api from '../../../config/api';
import toast from 'react-hot-toast';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

type Props = {
  formData: ListingForm;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  onChange: (e: React.ChangeEvent<any>) => void;
  setLocationCoords?: (coords: { lat: number; lng: number } | null) => void;
  availableFromDate?: Date;
  setAvailableFromDate?: React.Dispatch<React.SetStateAction<Date | undefined>>;
  showCalendar?: boolean;
  setShowCalendar?: React.Dispatch<React.SetStateAction<boolean>>;
  
  // For edit mode
  isEditing?: boolean;
  propertyId?: string;
  onPropertyDataLoaded?: (data: any) => void;
  countryCode?: string;
  setCountryCode?: (code: string) => void;
  username?: string;
  hasLoadedPropertyData?: boolean;
};

type PT =
  | 'house'
  | 'apartment'
  | 'condo'
  | 'townhouse'
  | 'land'
  | 'hotel'
  | 'shop'
  | 'office'
  | 'residential_building';

// Only use keys that exist on your ListingForm
const FIELD_MATRIX: Record<PT, Array<keyof ListingForm>> = {
  land: [
    'title','price','country','location','propertyStatus',
    'lotSize','description'
  ],
  house: [
    'title','price','country','location','propertyStatus',
    'area','lotSize','bedrooms','bathrooms','floorLevel','totalFloors',
    'parkingSpaces','energyRating','yearBuilt','amenities','description'
  ],
  apartment: [
    'title','price','country','location','propertyStatus',
    'area','bedrooms','bathrooms','floorLevel','totalFloors',
    'parkingSpaces','energyRating','yearBuilt','amenities','description'
  ],
  condo: [
    'title','price','country','location','propertyStatus',
    'area','bedrooms','bathrooms','floorLevel','totalFloors',
    'parkingSpaces','energyRating','yearBuilt','amenities','description'
  ],
  townhouse: [
    'title','price','country','location','propertyStatus',
    'area','lotSize','bedrooms','bathrooms','floorLevel','totalFloors',
    'parkingSpaces','energyRating','yearBuilt','amenities','description'
  ],
  hotel: [
    'title','price','country','location','propertyStatus',
    'area','totalFloors','energyRating','yearBuilt','amenities','description'
  ],
  shop: [
    'title','price','country','location','propertyStatus',
    'area','floorLevel','totalFloors','energyRating','yearBuilt','description'
  ],
  office: [
    'title','price','country','location','propertyStatus',
    'area','floorLevel','totalFloors','energyRating','yearBuilt','description'
  ],
  residential_building: [
    'title','price','country','location','propertyStatus',
    'area','totalFloors','energyRating','yearBuilt','amenities','description'
  ],
};


const Step2_PropertyDetails: React.FC<Props> = ({
  formData,
  setFormData,
  onChange,
  setLocationCoords,
  isEditing = false,
  propertyId,
  onPropertyDataLoaded,
  countryCode,
  setCountryCode,
  username,
  hasLoadedPropertyData = false,
}) => {
  const { next, back } = useWizardNavigation();
  const ptype = (formData.propertyType || '') as PT;
  const [hasLoadedData, setHasLoadedData] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  const show = useMemo(() => new Set((FIELD_MATRIX[ptype] ?? [])), [ptype]);
  const showField = (k: keyof ListingForm) => show.has(k);

  // Debug logging for amenities visibility
  useEffect(() => {
    if (isEditing) {
      const shouldShowAmenities = showField('amenities');
      const isInAmenitiesList = ['house', 'apartment', 'condo', 'townhouse', 'hotel', 'residential_building'].includes(ptype);
      console.log('🔍 Step2 Debug:', {
        ptype,
        propertyType: formData.propertyType,
        'showField(amenities)': shouldShowAmenities,
        'amenities in ptype list': isInAmenitiesList,
        'will render': isInAmenitiesList && (shouldShowAmenities || (isEditing && formData.propertyType)),
        amenitiesCount: Array.isArray(formData.amenities) ? formData.amenities.length : 0,
      });
    }
  }, [isEditing, ptype, formData.propertyType, formData.amenities]);

  // Disable initial load flag after a short delay to allow data to populate
  useEffect(() => {
    if (isEditing && hasLoadedPropertyData && isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        console.log('✅ Step2: Initial load complete, PATCH updates enabled');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEditing, hasLoadedPropertyData, isInitialLoad]);

  // Load property details when editing (only if not already loaded by parent)
  useEffect(() => {
    if (!isEditing || !propertyId || !username || hasLoadedData || hasLoadedPropertyData) return;
    
    console.log('🔄 Step2: Loading property data...');
    setHasLoadedData(true);
    
    api.properties
      .getUserProperty(username, Number(propertyId))
      .then(res => {
        const d = res.data;
        
        // Normalize property status
        let propertyStatus = d.property_status || '';
        if (propertyStatus === 'for_sale') propertyStatus = 'forSale';
        if (propertyStatus === 'for_rent') propertyStatus = 'forRent';

        // Parse contact phone to extract country code
        let phone = d.contact_phone || '';
        let cc = countryCode || '+357';
        const m = phone.match(/^\+[\d]{1,4}/);
        if (m) {
          cc = m[0];
          phone = phone.replace(cc, '').trim();
        }
        if (setCountryCode) {
          setCountryCode(cc);
        }

        console.log('📋 Step2: Loaded amenities:', d.amenities);
        console.log('📋 Step2: Property type from API:', d.property_type);
        
        // Update form data with property details
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
          userType: d.user_type || prev.userType || 'owner_agent',
        }));

        // Call callback to let parent handle images and other data
        if (onPropertyDataLoaded) {
          onPropertyDataLoaded(d);
        }
        
        console.log('✅ Step2: Property data loaded successfully');
      })
      .catch(err => {
        console.error('❌ Error loading property details:', err);
        setHasLoadedData(false); // Reset on error so user can retry
      });
  }, [isEditing, propertyId, username, hasLoadedData]); // Removed changing dependencies

  const validBasics =
    !!formData.title?.trim() &&
    !!formData.price &&
    !!formData.country &&
    !!formData.location?.trim() &&
    !!formData.city?.trim() &&  // ← ADDED: Ensure city is populated from dropdown selection
    !!formData.propertyStatus &&
    !!ptype;

  const validSpecs = (() => {
    if (['house', 'apartment', 'condo', 'townhouse'].includes(ptype))
      return !!formData.area && !!formData.bedrooms && !!formData.bathrooms;
    if (ptype === 'land')
      return !!formData.lotSize; // Land requires lot_size, not area
    if (['hotel', 'shop', 'office', 'residential_building'].includes(ptype))
      return !!formData.area;
    return false;
  })();

  const valid = validBasics && validSpecs;

  const update = (patch: Partial<ListingForm>) =>
    setFormData((f: ListingForm) => ({ ...f, ...patch }));

  // Enhanced next handler with location validation
  const handleNext = () => {
    // Check basic validation first
    if (!validBasics || !validSpecs) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate city field specifically
    if (!formData.city || formData.city.trim() === '') {
      toast.error(
        'Please enter a city name. You can select from the dropdown or enter it manually below.',
        { duration: 5000 }
      );
      return;
    }
    
    // All validations passed - proceed to next step
    next();
  };

  // Debounced PATCH update for property details
  const debouncedUpdate = useCallback(
    debounce(async (fieldName: string, value: any) => {
      if (isEditing && propertyId && username && !isInitialLoad) {
        try {
          const details: Record<string, any> = { [fieldName]: value };
          await api.properties.updatePropertyDetails(username, Number(propertyId), details);
          console.log(`✅ ${fieldName} updated via PATCH`);
        } catch (error: any) {
          console.error(`❌ Failed to update ${fieldName}:`, error);
          toast.error(error?.response?.data?.detail || `Failed to update ${fieldName}`);
        }
      }
    }, 1500), // 1.5 second debounce
    [isEditing, propertyId, username, isInitialLoad]
  );

  // Enhanced onChange handler that includes PATCH updates
  const handleChangeWithPatch = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    
    // Update local state immediately
    onChange(e);
    
    // If editing and not initial load, also update via PATCH (debounced)
    if (isEditing && propertyId && username && !isInitialLoad) {
      debouncedUpdate(name, value);
    }
  };

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-100 pb-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-2">
          <Home className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Property Details</h2>
        <p className="text-gray-600 text-sm">
          Only the relevant fields are shown for{' '}
          <span className="font-semibold">
            {formData.propertyType?.replace('_', ' / ')}
          </span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        {/* Title */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChangeWithPatch}
            placeholder="e.g. Modern 2BR Apartment in City Center"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Price (€) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChangeWithPatch}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
          <select
            name="country"
            value={formData.country}
            onChange={handleChangeWithPatch}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="" disabled>
              Select country
            </option>
            {COUNTRY_OPTIONS.map((c: { value: string; label: string }) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location (Mapbox autocomplete) */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
            <LocationAutocomplete
              value={formData.location}
              onChange={(val: string) => update({ location: val })}
              onSelect={(addr: string, lat: number, lng: number, structured?: any) => {
                update({
                  location: addr,
                  latitude: lat.toString(),
                  longitude: lng.toString(),
                  ...(structured && {
                    country: structured.country || formData.country,
                    region: structured.region || '',
                    city: structured.city || '',
                    postal_code: structured.postal_code || '',
                    street: structured.street || ''
                  }),
                });
                setLocationCoords?.({ lat, lng });
              }}
              selectedCountry={formData.country}
              placeholder="Start typing address..."
              inputClassName="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            />
          </div>
        </div>

        {/* Location Details - Auto-filled from autocomplete, editable */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city || ''}
            onChange={handleChangeWithPatch}
            placeholder="e.g., Παραλίμνι"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Region
          </label>
          <input
            type="text"
            name="region"
            value={formData.region || ''}
            onChange={handleChangeWithPatch}
            placeholder="e.g., Famagusta"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Postal Code
          </label>
          <input
            type="text"
            name="postal_code"
            value={formData.postal_code || ''}
            onChange={handleChangeWithPatch}
            placeholder="e.g., 5290"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Street Address
          </label>
          <input
            type="text"
            name="street"
            value={formData.street || ''}
            onChange={handleChangeWithPatch}
            placeholder="e.g., Filellinon"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Status <span className="text-red-500">*</span>
          </label>
          <select
            name="propertyStatus"
            value={formData.propertyStatus}
            onChange={handleChangeWithPatch}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="" disabled>
              Select status
            </option>
            {PROPERTY_STATUS.map((s: { value: string; label: string }) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Area */}
        {showField('area') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Area (m²){ptype !== 'land' ? ' *' : ''}
            </label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Lot Size */}
        {showField('lotSize') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lot Area (m²)</label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="lotSize"
                value={formData.lotSize}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Bedrooms */}
        {showField('bedrooms') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
            <div className="relative">
              <Bed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Bathrooms */}
        {showField('bathrooms') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bathrooms</label>
            <div className="relative">
              <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Floor */}
        {showField('floorLevel') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Floor</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="floorLevel"
                value={formData.floorLevel}
                onChange={onChange}
                placeholder="e.g. 0, 1, 2"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Total Floors */}
        {showField('totalFloors') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Total Floors</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="totalFloors"
                value={formData.totalFloors}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Parking */}
        {showField('parkingSpaces') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Parking Spaces</label>
            <div className="relative">
              <ParkingCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="parkingSpaces"
                value={formData.parkingSpaces}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Energy Rating */}
        {showField('energyRating') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Energy Rating</label>
            <select
              name="energyRating"
              value={formData.energyRating || ''}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select</option>
              {['A','B','C','D','E','F','G'].map((r: string) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {/* Year Built */}
        {showField('yearBuilt') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year Built</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="yearBuilt"
                value={formData.yearBuilt}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={1800}
                max={2100}
              />
            </div>
          </div>
        )}

        {/* Amenities */}
        {(['house', 'apartment', 'condo', 'townhouse', 'hotel', 'residential_building'].includes(ptype) &&
          (showField('amenities') || (isEditing && formData.propertyType))) && (
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Amenities
              {formData.amenities && formData.amenities.length > 0 && (
                <span className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  {formData.amenities.length} selected
                </span>
              )}
            </label>
            <AmenitySelector
              selectedAmenities={Array.isArray(formData.amenities) ? formData.amenities : []}
              onChange={(amenities) => {
                setFormData((f: ListingForm) => ({
                  ...f,
                  amenities: amenities,
                }));
                
                // If editing and not initial load, also update via PATCH (debounced)
                if (isEditing && propertyId && username && !isInitialLoad) {
                  debouncedUpdate('amenities', amenities);
                }
              }}
            />
          </div>
        )}

        {/* Description */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChangeWithPatch}
            rows={4}
            placeholder="Describe the property..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Nav */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={back}
          className="group inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={handleNext}
          className={`group px-8 py-4 rounded-xl font-semibold text-white ${
            valid ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center">
            Continue <ChevronRight className="w-5 h-5 ml-2" />
          </span>
        </button>
      </div>
    </section>
  );
};

export default memo(Step2_PropertyDetails);
