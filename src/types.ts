// src/types.ts

/* ---------- Shared property/media types ---------- */
export interface PropertyImage {
  id?: number;
  image: string;
  is_primary: boolean;
  display_order?: number;
  created_at?: string;
}

export interface PropertyDocument {
  id: number;
  document: string;
  document_type: string;
  title: string;
  description?: string;
  file_size?: number;
  file_extension?: string;
  formatted_file_size?: string;
  uploaded_at: string;
}

export interface Owner {
  id: string;
  email: string;
  // add additional owner fields if needed
}

/* ---------- Wizard-specific additions ---------- */
export type UserType = 'agent' | 'developer' | 'owner' | '';

export interface DevUnitRow {
  unitBlock: string;
  beds: number | '';
  baths: number | '';
  internalArea: number | '';
  verandaArea: number | '';
  totalArea: number | '';
  pool: boolean;
}

// types.ts
export interface UnitFormValues {
  id?: number
  name: string
  price: number
  bedrooms: number
  bathrooms: number
}

/* ---------- API Property model ---------- */
export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  country: string;
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
  owner: Owner;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
  documents?: PropertyDocument[];
  // Additional fields that may be present in API responses
  latitude?: number;
  longitude?: number;
  is_favourite?: boolean;
  city?: string;
  region?: string;
}

/* Normalize helper */
export const normalizePropertyData = (property: any): Property => ({
  ...property,
  price:           typeof property.price === 'string'          ? parseFloat(property.price)           : property.price,
  area:            typeof property.area === 'string'           ? parseFloat(property.area)            : property.area,
  bedrooms:        typeof property.bedrooms === 'string'       ? parseInt(property.bedrooms, 10)      : property.bedrooms,
  bathrooms:       typeof property.bathrooms === 'string'      ? parseInt(property.bathrooms, 10)     : property.bathrooms,
  year_built:      typeof property.year_built === 'string'     ? parseInt(property.year_built, 10)    : property.year_built,
  parking_spaces:  typeof property.parking_spaces === 'string' ? parseInt(property.parking_spaces,10) : property.parking_spaces,
  lot_size:        typeof property.lot_size === 'string'       ? parseFloat(property.lot_size)        : property.lot_size,
  floor_level:     typeof property.floor_level === 'string'    ? parseInt(property.floor_level, 10)   : property.floor_level,
  total_floors:    typeof property.total_floors === 'string'   ? parseInt(property.total_floors, 10)  : property.total_floors,
  country: property.country || '',
});

/* ---------- Form model used by the wizard ---------- */
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

  // Location fields
  country: string;
  latitude?: string;
  longitude?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  street?: string;

  // NEW for wizard
  userType: UserType;
  devUnits: DevUnitRow[];
}

/* ---------- Dev amenities (optional helper list) ---------- */
export const DEV_AMENITIES = [
  { id: 'sea_view',              label: 'Sea View' },
  { id: 'private_parking',       label: 'Private parking' },
  { id: 'energy_efficient',      label: 'Energy-efficient design' },
  { id: 'vrf_system',            label: 'VRF system' },
  { id: 'thermal_insulation',    label: 'External Thermal insulation' },
  { id: 'optionally_furnished',  label: 'Optionally furnished' },
  { id: 'prestigious_project',   label: 'Prestigious, private project' },
  { id: 'bosch_appliances',      label: 'Optional BOSCH kitchen appliances' },
  { id: 'solar_boiler',          label: 'Solar-powered water boiler' },
  { id: 'custom_interiors',      label: 'Customizable interiors' },
  { id: 'gated_community',       label: 'Gated Community' },
  { id: 'mountain_view',         label: 'Mountain view' },
  { id: 'high_quality_flooring', label: 'High-quality flooring' },
  { id: 'high_quality_fittings', label: 'High-quality fittings' },
  { id: 'upgraded_tech',         label: 'High-quality and upgraded technology features' },
  { id: 'security_systems',      label: 'Cutting-edge security systems' },
  { id: 'photovoltaic',          label: 'Photovoltaic provisions' },
  { id: 'custom_wardrobes',      label: 'Custom wardrobes and cabinets' },
  { id: 'underfloor_heating',    label: 'Underfloor heating' },
  { id: 'sustainable_design',    label: 'Sustainable Design/ Spacious Areas' },
  { id: 'alarm_optional',        label: 'Alarm system (optional)' },
  { id: 'private_pool',          label: 'Private swimming pool' },
  { id: 'vrv_technology',        label: 'VRV technology' },
  { id: 'comfort_design',        label: 'Comfort design/ modern living' },
] as const;

/* ---------- Profile / social / reviews ---------- */
export interface PublicProfileData {
  id: number;
  username: string;
  date_joined: string;
  name?: string;
  bio?: string;
  location?: string;
  office?: string;
  avatar?: string;
  website?: string;
  phone?: string;
  properties_count: number;
  published_properties: Property[];
  connections_count: number;
  connection_status: 'connected' | 'pending_sent' | 'pending_received' | 'rejected' | 'none' | 'self';
  mutual_connections_count: number;
}

