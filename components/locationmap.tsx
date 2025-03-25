'use client'

import { useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 42.91895952548739,
  lng: 74.51503441433378,
};

const MapComponent = () => {
  const [center, setCenter] = useState(defaultCenter);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  return (
    <div className="w-full">
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}
        libraries={['places']}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={(mapInstance) => setMap(mapInstance)}
        >
          <Marker position={center} />
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default MapComponent;
