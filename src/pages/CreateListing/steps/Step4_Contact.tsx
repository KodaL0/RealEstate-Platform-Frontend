import React from 'react';
import { Mail, Phone, Send, ChevronLeft, CheckCircle, Loader } from 'lucide-react';
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

const Step4_Contact: React.FC<Props> = ({ 
  formData, 
  onChange, 
  countryCode, 
  setCountryCode, 
  isSubmitting, 
  isEditing 
}) => {
  const { back } = useListingWizard();
  const valid = formData.contactEmail.trim() && formData.contactPhone.trim();

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-100 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4">
          <Send className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Contact & Submit</h2>
        <p className="text-gray-600 text-lg">Provide your contact information to complete the listing</p>
      </div>

      {/* Contact Information Card */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Mail className="w-5 h-5 mr-2 text-blue-600" />
          Contact Information
        </h3>
        
        <div className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={onChange}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="h-12 pl-3 pr-8 border border-gray-300 rounded-l-lg bg-gray-50 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none min-w-[120px]"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.label} {c.code}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={onChange}
                  placeholder="123 456 7890"
                  className="w-full pl-10 pr-4 py-3 border-t border-b border-r border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200 mb-8">
        <div className="flex items-center mb-4">
          <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Ready to Submit</h3>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          Your listing information is complete. Click "{isEditing ? 'Update Listing' : 'Create Listing'}" to 
          {isEditing ? ' save your changes' : ' publish your property listing'}.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button 
          type="button" 
          onClick={back} 
          className="group inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>
        
        <button
          type="submit"
          disabled={!valid || isSubmitting}
          className={`group relative px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform min-w-[180px] ${
            !valid || isSubmitting
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          <span className="flex items-center justify-center">
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                {isEditing ? 'Updating…' : 'Creating…'}
              </>
            ) : (
              <>
                {isEditing ? 'Update Listing' : 'Create Listing'}
                <Send className={`w-5 h-5 ml-2 transition-transform duration-200 ${
                  !isSubmitting && valid ? 'group-hover:translate-x-1' : ''
                }`} />
              </>
            )}
          </span>
          
          {!isSubmitting && valid && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          )}
        </button>
      </div>


    </section>
  );
};

export default Step4_Contact;