/* Chat */
export interface Thread {
  id: string;
  user1: number;
  user2: number;
  property: number | null;
  property_title: string;
  other_username: string;
  unread_count: number;
  updated_at: string;
  property_address?: string;
  property_image?: string;
  last_message?: {
    id: string;
    content: string;
    sender: number;
    created_at: string;
    read_at: string | null;
  } | null;
}

export interface Message {
  id: string;
  thread_id: string;
  property_id: number | null;
  sender: number;
  recipient: number;
  content: string;
  original_content?: string | null;
  created_at: string;
  read_at: string | null;
  is_unsent: boolean;
  unsent_at: string | null;
}

/* Connections */
export interface Connection {
  id: string;
  from_user: number;
  to_user: number;
  from_user_username: string;
  to_user_username: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UserConnection {
  connection_id: string;
  user: {
    id: number;
    username: string;
    date_joined: string;
  };
  connected_since: string;
}

export interface ConnectionStatus {
  status: 'connected' | 'pending_sent' | 'pending_received' | 'rejected' | 'none' | 'self';
  user_id: number;
  username: string;
}

/* Reviews */
export interface ReviewCategory {
  id: number;
  name: string;
  description: string;
  display_order: number;
}

export interface CategoryRating {
  id: number;
  category: ReviewCategory;
  category_id: number;
  rating: number;
}

export interface ReviewResponse {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface UserBasic {
  id: number;
  username: string;
  email: string;
}

export interface Review {
  id: number;
  reviewer: UserBasic;
  reviewee: UserBasic;
  overall_rating: number;
  title: string;
  content: string;
  interaction_context: string;
  is_public: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  category_ratings: CategoryRating[];
  response?: ReviewResponse;
  helpful_count: number;
  unhelpful_count: number;
  user_found_helpful?: boolean | null;
}

export interface ReviewStats {
  reviews_received_count: number;
  reviews_given_count: number;
  average_rating: number;
  rating_distribution: { [key: string]: number };
  category_averages: { [categoryName: string]: number };
  recent_reviews: Review[];
}

export interface CanReviewResponse {
  can_review: boolean;
  reason: string;
}

export interface ReviewDashboard {
  reviews_received_count: number;
  reviews_given_count: number;
  average_rating_received: number;
  pending_reviews_count: number;
  recent_reviews_received: Review[];
  recent_reviews_given: Review[];
}

// --- country codes used in Step4_Contact ---
export const COUNTRY_CODES = [
  { code: '+357', label: '🇨🇾' },
  { code: '+1',   label: '🇺🇸' },
  { code: '+44',  label: '🇬🇧' },
  { code: '+30',  label: '🇬🇷' },
  { code: '+49',  label: '🇩🇪' },
  { code: '+33',  label: '🇫🇷' },
  { code: '+39',  label: '🇮🇹' },
  { code: '+61',  label: '🇦🇺' },
  { code: '+91',  label: '🇮🇳' },
];

// --- country options used in property forms ---
export const COUNTRY_OPTIONS = [
  { value: 'Cyprus', label: '🇨🇾 Cyprus' },
  { value: 'Greece', label: '🇬🇷 Greece' },
];

// --- default form state for wizard ---
export const DEFAULT_FORM_STATE: ListingForm = {
  title: '',
  description: '',
  price: '',
  location: '',
  propertyType: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  images: [],
  amenities: [],
  yearBuilt: '',
  parkingSpaces: '',
  lotSize: '',
  propertyStatus: '',
  energyRating: '',
  constructionMaterial: '',
  floorLevel: '',
  totalFloors: '',
  availableFrom: '',
  contactPhone: '',
  contactEmail: '',
  virtualTourUrl: '',
  videoUrl: '',
  country: '',
  userType: '',
  devUnits: [{
    unitBlock: '',
    beds: '',
    baths: '',
    internalArea: '',
    verandaArea: '',
    totalArea: '',
    pool: false,
  }],
};

export const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'shop', label: 'Shop' },
  { value: 'office', label: 'Office' },
  { value: 'residential_building', label: 'Residential Building' },
];

export const PROPERTY_STATUS = [
  { value: 'forSale', label: 'For Sale' },
  { value: 'forRent', label: 'For Rent' },
];

