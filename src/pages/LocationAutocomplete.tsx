// LocationAutocomplete.tsx
import { useCallback, useEffect, useId, useRef, useState } from "react";

// Structured data type
type Structured = {
  country: string;
  region?: string;
  city?: string;
  postal_code?: string;
  street?: string;
};

interface Suggestion {
  display_name: string;
  lat: number;
  lon: number;
  structured_data?: Structured;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (address: string, lat: number, lng: number, structuredData?: Structured) => void;
  placeholder?: string;
  inputClassName?: string;
}

// Debounce hook
function useDebounced<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Type address…",
  inputClassName = "pl-3",
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, Suggestion[]>>(new Map());
  const suppressFetchRef = useRef(false);
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;

  const debounced = useDebounced(value.trim(), 250);

  // Close on outside pointerdown (better than click for avoiding focus issues)
  useEffect(() => {
    const handler = (e: Event) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler, { capture: true });
    return () => document.removeEventListener("pointerdown", handler, { capture: true } as any);
  }, []);

  // Fetch suggestions with AbortController and caching
  const fetchSuggestions = useCallback(async (query: string) => {
    const apiKey = import.meta.env.VITE_GEOAPIFY_KEY;
    if (!apiKey) {
      console.error("[LocationAutocomplete] Missing Geoapify key");
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // Cache hit
    if (cacheRef.current.has(query)) {
      const cached = cacheRef.current.get(query)!;
      setSuggestions(cached);
      setOpen(cached.length > 0);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        text: query,
        limit: "5",
        lang: "en",
        countrycodes: "gr,cy",
        apiKey,
      });

      const url = `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`;
      const res = await fetch(url, { signal: ac.signal });
      if (!res.ok) throw new Error(`Geoapify ${res.status}`);

      const data = await res.json();

      const mapped: Suggestion[] = (data.features ?? []).map((f: any) => ({
        display_name: f.properties.formatted,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        structured_data: {
          country: f.properties.country,
          region: f.properties.state,
          city: f.properties.city,
          postal_code: f.properties.postcode,
          street:
            [f.properties.street, f.properties.housenumber].filter(Boolean).join(" ") || undefined,
        },
      }));

      cacheRef.current.set(query, mapped);
      setSuggestions(mapped);
      setOpen(mapped.length > 0);
    } catch (err) {
      const error = err as { name?: string };
      if (error.name !== "AbortError") {
        console.error("[LocationAutocomplete] Geoapify fetch error:", err);
        setSuggestions([]);
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Query flow
  useEffect(() => {
    // Prevent immediate refetch right after selection
    if (suppressFetchRef.current) {
      suppressFetchRef.current = false;
      return;
    }

    setActiveIndex(-1);

    if (debounced.length < 3) {
      setSuggestions([]);
      setOpen(false);
      abortRef.current?.abort();
      return;
    }

    fetchSuggestions(debounced);
  }, [debounced, fetchSuggestions]);

  const handleSelect = useCallback(
    (s: Suggestion) => {
      // Prevent dropdown reopening and re-fetching after selection
      suppressFetchRef.current = true;

      onSelect(s.display_name, s.lat, s.lon, s.structured_data);
      setOpen(false);
    },
    [onSelect],
  );

  return (
    <div ref={containerRef} className="relative">
      <input
        id={inputId}
        type="text"
        className={`w-full ${inputClassName} pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(suggestions.length > 0);
            return;
          }

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            if (open && activeIndex >= 0) {
              e.preventDefault();
              handleSelect(suggestions[activeIndex]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {open && (
        <ul
          id={listboxId}
          className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-60 overflow-auto shadow-lg"
        >
          {loading && <li className="px-4 py-2 text-sm text-gray-500">Loading…</li>}
          {!loading && suggestions.length === 0 && (
            <li className="px-4 py-2 text-sm text-gray-500">No results</li>
          )}
          {!loading &&
            suggestions.map((s, i) => (
              <li
                id={`${listboxId}-opt-${i}`}
                aria-selected={i === activeIndex}
                key={`${s.display_name}-${i}`}
                className={`px-4 py-2 cursor-pointer ${i === activeIndex ? "bg-gray-100" : "hover:bg-gray-100"}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {s.display_name}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
