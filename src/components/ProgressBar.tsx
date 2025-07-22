import React from 'react';
import { useListingWizard } from '../context/ListingWizardContext';

const ProgressBar: React.FC = () => {
  const { currentStep, totalSteps } = useListingWizard();
  const percent = Math.round(((currentStep + 1) / totalSteps) * 100);
  return (
    <div>
      <div className="w-full bg-gray-200 h-2 rounded">
        <div className="bg-blue-600 h-2 rounded" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm text-gray-600 mt-1">{percent}% complete</p>
    </div>
  );
};
export default ProgressBar;
