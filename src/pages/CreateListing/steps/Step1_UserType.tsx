import React from 'react';
import { useListingWizard } from '../../../context/ListingWizardContext';
import { ListingForm, UserType } from '../../../types';

interface Props { formData: ListingForm; setFormData: React.Dispatch<React.SetStateAction<ListingForm>>; }

const OPTIONS: { value: UserType; label: string }[] = [
  { value: 'agent', label: 'Real Estate Agent' },
  { value: 'developer', label: 'Developer / Builder' },
  { value: 'owner', label: 'Property Owner' },
];

const Step1_UserType: React.FC<Props> = ({ formData, setFormData }) => {
  const { next } = useListingWizard();
  const canContinue = formData.userType !== '';

  return (
    <section className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-4">Who are you?</h2>
      <p className="text-gray-600 mb-6">Select the role that best describes you.</p>

      <label className="block text-sm font-medium mb-1">I am a *</label>
      <select
        value={formData.userType}
        onChange={e => setFormData(f => ({ ...f, userType: e.target.value as UserType }))}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled>Choose one…</option>
        {OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <div className="flex justify-end mt-8">
        <button type="button" disabled={!canContinue} onClick={next} className={`px-6 py-3 rounded-lg text-white font-semibold ${canContinue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}>Next →</button>
      </div>
    </section>
  );
};
export default Step1_UserType;