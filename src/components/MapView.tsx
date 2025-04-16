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
    // Optionally add a zoom parameter (e.g., zoom=18) for more detailed results:
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    try {
      // Add a User-Agent header for better compliance with Nominatim's usage policy.
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'YourAppName/1.0'
        }
      });
      const data = await response.json();
      console.log('Reverse geocoding response:', data);
      if (data.error) {
        setAddress('Address not found');
        return;
      }
      // Prefer the display_name property if it exists.
      const fullAddress =
        data.display_name ||
        `${data.address.house_number ? data.address.house_number + ' ' : ''}${
          data.address.road || ''
        }, ${data.address.city || data.address.town || data.address.village || ''}, ${
          data.address.state || ''
        }, ${data.address.country || ''}`.trim();
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
      <Marker
        position={position}
        eventHandlers={{
          click: () => {
            fetchAddress();
          },
        }}
      >
        <Popup>
          {address}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapView;
