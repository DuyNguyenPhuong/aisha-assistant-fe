"use client";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useState } from "react";
const containerStyle = {
  width: "100%",
  height: "400px",
};
const defaultCenter = {
  lat: 42.9242778,
  lng: 74.5472777,
};
interface MapComponentProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  height?: string;
  show3D?: boolean;
  showRiverPoints?: boolean;
  title?: string;
}
const MapComponent: React.FC<MapComponentProps> = ({
  lat,
  lng,
  zoom = 15,
  height = "400px",
  show3D = false,
  showRiverPoints = false,
  title = "Vị trí trên bản đồ",
}) => {
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const center = lat && lng ? { lat, lng } : defaultCenter;
  const riverPoints = [
    { lat: 21.032323, lng: 105.919651, name: "Sài Đồng", position: 0 },
    { lat: 21.025847, lng: 105.925123, name: "Đài Tư", position: 1112 },
    { lat: 21.018456, lng: 105.932567, name: "An Lạc", position: 3170 },
    { lat: 21.012789, lng: 105.938901, name: "Trâu Quỳ", position: 4590 },
    { lat: 21.005123, lng: 105.946234, name: "Đa Tốn", position: 7070 },
    { lat: 20.998456, lng: 105.952567, name: "Xuân Thụy", position: 8013 },
  ];
  const mapOptions = show3D
    ? {
        tilt: 45,
        heading: 90,
        mapTypeId: "satellite" as google.maps.MapTypeId,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      }
    : {
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      };
  return (
    <div className="w-full" style={{ height }}>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}
        libraries={["places"]}
      >
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height }}
          center={center}
          zoom={zoom}
          options={mapOptions}
        >
          {}
          <Marker position={center} />
          {}
          {showRiverPoints && (
            <>
              {}
              <Marker
                position={{ lat: riverPoints[0].lat, lng: riverPoints[0].lng }}
                title={`Điểm bắt đầu sông - ${riverPoints[0].name}`}
                onClick={() => setSelectedMarker(0)}
              />
              {}
              {selectedMarker === 0 && (
                <InfoWindow
                  position={{
                    lat: riverPoints[0].lat,
                    lng: riverPoints[0].lng,
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div style={{ padding: "8px" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#2196F3" }}>
                      🏞️ Điểm bắt đầu sông Cầu Bây
                    </h4>
                    <p style={{ margin: "0", fontSize: "12px" }}>
                      <strong>Vị trí:</strong> {riverPoints[0].name}
                      <br />
                      <strong>Tọa độ:</strong> {riverPoints[0].lat},{" "}
                      {riverPoints[0].lng}
                      <br />
                      <strong>Độ dài sông:</strong> 8,013m
                    </p>
                  </div>
                </InfoWindow>
              )}
            </>
          )}
        </GoogleMap>
      </LoadScript>
      {}
      {title && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(255, 255, 255, 0.9)",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
            color: "#333",
            zIndex: 10,
          }}
        >
          🗺️ {title}
        </div>
      )}
    </div>
  );
};
export default MapComponent;
