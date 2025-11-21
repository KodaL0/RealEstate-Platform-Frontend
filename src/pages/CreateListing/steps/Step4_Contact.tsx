import { ChevronLeft, Loader, Mail, Phone, Send } from "lucide-react";
import React, { memo, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../../../config/api";
import { useWizardNavigation } from "../../../context/ListingWizardContext";
import { COUNTRY_CODES, type ListingForm } from "../../../types";

// Debounce utility function
function debounce<T extends (...args: Parameters<T>) => void | Promise<void>>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      void func(...args);
    }, delay);
  };
}

interface Props {
  formData: ListingForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  countryCode: string;
  setCountryCode: (v: string) => void;
  isSubmitting: boolean;
  isEditing: boolean;
  propertyId?: string;
  username?: string;
}

const Step4_Contact: React.FC<Props> = ({
  formData,
  onChange,
  countryCode,
  setCountryCode,
  isSubmitting,
  isEditing,
  propertyId,
  username,
}) => {
  const { back } = useWizardNavigation();
  const valid = formData.contactEmail.trim() && formData.contactPhone.trim();
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Disable initial load flag after component mounts
  React.useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        console.log("✅ Step4: Initial load complete, PATCH updates enabled");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  // Debounced PATCH update for contact info
  const debouncedUpdate = useCallback(
    debounce(async (fieldName: string, value: string) => {
      if (isEditing && propertyId && username && !isInitialLoad) {
        try {
          const contactInfo: Record<string, string> = { [fieldName]: value };
          await api.properties.updateContactInfo(username, Number(propertyId), contactInfo);
          console.log(`✅ ${fieldName} updated via PATCH`);
        } catch (error: unknown) {
          console.error(`❌ Failed to update ${fieldName}:`, error);
          const apiError = error as { response?: { data?: { detail?: string } } };
          toast.error(apiError.response?.data?.detail || `Failed to update ${fieldName}`);
        }
      }
    }, 1500), // 1.5 second debounce
    [isEditing, propertyId, username, isInitialLoad],
  );

  // Enhanced onChange handler that includes PATCH updates
  const handleChangeWithPatch = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Update local state immediately
    onChange(e);

    // If editing and not initial load, also update via PATCH (debounced)
    if (isEditing && propertyId && username && !isInitialLoad) {
      debouncedUpdate(name, value);
    }
  };

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-gray-100 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3 sm:mb-2">
          <Send className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
        </div>
        <h2 className="text-2xl sm:text-xl font-bold text-gray-800 mb-2 sm:mb-1">
          Contact & Submit
        </h2>
        <p className="text-gray-600 text-base sm:text-sm px-4">
          Provide your contact information to complete the listing
        </p>
      </div>

      {/* Contact Information Card */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <Mail className="w-5 h-5 mr-2 text-blue-600" />
          Contact Information
        </h3>

        <div className="space-y-4 sm:space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                size={18}
              />
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChangeWithPatch}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-base"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>

            {/* Mobile: Stacked layout */}
            <div className="block sm:hidden space-y-3">
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full h-12 pl-3 pr-8 border border-gray-300 rounded-lg bg-gray-50 text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} {c.code}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                  size={18}
                />
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChangeWithPatch}
                  placeholder="123 456 7890"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-base"
                />
              </div>
            </div>

            {/* Desktop: Side by side layout */}
            <div className="hidden sm:flex">
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-12 pl-3 pr-8 border border-gray-300 rounded-l-lg bg-gray-50 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none min-w-[120px]"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} {c.code}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <div className="relative flex-1">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                  size={18}
                />
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChangeWithPatch}
                  placeholder="123 456 7890"
                  className="w-full pl-10 pr-4 py-3 border-t border-b border-r border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={back}
          className="group inline-flex items-center justify-center px-6 py-4 sm:py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-base"
        >
          <ChevronLeft className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>

        <button
          type="submit"
          disabled={!valid || isSubmitting}
          className={`group relative px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform w-full sm:w-auto sm:min-w-[180px] text-base ${
            !valid || isSubmitting
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          <span className="flex items-center justify-center">
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                {isEditing ? "Updating…" : "Creating…"}
              </>
            ) : (
              <>
                {isEditing ? "Update Listing" : "Create Listing"}
                <Send
                  className={`w-5 h-5 ml-2 transition-transform duration-200 ${
                    !isSubmitting && valid ? "group-hover:translate-x-1" : ""
                  }`}
                />
              </>
            )}
          </span>

          {!isSubmitting && valid && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          )}
        </button>
      </div>
    </section>
  );
};

export default memo(Step4_Contact);
