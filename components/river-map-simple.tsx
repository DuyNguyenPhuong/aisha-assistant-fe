'use client'

const RiverMap = () => {
  // Tọa độ bắt đầu và kết thúc của con sông (mô phỏng)
  const riverStartCoord = { lat: 21.075343712285203, lng: 105.81956315396978 }; // Hồ Tây, Hà Nội
  const riverEndCoord = { lat: 21.147343712285203, lng: 105.89156315396978 }; // Điểm cuối cách khoảng 8km
  
  // Chiều dài thực của con sông (8000m)
  const riverLengthMeters = 8000;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Tính tỷ lệ vị trí trên canvas
    const ratioX = x / rect.width;
    const ratioY = y / rect.height;
    
    // Tính tọa độ dựa trên vị trí chuột
    // Giả sử con sông chảy theo đường chéo từ góc trên trái đến góc dưới phải
    const lat = riverStartCoord.lat + (riverEndCoord.lat - riverStartCoord.lat) * ratioY;
    const lng = riverStartCoord.lng + (riverEndCoord.lng - riverStartCoord.lng) * ratioX;
    
    // Hiển thị tooltip
    const tooltip = document.getElementById('coordinate-tooltip');
    if (tooltip) {
      tooltip.style.display = 'block';
      tooltip.style.left = e.clientX + 'px';
      tooltip.style.top = (e.clientY - 60) + 'px';
      tooltip.innerHTML = `
        <div className="text-sm font-medium">Tọa độ</div>
        <div className="text-xs">Vĩ độ: ${lat.toFixed(6)}°</div>
        <div className="text-xs">Kinh độ: ${lng.toFixed(6)}°</div>
      `;
    }
  };

  const handleMouseLeave = () => {
    const tooltip = document.getElementById('coordinate-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  };

  // Tạo đường cong mô phỏng con sông
  const createRiverPath = () => {
    const width = 800;
    const height = 400;
    const riverWidth = 60;
    
    // Tạo đường path SVG cho con sông uốn lượn
    const path = `
      M 50 ${height/2 - 30}
      Q 200 ${height/2 - 80} 400 ${height/2}
      Q 600 ${height/2 + 80} 750 ${height/2 - 20}
    `;
    
    return (
      <svg width="100%" height="400px" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0">
        {/* Nền sông (màu xanh đậm) */}
        <path
          d={path}
          stroke="#1e40af"
          strokeWidth={riverWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Mặt nước sông (màu xanh nhạt hơn) */}
        <path
          d={path}
          stroke="#3b82f6"
          strokeWidth={riverWidth - 10}
          fill="none"
          strokeLinecap="round"
        />
        {/* Hiệu ứng ánh sáng trên mặt nước */}
        <path
          d={path}
          stroke="#60a5fa"
          strokeWidth={15}
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        
        {/* Thêm một số chi tiết như đá, cây cối */}
        <circle cx="150" cy="180" r="8" fill="#64748b" />
        <circle cx="320" cy="220" r="6" fill="#64748b" />
        <circle cx="550" cy="160" r="10" fill="#64748b" />
        <circle cx="680" cy="210" r="7" fill="#64748b" />
        
        {/* Cây cối bên bờ */}
        <circle cx="100" cy="120" r="12" fill="#22c55e" />
        <circle cx="280" cy="280" r="15" fill="#22c55e" />
        <circle cx="480" cy="100" r="18" fill="#22c55e" />
        <circle cx="620" cy="300" r="14" fill="#22c55e" />
        <circle cx="720" cy="140" r="16" fill="#22c55e" />
      </svg>
    );
  };

  return (
    <>
      {/* Container chính của bản đồ sông */}
      <div
        className="relative w-full h-96 bg-gradient-to-b from-green-100 to-green-200 rounded-lg overflow-hidden cursor-crosshair border-2 border-blue-200"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Nền cảnh quan */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-blue-50" />
        
        {/* Con sông */}
        {createRiverPath()}
        
        {/* Lưới tọa độ mờ */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" className="w-full h-full">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#000" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Thông tin chú thích */}
        <div className="absolute top-4 left-4 bg-white/90 p-2 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-700">Con sông mô phỏng</div>
          <div className="text-xs text-gray-500">Chiều dài: ~8000m</div>
          <div className="text-xs text-gray-500">Di chuyển chuột để xem tọa độ</div>
        </div>
      </div>

      {/* Tooltip hiển thị tọa độ */}
      <div
        id="coordinate-tooltip"
        className="fixed bg-gray-800 text-white p-2 rounded-lg shadow-lg z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full hidden"
        style={{ display: 'none' }}
      >
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    </>
  );
};

export default RiverMap;