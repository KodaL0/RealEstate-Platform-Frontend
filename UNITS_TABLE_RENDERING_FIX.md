# Units Table Rendering Fix

## Problem Summary
The units table was sometimes not displaying when editing a property with units due to race conditions and incomplete state management.

## Root Causes Identified

### 1. **Missing `has_units` and `units` in Parent Component**
- `CreateListing.tsx` loaded property data but didn't load or set the `has_units` flag or `units` array
- This meant the form state was incomplete when passed to Step2

### 2. **Race Condition in Async Loading**
- Units were loaded asynchronously in a `.then()` callback
- There was a period where `has_units` could be `true` but `units` was `[]` or `undefined`
- React could render during this intermediate state, causing the table to not appear

### 3. **Unclear Data Loading Coordination**
- Both parent (`CreateListing.tsx`) and child (`Step2_PropertyDetails.tsx`) tried to load property data
- The `hasLoadedPropertyData` flag was supposed to coordinate them, but the parent didn't load units

## Fixes Applied

### Fix 1: Load Units in Parent Component (`CreateListing.tsx`)

**Location:** Lines 517-570

**What Changed:**
```typescript
// Before: Units were not loaded at all

// After: Added async function to load units before setting form state
const loadUnits = async () => {
  if (d.has_units) {
    try {
      const unitsRes = await api.propertyUnits.list(Number(id));
      const unitsData = ((unitsRes.data as any)?.results ?? unitsRes.data) as PropertyUnit[];
      const arr = Array.isArray(unitsData) ? unitsData : [];
      console.log("✅ Loaded units in parent:", arr.length);
      return arr;
    } catch (err) {
      console.warn("Failed to load units in parent:", err);
      return [];
    }
  }
  return [];
};

const units = await loadUnits();

// Now setFormData includes has_units and units
setFormData((prev) => ({
  ...prev,
  // ... other fields ...
  has_units: d.has_units || false,
  units: units,
}));
```

**Why This Helps:**
- Units are loaded **synchronously** before form data is set
- Ensures `has_units` and `units` are always in sync
- Eliminates the race condition

### Fix 2: Enhanced Step2 Logging and Skip Logic (`Step2_PropertyDetails.tsx`)

**Location:** Lines 334-342

**What Changed:**
```typescript
// Before: Silent skip
if (!isEditing || !propertyId || !username || hasLoadedData || hasLoadedPropertyData) return;

// After: Log why we're skipping
if (!isEditing || !propertyId || !username || hasLoadedData || hasLoadedPropertyData) {
  if (hasLoadedPropertyData) {
    console.log("✅ Step2: Skipping data load - parent already loaded. has_units:", 
                formData.has_units, "units count:", formData.units?.length || 0);
  }
  return;
}
```

**Why This Helps:**
- Provides visibility into the data flow
- Confirms when parent has successfully loaded units
- Aids in debugging

### Fix 3: Store Original Units When Loaded by Parent

**Location:** Lines 276-289

**What Changed:**
```typescript
// NEW: Store original units for change tracking when loaded by parent
useEffect(() => {
  if (isEditing && formData.units && formData.units.length > 0 && originalUnitsRef.current.size === 0) {
    const unitsMap = new Map<number, PropertyUnit>();
    formData.units.forEach((unit) => {
      if (unit.id) {
        unitsMap.set(unit.id, { ...unit });
      }
    });
    if (unitsMap.size > 0) {
      originalUnitsRef.current = unitsMap;
      console.log("📦 Step2: Stored original units from parent load:", unitsMap.size);
    }
  }
}, [isEditing, formData.units?.length]);
```

**Why This Helps:**
- Ensures change tracking works regardless of which component loads the data
- Prevents unnecessary API calls for unchanged units

### Fix 4: Improved Table Rendering with Debug Info

**Location:** Lines 1034-1062

**What Changed:**
```typescript
// Before: Silent failure if conditions not met
{isMultiUnit && formData.units && formData.units.length > 0 && (
  <div className="space-y-3">
    {/* table */}
  </div>
)}

// After: Debug logging and loading state
{/* Debug logging for table visibility */}
{isEditing && formData.has_units && (
  <>
    {console.log("🔍 Table render check:", {
      isMultiUnit,
      has_units: formData.has_units,
      unitsExists: !!formData.units,
      unitsLength: formData.units?.length || 0,
      willRender: isMultiUnit && formData.units && formData.units.length > 0
    })}
  </>
)}

{isMultiUnit && formData.units && formData.units.length > 0 ? (
  <div className="space-y-3">
    {/* table */}
  </div>
) : isMultiUnit && isEditing ? (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <p className="text-sm text-yellow-800">
      ⚠️ Loading units... (has_units: {String(formData.has_units)}, units: {formData.units?.length || 0})
    </p>
  </div>
) : null}
```

