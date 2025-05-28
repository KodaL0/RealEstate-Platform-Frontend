import React, { useState, useEffect, useRef } from 'react';

interface Suggestion {
  display_name: string;
  lat: number;
  lon: number;
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
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN!;

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const tid = setTimeout(async () => {
      const q = encodeURIComponent(value);
      const url = [
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json`,
        `?autocomplete=true`,
        `&limit=5`,
        `&country=cy`,
        `&types=address,place`,
        `&access_token=${MAPBOX_TOKEN}`
      ].join('');

      try {
        const res = await fetch(url);
        const { features } = await res.json();
        const js: Suggestion[] = features.map((f: any) => ({
          display_name: f.place_name,
          lat: f.center[1],
          lon: f.center[0]
        }));
        setSuggestions(js);
        setOpen(js.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);

    return () => clearTimeout(tid);
  }, [value, MAPBOX_TOKEN]);

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
                onSelect(s.display_name, s.lat, s.lon);
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
