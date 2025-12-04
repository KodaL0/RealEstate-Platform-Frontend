import {
  Bath,
  Bed,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Euro,
  Hash,
  Home,
  Layers,
  MapPin,
  ParkingCircle,
  Plus,
  Ruler,
  Trash2,
} from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import AmenitySelector from "../../../components/AmenitySelector";
import api from "../../../config/api";
import { useWizardNavigation } from "../../../context/ListingWizardContext";
import { COUNTRY_OPTIONS, type ListingForm, PROPERTY_STATUS, type PropertyUnit, type UserType } from "../../../types";
import LocationAutocomplete from "../../LocationAutocomplete";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

type Props = {
  formData: ListingForm;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  onChange: (e: React.ChangeEvent<any>) => void;
  setLocationCoords?: (coords: { lat: number; lng: number } | null) => void;
  availableFromDate?: Date;
  setAvailableFromDate?: React.Dispatch<React.SetStateAction<Date | undefined>>;
  showCalendar?: boolean;
  setShowCalendar?: React.Dispatch<React.SetStateAction<boolean>>;

  // For edit mode
  isEditing?: boolean;
  propertyId?: string;
  onPropertyDataLoaded?: (data: any) => void;
  countryCode?: string;
  setCountryCode?: (code: string) => void;
  username?: string;
  hasLoadedPropertyData?: boolean;
};

type PT =
  | "house"
  | "apartment"
  | "land"
  | "hotel"
  | "shop"
  | "office"
  | "residential_building";

// Only use keys that exist on your ListingForm
const FIELD_MATRIX: Record<PT, Array<keyof ListingForm>> = {
  land: ["title", "price", "country", "location", "propertyStatus", "lotSize", "description"],
  house: [
    "title",
    "price",
    "country",
    "location",
    "propertyStatus",
    "area",
    "lotSize",
    "bedrooms",
    "bathrooms",
    "floorLevel",
    "totalFloors",
    "parkingSpaces",
    "energyRating",
    "yearBuilt",
    "amenities",
    "description",
  ],
  apartment: [
    "title",
    "price",
    "country",
    "location",
    "propertyStatus",
    "area",
    "bedrooms",
    "bathrooms",
    "floorLevel",
    "totalFloors",
    "parkingSpaces",
    "energyRating",
    "yearBuilt",
    "amenities",
    "description",
  ],
  hotel: [
    "title",
    "price",
    "country",
    "location",
    "propertyStatus",
    "area",
    "totalFloors",
    "energyRating",
    "yearBuilt",
    "amenities",
    "description",
  ],
  shop: [
    "title",
    "price",
    "country",
    "location",
    "propertyStatus",
    "area",
    "floorLevel",
    "totalFloors",
    "energyRating",
    "yearBuilt",
    "description",
  ],
  office: [
    "title",
    "price",
    "country",
    "location",
    "propertyStatus",
    "area",
    "floorLevel",
    "totalFloors",
    "energyRating",
    "yearBuilt",
    "description",
  ],
  residential_building: [
    "title",
    "price",
    "country",
    "location",
    "propertyStatus",
    "area",
    "totalFloors",
    "energyRating",
    "yearBuilt",
    "amenities",
    "description",
  ],
};

