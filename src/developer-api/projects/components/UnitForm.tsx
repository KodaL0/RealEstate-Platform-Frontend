import { useState, useEffect } from 'react';

type Unit = {
  id: number;
  project: number;
  code: string;
  block?: string;
  unit_type: 'studio' | 'apartment' | 'house';
  bedrooms: number;
  bathrooms: number;
  area_internal?: number;
  area_veranda?: number;
  area_total?: number;
  floor?: string;
  view?: string;
  price?: number;
  currency: string;
  vat_included: boolean;
  status: 'available' | 'reserved' | 'sold';
  pool_type?: string;
  delivery_months?: number;
  price_min_furniture_package?: number;
  price_max_furniture_package?: number;
  external_ref?: string;
};

interface UnitFormProps {
  projectId: number;
  unit?: Unit | null;
  onSave: (unit: Unit) => void;
  onCancel: () => void;
}

export default function UnitForm({ projectId, unit, onSave, onCancel }: UnitFormProps) {
  const [formData, setFormData] = useState<Partial<Unit>>({
    project: projectId,
    code: '',
    unit_type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    area_internal: undefined,
    area_veranda: undefined,
    area_total: undefined,
    price: undefined,
    currency: 'EUR',
    vat_included: false,
    status: 'available',
    floor: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (unit) {
      setFormData(unit);
    }
  }, [unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = unit 
        ? `/api/dev/v1/units/${unit.id}/`
        : '/api/dev/v1/units/';
      
      const method = unit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedUnit = await response.json();
        onSave(savedUnit);
      } else {
        console.error('Failed to save unit');
      }
    } catch (error) {
      console.error('Error saving unit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof Unit, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold">
            {unit ? 'Edit Unit' : 'Add New Unit'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Code *
            </label>
            <input
              type="text"
              value={formData.code || ''}
              onChange={(e) => handleInputChange('code', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              required
              placeholder="e.g., A101"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <select
                value={formData.bedrooms || 1}
                onChange={(e) => handleInputChange('bedrooms', 
                  e.target.value === 'ST' ? 'ST' : Number(e.target.value)
                )}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="ST">Studio</option>
                <option value={1}>1 Bedroom</option>
                <option value={2}>2 Bedrooms</option>
                <option value={3}>3 Bedrooms</option>
                <option value={4}>4 Bedrooms</option>
                <option value={5}>5+ Bedrooms</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <select
                value={formData.bathrooms || 1}
                onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value={1}>1 Bathroom</option>
                <option value={2}>2 Bathrooms</option>
                <option value={3}>3 Bathrooms</option>
                <option value={4}>4+ Bathrooms</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor
            </label>
            <input
              type="text"
              value={formData.floor || ''}
              onChange={(e) => handleInputChange('floor', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="e.g., Ground, 1st, 2nd"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Area (m²)
              </label>
              <input
                type="number"
                value={formData.area_internal || ''}
                onChange={(e) => handleInputChange('area_internal', 
                  e.target.value ? Number(e.target.value) : undefined
                )}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Covered Area (m²)
              </label>
              <input
                type="number"
                value={formData.area_covered || ''}
                onChange={(e) => handleInputChange('area_covered', 
                  e.target.value ? Number(e.target.value) : undefined
                )}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="150"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (EUR)
            </label>
            <input
              type="number"
              value={formData.price || ''}
              onChange={(e) => handleInputChange('price', 
                e.target.value ? Number(e.target.value) : undefined
              )}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="250000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status || 'available'}
              onChange={(e) => handleInputChange('status', e.target.value as Unit['status'])}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : unit ? 'Update Unit' : 'Create Unit'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
