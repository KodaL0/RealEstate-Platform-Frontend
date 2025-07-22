import React from 'react';
import { useListingWizard } from '../../../context/ListingWizardContext';
import { ListingForm, PROPERTY_TYPES, PROPERTY_STATUS, AMENITIES } from '../../../types';

interface Props {
  formData: ListingForm;
  onChange: (e: React.ChangeEvent<any>) => void;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
}

const Step2_OwnerAgent: React.FC<Props> = ({ formData, onChange, setFormData }) => {
  const { next, back } = useListingWizard();

  const valid =
    formData.title.trim() &&
    formData.description.trim() &&
    +formData.price > 0 &&
    formData.propertyType &&
    formData.propertyStatus;

  const toggleAmenity = (id: string) =>
    setFormData(f => ({
      ...f,
      amenities: f.amenities.includes(id)
        ? f.amenities.filter(x => x !== id)
        : [...f.amenities, id],
    }));

  return (
    <section className="bg-gray-50 p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6">Property Details</h2>

      {/* Basic info */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input name="title" value={formData.title} onChange={onChange} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Description *</label>
        <textarea name="description" value={formData.description} onChange={onChange} rows={4} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Price (€) *</label>
        <input type="number" name="price" value={formData.price} onChange={onChange} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Location *</label>
        <input name="location" value={formData.location} onChange={onChange} className="w-full border rounded px-3 py-2" />
      </div>

      {/* Technical fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm mb-1">Property Type *</label>
          <select name="propertyType" value={formData.propertyType} onChange={onChange} className="w-full border rounded px-3 py-2">
            <option value="" disabled>Select</option>
            {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Status *</label>
          <select name="propertyStatus" value={formData.propertyStatus} onChange={onChange} className="w-full border rounded px-3 py-2">
            <option value="" disabled>Select</option>
            {PROPERTY_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Area (m²) *</label>
          <input type="number" name="area" value={formData.area} onChange={onChange} className="w-full border rounded px-3 py-2" />
        </div>
        {/* More fields: bedrooms, bathrooms, yearBuilt, etc. */}
      </div>

      {/* Amenities */}
      <h3 className="text-xl font-semibold mt-8 mb-4">Amenities</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {AMENITIES.map(a => (
          <label key={a.id} className="flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={formData.amenities.includes(a.id)} onChange={() => toggleAmenity(a.id)} className="h-4 w-4" />
            <span>{a.label}</span>
          </label>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button type="button" onClick={back} className="px-4 py-2 border rounded">Back</button>
        <button type="button" disabled={!valid} onClick={next} className={`px-4 py-2 rounded text-white ${valid ? 'bg-blue-600' : 'bg-blue-300 cursor-not-allowed'}`}>Next</button>
      </div>
    </section>
  );
};
export default Step2_OwnerAgent;