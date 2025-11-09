'use client'

import React, { useRef, useEffect, useState } from 'react';

interface RiverMapProps {
  width?: number;
  height?: number;
}

interface Coordinate {
  lat: number;
  lng: number;
}

const RiverMap: React.FC<RiverMapProps> = ({ width = 800, height = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCoordinate, setHoveredCoordinate] = useState<Coordinate | null>(null);

  // Tọa độ gốc của con sông (điểm bắt đầu)
  const riverStartCoordinate = { lat: 21.0285, lng: 105.8542 }; // Hà Nội
  const riverLength = 8000; // 8000m
  
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
    // Tính toán tỷ lệ dựa trên độ dài sông 8000m
    const progressX = x / width;
    const progressY = (height / 2 - y) / (height / 2); // Chuẩn hóa từ -1 đến 1
    
    // Tính tọa độ dựa trên vị trí trên sông
    const deltaLng = (riverLength / 111320) * progressX; // 1 độ kinh độ ≈ 111320m tại vĩ độ Hà Nội
    const deltaLat = (riverLength / 111320) * progressY * 0.3; // Biên độ nhỏ hơn cho vĩ độ
    
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

    // Vẽ sông
    ctx.beginPath();
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 48; // tăng độ rộng sông để dễ hover
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

    // Thêm một số marker dọc theo sông
    ctx.fillStyle = '#ff6b6b';
    riverPoints.forEach((point, index) => {
      if (index % 10 === 0) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
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
      setHoveredCoordinate(coordinate);
    } else {
      setHoveredCoordinate(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
    setHoveredCoordinate(null);
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
        onMouseLeave={handleMouseLeave}
      />
      
      {hoveredCoordinate && mousePosition && (
        <div
          className="absolute bg-black text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none z-10"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
          }}
        >
          <div>Vĩ độ: {hoveredCoordinate.lat.toFixed(6)}°</div>
          <div>Kinh độ: {hoveredCoordinate.lng.toFixed(6)}°</div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Thông tin con sông:</strong></p>
        <p>• Độ dài: {riverLength.toLocaleString()}m</p>
        <p>• Tọa độ bắt đầu: {riverStartCoordinate.lat}°, {riverStartCoordinate.lng}°</p>
        <p>• Di chuyển chuột trên sông để xem tọa độ chi tiết</p>
      </div>
    </div>
  );
};

export default RiverMap;
