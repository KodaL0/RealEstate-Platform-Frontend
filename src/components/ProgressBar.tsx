// src/components/ProgressBar.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { useListingWizard } from '../context/ListingWizardContext';

// Standard 5-step wizard for both create and edit modes
const STEPS = [
  { id: 0, name: 'Property Type' },
  { id: 1, name: 'Details' },
  { id: 2, name: 'Images' },
  { id: 3, name: 'Documents' },
  { id: 4, name: 'Contact' },
];

interface ProgressBarProps {
  isEditing?: boolean;
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

const ProgressBar: React.FC<ProgressBarProps> = () => {
  const { currentStep, goto } = useListingWizard();

  return (
    <>
      {/* Desktop - Always visible, no scroll animations */}
      <div className="hidden sm:block w-full py-4 bg-white border-b border-gray-100">
        <nav className="flex items-center justify-center" aria-label="Progress">
          <ol className="flex items-center space-x-16">
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
                      <span className="mt-1 text-xs font-medium text-gray-900">{step.name}</span>
                    </button>
                  ) : isNow ? (
                    <div className="flex flex-col items-center">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-blue-600"
                        aria-current="step"
                      >
                        <span className="text-sm font-bold">{step.id + 1}</span>
                      </span>
                      <span className="mt-1 text-xs font-medium text-blue-600">{step.name}</span>
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
                      <span className="mt-1 text-xs font-medium text-gray-500">{step.name}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Mobile - Simpler, always visible */}
      <div className="sm:hidden w-full bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-center space-x-2">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                {/* Stage Circle */}
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ease-in-out ${
                  isCompleted 
                    ? 'bg-blue-600' 
                    : isCurrent 
                      ? 'bg-blue-600 ring-2 ring-blue-200' 
                      : 'bg-gray-300'
                }`}>
                  {isCompleted && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {/* Connector Line (except for last item) */}
                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 transition-all duration-300 ease-in-out ${
                    isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ProgressBar;
