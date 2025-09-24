import React, { useMemo } from 'react';
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

type Props = {
  formData: ListingForm;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  onChange: (e: React.ChangeEvent<any>) => void;

  // Optional in case you want to use them later (CreateListing passes them)
  setLocationCoords?: (coords: { lat: number; lng: number } | null) => void;
  availableFromDate?: Date;
  setAvailableFromDate?: React.Dispatch<React.SetStateAction<Date | undefined>>;
  showCalendar?: boolean;
  setShowCalendar?: React.Dispatch<React.SetStateAction<boolean>>;
};

type PT = 'house_apartment' | 'land' | 'shop' | 'hotel';

// Only use keys that exist on your ListingForm: lotSize, parkingSpaces, floorLevel, etc.
const FIELD_MATRIX: Record<PT, Array<keyof ListingForm>> = {
  house_apartment: [
    'title','price','country','location','propertyStatus',
    'area','lotSize','bedrooms','bathrooms','floorLevel','parkingSpaces','energyRating','yearBuilt',
    'amenities','description'
  ],
  land: [
    'title','price','country','location','propertyStatus',
    'area','lotSize','description'
  ],
  shop: [
    'title','price','country','location','propertyStatus',
    'area','floorLevel','yearBuilt','description'
  ],
  hotel: [
    'title','price','country','location','propertyStatus',
    'area','lotSize','yearBuilt','amenities','description'
  ],
};

const Step2_PropertyDetails: React.FC<Props> = ({
  formData,
  setFormData,
  onChange,
}) => {
  const { next, back } = useListingWizard();
  const ptype = (formData.propertyType || '') as PT;

  const show = useMemo(() => new Set((FIELD_MATRIX[ptype] ?? [])), [ptype]);
  const showField = (k: keyof ListingForm) => show.has(k);

  const validBasics =
    !!formData.title?.trim() &&
    !!formData.price &&
    !!formData.country &&
    !!formData.location?.trim() &&
    !!formData.propertyStatus &&
    !!ptype;

  const validSpecs = (() => {
    if (ptype === 'house_apartment') return !!formData.area && !!formData.bedrooms && !!formData.bathrooms;
    if (ptype === 'land')           return !!formData.area || !!formData.lotSize;
    if (ptype === 'shop')           return !!formData.area;
    if (ptype === 'hotel')          return !!formData.area; // keep minimal to match your ListingForm
    return false;
  })();

  const valid = validBasics && validSpecs;

  const update = (patch: Partial<ListingForm>) =>
    setFormData((f: ListingForm) => ({ ...f, ...patch }));

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-100 pb-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-2">
          <Home className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Property Details</h2>
        <p className="text-gray-600 text-sm">
          Only the relevant fields are shown for <span className="font-semibold">
            {formData.propertyType?.replace('_',' / ')}
          </span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        {/* Title */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Property Title <span className="text-red-500">*</span></label>
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Price (€) <span className="text-red-500">*</span></label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
          <select
            name="country"
            value={formData.country}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="" disabled>Select country</option>
            {COUNTRY_OPTIONS.map((c: { value: string; label: string }) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input
              name="location"
              value={formData.location}
              onChange={onChange}
              placeholder="Type address…"
              className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Property Status <span className="text-red-500">*</span></label>
          <select
            name="propertyStatus"
            value={formData.propertyStatus}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="" disabled>Select status</option>
            {PROPERTY_STATUS.map((s: { value: string; label: string }) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Area */}
        {showField('area') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Area (m²){ptype !== 'land' ? ' *' : ''}</label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
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
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
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
              <Bed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
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
              <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
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
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input
                name="floorLevel"
                value={formData.floorLevel}
                onChange={onChange}
                placeholder="e.g. Ground, 1, 2"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Parking */}
        {showField('parkingSpaces') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Parking Spaces</label>
            <div className="relative">
              <ParkingCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
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
              {['A','B','C','D','E','F','G'].map((r: string) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}

        {/* Year Built */}
        {showField('yearBuilt') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year Built</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
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

        {/* Amenities (house/apartment + hotel) */}
        {(ptype === 'house_apartment' || ptype === 'hotel') && showField('amenities') && (
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amenities</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AMENITIES.map((a: { id: string; label: string }) => {
                const selected = formData.amenities.includes(a.id);
                return (
                  <label key={a.id}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
                      selected ? 'bg-green-50 border-green-400' : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        setFormData((f: ListingForm) => ({
                          ...f,
                          amenities: selected ? f.amenities.filter((x: string) => x !== a.id) : [...f.amenities, a.id],
                        }));
                      }}
                    />
                    <span className="text-sm">{a.label}</span>
                    {selected && <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded">✓</span>}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
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
          <span className="flex items-center">Continue <ChevronRight className="w-5 h-5 ml-2" /></span>
        </button>
      </div>
    </section>
  );
};

export default Step2_PropertyDetails;
