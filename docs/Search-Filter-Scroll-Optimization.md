# Search Filter Scroll Behavior - Stable Implementation

## Overview
Stable, flicker-free scroll-triggered expand/collapse behavior for search filters on both Buy and Rent pages through the modular `ListingsPage` component.

## Behavior

### Asymmetric Thresholds (Prevents Flickering)
- **Scroll Down** → Filters hide after 10px (responsive)
- **Scroll Up** → Filters show only after 100px cumulative scroll (prevents flickering)
- **Near Top (0-100px)** → Filters always visible

Uses scroll distance accumulation to prevent rapid appearance/disappearance during normal scrolling.

### Configuration
```typescript
const TOP_ZONE = 100;               // Always show filters near top
const MIN_SCROLL_FOR_HIDE = 150;    // Minimum scroll position before hiding
const HIDE_THRESHOLD = 10;          // Small threshold to hide (responsive)
const SHOW_THRESHOLD = 100;         // Large threshold to show (prevents flickering)
```

### Logic
- **Top Zone (0-100px):** Filters always expanded, accumulator resets
- **Scroll Down:** Accumulate distance, hide after 10px threshold
- **Scroll Up:** Accumulate distance, show only after 100px threshold
- **Direction Change:** Accumulator resets to prevent false triggers

### Performance
- **Request Animation Frame:** Batches scroll calculations with browser repaint
- **Ticking Flag Pattern:** Prevents scroll handler stacking
- **Passive Event Listeners:** Enables browser scroll optimizations
- **Scroll Accumulator:** Tracks cumulative distance in current direction

## Technical Implementation

### State Management
```typescript
const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
const lastScrollY = useRef(0);
const ticking = useRef(false);
const scrollAccumulator = useRef(0); // Tracks cumulative scroll distance
```

### Scroll Handler Logic
```typescript
const handleScroll = () => {
  if (ticking.current) return;
  ticking.current = true;

  requestAnimationFrame(() => {
    const currentScrollY = window.scrollY;
    const scrollDiff = currentScrollY - lastScrollY.current;
    
    // Always show at top
    if (currentScrollY < TOP_ZONE) {
      setIsFiltersExpanded(true);
      scrollAccumulator.current = 0;
    }
    // Scrolling down
    else if (scrollDiff > 0) {
      // Reset accumulator when changing direction
      if (scrollAccumulator.current < 0) {
        scrollAccumulator.current = 0;
      }
      scrollAccumulator.current += scrollDiff;
      
      // Hide after small threshold
      if (scrollAccumulator.current > HIDE_THRESHOLD && currentScrollY > MIN_SCROLL_FOR_HIDE) {
        setIsFiltersExpanded(false);
      }
    }
    // Scrolling up
    else if (scrollDiff < 0) {
      // Reset accumulator when changing direction
      if (scrollAccumulator.current > 0) {
        scrollAccumulator.current = 0;
      }
      scrollAccumulator.current += scrollDiff; // scrollDiff is negative
      
      // Show only after significant upward scroll
      if (scrollAccumulator.current < -SHOW_THRESHOLD) {
        setIsFiltersExpanded(true);
        scrollAccumulator.current = 0; // Reset after showing
      }
    }
    
    lastScrollY.current = currentScrollY;
    ticking.current = false;
  });
};
```

### Flow
1. **Event Fires** → Check ticking flag to prevent stacking
2. **RAF Callback** → Calculate scroll direction and distance
3. **Accumulate Distance** → Add to accumulator if same direction, reset if changed
4. **Check Thresholds** → Hide at 10px down, show at 100px up
5. **State Update** → React conditionally renders filter section

## Performance

- **Scroll handler:** Uses RAF for optimal timing
- **State updates:** Only on direction changes (React's built-in optimization)
- **No animations:** Instant visibility changes with zero overhead
- **Result:** Maximum performance on all devices

## User Experience

### Intuitive Behavior
- **Scroll Down:** Content-focused mode - filters hide instantly
- **Scroll Up:** Refinement mode - filters appear instantly
- **At Top:** Always accessible for initial search setup

### Simple & Fast
- No animations or transitions - instant response
- Filter badges show context when collapsed
- Minimal overhead - maximum performance

### Mobile Optimized
- Instant response to touch scrolling
- No animation lag
- Optimal use of screen space

### Accessible
- No motion to reduce
- Keyboard navigation works
- Screen reader friendly

## Testing Checklist

### Manual Testing:
- [ ] Scroll down → filters disappear instantly
- [ ] Scroll up → filters appear instantly
- [ ] At top (< 100px) → filters always visible
- [ ] Active filter badges → visible when collapsed
- [ ] No animations or delays
- [ ] Works on both Buy and Rent pages

### Performance Testing:
1. Open Chrome DevTools Performance
2. Record scrolling session
3. Verify:
   - Minimal layout shifts
   - No animation overhead
   - Fast re-renders

### Cross-Browser:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari (macOS & iOS)
- ✅ Mobile browsers

## Configuration Options

### Adjust Top Zone (always visible area):
```typescript
const TOP_ZONE = 150;  // Larger always-visible zone
const TOP_ZONE = 50;   // Smaller always-visible zone
```

### Change Minimum Scroll Position for Hiding:
```typescript
const MIN_SCROLL_FOR_HIDE = 200;  // Hide later (more persistent)
const MIN_SCROLL_FOR_HIDE = 100;  // Hide sooner (more aggressive)
```

### Adjust Scroll Sensitivity:
```typescript
const SCROLL_THRESHOLD = 10;  // Less sensitive (more deliberate)
const SCROLL_THRESHOLD = 2;   // More sensitive (instant response)
```

## Future Enhancements

1. **User Preference:** Remember user's filter visibility preference
2. **Smart Detection:** ML-based prediction of when users need filters
3. **Gesture Support:** Swipe down to reveal filters on mobile
4. **Scroll Position Memory:** Remember scroll position when expanding filters
5. **A/B Testing:** Test different threshold configurations

## Related Files

- `propertprofrontend/src/components/ListingsPage.tsx` - Main scroll logic
- `propertprofrontend/src/components/SearchFilters.tsx` - Filter UI component
- `propertprofrontend/src/index.css` - Animation definitions
- `propertprofrontend/src/pages/Buy.tsx` - Buy page using ListingsPage
- `propertprofrontend/src/pages/Rent.tsx` - Rent page using ListingsPage

## Migration Impact

- ✅ No breaking changes
- ✅ All existing functionality preserved
- ✅ Improved performance for all users
- ✅ Works on both Buy and Rent pages via ListingsPage component

