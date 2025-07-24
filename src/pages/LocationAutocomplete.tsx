// LocationAutocomplete.tsx
import { useState, useEffect, useRef } from 'react';

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

  useEffect(() => {
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

      const { features } = await res.json();
      const js = features.map((f: any) => {
        // Parse structured data from Mapbox response
        const context = f.context || [];
        const country = context.find((c: any) => c.id.startsWith('country'))?.text || selectedCountry;
        const region = context.find((c: any) => c.id.startsWith('region'))?.text;
        const city = context.find((c: any) => c.id.startsWith('place'))?.text;
        const postalCode = context.find((c: any) => c.id.startsWith('postcode'))?.text;
        
        // Extract street from address components
        const addressParts = f.place_name.split(', ');
        const street = addressParts[0] || '';

        return {
          display_name: f.place_name,
          lat: f.center[1],
          lon: f.center[0],
          structured_data: {
            country,
            region,
            city,
            postal_code: postalCode,
            street
          }
        };
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
              onClick={() => {
                onSelect(s.display_name, s.lat, s.lon, s.structured_data);
                setOpen(false);
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
