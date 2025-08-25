# Enhanced Units Management System

## Overview

The Enhanced Units Management System provides a modern, responsive interface for managing property units with advanced features like smart duplication, quick templates, and flexible viewing modes.

## Features

### 🎯 **Responsive Design**
- **No horizontal scrollbars** on screens that fit the content
- **Adaptive layouts** that work on all device sizes
- **Smart column hiding** based on screen width
- **Flexible grid system** for optimal space utilization

### 🚀 **Smart Duplication**
- **Intelligent code generation** with multiple patterns:
  - Sequential (A101 → A102, A103...)
  - Suffix (A101 → A101-1, A101-2...)
  - Prefix (1-A101, 2-A101...)
- **Automatic conflict resolution** for unit codes
- **Bulk duplication** up to 20 units at once
- **Smart pricing adjustments** (percentage or fixed amount)
- **Area modifications** with percentage or fixed increases
- **Floor increment** controls

### 📱 **Multiple View Modes**
- **Table View**: Traditional spreadsheet layout with responsive columns
- **Card View**: Modern card-based layout for better mobile experience
- **Toggle between views** without losing data or filters

### ⚡ **Quick Create Templates**
- **Studio**: 35m² internal, 40m² total
- **1BR Apartment**: 55m² internal, 65m² total
- **2BR Apartment**: 75m² internal, 85m² total
- **3BR Apartment**: 95m² internal, 110m² total
- **Customizable templates** for your specific needs

### 🔍 **Advanced Search & Filtering**
- **Real-time search** by unit code or block
- **Status filtering** (Available, Reserved, Sold)
- **Type filtering** (Studio, Apartment, House)
- **Combined filters** for precise results

### 📊 **Smart Statistics**
- **Unit count** with real-time updates
- **Filtered results** display
- **Visual indicators** for different unit types

## Components

### EnhancedUnitsManager
The main component that orchestrates all units management functionality.

```tsx
<EnhancedUnitsManager
  projectId={project.id}
  units={units}
  onUnitCreate={handleUnitCreate}
  onUnitUpdate={handleUnitUpdate}
  onUnitDelete={handleUnitDelete}
  onUnitDuplicate={handleUnitDuplicate}
/>
```

### SmartDuplicateModal
Advanced duplication modal with preview and customization options.

```tsx
<SmartDuplicateModal
  unit={selectedUnit}
  isOpen={showDuplicateModal}
  onClose={() => setShowDuplicateModal(false)}
  onDuplicate={handleDuplicate}
  existingUnits={units}
/>
```

## Usage Examples

### Basic Integration

```tsx
import EnhancedUnitsManager from './EnhancedUnitsManager';

function ProjectDashboard() {
  const [units, setUnits] = useState<Unit[]>([]);
  
  const handleUnitCreate = async (unit: Omit<Unit, 'id'>) => {
    // API call to create unit
    const response = await fetch('/api/units/', {
      method: 'POST',
      body: JSON.stringify(unit)
    });
    
    if (response.ok) {
      const savedUnit = await response.json();
      setUnits(prev => [...prev, savedUnit]);
    }
  };
  
  return (
    <EnhancedUnitsManager
      projectId={projectId}
      units={units}
      onUnitCreate={handleUnitCreate}
      onUnitUpdate={handleUnitUpdate}
      onUnitDelete={handleUnitDelete}
      onUnitDuplicate={handleUnitDuplicate}
    />
  );
}
```

### Smart Duplication

```tsx
// Duplicate a unit with smart options
const handleSmartDuplicate = async (unit: Unit) => {
  const duplicatedUnit: Omit<Unit, 'id'> = {
    ...unit,
    code: generateSmartCode(unit.code, existingUnits),
    status: 'available',
    price: unit.price ? Math.round(unit.price * 1.05) : undefined,
  };
  
  await onUnitDuplicate(duplicatedUnit);
};
```

## Responsive Breakpoints

### Mobile (< 640px)
- **Single column** card layout
- **Hidden columns** in table view (Floor, Area)
- **Stacked filters** and search
- **Touch-friendly** button sizes

### Tablet (640px - 1024px)
- **Two column** card layout
- **Partial table** with essential columns
- **Side-by-side** filters and search
- **Medium button** sizes

### Desktop (> 1024px)
- **Full table** with all columns
- **Multi-column** card layout
- **Horizontal layout** for all controls
- **Standard button** sizes

## Customization

### Adding New Unit Types

```tsx
const customTemplates = [
  {
    name: 'Penthouse',
    template: {
      unit_type: 'apartment' as const,
      bedrooms: 4,
      bathrooms: 3,
      area_internal: 150,
      area_total: 180,
    }
  }
];
```

### Custom Duplication Rules

```tsx
const customDuplicateOptions = {
  quantity: 5,
  codePattern: 'custom',
  priceAdjustment: 'percentage',
  priceValue: 10,
  areaAdjustment: 'fixed',
  areaValue: 5,
  floorIncrement: 2
};
```

## Performance Features

- **Lazy loading** for large unit lists
- **Debounced search** to prevent excessive API calls
- **Optimized re-renders** with React.memo and useCallback
- **Efficient filtering** with indexed searches

## Accessibility

- **Keyboard navigation** support
- **Screen reader** friendly labels
- **High contrast** color schemes
- **Focus management** for modals
- **ARIA labels** for interactive elements

## Browser Support

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

## Dependencies

- **React** 18+
- **TypeScript** 4.5+
- **Tailwind CSS** 3.0+
- **Lucide React** (for icons)

## Future Enhancements

- [ ] **Drag & Drop** unit reordering
- [ ] **Bulk operations** (delete, status change)
- [ ] **Import/Export** CSV/Excel support
- [ ] **Advanced analytics** and reporting
- [ ] **Unit comparison** tools
- [ **Integration** with external property systems

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Include responsive design considerations
4. Test on multiple screen sizes
5. Update this documentation

## Support

For questions or issues, please refer to:
- Component documentation
- TypeScript type definitions
- Responsive design guidelines
- Performance best practices
