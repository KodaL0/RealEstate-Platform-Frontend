import React, { useState, useEffect, useRef } from 'react';

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  inputClassName?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Type address…',
  inputClassName = 'pl-3'
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions 300ms after user stops typing
useEffect(() => {
  if (value.length < 3) {
    setSuggestions([]);
    return;
  }

  const tid = setTimeout(async () => {
    const q = encodeURIComponent(value);
    // bbox covering Cyprus: [west lon, south lat, east lon, north lat]
    const cyBbox = '32.27,34.55,34.97,35.67';
    const url = [
      `https://photon.komoot.io/api/`,
      `?q=${q}`,
      `&limit=5`,
      `&lang=en`,
      `&bbox=${cyBbox}`
    ].join('');

    try {
      const res = await fetch(url);
      const { features } = await res.json();

      const js: Suggestion[] = features.map((f: any) => {
        const p = f.properties;
        // build display name from whatever parts are present
        const parts = [
          p.housenumber,
          p.street,
          p.city,
          p.country
        ].filter(Boolean);
        return {
          display_name: parts.join(', '),
          lat: String(f.geometry.coordinates[1]),
          lon: String(f.geometry.coordinates[0])
        };
      });

      setSuggestions(js);
      setOpen(js.length > 0);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
      setOpen(false);
    }
  }, 300);

  return () => clearTimeout(tid);
}, [value]);


  // Close dropdown on outside click
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
          w-full
          ${inputClassName}
          pr-3 py-2 border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
        `}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-60 overflow-auto shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onSelect(s.display_name, +s.lat, +s.lon);
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
