import { Building, ChevronRight, Home, Hotel, Store, Trees } from "lucide-react";
import type React from "react";
import { memo } from "react";
import toast from "react-hot-toast";
import api from "../../../config/api";
import { useWizardNavigation } from "../../../context/ListingWizardContext";
import type { ListingForm } from "../../../types";

type Props = {
  formData: ListingForm;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  isEditing?: boolean;
  propertyId?: string;
  username?: string;
};

type PT =
  | "house"
  | "apartment"
  | "land"
  | "hotel"
  | "shop"
  | "office"
  | "residential_building";

const OPTIONS: { value: PT; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "house",
    label: "House",
    desc: "Single family house",
    icon: <Home className="w-5 h-5" />,
  },
  {
    value: "apartment",
    label: "Apartment",
    desc: "Apartment unit",
    icon: <Building className="w-5 h-5" />,
  },
  {
    value: "land",
    label: "Land",
    desc: "Vacant land or plot",
    icon: <Trees className="w-5 h-5" />,
  },
  { value: "hotel", label: "Hotel", desc: "Hotel property", icon: <Hotel className="w-5 h-5" /> },
  { value: "shop", label: "Shop", desc: "Retail shop", icon: <Store className="w-5 h-5" /> },
  {
    value: "office",
    label: "Office",
    desc: "Office space",
    icon: <Building className="w-5 h-5" />,
  },
  {
    value: "residential_building",
    label: "Residential Building",
    desc: "Multi-unit residential building",
    icon: <Building className="w-5 h-5" />,
  },
];

const Step1_PropertyType: React.FC<Props> = ({
  formData,
  setFormData,
  isEditing = false,
  propertyId,
  username,
}) => {
  const { next } = useWizardNavigation();
  const canContinue = !!formData.propertyType;

  const selectType = async (value: PT) => {
    const previousType = formData.propertyType;

    // Update local state immediately (optimistic update)
    setFormData((f: ListingForm) => ({
      ...f,
      propertyType: value,
      // wipe irrelevant specs on type switch using your actual ListingForm keys
      bedrooms: "",
      bathrooms: "",
      floorLevel: "",
      totalFloors: "",
      parkingSpaces: "",
      energyRating: "",
      lotSize: "",
      area: "",
      amenities: [],
      yearBuilt: "",
      constructionMaterial: "",
      availableFrom: "",
      // keep contact fields/images as-is
    }));

    // If editing, save the property type change via PATCH (only if actually changed)
    if (isEditing && propertyId && username && previousType && previousType !== value) {
      try {
        await api.properties.updatePropertyType(username, Number(propertyId), value);
        console.log(`✅ Property type updated: ${previousType} → ${value}`);
        toast.success("Property type updated");
      } catch (error: unknown) {
        // Rollback on error
        setFormData((f: ListingForm) => ({
          ...f,
          propertyType: previousType,
        }));
        console.error("❌ Failed to update property type:", error);
        const axiosError = error as { response?: { data?: { detail?: string } } };
        toast.error(axiosError.response?.data?.detail || "Failed to update property type");
      }
    }
  };

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-100 pb-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Select Property Type</h2>
        <p className="text-gray-600 text-sm">
          We’ll only ask for specs that make sense for this type.
        </p>
      </div>

      <div className="space-y-4">
        {OPTIONS.map((o) => {
          const active = formData.propertyType === o.value;
          return (
            <label
              key={o.value}
              className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                active
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="propertyType"
                value={o.value}
                className="sr-only"
                checked={active}
                onChange={() => selectType(o.value)}
              />
              <div
                className={`flex-shrink-0 p-2 rounded-lg mr-4 ${active ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
              >
                {o.icon}
              </div>
              <div className="flex-grow">
                <div className={`font-semibold ${active ? "text-blue-700" : "text-gray-800"}`}>
                  {o.label}
                </div>
                <div className="text-sm text-gray-600">{o.desc}</div>
              </div>
              {active && (
                <div className="flex-shrink-0 text-blue-500 ml-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </label>
          );
        })}
      </div>

      <div className="flex justify-end mt-8">
        <button
          type="button"
          disabled={!canContinue}
          onClick={next}
          className={`group relative px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${
            canContinue
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:-translate-y-0.5"
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

export default memo(Step1_PropertyType);
