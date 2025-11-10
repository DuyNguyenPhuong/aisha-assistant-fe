'use client'

import React, { useEffect } from 'react';

interface CauBayRiver3DMapProps {
  width?: string;
  height?: string;
}

const CauBayRiver3DMap: React.FC<CauBayRiver3DMapProps> = ({ 
  width = "100%", 
  height = "400px" 
}) => {
  const mapId = 'cau-bay-3d-map';

  useEffect(() => {
    // Check if Google Maps is available
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      initializeMap();
    } else {
      // Load Google Maps API if not loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry,visualization&callback=initCauBayMap`;
      script.async = true;
      script.defer = true;
      
      window.initCauBayMap = initializeMap;
      document.head.appendChild(script);
      
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        delete window.initCauBayMap;
      };
    }
  }, []);

  const initializeMap = () => {
    const mapElement = document.getElementById(mapId);
    if (!mapElement) return;

    // Tọa độ bắt đầu sông Cầu Bây
    const riverStart = { lat: 21.032323, lng: 105.919651 };

    // Tạo bản đồ 3D
    const map = new google.maps.Map(mapElement, {
      center: riverStart,
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      tilt: 45, // Góc nghiêng để tạo hiệu ứng 3D
      heading: 90, // Hướng camera
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    // Các điểm trên sông Cầu Bây (ước tính dựa trên vị trí thực tế)
    const riverPoints = [
      { lat: 21.032323, lng: 105.919651, name: "Sài Đồng", position: 0 },
      { lat: 21.025847, lng: 105.925123, name: "Đài Tư", position: 1112 },
      { lat: 21.018456, lng: 105.932567, name: "An Lạc", position: 3170 },
      { lat: 21.012789, lng: 105.938901, name: "Trâu Quỳ", position: 4590 },
      { lat: 21.005123, lng: 105.946234, name: "Đa Tốn", position: 7070 },
      { lat: 20.998456, lng: 105.952567, name: "Xuân Thụy", position: 8013 }
    ];

    // Tạo đường polyline cho sông
    const riverPath = new google.maps.Polyline({
      path: riverPoints,
      geodesic: true,
      strokeColor: '#2196F3',
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });

    riverPath.setMap(map);

    // Thêm marker cho từng điểm
    riverPoints.forEach((point, index) => {
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        title: `${point.name} (${point.position}m)`,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" fill="#2196F3" stroke="#ffffff" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="10">${index + 1}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });

      // InfoWindow cho mỗi marker
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #2196F3;">${point.name}</h4>
            <p style="margin: 0; font-size: 12px;">
              <strong>Vị trí:</strong> ${point.position}m<br>
              <strong>Tọa độ:</strong> ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });

    // Thêm các hiệu ứng 3D buildings nếu có
    map.setOptions({
      styles: [
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [
            { color: "#1e88e5" },
            { lightness: 20 }
          ]
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [
            { color: "#4caf50" },
            { lightness: 30 }
          ]
        }
      ]
    });
  };

  return (
    <div style={{ width, height, position: 'relative' }}>
      <div 
        id={mapId} 
        style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }} 
      />
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        🗺️ Sông Cầu Bây - Bản đồ 3D
      </div>
    </div>
  );
};

// Declare global type for Google Maps callback
declare global {
  interface Window {
    initCauBayMap?: () => void;
  }
}

export default CauBayRiver3DMap;