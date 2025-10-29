# ✅ Smart Scroll Filter Bar - Auto Hide/Show

## Overview
SearchFilters now intelligently hides/shows based on scroll behavior, keeping focus on properties while maintaining easy access to filters.

---

## Scroll Behavior

### 🔼 **Scrolling Up** (Significant)
- **Threshold:** 50px upward scroll
- **Action:** Show filters ✅
- **Why:** User wants to refine search

### 🔽 **Scrolling Down**
- **Threshold:** 10px downward scroll
- **Action:** Hide filters ✅
- **Why:** User is browsing properties

### ⬆️ **At Top of Page**
- **Threshold:** < 100px from top
- **Action:** Always show filters ✅
- **Why:** Natural starting point

---

## Implementation

### Custom Hook: `useScrollDirection()`
```typescript
const useScrollDirection = () => {
  const [showFilters, setShowFilters] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      
      if (scrollY < 100) {
        // Always show at top
        setShowFilters(true);
      } else if (scrollY < lastScrollY.current - 50) {
        // Scrolling up significantly (50px threshold)
        setShowFilters(true);
      } else if (scrollY > lastScrollY.current + 10) {
        // Scrolling down
        setShowFilters(false);
      }
      
      lastScrollY.current = scrollY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return showFilters;
};
```

### Usage in Pages
```typescript
// In Buy.tsx and Rent.tsx
const Buy = () => {
  const showFilters = useScrollDirection(); // ✅ Add this hook
  
  return (
    <div>
      {/* Search Filters - Auto Hide/Show */}
      <motion.div
        animate={{ y: showFilters ? 0 : -200 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white sticky top-16 z-10 shadow-md"
      >
        <SearchFilters ... />
      </motion.div>
      
      {/* Properties */}
    </div>
  );
};
```

---

## User Experience Flow

### Scenario 1: Browsing Properties
```
1. User lands on page → Filters visible ✅
2. User scrolls down to browse → Filters slide up, hide 📤
3. Properties get full focus → Clean, uncluttered view 🎯
4. User continues scrolling → Filters stay hidden ✅
```

### Scenario 2: Refining Search
```
1. User browsing properties (filters hidden)
2. User scrolls up 50px+ → Filters slide down, show 📥
3. User changes filters → Properties update ✅
4. User scrolls down again → Filters hide again 📤
```

### Scenario 3: At Top of Page
```
1. User at top (< 100px) → Filters always visible ✅
2. No matter scroll direction → Filters stay visible
3. Natural starting point behavior ✅
```

---

## Technical Details

### Performance Optimization
- ✅ **requestAnimationFrame** - Throttles scroll events
- ✅ **Ticking flag** - Prevents multiple simultaneous updates
- ✅ **Ref for lastScrollY** - No unnecessary re-renders
- ✅ **Cleanup** - Removes event listener on unmount

### Thresholds Explained
| Threshold | Value | Purpose |
|-----------|-------|---------|
| **Top zone** | < 100px | Always show (page start) |
| **Scroll up** | -50px | Significant upward intent |
| **Scroll down** | +10px | Any downward movement |

**Why different values?**
- Small down threshold (10px) = Hide quickly when browsing
- Large up threshold (50px) = Only show when user deliberately scrolls up

---

## Animation

### Smooth Slide Transition
```typescript
<motion.div
  animate={{ y: showFilters ? 0 : -200 }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
>
```

**Properties:**
- **Duration:** 0.3s (fast but not jarring)
- **Easing:** easeInOut (smooth start and end)
- **Distance:** -200px (slides up completely out of view)
- **Sticky positioning:** Stays at `top: 16` (below navbar)

---

## Layout Structure

```
┌──────────────────────────────────────────┐
│        Navbar (Fixed, z-50)              │  ← Always visible
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│        Header (Blue/Purple)              │
│    "Properties for Sale/Rent"            │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│   FILTERS (Sticky top-16, z-10)          │  ← Auto hide/show
│   Slides up -200px when hidden           │
│   ┌────────────────────────────────────┐ │
│   │ Location | Country                 │ │
│   │ Min|Max|Type|Beds|Baths            │ │
│   │ ✨ Amenities ▼    Clear            │ │
│   └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│        Results (3-column grid)           │  ← Main focus
│   ┌─────┐  ┌─────┐  ┌─────┐            │
│   │Card │  │Card │  │Card │            │
│   └─────┘  └─────┘  └─────┘            │
│                                          │
│   (Scroll down → Filters hide)          │
│   (Scroll up → Filters show)            │
└──────────────────────────────────────────┘
```

---

## Responsive Behavior

### Mobile (< 768px)
- Filters: 2-row compact layout
- Country: 3 buttons (🌍|🇨🇾|🇬🇷)
- Properties: 1 column
- Scroll behavior: Same auto hide/show

### Tablet (768px - 1024px)
- Filters: 2-row optimized
- Properties: 2 columns
- Scroll behavior: Same auto hide/show

### Desktop (≥ 1024px)
- Filters: Full horizontal layout (12-column grid)
- Properties: 3 columns
- Scroll behavior: Same auto hide/show

---

## Benefits

### UX Benefits
✅ **Uncluttered** - Properties get full attention  
✅ **Always accessible** - Scroll up to show filters  
✅ **Smart** - Hides only when browsing down  
✅ **Natural** - Always visible at page top  
✅ **Smooth** - Animated transitions  

### Performance
✅ **Optimized** - requestAnimationFrame throttling  
✅ **Efficient** - No unnecessary re-renders  
✅ **Lightweight** - Pure scroll detection, no heavy libraries  

### User Intent Recognition
✅ **Browsing down** = Hide filters (focus on content)  
✅ **Scrolling up** = Show filters (refine search)  
✅ **At top** = Show filters (natural entry point)  

---

## Compact Filter Design

### Row 1: Location + Country
```
[📍 Location input (60%)] [🌍 All|🇨🇾Cyprus|🇬🇷Greece (40%)]
```

### Row 2: Price + Type + Beds + Baths
```
[💰Min] [💰Max] [🏠 Property Type] [🛏️Beds] [🚿Baths]
```

### Row 3: Actions
```
✨ Amenities [5] ▼         Clear
```

### Row 4: Active Filters (when present)
```
[📍 Limassol ×] [🌍 Cyprus ×] [💰 €200k+ ×] [🛏️ 2+ ×]
```

---

## Testing Checklist

✅ **Load page** - Filters should be visible  
✅ **Scroll down slowly** - Filters should hide after 10px  
✅ **Scroll up slowly** - No change until 50px up  
✅ **Scroll up 50px+** - Filters should appear  
✅ **Scroll to very top** - Filters always visible  
✅ **Change filter** - Search updates, filters stay visible  
✅ **Mobile test** - Same behavior on mobile  

---

## Summary

| Aspect | Implementation |
|--------|---------------|
| **Hide trigger** | Scroll down 10px |
| **Show trigger** | Scroll up 50px OR < 100px from top |
| **Animation** | 0.3s easeInOut slide |
| **Position** | Sticky at top-16 |
| **Z-index** | 10 (below navbar z-50) |
| **Focus** | Properties (filters auto-hide) ✅ |
| **Accessibility** | Always accessible via scroll up ✅ |
| **Performance** | requestAnimationFrame optimized ✅ |

---

**Result: Properties are the main focus, filters intelligently hide/show!** 🎯