export const AMENITIES = [
  // Building & Infrastructure
  { id: 'elevator', label: 'Elevator', category: 'Building & Infrastructure' },
  { id: 'internal_staircase', label: 'Internal Staircase', category: 'Building & Infrastructure' },
  { id: 'secure_door', label: 'Secure Door', category: 'Building & Infrastructure' },
  { id: 'manned_reception', label: 'Manned Reception', category: 'Building & Infrastructure' },
  { id: 'attic', label: 'Attic', category: 'Building & Infrastructure' },
  { id: 'facade', label: 'Facade', category: 'Building & Infrastructure' },
  { id: 'corner', label: 'Corner', category: 'Building & Infrastructure' },
  
  // Interior Features
  { id: 'frames_wooden', label: 'Wooden Frames', category: 'Interior Features' },
  { id: 'floor_marble', label: 'Marble Floor', category: 'Interior Features' },
  { id: 'single_glass', label: 'Single Glass', category: 'Interior Features' },
  { id: 'bright', label: 'Bright', category: 'Interior Features' },
  { id: 'airy', label: 'Airy', category: 'Interior Features' },
  { id: 'fireplace', label: 'Fireplace', category: 'Interior Features' },
  { id: 'furnished', label: 'Furnished', category: 'Interior Features' },
  { id: 'storage', label: 'Storage Space', category: 'Interior Features' },
  { id: 'painted', label: 'Painted', category: 'Interior Features' },
  { id: 'luxury_home', label: 'Luxury Home', category: 'Interior Features' },
  { id: 'playroom', label: 'Playroom', category: 'Interior Features' },
  
  // Climate & Comfort
  { id: 'underfloor_heating', label: 'Underfloor Heating', category: 'Climate & Comfort' },
  { id: 'air_conditioning', label: 'Air Conditioning', category: 'Climate & Comfort' },
  { id: 'central_heating', label: 'Central Heating', category: 'Climate & Comfort' },
  { id: 'solar_water_heating', label: 'Solar Water Heating', category: 'Climate & Comfort' },
  { id: 'night_power', label: 'Night Power', category: 'Climate & Comfort' },
  
  // Exterior & Outdoor
  { id: 'garden', label: 'Garden', category: 'Exterior & Outdoor' },
  { id: 'swimming_pool', label: 'Swimming Pool', category: 'Exterior & Outdoor' },
  { id: 'awning', label: 'Awning', category: 'Exterior & Outdoor' },
  { id: 'built_in_bbq', label: 'Built-in BBQ', category: 'Exterior & Outdoor' },
  { id: 'window_screens', label: 'Window Screens', category: 'Exterior & Outdoor' },
  { id: 'balcony', label: 'Balcony', category: 'Exterior & Outdoor' },
  
  // Parking & Access
  { id: 'parking_space', label: 'Parking Space', category: 'Parking & Access' },
  { id: 'garage', label: 'Garage', category: 'Parking & Access' },
  { id: 'access_disabled', label: 'Access for People with Disabilities', category: 'Parking & Access' },
  { id: 'ev_charging', label: 'Charging Facilities for Electric Car', category: 'Parking & Access' },
  
  // Security & Safety
  { id: 'alarm', label: 'Alarm', category: 'Security & Safety' },
  { id: 'security_system', label: 'Security System', category: 'Security & Safety' },
  { id: 'doorman', label: 'Doorman', category: 'Security & Safety' },
  
  // Utilities & Technology
  { id: 'satellite_receiver', label: 'Satellite Receiver', category: 'Utilities & Technology' },
  { id: 'wifi', label: 'High-Speed Internet', category: 'Utilities & Technology' },
  { id: 'dishwasher', label: 'Dishwasher', category: 'Utilities & Technology' },
  { id: 'laundry', label: 'Laundry Facilities', category: 'Utilities & Technology' },
  
  // Location & Views
  { id: 'residential_zone', label: 'Residential Zone', category: 'Location & Views' },
  { id: 'view', label: 'View', category: 'Location & Views' },
  { id: 'waterfront', label: 'Waterfront', category: 'Location & Views' },
  
  // Community & Shared
  { id: 'gym', label: 'Gym', category: 'Community & Shared' },
  { id: 'pool', label: 'Swimming Pool', category: 'Community & Shared' },
  { id: 'roof_deck', label: 'Roof Deck', category: 'Community & Shared' },
  
  // Policy & Lifestyle
  { id: 'pets', label: 'Pet Friendly', category: 'Policy & Lifestyle' },
];

export interface Developer {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  description: string;
  established?: number;
  location: string;
  country: 'Cyprus' | 'Greece';
  website?: string;
  email?: string;
  phone?: string;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  specialties: string[];
  rating?: number;
  reviewCount?: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  developerId: string;
  name: string;
  description: string;
  location: string;
  country: 'Cyprus' | 'Greece';
  status: 'planning' | 'construction' | 'completed' | 'available';
  startDate?: string;
  completionDate?: string;
  totalUnits: number;
  availableUnits: number;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  propertyTypes: string[];
  amenities: string[];
  images: string[];
  mainImage?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  features: string[];
  floorPlans?: {
    id: string;
    name: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    price: number;
    image?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAmenity {
  id: string;
  name: string;
  icon: string;
  category: 'recreation' | 'security' | 'convenience' | 'wellness' | 'outdoor';
}

export const AMENITY_CATEGORIES = {
  recreation: 'Recreation',
  security: 'Security',
  convenience: 'Convenience',
  wellness: 'Wellness',
  outdoor: 'Outdoor'
} as const;

export const PROJECT_STATUS_LABELS = {
  planning: 'Planning',
  construction: 'Under Construction',
  completed: 'Completed',
  available: 'Available'
} as const;

export const PROJECT_STATUS_COLORS = {
  planning: 'bg-yellow-100 text-yellow-800',
  construction: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  available: 'bg-purple-100 text-purple-800'
} as const;
