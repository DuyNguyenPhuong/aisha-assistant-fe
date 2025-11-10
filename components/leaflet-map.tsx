'use client'

import React, { useEffect, useRef, useState } from 'react';

// Leaflet Map Component - Miễn phí thay thế cho Google Maps
interface LeafletMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  height?: string;
  title?: string;
  showHeatmap?: boolean;
  heatmapData?: Array<{ lat: number; lng: number; intensity: number }>;
}

declare global {
  interface Window {
    L: any;
  }
}

const LeafletMapComponent: React.FC<LeafletMapProps> = ({ 
  lat, 
  lng, 
  zoom = 15,
  height = '500px',
  title = 'Bản đồ sông Cầu Bây',
  showHeatmap = false,
  heatmapData = []
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically load Leaflet CSS and JS
    const loadLeaflet = async () => {
      try {
        // Load CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          cssLink.crossOrigin = '';
          document.head.appendChild(cssLink);
        }

        // Load JS
        if (!window.L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Load Heatmap plugin
        if (showHeatmap && !window.L.heatLayer) {
          await new Promise((resolve, reject) => {
            const heatScript = document.createElement('script');
            heatScript.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
            heatScript.onload = resolve;
            heatScript.onerror = reject;
            document.head.appendChild(heatScript);
          });
        }

        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load Leaflet:', err);
        setError('Không thể tải bản đồ. Vui lòng kiểm tra kết nối internet.');
      }
    };

    loadLeaflet();
  }, [showHeatmap]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    try {
      // Initialize map
      const map = window.L.map(mapRef.current).setView([lat, lng], zoom);

      // Add tile layer (OpenStreetMap - miễn phí)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Add satellite layer option
      const satelliteLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© <a href="https://www.esri.com/">Esri</a>, © <a href="https://www.digitalglobe.com/">DigitalGlobe</a>',
        maxZoom: 19
      });

      // Add terrain layer option  
      const terrainLayer = window.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://opentopomap.org/">OpenTopoMap</a> (CC-BY-SA)',
        maxZoom: 17
      });

      // Layer control
      const baseLayers = {
        "Bản đồ đường phố": window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }),
        "Bản đồ vệ tinh": satelliteLayer,
        "Bản đồ địa hình": terrainLayer
      };

      window.L.control.layers(baseLayers).addTo(map);

      // Add marker for river starting point
      const marker = window.L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #2196F3;">
            🏞️ Điểm bắt đầu sông Cầu Bây
          </h4>
          <p style="margin: 0; font-size: 12px;">
            <strong>Tọa độ:</strong> ${lat}, ${lng}<br/>
            <strong>Độ dài sông:</strong> 8,013m<br/>
            <strong>Vị trí:</strong> Sài Đồng
          </p>
        </div>
      `);

      // Add heatmap if data provided
      if (showHeatmap && heatmapData.length > 0 && window.L.heatLayer) {
        const heatData = heatmapData.map(point => [point.lat, point.lng, point.intensity]);
        const heatmapLayer = window.L.heatLayer(heatData, {
          radius: 20,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.0: 'blue',
            0.2: 'cyan', 
            0.4: 'lime',
            0.6: 'yellow',
            0.8: 'orange',
            1.0: 'red'
          }
        }).addTo(map);
      }

      // Add scale control
      window.L.control.scale().addTo(map);

      mapInstanceRef.current = map;

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Không thể khởi tạo bản đồ.');
    }
  }, [isLoaded, lat, lng, zoom, showHeatmap, heatmapData]);

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ 
        width: '100%', 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div className="animate-spin" style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
          <div>Đang tải bản đồ...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
      
      {/* Title overlay */}
      {title && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#333',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          🗺️ {title}
        </div>
      )}

      {/* Info overlay */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '6px 10px',
        borderRadius: '4px',
        fontSize: '10px',
        color: '#666',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        🆓 Bản đồ miễn phí • OpenStreetMap
      </div>
    </div>
  );
};

export default LeafletMapComponent;