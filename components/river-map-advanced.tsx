'use client'

import React, { useState, useRef, useEffect } from 'react';

const RiverMapAdvanced = () => {
  const [tooltip, setTooltip] = useState({
    x: 0,
    y: 0,
    coordinates: { lat: 0, lng: 0 },
    visible: false,
    distance: 0
  });
  
  const containerRef = useRef(null);

  // Tọa độ bắt đầu và kết thúc của con sông (mô phỏng)
  const riverStartCoord = { lat: 21.075343712285203, lng: 105.81956315396978 }; // Hồ Tây, Hà Nội
  const riverEndCoord = { lat: 21.147343712285203, lng: 105.89156315396978 }; // Điểm cuối cách khoảng 8km
  
  // Chiều dài thực của con sông (8000m)
  const riverLengthMeters = 8000;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Tính tỷ lệ vị trí trên canvas
    const ratioX = x / rect.width;
    const ratioY = y / rect.height;
    
    // Tính tọa độ dựa trên vị trí chuột
    // Giả sử con sông chảy theo đường cong từ góc trên trái đến góc dưới phải
    const lat = riverStartCoord.lat + (riverEndCoord.lat - riverStartCoord.lat) * ratioY;
    const lng = riverStartCoord.lng + (riverEndCoord.lng - riverStartCoord.lng) * ratioX;
    
    // Tính khoảng cách từ điểm bắt đầu (để hiển thị khoảng cách)
    const distanceRatio = Math.sqrt(ratioX * ratioX + ratioY * ratioY);
    const distanceMeters = Math.min(distanceRatio * riverLengthMeters, riverLengthMeters);

    setTooltip({
      x: e.clientX,
      y: e.clientY,
      coordinates: { 
        lat: parseFloat(lat.toFixed(6)), 
        lng: parseFloat(lng.toFixed(6)) 
      },
      distance: Math.round(distanceMeters),
      visible: true
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Tạo đường cong mô phỏng con sông với nhiều chi tiết hơn
  const createRiverPath = () => {
    const width = 800;
    const height = 400;
    const riverWidth = 80;
    
    // Tạo đường path SVG cho con sông uốn lượn tự nhiên hơn
    const mainPath = `
      M 30 ${height/2 + 20}
      Q 150 ${height/2 - 100} 280 ${height/2 - 30}
      Q 420 ${height/2 + 60} 550 ${height/2 - 10}
      Q 680 ${height/2 - 80} 770 ${height/2 + 10}
    `;

    const tributaryPath1 = `
      M 200 50
      Q 250 120 280 ${height/2 - 30}
    `;

    const tributaryPath2 = `
      M 500 ${height - 50}
      Q 520 ${height/2 + 30} 550 ${height/2 - 10}
    `;
    
    return (
      <svg width="100%" height="400px" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="waterShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Nền sông chính (màu xanh đậm) */}
        <path
          d={mainPath}
          stroke="url(#riverGradient)"
          strokeWidth={riverWidth}
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Các nhánh sông nhỏ */}
        <path
          d={tributaryPath1}
          stroke="#2563eb"
          strokeWidth="25"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={tributaryPath2}
          stroke="#2563eb"
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
        />

        {/* Mặt nước sông (màu xanh nhạt hơn) */}
        <path
          d={mainPath}
          stroke="url(#waterShine)"
          strokeWidth={riverWidth - 15}
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Hiệu ứng ánh sáng trên mặt nước */}
        <path
          d={mainPath}
          stroke="#87ceeb"
          strokeWidth={20}
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        
        {/* Thêm chi tiết như đá, cây cối, cầu */}
        {/* Đá trong sông */}
        <ellipse cx="180" cy="190" rx="12" ry="8" fill="#64748b" />
        <ellipse cx="320" cy="240" rx="8" ry="6" fill="#64748b" />
        <ellipse cx="480" cy="180" rx="15" ry="10" fill="#64748b" />
        <ellipse cx="620" cy="210" rx="10" ry="7" fill="#64748b" />
        
        {/* Cây cối bên bờ */}
        <g>
          <circle cx="100" cy="120" r="18" fill="#166534" />
          <circle cx="95" cy="115" r="12" fill="#22c55e" />
          <circle cx="105" cy="110" r="8" fill="#16a34a" />
        </g>
        
        <g>
          <circle cx="380" cy="320" r="22" fill="#166534" />
          <circle cx="375" cy="315" r="15" fill="#22c55e" />
          <circle cx="385" cy="310" r="10" fill="#16a34a" />
        </g>
        
        <g>
          <circle cx="650" cy="90" r="20" fill="#166534" />
          <circle cx="645" cy="85" r="14" fill="#22c55e" />
          <circle cx="655" cy="80" r="9" fill="#16a34a" />
        </g>

        {/* Cầu nhỏ */}
        <rect x="440" y="175" width="60" height="8" rx="4" fill="#92400e" />
        <rect x="445" y="179" width="50" height="4" rx="2" fill="#d97706" />
        
        {/* Chim bay */}
        <g transform="translate(600,60)">
          <path d="M0,0 Q-5,-3 -10,0 Q-5,3 0,0" fill="#374151" />
          <path d="M0,0 Q5,-3 10,0 Q5,3 0,0" fill="#374151" />
        </g>
        
        <g transform="translate(200,80)">
          <path d="M0,0 Q-3,-2 -6,0 Q-3,2 0,0" fill="#374151" />
          <path d="M0,0 Q3,-2 6,0 Q3,2 0,0" fill="#374151" />
        </g>
      </svg>
    );
  };

  return (
    <>
      {/* Container chính của bản đồ sông */}
      <div
        ref={containerRef}
        className="relative w-full h-96 bg-gradient-to-b from-sky-100 via-green-50 to-green-100 rounded-lg overflow-hidden cursor-crosshair border-2 border-blue-300 shadow-lg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Nền cảnh quan với gradient đẹp hơn */}
        <div className="absolute inset-0 bg-gradient-radial from-blue-50 via-green-50 to-emerald-100" />
        
        {/* Con sông */}
        {createRiverPath()}
        
        {/* Lưới tọa độ mờ */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Thông tin chú thích với thiết kế đẹp hơn */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/20">
          <div className="text-base font-bold text-gray-800 mb-1">🏞️ Con sông mô phỏng</div>
          <div className="text-sm text-gray-600 mb-1">📏 Chiều dài: ~8,000m</div>
          <div className="text-xs text-gray-500">🖱️ Di chuyển chuột để xem tọa độ</div>
        </div>

        {/* Thông tin thống kê */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/20">
          <div className="text-sm font-medium text-gray-700 mb-1">📊 Thông tin</div>
          <div className="text-xs text-gray-600">🌊 Độ rộng trung bình: ~80m</div>
          <div className="text-xs text-gray-600">🏔️ Độ cao: 15-25m</div>
        </div>
      </div>

      {/* Tooltip hiển thị tọa độ với thiết kế đẹp */}
      {tooltip.visible && (
        <div
          className="fixed bg-gradient-to-r from-gray-800 to-gray-900 text-white p-3 rounded-xl shadow-xl z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full border border-gray-600"
          style={{
            left: tooltip.x,
            top: tooltip.y - 10,
          }}
        >
          <div className="text-sm font-bold mb-1">📍 Tọa độ GPS</div>
          <div className="text-xs mb-1">
            🌐 Vĩ độ: {tooltip.coordinates.lat}°
          </div>
          <div className="text-xs mb-1">
            🌐 Kinh độ: {tooltip.coordinates.lng}°
          </div>
          <div className="text-xs text-blue-300">
            📏 Khoảng cách: ~{tooltip.distance}m
          </div>
          {/* Mũi tên chỉ xuống */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="border-6 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default RiverMapAdvanced;