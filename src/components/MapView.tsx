import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  lat: number;
  lng: number;
}

const MapView: React.FC<MapViewProps> = ({ lat, lng }) => {
  const position: [number, number] = [lat, lng];
  const [address, setAddress] = useState<string>('Property Location');

  // Fetch address details using Nominatim's reverse geocoding API.
  const fetchAddress = async () => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const addr = data.address || {};
      // Construct a complete address string from the available details.
      const fullAddress = `${addr.house_number ? addr.house_number + ' ' : ''}${addr.road || ''}, ${addr.city || addr.town || ''}, ${addr.state || ''}, ${addr.country || ''}`.trim();
      setAddress(fullAddress || 'Address not found');
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddress('Address not found');
    }
  };

  return (
    <MapContainer center={position} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}
        // When the marker is clicked, fetch the address.
        eventHandlers={{
          click: () => {
            fetchAddress();
          },
        }}>
        <Popup>
          {address}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapView;
