import React from 'react';
import { useListingWizard } from '../../../context/ListingWizardContext';
import { ListingForm, DevUnitRow, DEV_AMENITIES } from '../../../types';

interface Props {
  formData: ListingForm;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  onChange: (e: React.ChangeEvent<any>) => void;
}

const Step2_Developer: React.FC<Props> = ({ formData, setFormData, onChange }) => {
  const { next, back } = useListingWizard();

  const baseValid = formData.title.trim() && formData.description.trim() && formData.location.trim();

  const updateRow = (idx: number, key: keyof DevUnitRow, value: any) => {
    setFormData(f => {
      const rows = [...f.devUnits];
      const row = { ...rows[idx], [key]: value } as DevUnitRow;
      const internal = Number(row.internalArea) || 0;
      const veranda = Number(row.verandaArea) || 0;
      row.totalArea = internal + veranda || '';
      rows[idx] = row;
      return { ...f, devUnits: rows };
    });
  };

  const addRow = () => setFormData(f => ({
    ...f,
    devUnits: [...f.devUnits, { unitBlock: '', beds: '', baths: '', internalArea: '', verandaArea: '', totalArea: '', pool: false }]
  }));

  const removeRow = (idx: number) => setFormData(f => ({
    ...f,
    devUnits: f.devUnits.filter((_, i) => i !== idx)
  }));

  const toggleAmenity = (id: string) =>
    setFormData(f => ({
      ...f,
      amenities: f.amenities.includes(id)
        ? f.amenities.filter(x => x !== id)
        : [...f.amenities, id],
    }));

  const tableValid = formData.devUnits.length > 0 && formData.devUnits.every(r => r.unitBlock.trim());
  const valid = baseValid && tableValid;

  return (
    <section className="bg-gray-50 p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6">Project Details</h2>

      {/* basic project info */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Project Name *</label>
        <input name="title" value={formData.title} onChange={onChange} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Description *</label>
        <textarea name="description" value={formData.description} onChange={onChange} rows={4} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Location *</label>
        <input name="location" value={formData.location} onChange={onChange} className="w-full border rounded px-3 py-2" />
      </div>

      {/* units table */}
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
                <td className="p-2"><input className="w-full border rounded px-2 py-1" value={row.unitBlock} onChange={e => updateRow(i, 'unitBlock', e.target.value)} /></td>
                <td className="p-2"><input type="number" className="w-full border rounded px-2 py-1" value={row.beds} min={0} onChange={e => updateRow(i, 'beds', e.target.value)} /></td>
                <td className="p-2"><input type="number" className="w-full border rounded px-2 py-1" value={row.baths} min={0} step={0.5} onChange={e => updateRow(i, 'baths', e.target.value)} /></td>
                <td className="p-2"><input type="number" className="w-full border rounded px-2 py-1" value={row.internalArea} min={0} onChange={e => updateRow(i, 'internalArea', e.target.value)} /></td>
                <td className="p-2"><input type="number" className="w-full border rounded px-2 py-1" value={row.verandaArea} min={0} onChange={e => updateRow(i, 'verandaArea', e.target.value)} /></td>
                <td className="p-2"><input type="number" className="w-full border rounded px-2 py-1 bg-gray-100" value={row.totalArea} readOnly /></td>
                <td className="p-2 text-center"><input type="checkbox" checked={row.pool} onChange={e => updateRow(i, 'pool', e.target.checked)} /></td>
                <td className="p-2">{formData.devUnits.length > 1 && (<button type="button" onClick={() => removeRow(i)} className="text-red-600 text-xs">Remove</button>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={addRow} className="mt-4 px-3 py-1 border rounded text-sm">+ Add Row</button>

      {/* amenities */}
      <h3 className="text-xl font-semibold mt-10 mb-4">Amenities</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEV_AMENITIES.map(a => (
          <label key={a.id} className="flex items-start space-x-2 text-sm">
            <input type="checkbox" checked={formData.amenities.includes(a.id)} onChange={() => toggleAmenity(a.id)} className="mt-0.5 h-4 w-4" />
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
export default Step2_Developer;