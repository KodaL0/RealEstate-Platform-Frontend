import {
  Accessibility,
  Anchor,
  Archive,
  ArrowUpCircle,
  Baby,
  Bed,
  Bell,
  Building2,
  Car,
  CheckCircle,
  Crown,
  DoorOpen,
  Droplet,
  Dumbbell,
  Eye,
  Flame,
  Flower,
  Glasses,
  Home,
  MapPin,
  Package,
  Palette,
  Satellite,
  Shield,
  Smile,
  Square,
  Sun,
  Thermometer,
  TreePine,
  Umbrella,
  UserCheck,
  Utensils,
  Wifi,
  Wind,
  Zap,
} from "lucide-react";
import React from "react";
import { AMENITIES } from "../../types";

interface PropertyAmenitiesProps {
  amenities: (string | { id: string; label: string })[];
}

// Amenity icon mapping
const amenityIcons: Record<string, JSX.Element> = {
  elevator: <ArrowUpCircle className="h-4 w-4 text-blue-600" />,
  internal_staircase: <ArrowUpCircle className="h-4 w-4 text-blue-600" />,
  secure_door: <Shield className="h-4 w-4 text-blue-600" />,
  manned_reception: <UserCheck className="h-4 w-4 text-blue-600" />,
  attic: <Home className="h-4 w-4 text-blue-600" />,
  facade: <Building2 className="h-4 w-4 text-blue-600" />,
  corner: <MapPin className="h-4 w-4 text-blue-600" />,
  frames_wooden: <TreePine className="h-4 w-4 text-blue-600" />,
  floor_marble: <Square className="h-4 w-4 text-blue-600" />,
  single_glass: <Glasses className="h-4 w-4 text-blue-600" />,
  bright: <Sun className="h-4 w-4 text-blue-600" />,
  airy: <Wind className="h-4 w-4 text-blue-600" />,
  fireplace: <Flame className="h-4 w-4 text-blue-600" />,
  furnished: <Bed className="h-4 w-4 text-blue-600" />,
  storage: <Archive className="h-4 w-4 text-blue-600" />,
  painted: <Palette className="h-4 w-4 text-blue-600" />,
  luxury_home: <Crown className="h-4 w-4 text-blue-600" />,
  playroom: <Baby className="h-4 w-4 text-blue-600" />,
  underfloor_heating: <Thermometer className="h-4 w-4 text-blue-600" />,
  air_conditioning: <Wind className="h-4 w-4 text-blue-600" />,
  central_heating: <Flame className="h-4 w-4 text-blue-600" />,
  solar_water_heating: <Sun className="h-4 w-4 text-blue-600" />,
  night_power: <Zap className="h-4 w-4 text-blue-600" />,
  garden: <Flower className="h-4 w-4 text-blue-600" />,
  swimming_pool: <Droplet className="h-4 w-4 text-blue-600" />,
  awning: <Umbrella className="h-4 w-4 text-blue-600" />,
  built_in_bbq: <Utensils className="h-4 w-4 text-blue-600" />,
  window_screens: <Glasses className="h-4 w-4 text-blue-600" />,
  balcony: <DoorOpen className="h-4 w-4 text-blue-600" />,
  parking_space: <Car className="h-4 w-4 text-blue-600" />,
  garage: <Car className="h-4 w-4 text-blue-600" />,
  access_disabled: <Accessibility className="h-4 w-4 text-blue-600" />,
  ev_charging: <Zap className="h-4 w-4 text-blue-600" />,
  alarm: <Bell className="h-4 w-4 text-blue-600" />,
  security_system: <Shield className="h-4 w-4 text-blue-600" />,
  doorman: <UserCheck className="h-4 w-4 text-blue-600" />,
  satellite_receiver: <Satellite className="h-4 w-4 text-blue-600" />,
  wifi: <Wifi className="h-4 w-4 text-blue-600" />,
  dishwasher: <Package className="h-4 w-4 text-blue-600" />,
  laundry: <CheckCircle className="h-4 w-4 text-blue-600" />,
  residential_zone: <MapPin className="h-4 w-4 text-blue-600" />,
  view: <Eye className="h-4 w-4 text-blue-600" />,
  waterfront: <Anchor className="h-4 w-4 text-blue-600" />,
  gym: <Dumbbell className="h-4 w-4 text-blue-600" />,
  pool: <Droplet className="h-4 w-4 text-blue-600" />,
  roof_deck: <Sun className="h-4 w-4 text-blue-600" />,
  pets: <Smile className="h-4 w-4 text-blue-600" />,
  default: <CheckCircle className="h-4 w-4 text-blue-600" />,
};

const PropertyAmenities: React.FC<PropertyAmenitiesProps> = ({ amenities }) => {
  // Convert amenities array to Set for O(1) lookup
  const propertyAmenitiesSet = new Set(
    amenities.map((a) => (typeof a === "string" ? a : a.id))
  );

  // Check if an amenity is available in this property
  const hasAmenity = (amenityId: string) => propertyAmenitiesSet.has(amenityId);

  // Group all amenities by category
  const categorizedAmenities: { [category: string]: typeof AMENITIES } = {};
  
  AMENITIES.forEach((amenity) => {
    // Exclude Legacy category
    if (amenity.category === "Legacy") return;
    
    if (!categorizedAmenities[amenity.category]) {
      categorizedAmenities[amenity.category] = [];
    }
    categorizedAmenities[amenity.category].push(amenity);
  });

  return (
    <section className="bg-white rounded-3xl shadow-xl mb-10 overflow-hidden border border-slate-200">
      <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          Amenities & Features
        </h2>
      </div>
      <div className="p-6">
        {Object.entries(categorizedAmenities).map(([category, categoryAmenities]) => (
          <div key={category} className="mb-6 last:mb-0">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              {category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {categoryAmenities.map((amenity) => {
                const isAvailable = hasAmenity(amenity.id);
                return (
                  <div
                    key={amenity.id}
                    className={`flex items-center gap-1.5 p-2 rounded-md transition-all duration-200 ${
                      isAvailable
                        ? "bg-blue-50 border border-blue-200 text-blue-900"
                        : "bg-slate-50 border border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {React.cloneElement(
                        amenityIcons[amenity.id] ?? amenityIcons.default,
                        {
                          className: isAvailable
                            ? "h-4 w-4 text-blue-600"
                            : "h-4 w-4 text-slate-300",
                        }
                      )}
                    </div>
                    <span className="text-xs font-medium leading-tight truncate">
                      {amenity.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PropertyAmenities;
