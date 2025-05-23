// src/components/AdvancedMapView.tsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Marker icon patch ───────────────────────────────────────────────────────────
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

interface Props {
  /** Either provide both lat & lng… */
  lat?: number;
  lng?: number;
  /** …or an address string to geocode in Cyprus */
  query?: string;
  /** Optional email for Nominatim usage policy */
  email?: string;
}

const CY_BOUNDS = {
  left:   32.3,
  top:    35.7,
  right:  34.6,
  bottom: 34.4,
};

// pans map when coords change
const PanTo: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13, { animate: false });
  }, [lat, lng, map]);
  return null;
};

const AdvancedMapView: React.FC<Props> = ({ lat: initialLat, lng: initialLng, query, email }) => {
  const [lat, setLat]           = useState<number | null>(initialLat ?? null);
  const [lng, setLng]           = useState<number | null>(initialLng ?? null);
  const [address, setAddress]   = useState<string | null>(null);
  const [error, setError]       = useState(false);

  // 1️⃣ If we have coords, reverse-geocode to get a display address
  useEffect(() => {
    if (lat != null && lng != null) {
      (async () => {
        const params = new URLSearchParams({
          format: 'json',
          lat:    lat.toString(),
          lon:    lng.toString(),
          addressdetails: '1',
          ...(email ? { email } : {}),
        });
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
          const json = await res.json();
          setAddress(json.display_name || 'Address not found');
        } catch {
          setAddress('Address not found');
        }
      })();
    }
  }, [lat, lng, email]);

  // 2️⃣ If we don’t have coords but do have a query, forward-geocode with strict Cyprus bounding
  useEffect(() => {
    if ((lat == null || lng == null) && query) {
      (async () => {
        const params = new URLSearchParams({
          format: 'json',
          q:      query,
          addressdetails: '1',
          limit:  '1',
          countrycodes: 'cy',
          viewbox:  `${CY_BOUNDS.left},${CY_BOUNDS.top},${CY_BOUNDS.right},${CY_BOUNDS.bottom}`,
          bounded: '1',
          ...(email ? { email } : {}),
        });
        try {
          const res     = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
          const [best]  = await res.json();
          if (best) {
            setLat(parseFloat(best.lat));
            setLng(parseFloat(best.lon));
            setError(false);
          } else {
            setError(true);
          }
        } catch {
          setError(true);
        }
      })();
    }
  }, [query, email, lat, lng]);

  // 3️⃣ Render
  // — no coords & no query: just nothing
  if (lat == null || lng == null) {
    return (
      <div style={{ padding: '1rem', background: '#fff', borderRadius: 8 }}>
        <h3>Location</h3>
        <p>Location coordinates unavailable.</p>
        {query && <p>📍 {query}</p>}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 400, borderRadius: 8, overflow: 'hidden' }}>
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false}
                    style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PanTo lat={lat} lng={lng} />
        <Marker position={[lat, lng] as [number, number]}>
          <Popup>
            {address || query}
          </Popup>
        </Marker>
      </MapContainer>
      <div style={{ padding: '0.5rem 1rem', background: '#fafafa' }}>
        <small>📍 {address || query}</small>
      </div>
    </div>
  );
};

export default MapView;
