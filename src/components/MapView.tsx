import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Import the marker icon assets ─────────────────────────────────────────────
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// ─── Patch Leaflet’s default icon settings ─────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface MapViewProps {
  // optional: your email to pass to Nominatim
  email?: string;
}

const MapView: React.FC<MapViewProps> = ({ email }) => {
  const [lat, setLat] = useState<number>(35.1856);
  const [lng, setLng] = useState<number>(33.3823);
  const [address, setAddress] = useState<string>('Loading address…');
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const debounceRef = useRef<number>();

  // Fetch address for current lat/lng
  useEffect(() => {
    async function fetchAddress() {
      const params = new URLSearchParams({
        format: 'json',
        lat: lat.toString(),
        lon: lng.toString(),
        addressdetails: '1',
        ...(email ? { email } : {}),
      });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
        const data = await res.json();
        setAddress(data.error ? 'Address not found' : data.display_name || 'Address not found');
      } catch (err) {
        console.error('Reverse geocoding failed', err);
        setAddress('Address not found');
      }
    }
    fetchAddress();
  }, [lat, lng, email]);

  // Fetch suggestions for query
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    window.clearTimeout(debounceRef.current);
    // debounce
    debounceRef.current = window.setTimeout(async () => {
      const params = new URLSearchParams({
        format: 'json',
        q: query,
        addressdetails: '1',
        limit: '5',
        countrycodes: 'cy',      // restrict to Cyprus
        ...(email ? { email } : {}),
      });

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
        const results: Suggestion[] = await res.json();
        setSuggestions(results);
        setShowDropdown(true);
      } catch (err) {
        console.error('Forward geocoding failed', err);
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300); // 300ms debounce

    // cleanup
    return () => window.clearTimeout(debounceRef.current);
  }, [query, email]);

  const handleSelect = (item: Suggestion) => {
    setLat(parseFloat(item.lat));
    setLng(parseFloat(item.lon));
    setQuery(item.display_name);
    setShowDropdown(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Type an address in Cyprus…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query && setShowDropdown(true)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
        {showDropdown && suggestions.length > 0 && (
          <ul style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #ccc',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            maxHeight: 200,
            overflowY: 'auto',
            zIndex: 1000,
          }}>
            {suggestions.map((item, idx) => (
              <li key={idx}
                onClick={() => handleSelect(item)}
                style={{ padding: '8px', cursor: 'pointer' }}
              >
                {item.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng] as [number, number]}>
          <Popup>{address}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapView;
