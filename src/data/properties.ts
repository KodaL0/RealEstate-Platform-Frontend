import { Property } from '../types';

// Featured properties (mix of buy and rent)
export const featuredProperties: Property[] = [
  {
    id: 'prop1',
    title: 'Luxury Waterfront Villa',
    price: 2450000,
    address: 'Palm Beach, FL 33480',
    bedrooms: 5,
    bathrooms: 4.5,
    area: 4200,
    imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'Villa',
    forSale: true
  },
  {
    id: 'prop2',
    title: 'Modern Downtown Penthouse',
    price: 8500,
    address: 'Manhattan, NY 10022',
    bedrooms: 3,
    bathrooms: 3,
    area: 2100,
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'Apartment',
    forSale: false
  },
  {
    id: 'prop3',
    title: 'Elegant Colonial Estate',
    price: 1850000,
    address: 'Greenwich, CT 06830',
    bedrooms: 6,
    bathrooms: 5,
    area: 5800,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'House',
    forSale: true
  },
  {
    id: 'prop4',
    title: 'Beachfront Condo',
    price: 4200,
    address: 'Miami Beach, FL 33139',
    bedrooms: 2,
    bathrooms: 2,
    area: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'Condo',
    forSale: false
  },
  {
    id: 'prop5',
    title: 'Mountain View Retreat',
    price: 1250000,
    address: 'Aspen, CO 81611',
    bedrooms: 4,
    bathrooms: 3.5,
    area: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2053&q=80',
    type: 'Chalet',
    forSale: true
  },
  {
    id: 'prop6',
    title: 'Urban Loft Apartment',
    price: 3800,
    address: 'Chicago, IL 60654',
    bedrooms: 1,
    bathrooms: 1.5,
    area: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'Loft',
    forSale: false
  }
];

// Properties for sale
export const buyProperties: Property[] = [
  ...featuredProperties.filter(p => p.forSale),
  {
    id: 'buy1',
    title: 'Mediterranean-Style Villa',
    price: 3750000,
    address: 'Beverly Hills, CA 90210',
    bedrooms: 6,
    bathrooms: 7,
    area: 6500,
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2075&q=80',
    type: 'Villa',
    forSale: true
  },
  {
    id: 'buy2',
    title: 'Lakefront Property',
    price: 1650000,
    address: 'Lake Tahoe, NV 89449',
    bedrooms: 4,
    bathrooms: 3,
    area: 3800,
    imageUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2084&q=80',
    type: 'House',
    forSale: true
  },
  {
    id: 'buy3',
    title: 'Modern Architectural Masterpiece',
    price: 4200000,
    address: 'Malibu, CA 90265',
    bedrooms: 5,
    bathrooms: 6,
    area: 4800,
    imageUrl: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'House',
    forSale: true
  },
  {
    id: 'buy4',
    title: 'Historic Brownstone',
    price: 2950000,
    address: 'Boston, MA 02116',
    bedrooms: 4,
    bathrooms: 3.5,
    area: 3600,
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'Townhouse',
    forSale: true
  },
  {
    id: 'buy5',
    title: 'Luxury High-Rise Condo',
    price: 1850000,
    address: 'San Francisco, CA 94105',
    bedrooms: 3,
    bathrooms: 2.5,
    area: 2200,
    imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'Condo',
    forSale: true
  },
  {
    id: 'buy6',
    title: 'Country Estate',
    price: 2250000,
    address: 'Westchester, NY 10514',
    bedrooms: 5,
    bathrooms: 4.5,
    area: 5200,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'House',
    forSale: true
  }
];