**Why This Helps:**
- Provides real-time debugging in the console
- Shows a loading state if units are expected but not yet loaded
- Makes the problem visible instead of silently failing

### Fix 5: Prevent Checkbox Toggle When Units Exist

**Location:** Lines 1010-1031

**What Changed:**
```typescript
<input
  type="checkbox"
  id="has_units"
  checked={isMultiUnit}
  disabled={isEditing && formData.units && formData.units.length > 0}  // NEW
  onChange={(e) => { /* ... */ }}
/>
<label htmlFor="has_units" className="font-semibold text-lg cursor-pointer text-gray-800">
  This property has multiple units
  {isEditing && formData.units && formData.units.length > 0 && (
    <span className="ml-2 text-sm font-normal text-gray-600">
      ({formData.units.length} units)  // NEW
    </span>
  )}
</label>

{isEditing && formData.units && formData.units.length > 0 && (
  <p className="text-xs text-gray-600 mb-3">
    ℹ️ This property has existing units. The checkbox cannot be unchecked while units exist.
  </p>
)}
```

**Why This Helps:**
- Prevents accidental data loss by disabling the toggle when units exist
- Shows the unit count for confirmation
- Provides clear user feedback

## Testing Recommendations

### Test Case 1: Edit Property with Units
1. Navigate to "My Listings"
2. Click Edit on a property that has multiple units
3. Go to Step 2 (Property Details)
4. **Expected Result:** Units table should appear immediately with all existing units
5. **Check Console:** Should see "✅ Step2: Skipping data load - parent already loaded"

### Test Case 2: Units Display Correctly
1. After step 1, verify all unit data is visible:
   - Unit numbers
   - Names (if set)
   - Area, bedrooms, bathrooms
   - Floor levels, parking, lot size (property-type specific)
   - Prices
   - Status
2. **Expected Result:** All fields should display existing values, not empty

### Test Case 3: Edit Units
1. Modify a unit's price
2. Modify a unit's area
3. Click "Continue" to next step
4. **Check Console:** Should see "📝 Updating X of Y units" where X is the number you changed
5. **Expected Result:** Only modified units are sent to the API (check network tab)

### Test Case 4: Add New Unit
1. Click "Add Unit" button
2. Fill in the new unit's details
3. Click "Continue"
4. **Expected Result:** New unit is saved, existing units show no unnecessary updates

### Test Case 5: Different Property Types
Test with:
- House (should show lot size, total floors, parking as required)
- Apartment (should show floor level as required)
- Shop (should show floor level as required, bathrooms can be 0)
- Office (should show floor level as required, bathrooms can be 0)

## Debugging Tips

If the table still doesn't appear, check the console for:

1. **Loading Confirmation:**
   ```
   ✅ Loaded units in parent: X
   ```
   Should appear when property loads

2. **Skip Confirmation:**
   ```
   ✅ Step2: Skipping data load - parent already loaded. has_units: true units count: X
   ```
   Should appear when Step2 mounts

3. **Render Check:**
   ```
   🔍 Table render check: {
     isMultiUnit: true,
     has_units: true,
     unitsExists: true,
     unitsLength: X,
     willRender: true
   }
   ```
   All values should be true/positive

4. **Loading State:**
   If you see the yellow "Loading units..." message, it means:
   - `has_units` is true
   - But `units` array is empty
   - This indicates a data loading failure - check network tab

## Files Modified

1. `src/pages/CreateListing.tsx`
   - Added units loading in `loadPropertyData()` function
   - Added `has_units` and `units` to form state initialization

2. `src/pages/CreateListing/steps/Step2_PropertyDetails.tsx`
   - Added useEffect to store original units from parent load
   - Enhanced logging throughout
   - Added debug rendering and loading state
   - Disabled checkbox toggle when units exist
   - Fixed linter warnings (isNaN → Number.isNaN, exhaustive-deps)

## Additional Notes

- **Performance:** Units are now loaded only once by the parent component, reducing API calls
- **Change Tracking:** The `originalUnitsRef` ensures only modified units are updated
- **User Experience:** Clear feedback when data is loading or unavailable
- **Developer Experience:** Extensive logging makes debugging much easier

## Rollback Plan

If issues arise, revert these commits:
1. Changes to `src/pages/CreateListing.tsx` (lines 517-570)
2. Changes to `src/pages/CreateListing/steps/Step2_PropertyDetails.tsx` (multiple sections)

The code will fall back to the Step2-only loading mechanism, though the race condition may reappear.
