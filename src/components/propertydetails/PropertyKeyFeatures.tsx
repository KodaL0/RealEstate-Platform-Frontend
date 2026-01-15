import { Home } from "lucide-react";
import React from "react";
import { type Property } from "../../types";

const PTYPE_FIELDS: Record<
  string,
  Array<
    | "bedrooms"
    | "bathrooms"
    | "area"
    | "year_built"
    | "parking_spaces"
    | "lot_size"
    | "floor_level"
    | "total_floors"
    | "energy_rating"
    | "construction_material"
  >
> = {
  land: ["lot_size", "construction_material"],
  house: [
    "bedrooms",
    "bathrooms",
    "area",
    "year_built",
    "parking_spaces",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
    "lot_size",
  ],
  apartment: [
    "bedrooms",
    "bathrooms",
    "area",
    "year_built",
    "parking_spaces",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
  ],
  condo: [
    "bedrooms",
    "bathrooms",
    "area",
    "year_built",
    "parking_spaces",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
  ],
  townhouse: [
    "bedrooms",
    "bathrooms",
    "area",
    "year_built",
    "parking_spaces",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
    "lot_size",
  ],
  hotel: ["area", "year_built", "total_floors", "energy_rating", "construction_material"],
  shop: [
    "area",
    "year_built",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
    "parking_spaces",
  ],
  office: [
    "area",
    "year_built",
    "floor_level",
    "total_floors",
    "energy_rating",
    "construction_material",
    "parking_spaces",
  ],
  residential_building: [
    "area",
    "year_built",
    "total_floors",
    "energy_rating",
    "construction_material",
  ],
};

const hasNum = (v: any) =>
  v !== undefined && v !== null && String(v).trim() !== "" && Number(v) > 0;

const hasText = (v: any) => v !== undefined && v !== null && String(v).trim() !== "";

const formatFloor = (v: string | number | undefined | null) => {
  if (v === undefined || v === null || String(v).trim() === "") return "N/A";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  if (n === 0) return "Ground";
  const absNum = Math.abs(n);
  const tens = absNum % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const unit = absNum % 10;
  return `${n}${unit === 1 ? "st" : unit === 2 ? "nd" : unit === 3 ? "rd" : "th"}`;
};

interface PropertyKeyFeaturesProps {
  property: Property;
}

const PropertyKeyFeatures: React.FC<PropertyKeyFeaturesProps> = ({ property }) => {
  const pTypeKey = String(property.property_type || "").toLowerCase();
  const allowed = new Set(PTYPE_FIELDS[pTypeKey] || []);
  const allowedField = (k: string) => allowed.has(k as any);

  // Collect all available features
  const features: Array<{ label: string; value: string | number }> = [];

  if (allowedField("bedrooms") && hasNum(property.bedrooms)) {
    features.push({ label: "Bedrooms", value: Number(property.bedrooms) });
  }
  if (allowedField("bathrooms") && hasNum(property.bathrooms)) {
    features.push({ label: "Bathrooms", value: Number(property.bathrooms) });
  }
  if (allowedField("area") && hasNum(property.area)) {
    features.push({ 
      label: "Area", 
      value: `${Number(property.area).toLocaleString()}m²` 
    });
  }
  if (allowedField("year_built") && hasText(property.year_built)) {
    features.push({ label: "Year Built", value: property.year_built });
  }
  if (allowedField("parking_spaces") && hasNum(property.parking_spaces)) {
    features.push({ label: "Parking", value: Number(property.parking_spaces) });
  }
  if (allowedField("lot_size") && hasNum(property.lot_size)) {
    features.push({ 
      label: "Lot Size", 
      value: `${Number(property.lot_size).toLocaleString()}m²` 
    });
  }
  if (allowedField("floor_level") && hasText(property.floor_level)) {
    features.push({ label: "Floor", value: formatFloor(property.floor_level) });
  }
  if (allowedField("total_floors") && hasNum(property.total_floors)) {
    features.push({ label: "Total Floors", value: Number(property.total_floors) });
  }
  if (allowedField("energy_rating") && hasText(property.energy_rating)) {
    features.push({ label: "Energy", value: property.energy_rating });
  }
  if (allowedField("construction_material") && hasText(property.construction_material)) {
    features.push({ label: "Construction", value: property.construction_material });
  }

  // If no features, don't render the section
  if (features.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-xl mb-10 overflow-hidden border border-slate-200">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <Home className="w-6 h-6 text-white" />
          </div>
          Key Features
        </h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="text-center p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-400 transition-all duration-200"
            >
              <p className="text-slate-900 text-2xl sm:text-3xl font-bold mb-1 break-words">
                {feature.value}
              </p>
              <p className="text-slate-600 text-xs uppercase font-semibold tracking-wide">
                {feature.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertyKeyFeatures;
