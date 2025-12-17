"use client"

import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
import RiverMap from '@/components/river-map';
import LineChart from '@/components/water-quality-chart';
import LeafletMapComponent from '@/components/leaflet-map';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { RIVER_POSITIONS, RIVER_LENGTH, WaterQualityData, calculateConcentration } from '@/lib/water-quality-calculations';
import { useWeatherData } from '@/lib/weather-service';
import { getColorFromValue } from '@/lib/water-quality/colors';

const RiverMapPage: NextPage = () => {
  
  // State management
  const [rainfall, setRainfall] = useState(0);
  const [temperature, setTemperature] = useState(26);
  const [selectedParameter, setSelectedParameter] = useState<'BOD0' | 'BOD1' | 'NH40' | 'NH41' | 'NO3' | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedPositionData, setSelectedPositionData] = useState<WaterQualityData | null>(null);
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [samplingStep, setSamplingStep] = useState(10);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Weather data hook - always set up, but only auto-refresh when realtimeMode is on
  // 5 minutes = 300000ms
  const WEATHER_UPDATE_INTERVAL = 300000;
  const { weatherData, isLoading: weatherLoading, error: weatherError, refetch: refetchWeather } = useWeatherData(
    realtimeMode, // autoRefresh only when realtime is enabled
    WEATHER_UPDATE_INTERVAL
  );

  // Ensure weather is refetched every 5 minutes in realtime mode
  useEffect(() => {
    if (!realtimeMode) return;
    // Refetch immediately on enable
    refetchWeather();
    const timer = setInterval(() => {
      refetchWeather();
    }, WEATHER_UPDATE_INTERVAL);
    return () => clearInterval(timer);
  }, [realtimeMode, refetchWeather]);
  
  // Chart series control
  const [enabledSeries, setEnabledSeries] = useState({
    BOD5_sample0: true,
    BOD5_sample1: false,
    NH4_sample0: false,
    NH4_sample1: false,
    NO3_sample1: false
  });

  // Manual position input
  const [manualPosition, setManualPosition] = useState('');

  // Handle position selection from map
  const handlePositionSelect = (position: number, data: WaterQualityData) => {
    setSelectedPosition(position);
    setSelectedPositionData(data);
  };

  // Get current effective weather values (realtime or manual)
  const getCurrentWeatherValues = () => {
    if (realtimeMode && weatherData) {
      return {
        rainfall: weatherData.rainfall,
        temperature: weatherData.temperature
      };
    }
    return { rainfall, temperature };
  };

  // Helper function to convert wind direction to compass direction
  const getWindDirection = (degrees: number): string => {
    const directions = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Helper function to get pressure status
  const getPressureStatus = (pressure: number): string => {
    if (pressure < 1000) return '(Thấp)';
    if (pressure > 1020) return '(Cao)';
    return '(Bình thường)';
  };

  // Helper function to get air quality assessment
  const getAirQualityAssessment = (weatherData: {
    humidity: number;
    visibility: number;
    windSpeed: number;
    cloudiness: number;
  }): { level: string; color: string; emoji: string } => {
    const { humidity, visibility, windSpeed, cloudiness } = weatherData;
    let score = 0;
    
    // Tốt: visibility cao, gió vừa phải, độ ẩm vừa, ít mây
    if (visibility >= 10000) score += 2;
    else if (visibility >= 5000) score += 1;
    
    if (windSpeed >= 1 && windSpeed <= 5) score += 2;
    else if (windSpeed > 5) score += 1;
    
    if (humidity >= 40 && humidity <= 70) score += 2;
    else if (humidity < 80) score += 1;
    
    if (cloudiness <= 30) score += 2;
    else if (cloudiness <= 60) score += 1;
    
    if (score >= 7) return { level: 'Rất tốt', color: 'text-green-600', emoji: '🌟' };
    if (score >= 5) return { level: 'Tốt', color: 'text-blue-600', emoji: '😊' };
    if (score >= 3) return { level: 'Khá', color: 'text-yellow-600', emoji: '😐' };
    return { level: 'Kém', color: 'text-red-600', emoji: '😷' };
  };

  // Handle manual position input
  const handleManualPositionSubmit = () => {
    const pos = parseFloat(manualPosition);
    if (!isNaN(pos) && pos >= 0 && pos <= 8013) {
      setSelectedPosition(pos);
      setManualPosition('');
      
      // Recalculate data for this position with current weather
      const currentWeather = getCurrentWeatherValues();
      const newData = calculateConcentration(pos, currentWeather.rainfall, currentWeather.temperature);
      setSelectedPositionData(newData);
    }
  };

  // Handle preset position selection
  const handlePresetPosition = (position: number) => {
    console.log('Preset position clicked:', position);
    setSelectedPosition(position);
    
    // Recalculate data for this position with current weather
    const currentWeather = getCurrentWeatherValues();
    const newData = calculateConcentration(position, currentWeather.rainfall, currentWeather.temperature);
    setSelectedPositionData(newData);
  };

  // Handle heatmap parameter selection  
  const handleHeatmapSelect = (param: 'BOD0' | 'BOD1' | 'NH40' | 'NH41' | 'NO3') => {
    console.log('🎯 Heatmap parameter clicked:', param);
    const newParam = selectedParameter === param ? null : param;
    console.log('🔄 Setting selectedParameter from', selectedParameter, 'to', newParam);
    setSelectedParameter(newParam);
  };

  // Function to get color scheme for each parameter với thang màu động
  const getParameterColorInfo = (param: 'BOD0' | 'BOD1' | 'NH40' | 'NH41' | 'NO3') => {
    // Tính khoảng giá trị thực tế cho parameter này (luôn luôn tính, không phụ thuộc selectedParameter)
    const range = calculateParameterRange(param);
    const description = range.max > range.min 
      ? `Động (${range.min.toFixed(2)}-${range.max.toFixed(2)} mg/L)`
      : 'Đang tính toán...';
    
    // Màu sắc đặc trưng cho từng chất
    let bgClass, gradientStyle;
    
    if (param === 'BOD0' || param === 'BOD1') {
      // BOD: Trắng → Đỏ
      bgClass = selectedParameter === param ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100';
      gradientStyle = { background: 'linear-gradient(to right, #ffffff 0%, #ffcccc 50%, #ff0000 100%)' };
    } else if (param === 'NH40' || param === 'NH41') {
      // NH4: Trắng → Vàng
      bgClass = selectedParameter === param ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100';
      gradientStyle = { background: 'linear-gradient(to right, #ffffff 0%, #ffffcc 50%, #ffff00 100%)' };
    } else if (param === 'NO3') {
      // NO3: Trắng → Xanh lam
      bgClass = selectedParameter === param ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100';
      gradientStyle = { background: 'linear-gradient(to right, #ffffff 0%, #ccddff 50%, #0066ff 100%)' };
    } else {
      // Mặc định: đỏ
      bgClass = selectedParameter === param ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100';
      gradientStyle = { background: 'linear-gradient(to right, #ffffff 0%, #ffcccc 50%, #ff0000 100%)' };
    }
    
    return {
      bgClass,
      gradientStyle,
      description: description
    };
  };

  // Toggle series
  const toggleSeries = (seriesName: keyof typeof enabledSeries) => {
    setEnabledSeries(prev => ({
      ...prev,
      [seriesName]: !prev[seriesName]
    }));
  };

  // Update local weather values when realtime data changes
  useEffect(() => {
    if (realtimeMode && weatherData) {
      console.log('🌦️ Realtime weather updated:', weatherData);
      console.log('📊 New values - Rainfall:', weatherData.rainfall, 'mm/hr, Temperature:', weatherData.temperature, '°C');
      
      // Show brief notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-300';
      notification.innerHTML = `🔄 Đã cập nhật dữ liệu thời tiết<br>🌧️ Mưa: ${weatherData.rainfall} mm/hr<br>🌡️ Nhiệt độ: ${weatherData.temperature}°C`;
      document.body.appendChild(notification);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
      
      // If we have a selected position, recalculate its data
      if (selectedPosition !== null) {
        const newData = calculateConcentration(selectedPosition, weatherData.rainfall, weatherData.temperature);
        setSelectedPositionData(newData);
      }
    }
  }, [weatherData, realtimeMode, selectedPosition]);

  // Update selected position data when weather parameters or samplingStep change (manual mode)
  useEffect(() => {
    if (!realtimeMode && selectedPosition !== null) {
      const newData = calculateConcentration(selectedPosition, rainfall, temperature);
      setSelectedPositionData(newData);
    }
  }, [rainfall, temperature, selectedPosition, realtimeMode, samplingStep]);

  // Debug selectedParameter changes
  useEffect(() => {
    console.log('📊 selectedParameter changed to:', selectedParameter);
  }, [selectedParameter]);

  // Force re-render of heatmap when parameters change
  const heatmapKey = `${selectedParameter}-${getCurrentWeatherValues().rainfall}-${getCurrentWeatherValues().temperature}-${showHeatmap}`;

  // Calculate dynamic min/max values for each parameter
  const calculateParameterRange = (parameter: 'BOD0' | 'BOD1' | 'NH40' | 'NH41' | 'NO3') => {
    const currentWeather = getCurrentWeatherValues();
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    // Sample positions along the river to find actual min/max
    for (let i = 0; i <= 80; i++) {
      const progress = i / 80;
      const positionMeters = progress * RIVER_LENGTH;
      const waterQuality = calculateConcentration(positionMeters, currentWeather.rainfall, currentWeather.temperature);
      
      let value = 0;
      switch (parameter) {
        case 'BOD0':
          value = waterQuality.BOD5_sample0;
          break;
        case 'BOD1':
          value = waterQuality.BOD5_sample1;
          break;
        case 'NH40':
          value = waterQuality.NH4_sample0;
          break;
        case 'NH41':
          value = waterQuality.NH4_sample1;
          break;
        case 'NO3':
          value = waterQuality.NO3_sample1;
          break;
      }
      
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
    }
    
    return { min: minValue, max: maxValue };
  };

  // Generate heatmap data với thang màu động dựa trên min/max thực tế
  const getHeatmapData = () => {
    if (!showHeatmap || !selectedParameter) return [];
    
    const currentWeather = getCurrentWeatherValues();
    const parameterRange = calculateParameterRange(selectedParameter);
    const heatmapPoints: Array<{ 
      lat: number; 
      lng: number; 
      intensity: number;
      value: number;
      parameter: string;
      color?: string;
    }> = [];
    
    // Tạo nhiều điểm dọc theo sông để hiển thị gradient nồng độ
    for (let i = 0; i <= 80; i++) { // Tăng số điểm để heatmap mượt hơn
      const progress = i / 80;
      const positionMeters = progress * RIVER_LENGTH;
      
      // Tính tọa độ dọc theo sông (từ tây bắc xuống đông nam)
      const startLat = 21.032323;
      const startLng = 105.919651;
      const endLat = 20.998456;
      const endLng = 105.952567;
      
      const lat = startLat + (endLat - startLat) * progress;
      const lng = startLng + (endLng - startLng) * progress;
      
      // Tính nồng độ tại vị trí này
      const waterQuality = calculateConcentration(positionMeters, currentWeather.rainfall, currentWeather.temperature);
      
      // Lấy giá trị theo parameter được chọn
      let value = 0;
      
      switch (selectedParameter) {
        case 'BOD0':
          value = waterQuality.BOD5_sample0;
          break;
        case 'BOD1':
          value = waterQuality.BOD5_sample1;
          break;
        case 'NH40':
          value = waterQuality.NH4_sample0;
          break;
        case 'NH41':
          value = waterQuality.NH4_sample1;
          break;
        case 'NO3':
          value = waterQuality.NO3_sample1;
          break;
      }
      
      // Use standardized color calculation with dynamic range
      const dynamicColorScale = {
        min: parameterRange.min,
        max: parameterRange.max,
        colors: selectedParameter === 'BOD0' || selectedParameter === 'BOD1' 
          ? ["white", "lightpink", "red"]
          : selectedParameter === 'NH40' || selectedParameter === 'NH41'
          ? ["white", "lightyellow", "gold"]
          : selectedParameter === 'NO3'
          ? ["white", "lightblue", "deepskyblue"]
          : ["white", "lightpink", "red"] // default
      };
      
      const color = getColorFromValue(value, dynamicColorScale);
      
      // Calculate intensity for leaflet heatmap (0-1)
      const range = parameterRange.max - parameterRange.min;
      const normalizedIntensity = range > 0 ? Math.max(0, Math.min(1, (value - parameterRange.min) / range)) : 0;
      
      heatmapPoints.push({
        lat,
        lng,
        intensity: normalizedIntensity,
        value,
        parameter: selectedParameter,
        color
      });
    }
    
    return heatmapPoints;
  };

  // Export functions
  const handleExportPDF = async () => {
    const currentWeather = getCurrentWeatherValues();
    const { generateExportData, exportToPDF } = await import('@/lib/export-utils');
    
    const exportData = generateExportData(currentWeather.rainfall, currentWeather.temperature);
    exportToPDF(exportData, currentWeather.rainfall, currentWeather.temperature);
  };

  const handleExportCSV = async () => {
    const currentWeather = getCurrentWeatherValues();
    const { generateExportData, downloadCSV } = await import('@/lib/export-utils');
    
    const exportData = generateExportData(currentWeather.rainfall, currentWeather.temperature);
    downloadCSV(exportData, currentWeather.rainfall, currentWeather.temperature);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="relative min-h-screen p-6">
          <div className="absolute top-4 left-4 z-10">
            <SidebarTrigger />
          </div>

          <div className="max-w-7xl mx-auto mt-16">
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800">
                Mô phỏng Chất lượng Nước Sông
              </h1>
              <p className="mt-2 text-gray-600">
                Hệ thống mô phỏng nồng độ 5 đại lượng trên dòng sông dài 8,013m
              </p>
            </header>

            {/* Controls Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6">Bảng điều khiển</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Weather Controls */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Thông số thời tiết</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Lượng mưa (mm/hr)
                    </label>
                    <Input
                      type="number"
                      value={realtimeMode ? getCurrentWeatherValues().rainfall : rainfall}
                      onChange={(e) => setRainfall(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.1"
                      disabled={realtimeMode}
                      className={realtimeMode ? "bg-gray-100" : ""}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nhiệt độ (°C)
                    </label>
                    <Input
                      type="number"
                      value={realtimeMode ? getCurrentWeatherValues().temperature : temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value) || 25)}
                      min="0"
                      max="50"
                      disabled={realtimeMode}
                      className={realtimeMode ? "bg-gray-100" : ""}
                    />
                  </div>
                  <Button
                    onClick={() => setRealtimeMode(!realtimeMode)}
                    variant={realtimeMode ? "destructive" : "default"}
                    className="w-full"
                    type="button"
                  >
                    {realtimeMode ? '🔴 Tắt Realtime' : '🟢 Bật Realtime'}
                  </Button>
                  {realtimeMode && (
                    <div className="text-xs text-gray-500 text-center space-y-1">
                      {weatherLoading ? (
                        <div className="text-blue-600 font-medium">🔄 Đang tải dữ liệu thời tiết...</div>
                      ) : weatherData ? (
                        <div>
                          <div className="text-green-600 font-medium">✅ Kết nối OpenWeather API thành công</div>
                          <div>📅 Cập nhật lúc: {new Date(weatherData.timestamp).toLocaleString('vi-VN')}</div>
                          <div className="text-blue-600">⏱️ Tự động cập nhật mỗi 5 phút</div>
                        </div>
                      ) : (
                        <div className="text-amber-600">⏳ Chờ dữ liệu thời tiết từ API...</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Position Controls */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Chọn vị trí (Z)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nhập vị trí (0-8013m)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={manualPosition}
                        onChange={(e) => setManualPosition(e.target.value)}
                        placeholder="Vị trí (m)"
                        min="0"
                        max="8013"
                      />
                      <Button onClick={handleManualPositionSubmit} type="button">Đi</Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Vị trí preset
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {RIVER_POSITIONS.map((pos, idx) => (
                        <Button
                          key={`preset-${idx}-${pos.position}`}
                          variant={selectedPosition === pos.position ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePresetPosition(pos.position)}
                          className="text-xs px-2 py-2 h-auto"
                          type="button"
                        >
                          {pos.name}
                          <br />
                          <span className="text-[10px] opacity-70">{pos.position}m</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Heatmap Controls */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Heatmap</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHeatmapSelect('BOD0')}
                      className={`w-full h-auto py-3 border-2 transition-all ${getParameterColorInfo('BOD0').bgClass}`}
                      type="button"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">BOD5 mẫu 0</span>
                        <div className="w-16 h-2 rounded-full border border-gray-300" style={getParameterColorInfo('BOD0').gradientStyle}></div>
                        <span className="text-xs opacity-70">{getParameterColorInfo('BOD0').description}</span>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHeatmapSelect('BOD1')}
                      className={`w-full h-auto py-3 border-2 transition-all ${getParameterColorInfo('BOD1').bgClass}`}
                      type="button"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">BOD5 mẫu 1</span>
                        <div className="w-16 h-2 rounded-full border border-gray-300" style={getParameterColorInfo('BOD1').gradientStyle}></div>
                        <span className="text-xs opacity-70">{getParameterColorInfo('BOD1').description}</span>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHeatmapSelect('NH40')}
                      className={`w-full h-auto py-3 border-2 transition-all ${getParameterColorInfo('NH40').bgClass}`}
                      type="button"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">NH4+ mẫu 0</span>
                        <div className="w-16 h-2 rounded-full border border-gray-300" style={getParameterColorInfo('NH40').gradientStyle}></div>
                        <span className="text-xs opacity-70">{getParameterColorInfo('NH40').description}</span>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHeatmapSelect('NH41')}
                      className={`w-full h-auto py-3 border-2 transition-all ${getParameterColorInfo('NH41').bgClass}`}
                      type="button"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">NH4+ mẫu 1</span>
                        <div className="w-16 h-2 rounded-full border border-gray-300" style={getParameterColorInfo('NH41').gradientStyle}></div>
                        <span className="text-xs opacity-70">{getParameterColorInfo('NH41').description}</span>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHeatmapSelect('NO3')}
                      className={`w-full h-auto py-3 border-2 transition-all ${getParameterColorInfo('NO3').bgClass}`}
                      type="button"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">NO3- mẫu 1</span>
                        <div className="w-16 h-2 rounded-full border border-gray-300" style={getParameterColorInfo('NO3').gradientStyle}></div>
                        <span className="text-xs opacity-70">{getParameterColorInfo('NO3').description}</span>
                      </div>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedParameter(null)}
                    className="w-full"
                    type="button"
                  >
                    Tắt Heatmap
                  </Button>
                </div>

                {/* Chart Controls */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Biểu đồ</h3>
                  <Button
                    onClick={() => setShowChart(!showChart)}
                    variant={showChart ? "default" : "outline"}
                    className="w-full"
                    type="button"
                  >
                    {showChart ? '📈 Ẩn biểu đồ' : '📊 Hiện biểu đồ'}
                  </Button>
                  
                  {/* Color Legend */}
                  {showChart && (
                    <div className="bg-gray-50 p-3 rounded border text-xs">
                      <div className="font-medium text-gray-700 mb-2">🎨 Màu sắc đường:</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#228B22'}}></div>
                          <span>BOD5 mẫu 0</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#FF8C00'}}></div>
                          <span>BOD5 mẫu 1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#663399'}}></div>
                          <span>NH4+ mẫu 0</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#1E90FF'}}></div>
                          <span>NH4+ mẫu 1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#90EE90'}}></div>
                          <span>NO3- mẫu 1</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Điểm lấy mẫu giữa các cổng
                    </label>
                    <select
                      value={samplingStep}
                      onChange={(e) => setSamplingStep(parseInt(e.target.value))}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value={1}>1 điểm/segment (11 điểm tổng)</option>
                      <option value={2}>2 điểm/segment (16 điểm tổng)</option>
                      <option value={5}>5 điểm/segment (31 điểm tổng)</option>
                      <option value={10}>10 điểm/segment (56 điểm tổng)</option>
                    </select>
                    <div className="text-xs text-gray-500 mt-1">
                      💡 Số điểm hiển thị giữa mỗi cặp cổng liền kề
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button onClick={handleExportPDF} variant="outline" className="w-full">
                      📄 Export PDF
                    </Button>
                    <Button onClick={handleExportCSV} variant="outline" className="w-full">
                      📊 Export CSV
                    </Button>
                  </div>
                </div>

                {/* Weather Details Panel */}
                {realtimeMode && weatherData && (
                  <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-700">Chi tiết thời tiết</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>📍 Vị trí:</span>
                        <span className="font-medium">{weatherData.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌅 Bình minh:</span>
                        <span className="font-medium">{new Date(weatherData.sunrise).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌇 Hoàng hôn:</span>
                        <span className="font-medium">{new Date(weatherData.sunset).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌡️ Cảm giác:</span>
                        <span className="font-medium">{weatherData.feelsLike.toFixed(1)}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>💧 Độ ẩm:</span>
                        <span className="font-medium">{weatherData.humidity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⚡ Áp suất:</span>
                        <span className="font-medium">{weatherData.pressure} hPa {getPressureStatus(weatherData.pressure)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌬️ Gió:</span>
                        <span className="font-medium">{weatherData.windSpeed.toFixed(1)} m/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🧭 Hướng:</span>
                        <span className="font-medium">{getWindDirection(weatherData.windDirection)} ({weatherData.windDirection}°)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>👁️ Tầm nhìn:</span>
                        <span className="font-medium">{(weatherData.visibility / 1000).toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>☁️ Mây che:</span>
                        <span className="font-medium">{weatherData.cloudiness}%</span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-blue-200">
                        <div className="flex items-center gap-2">
                          <Image 
                            src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                            alt={weatherData.description}
                            width={32}
                            height={32}
                            className="w-8 h-8"
                          />
                          <span className="text-xs capitalize">{weatherData.description}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Cập nhật: {new Date(weatherData.timestamp).toLocaleString()}
                        </div>
                        <div className="mt-3 pt-2 border-t border-blue-200">
                          {(() => {
                            const quality = getAirQualityAssessment(weatherData);
                            return (
                              <div className={`flex items-center gap-2 ${quality.color} font-medium`}>
                                <span>{quality.emoji}</span>
                                <span>Chất lượng không khí: {quality.level}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Position Data */}
            {selectedPosition !== null && selectedPositionData && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  Nồng độ tại vị trí {selectedPosition.toFixed(0)}m
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="bg-green-50 p-3 rounded border" style={{borderColor: '#228B22'}}>
                    <div className="flex items-center gap-2 font-medium text-green-800">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#228B22'}}></div>
                      BOD5 mẫu 0
                    </div>
                    <div className="text-green-700 font-semibold">{selectedPositionData.BOD5_sample0.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded border" style={{borderColor: '#FF8C00'}}>
                    <div className="flex items-center gap-2 font-medium text-orange-800">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#FF8C00'}}></div>
                      BOD5 mẫu 1
                    </div>
                    <div className="text-orange-700 font-semibold">{selectedPositionData.BOD5_sample1.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border" style={{borderColor: '#663399'}}>
                    <div className="flex items-center gap-2 font-medium text-purple-800">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#663399'}}></div>
                      NH4+ mẫu 0
                    </div>
                    <div className="text-purple-700 font-semibold">{selectedPositionData.NH4_sample0.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border" style={{borderColor: '#1E90FF'}}>
                    <div className="flex items-center gap-2 font-medium text-blue-800">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#1E90FF'}}></div>
                      NH4+ mẫu 1
                    </div>
                    <div className="text-blue-700 font-semibold">{selectedPositionData.NH4_sample1.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded border" style={{borderColor: '#90EE90'}}>
                    <div className="flex items-center gap-2 font-medium text-green-700">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#90EE90'}}></div>
                      NO3- mẫu 1
                    </div>
                    <div className="text-green-600 font-semibold">{selectedPositionData.NO3_sample1.toFixed(3)} mg/L</div>
                  </div>
                </div>
              </div>
            )}

            {/* Line Chart */}
            {showChart && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Biểu đồ nồng độ</h2>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(enabledSeries).map(([seriesName, enabled]) => {
                      // Màu sắc và tên hiển thị cho từng series
                      const seriesConfig = {
                        'BOD5_sample0': { color: '#228B22', name: 'BOD5 mẫu 0', bgColor: 'bg-green-100' },
                        'BOD5_sample1': { color: '#FF8C00', name: 'BOD5 mẫu 1', bgColor: 'bg-orange-100' },
                        'NH4_sample0': { color: '#663399', name: 'NH4+ mẫu 0', bgColor: 'bg-purple-100' },
                        'NH4_sample1': { color: '#1E90FF', name: 'NH4+ mẫu 1', bgColor: 'bg-blue-100' },
                        'NO3_sample1': { color: '#90EE90', name: 'NO3- mẫu 1', bgColor: 'bg-green-50' }
                      }[seriesName] || { color: '#666', name: seriesName, bgColor: 'bg-gray-100' };

                      return (
                        <Button
                          key={seriesName}
                          variant={enabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSeries(seriesName as keyof typeof enabledSeries)}
                          className={`${enabled ? '' : 'hover:' + seriesConfig.bgColor} flex items-center gap-1`}
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: seriesConfig.color }}
                          ></div>
                          <span className="text-xs">{seriesConfig.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <LineChart
                  key={`line-chart-${getCurrentWeatherValues().rainfall}-${getCurrentWeatherValues().temperature}-${samplingStep}-${JSON.stringify(enabledSeries)}`}
                  width={1200}
                  height={500}
                  rainfall={getCurrentWeatherValues().rainfall}
                  temperature={getCurrentWeatherValues().temperature}
                  enabledSeries={enabledSeries}
                  samplingStep={samplingStep}
                />
              </div>
            )}

            {/* River Map */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              {/* Weather Status Bar - Chi tiết */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200" style={{background: 'linear-gradient(to right, rgb(239 246 255), rgb(240 253 244)'}}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 text-sm">
                  {/* Hàng 1: Thông tin cơ bản */}
                  <div className="flex items-center gap-2">
                    <span>🌧️</span>
                    <span><strong>Mưa:</strong> {getCurrentWeatherValues().rainfall.toFixed(1)} mm/hr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🌡️</span>
                    <span><strong>Nhiệt độ:</strong> {getCurrentWeatherValues().temperature.toFixed(1)}°C</span>
                  </div>
                  {realtimeMode && weatherData && (
                    <>
                      <div className="flex items-center gap-2">
                        <span>🌡️</span>
                        <span><strong>Cảm giác:</strong> {weatherData.feelsLike.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💧</span>
                        <span><strong>Độ ẩm:</strong> {weatherData.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🌬️</span>
                        <span><strong>Gió:</strong> {weatherData.windSpeed.toFixed(1)} m/s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🧭</span>
                        <span><strong>Hướng gió:</strong> {getWindDirection(weatherData.windDirection)} ({weatherData.windDirection}°)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🌫️</span>
                        <span><strong>Tầm nhìn:</strong> {(weatherData.visibility / 1000).toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>☁️</span>
                        <span><strong>Mây che:</strong> {weatherData.cloudiness}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⚡</span>
                        <span><strong>Áp suất:</strong> {weatherData.pressure} hPa {getPressureStatus(weatherData.pressure)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Image 
                          src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`}
                          alt={weatherData.description}
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                        <span><strong>Mô tả:</strong> {weatherData.description}</span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Thông tin trạng thái */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
                  {realtimeMode && weatherData && (
                    <span className="text-green-600 font-medium">
                      🔄 Realtime - {weatherData.location} - Cập nhật: {new Date(weatherData.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                  {realtimeMode && weatherLoading && (
                    <span className="text-blue-600 font-medium animate-pulse">🔄 Đang tải dữ liệu thời tiết...</span>
                  )}
                  {weatherError && (
                    <span className="text-red-600 font-medium">⚠️ Lỗi: {weatherError}</span>
                  )}
                  {!realtimeMode && (
                    <span className="text-amber-600 font-medium">✏️ Chế độ thủ công - Dữ liệu nhập tay</span>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <RiverMap
                  key={`river-map-${getCurrentWeatherValues().rainfall}-${getCurrentWeatherValues().temperature}-${selectedParameter}`}
                  width={1200}
                  height={600}
                  rainfall={getCurrentWeatherValues().rainfall}
                  temperature={getCurrentWeatherValues().temperature}
                  selectedParameter={selectedParameter}
                  onPositionSelect={handlePositionSelect}
                />
              </div>
            </div>

            {/* Map of Cau Bay River */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Bản đồ sông Cầu Bây</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Điểm bắt đầu sông tại tọa độ 21.032323, 105.919651
                  </p>
                </div>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-4 py-2 text-sm rounded transition-colors ${
                    showHeatmap
                      ? 'bg-linear-to-r from-red-100 via-yellow-100 to-blue-100 text-gray-800 border border-gray-400'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {showHeatmap ? '🎨 Tắt Heatmap' : '📊 Bật Heatmap'}
                </button>
              </div>
{showHeatmap && selectedParameter && (() => {
                const range = calculateParameterRange(selectedParameter);
                let colorInfo;
                if (selectedParameter === 'BOD0' || selectedParameter === 'BOD1') {
                  colorInfo = {
                    icon: '🔴',
                    color: 'text-red-700',
                    gradient: 'linear-gradient(to right, #ffffff, #ffcccc, #ff0000)',
                    midColor: 'bg-red-300',
                    maxColor: 'bg-red-600',
                    colorName: 'đỏ'
                  };
                } else if (selectedParameter === 'NH40' || selectedParameter === 'NH41') {
                  colorInfo = {
                    icon: '🟡',
                    color: 'text-yellow-700',
                    gradient: 'linear-gradient(to right, #ffffff, #ffffcc, #ffff00)',
                    midColor: 'bg-yellow-300',
                    maxColor: 'bg-yellow-500',
                    colorName: 'vàng'
                  };
                } else if (selectedParameter === 'NO3') {
                  colorInfo = {
                    icon: '🔵',
                    color: 'text-blue-700',
                    gradient: 'linear-gradient(to right, #ffffff, #ccddff, #0066ff)',
                    midColor: 'bg-blue-300',
                    maxColor: 'bg-blue-600',
                    colorName: 'xanh lam'
                  };
                } else {
                  colorInfo = {
                    icon: '🔴',
                    color: 'text-red-700',
                    gradient: 'linear-gradient(to right, #ffffff, #ffcccc, #ff0000)',
                    midColor: 'bg-red-300',
                    maxColor: 'bg-red-600',
                    colorName: 'đỏ'
                  };
                }
                
                return (
                  <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                    <div className="font-semibold mb-2">📊 Heatmap hiển thị nồng độ {selectedParameter} từ mô phỏng (Thang màu động):</div>
                    
                    <div className="space-y-1 mb-2">
                      <div className={`font-medium ${colorInfo.color}`}>{colorInfo.icon} {selectedParameter} - Thang màu động:</div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-16 h-4 rounded border" style={{background: colorInfo.gradient}}></span>
                        <span>{range.min.toFixed(3)} mg/L → {range.max.toFixed(3)} mg/L</span>
                      </div>
                      <div className="text-xs mt-1 text-gray-600 space-y-1">
                        <div>• <span className="inline-block w-3 h-3 mr-2 bg-white border"></span>Giá trị thấp nhất: <strong>{range.min.toFixed(3)} mg/L</strong> (màu trắng)</div>
                        <div>• <span className={`inline-block w-3 h-3 mr-2 ${colorInfo.midColor} border`}></span>Giá trị trung bình: <strong>{((range.min + range.max) / 2).toFixed(3)} mg/L</strong> (màu {colorInfo.colorName} nhạt)</div>
                        <div>• <span className={`inline-block w-3 h-3 mr-2 ${colorInfo.maxColor} border`}></span>Giá trị cao nhất: <strong>{range.max.toFixed(3)} mg/L</strong> (màu {colorInfo.colorName})</div>
                      </div>
                      <div className="text-xs mt-2 text-gray-600 bg-white p-2 rounded border">
                        {selectedParameter === 'BOD0' && '* BOD5 mẫu 0: Giá trị đo được từ mẫu thứ nhất'}
                        {selectedParameter === 'BOD1' && '* BOD5 mẫu 1: Giá trị đo được từ mẫu thứ hai'}
                        {selectedParameter === 'NH40' && '* NH4+ mẫu 0: Giá trị đo được từ mẫu thứ nhất'}
                        {selectedParameter === 'NH41' && '* NH4+ mẫu 1: Giá trị đo được từ mẫu thứ hai'}
                        {selectedParameter === 'NO3' && '* NO3- mẫu 1: Giá trị đo được từ mẫu thứ hai'}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-gray-600 text-xs border-t pt-2">
                      <strong>Điều kiện hiện tại:</strong> 
                      <strong>Mưa:</strong> {getCurrentWeatherValues().rainfall.toFixed(1)}mm/hr | 
                      <strong>Nhiệt độ:</strong> {getCurrentWeatherValues().temperature.toFixed(1)}°C |
                      <strong>Chất:</strong> {selectedParameter}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      💡 <em>Thang màu tự động điều chỉnh theo khoảng min-max thực tế của từng chất</em>
                    </div>
                  </div>
                );
              })()}

              <LeafletMapComponent 
                key={heatmapKey}
                lat={21.032323}
                lng={105.919651}
                zoom={14}
                height="500px"
                title="Sông Cầu Bây"
                showHeatmap={showHeatmap}
                heatmapData={getHeatmapData()}
                selectedParameter={selectedParameter || 'BOD5'}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default RiverMapPage;