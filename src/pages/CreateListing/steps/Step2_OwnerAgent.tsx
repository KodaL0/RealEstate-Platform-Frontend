import React from 'react';
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
    <section className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-100 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
          <Home className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Property Details</h2>
        <p className="text-gray-600 text-lg">Tell us about your property</p>
      </div>

      <div className="space-y-8">
        {/* Basic Information Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            Basic Information
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                <LocationAutocomplete
                  value={formData.location}
                  onChange={(val: string) => setFormData(f => ({ ...f, location: val }))}
                  onSelect={(addr: string, lat: number, lng: number) => {
                    setFormData(f => ({ ...f, location: addr }));
                    setLocationCoords({ lat, lng });
                  }}
                  placeholder="Type address…"
                  inputClassName="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                />
              </div>
            </div>
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
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Home className="w-5 h-5 mr-2 text-blue-600" />
            Property Specifications
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              onClick={() => setShowCalendar(v => !v)}
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
                  className="rdp-custom"
                />
              </div>
            )}
          </div>
        </div>

        {/* Amenities Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Home className="w-5 h-5 mr-2 text-blue-600" />
            Property Amenities
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {AMENITIES.map(a => (
              <label key={a.id} className="group flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(a.id)}
                    onChange={() => toggleAmenity(a.id)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                    formData.amenities.includes(a.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300 group-hover:border-blue-400'
                  }`}>
                    {formData.amenities.includes(a.id) && (
                      <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-200">
                  {a.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
        <button 
          type="button" 
          onClick={back} 
          className="group inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>
        
        <button
          type="button"
          disabled={!valid}
          onClick={next}
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

      {/* Progress Indicator */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
          <span className="ml-3">Step 2 of 4</span>
        </div>
      </div>
    </section>
  );
};

export default Step2_OwnerAgent;