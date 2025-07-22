// src/types.ts

/* ---------- Shared property/media types ---------- */
export interface PropertyImage {
  image: string;
  is_primary: boolean;
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

/* ---------- API Property model ---------- */
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
  owner: Owner;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
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
