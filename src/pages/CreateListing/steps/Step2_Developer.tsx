// src/pages/CreateListing/steps/Step2_Developer.tsx
import React from 'react';
import {
  CalendarIcon,
  MapPin,
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
    <section className="bg-gray-50 p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6">Project Details</h2>

      {/* Project name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Project Name *</label>
        <input
          name="title"
          value={formData.title}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
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
        />
      </div>

      {/* Location + autocomplete */}
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
            inputClassName="pl-10"
          />
        </div>
      </div>

      {/* Available From (if you need for devs) */}
      <div className="relative mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery / Available From (optional)
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
              onSelect={date => {
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

      {/* Units table */}
      <h3 className="text-xl font-semibold mt-8 mb-4">Units</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-red-800 text-white">
              <th className="p-2 text-left">UNIT & BLOCK</th>
              <th className="p-2">BEDS</th>
              <th className="p-2">BATHS</th>
              <th className="p-2">COVERED INTERNAL AREA m²</th>
              <th className="p-2">COVERED VERANDA AREA m²</th>
              <th className="p-2">TOTAL COVERED AREA m²</th>
              <th className="p-2">POOL</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {formData.devUnits.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                <td className="p-2">
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={row.unitBlock}
                    onChange={e => updateRow(i, 'unitBlock', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={row.beds}
                    min={0}
                    onChange={e => updateRow(i, 'beds', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={row.baths}
                    min={0}
                    step={0.5}
                    onChange={e => updateRow(i, 'baths', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={row.internalArea}
                    min={0}
                    onChange={e => updateRow(i, 'internalArea', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={row.verandaArea}
                    min={0}
                    onChange={e => updateRow(i, 'verandaArea', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1 bg-gray-100"
                    value={row.totalArea}
                    readOnly
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={row.pool}
                    onChange={e => updateRow(i, 'pool', e.target.checked)}
                  />
                </td>
                <td className="p-2">
                  {formData.devUnits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-4 px-3 py-1 border rounded text-sm"
      >
        + Add Row
      </button>

      {/* Amenities */}
      <h3 className="text-xl font-semibold mt-10 mb-4">Amenities</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEV_AMENITIES.map(a => (
          <label key={a.id} className="flex items-start space-x-2 text-sm">
            <input
              type="checkbox"
              checked={formData.amenities.includes(a.id)}
              onChange={() => toggleAmenity(a.id)}
              className="mt-0.5 h-4 w-4 text-blue-600"
            />
            <span>{a.label}</span>
          </label>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button type="button" onClick={back} className="px-4 py-2 border rounded">
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

export default Step2_Developer;
