import { BarChart3, DollarSign, Home, MapPin, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { Unit } from "../../../config/developers-api";

interface UnitFormProps {
  projectId: number;
  unit?: Unit | null;
  onSave: (unit: Unit) => void;
  onCancel: () => void;
}

function UnitForm({ projectId, unit, onSave, onCancel }: UnitFormProps) {
  const [formData, setFormData] = useState<Partial<Unit>>({
    project: projectId,
    code: "",
    unit_type: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    area_internal: undefined,
    area_veranda: undefined,
    area_total: undefined,
    price: undefined,
    currency: "EUR",
    vat_included: false,
    status: "available",
    floor: "",
    // Initialize new fields
    plot: "none",
    plot_area: undefined,
    veranda: "none",
    veranda_area: undefined,
    pool: "none",
    pool_area: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (unit) {
      setFormData(unit);
    }
  }, [unit]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code) {
      newErrors.code = "Unit code is required";
    }
    if (!formData.unit_type) {
      newErrors.unit_type = "Unit type is required";
    }
    if (formData.bedrooms === undefined) {
      newErrors.bedrooms = "Number of bedrooms is required";
    }

    // Validate outdoor feature areas when features are selected
    if (formData.plot && formData.plot !== "none" && !formData.plot_area) {
      newErrors.plot_area = "Plot area is required when plot is selected";
    }
    if (formData.veranda && formData.veranda !== "none" && !formData.veranda_area) {
      newErrors.veranda_area = "Veranda area is required when veranda is selected";
    }
    if (formData.pool && formData.pool !== "none" && !formData.pool_area) {
      newErrors.pool_area = "Pool area is required when pool is selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Clean up formData by removing undefined values
      const cleanFormData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined),
      );

      console.log("Submitting unit data:", cleanFormData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const now = new Date().toISOString();
      const savedUnit: Unit = {
        id: unit?.id ?? Date.now(),
        project: projectId,
        code: cleanFormData.code ?? "",
        unit_type: cleanFormData.unit_type ?? "apartment",
        bedrooms: cleanFormData.bedrooms ?? 1,
        bathrooms: cleanFormData.bathrooms,
        currency: cleanFormData.currency ?? "EUR",
        vat_included: cleanFormData.vat_included ?? false,
        status: cleanFormData.status ?? "available",
        is_published: cleanFormData.is_published ?? false,
        created_at: unit?.created_at ?? now,
        updated_at: now,
        ...cleanFormData,
      } as Unit;
      onSave(savedUnit);
    } catch (error) {
      console.error("Error saving unit:", error);
      setErrors({
        submit: `Error saving unit: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof Unit, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "reserved":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "sold":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              {unit ? "Edit Unit" : "Add New Unit"}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Basic Information</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <label
                    htmlFor="unit-code"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Unit Code *
                  </label>
                  <input
                    id="unit-code"
                    type="text"
                    value={formData.code || ""}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      errors.code ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="e.g., A101"
                  />
                  {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                </div>

                <div>
                  <label
                    htmlFor="unit-floor"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Floor
                  </label>
                  <input
                    id="unit-floor"
                    type="text"
                    value={formData.floor || ""}
                    onChange={(e) => handleInputChange("floor", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g., Ground, 1st, 2nd"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="unit-type"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Unit Type *
                  </label>
                  <select
                    id="unit-type"
                    value={formData.unit_type || "apartment"}
                    onChange={(e) =>
                      handleInputChange("unit_type", e.target.value as Unit["unit_type"])
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value="studio">Studio</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="bedrooms"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Bedrooms *
                  </label>
                  <select
                    id="bedrooms"
                    value={formData.bedrooms || 1}
                    onChange={(e) => handleInputChange("bedrooms", Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value={0}>Studio (0)</option>
                    <option value={1}>1 Bedroom</option>
                    <option value={2}>2 Bedrooms</option>
                    <option value={3}>3 Bedrooms</option>
                    <option value={4}>4 Bedrooms</option>
                    <option value={5}>5+ Bedrooms</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="bathrooms"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Bathrooms
                  </label>
                  <select
                    id="bathrooms"
                    value={formData.bathrooms || 1}
                    onChange={(e) => handleInputChange("bathrooms", Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value={1}>1 Bathroom</option>
                    <option value={2}>2 Bathrooms</option>
                    <option value={3}>3 Bathrooms</option>
                    <option value={4}>4+ Bathrooms</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Area Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Area Information</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="area-internal"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Internal Area (m²)
                  </label>
                  <input
                    id="area-internal"
                    type="number"
                    value={formData.area_internal || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "area_internal",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="120"
                  />
                </div>

                <div>
                  <label
                    htmlFor="area-veranda"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Covered Area (m²)
                  </label>
                  <input
                    id="area-veranda"
                    type="number"
                    value={formData.area_veranda || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "area_veranda",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="150"
                  />
                </div>
              </div>
            </div>

            {/* Plot, Veranda & Pool Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Outdoor Features</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Plot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="plot" className="block text-sm font-medium text-gray-700 mb-2">
                    Plot
                  </label>
                  <select
                    id="plot"
                    value={formData.plot || "none"}
                    onChange={(e) => handleInputChange("plot", e.target.value as Unit["plot"])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value="none">None</option>
                    <option value="communal">Communal</option>
                    <option value="private">Private</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="plot-area"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Plot Area (m²)
                  </label>
                  <input
                    id="plot-area"
                    type="number"
                    value={formData.plot_area || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "plot_area",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    disabled={formData.plot === "none"}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      formData.plot === "none" ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                    } ${errors.plot_area ? "border-red-300" : ""}`}
                    placeholder="200"
                  />
                  {errors.plot_area && (
                    <p className="mt-1 text-sm text-red-600">{errors.plot_area}</p>
                  )}
                </div>
              </div>

              {/* Veranda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="veranda" className="block text-sm font-medium text-gray-700 mb-2">
                    Veranda
                  </label>
                  <select
                    id="veranda"
                    value={formData.veranda || "none"}
                    onChange={(e) =>
                      handleInputChange("veranda", e.target.value as Unit["veranda"])
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value="none">None</option>
                    <option value="communal">Communal</option>
                    <option value="private">Private</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="veranda-area"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Veranda Area (m²)
                  </label>
                  <input
                    id="veranda-area"
                    type="number"
                    value={formData.veranda_area || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "veranda_area",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    disabled={formData.veranda === "none"}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      formData.veranda === "none"
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : ""
                    } ${errors.veranda_area ? "border-red-300" : ""}`}
                    placeholder="25"
                  />
                  {errors.veranda_area && (
                    <p className="mt-1 text-sm text-red-600">{errors.veranda_area}</p>
                  )}
                </div>
              </div>

              {/* Pool */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pool" className="block text-sm font-medium text-gray-700 mb-2">
                    Pool
                  </label>
                  <select
                    id="pool"
                    value={formData.pool || "none"}
                    onChange={(e) => handleInputChange("pool", e.target.value as Unit["pool"])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value="none">None</option>
                    <option value="communal">Communal</option>
                    <option value="private">Private</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pool Area (m²)
                  </label>
                  <input
                    type="number"
                    value={formData.pool_area || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "pool_area",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    disabled={formData.pool === "none"}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      formData.pool === "none" ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                    } ${errors.pool_area ? "border-red-300" : ""}`}
                    placeholder="50"
                  />
                  {errors.pool_area && (
                    <p className="mt-1 text-sm text-red-600">{errors.pool_area}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing & Status Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Pricing & Status</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (EUR)
                  </label>
                  <input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "price",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="250,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status || "available"}
                    onChange={(e) => handleInputChange("status", e.target.value as Unit["status"])}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${getStatusColor(formData.status || "available")}`}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{unit ? "Update Unit" : "Create Unit"}</span>
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Demo App component

export default UnitForm;
