import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WizardContext {
  currentStep: number;
  totalSteps: number;
  next(): void;
  back(): void;
  goto(n: number): void;
}

const Ctx = createContext<WizardContext | undefined>(undefined);

export const useListingWizard = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useListingWizard must be inside ListingWizardProvider');
  return c;
};

export const ListingWizardProvider: React.FC<{ children: ReactNode; initialStep?: number; totalSteps?: number }> = ({ children, initialStep = 0, totalSteps = 4 }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const next = () => setCurrentStep(s => Math.min(s + 1, totalSteps - 1));
  const back = () => setCurrentStep(s => Math.max(s - 1, 0));
  const goto = (n: number) => setCurrentStep(Math.max(0, Math.min(n, totalSteps - 1)));

  return (
    <Ctx.Provider value={{ currentStep, totalSteps, next, back, goto }}>
      {children}
    </Ctx.Provider>
  );
};
