// src/components/AdvancedMapView.tsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Custom Marker Icon ─────────────────────────────────────────────────────────
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

interface AdvancedMapViewProps {
  lat: number;
  lng: number;
  email?: string;
}

// ─── Map Panner ─────────────────────────────────────────────────────────────────
const PanTo: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13, { animate: false });
  }, [lat, lng, map]);
  return null;
};

const AdvancedMapView: React.FC<AdvancedMapViewProps> = ({ lat, lng, email }) => {
  const [address, setAddress] = useState('Loading address…');

  // Reverse-geocode current coords
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams({
        format: 'json',
        lat: lat.toString(),
        lon: lng.toString(),
        addressdetails: '1',
        ...(email ? { email } : {})
      });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
        const data = await res.json();
        setAddress(data.display_name || 'Address not found');
      } catch {
        setAddress('Address not found');
      }
    })();
  }, [lat, lng, email]);

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PanTo lat={lat} lng={lng} />
        <Marker position={[lat, lng] as [number, number]}>
          <Popup>{address}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default AdvancedMapView;
