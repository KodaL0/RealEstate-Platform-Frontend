import { useEffect, useState } from "react";
import { AMENITIES_BY_CATEGORY, PROPERTY_AMENITY_CATEGORIES } from "../types";
import ModalContainer from "./ui/ModalContainer";

interface AmenityFilterProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AmenityFilter({
  selectedAmenities,
  onChange,
  isOpen,
  onClose,
}: AmenityFilterProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedAmenities);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Sync local selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelection([...selectedAmenities]);
    }
  }, [isOpen, selectedAmenities]);

  const toggle = (id: string) => {
    setLocalSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleCategory = (category: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  const handleSubmit = () => {
    onChange([...localSelection]);
    onClose();
  };

  const handleClear = () => {
    setLocalSelection([]);
  };

  const selectedCount = localSelection.length;

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Select Amenities"
      description={`${selectedCount} amenit${selectedCount === 1 ? "y" : "ies"} selected`}
      contentClassName="max-h-[80vh]"
    >
      <div className="space-y-3">
        {/* Quick actions */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <span className="text-sm text-gray-600">{selectedCount} selected</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>

        {/* Amenities list */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto overscroll-contain pr-2">
          {PROPERTY_AMENITY_CATEGORIES.map((category) => {
            const amenitiesInCategory = AMENITIES_BY_CATEGORY[category];
            const selectedCount = amenitiesInCategory.filter((a) =>
              localSelection.includes(a.id),
            ).length;

            return (
              <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">{category}</span>
                    {selectedCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                        {selectedCount}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-500 text-lg font-semibold">
                    {expanded.has(category) ? "−" : "+"}
                  </span>
                </button>

                {expanded.has(category) && (
                  <div className="p-2 sm:p-3 space-y-1.5 bg-white">
                    {amenitiesInCategory.map((amenity) => {
                      const isSelected = localSelection.includes(amenity.id);

                      return (
                        <label
                          key={amenity.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-50 hover:bg-emerald-100" : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggle(amenity.id)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span
                            className={`text-xs sm:text-sm flex-1 ${
                              isSelected ? "text-emerald-900 font-medium" : "text-gray-700"
                            }`}
                          >
                            {amenity.label}
                          </span>
                          {isSelected && <span className="text-emerald-600 text-sm">✓</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Apply ({selectedCount})
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}
