import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'react-leaflet-geosearch';
import 'react-leaflet-geosearch/dist/geosearch.css';

interface MapViewProps {
  lat: number;
  lng: number;
}

// A separate component to add the search control to the map.
const SearchControl: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: true,   // Add a marker on the searched location
      showPopup: true,    // Show a popup for the marker
      autoClose: true,
      retainZoomLevel: false,
      searchLabel: 'Search for an address...',
    });
    map.addControl(searchControl);

    // Clean up the control when the component unmounts.
    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
};

const MapView: React.FC<MapViewProps> = ({ lat, lng }) => {
  const position: [number, number] = [lat, lng];
  const [address, setAddress] = useState<string>('Property Location');

  // Fetch address details using Nominatim's reverse geocoding API.
  const fetchAddress = async () => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    try {
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
      // Prefer using display_name if available.
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
      {/* Add the search control component */}
      <SearchControl />
      <Marker
        position={position}
        eventHandlers={{
          click: () => {
            fetchAddress();
          },
        }}
      >
        <Popup>{address}</Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapView;
