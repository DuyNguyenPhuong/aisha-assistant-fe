"use client"

import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import RiverMap from '@/components/river-map';
import LineChart from '@/components/water-quality-chart';
import CauBayRiver3DMap from '@/components/cau-bay-river-3d-map';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { RIVER_POSITIONS, WaterQualityData, calculateConcentration } from '@/lib/water-quality-calculations';
import { useWeatherData } from '@/lib/weather-service';

const RiverMapPage: NextPage = () => {
  const { t } = useTranslation();
  
  // State management
  const [rainfall, setRainfall] = useState(0);
  const [temperature, setTemperature] = useState(25);
  const [selectedParameter, setSelectedParameter] = useState<'BOD5' | 'NH4' | 'NO3' | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedPositionData, setSelectedPositionData] = useState<WaterQualityData | null>(null);
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [samplingStep, setSamplingStep] = useState(10);

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
  const getAirQualityAssessment = (weatherData: any): { level: string; color: string; emoji: string } => {
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
  const handleHeatmapSelect = (param: 'BOD5' | 'NH4' | 'NO3') => {
    console.log('Heatmap parameter clicked:', param);
    setSelectedParameter(selectedParameter === param ? null : param);
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
      console.log('Realtime weather updated:', weatherData);
      // Don't directly set rainfall/temperature in realtime mode
      // They will be used via getCurrentWeatherValues()
      
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

  // Export function (placeholder)
  const handleExport = () => {
    alert('Export PDF function - to be implemented');
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
                    <div className="text-xs text-gray-500 text-center">
                      {weatherLoading ? '🔄 Đang tải...' : 
                       weatherData ? `✅ Cập nhật ${new Date(weatherData.timestamp).toLocaleTimeString()}` :
                       '⏳ Chờ dữ liệu thời tiết'}
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
                  <div className="space-y-3">
                    {(['BOD5', 'NH4', 'NO3'] as const).map(param => (
                      <Button
                        key={`heatmap-${param}`}
                        variant={selectedParameter === param ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleHeatmapSelect(param)}
                        className="w-full h-auto py-3"
                        type="button"
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{param}</span>
                          <span className="text-xs opacity-70">
                            {param === 'BOD5' ? 'Đỏ (0-50 mg/L)' : 
                             param === 'NH4' ? 'Vàng (0-25 mg/L)' : 
                             'Xanh (0-30 mg/L)'}
                          </span>
                        </div>
                      </Button>
                    ))}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Bước lấy mẫu (m)
                    </label>
                    <select
                      value={samplingStep}
                      onChange={(e) => setSamplingStep(parseInt(e.target.value))}
                      className="w-full p-2 border rounded"
                    >
                      <option value={1}>1m</option>
                      <option value={2}>2m</option>
                      <option value={5}>5m</option>
                      <option value={10}>10m</option>
                    </select>
                  </div>
                  <Button onClick={handleExport} variant="outline" className="w-full">
                    Export PDF
                  </Button>
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
                          <img 
                            src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                            alt={weatherData.description}
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
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Nồng độ tại vị trí {selectedPosition.toFixed(0)}m
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="bg-red-50 p-3 rounded">
                    <div className="font-medium text-red-800">BOD5 mẫu 0</div>
                    <div className="text-red-600">{selectedPositionData.BOD5_sample0.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <div className="font-medium text-red-800">BOD5 mẫu 1</div>
                    <div className="text-red-600">{selectedPositionData.BOD5_sample1.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="font-medium text-yellow-800">NH4+ mẫu 0</div>
                    <div className="text-yellow-600">{selectedPositionData.NH4_sample0.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="font-medium text-yellow-800">NH4+ mẫu 1</div>
                    <div className="text-yellow-600">{selectedPositionData.NH4_sample1.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="font-medium text-blue-800">NO3- mẫu 1</div>
                    <div className="text-blue-600">{selectedPositionData.NO3_sample1.toFixed(3)} mg/L</div>
                  </div>
                </div>
              </div>
            )}

            {/* River Map */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
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
                        <img 
                          src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`}
                          alt={weatherData.description}
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
                  width={1200}
                  height={600}
                  rainfall={getCurrentWeatherValues().rainfall}
                  temperature={getCurrentWeatherValues().temperature}
                  selectedParameter={selectedParameter}
                  onPositionSelect={handlePositionSelect}
                />
              </div>
            </div>

            {/* 3D Map of Cau Bay River */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Bản đồ 3D sông Cầu Bây</h2>
              <p className="text-sm text-gray-600 mb-4">
                Bản đồ vệ tinh 3D thực tế của sông Cầu Bây với 6 điểm quan trắc được đánh dấu
              </p>
              <CauBayRiver3DMap height="500px" />
            </div>

            {/* Line Chart */}
            {showChart && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Biểu đồ nồng độ</h2>
                  <div className="space-x-2">
                    {Object.entries(enabledSeries).map(([seriesName, enabled]) => (
                      <Button
                        key={seriesName}
                        variant={enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSeries(seriesName as keyof typeof enabledSeries)}
                      >
                        {seriesName.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <LineChart
                  width={1200}
                  height={500}
                  rainfall={getCurrentWeatherValues().rainfall}
                  temperature={getCurrentWeatherValues().temperature}
                  enabledSeries={enabledSeries}
                  samplingStep={samplingStep}
                />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default RiverMapPage;