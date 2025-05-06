/// <reference types="vite/client" />

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Adding this export {} to treat the file as a module, which is sometimes necessary
// for global declarations to be picked up correctly, especially if other .d.ts files
// might also be declaring globals or if your tsconfig settings are strict.
export {};
