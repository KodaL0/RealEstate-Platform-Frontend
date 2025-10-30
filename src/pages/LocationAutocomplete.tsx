// LocationAutocomplete.tsx
import { useState, useEffect, useRef } from 'react';

// Mapbox API response types
interface MapboxContext {
  id: string;
  text: string;
  short_code?: string;
  wikidata?: string;
}

interface MapboxProperties {
  address?: string;
  category?: string;
  maki?: string;
  [key: string]: any;
}

interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: MapboxProperties;
  text: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  context?: MapboxContext[];
  address?: string;
}

interface MapboxResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
}

interface Suggestion {
  display_name: string;
  lat: number;
  lon: number;
  structured_data?: {
    country: string;
    region?: string;
    city?: string;
    postal_code?: string;
    street?: string;
  };
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (address: string, lat: number, lng: number, structuredData?: any) => void;
  placeholder?: string;
  inputClassName?: string;
  selectedCountry?: string; // To filter results by country
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Type address…',
  inputClassName = 'pl-3',
  selectedCountry = 'Cyprus'
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false); // Track when we're selecting from suggestions

  // <- use VITE_ var via import.meta.env
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

  // Get country code for Mapbox API
  const getCountryCode = (country: string) => {
    switch (country) {
      case 'Cyprus': return 'cy';
      case 'Greece': return 'gr';
      default: return 'cy';
    }
  };

  // Helper function to extract country from context
  const extractCountry = (context: MapboxContext[], fallback: string): string => {
    const country = context.find((c) => c.id.startsWith('country'))?.text;
    return country || fallback;
  };

  // Helper function to extract region from context with multiple fallbacks
  const extractRegion = (context: MapboxContext[]): string | undefined => {
    // Priority order: region > district > province > state
    const region = context.find((c) => c.id.startsWith('region'))?.text;
    if (region) return region;

    const district = context.find((c) => c.id.startsWith('district'))?.text;
    if (district) return district;

    const province = context.find((c) => c.id.startsWith('province'))?.text;
    if (province) return province;

    const state = context.find((c) => c.id.startsWith('state'))?.text;
    return state;
  };

  // Helper function to extract city from context with multiple fallbacks
  const extractCity = (
    context: MapboxContext[],
    placeName: string,
    placeTypes: string[]
  ): string | undefined => {
    // Priority order: place > locality > district > neighborhood
    const place = context.find((c) => c.id.startsWith('place'))?.text;
    if (place) return place;

    const locality = context.find((c) => c.id.startsWith('locality'))?.text;
    if (locality) return locality;

    // District might be city-level in some countries
    const district = context.find((c) => c.id.startsWith('district'))?.text;
    if (district && !placeTypes.includes('address')) {
      // Only use district as city if it's not an address result
      return district;
    }

    const neighborhood = context.find((c) => c.id.startsWith('neighborhood'))?.text;
    if (neighborhood) return neighborhood;

    // Fallback: Parse place_name if context is empty or incomplete
    if (placeName) {
      const parts = placeName.split(', ');
      if (parts.length >= 2) {
        // For "Street, City, Country" format: extract second-to-last part
        // For "City, Country" format: extract first part
        if (parts.length === 2) {
          // "City, Country" - city is first part
          return parts[0].trim();
        } else {
          // "Street, City, [Region], Country" - city is usually second-to-last
          // Try to find city (usually second-to-last before country)
          const potentialCity = parts[parts.length - 2]?.trim();
          if (potentialCity && potentialCity.length > 0) {
            return potentialCity;
          }
        }
      }
    }

    return undefined;
  };

  // Helper function to extract postal code from context
  const extractPostalCode = (
    context: MapboxContext[],
    placeName: string
  ): string | undefined => {
    // Check context first
    const postcode = context.find((c) => c.id.startsWith('postcode'))?.text;
    if (postcode) return postcode;

    const postalCode = context.find((c) => c.id.startsWith('postal_code'))?.text;
    if (postalCode) return postalCode;

    // Fallback: Extract from place_name using regex
    // Common formats: "12345", "12345-6789", "SW1A 1AA", etc.
    if (placeName) {
      // Look for postal code patterns in place_name
      // Usually appears as standalone or after city name
      const postalPatterns = [
        /\b\d{4,5}(-\d{4})?\b/, // US/Canada: 12345 or 12345-6789
        /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/i, // UK: SW1A 1AA
        /\b\d{5}\b/, // Generic 5-digit
      ];

      for (const pattern of postalPatterns) {
        const match = placeName.match(pattern);
        if (match) {
          return match[0].trim();
        }
      }
    }

    return undefined;
  };

  // Helper function to extract street address with multiple strategies
  const extractStreet = (
    feature: MapboxFeature,
    city: string | undefined,
    placeTypes: string[]
  ): string | undefined => {
    // Strategy 1: Use address property if available (most reliable)
    if (feature.properties?.address) {
      return feature.properties.address;
    }
    if (feature.address) {
      return feature.address;
    }

    // Strategy 2: Check if result type includes 'address'
    const isAddressType = placeTypes.includes('address');
    
    if (isAddressType && feature.place_name) {
      const parts = feature.place_name.split(', ');
      if (parts.length > 0) {
        const firstPart = parts[0].trim();
        
        // If first part is different from city, it's likely the street
        if (city && firstPart !== city && firstPart.length > 0) {
          return firstPart;
        }
        
        // If no city found but we have multiple parts, first part is likely street
        if (!city && parts.length >= 2) {
          return firstPart;
        }
      }
    }

    // Strategy 3: For place types (not address), street might be empty or in place_name
    if (!isAddressType) {
      // If place_name starts with something that looks like a street address
      // (contains numbers or common street indicators)
      const firstPart = feature.place_name.split(', ')[0]?.trim();
      if (firstPart && city && firstPart !== city) {
        // Check if it looks like a street (contains numbers or street keywords)
        const streetPattern = /\d+|street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln/i;
        if (streetPattern.test(firstPart)) {
          return firstPart;
        }
      }
    }

    return undefined;
  };

  useEffect(() => {
    // Skip if we're currently selecting from suggestions (prevents race condition)
    if (isSelectingRef.current) {
      return;
    }

    if (value.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const tid = setTimeout(async () => {
      const q = encodeURIComponent(value);
      const countryCode = getCountryCode(selectedCountry);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json`
                + `?autocomplete=true`
                + `&limit=5`
                + `&country=${countryCode}`
                + `&types=address,place`
                + `&access_token=${MAPBOX_TOKEN}`;

      const res = await fetch(url);
      if (!res.ok) {
        console.error('Mapbox error', res.status);
        setSuggestions([]);
        setOpen(false);
        return;
      }

      const data: MapboxResponse = await res.json();
      const features = data.features || [];

      // Log unexpected structures in development mode
      if (import.meta.env.DEV && features.length > 0) {
        const firstFeature = features[0];
        if (!firstFeature.place_name) {
          console.warn('[LocationAutocomplete] Missing place_name in Mapbox response:', firstFeature);
        }
        if (!firstFeature.context || firstFeature.context.length === 0) {
          console.warn('[LocationAutocomplete] Empty context array in Mapbox response:', firstFeature);
        }
      }

      const js = features.map((f: MapboxFeature) => {
        try {
          const context = f.context || [];
          const placeTypes = f.place_type || [];
          const placeName = f.place_name || '';

          // Extract structured data using robust helper functions
          const country = extractCountry(context, selectedCountry);
          const region = extractRegion(context);
          const city = extractCity(context, placeName, placeTypes);
          const postalCode = extractPostalCode(context, placeName);
          const street = extractStreet(f, city, placeTypes);

          return {
            display_name: placeName,
            lat: f.center[1],
            lon: f.center[0],
            structured_data: {
              country,
              region: region || undefined,
              city: city || undefined,
              postal_code: postalCode || undefined,
              street: street || undefined
            }
          };
        } catch (error) {
          // Handle parsing errors gracefully
          if (import.meta.env.DEV) {
            console.error('[LocationAutocomplete] Error parsing Mapbox feature:', error, f);
          }
          
          // Return minimal valid structure
          return {
            display_name: f.place_name || 'Unknown location',
            lat: f.center?.[1] || 0,
            lon: f.center?.[0] || 0,
            structured_data: {
              country: selectedCountry,
              region: undefined,
              city: undefined,
              postal_code: undefined,
              street: undefined
            }
          };
        }
      });
      setSuggestions(js);
      setOpen(js.length > 0);
    }, 300);

    return () => clearTimeout(tid);
  }, [value, MAPBOX_TOKEN, selectedCountry]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Reset selection flag when value changes externally (not from our selection)
  useEffect(() => {
    // If value matches a suggestion exactly, don't reset flag (we just selected it)
    const matchesSuggestion = suggestions.some(s => s.display_name === value);
    if (!matchesSuggestion) {
      isSelectingRef.current = false;
    }
  }, [value, suggestions]);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        className={`
          w-full ${inputClassName}
          pr-3 py-2 border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
        `}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-60 overflow-auto shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent document click handler from firing
                isSelectingRef.current = true; // Set flag to prevent useEffect from running
                onSelect(s.display_name, s.lat, s.lon, s.structured_data);
                setOpen(false);
                // Reset flag after a short delay to allow the value to update
                setTimeout(() => {
                  isSelectingRef.current = false;
                }, 100);
              }}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input from losing focus on click
              }}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
