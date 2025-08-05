import React from 'react';
import { useListingWizard } from '../../../context/ListingWizardContext';
import { ListingForm, UserType } from '../../../types';
import { User, Building, Home, ChevronRight } from 'lucide-react';

interface Props { 
  formData: ListingForm; 
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>; 
}

const OPTIONS: { value: UserType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'agent', 
    label: 'Owner/Agent', 
    icon: <User className="w-5 h-5" />,
    description: 'Property owner or agent'
  },
  { 
    value: 'developer', 
    label: 'Developer', 
    icon: <Building className="w-5 h-5" />,
    description: 'Construction professional'
  },
];

const Step1_UserType: React.FC<Props> = ({ formData, setFormData }) => {
  const { next } = useListingWizard();
  const canContinue = formData.userType !== '';

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-100 pb-8">
             {/* Header */}
       <div className="text-center mb-4">
         <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-2">
           <User className="w-5 h-5 text-white" />
         </div>
         <h2 className="text-xl font-bold text-gray-800 mb-1">Who are you?</h2>
         <p className="text-gray-600 text-sm">Select the role that best describes you to get started.</p>
       </div>

             {/* Form Section */}
       <div className="space-y-6">
         <div>
           <label className="block text-sm font-semibold text-gray-700 mb-4">
             I am a <span className="text-red-500">*</span>
           </label>
           
           {/* Custom Radio Button Style Options */}
           <div className="space-y-4">
            {OPTIONS.map((option) => (
                             <label
                 key={option.value}
                 className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                   formData.userType === option.value
                     ? 'border-blue-500 bg-blue-50 shadow-md'
                     : 'border-gray-200 bg-white hover:border-gray-300'
                 }`}
               >
                <input
                  type="radio"
                  name="userType"
                  value={option.value}
                  checked={formData.userType === option.value}
                  onChange={(e) => setFormData(f => ({ ...f, userType: e.target.value as UserType }))}
                  className="sr-only"
                />
                
                                 {/* Custom Radio Circle */}
                 <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mr-4 transition-colors duration-200 ${
                   formData.userType === option.value
                     ? 'border-blue-500 bg-blue-500'
                     : 'border-gray-300'
                 }`}>
                   {formData.userType === option.value && (
                     <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                   )}
                 </div>
                 
                 {/* Icon */}
                 <div className={`flex-shrink-0 p-2 rounded-lg mr-4 transition-colors duration-200 ${
                   formData.userType === option.value
                     ? 'bg-blue-100 text-blue-600'
                     : 'bg-gray-100 text-gray-500'
                 }`}>
                   {option.icon}
                 </div>
                
                                 {/* Content */}
                 <div className="flex-grow">
                   <div className={`font-semibold text-base transition-colors duration-200 ${
                     formData.userType === option.value ? 'text-blue-700' : 'text-gray-700'
                   }`}>
                     {option.label}
                   </div>
                   <div className="text-base font-medium text-gray-600 mt-2">
                     {option.description}
                   </div>
                 </div>
                
                                 {/* Check Icon */}
                 {formData.userType === option.value && (
                   <div className="flex-shrink-0 text-blue-500 ml-4">
                     <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                       <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                       </svg>
                     </div>
                   </div>
                 )}
              </label>
            ))}
          </div>
        </div>
      </div>

             {/* Action Button */}
       <div className="flex justify-end mt-8">
        <button
          type="button"
          disabled={!canContinue}
          onClick={next}
          className={`group relative px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${
            canContinue
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center">
            Continue
            <ChevronRight className={`w-5 h-5 ml-2 transition-transform duration-200 ${
              canContinue ? 'group-hover:translate-x-1' : ''
            }`} />
          </span>
          
          {canContinue && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          )}
        </button>
      </div>


    </section>
  );
};

export default Step1_UserType;