/// <reference types="vite/client" />

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Adding this export {} to treat the file as a module, which is sometimes necessary
// for global declarations to be picked up correctly, especially if other .d.ts files
// might also be declaring globals or if your tsconfig settings are strict.
export {};

// Type declarations for modules without TypeScript support
declare module "lucide-react" {
  import { ComponentType, SVGProps } from "react";
  export const Building2: ComponentType<SVGProps<SVGSVGElement>>;
  export const Mail: ComponentType<SVGProps<SVGSVGElement>>;
  export const Lock: ComponentType<SVGProps<SVGSVGElement>>;
  export const User: ComponentType<SVGProps<SVGSVGElement>>;
  // Add other icons as needed
}

declare module "react-icons/si" {
  import { ComponentType, SVGProps } from "react";
  export const SiGoogle: ComponentType<SVGProps<SVGSVGElement>>;
  // Add other icons as needed
}

declare module "react-router-dom" {
  export * from "react-router-dom";
}
