// src/components/MapView.tsx
import React, { useState, useEffect } from 'react';
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

interface MapViewProps {
  lat: number;
  lng: number;
  // optional: your email to pass to Nominatim
  email?: string;
}

const MapView: React.FC<MapViewProps> = ({ lat, lng, email }) => {
  const position: [number, number] = [lat, lng];
  const [address, setAddress] = useState<string>('Loading address…');

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
        const res = await fetch(https://nominatim.openstreetmap.org/reverse?${params});
        const data = await res.json();
        setAddress(data.error ? 'Address not found' : data.display_name || 'Address not found');
      } catch (err) {
        console.error('Reverse geocoding failed', err);
        setAddress('Address not found');
      }
    }
    fetchAddress();
  }, [lat, lng, email]);

  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>{address}</Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapView; 
