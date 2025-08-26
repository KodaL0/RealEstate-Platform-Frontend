import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Copy, Edit, Trash2, Eye, MoreHorizontal, Search, Filter, Grid, List, Building, Home, Layers } from 'lucide-react';
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
      // Simple approach: append timestamp to ensure uniqueness
      const timestamp = Date.now().toString().slice(-4);
      const newCode = `${unit.code}-${timestamp}`;
      
      console.log('Duplicating unit:', {
        originalCode: unit.code,
        newCode: newCode,
        projectId: projectId
      });
      
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
  }, [onUnitDuplicate, projectId]);

  // Generate smart code based on existing pattern
  const generateSmartCode = (originalCode: string, existingUnits: Unit[]): string => {
    // Simple approach: append timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4);
    return `${originalCode}-${timestamp}`;
  };

  // Quick actions for common unit types
  const quickCreateTemplates = [
    {
      name: 'Studio',
      icon: Home,
      color: 'from-blue-500 to-blue-600',
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
      icon: Building,
      color: 'from-emerald-500 to-emerald-600',
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
      icon: Layers,
      color: 'from-violet-500 to-violet-600',
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
      icon: Building,
      color: 'from-amber-500 to-amber-600',
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

  // Get status styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border border-emerald-200';
      case 'reserved':
        return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border border-amber-200';
      case 'sold':
        return 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-800 border border-slate-200';
    }
  };

  // Responsive table component
  const UnitsTable = () => (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Unit Code</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Type & Layout</th>
              <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Floor</th>
              <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Area</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredUnits.map((unit, index) => (
              <tr key={unit.id} className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{unit.code}</div>
                      {unit.block && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-200">
                          Block {unit.block}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-slate-900">
                      {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} Bedroom`}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <span className="capitalize">{unit.unit_type}</span>
                      <span>•</span>
                      <span>{unit.bathrooms} Bath{unit.bathrooms !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-6 py-5 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-800 border border-indigo-200">
                    {unit.floor || 'N/A'}
                  </span>
                </td>
                <td className="hidden md:table-cell px-6 py-5 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">
                    {unit.area_total ? `${unit.area_total}m²` : '-'}
                  </div>
                  {unit.area_internal && unit.area_internal !== unit.area_total && (
                    <div className="text-xs text-slate-500">
                      {unit.area_internal}m² internal
                    </div>
                  )}
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm font-semibold text-slate-900">
                    {unit.price ? `€${unit.price.toLocaleString()}` : '-'}
                  </div>
                  {unit.currency && unit.price && (
                    <div className="text-xs text-slate-500">
                      {unit.vat_included ? 'VAT incl.' : 'VAT excl.'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusStyling(unit.status)}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      unit.status === 'available' ? 'bg-emerald-500' :
                      unit.status === 'reserved' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}></div>
                    {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingUnit(unit);
                        setShowCreateModal(true);
                      }}
                      className="group p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-md border border-transparent hover:border-blue-200"
                      title="Edit Unit"
                    >
                      <Edit className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleSmartDuplicate(unit)}
                      className="group p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:shadow-md border border-transparent hover:border-emerald-200"
                      title="Duplicate Unit"
                    >
                      <Copy className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => onUnitDelete(unit.id)}
                      className="group p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-md border border-transparent hover:border-red-200"
                      title="Delete Unit"
                    >
                      <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {filteredUnits.map((unit) => (
        <div key={unit.id} className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:border-blue-300 hover:-translate-y-1">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{unit.code}</h3>
                {unit.block && (
                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-200">
                    Block {unit.block}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1 ml-3">
              <button
                onClick={() => {
                  setEditingUnit(unit);
                  setShowCreateModal(true);
                }}
                className="group/btn p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-md border border-transparent hover:border-blue-200"
                title="Edit Unit"
              >
                <Edit className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => handleSmartDuplicate(unit)}
                className="group/btn p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:shadow-md border border-transparent hover:border-emerald-200"
                title="Duplicate Unit"
              >
                <Copy className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => onUnitDelete(unit.id)}
                className="group/btn p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-md border border-transparent hover:border-red-200"
                title="Delete Unit"
              >
                <Trash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-600">Type:</span>
              <span className="text-sm font-semibold text-slate-900">
                {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms}BR ${unit.unit_type}`}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-600">Area:</span>
              <span className="text-sm font-semibold text-slate-900">
                {unit.area_total ? `${unit.area_total}m²` : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-600">Floor:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-800 border border-indigo-200">
                {unit.floor || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-600">Price:</span>
              <span className="text-sm font-bold text-slate-900">
                {unit.price ? `€${unit.price.toLocaleString()}` : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-slate-600">Status:</span>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusStyling(unit.status)}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  unit.status === 'available' ? 'bg-emerald-500' :
                  unit.status === 'reserved' ? 'bg-amber-500' :
                  'bg-red-500'
                }`}></div>
                {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 p-8">
        <div className="flex flex-col space-y-6 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">
              Units Management
            </h2>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">{units.length} total unit{units.length !== 1 ? 's' : ''}</span>
              </span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-medium">{filteredUnits.length} shown</span>
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  viewMode === 'table' 
                    ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  viewMode === 'cards' 
                    ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Grid className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="group inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Create Unit</span>
              <span className="sm:hidden">Add Unit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Create Templates */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Plus className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Quick Create Templates</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickCreateTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.name}
                onClick={() => handleQuickCreate(template.template)}
                disabled={isLoading}
                className="group flex flex-col items-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 disabled:opacity-50 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-900 text-center mb-1 group-hover:text-blue-700 transition-colors">
                  {template.name}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {template.template.area_internal}m² • {template.template.bathrooms} bath{template.template.bathrooms !== 1 ? 's' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 p-8">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by unit code or block..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-900 placeholder-slate-500 bg-slate-50 focus:bg-white shadow-inner"
            />
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-900 bg-slate-50 focus:bg-white shadow-inner appearance-none"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            
            <div className="relative">
              <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-900 bg-slate-50 focus:bg-white shadow-inner appearance-none"
              >
                <option value="">All Types</option>
                <option value="studio">Studio</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Units Display */}
      {filteredUnits.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">No units found</h3>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            {searchQuery || statusFilter || typeFilter 
              ? 'Try adjusting your search criteria or filters to find the units you\'re looking for.'
              : 'Get started by creating your first unit using one of the quick templates above.'
            }
          </p>
          {!searchQuery && !statusFilter && !typeFilter && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create First Unit
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden">
          {viewMode === 'table' ? <UnitsTable /> : <UnitsCards />}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 flex items-center space-x-4 shadow-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-slate-700 font-medium">Processing your request...</span>
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