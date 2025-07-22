import React from 'react';
import {
  CalendarIcon,
  MapPin,
  Building2,
  Plus,
  Trash2,
  Home,
  Waves,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

import { useListingWizard } from '../../../context/ListingWizardContext';
import {
  ListingForm,
  DevUnitRow,
  DEV_AMENITIES,
} from '../../../types';

import LocationAutocomplete from '../../LocationAutocomplete';

interface Props {
  formData: ListingForm;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  onChange: (e: React.ChangeEvent<any>) => void;

  // extras
  availableFromDate: Date | undefined;
  setAvailableFromDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  showCalendar: boolean;
  setShowCalendar: React.Dispatch<React.SetStateAction<boolean>>;
  setLocationCoords: (v: { lat: number; lng: number } | null) => void;
}

const Step2_Developer: React.FC<Props> = ({
  formData,
  setFormData,
  onChange,
  availableFromDate,
  setAvailableFromDate,
  showCalendar,
  setShowCalendar,
  setLocationCoords,
}) => {
  const { next, back } = useListingWizard();

  /* ---------- Units table helpers ---------- */
  const updateRow = (idx: number, key: keyof DevUnitRow, value: any) => {
    setFormData(f => {
      const rows = [...f.devUnits];
      const row = { ...rows[idx], [key]: value } as DevUnitRow;
      const internal = Number(row.internalArea) || 0;
      const veranda  = Number(row.verandaArea) || 0;
      row.totalArea  = internal + veranda || '';
      rows[idx] = row;
      return { ...f, devUnits: rows };
    });
  };

  const addRow = () =>
    setFormData(f => ({
      ...f,
      devUnits: [
        ...f.devUnits,
        { unitBlock: '', beds: '', baths: '', internalArea: '', verandaArea: '', totalArea: '', pool: false },
      ],
    }));

  const removeRow = (idx: number) =>
    setFormData(f => ({
      ...f,
      devUnits: f.devUnits.filter((_, i) => i !== idx),
    }));

  /* ---------- Amenities ---------- */
  const toggleAmenity = (id: string) =>
    setFormData(f => ({
      ...f,
      amenities: f.amenities.includes(id)
        ? f.amenities.filter(x => x !== id)
        : [...f.amenities, id],
    }));

  /* ---------- Validation ---------- */
  const baseValid = formData.title.trim() && formData.description.trim() && formData.location.trim();
  const tableValid = formData.devUnits.length > 0 && formData.devUnits.every(r => r.unitBlock.trim());
  const valid = baseValid && tableValid;

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-100 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Project Details</h2>
        <p className="text-gray-600 text-lg">Tell us about your development project</p>
      </div>

      <div className="space-y-8">
        {/* Basic Information Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Home className="w-5 h-5 mr-2 text-blue-600" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={onChange}
                placeholder="Enter your project name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              />
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
              placeholder="Describe your development project..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white resize-none"
            />
          </div>

          {/* Available From */}
          <div className="relative mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Delivery / Available From (optional)
            </label>
            <button
              type="button"
              onClick={() => setShowCalendar(v => !v)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left transition-all duration-200 hover:border-gray-400"
            >
              <div className="flex items-center justify-between">
                <span className={availableFromDate ? 'text-gray-900' : 'text-gray-500'}>
                  {availableFromDate ? format(availableFromDate, 'MMMM dd, yyyy') : 'Select delivery date'}
                </span>
                <CalendarIcon className="ml-2 h-5 w-5 text-gray-400" />
              </div>
            </button>

            {showCalendar && (
              <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
                <DayPicker
                  mode="single"
                  selected={availableFromDate}
                  onSelect={date => {
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

        {/* Units Table Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              Units Configuration
            </h3>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Unit
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                  <th className="px-4 py-4 text-left font-semibold">UNIT & BLOCK</th>
                  <th className="px-4 py-4 text-center font-semibold">BEDS</th>
                  <th className="px-4 py-4 text-center font-semibold">BATHS</th>
                  <th className="px-4 py-4 text-center font-semibold">INTERNAL AREA (m²)</th>
                  <th className="px-4 py-4 text-center font-semibold">VERANDA AREA (m²)</th>
                  <th className="px-4 py-4 text-center font-semibold">TOTAL AREA (m²)</th>
                  <th className="px-4 py-4 text-center font-semibold">POOL</th>
                  <th className="px-4 py-4 text-center font-semibold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formData.devUnits.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-4">
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={row.unitBlock}
                        onChange={e => updateRow(i, 'unitBlock', e.target.value)}
                        placeholder="e.g., A1, B2"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center"
                        value={row.beds}
                        min={0}
                        onChange={e => updateRow(i, 'beds', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center"
                        value={row.baths}
                        min={0}
                        step={0.5}
                        onChange={e => updateRow(i, 'baths', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center"
                        value={row.internalArea}
                        min={0}
                        onChange={e => updateRow(i, 'internalArea', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center"
                        value={row.verandaArea}
                        min={0}
                        onChange={e => updateRow(i, 'verandaArea', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-center font-semibold text-gray-700"
                        value={row.totalArea}
                        readOnly
                        placeholder="Auto"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.pool}
                          onChange={e => updateRow(i, 'pool', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative w-6 h-6 rounded-md border-2 transition-all duration-200 ${
                          row.pool 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}>
                          {row.pool && (
                            <Waves className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                          )}
                        </div>
                      </label>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {formData.devUnits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {formData.devUnits.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No units added yet</p>
              <p className="text-sm">Click "Add Unit" to get started</p>
            </div>
          )}
        </div>

        {/* Amenities Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Home className="w-5 h-5 mr-2 text-blue-600" />
            Project Amenities
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEV_AMENITIES.map(a => (
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

export default Step2_Developer;