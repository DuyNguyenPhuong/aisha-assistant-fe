'use client'

import React, { useRef, useEffect, useState } from 'react';
import { 
  calculateConcentration, 
  RIVER_LENGTH, 
  WaterQualityData,
  RIVER_POSITIONS, 
  COLOR_SCALES,
  getColorFromValue
} from '@/lib/water-quality-calculations';

interface RiverMapProps {
  width?: number;
  height?: number;
  rainfall: number;
  temperature: number;
  selectedParameter?: 'BOD5' | 'NH4' | 'NO3' | null;
  onPositionSelect?: (position: number, data: WaterQualityData) => void;
}

interface Coordinate {
  lat: number;
  lng: number;
}

const RiverMap: React.FC<RiverMapProps> = ({
  width = 800,
  height = 400,
  rainfall,
  temperature,
  selectedParameter = null,
  onPositionSelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [hoveredCoordinate, setHoveredCoordinate] = useState<Coordinate | null>(null);
  const [hoveredWaterQuality, setHoveredWaterQuality] = useState<WaterQualityData | null>(null);
  const [hoveredPositionMeters, setHoveredPositionMeters] = useState<number>(0);

  // Tọa độ bắt đầu sông Cầu Bây (Hà Nội)
  const riverStartCoordinate = {
    lat: 21.032323,
    lng: 105.919651
  };

  // Hàm tạo đường path của sông Cầu Bây thực tế
  const generateCauBayRiverPath = (): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    const segments = 50; // Số đoạn để tạo độ cong
    
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      
      // Sông chảy từ Tây Bắc (trên trái) xuống Đông Nam (dưới phải)
      // X: từ 15% (tây) đến 85% (đông) chiều rộng
      // Y: từ 15% (bắc) đến 85% (nam) chiều cao
      const baseX = width * 0.15 + (width * 0.7 * progress);
      const baseY = height * 0.15 + (height * 0.7 * progress);
      
      // Thêm độ uốn lượn tự nhiên của sông
      const mainCurve = Math.sin(progress * Math.PI * 1.5) * width * 0.08; // Uốn cong chính
      const smallMeander = Math.sin(progress * Math.PI * 6) * width * 0.03; // Uốn khúc nhỏ
      
      const x = baseX + mainCurve + smallMeander;
      const y = baseY + mainCurve * 0.5;
      
      points.push({ x, y });
    }
    
    return points;
  };

  const riverPoints = generateCauBayRiverPath();

  // Chuyển đổi pixel sang tọa độ địa lý
  const pixelToCoordinate = (x: number, y: number): Coordinate => {
    // Tính toán tỷ lệ dựa trên độ dài sông 8013m
    const progressX = x / width;
    const progressY = y / height;
    
    // Sông Cầu Bây chảy từ Tây Bắc xuống Đông Nam
    const startLat = 21.032323;
    const startLng = 105.919651;
    const endLat = 20.998456; // Khoảng 4km về phía Nam
    const endLng = 105.952567; // Khoảng 3km về phía Đông
    
    // Interpolate tọa độ
    const lat = startLat + (endLat - startLat) * progressY;
    const lng = startLng + (endLng - startLng) * progressX;
    
    return { lat, lng };
  };

  // Kiểm tra xem điểm có nằm trên sông không
  const isPointOnRiver = (x: number, y: number): boolean => {
    const riverWidth = 48; // Độ rộng sông (pixel) - tăng lên để dễ hover
    // Tìm điểm gần nhất trên đường sông
    let minDistance = Infinity;
    for (const point of riverPoints) {
      const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
    return minDistance <= riverWidth / 2;
  };

  const drawRiver = (ctx: CanvasRenderingContext2D) => {
    // Vẽ background
    ctx.fillStyle = '#e8f5e8';
    ctx.fillRect(0, 0, width, height);

    // Vẽ sông với heatmap (nếu có parameter được chọn)
    if (selectedParameter) {
      drawHeatmap(ctx);
    } else {
      // Vẽ sông bình thường
      ctx.beginPath();
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 48;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      riverPoints.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });

      ctx.stroke();
    }

    // Vẽ các vị trí landmark
    // Đặt marker và label theo vị trí thực tế trên sông
    RIVER_POSITIONS.forEach((position, index) => {
      // Tính progress dọc sông (0-1) dựa trên khoảng cách thực
      const progress = position.position / RIVER_LENGTH;
      
      // Tìm điểm trên path gần nhất với progress này
      const targetIndex = Math.round(progress * (riverPoints.length - 1));
      const riverPoint = riverPoints[Math.min(targetIndex, riverPoints.length - 1)];
      if (riverPoint) {
        // Vẽ marker cho landmark
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(riverPoint.x, riverPoint.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        // Vẽ border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Vẽ tên vị trí với offset để tránh chồng lấp
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        // Điều chỉnh vị trí text để tránh chồng lấp dựa trên vị trí sông từ TBắc xuống ĐNam
        let textY = riverPoint.y - 25;
        let textX = riverPoint.x;
        
        // Điều chỉnh theo hướng sông và tránh chồng lấp
        if (index % 2 === 0) {
          // Các điểm chẵn: hiển thị phía trên và trái
          textY = riverPoint.y - 30;
          textX = riverPoint.x - 25;
        } else {
          // Các điểm lẻ: hiển thị phía dưới và phải
          textY = riverPoint.y + 40;
          textX = riverPoint.x + 25;
        }
        
        // Điều chỉnh đặc biệt cho điểm đầu và cuối
        if (index === 0) { // Sài Đồng (đầu sông - TBắc)
          textY = riverPoint.y - 35;
          textX = riverPoint.x - 30;
        } else if (index === RIVER_POSITIONS.length - 1) { // Xuân Thụy (cuối sông - ĐNam)
          textY = riverPoint.y + 45;
          textX = riverPoint.x + 30;
        }

        ctx.fillText(position.name, textX, textY);
        
        // Vẽ khoảng cách bên dưới tên
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(`${position.position.toLocaleString()}m`, textX, textY + 15);
      }
    });

    // Vẽ điểm được chọn (nếu có)
    if (selectedPosition !== null) {
      const progress = selectedPosition / RIVER_LENGTH;
      const targetIndex = Math.round(progress * (riverPoints.length - 1));
      const riverPoint = riverPoints[Math.min(targetIndex, riverPoints.length - 1)];
      if (riverPoint) {
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.arc(riverPoint.x, riverPoint.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  };

  // Hàm vẽ heatmap continuous dọc theo đường sông thực tế
  const drawHeatmap = (ctx: CanvasRenderingContext2D) => {
    if (!selectedParameter) return;
    
    const riverPoints = generateCauBayRiverPath();
    // Tăng số lượng segment để heatmap mượt hơn
    const heatmapSegments = 100; // Tăng từ 50 lên 100 để có gradient mượt hơn
    
    // Vẽ outline sông trước (màu đen nhạt)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    riverPoints.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    
    // Vẽ heatmap với nhiều segment hơn
    for (let i = 0; i < heatmapSegments; i++) {
      const progress = i / heatmapSegments;
      const nextProgress = (i + 1) / heatmapSegments;
      const positionMeters = progress * RIVER_LENGTH;
      
      // Tính nồng độ tại vị trí này
      const waterQuality = calculateConcentration(positionMeters, rainfall, temperature);
      
      // Lấy giá trị nồng độ theo parameter được chọn
      let value = 0;
      if (selectedParameter === 'BOD5') {
        value = (waterQuality.BOD5_sample0 + waterQuality.BOD5_sample1) / 2;
      } else if (selectedParameter === 'NH4') {
        value = (waterQuality.NH4_sample0 + waterQuality.NH4_sample1) / 2;
      } else if (selectedParameter === 'NO3') {
        value = waterQuality.NO3_sample1;
      }
      
      // Lấy màu từ thang màu với clamping
      const colorScale = COLOR_SCALES[selectedParameter];
      const clampedValue = Math.min(Math.max(value, colorScale.min), colorScale.max);
      const color = getColorFromValue(clampedValue, colorScale);
      
      // Tính vị trí trên river path
      const currentRiverIndex = Math.floor(progress * (riverPoints.length - 1));
      const nextRiverIndex = Math.floor(nextProgress * (riverPoints.length - 1));
      
      // Interpolate giữa các điểm trên river path
      const currentPoint = riverPoints[currentRiverIndex];
      const nextPoint = riverPoints[Math.min(nextRiverIndex, riverPoints.length - 1)];
      
      if (currentPoint && nextPoint) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 22; // Độ dày sông heatmap
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(currentPoint.x, currentPoint.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.stroke();
      }
    }
  };

  // Handle mouse move for tooltip
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosition({ x, y });

    if (isPointOnRiver(x, y)) {
      // Tìm vị trí gần nhất trên sông
      let closestProgress = 0;
      let minDistance = Infinity;
      
      riverPoints.forEach((point, index) => {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestProgress = index / (riverPoints.length - 1);
        }
      });

      const positionMeters = closestProgress * RIVER_LENGTH;
      const coordinate = pixelToCoordinate(x, y);
      const waterQuality = calculateConcentration(positionMeters, rainfall, temperature);
      
      setHoveredCoordinate(coordinate);
      setHoveredWaterQuality(waterQuality);
      setHoveredPositionMeters(positionMeters);
    } else {
      setHoveredCoordinate(null);
      setHoveredWaterQuality(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
    setHoveredCoordinate(null);
    setHoveredWaterQuality(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isPointOnRiver(x, y)) {
      // Tìm vị trí gần nhất trên sông
      let closestProgress = 0;
      let minDistance = Infinity;
      
      riverPoints.forEach((point, index) => {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestProgress = index / (riverPoints.length - 1);
        }
      });

      const positionMeters = closestProgress * RIVER_LENGTH;
      const waterQuality = calculateConcentration(positionMeters, rainfall, temperature);
      
      setSelectedPosition(positionMeters);
      if (onPositionSelect) {
        onPositionSelect(positionMeters, waterQuality);
      }
    }
  };

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawRiver(ctx);
  }, [width, height, selectedParameter, selectedPosition, rainfall, temperature]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      {/* Tooltip */}
      {mousePosition && hoveredWaterQuality && hoveredCoordinate && (
        <div
          className="absolute bg-black text-white px-4 py-3 rounded-lg shadow-lg text-xs pointer-events-none z-10 max-w-xs"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
          }}
        >
          <div className="font-bold mb-2">Vị trí: {hoveredPositionMeters.toFixed(0)}m</div>
          <div className="space-y-1">
            <div>BOD5 (mẫu 0): {hoveredWaterQuality.BOD5_sample0.toFixed(2)} mg/L</div>
            <div>BOD5 (mẫu 1): {hoveredWaterQuality.BOD5_sample1.toFixed(2)} mg/L</div>
            <div>NH4+ (mẫu 0): {hoveredWaterQuality.NH4_sample0.toFixed(2)} mg/L</div>
            <div>NH4+ (mẫu 1): {hoveredWaterQuality.NH4_sample1.toFixed(2)} mg/L</div>
            <div>NO3- (mẫu 1): {hoveredWaterQuality.NO3_sample1.toFixed(2)} mg/L</div>
          </div>
          {hoveredCoordinate && (
            <div className="mt-2 pt-2 border-t border-gray-600 text-gray-300">
              <div>Vĩ độ: {hoveredCoordinate.lat.toFixed(6)}°</div>
              <div>Kinh độ: {hoveredCoordinate.lng.toFixed(6)}°</div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Thông tin mô phỏng:</strong></p>
        <p>• Độ dài sông: {RIVER_LENGTH.toLocaleString()}m</p>
        <p>• Lượng mưa hiện tại: {rainfall} mm/hr</p>
        <p>• Nhiệt độ hiện tại: {temperature}°C</p>
        <p>• Tọa độ bắt đầu sông Cầu Bây: {riverStartCoordinate.lat}°, {riverStartCoordinate.lng}°</p>
        <p>• Click trên sông để chọn vị trí, hover để xem nồng độ</p>
        {selectedParameter && (
          <p>• Heatmap hiện tại: <strong>{selectedParameter}</strong></p>
        )}
        {selectedPosition !== null && (
          <p>• Vị trí được chọn: <strong>{selectedPosition.toFixed(0)}m</strong></p>
        )}
      </div>
    </div>
  );
};

export default RiverMap;