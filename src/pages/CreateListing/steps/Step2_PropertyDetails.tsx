import React, { useMemo, useEffect } from 'react';
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
import { useListingWizard } from '../../../context/ListingWizardContext';
import { ListingForm, PROPERTY_STATUS, COUNTRY_OPTIONS, AMENITIES } from '../../../types';
import LocationAutocomplete from '../../LocationAutocomplete';
import api from '../../../config/api';

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
  land: ['title', 'price', 'country', 'location', 'propertyStatus', 'lotSize', 'description'],
  house: [
    'title',
    'price',
    'country',
    'location',
    'propertyStatus',
    'area',
    'lotSize',
    'bedrooms',
    'bathrooms',
    'floorLevel',
    'totalFloors',
    'parkingSpaces',
    'energyRating',
    'yearBuilt',
    'amenities',
    'description'
  ],
  apartment: [
    'title',
    'price',
    'country',
    'location',
    'propertyStatus',
    'area',
    'bedrooms',
    'bathrooms',
    'floorLevel',
    'totalFloors',
    'parkingSpaces',
    'energyRating',
    'yearBuilt',
    'amenities',
    'description'
  ],
  condo: [
    'title',
    'price',
    'country',
    'location',
    'propertyStatus',
    'area',
    'bedrooms',
    'bathrooms',
    'floorLevel',
    'totalFloors',
    'parkingSpaces',
    'energyRating',
    'yearBuilt',
    'amenities',
    'description'
  ],
  townhouse: [
    'title',
    'price',
    'country',
    'location',
    'propertyStatus',
    'area',
    'lotSize',
    'bedrooms',
    'bathrooms',
    'floorLevel',
    'totalFloors',
    'parkingSpaces',
    'energyRating',
    'yearBuilt',
    'amenities',
    'description'
  ],
  hotel: [
    'title',
    'price',
    'country',
    'location',
    'propertyStatus',
    'area',
    'totalFloors',
    'energyRating',
    'yearBuilt',
    'amenities',
    'description'
  ],
  shop: [
    'title',
    'price',
    'country',
    'location',
    'propertyStatus',
    'area',
    'floorLevel',
    'totalFloors',
    'energyRating',
    'yearBuilt',
    'description'
  ],
  office: [
    'title',
    'price',
    'country',
    'location',
    'propertyStatus',
    'area',
    'floorLevel',
    'totalFloors',
    'energyRating',
    'yearBuilt',
    'description'
  ],
  residential_building: [
    'title',
    'price',
    'country',
    'location',
    'propertyStatus',
    'area',
    'totalFloors',
    'energyRating',
    'yearBuilt',
    'amenities',
    'description'
  ]
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
  username
}) => {
  const { next, back } = useListingWizard();
  const ptype = (formData.propertyType || '') as PT;
  const [hasLoadedData, setHasLoadedData] = React.useState(false);

  const show = useMemo(() => new Set(FIELD_MATRIX[ptype] ?? []), [ptype]);
  const showField = (k: keyof ListingForm) => show.has(k);

  // Load property details when editing (only once)
  useEffect(() => {
    if (!isEditing || !propertyId || !username || hasLoadedData) return;

    console.log('🔄 Step2: Loading property data...');
    setHasLoadedData(true);

    api.properties
      .getUserProperty(username, Number(propertyId))
      .then((res) => {
        const d = res.data ?? res;

        // Normalize property status to FE values
        let propertyStatus = d.property_status ?? '';
        if (propertyStatus === 'for_sale') propertyStatus = 'forSale';
        if (propertyStatus === 'for_rent') propertyStatus = 'forRent';

        // Parse contact phone → separate dial code + local number
        let rawPhone: string = (d.contact_phone ?? '').toString().trim();
        let cc = countryCode ?? '+357';
        if (rawPhone) {
          const m = rawPhone.match(/^\+\d{1,4}/);
          if (m && m[0]) {
            cc = m[0];
            rawPhone = rawPhone.replace(m[0], '').trim();
          }
        }
        if (setCountryCode) setCountryCode(cc);

        console.log('📋 Step2: Loaded amenities:', d.amenities);

        // Merge into formData (use ?? so undefined/null do not overwrite)
        setFormData((prev) => ({
          ...prev,

          // core
          title: d.title ?? prev.title ?? '',
          description: d.description ?? prev.description ?? '',
          price: (d.price ?? prev.price ?? '').toString(),
          location: d.location ?? prev.location ?? '',
          country: d.country ?? prev.country ?? 'Cyprus',
          region: d.region ?? prev.region ?? '',
          city: d.city ?? prev.city ?? '',
          postal_code: d.postal_code ?? prev.postal_code ?? '',
          street: d.street ?? prev.street ?? '',
          latitude: (d.latitude ?? prev.latitude ?? '').toString(),
          longitude: (d.longitude ?? prev.longitude ?? '').toString(),
          propertyType: d.property_type ?? prev.propertyType ?? '',

          // specs
          bedrooms: (d.bedrooms ?? prev.bedrooms ?? '').toString(),
          bathrooms: (d.bathrooms ?? prev.bathrooms ?? '').toString(),
          area: (d.area ?? prev.area ?? '').toString(),
          lotSize: (d.lot_size ?? prev.lotSize ?? '').toString(),
          parkingSpaces: (d.parking_spaces ?? prev.parkingSpaces ?? '').toString(),
          energyRating: d.energy_rating ?? prev.energyRating ?? '',
          yearBuilt: (d.year_built ?? prev.yearBuilt ?? '').toString(),
          constructionMaterial: d.construction_material ?? prev.constructionMaterial ?? '',
          floorLevel: (d.floor_level ?? prev.floorLevel ?? '').toString(),
          totalFloors: (d.total_floors ?? prev.totalFloors ?? '').toString(),
          amenities: Array.isArray(d.amenities) ? d.amenities : prev.amenities ?? [],

          // status & dates
          propertyStatus: (propertyStatus as any) ?? prev.propertyStatus ?? '',
          availableFrom: d.available_from ?? prev.availableFrom ?? '',

          // contact
          contactPhone: rawPhone ?? prev.contactPhone ?? '',
          contactEmail: d.contact_email ?? prev.contactEmail ?? '',

          // media
          virtualTourUrl: d.virtual_tour_url ?? prev.virtualTourUrl ?? '',
          videoUrl: d.video_url ?? prev.videoUrl ?? '',

          // misc
          images: [],
          userType: d.user_type ?? prev.userType ?? 'owner_agent'
        }));

        // Let parent populate images/documents, etc.
        onPropertyDataLoaded?.(d);

        console.log('✅ Step2: Property data loaded successfully');
      })
      .catch((err) => {
        console.error('❌ Error loading property details:', err);
        setHasLoadedData(false); // allow retry
      });
  }, [isEditing, propertyId, username, hasLoadedData]); // keep deps stable

  const validBasics =
    !!formData.title?.trim() &&
    !!formData.price &&
    !!formData.country &&
    !!formData.location?.trim() &&
    !!formData.propertyStatus &&
    !!ptype;

  const validSpecs = (() => {
    if (['house', 'apartment', 'condo', 'townhouse'].includes(ptype))
      return !!formData.area && !!formData.bedrooms && !!formData.bathrooms;
    if (ptype === 'land') return !!formData.lotSize; // Land requires lot_size, not area
    if (['hotel', 'shop', 'office', 'residential_building'].includes(ptype)) return !!formData.area;
    return false;
  })();

  const valid = validBasics && validSpecs;

  const update = (patch: Partial<ListingForm>) => setFormData((f) => ({ ...f, ...patch }));

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
          <span className="font-semibold">{formData.propertyType?.replace('_', ' / ')}</span>.
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
            onChange={onChange}
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
              onChange={onChange}
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
            onChange={onChange}
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
                    country: structured.country ?? formData.country,
                    region: structured.region ?? '',
                    city: structured.city ?? '',
                    postal_code: structured.postal_code ?? '',
                    street: structured.street ?? ''
                  })
                });
                setLocationCoords?.({ lat, lng });
              }}
              selectedCountry={formData.country}
              placeholder="Type address…"
              inputClassName="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Status <span className="text-red-500">*</span>
          </label>
          <select
            name="propertyStatus"
            value={formData.propertyStatus}
            onChange={onChange}
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
              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((r: string) => (
                <option key={r} value={r}>
                  {r}
                </option>
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
        {(['house', 'apartment', 'condo', 'townhouse', 'hotel', 'residential_building'].includes(ptype)) &&
          showField('amenities') && (
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Amenities
                {formData.amenities && formData.amenities.length > 0 && (
                  <span className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    {formData.amenities.length} selected
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {AMENITIES.map((a: { id: string; label: string; category: string }) => {
                  const selected = Array.isArray(formData.amenities) && formData.amenities.includes(a.id);

                  return (
                    <label
                      key={a.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selected
                          ? 'bg-green-50 border-green-500 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selected}
                        onChange={() => {
                          const newAmenities = selected
                            ? formData.amenities.filter((x: string) => x !== a.id)
                            : [...(formData.amenities || []), a.id];

                          setFormData((f: ListingForm) => ({
                            ...f,
                            amenities: newAmenities
                          }));
                        }}
                      />
                      <span className={`text-sm font-medium ${selected ? 'text-green-700' : 'text-gray-700'}`}>
                        {a.label}
                      </span>
                      {selected && (
                        <span className="text-xs px-2 py-1 bg-green-600 text-white rounded font-bold">✓</span>
                      )}
                    </label>
                  );
                })}
              </div>
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
            onChange={onChange}
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
          onClick={next}
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

export default Step2_PropertyDetails;
