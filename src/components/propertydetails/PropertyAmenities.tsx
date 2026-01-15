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
      <div className="px-6 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Amenities</h2>
      </div>
      <div className="px-6 py-4">
        {Object.entries(categorizedAmenities).map(([category, categoryAmenities], idx) => (
          <div key={category}>
            {idx > 0 && <div className="border-t border-slate-100 my-2" />}
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1.5 pl-0.5">
              {category}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-0 gap-y-0">
              {categoryAmenities.map((amenity) => {
                const isAvailable = hasAmenity(amenity.id);
                return (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-1.5 py-1.5"
                  >
                    <div className="flex-shrink-0 w-3.5">
                      {React.cloneElement(
                        amenityIcons[amenity.id] ?? amenityIcons.default,
                        {
                          className: isAvailable
                            ? "h-3.5 w-3.5 text-blue-600"
                            : "h-3.5 w-3.5 text-slate-300",
                        }
                      )}
                    </div>
                    <span className={`text-[11px] leading-tight truncate ${
                      isAvailable
                        ? "text-slate-900 font-medium"
                        : "text-slate-400 font-normal"
                    }`}>
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
