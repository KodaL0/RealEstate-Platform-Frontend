import {
  ArrowUpCircle,
  Bath,
  Bed,
  Building2,
  Calendar,
  Car,
  Home,
  MapPin,
  Square,
  Zap,
} from "lucide-react";
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

  return (
    <section className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-xl mb-10 overflow-hidden border border-slate-200">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <Home className="w-6 h-6 text-white" />
          </div>
          Key Features
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {allowedField("bedrooms") && hasNum(property.bedrooms) && (
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-blue-600 text-3xl font-bold mb-3">{Number(property.bedrooms)}</p>
              <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">BEDROOMS</p>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <Bed className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}

          {allowedField("bathrooms") && hasNum(property.bathrooms) && (
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-blue-600 text-3xl font-bold mb-3">{Number(property.bathrooms)}</p>
              <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">BATHROOMS</p>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <Bath className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}

          {allowedField("area") && hasNum(property.area) && (
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-blue-600 text-3xl font-bold mb-3">
                {Number(property.area).toLocaleString()}<span className="text-lg ml-1">m²</span>
              </p>
              <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">AREA</p>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <Square className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}

          {allowedField("year_built") && hasText(property.year_built) && (
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-blue-600 text-3xl font-bold mb-3">{property.year_built}</p>
              <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">YEAR BUILT</p>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}

          {allowedField("parking_spaces") && hasNum(property.parking_spaces) && (
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-blue-600 text-3xl font-bold mb-3">
                {Number(property.parking_spaces)}
              </p>
              <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">PARKING</p>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}

          {allowedField("lot_size") && hasNum(property.lot_size) && (
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-blue-600 text-3xl font-bold mb-3">
                {Number(property.lot_size).toLocaleString()}<span className="text-lg ml-1">m²</span>
              </p>
              <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">LOT SIZE</p>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}

          {allowedField("floor_level") && hasText(property.floor_level) && (
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-blue-600 text-3xl font-bold mb-3">
                {formatFloor(property.floor_level)}
              </p>
              <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">FLOOR</p>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <ArrowUpCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}

          {allowedField("total_floors") && hasNum(property.total_floors) && (
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-blue-600 text-3xl font-bold mb-3">{Number(property.total_floors)}</p>
              <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">TOTAL FLOORS</p>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}

          {allowedField("energy_rating") && hasText(property.energy_rating) && (
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-blue-600 text-3xl font-bold mb-3">{property.energy_rating}</p>
              <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">ENERGY</p>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}

          {allowedField("construction_material") && hasText(property.construction_material) && (
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-blue-600 text-xl font-bold mb-3">
                {property.construction_material}
              </p>
              <p className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">CONSTRUCTION</p>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PropertyKeyFeatures;
