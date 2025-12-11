"use client";
import React, { useRef, useEffect, useState } from "react";
import {
  calculateConcentration,
  WaterQualityData,
  RIVER_POSITIONS,
  CRITICAL_POSITIONS,
} from "@/lib/water-quality-calculations";
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
  samplingStep: number;
}
interface ChartData {
  position: number;
  data: WaterQualityData;
  name?: string;
}
const LineChart: React.FC<LineChartProps> = ({
  width = 800,
  height = 400,
  rainfall,
  temperature,
  enabledSeries,
  samplingStep,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    data: WaterQualityData & { position: number };
  } | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  
  // Zoom states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [yAxisRange, setYAxisRange] = useState<{
    min: number;
    max: number;
    auto: boolean;
  }>({
    min: 0,
    max: 1,
    auto: true
  });
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.offsetWidth;
        const newWidth = Math.max(320, Math.min(parentWidth, 900));
        const newHeight = newWidth * 0.5;
        setCanvasSize({ width: newWidth, height: newHeight });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const seriesColors = {
    BOD5_sample0: "#228B22",
    BOD5_sample1: "#FF8C00",
    NH4_sample0: "#663399",
    NH4_sample1: "#1E90FF",
    NO3_sample1: "#90EE90",
  };
  const seriesLabels = {
    BOD5_sample0: "BOD5 mẫu 0",
    BOD5_sample1: "BOD5 mẫu 1",
    NH4_sample0: "NH4+ mẫu 0",
    NH4_sample1: "NH4+ mẫu 1",
    NO3_sample1: "NO3- mẫu 1",
  };
  useEffect(() => {
    const data: ChartData[] = [];
    const positionsToInclude = new Set<number>();

    // Luôn bao gồm các điểm quan trọng
    CRITICAL_POSITIONS.forEach(pos => positionsToInclude.add(pos));

    // Thêm các điểm trung gian dựa trên samplingStep
    for (
      let segmentIndex = 0;
      segmentIndex < RIVER_POSITIONS.length - 1;
      segmentIndex++
    ) {
      const currentGate = RIVER_POSITIONS[segmentIndex];
      const nextGate = RIVER_POSITIONS[segmentIndex + 1];
      
      // Thêm điểm đầu và điểm cuối
      positionsToInclude.add(currentGate.position);
      positionsToInclude.add(nextGate.position);

      // Thêm các điểm trung gian
      for (let i = 1; i <= samplingStep; i++) {
        const progress = i / (samplingStep + 1);
        const intermediatePosition =
          currentGate.position +
          (nextGate.position - currentGate.position) * progress;
        positionsToInclude.add(Math.round(intermediatePosition));
      }
    }

    // Chuyển Set thành Array và sort
    const sortedPositions = Array.from(positionsToInclude).sort((a, b) => a - b);

    // Tạo data cho mỗi position
    sortedPositions.forEach(position => {
      const waterQuality = calculateConcentration(
        position,
        rainfall,
        temperature,
      );

      // Tìm tên cho position này
      const namedPosition = RIVER_POSITIONS.find(rp => rp.position === position);
      const name = namedPosition ? namedPosition.name : "";

      data.push({
        position,
        data: waterQuality,
        name,
      });
    });

    setChartData(data);
  }, [rainfall, temperature, samplingStep]);

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const newLevel = prev < 2 ? prev * 1.5 : prev < 10 ? prev * 1.2 : prev * 1.1;
      return Math.min(newLevel, 50); // Tăng max zoom lên 50x
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newLevel = prev > 5 ? prev / 1.1 : prev > 2 ? prev / 1.2 : prev / 1.5;
      return Math.max(newLevel, 0.1); // Giảm min zoom xuống 0.1x
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setYAxisRange(prev => ({ ...prev, auto: true }));
  };

  const handleAutoFitToSeries = () => {
    if (chartData.length === 0) return;
    
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    chartData.forEach((point) => {
      const values = [];
      if (enabledSeries.BOD5_sample0) values.push(point.data.BOD5_sample0);
      if (enabledSeries.BOD5_sample1) values.push(point.data.BOD5_sample1);
      if (enabledSeries.NH4_sample0) values.push(point.data.NH4_sample0);
      if (enabledSeries.NH4_sample1) values.push(point.data.NH4_sample1);
      if (enabledSeries.NO3_sample1) values.push(point.data.NO3_sample1);
      
      values.forEach(value => {
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      });
    });
    
    if (minValue !== Infinity) {
      const range = maxValue - minValue;
      const buffer = range * 0.05; // 5% buffer
      setYAxisRange({
        min: Math.max(0, minValue - buffer),
        max: maxValue + buffer,
        auto: false
      });
      setZoomLevel(1);
    }
  };

  const handleToggleAutoScale = () => {
    setYAxisRange(prev => ({ ...prev, auto: !prev.auto }));
  };
  const getYScale = () => {
    if (!yAxisRange.auto) {
      return { min: yAxisRange.min, max: yAxisRange.max };
    }

    let minValue = Infinity;
    let maxValue = -Infinity;
    
    chartData.forEach((point) => {
      const values = [];
      if (enabledSeries.BOD5_sample0) values.push(point.data.BOD5_sample0);
      if (enabledSeries.BOD5_sample1) values.push(point.data.BOD5_sample1);
      if (enabledSeries.NH4_sample0) values.push(point.data.NH4_sample0);
      if (enabledSeries.NH4_sample1) values.push(point.data.NH4_sample1);
      if (enabledSeries.NO3_sample1) values.push(point.data.NO3_sample1);
      
      values.forEach(value => {
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      });
    });
    
    // Nếu không có dữ liệu
    if (minValue === Infinity) {
      return { min: 0, max: 1 };
    }
    
    // Đảm bảo có range tối thiểu để tránh zoom quá gần
    let range = maxValue - minValue;
    const minRange = 0.001; // Range tối thiểu 0.001 mg/L
    if (range < minRange) {
      range = minRange;
      const center = (minValue + maxValue) / 2;
      minValue = center - range / 2;
      maxValue = center + range / 2;
    }
    
    // Áp dụng zoom level với logic cải tiến
    const zoomedRange = Math.max(range / zoomLevel, minRange);
    const center = (minValue + maxValue) / 2;
    
    // Buffer động dựa trên zoom level
    const bufferPercent = Math.max(0.02, 0.1 / Math.sqrt(zoomLevel)); // Buffer giảm khi zoom in
    const buffer = zoomedRange * bufferPercent;
    
    const calculatedMin = center - zoomedRange / 2 - buffer;
    const calculatedMax = center + zoomedRange / 2 + buffer;
    
    return {
      min: Math.max(0, calculatedMin),
      max: calculatedMax
    };
  };
  const drawChart = (ctx: CanvasRenderingContext2D) => {
    const { width: cWidth, height: cHeight } = canvasSize;
    const padding = 60;
    const chartWidth = cWidth - 2 * padding;
    const chartHeight = cHeight - 2 * padding;
    const yScale = getYScale();
    const yMin = yScale.min;
    const yMax = yScale.max;
    const yRange = yMax - yMin;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, cWidth, cHeight);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, cHeight - padding);
    ctx.lineTo(cWidth - padding, cHeight - padding);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, cHeight - padding);
    ctx.stroke();
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 1;
    
    RIVER_POSITIONS.forEach((riverPos) => {
      // Tìm điểm có position chính xác bằng riverPos.position
      const exactIndex = chartData.findIndex(d => d.position === riverPos.position);
      
      if (exactIndex >= 0) {
        // Tìm thấy exact match, tính X dựa trên index thực tế
        const x = padding + (exactIndex / (chartData.length - 1)) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, cHeight - padding);
        ctx.stroke();
      } else {
        // Backup: nếu không tìm thấy exact match, tính dựa trên tỷ lệ vị trí
        // từ position đầu tiên đến cuối cùng trong chartData
        if (chartData.length > 0) {
          const firstPos = chartData[0].position;
          const lastPos = chartData[chartData.length - 1].position;
          const positionRatio = (riverPos.position - firstPos) / (lastPos - firstPos);
          const x = padding + positionRatio * chartWidth;
          
          ctx.beginPath();
          ctx.moveTo(x, padding);
          ctx.lineTo(x, cHeight - padding);
          ctx.stroke();
        }
      }
    });
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding + (i / gridSteps) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(cWidth - padding, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#666";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    RIVER_POSITIONS.forEach((riverPos) => {
      const dataIndex = chartData.findIndex(
        (d) => Math.abs(d.position - riverPos.position) < 50,
      );
      if (dataIndex >= 0) {
        const x = padding + (dataIndex / (chartData.length - 1)) * chartWidth;
        ctx.fillText(riverPos.name, x, cHeight - padding + 15);
        ctx.font = "9px Arial";
        ctx.fillStyle = "#999";
        ctx.fillText(`${riverPos.position}m`, x, cHeight - padding + 28);
        ctx.font = "11px Arial";
        ctx.fillStyle = "#666";
      }
    });
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.font = "11px Arial";
    for (let i = 0; i <= gridSteps; i++) {
      const value = yMin + (yRange * (1 - i / gridSteps));
      const y = padding + (i / gridSteps) * chartHeight;
      
      // Động precision dựa trên zoom level và range
      let precision = 3;
      if (yRange < 0.001) precision = 6;
      else if (yRange < 0.01) precision = 5;
      else if (yRange < 0.1) precision = 4;
      else if (yRange > 100) precision = 1;
      else if (yRange > 10) precision = 2;
      
      ctx.fillText(value.toFixed(precision), padding - 5, y);
    }
    ctx.fillStyle = "#333";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Các cổng trên sông Cầu Bây", cWidth / 2, cHeight - 5);
    ctx.save();
    ctx.translate(15, cHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Nồng độ (mg/L)", 0, 0);
    ctx.restore();
    Object.entries(enabledSeries).forEach(([seriesName, enabled]) => {
      if (!enabled || chartData.length === 0) return;
      ctx.strokeStyle = seriesColors[seriesName as keyof typeof seriesColors];
      ctx.lineWidth = 2;
      ctx.beginPath();
      chartData.forEach((point, i) => {
        const x = padding + (i / (chartData.length - 1)) * chartWidth;
        const value = point.data[seriesName as keyof WaterQualityData];
        const normalizedValue = (value - yMin) / yRange;
        const y = cHeight - padding - normalizedValue * chartHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.fillStyle = seriesColors[seriesName as keyof typeof seriesColors];
      chartData.forEach((point, index) => {
        const x = padding + (index / (chartData.length - 1)) * chartWidth;
        const value = point.data[seriesName as keyof WaterQualityData];
        const normalizedValue = (value - yMin) / yRange;
        const y = cHeight - padding - normalizedValue * chartHeight;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  };
  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setMousePosition(null);
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawChart(ctx);
  }, [
    chartData,
    enabledSeries,
    canvasSize.width,
    canvasSize.height,
    rainfall,
    temperature,
    zoomLevel,
    yAxisRange,
    drawChart,
  ]);
  const handleResponsiveMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    setMousePosition({ x, y });
    const padding = 60;
    const chartWidth = canvasSize.width - 2 * padding;
    if (
      canvasX >= padding &&
      canvasX <= canvasSize.width - padding &&
      canvasY >= padding &&
      canvasY <= canvasSize.height - padding
    ) {
      const relativeX = (canvasX - padding) / chartWidth;
      const pointIndex = Math.round(relativeX * (chartData.length - 1));
      const closestPoint = chartData[pointIndex];
      if (closestPoint) {
        setHoveredPoint({
          x,
          y,
          data: {
            position: closestPoint.position,
            ...closestPoint.data,
          },
        });
      }
    } else {
      setHoveredPoint(null);
    }
  };
  return (
    <div ref={containerRef} className="w-full max-w-full overflow-x-auto">
      {/* Zoom Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">🔍 Zoom:</span>
          <button
            onClick={handleZoomOut}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              zoomLevel <= 0.1 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            disabled={zoomLevel <= 0.1}
          >
            Zoom Out
          </button>
          <span className="px-2 py-1 bg-white rounded border text-sm min-w-[70px] text-center font-mono">
            {zoomLevel >= 10 ? `${zoomLevel.toFixed(0)}x` : zoomLevel.toFixed(1)}x
          </span>
          <button
            onClick={handleZoomIn}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              zoomLevel >= 50 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            disabled={zoomLevel >= 50}
          >
            Zoom In
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetZoom}
            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
          >
            🔄 Reset
          </button>
          <button
            onClick={handleAutoFitToSeries}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors"
          >
            📏 Auto Fit
          </button>
          <button
            onClick={handleToggleAutoScale}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              yAxisRange.auto 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            {yAxisRange.auto ? '🤖 Auto Scale' : '📐 Manual Scale'}
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {yAxisRange.auto ? (
            <>
              <span>📊 Y-axis: Auto</span>
              <span className="text-blue-600">| Zoom: {zoomLevel >= 10 ? zoomLevel.toFixed(0) : zoomLevel.toFixed(1)}x</span>
              {chartData.length > 0 && (() => {
                const scale = getYScale();
                const range = scale.max - scale.min;
                return (
                  <span className="text-green-600">| Range: {range < 0.001 ? range.toExponential(2) : range.toFixed(range < 0.1 ? 4 : 3)}</span>
                );
              })()}
            </>
          ) : (
            <>
              <span>📊 Y-axis: Manual ({yAxisRange.min.toFixed(3)} - {yAxisRange.max.toFixed(3)})</span>
              <span className="text-blue-600">| Zoom: {zoomLevel >= 10 ? zoomLevel.toFixed(0) : zoomLevel.toFixed(1)}x</span>
            </>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">🎯 Quick Fit:</span>
          {Object.entries(enabledSeries).filter(([_, enabled]) => enabled).map(([seriesName, _]) => {
            const getParameterRange = (paramName: string) => {
              let min = Infinity, max = -Infinity;
              chartData.forEach(point => {
                const value = point.data[paramName as keyof WaterQualityData];
                min = Math.min(min, value);
                max = Math.max(max, value);
              });
              return { min, max };
            };

            const handleQuickFit = () => {
              const range = getParameterRange(seriesName);
              if (range.min !== Infinity) {
                const buffer = (range.max - range.min) * 0.1;
                setYAxisRange({
                  min: Math.max(0, range.min - buffer),
                  max: range.max + buffer,
                  auto: false
                });
                setZoomLevel(1);
              }
            };

            return (
              <button
                key={seriesName}
                onClick={handleQuickFit}
                className="px-2 py-1 bg-white hover:bg-gray-100 border rounded text-xs font-medium transition-colors flex items-center gap-1"
                title={`Fit to ${seriesLabels[seriesName as keyof typeof seriesLabels]} range`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: seriesColors[seriesName as keyof typeof seriesColors]
                  }}
                />
                {seriesLabels[seriesName as keyof typeof seriesLabels]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative" style={{ width: "100%" }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border border-gray-300 rounded-lg cursor-crosshair w-full h-auto block"
          style={{ maxWidth: "100%" }}
          onMouseMove={handleResponsiveMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {Object.entries(enabledSeries).map(
            ([seriesName, enabled]) =>
              enabled && (
                <div key={seriesName} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor:
                        seriesColors[seriesName as keyof typeof seriesColors],
                    }}
                  />
                  <span>
                    {seriesLabels[seriesName as keyof typeof seriesLabels]}
                  </span>
                </div>
              ),
          )}
        </div>
        {}
        {hoveredPoint && mousePosition && (
          <div
            className="absolute bg-black text-white px-4 py-3 rounded-lg shadow-lg text-xs pointer-events-none z-10 max-w-xs"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 10,
            }}
          >
            <div className="font-bold mb-2">
              Vị trí: {hoveredPoint.data.position.toFixed(0)}m
            </div>
            <div className="space-y-1">
              {enabledSeries.BOD5_sample0 && (
                <div>
                  BOD5 (mẫu 0): {hoveredPoint.data.BOD5_sample0.toFixed(3)} mg/L
                </div>
              )}
              {enabledSeries.BOD5_sample1 && (
                <div>
                  BOD5 (mẫu 1): {hoveredPoint.data.BOD5_sample1.toFixed(3)} mg/L
                </div>
              )}
              {enabledSeries.NH4_sample0 && (
                <div>
                  NH4+ (mẫu 0): {hoveredPoint.data.NH4_sample0.toFixed(3)} mg/L
                </div>
              )}
              {enabledSeries.NH4_sample1 && (
                <div>
                  NH4+ (mẫu 1): {hoveredPoint.data.NH4_sample1.toFixed(3)} mg/L
                </div>
              )}
              {enabledSeries.NO3_sample1 && (
                <div>
                  NO3- (mẫu 1): {hoveredPoint.data.NO3_sample1.toFixed(3)} mg/L
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Thông số biểu đồ:</strong>
        </p>
        <p>• Số điểm quan trắc: {chartData.length} cổng trên sông Cầu Bây</p>
        <p>• Lượng mưa: {rainfall} mm/hr</p>
        <p>• Nhiệt độ: {temperature}°C</p>
        <p>
          • Số series đang hiển thị:{" "}
          {Object.values(enabledSeries).filter(Boolean).length}
        </p>
        <p>• Zoom level: {zoomLevel >= 10 ? zoomLevel.toFixed(0) : zoomLevel.toFixed(1)}x (0.1x - 50x)</p>
        <p>• Y-axis range: {yAxisRange.auto ? 'Auto-calculated with smart zoom' : `Manual: ${yAxisRange.min.toFixed(3)} - ${yAxisRange.max.toFixed(3)} mg/L`}</p>
        {yAxisRange.auto && chartData.length > 0 && (() => {
          const scale = getYScale();
          const range = scale.max - scale.min;
          return (
            <p>• Current view range: {scale.min.toFixed(range < 0.1 ? 4 : 3)} - {scale.max.toFixed(range < 0.1 ? 4 : 3)} mg/L (span: {range < 0.001 ? range.toExponential(2) : range.toFixed(range < 0.1 ? 4 : 3)})</p>
          );
        })()}
        <p>• Các cổng: {chartData.map((d) => d.name).join(", ")}</p>
      </div>
    </div>
  );
};
export default LineChart;
