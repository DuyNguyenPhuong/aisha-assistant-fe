'use client'

import React, { useRef, useEffect, useState } from 'react';
import { 
  calculateConcentration, 
  pixelToMeter, 
  meterToPixel, 
  RIVER_POSITIONS, 
  RIVER_LENGTH,
  WaterQualityData,
  COLOR_SCALES,
  getColorFromValue
} from '@/lib/water-quality-calculations';

interface RiverMapProps {
  width?: number;
  height?: number;
  rainfall?: number; // X parameter (mm/hr)
  temperature?: number; // Y parameter (°C)
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
  rainfall = 0, 
  temperature = 25,
  selectedParameter = null,
  onPositionSelect 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCoordinate, setHoveredCoordinate] = useState<Coordinate | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [hoveredWaterQuality, setHoveredWaterQuality] = useState<WaterQualityData | null>(null);
  const [hoveredPositionMeters, setHoveredPositionMeters] = useState<number | null>(null);

  // Tọa độ gốc của con sông (điểm bắt đầu) 
  const riverStartCoordinate = { lat: 21.012771, lng: 105.928065 }; // Vị trí giữa sông
  const riverLength = 8013; // 8013m
  
  // Tạo đường sông với các điểm uốn lượn tự nhiên
  const generateRiverPath = () => {
    const points: { x: number; y: number }[] = [];
    const segments = 50; // Số đoạn để tạo độ cong
    
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      const x = (width * 0.1) + (width * 0.8 * progress); // Từ 10% đến 90% chiều rộng
      
      // Tạo độ cong tự nhiên của sông
      const amplitude = height * 0.3; // Biên độ uốn lượn
      const frequency = 3; // Tần số uốn lượn
      const y = height / 2 + Math.sin(progress * Math.PI * frequency) * amplitude * Math.sin(progress * Math.PI);
      
      points.push({ x, y });
    }
    
    return points;
  };

  const riverPoints = generateRiverPath();

  // Chuyển đổi pixel sang tọa độ địa lý
  const pixelToCoordinate = (x: number, y: number): Coordinate => {
    // Tính toán tỷ lệ dựa trên độ dài sông 8013m
    const progressX = x / width;
    const progressY = (height / 2 - y) / (height / 2); // Chuẩn hóa từ -1 đến 1
    
    // Tính tọa độ dựa trên vị trí trên sông với điểm giữa làm gốc
    const deltaLng = (RIVER_LENGTH / 111320) * (progressX - 0.5); // Trừ 0.5 để giữa sông là gốc
    const deltaLat = (RIVER_LENGTH / 111320) * progressY * 0.3; // Biên độ nhỏ hơn cho vĩ độ
    
    return {
      lat: riverStartCoordinate.lat + deltaLat,
      lng: riverStartCoordinate.lng + deltaLng
    };
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

    // Vẽ viền sông
    ctx.beginPath();
    ctx.strokeStyle = '#2171b5';
    ctx.lineWidth = 2;

    riverPoints.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });

    ctx.stroke();

    // Vẽ các vị trí landmark
    // Đặt marker và label theo tỷ lệ vị trí thực trên đường sông (theo chiều dài path)
    RIVER_POSITIONS.forEach((position, index) => {
      // Tính progress dọc sông (0-1)
      const progress = position.position / RIVER_LENGTH;
      // Lấy điểm trên path tương ứng progress
      const pathIdx = Math.round(progress * (riverPoints.length - 1));
      const riverPoint = riverPoints[pathIdx];
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
        // Điều chỉnh vị trí text để tránh chồng lấp
        let textY = riverPoint.y - 20;
        let textX = riverPoint.x;
        // Đặc biệt điều chỉnh cho các vị trí gần nhau
        if (index === 0) { // Sài Đồng
          textY = riverPoint.y - 25;
          textX = riverPoint.x + 15;
        } else if (index === 1) { // Đài Tư
          textY = riverPoint.y + 35;
          textX = riverPoint.x - 15;
        } else if (index === 2) { // An Lạc
          textY = riverPoint.y - 30;
          textX = riverPoint.x;
        } else if (index === 3) { // Trâu Quỳ
          textY = riverPoint.y + 30;
          textX = riverPoint.x;
        } else if (index === 4) { // Đa Tốn
          textY = riverPoint.y - 25;
          textX = riverPoint.x - 20;
        } else if (index === 5) { // Xuân Thụy
          textY = riverPoint.y + 35;
          textX = riverPoint.x + 20;
        }
        // Vẽ background cho text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(textX - 30, textY - 12, 60, 16);
        // Vẽ text
        ctx.fillStyle = '#333333';
        ctx.fillText(position.name, textX, textY);
        // Vẽ đường nối từ marker tới text
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(riverPoint.x, riverPoint.y);
        ctx.lineTo(textX, textY - 5);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Vẽ vị trí được chọn
    if (selectedPosition !== null) {
      const pixelX = meterToPixel(selectedPosition, width);
      const riverPoint = getRiverPointAtX(pixelX);
      
      if (riverPoint) {
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(riverPoint.x, riverPoint.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    // Vẽ một số đặc điểm địa lý
    // Cây cối
    ctx.fillStyle = '#228b22';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      if (!isPointOnRiver(x, y)) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };

  // Hàm vẽ heatmap
  const drawHeatmap = (ctx: CanvasRenderingContext2D) => {
    const segments = 100; // Số segment cho heatmap
    
    for (let i = 0; i < segments; i++) {
      const progress = i / segments;
      const nextProgress = (i + 1) / segments;
      
      const startMeter = progress * RIVER_LENGTH;
      const endMeter = nextProgress * RIVER_LENGTH;
      
      // Tính nồng độ tại điểm giữa segment
      const middleMeter = (startMeter + endMeter) / 2;
      const waterQuality = calculateConcentration(middleMeter, rainfall, temperature);
      
      // Lấy giá trị nồng độ theo parameter được chọn
      let value = 0;
      if (selectedParameter === 'BOD5') {
        value = (waterQuality.BOD5_sample0 + waterQuality.BOD5_sample1) / 2;
      } else if (selectedParameter === 'NH4') {
        value = (waterQuality.NH4_sample0 + waterQuality.NH4_sample1) / 2;
      } else if (selectedParameter === 'NO3') {
        value = waterQuality.NO3_sample1;
      }
      
      // Lấy màu từ thang màu
      const colorScale = COLOR_SCALES[selectedParameter!];
      const color = getColorFromValue(value, colorScale);
      
      // Vẽ segment với màu tương ứng
      const startX = meterToPixel(startMeter, width);
      const endX = meterToPixel(endMeter, width);
      
      const startPoint = getRiverPointAtX(startX);
      const endPoint = getRiverPointAtX(endX);
      
      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 48;
        ctx.lineCap = 'round';
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }
    }
  };

  // Hàm lấy điểm sông tại vị trí X
  const getRiverPointAtX = (x: number): { x: number; y: number } | null => {
    // Tìm điểm gần nhất trên đường sông với tọa độ x
    let closestPoint: { x: number; y: number } | null = null;
    let minDistance = Infinity;
    
    for (const point of riverPoints) {
      const distance = Math.abs(point.x - x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    return closestPoint;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    if (isPointOnRiver(x, y)) {
      const coordinate = pixelToCoordinate(x, y);
      const positionMeters = pixelToMeter(x, width);
      const waterQuality = calculateConcentration(positionMeters, rainfall, temperature);
      
      setHoveredCoordinate(coordinate);
      setHoveredWaterQuality(waterQuality);
      setHoveredPositionMeters(positionMeters);
    } else {
      setHoveredCoordinate(null);
      setHoveredWaterQuality(null);
      setHoveredPositionMeters(null);
    }
  };

  const handleMouseClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (isPointOnRiver(x, y)) {
      const positionMeters = pixelToMeter(x, width);
      const waterQuality = calculateConcentration(positionMeters, rainfall, temperature);
      
      setSelectedPosition(positionMeters);
      
      if (onPositionSelect) {
        onPositionSelect(positionMeters, waterQuality);
      }
    }
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
    setHoveredCoordinate(null);
    setHoveredWaterQuality(null);
    setHoveredPositionMeters(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawRiver(ctx);
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseClick={handleMouseClick}
        onMouseLeave={handleMouseLeave}
      />
      
      {hoveredWaterQuality && mousePosition && hoveredPositionMeters !== null && (
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
        <p>• Tọa độ bắt đầu: {riverStartCoordinate.lat}°, {riverStartCoordinate.lng}°</p>
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
