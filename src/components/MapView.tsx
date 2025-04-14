// MapView.tsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Optionally, if your coordinates come in as props:
interface MapViewProps {
  lat: number;
  lng: number;
}

const MapView: React.FC<MapViewProps> = ({ lat, lng }) => {
  const position: [number, number] = [lat, lng];

  return (
    <MapContainer center={position} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          Property Location
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapView;
