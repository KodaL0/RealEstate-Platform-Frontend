import type React from "react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type WizardMode = "create" | "edit";

interface WizardContext {
  // Core state
  currentStep: number;
  totalSteps: number;
  mode: WizardMode;

  // Navigation methods
  next(): void;
  back(): void;
  goto(n: number): void;
  reset(): void;

  // Step utilities
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoBack: boolean;
  isStepValid(step: number): boolean;
  getStepProgress(): { current: number; total: number; percentage: number };

  // Step-specific helpers
  getStepName(step?: number): string;
  getStepIndex(): number; // 1-based index for display
}

const Ctx = createContext<WizardContext | undefined>(undefined);

export const useListingWizard = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useListingWizard must be inside ListingWizardProvider");
  return c;
};

// Optimized hooks for specific use cases
export const useWizardNavigation = () => {
  const { next, back, goto, canGoNext, canGoBack } = useListingWizard();
  return { next, back, goto, canGoNext, canGoBack };
};

export const useWizardProgress = () => {
  const { currentStep, totalSteps, getStepProgress, getStepName, getStepIndex } =
    useListingWizard();
  return {
    currentStep,
    totalSteps,
    progress: getStepProgress(),
    stepName: getStepName(),
    stepIndex: getStepIndex(),
  };
};

export const useWizardState = () => {
  const { currentStep, mode, isFirstStep, isLastStep, isStepValid } = useListingWizard();
  return { currentStep, mode, isFirstStep, isLastStep, isStepValid };
};

interface ListingWizardProviderProps {
  children: ReactNode;
  mode: WizardMode;
  initialStep?: number;
  totalSteps?: number;
  propertyId?: string;
}

// Step names for the wizard
const STEP_NAMES = ["Property Type", "Details", "Images", "Documents", "Contact"];

// SSR-safe localStorage helpers
const safeGetItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("Failed to read from localStorage:", e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("Failed to write to localStorage:", e);
  }
};

const safeRemoveItem = (key: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("Failed to remove from localStorage:", e);
  }
};

export const ListingWizardProvider: React.FC<ListingWizardProviderProps> = ({
  children,
  mode,
  initialStep = 0,
  totalSteps = 5,
  propertyId,
}) => {
  // Guard against edit mode without propertyId
  if (mode === "edit" && !propertyId) {
    console.warn("Edit mode requires propertyId. Falling back to create mode.");
    mode = "create";
  }

  // Generate mode-specific localStorage keys
  const getStorageKey = useCallback(
    (key: string) => {
      if (mode === "edit" && propertyId) {
        return `editListing_${propertyId}_${key}`;
      }
      return `createListing_${key}`;
    },
    [mode, propertyId],
  );

  // Initialize current step based on mode
  const [currentStep, setCurrentStep] = useState(() => {
    if (mode === "create") {
      // For create mode: always start at step 0, ignore localStorage
      return 0;
    }

    if (mode === "edit" && propertyId) {
      // For edit mode: check URL step param first, then localStorage
      // Note: initialStep should contain the parsed URL step parameter
      const urlStep = initialStep;
      if (urlStep !== 0) {
        return Math.max(0, Math.min(urlStep, totalSteps - 1));
      }

      // Fallback to localStorage for edit mode
      const saved = safeGetItem(getStorageKey("currentStep"));
      if (saved) {
        try {
          const step = parseInt(saved, 10);
          return Math.max(0, Math.min(step, totalSteps - 1));
        } catch (e) {
          console.warn("Failed to parse saved step:", e);
        }
      }
      return 0;
    }

    return initialStep;
  });

  // Re-clamp currentStep when totalSteps changes
  useEffect(() => {
    if (currentStep >= totalSteps) {
      const clampedStep = Math.max(0, totalSteps - 1);
      setCurrentStep(clampedStep);
      safeSetItem(getStorageKey("currentStep"), clampedStep.toString());
    }
  }, [totalSteps, currentStep, getStorageKey]);

  const saveStep = useCallback(
    (step: number) => {
      const key = getStorageKey("currentStep");
      const currentSaved = safeGetItem(key);
      const newValue = step.toString();

      // Avoid redundant writes
      if (currentSaved !== newValue) {
        safeSetItem(key, newValue);
      }
    },
    [getStorageKey],
  );

  const next = useCallback(() => {
    const newStep = Math.min(currentStep + 1, totalSteps - 1);
    setCurrentStep(newStep);
    saveStep(newStep);
  }, [currentStep, totalSteps, saveStep]);

  const back = useCallback(() => {
    const newStep = Math.max(currentStep - 1, 0);
    setCurrentStep(newStep);
    saveStep(newStep);
  }, [currentStep, saveStep]);

  const goto = useCallback(
    (n: number) => {
      const newStep = Math.max(0, Math.min(n, totalSteps - 1));
      setCurrentStep(newStep);
      saveStep(newStep);
    },
    [totalSteps, saveStep],
  );

  const reset = useCallback(() => {
    if (mode === "create") {
      // Clear all create mode localStorage
      const keys = [
        "currentStep",
        "formData",
        "locationCoords",
        "countryCode",
        "availableFromDate",
      ];
      keys.forEach((key) => {
        safeRemoveItem(getStorageKey(key));
      });
    }
    setCurrentStep(0);
  }, [mode, getStorageKey]);

  // Computed properties for better UX (memoized for performance)
  const isFirstStep = useMemo(() => currentStep === 0, [currentStep]);
  const isLastStep = useMemo(() => currentStep === totalSteps - 1, [currentStep, totalSteps]);
  const canGoNext = useMemo(() => currentStep < totalSteps - 1, [currentStep, totalSteps]);
  const canGoBack = useMemo(() => currentStep > 0, [currentStep]);

  const isStepValid = useCallback(
    (step: number): boolean => {
      return step >= 0 && step < totalSteps;
    },
    [totalSteps],
  );

  const getStepProgress = useCallback(
    () => ({
      current: currentStep + 1, // 1-based for display
      total: totalSteps,
      percentage: Math.round(((currentStep + 1) / totalSteps) * 100),
    }),
    [currentStep, totalSteps],
  );

  const getStepName = useCallback(
    (step?: number): string => {
      const stepIndex = step !== undefined ? step : currentStep;
      return STEP_NAMES[stepIndex] || `Step ${stepIndex + 1}`;
    },
    [currentStep],
  );

  const getStepIndex = useCallback((): number => {
    return currentStep + 1; // 1-based index for display
  }, [currentStep]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      // Core state
      currentStep,
      totalSteps,
      mode,

      // Navigation methods
      next,
      back,
      goto,
      reset,

      // Step utilities
      isFirstStep,
      isLastStep,
      canGoNext,
      canGoBack,
      isStepValid,
      getStepProgress,

      // Step-specific helpers
      getStepName,
      getStepIndex,
    }),
    [
      currentStep,
      totalSteps,
      mode,
      next,
      back,
      goto,
      reset,
      isFirstStep,
      isLastStep,
      canGoNext,
      canGoBack,
      isStepValid,
      getStepProgress,
      getStepName,
      getStepIndex,
    ],
  );

  return <Ctx.Provider value={contextValue}>{children}</Ctx.Provider>;
};