// Properties for rent
export const rentProperties: Property[] = [
  ...featuredProperties.filter(p => !p.forSale),
  {
    id: 'rent1',
    title: 'Luxury Highrise Apartment',
    price: 5500,
    address: 'Los Angeles, CA 90024',
    bedrooms: 2,
    bathrooms: 2,
    area: 1800,
    imageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2053&q=80',
    type: 'Apartment',
    forSale: false
  },
  {
    id: 'rent2',
    title: 'Waterfront Penthouse',
    price: 12000,
    address: 'Seattle, WA 98101',
    bedrooms: 3,
    bathrooms: 3.5,
    area: 2600,
    imageUrl: 'https://images.unsplash.com/photo-1600607687644-c7f34b5e0f01?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2053&q=80',
    type: 'Penthouse',
    forSale: false
  },
  {
    id: 'rent3',
    title: 'Modern Townhouse',
    price: 4200,
    address: 'Austin, TX 78704',
    bedrooms: 3,
    bathrooms: 2.5,
    area: 2100,
    imageUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab8e17a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'Townhouse',
    forSale: false
  },
  {
    id: 'rent4',
    title: 'Luxury Garden Apartment',
    price: 3800,
    address: 'Portland, OR 97209',
    bedrooms: 2,
    bathrooms: 2,
    area: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'Apartment',
    forSale: false
  },
  {
    id: 'rent5',
    title: 'Historic Loft',
    price: 4500,
    address: 'New Orleans, LA 70130',
    bedrooms: 1,
    bathrooms: 1.5,
    area: 1300,
    imageUrl: 'https://images.unsplash.com/photo-1600566753104-685f4f24cb4d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'Loft',
    forSale: false
  },
  {
    id: 'rent6',
    title: 'Suburban Family Home',
    price: 3200,
    address: 'Scottsdale, AZ 85251',
    bedrooms: 4,
    bathrooms: 3,
    area: 2800,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'House',
    forSale: false
  }
];

export const testimonials = [
  {
    id: 1,
    name: "Emma Thompson",
    role: "First-time Homebuyer",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
    quote: "The team made buying my first home a breeze. Their expertise and personalized approach truly set them apart."
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Property Investor",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
    quote: "I've worked with many real estate companies, but none compare to the level of market insight and investment opportunities they provide."
  },
  {
    id: 3,
    name: "Sophia Rodriguez",
    role: "Luxury Home Seller",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=776&q=80",
    quote: "The marketing strategy they created for my property resulted in multiple offers above asking price within just a week."
  }
];

import { z } from 'zod';

export const propertySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title must not exceed 100 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000, 'Description must not exceed 2000 characters'),
  price: z.string().regex(/^\d+$/, 'Price must be a valid number').transform(Number),
  location: z.string().min(5, 'Location must be at least 5 characters'),
  propertyType: z.enum(['house', 'apartment', 'condo', 'townhouse'], {
    errorMap: () => ({ message: 'Please select a valid property type' }),
  }),
  bedrooms: z.string().regex(/^\d+$/, 'Bedrooms must be a valid number').transform(Number),
  bathrooms: z.string().regex(/^\d+$/, 'Bathrooms must be a valid number').transform(Number),
  area: z.string().regex(/^\d+$/, 'Area must be a valid number').transform(Number),
  amenities: z.array(z.string()),
  images: z.instanceof(FileList).refine((files) => files.length > 0, 'At least one image is required')
    .refine((files) => files.length <= 10, 'Maximum 10 images allowed')
    .refine(
      (files) => Array.from(files).every(file => file.type.startsWith('image/')),
      'Only image files are allowed'
    )
    .refine(
      (files) => Array.from(files).every(file => file.size <= 5 * 1024 * 1024),
      'Each image must be less than 5MB'
    ),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const AVAILABLE_AMENITIES = [
  { id: 'parking', label: 'Parking', icon: '🚗' },
  { id: 'pool', label: 'Swimming Pool', icon: '🏊‍♂️' },
  { id: 'gym', label: 'Gym', icon: '💪' },
  { id: 'security', label: 'Security System', icon: '🔒' },
  { id: 'ac', label: 'Air Conditioning', icon: '❄️' },
  { id: 'heating', label: 'Central Heating', icon: '🔥' },
  { id: 'laundry', label: 'Laundry Facilities', icon: '🧺' },
  { id: 'pets', label: 'Pet Friendly', icon: '🐾' },
  { id: 'furnished', label: 'Furnished', icon: '🛋️' },
  { id: 'balcony', label: 'Balcony', icon: '🏗️' },
  { id: 'storage', label: 'Storage Space', icon: '📦' },
  { id: 'wifi', label: 'High-Speed Internet', icon: '📡' },
  { id: 'garden', label: 'Garden', icon: '🌳' },
  { id: 'elevator', label: 'Elevator', icon: '🛗' },
  { id: 'fireplace', label: 'Fireplace', icon: '🔥' }
] as const;



// All properties combined
export const allProperties: Property[] = [...buyProperties, ...rentProperties.filter(p => !buyProperties.some(bp => bp.id === p.id))];