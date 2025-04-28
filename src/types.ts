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
  price: string | number;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area: string | number;
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
  owner: Owner;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
}

// Utility function to normalize property data from API
export const normalizePropertyData = (properties: any[]): any[] => {
  return properties.map(property => ({
    ...property,
    // Convert price to number if it's a string
    price: typeof property.price === 'string' ? parseFloat(property.price) : property.price,
    // Convert area to number if it's a string
    area: typeof property.area === 'string' ? parseFloat(property.area) : property.area,
    // Convert bedrooms to number if it's a string
    bedrooms: typeof property.bedrooms === 'string' ? parseInt(property.bedrooms, 10) : property.bedrooms,
    // Convert bathrooms to number if it's a string
    bathrooms: typeof property.bathrooms === 'string' ? parseInt(property.bathrooms, 10) : property.bathrooms,
    // Convert year_built to number if it's a string
    year_built: typeof property.year_built === 'string' ? parseInt(property.year_built, 10) : property.year_built,
    // Convert parking_spaces to number if it's a string
    parking_spaces: typeof property.parking_spaces === 'string' ? parseInt(property.parking_spaces, 10) : property.parking_spaces,
    // Convert lot_size to number if it's a string
    lot_size: typeof property.lot_size === 'string' ? parseFloat(property.lot_size) : property.lot_size,
    // Convert floor_level to number if it's a string
    floor_level: typeof property.floor_level === 'string' ? parseInt(property.floor_level, 10) : property.floor_level,
    // Convert total_floors to number if it's a string
    total_floors: typeof property.total_floors === 'string' ? parseInt(property.total_floors, 10) : property.total_floors,
  }));
};

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
}
