import React from 'react';
import { useListingWizard } from '../../../context/ListingWizardContext';
import { ListingForm, COUNTRY_CODES } from '../../../types';

interface Props {
  formData: ListingForm;
  onChange: (e: React.ChangeEvent<any>) => void;
  countryCode: string;
  setCountryCode: (v: string) => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

const Step4_Contact: React.FC<Props> = ({ formData, onChange, countryCode, setCountryCode, isSubmitting, isEditing }) => {
  const { back } = useListingWizard();
  const valid = formData.contactEmail.trim() && formData.contactPhone.trim();

  return (
    <section className="bg-gray-50 p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6">Contact & Submit</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input type="email" name="contactEmail" value={formData.contactEmail} onChange={onChange} className="w-full border rounded px-3 py-2" />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Phone *</label>
        <div className="flex">
          <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="rounded-l-lg border bg-gray-100 px-3 text-sm">
            {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label} {c.code}</option>)}
          </select>
          <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={onChange} className="flex-1 px-4 py-2 border-t border-b border-r rounded-r-lg" />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button type="button" onClick={back} className="px-4 py-2 border rounded">Back</button>
        <button type="submit" disabled={!valid || isSubmitting} className={`px-8 py-4 rounded-xl text-white font-semibold ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {isSubmitting ? (isEditing ? 'Updating…' : 'Creating…') : (isEditing ? 'Update Listing' : 'Create Listing')}
        </button>
      </div>
    </section>
  );
};
export default Step4_Contact;