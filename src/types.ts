// types.ts

export interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  imageUrl: string;
  type: string;
  forSale: boolean;
  builtYear?: number;
  description?: string;
  additionalImages?: string[];
  features?: string[];
  // ... any additional fields
}


export interface ListingForm {
  title: string;
  description: string;
  price: string;
  location: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  images: File[];
  amenities: string[];
  yearBuilt: string;
  parkingSpaces: string;
  lotSize: string;
  propertyStatus: string;
  energyRating: string;
  constructionMaterial: string;
  floorLevel: string;
  totalFloors: string;
  availableFrom: string;
  contactPhone: string;
  contactEmail: string;
  virtualTourUrl?: string;
  videoUrl?: string;
  additionalFeatures: string[];
}
