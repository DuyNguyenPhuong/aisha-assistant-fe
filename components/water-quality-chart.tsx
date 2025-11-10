'use client'

import React, { useRef, useEffect, useState } from 'react';
import { 
  calculateConcentration, 
  RIVER_LENGTH,
  WaterQualityData,
  RIVER_POSITIONS
} from '@/lib/water-quality-calculations';

interface LineChartProps {
  width?: number;
  height?: number;
  rainfall: number;
  temperature: number;
  enabledSeries: {
    BOD5_sample0: boolean;
    BOD5_sample1: boolean;
    NH4_sample0: boolean;
    NH4_sample1: boolean;
    NO3_sample1: boolean;
  };
  samplingStep: number; // 1, 2, 5, 10 meters
}

interface ChartData {
  position: number;
  data: WaterQualityData;
  name?: string; // Add name for river position
}

const LineChart: React.FC<LineChartProps> = ({
  width = 800,
  height = 400,
  rainfall,
  temperature,
  enabledSeries,
  samplingStep
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: any } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Responsive resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.offsetWidth;
        // Use min width for mobile, max for desktop
        const newWidth = Math.max(320, Math.min(parentWidth, 900));
        const newHeight = newWidth * 0.5;
        setCanvasSize({ width: newWidth, height: newHeight });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Colors for different series
  const seriesColors = {
    BOD5_sample0: '#ff4444',
    BOD5_sample1: '#ff8888',
    NH4_sample0: '#44ff44',
    NH4_sample1: '#88ff88',
    NO3_sample1: '#4444ff'
  };

  const seriesLabels = {
    BOD5_sample0: 'BOD5 mẫu 0',
    BOD5_sample1: 'BOD5 mẫu 1', 
    NH4_sample0: 'NH4+ mẫu 0',
    NH4_sample1: 'NH4+ mẫu 1',
    NO3_sample1: 'NO3- mẫu 1'
  };

  // Generate chart data - Use 6 river positions instead of sampling by meters
  useEffect(() => {
    const data: ChartData[] = [];
    // Use the 6 predefined river positions
    RIVER_POSITIONS.forEach(position => {
      const waterQuality = calculateConcentration(position.position, rainfall, temperature);
      data.push({
        position: position.position,
        data: waterQuality,
        name: position.name // Add name for X-axis labels
      });
    });
    setChartData(data);
  }, [rainfall, temperature, samplingStep]);

  // Calculate Y-axis scale
  const getYScale = () => {
    let maxValue = 0;
    chartData.forEach(point => {
      if (enabledSeries.BOD5_sample0) maxValue = Math.max(maxValue, point.data.BOD5_sample0);
      if (enabledSeries.BOD5_sample1) maxValue = Math.max(maxValue, point.data.BOD5_sample1);
      if (enabledSeries.NH4_sample0) maxValue = Math.max(maxValue, point.data.NH4_sample0);
      if (enabledSeries.NH4_sample1) maxValue = Math.max(maxValue, point.data.NH4_sample1);
      if (enabledSeries.NO3_sample1) maxValue = Math.max(maxValue, point.data.NO3_sample1);
    });
    return Math.max(maxValue * 1.1, 1); // Add 10% padding, minimum 1
  };

  // Draw chart
  const drawChart = (ctx: CanvasRenderingContext2D) => {
    const { width: cWidth, height: cHeight } = canvasSize;
    const padding = 60;
    const chartWidth = cWidth - 2 * padding;
    const chartHeight = cHeight - 2 * padding;
    const yMax = getYScale();

    // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, cWidth, cHeight);

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
  ctx.moveTo(padding, cHeight - padding);
  ctx.lineTo(cWidth - padding, cHeight - padding);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, cHeight - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    
    // Vertical grid lines for each river position
    chartData.forEach((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, cHeight - padding);
      ctx.stroke();
    });
    
    // Horizontal grid lines
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding + (i / gridSteps) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(cWidth - padding, y);
      ctx.stroke();
    }

    // Draw X-axis labels for river positions
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    chartData.forEach((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * chartWidth;
      // Draw position name
      ctx.fillText(point.name || '', x, cHeight - padding + 15);
      // Draw position distance
      ctx.font = '9px Arial';
      ctx.fillStyle = '#999';
      ctx.fillText(`${point.position}m`, x, cHeight - padding + 28);
      ctx.font = '11px Arial';
      ctx.fillStyle = '#666';
    });

    // Draw Y-axis labels (only values, no units)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '11px Arial';
    for (let i = 0; i <= gridSteps; i++) {
      const value = yMax * (1 - i / gridSteps);
      const y = padding + (i / gridSteps) * chartHeight;
      ctx.fillText(value.toFixed(1), padding - 5, y);
    }

    // Draw axis titles
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Các cổng trên sông Cầu Bây', cWidth / 2, cHeight - 5);    // Draw Y-axis title separately with better positioning
    ctx.save();
  ctx.translate(15, cHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Nồng độ (mg/L)', 0, 0);
    ctx.restore();

    // Draw data lines
    Object.entries(enabledSeries).forEach(([seriesName, enabled]) => {
      if (!enabled || chartData.length === 0) return;
      ctx.strokeStyle = seriesColors[seriesName as keyof typeof seriesColors];
      ctx.lineWidth = 2;
      ctx.beginPath();
      chartData.forEach((point, i) => {
        const x = padding + (i / (chartData.length - 1)) * chartWidth;
        const value = point.data[seriesName as keyof WaterQualityData];
        const y = cHeight - padding - (value / yMax) * chartHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      // Draw points
      ctx.fillStyle = seriesColors[seriesName as keyof typeof seriesColors];
      chartData.forEach((point, index) => {
        const x = padding + (index / (chartData.length - 1)) * chartWidth;
        const value = point.data[seriesName as keyof WaterQualityData];
        const y = cHeight - padding - (value / yMax) * chartHeight;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  };

  // Handle mouse move for tooltip
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosition({ x, y });

    const padding = 60;
    const chartWidth = width - 2 * padding;
    
    if (x >= padding && x <= width - padding && y >= padding && y <= height - padding) {
      // Calculate position along river
      const position = ((x - padding) / chartWidth) * RIVER_LENGTH;
      
      // Find closest data point
      const closestPoint = chartData.reduce((closest, point) => {
        const distance = Math.abs(point.position - position);
        const closestDistance = Math.abs(closest.position - position);
        return distance < closestDistance ? point : closest;
      }, chartData[0]);

      if (closestPoint) {
        setHoveredPoint({
          x,
          y,
          data: {
            position: closestPoint.position,
            ...closestPoint.data
          }
        });
      }
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setMousePosition(null);
  };

  // Responsive chart draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawChart(ctx);
  }, [chartData, enabledSeries, canvasSize.width, canvasSize.height, rainfall, temperature]);

  // Responsive mouse logic
  const handleResponsiveMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePosition({ x, y });
    const padding = 60;
    const chartWidth = canvasSize.width - 2 * padding;
    if (x >= padding && x <= canvasSize.width - padding && y >= padding && y <= canvasSize.height - padding) {
      // Find closest river position point by X coordinate
      const relativeX = (x - padding) / chartWidth;
      const pointIndex = Math.round(relativeX * (chartData.length - 1));
      const closestPoint = chartData[pointIndex];
      if (closestPoint) {
        setHoveredPoint({
          x,
          y,
          data: {
            position: closestPoint.position,
            ...closestPoint.data
          }
        });
      }
    } else {
      setHoveredPoint(null);
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-full overflow-x-auto">
      <div className="relative" style={{ width: '100%' }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border border-gray-300 rounded-lg cursor-crosshair w-full h-auto block"
          style={{ maxWidth: '100%' }}
          onMouseMove={handleResponsiveMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {Object.entries(enabledSeries).map(([seriesName, enabled]) => (
            enabled && (
              <div key={seriesName} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: seriesColors[seriesName as keyof typeof seriesColors] }}
                />
                <span>{seriesLabels[seriesName as keyof typeof seriesLabels]}</span>
              </div>
            )
          ))}
        </div>
        {/* Tooltip */}
        {hoveredPoint && mousePosition && (
          <div
            className="absolute bg-black text-white px-4 py-3 rounded-lg shadow-lg text-xs pointer-events-none z-10 max-w-xs"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 10,
            }}
          >
            <div className="font-bold mb-2">Vị trí: {hoveredPoint.data.position.toFixed(0)}m</div>
            <div className="space-y-1">
              {enabledSeries.BOD5_sample0 && (
                <div>BOD5 (mẫu 0): {hoveredPoint.data.BOD5_sample0.toFixed(3)} mg/L</div>
              )}
              {enabledSeries.BOD5_sample1 && (
                <div>BOD5 (mẫu 1): {hoveredPoint.data.BOD5_sample1.toFixed(3)} mg/L</div>
              )}
              {enabledSeries.NH4_sample0 && (
                <div>NH4+ (mẫu 0): {hoveredPoint.data.NH4_sample0.toFixed(3)} mg/L</div>
              )}
              {enabledSeries.NH4_sample1 && (
                <div>NH4+ (mẫu 1): {hoveredPoint.data.NH4_sample1.toFixed(3)} mg/L</div>
              )}
              {enabledSeries.NO3_sample1 && (
                <div>NO3- (mẫu 1): {hoveredPoint.data.NO3_sample1.toFixed(3)} mg/L</div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Chart info */}
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Thông số biểu đồ:</strong></p>
        <p>• Số điểm quan trắc: {chartData.length} cổng trên sông Cầu Bây</p>
        <p>• Lượng mưa: {rainfall} mm/hr</p>
        <p>• Nhiệt độ: {temperature}°C</p>
        <p>• Số series đang hiển thị: {Object.values(enabledSeries).filter(Boolean).length}</p>
        <p>• Các cổng: {chartData.map(d => d.name).join(', ')}</p>
      </div>
    </div>
  );
};

export default LineChart;