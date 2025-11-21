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
  heatmapData?: Array<{ lat: number; lng: number; intensity: number; parameter?: string }>;
  selectedParameter?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  heatmapData = [],
  selectedParameter = 'BOD5'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        
        // Thang màu động với màu đặc trưng cho từng chất
        let gradient = {};
        
        if (selectedParameter === 'BOD5' || selectedParameter === 'BOD0' || selectedParameter === 'BOD1') {
          // BOD: Trắng → Đỏ
          gradient = {
            0.0: '#ffffff',  // Trắng (giá trị thấp nhất)
            0.1: '#ffe6e6',  // Hồng rất nhạt
            0.25: '#ffcccc', // Hồng nhạt
            0.5: '#ff9999',  // Hồng
            0.75: '#ff6666', // Đỏ nhạt
            0.9: '#ff3333',  // Đỏ
            1.0: '#ff0000'   // Đỏ đậm (giá trị cao nhất)
          };
        } else if (selectedParameter === 'NH40' || selectedParameter === 'NH41') {
          // NH4: Trắng → Vàng
          gradient = {
            0.0: '#ffffff',  // Trắng (giá trị thấp nhất)
            0.1: '#ffffcc',  // Vàng rất nhạt
            0.25: '#ffff99', // Vàng nhạt
            0.5: '#ffff66',  // Vàng
            0.75: '#ffff33', // Vàng đậm
            0.9: '#ffff11',  // Vàng rất đậm
            1.0: '#ffff00'   // Vàng đậm nhất (giá trị cao nhất)
          };
        } else if (selectedParameter === 'NO3') {
          // NO3: Trắng → Xanh lam
          gradient = {
            0.0: '#ffffff',  // Trắng (giá trị thấp nhất)
            0.1: '#e6f2ff',  // Xanh lam rất nhạt
            0.25: '#ccddff', // Xanh lam nhạt
            0.5: '#99ccff',  // Xanh lam
            0.75: '#6699ff', // Xanh lam đậm
            0.9: '#3366ff',  // Xanh lam rất đậm
            1.0: '#0066ff'   // Xanh lam đậm nhất (giá trị cao nhất)
          };
        } else {
          // Mặc định: Đỏ
          gradient = {
            0.0: '#ffffff',
            0.1: '#ffe6e6',
            0.25: '#ffcccc',
            0.5: '#ff9999',
            0.75: '#ff6666',
            0.9: '#ff3333',
            1.0: '#ff0000'
          };
        }
        
        window.L.heatLayer(heatData, {
          radius: 25,        // Tăng bán kính để dễ nhìn
          blur: 18,          // Tăng blur để mượt hơn
          maxZoom: 17,
          minOpacity: 0.3,   // Độ trong suốt tối thiểu
          gradient: gradient
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
  }, [isLoaded, lat, lng, zoom, showHeatmap, heatmapData, selectedParameter]);

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