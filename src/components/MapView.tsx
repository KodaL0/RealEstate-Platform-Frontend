// src/components/AdvancedMapView.tsx
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Custom Marker Icon ─────────────────────────────────────────────────────────
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// ─── Debounce Hook ──────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface AdvancedMapViewProps {
  email?: string;
  maxSuggestions?: number;
}

// ─── Map Panner ─────────────────────────────────────────────────────────────────
const PanTo: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
};

const AdvancedMapView: React.FC<AdvancedMapViewProps> = ({ email, maxSuggestions = 7 }) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lat, setLat] = useState(35.1856);
  const [lng, setLng] = useState(33.3823);
  const [address, setAddress] = useState('Loading address…');

  // Cyprus bounding box & strict mode
  const CY_VIEWBOX = { left: 32.3, top: 35.7, right: 34.6, bottom: 34.4 };

  // Reverse-geocode current coords
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams({ format: 'json', lat: lat.toString(), lon: lng.toString(), addressdetails: '1', ...(email ? { email } : {}) });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
        const data = await res.json();
        setAddress(data.display_name || 'Address not found');
      } catch {
        setAddress('Address not found');
      }
    })();
  }, [lat, lng, email]);

  // Forward-geocode suggestions
  useEffect(() => {
    if (!debouncedQuery.trim()) { setSuggestions([]); return; }
    (async () => {
      const params = new URLSearchParams({
        format: 'json',
        q: debouncedQuery,
        addressdetails: '1',
        limit: maxSuggestions.toString(),
        countrycodes: 'cy',
        viewbox: `${CY_VIEWBOX.left},${CY_VIEWBOX.top},${CY_VIEWBOX.right},${CY_VIEWBOX.bottom}`,
        bounded: '1',
        ...(email ? { email } : {}),
      });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
        const results: Suggestion[] = await res.json();
        setSuggestions(results);
        setShowDropdown(true);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    })();
  }, [debouncedQuery, maxSuggestions, email]);

  // Keyboard navigation
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const highlight = (text: string) => {
    const regex = new RegExp(`(${debouncedQuery.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part)
        ? <mark key={i}>{part}</mark>
        : <span key={i}>{part}</span>
    );
  };

  const select = (item: Suggestion) => {
    const latN = parseFloat(item.lat), lonN = parseFloat(item.lon);
    setLat(latN);
    setLng(lonN);
    setQuery(item.display_name);
    setShowDropdown(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative">
        <input
          className="w-full p-3 border rounded shadow-sm focus:outline-none focus:ring"
          placeholder="Search an address in Cyprus..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setShowDropdown(true)}
          onKeyDown={onKeyDown}
        />
        {showDropdown && (
          <ul className="absolute z-20 w-full bg-white border rounded mt-1 max-h-60 overflow-y-auto shadow-lg">
            {suggestions.length ? (
              suggestions.map((s, i) => (
                <li
                  key={s.lat + '-' + s.lon}
                  className={`p-2 cursor-pointer hover:bg-gray-100 ${i === activeIndex ? 'bg-gray-200' : ''}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => select(s)}
                >{highlight(s.display_name)}</li>
              ))
            ) : (
              <li className="p-2 text-gray-500">No results found</li>
            )}
          </ul>
        )}
      </div>

      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} className="h-96 w-full rounded-lg mt-4">
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PanTo lat={lat} lng={lng} />
        <Marker position={[lat, lng] as [number, number]}>
          <Popup className="text-sm">{address}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default AdvancedMapView;
