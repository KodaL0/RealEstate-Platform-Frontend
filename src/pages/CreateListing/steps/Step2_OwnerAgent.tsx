import React from 'react';
import {
  CalendarIcon,
  MapPin,
  Building2,
  Bed,
  Bath,
  DotSquare as SquareFootage,
  Euro,
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

  const valid =
    formData.title.trim() &&
    formData.description.trim() &&
    Number(formData.price) > 0 &&
    formData.propertyType &&
    formData.propertyStatus &&
    formData.location.trim();

  const toggleAmenity = (id: string) =>
    setFormData((f: ListingForm) => ({
      ...f,
      amenities: f.amenities.includes(id)
        ? f.amenities.filter((x: string) => x !== id)
        : [...f.amenities, id],
    }));

  return (
    <section className="bg-gray-50 p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6">Property Details</h2>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          name="title"
          value={formData.title}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g., Luxurious Waterfront Penthouse"
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onChange}
          rows={4}
          className="w-full border rounded px-3 py-2"
          placeholder="Provide a detailed description…"
        />
      </div>

      {/* Price */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Price (€) *</label>
        <div className="relative">
          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={onChange}
            className="w-full border rounded pl-10 pr-3 py-2"
            min={0}
            step="0.01"
          />
        </div>
      </div>

      {/* Location with Map autocomplete */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Location *</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <LocationAutocomplete
            value={formData.location}
            onChange={(val: string) => setFormData(f => ({ ...f, location: val }))}
            onSelect={(addr: string, lat: number, lng: number) => {
              setFormData(f => ({ ...f, location: addr }));
              setLocationCoords({ lat, lng });
            }}
            placeholder="Type address…"
            className="pl-10"
          />
        </div>
      </div>

      {/* Property type / status / area etc */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm mb-1">Property Type *</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={onChange}
              className="w-full border rounded px-3 py-2 pl-10"
            >
              <option value="" disabled>Select</option>
              {PROPERTY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Status *</label>
          <select
            name="propertyStatus"
            value={formData.propertyStatus}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="" disabled>Select</option>
            {PROPERTY_STATUS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Area (m²) *</label>
          <div className="relative">
            <SquareFootage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              name="area"
              value={formData.area}
              onChange={onChange}
              className="w-full border rounded px-3 py-2 pl-10"
              min={0}
            />
          </div>
        </div>

        {/* Beds */}
        <div>
          <label className="block text-sm mb-1">Bedrooms *</label>
          <div className="relative">
            <Bed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={onChange}
              className="w-full border rounded px-3 py-2 pl-10"
              disabled={formData.propertyType === 'land'}
              min={0}
            />
          </div>
        </div>

        {/* Baths */}
        <div>
          <label className="block text-sm mb-1">Bathrooms *</label>
          <div className="relative">
            <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              step="0.5"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={onChange}
              className="w-full border rounded px-3 py-2 pl-10"
              disabled={formData.propertyType === 'land'}
              min={0}
            />
          </div>
        </div>

        {/* Year Built */}
        <div>
          <label className="block text-sm mb-1">Year Built *</label>
          <input
            type="number"
            name="yearBuilt"
            value={formData.yearBuilt}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
            disabled={formData.propertyType === 'land'}
            min={1800}
            max={new Date().getFullYear()}
          />
        </div>
      </div>

      {/* Available From with DayPicker */}
      <div className="relative mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Available From *
        </label>
        <button
          type="button"
          onClick={() => setShowCalendar(v => !v)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-left"
        >
          <div className="flex items-center justify-between">
            <span>{availableFromDate ? format(availableFromDate, 'yyyy-MM-dd') : 'Select date'}</span>
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
                setFormData(f => ({
                  ...f,
                  availableFrom: date ? format(date, 'yyyy-MM-dd') : '',
                }));
                setShowCalendar(false);
              }}
              disabled={{ before: new Date() }}
            />
          </div>
        )}
      </div>

      {/* Amenities */}
      <h3 className="text-xl font-semibold mt-8 mb-4">Amenities</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {AMENITIES.map(a => (
          <label key={a.id} className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={formData.amenities.includes(a.id)}
              onChange={() => toggleAmenity(a.id)}
              className="h-4 w-4 text-blue-600"
            />
            <span>{a.label}</span>
          </label>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={back}
          className="px-4 py-2 border rounded"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={next}
          className={`px-4 py-2 rounded text-white ${
            valid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default Step2_OwnerAgent;
