import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WizardContext {
  currentStep: number;
  totalSteps: number;
  next(): void;
  back(): void;
  goto(n: number): void;
  setCurrentStep(n: number): void; // ✅ added this for direct access if needed
}

const Ctx = createContext<WizardContext | undefined>(undefined);

export const useListingWizard = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useListingWizard must be inside ListingWizardProvider');
  return c;
};

export const ListingWizardProvider: React.FC<{ children: ReactNode; initialStep?: number; totalSteps?: number }> = ({ children, initialStep = 0, totalSteps = 4 }) => {
  // Initialize current step from localStorage or initialStep
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('createListing_currentStep');
    if (saved) {
      try {
        const step = parseInt(saved, 10);
        return Math.max(0, Math.min(step, totalSteps - 1));
      } catch (e) {
        console.warn('Failed to parse saved step:', e);
      }
    }
    return initialStep;
  });
  
  const next = () => {
    const newStep = Math.min(currentStep + 1, totalSteps - 1);
    setCurrentStep(newStep);
    localStorage.setItem('createListing_currentStep', newStep.toString());
  };
  
  const back = () => {
    const newStep = Math.max(currentStep - 1, 0);
    setCurrentStep(newStep);
    localStorage.setItem('createListing_currentStep', newStep.toString());
  };
  
  const goto = (n: number) => {
    const newStep = Math.max(0, Math.min(n, totalSteps - 1));
    setCurrentStep(newStep);
    localStorage.setItem('createListing_currentStep', newStep.toString());
  };

  return (
    <Ctx.Provider value={{ currentStep, totalSteps, next, back, goto, setCurrentStep }}>
      {children}
    </Ctx.Provider>
  );
};
