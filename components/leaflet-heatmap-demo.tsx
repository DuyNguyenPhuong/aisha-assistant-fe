'use client'

import React, { useState } from 'react';
import LeafletMapComponent from './leaflet-map';

const LeafletHeatmapDemo: React.FC = () => {
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Dữ liệu mẫu cho heatmap - mô phỏng nồng độ chất ô nhiễm dọc sông Cầu Bây
  const sampleHeatmapData = [
    // Điểm bắt đầu sông - nồng độ thấp
    { lat: 21.032323, lng: 105.919651, intensity: 0.3 },
    { lat: 21.031800, lng: 105.920100, intensity: 0.2 },
    { lat: 21.031200, lng: 105.920800, intensity: 0.4 },
    
    // Khu vực giữa - nồng độ tăng dần
    { lat: 21.029500, lng: 105.922000, intensity: 0.6 },
    { lat: 21.028000, lng: 105.923500, intensity: 0.7 },
    { lat: 21.026800, lng: 105.924800, intensity: 0.8 },
    
    // Khu vực công nghiệp - nồng độ cao
    { lat: 21.025000, lng: 105.926000, intensity: 0.9 },
    { lat: 21.023500, lng: 105.927500, intensity: 1.0 },
    { lat: 21.022000, lng: 105.928800, intensity: 0.9 },
    
    // Khu vực cuối sông - nồng độ giảm dần
    { lat: 21.020000, lng: 105.930000, intensity: 0.7 },
    { lat: 21.018500, lng: 105.931500, intensity: 0.5 },
    { lat: 21.017000, lng: 105.933000, intensity: 0.3 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bản đồ nhiệt (Heatmap) mẫu</h3>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-4 py-2 text-sm rounded transition-colors ${
            showHeatmap
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}
        >
          {showHeatmap ? '🔥 Tắt Heatmap' : '📊 Bật Heatmap'}
        </button>
      </div>
      
      {showHeatmap && (
        <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
          <div className="font-semibold mb-2">📊 Heatmap thể hiện:</div>
          <div className="space-y-1">
            <div>• <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>Nồng độ thấp (an toàn)</div>
            <div>• <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>Nồng độ trung bình</div>
            <div>• <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>Nồng độ cao (nguy hiểm)</div>
          </div>
        </div>
      )}
      
      <LeafletMapComponent 
        lat={21.025000}
        lng={105.926000}
        zoom={13}
        height="400px"
        title="Demo Heatmap - Nồng độ chất ô nhiễm"
        showHeatmap={showHeatmap}
        heatmapData={showHeatmap ? sampleHeatmapData : []}
      />
    </div>
  );
};

export default LeafletHeatmapDemo;