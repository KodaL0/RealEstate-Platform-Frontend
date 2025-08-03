// src/components/ProgressBar.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { useListingWizard } from '../context/ListingWizardContext';

const CREATE_STEPS = [
  { id: 0, name: 'User Type' },
  { id: 1, name: 'Details' },
  { id: 2, name: 'Images' },
  { id: 3, name: 'Contact' },
];

const EDIT_STEPS = [
  { id: 0, name: 'Details' },
  { id: 1, name: 'Images' },
  { id: 2, name: 'Contact' },
];

interface ProgressBarProps {
  isEditing?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ isEditing = false }) => {
  const { currentStep, goto, totalSteps } = useListingWizard();
  const STEPS = isEditing ? EDIT_STEPS : CREATE_STEPS;

  return (
    <div className="w-full py-6">
      {/* Desktop */}
      <div className="hidden sm:block">
        <nav className="flex items-center justify-center" aria-label="Progress">
          <ol className="flex items-center space-x-8">
            {STEPS.map(step => {
              const isDone = step.id < currentStep;
              const isNow  = step.id === currentStep;
              return (
                <li key={step.id}>
                  {isDone ? (
                    <button
                      type="button"
                      onClick={() => goto(step.id)}
                      className="group flex flex-col items-center"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 group-hover:bg-blue-800 transition-colors">
                        <Check className="h-5 w-5 text-white" aria-hidden="true" />
                      </span>
                      <span className="mt-2 text-sm font-medium text-gray-900">{step.name}</span>
                    </button>
                  ) : isNow ? (
                    <div className="flex flex-col items-center">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-blue-600"
                        aria-current="step"
                      >
                        <span className="text-sm font-bold">{step.id + 1}</span>
                      </span>
                      <span className="mt-2 text-sm font-medium text-blue-600">{step.name}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goto(step.id)}
                      disabled={step.id > currentStep}
                      className="group flex flex-col items-center"
                    >
                      <span
                        className={`h-8 w-8 rounded-full border-2 border-gray-300 bg-white text-gray-500 flex items-center justify-center ${
                          step.id > currentStep ? 'cursor-not-allowed opacity-50' : 'group-hover:border-gray-400'
                        } transition-colors`}
                      >
                        <span className="text-sm">{step.id + 1}</span>
                      </span>
                      <span className="mt-2 text-sm font-medium text-gray-500">{step.name}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Mobile */}
      <div className="sm:hidden">
        <div className="text-center text-sm font-medium text-gray-500">
          Step {currentStep + 1} of {totalSteps}: {STEPS[currentStep].name}
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