const Step2_PropertyDetails: React.FC<Props> = ({
  formData,
  setFormData,
  onChange,
  setLocationCoords,
  isEditing = false,
  propertyId,
  onPropertyDataLoaded,
  countryCode,
  setCountryCode,
  username,
  hasLoadedPropertyData = false,
}) => {
  const { next, back } = useWizardNavigation();
  const ptype = (formData.propertyType || "") as PT;
  const [hasLoadedData, setHasLoadedData] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [showValidationErrors, setShowValidationErrors] = React.useState(false);
  
  // Multi-unit state
  const isMultiUnit = formData.has_units === true;
  const canHaveUnits = ptype && [
    'house',
    'apartment',
    'office',
    'shop'
  ].includes(ptype);

  const show = useMemo(() => new Set(FIELD_MATRIX[ptype] ?? []), [ptype]);
  const showField = useCallback((k: keyof ListingForm) => {
    if (!show.has(k)) return false;
    
    // Hide single property fields if multi-unit
    if (isMultiUnit && ['bedrooms', 'bathrooms', 'area', 'price'].includes(k)) {
      return false;
    }
    
    // Hide house-specific fields in multi-unit mode (moved to unit level)
    if (isMultiUnit && ptype === 'house' && ['totalFloors', 'parkingSpaces', 'lotSize'].includes(k)) {
      return false;
    }
    
    return true;
  }, [show, isMultiUnit, ptype]);

  // Debug logging for amenities visibility
  useEffect(() => {
    if (isEditing) {
      const shouldShowAmenities = showField("amenities");
      const isInAmenitiesList = [
        "house",
        "apartment",
        "hotel",
        "residential_building",
      ].includes(ptype);
      console.log("🔍 Step2 Debug:", {
        ptype,
        propertyType: formData.propertyType,
        "showField(amenities)": shouldShowAmenities,
        "amenities in ptype list": isInAmenitiesList,
        "will render":
          isInAmenitiesList && (shouldShowAmenities || (isEditing && formData.propertyType)),
        amenitiesCount: Array.isArray(formData.amenities) ? formData.amenities.length : 0,
      });
    }
  }, [isEditing, ptype, formData.propertyType, formData.amenities, showField]);

  // Disable initial load flag after a short delay to allow data to populate
  useEffect(() => {
    if (isEditing && hasLoadedPropertyData && isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        console.log("✅ Step2: Initial load complete, PATCH updates enabled");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEditing, hasLoadedPropertyData, isInitialLoad]);

  // Initialize units when has_units is checked
  useEffect(() => {
    if (isMultiUnit && (!formData.units || formData.units.length === 0)) {
      // Initialize with 2 default units
      const defaultUnits: PropertyUnit[] = [
        {
          unit_number: "1",
          unit_name: "",
          bedrooms: 1,
          bathrooms: 1,
          area: 0,
          lot_size: 0,
          total_floors: 1,
          parking_spaces: 0,
          price: 0,
          status: 'available',
          is_published: true,
        },
        {
          unit_number: "2",
          unit_name: "",
          bedrooms: 1,
          bathrooms: 1,
          area: 0,
          lot_size: 0,
          total_floors: 1,
          parking_spaces: 0,
          price: 0,
          status: 'available',
          is_published: true,
        },
      ];
      setFormData(f => ({ ...f, units: defaultUnits }));
    } else if (!isMultiUnit && formData.units && formData.units.length > 0) {
      // Clear units if unchecked
      setFormData(f => ({ ...f, units: [] }));
    }
  }, [isMultiUnit]);

  // Load property details when editing (only if not already loaded by parent)
  useEffect(() => {
    if (!isEditing || !propertyId || !username || hasLoadedData || hasLoadedPropertyData) return;

    console.log("🔄 Step2: Loading property data...");
    setHasLoadedData(true);

    api.properties
      .getUserProperty(username, Number(propertyId))
      .then((res) => {
        const d = res.data as {
          property_status?: string;
          contact_phone?: string;
          amenities?: string[];
          property_type?: string;
          title?: string;
          description?: string;
          price?: number;
          location?: string;
          country?: string;
          region?: string;
          city?: string;
          postal_code?: string;
          street?: string;
          latitude?: number;
          longitude?: number;
          bedrooms?: number;
          bathrooms?: number;
          area?: number;
          year_built?: number;
          parking_spaces?: number;
          lot_size?: number;
          energy_rating?: string;
          construction_material?: string;
          floor_level?: number;
          total_floors?: number;
          available_from?: string;
          contact_email?: string;
          virtual_tour_url?: string;
          video_url?: string;
          user_type?: string;
          has_units?: boolean;
          units?: PropertyUnit[];
        };

        // Normalize property status
        let propertyStatus = d.property_status || "";
        if (propertyStatus === "for_sale") propertyStatus = "forSale";
        if (propertyStatus === "for_rent") propertyStatus = "forRent";

        // Parse contact phone to extract country code
        let phone = d.contact_phone || "";
        let cc = countryCode || "+357";
        const m = phone.match(/^\+[\d]{1,4}/);
        if (m) {
          cc = m[0];
          phone = phone.replace(cc, "").trim();
        }
        if (setCountryCode) {
          setCountryCode(cc);
        }

        console.log("📋 Step2: Loaded amenities:", d.amenities);
        console.log("📋 Step2: Property type from API:", d.property_type);

        // Load units separately if property has units but units not in response
        const loadUnits = async () => {
          if (d.has_units && (!d.units || d.units.length === 0)) {
            try {
              const unitsRes = await api.propertyUnits.list(Number(propertyId));
              const unitsData = (unitsRes.data as { results?: PropertyUnit[] })?.results || unitsRes.data as PropertyUnit[] || [];
              return Array.isArray(unitsData) ? unitsData : [];
            } catch (err) {
              console.warn("Failed to load units:", err);
              return [];
            }
          }
          return d.units || [];
        };

        loadUnits().then((units) => {
          // Update form data with property details
          setFormData((prev) => ({
            ...prev,
            title: d.title || "",
            description: d.description || "",
            price: d.price?.toString() || "",
            location: d.location || "",
            country: d.country || "Cyprus",
            region: d.region || "",
            city: d.city || "",
            postal_code: d.postal_code || "",
            street: d.street || "",
            latitude: d.latitude?.toString() || "",
            longitude: d.longitude?.toString() || "",
            propertyType: d.property_type || "",
            bedrooms: d.bedrooms?.toString() || "",
            bathrooms: d.bathrooms?.toString() || "",
            area: d.area?.toString() || "",
            amenities: Array.isArray(d.amenities) ? d.amenities : [],
            yearBuilt: d.year_built?.toString() || "",
            parkingSpaces: d.parking_spaces?.toString() || "",
            lotSize: d.lot_size?.toString() || "",
            propertyStatus,
            energyRating: d.energy_rating || "",
            constructionMaterial: d.construction_material || "",
            floorLevel: d.floor_level?.toString() || "",
            totalFloors: d.total_floors?.toString() || "",
            availableFrom: d.available_from || "",
            contactPhone: phone,
            contactEmail: d.contact_email || "",
            virtualTourUrl: d.virtual_tour_url || "",
            videoUrl: d.video_url || "",
            images: [],
            userType: (d.user_type as UserType) || prev.userType || ("owner_agent" as UserType),
            has_units: d.has_units || false,
            units: units,
          }));
        });

        // Call callback to let parent handle images and other data
        if (onPropertyDataLoaded) {
          onPropertyDataLoaded(d);
        }

        console.log("✅ Step2: Property data loaded successfully");
      })
      .catch((err) => {
        console.error("❌ Error loading property details:", err);
        setHasLoadedData(false); // Reset on error so user can retry
      });
  }, [
    isEditing,
    propertyId,
    username,
    hasLoadedData,
    countryCode,
    hasLoadedPropertyData,
    onPropertyDataLoaded,
    setCountryCode, // Update form data with property details
    setFormData,
  ]); // Removed changing dependencies

  const validBasics =
    !!formData.title?.trim() &&
    !!formData.price &&
    !!formData.country &&
    !!formData.location?.trim() &&
    !!formData.city?.trim() && // ← ADDED: Ensure city is populated from dropdown selection
    !!formData.propertyStatus &&
    !!ptype;

  const validSpecs = (() => {
    // If multi-unit, validate units instead
    if (isMultiUnit) {
      const units = formData.units || [];
      if (units.length < 2) return false;
      
      // House-specific validation
      if (ptype === 'house') {
        return units.every(unit => 
          unit.area > 0 && 
          unit.lot_size && unit.lot_size > 0 &&
          unit.total_floors && unit.total_floors > 0 &&
          unit.parking_spaces !== undefined &&
          unit.price > 0 && 
          unit.bedrooms >= 0 && 
          unit.bathrooms > 0
        );
      }
      
      // Other property types (apartment, office, shop)
      return units.every(unit => 
        unit.area > 0 && 
        unit.price > 0 && 
        unit.bedrooms >= 0 && 
        unit.bathrooms > 0
      );
    }
    
    // Single property validation
    if (["house", "apartment"].includes(ptype))
      return !!formData.area && !!formData.bedrooms && !!formData.bathrooms;
    if (ptype === "land") return !!formData.lotSize; // Land requires lot_size, not area
    if (["hotel", "shop", "office", "residential_building"].includes(ptype)) return !!formData.area;
    return false;
  })();

  const valid = validBasics && validSpecs;
  
  // Unit management functions
  const handleAddUnit = () => {
    const units = formData.units || [];
    const nextNumber = (units.length + 1).toString();
    const newUnit: PropertyUnit = {
      unit_number: nextNumber,
      unit_name: "",
      bedrooms: 1,
      bathrooms: 1,
      area: 0,
      lot_size: 0,
      total_floors: 1,
      parking_spaces: 0,
      price: 0,
      status: 'available',
      is_published: true,
    };
    setFormData(f => ({ ...f, units: [...units, newUnit] }));
  };

  const handleRemoveUnit = (index: number) => {
    const units = formData.units || [];
    if (units.length <= 2) {
      toast.error("Minimum 2 units required");
      return;
    }
    
    const newUnits = units.filter((_, i) => i !== index);
    // Renumber units sequentially
    const renumberedUnits = newUnits.map((unit, i) => ({
      ...unit,
      unit_number: (i + 1).toString(),
    }));
    setFormData(f => ({ ...f, units: renumberedUnits }));
  };

  const handleUnitChange = (index: number, field: keyof PropertyUnit, value: any) => {
    setFormData(f => ({
      ...f,
      units: (f.units || []).map((unit, i) => 
        i === index ? { ...unit, [field]: value } : unit
      )
    }));
  };

  const update = (patch: Partial<ListingForm>) =>
    setFormData((f: ListingForm) => ({ ...f, ...patch }));

  // Helper to check if unit field is invalid (only show red after submission attempt)
  const isUnitFieldInvalid = (unit: PropertyUnit, field: keyof PropertyUnit): boolean => {
    if (!showValidationErrors || ptype !== 'house') return false;
    
    switch (field) {
      case 'area':
      case 'price':
      case 'bathrooms':
        return !unit[field] || unit[field] <= 0;
      case 'lot_size':
      case 'total_floors':
        return !unit[field] || unit[field] <= 0;
      case 'parking_spaces':
        return unit[field] === undefined;
      case 'bedrooms':
        return unit[field] < 0;
      default:
        return false;
    }
  };

  // Enhanced next handler with location validation
  const handleNext = () => {
    // Check basic validation first
    if (!validBasics || !validSpecs) {
      setShowValidationErrors(true);
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate city field specifically
    if (!formData.city || formData.city.trim() === "") {
      setShowValidationErrors(true);
      toast.error(
        "Please enter a city name. You can select from the dropdown or enter it manually below.",
        { duration: 5000 },
      );
      return;
    }

    // All validations passed - proceed to next step
    next();
  };

  // Debounced PATCH update for property details
  const debouncedUpdate = useCallback(
    debounce(async (fieldName: string, value: any) => {
      if (isEditing && propertyId && username && !isInitialLoad) {
        try {
          const details: Record<string, any> = { [fieldName]: value };
          await api.properties.updatePropertyDetails(username, Number(propertyId), details);
          console.log(`✅ ${fieldName} updated via PATCH`);
        } catch (error: unknown) {
          console.error(`❌ Failed to update ${fieldName}:`, error);
          const apiError = error as { response?: { data?: { detail?: string } } };
          toast.error(apiError.response?.data?.detail || `Failed to update ${fieldName}`);
        }
      }
    }, 1500), // 1.5 second debounce
    [],
  );

  // Enhanced onChange handler that includes PATCH updates
  const handleChangeWithPatch = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;

    // Update local state immediately
    onChange(e);

    // If editing and not initial load, also update via PATCH (debounced)
    if (isEditing && propertyId && username && !isInitialLoad) {
      debouncedUpdate(name, value);
    }
  };

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-100 pb-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-2">
          <Home className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Property Details</h2>
        <p className="text-gray-600 text-sm">
          Only the relevant fields are shown for{" "}
          <span className="font-semibold">{formData.propertyType?.replace("_", " / ")}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        {/* Title */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChangeWithPatch}
            placeholder="e.g. Modern 2BR Apartment in City Center"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChangeWithPatch}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="" disabled>
              Select country
            </option>
            {COUNTRY_OPTIONS.map((c: { value: string; label: string }) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Property Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Status <span className="text-red-500">*</span>
          </label>
          <select
            name="propertyStatus"
            value={formData.propertyStatus}
            onChange={handleChangeWithPatch}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="" disabled>
              Select status
            </option>
            {PROPERTY_STATUS.map((s: { value: string; label: string }) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location (Mapbox autocomplete) */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
              size={18}
            />
            <LocationAutocomplete
              value={formData.location}
              onChange={(val: string) => update({ location: val })}
              onSelect={(addr: string, lat: number, lng: number, structured?: any) => {
                update({
                  location: addr,
                  latitude: lat.toString(),
                  longitude: lng.toString(),
                  ...(structured && {
                    country: structured.country || formData.country,
                    region: structured.region || "",
                    city: structured.city || "",
                    postal_code: structured.postal_code || "",
                    street: structured.street || "",
                  }),
                });
                setLocationCoords?.({ lat, lng });
              }}
              placeholder="Start typing address..."
              inputClassName="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            />
          </div>
        </div>

        {/* Location Details - Auto-filled from autocomplete, editable */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city || ""}
            onChange={handleChangeWithPatch}
            placeholder="e.g., Παραλίμνι"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Region</label>
          <input
            type="text"
            name="region"
            value={formData.region || ""}
            onChange={handleChangeWithPatch}
            placeholder="e.g., Famagusta"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
          <input
            type="text"
            name="postal_code"
            value={formData.postal_code || ""}
            onChange={handleChangeWithPatch}
            placeholder="e.g., 5290"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
          <input
            type="text"
            name="street"
            value={formData.street || ""}
            onChange={handleChangeWithPatch}
            placeholder="e.g., Filellinon"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Multiple Units Toggle */}
        {canHaveUnits && (
          <div className="lg:col-span-2 border-t pt-6 mt-4">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="has_units"
                checked={isMultiUnit}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData(f => ({
                    ...f,
                    has_units: checked,
                    units: checked ? (f.units || []) : [],
                    // Clear single property fields if enabling units
                    ...(checked ? {
                      bedrooms: '',
                      bathrooms: '',
                      area: '',
                      price: '',
                    } : {}),
                  }));
                }}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="has_units" className="font-semibold text-lg cursor-pointer text-gray-800">
                This property has multiple units
              </label>
            </div>

            {isMultiUnit && formData.units && formData.units.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-200">
                <p className="text-sm text-blue-900 mb-4">
                  <strong>Multi-unit property:</strong> Specify bedrooms, bathrooms, area, and pricing for each individual unit below.
                </p>

                {/* Units Table */}
                <div className="border rounded-lg bg-white">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">
                          Unit # <span className="text-red-500">*</span>
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">
                          Area <span className="text-red-500">*</span>
                        </th>
                        
                        {ptype === 'house' && (
                          <>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">
                              Lot <span className="text-red-500">*</span>
                            </th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">
                              Flrs <span className="text-red-500">*</span>
                            </th>
                          </>
                        )}
                        
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">
                          Beds <span className="text-red-500">*</span>
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">
                          Baths <span className="text-red-500">*</span>
                        </th>
                        
                        {ptype === 'house' && (
                          <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">
                            Park <span className="text-red-500">*</span>
                          </th>
                        )}
                        
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">
                          Price (€) <span className="text-red-500">*</span>
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {formData.units.map((unit, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {/* Unit Number - Read-only */}
                          <td className="px-3 py-2">
                            <span className="font-medium text-gray-700">{unit.unit_number}</span>
                          </td>
                          
                          {/* Name */}
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={unit.unit_name || ''}
                              onChange={(e) => handleUnitChange(index, 'unit_name', e.target.value)}
                              placeholder="Main"
                              className="w-20 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          
                          {/* Area */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={unit.area || ''}
                              onChange={(e) => handleUnitChange(index, 'area', Number(e.target.value) || 0)}
                              className={`w-16 px-1 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 ${
                                isUnitFieldInvalid(unit, 'area') ? 'border-red-300 bg-red-50' : ''
                              }`}
                              min="0"
                              required
                            />
                          </td>
                          
                          {/* House-specific: Lot Size */}
                          {ptype === 'house' && (
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                value={unit.lot_size || ''}
                                onChange={(e) => handleUnitChange(index, 'lot_size', Number(e.target.value) || 0)}
                                className={`w-16 px-1 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 ${
                                  isUnitFieldInvalid(unit, 'lot_size') ? 'border-red-300 bg-red-50' : ''
                                }`}
                                min="0"
                                required
                              />
                            </td>
                          )}
                          
                          {/* House-specific: Total Floors */}
                          {ptype === 'house' && (
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                value={unit.total_floors || ''}
                                onChange={(e) => handleUnitChange(index, 'total_floors', Number(e.target.value) || 0)}
                                className={`w-12 px-1 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 ${
                                  isUnitFieldInvalid(unit, 'total_floors') ? 'border-red-300 bg-red-50' : ''
                                }`}
                                min="1"
                                required
                              />
                            </td>
                          )}
                          
                          {/* Bedrooms */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={unit.bedrooms ?? ''}
                              onChange={(e) => handleUnitChange(index, 'bedrooms', Number(e.target.value) || 0)}
                              className={`w-12 px-1 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 ${
                                isUnitFieldInvalid(unit, 'bedrooms') ? 'border-red-300 bg-red-50' : ''
                              }`}
                              min="0"
                              required
                            />
                          </td>
                          
                          {/* Bathrooms */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              step="0.5"
                              value={unit.bathrooms || ''}
                              onChange={(e) => handleUnitChange(index, 'bathrooms', Number(e.target.value) || 0)}
                              className={`w-12 px-1 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 ${
                                isUnitFieldInvalid(unit, 'bathrooms') ? 'border-red-300 bg-red-50' : ''
                              }`}
                              min="0"
                              required
                            />
                          </td>
                          
                          {/* House-specific: Parking Spaces */}
                          {ptype === 'house' && (
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                value={unit.parking_spaces ?? ''}
                                onChange={(e) => handleUnitChange(index, 'parking_spaces', Number(e.target.value) || 0)}
                                className={`w-12 px-1 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 ${
                                  isUnitFieldInvalid(unit, 'parking_spaces') ? 'border-red-300 bg-red-50' : ''
                                }`}
                                min="0"
                                required
                              />
                            </td>
                          )}
                          
                          {/* Price */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={unit.price || ''}
                              onChange={(e) => handleUnitChange(index, 'price', Number(e.target.value) || 0)}
                              className={`w-24 px-1 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 ${
                                isUnitFieldInvalid(unit, 'price') ? 'border-red-300 bg-red-50' : ''
                              }`}
                              min="0"
                              required
                            />
                          </td>
                          
                          {/* Status */}
                          <td className="px-3 py-2">
                            <select
                              value={unit.status}
                              onChange={(e) => handleUnitChange(index, 'status', e.target.value)}
                              className="w-28 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="available">Available</option>
                              <option value="reserved">Reserved</option>
                              <option value="sold">Sold</option>
                            </select>
                          </td>
                          
                          {/* Delete Button */}
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveUnit(index)}
                              disabled={formData.units && formData.units.length <= 2}
                              className={`text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed ${
                                formData.units && formData.units.length <= 2 ? 'opacity-50' : ''
                              }`}
                              title={formData.units && formData.units.length <= 2 ? 'Minimum 2 units required' : 'Remove unit'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Validation Summary - only show after submission attempt */}
                {showValidationErrors && !validSpecs && formData.units && formData.units.length >= 2 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-semibold mb-2">
                      Please fix the following issues:
                    </p>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      {formData.units.map((unit, idx) => {
                        const errors: string[] = [];
                        if (!unit.area || unit.area <= 0) errors.push('Area required');
                        if (ptype === 'house' && (!unit.lot_size || unit.lot_size <= 0)) 
                          errors.push('Lot size required');
                        if (ptype === 'house' && (!unit.total_floors || unit.total_floors <= 0)) 
                          errors.push('Floors required');
                        if (ptype === 'house' && unit.parking_spaces === undefined) 
                          errors.push('Parking required');
                        if (!unit.bathrooms || unit.bathrooms <= 0) errors.push('Bathrooms required');
                        if (!unit.price || unit.price <= 0) errors.push('Price required');
                        
                        if (errors.length > 0) {
                          return (
                            <li key={idx}>
                              <strong>Unit {unit.unit_number}:</strong> {errors.join(', ')}
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  </div>
                )}

                {/* Add Unit Button */}
                <button
                  type="button"
                  onClick={handleAddUnit}
                  disabled={formData.units && formData.units.length >= 100}
                  className={`w-full py-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    formData.units && formData.units.length >= 100
                      ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Unit</span>
                  {formData.units && formData.units.length >= 100 && (
                    <span className="ml-2 text-xs">(Maximum 100 units)</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Price - only show if NOT multi-unit */}
        {!isMultiUnit && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price (€) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChangeWithPatch}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Area */}
        {showField("area") && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Area (m²){ptype !== "land" ? " *" : ""}
            </label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Lot Size */}
        {showField("lotSize") && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lot Area (m²)</label>
            <div className="relative">
              <Layers
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="number"
                name="lotSize"
                value={formData.lotSize}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Bedrooms */}
        {showField("bedrooms") && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
            <div className="relative">
              <Bed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Bathrooms */}
        {showField("bathrooms") && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bathrooms</label>
            <div className="relative">
              <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Floor */}
        {showField("floorLevel") && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Floor</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="floorLevel"
                value={formData.floorLevel}
                onChange={onChange}
                placeholder="e.g. 0, 1, 2"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Total Floors */}
        {showField("totalFloors") && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Total Floors</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                name="totalFloors"
                value={formData.totalFloors}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Parking */}
        {showField("parkingSpaces") && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Parking Spaces</label>
            <div className="relative">
              <ParkingCircle
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="number"
                name="parkingSpaces"
                value={formData.parkingSpaces}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Energy Rating */}
        {showField("energyRating") && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Energy Rating</label>
            <select
              name="energyRating"
              value={formData.energyRating || ""}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select</option>
              {["A", "B", "C", "D", "E", "F", "G"].map((r: string) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Year Built */}
        {showField("yearBuilt") && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year Built</label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="number"
                name="yearBuilt"
                value={formData.yearBuilt}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min={1800}
                max={2100}
              />
            </div>
          </div>
        )}

        {/* Amenities */}
        {["house", "apartment", "hotel", "residential_building"].includes(
          ptype,
        ) &&
          (showField("amenities") || (isEditing && formData.propertyType)) && (
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Amenities
                {formData.amenities && formData.amenities.length > 0 && (
                  <span className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    {formData.amenities.length} selected
                  </span>
                )}
              </label>
              <AmenitySelector
                selectedAmenities={Array.isArray(formData.amenities) ? formData.amenities : []}
                onChange={(amenities) => {
                  setFormData((f: ListingForm) => ({
                    ...f,
                    amenities: amenities,
                  }));

                  // If editing and not initial load, also update via PATCH (debounced)
                  if (isEditing && propertyId && username && !isInitialLoad) {
                    debouncedUpdate("amenities", amenities);
                  }
                }}
              />
            </div>
          )}

        {/* Description */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChangeWithPatch}
            rows={4}
            placeholder="Describe the property..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Nav */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={back}
          className="group inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={handleNext}
          className={`group px-8 py-4 rounded-xl font-semibold text-white ${
            valid
              ? "bg-gradient-to-r from-blue-600 to-purple-600"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <span className="flex items-center">
            Continue <ChevronRight className="w-5 h-5 ml-2" />
          </span>
        </button>
      </div>
    </section>
  );
};

export default memo(Step2_PropertyDetails);
