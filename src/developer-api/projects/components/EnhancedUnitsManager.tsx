import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Copy, Edit, Trash2, Eye, MoreHorizontal, Search, Filter } from 'lucide-react';
import { Unit } from '../../../config/developers-api';
import UnitForm from './UnitForm';

interface EnhancedUnitsManagerProps {
  projectId: number;
  units: Unit[];
  onUnitCreate: (unit: Omit<Unit, 'id'>) => Promise<void>;
  onUnitUpdate: (unit: Unit) => Promise<void>;
  onUnitDelete: (unitId: number) => Promise<void>;
  onUnitDuplicate: (unit: Omit<Unit, 'id'>) => Promise<void>;
}

const EnhancedUnitsManager: React.FC<EnhancedUnitsManagerProps> = ({
  projectId,
  units,
  onUnitCreate,
  onUnitUpdate,
  onUnitDelete,
  onUnitDuplicate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter units based on search and filters
  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (unit.block && unit.block.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || unit.status === statusFilter;
    const matchesType = !typeFilter || unit.unit_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Smart duplicate with automatic code generation
  const handleSmartDuplicate = useCallback(async (unit: Unit) => {
    setIsLoading(true);
    try {
      // Generate new code based on existing pattern
      const newCode = generateSmartCode(unit.code, units);
      
      const duplicatedUnit: Omit<Unit, 'id'> = {
        ...unit,
        code: newCode,
        status: 'available', // Reset status for new unit
        price: unit.price ? Math.round(unit.price * 1.05) : undefined, // Slight price increase
      };

      await onUnitDuplicate(duplicatedUnit);
    } catch (error) {
      console.error('Failed to duplicate unit:', error);
    } finally {
      setIsLoading(false);
    }
  }, [units, onUnitDuplicate]);

  // Generate smart code based on existing pattern
  const generateSmartCode = (originalCode: string, existingUnits: Unit[]): string => {
    // Extract base and number from original code (e.g., "A101" -> "A" + "101")
    const match = originalCode.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) {
      // Fallback: append number to original code
      return `${originalCode}-${existingUnits.length + 1}`;
    }

    const [, base, numberStr] = match;
    const baseNumber = parseInt(numberStr);
    
    // Find the next available number in sequence
    let nextNumber = baseNumber + 1;
    while (existingUnits.some(u => u.code === `${base}${nextNumber}`)) {
      nextNumber++;
    }
    
    return `${base}${nextNumber}`;
  };

  // Quick actions for common unit types
  const quickCreateTemplates = [
    {
      name: 'Studio',
      template: {
        unit_type: 'studio' as const,
        bedrooms: 0,
        bathrooms: 1,
        area_internal: 35,
        area_total: 40,
      }
    },
    {
      name: '1BR Apartment',
      template: {
        unit_type: 'apartment' as const,
        bedrooms: 1,
        bathrooms: 1,
        area_internal: 55,
        area_total: 65,
      }
    },
    {
      name: '2BR Apartment',
      template: {
        unit_type: 'apartment' as const,
        bedrooms: 2,
        bathrooms: 2,
        area_internal: 75,
        area_total: 85,
      }
    },
    {
      name: '3BR Apartment',
      template: {
        unit_type: 'apartment' as const,
        bedrooms: 3,
        bathrooms: 2,
        area_internal: 95,
        area_total: 110,
      }
    }
  ];

  const handleQuickCreate = async (template: any) => {
    setIsLoading(true);
    try {
      const newUnit: Omit<Unit, 'id'> = {
        project: projectId,
        code: generateSmartCode('A1', units),
        unit_type: template.unit_type,
        bedrooms: template.bedrooms,
        bathrooms: template.bathrooms,
        area_internal: template.area_internal,
        area_total: template.area_total,
        currency: 'EUR',
        vat_included: false,
        status: 'available',
        ...template
      };

      await onUnitCreate(newUnit);
    } catch (error) {
      console.error('Failed to create unit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Responsive table component
  const UnitsTable = () => (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Code</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
              <th className="hidden sm:table-cell px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Floor</th>
              <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Area</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Price</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUnits.map((unit) => (
              <tr key={unit.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{unit.code}</div>
                    {unit.block && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {unit.block}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900">
                      {unit.bedrooms === 0 ? 'ST' : `${unit.bedrooms}BR`}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {unit.unit_type}
                    </span>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {unit.floor || '-'}
                </td>
                <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {unit.area_total ? `${unit.area_total}m²` : '-'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {unit.price ? `€${unit.price.toLocaleString()}` : '-'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    unit.status === 'available' ? 'bg-green-100 text-green-800' :
                    unit.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {unit.status}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingUnit(unit);
                        setShowCreateModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onUnitDuplicate(unit)}
                      className="text-green-600 hover:text-green-900 p-1 rounded"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onUnitDelete(unit.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Responsive cards component
  const UnitsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6">
      {filteredUnits.map((unit) => (
        <div key={unit.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{unit.code}</h3>
              {unit.block && (
                <span className="text-xs sm:text-sm text-gray-500">Block {unit.block}</span>
              )}
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={() => {
                  setEditingUnit(unit);
                  setShowCreateModal(true);
                }}
                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                title="Edit"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => onUnitDuplicate(unit)}
                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                title="Duplicate"
              >
                <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => onUnitDelete(unit.id)}
                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium text-gray-900">
                {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms}BR ${unit.unit_type}`}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Area:</span>
              <span className="font-medium text-gray-900">
                {unit.area_total ? `${unit.area_total}m²` : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Floor:</span>
              <span className="font-medium text-gray-900">
                {unit.floor || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Price:</span>
              <span className="font-medium text-gray-900">
                {unit.price ? `€${unit.price.toLocaleString()}` : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                unit.status === 'available' ? 'bg-green-100 text-green-800' :
                unit.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {unit.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Units Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              {units.length} unit{units.length !== 1 ? 's' : ''} • {filteredUnits.length} shown
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">Table</span>
                <span className="sm:hidden">📊</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">Cards</span>
                <span className="sm:hidden">🃏</span>
              </button>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create Unit</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Create Templates */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3 sm:mb-4">Quick Create Templates</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {quickCreateTemplates.map((template) => (
            <button
              key={template.name}
              onClick={() => handleQuickCreate(template.template)}
              disabled={isLoading}
              className="flex flex-col items-center p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 group"
            >
              <span className="text-base sm:text-lg mb-1 group-hover:scale-110 transition-transform">
                {template.template.bedrooms === 0 ? '🏠' : '🏢'}
              </span>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">{template.name}</span>
              <span className="text-xs text-gray-500">{template.template.area_internal}m²</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or block..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="studio">Studio</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
            </select>
          </div>
        </div>
      </div>

      {/* Units Display */}
      {filteredUnits.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white border border-gray-200 rounded-lg">
          <div className="text-3xl sm:text-4xl mb-4">🏠</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No units found</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
            {searchQuery || statusFilter || typeFilter 
              ? 'Try adjusting your search or filters'
              : 'Create your first unit to get started'
            }
          </p>
          {!searchQuery && !statusFilter && !typeFilter && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create First Unit</span>
              <span className="sm:hidden">Create Unit</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {viewMode === 'table' ? <UnitsTable /> : <UnitsCards />}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Processing...</span>
          </div>
        </div>
      )}

      {/* Unit Form Modal */}
      {showCreateModal && (
        <UnitForm
          projectId={projectId}
          unit={null}
          onSave={async (savedUnit) => {
            if (editingUnit) {
              await onUnitUpdate(savedUnit);
            } else {
              await onUnitCreate(savedUnit);
            }
            setShowCreateModal(false);
            setEditingUnit(null);
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingUnit(null);
          }}
        />
      )}

      {/* Edit Unit Modal */}
      {editingUnit && (
        <UnitForm
          projectId={projectId}
          unit={editingUnit}
          onSave={async (savedUnit) => {
            await onUnitUpdate(savedUnit);
            setShowCreateModal(false);
            setEditingUnit(null);
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingUnit(null);
          }}
        />
      )}
    </div>
  );
};

export default EnhancedUnitsManager;
