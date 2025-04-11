// types.ts
export interface PropertyImage {
  image: string;
  is_primary: boolean;
}

export interface Owner {
  id: string;
  email: string;
  // add additional owner fields if needed
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  year_built: number;
  parking_spaces: number;
  lot_size?: number;
  property_status: string;
  energy_rating?: string;
  construction_material?: string;
  floor_level?: number;
  total_floors?: number;
  available_from?: string;
  contact_phone: string;
  contact_email: string;
  virtual_tour_url?: string;
  video_url?: string;
  amenities: string[];
  additional_features: string[];
  owner: Owner;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
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
