'use client'

import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',

};

const defaultCenter = {
  lat: 42.91895952548739,
  lng: 74.51503441433378,
  // Uncomment for Ho Tay
  // lat: 21.075343712285203,
  // lng: 105.81956315396978,
};

const MapComponent = () => {
  return (
    <div className="w-full">
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}
        libraries={['places']}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={15}
        >
          <Marker position={defaultCenter} />
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default MapComponent;