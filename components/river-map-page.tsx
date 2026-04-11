"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RiverMap from '@/components/river-map';
import LineChart from '@/components/water-quality-chart';
import LeafletMapComponent from '@/components/leaflet-map';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { RIVER_POSITIONS, RIVER_LENGTH, WaterQualityData, calculateConcentration } from '@/lib/water-quality-calculations';
import { useWeatherData } from '@/lib/weather-service';
import { getColorFromValue, COLOR_SCALES } from '@/lib/water-quality/colors';

export default function RiverMapPage() {
  const pathname = usePathname();
  const showBackToHome = pathname === '/river-map';

  const [rainfall, setRainfall] = useState<number | null>(0);
  const [temperature, setTemperature] = useState<number | null>(26);
  const [selectedParameter, setSelectedParameter] = useState<'BOD0' | 'BOD1' | 'NH40' | 'NH41' | 'NO3' | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedPositionData, setSelectedPositionData] = useState<WaterQualityData | null>(null);
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [samplingStep, setSamplingStep] = useState(10);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<'hard' | 'dynamic'>('dynamic'); 

  
  
  const WEATHER_UPDATE_INTERVAL = 300000;
  const { weatherData, isLoading: weatherLoading, error: weatherError, refetch: refetchWeather } = useWeatherData(
    realtimeMode, 
    WEATHER_UPDATE_INTERVAL
  );

  
  useEffect(() => {
    if (!realtimeMode) return;
    
    refetchWeather();
    const timer = setInterval(() => {
      refetchWeather();
    }, WEATHER_UPDATE_INTERVAL);
    return () => clearInterval(timer);
  }, [realtimeMode, refetchWeather]);
  
  
  const [enabledSeries, setEnabledSeries] = useState({
    BOD5_sample0: true,
    BOD5_sample1: false,
    NH4_sample0: false,
    NH4_sample1: false,
    NO3_sample1: false
  });

  
  const [manualPosition, setManualPosition] = useState('');

  
  const handlePositionSelect = (position: number, data: WaterQualityData) => {
    setSelectedPosition(position);
    setSelectedPositionData(data);
  };

  
  const getCurrentWeatherValues = () => {
    if (realtimeMode && weatherData) {
      return {
        rainfall: weatherData.rainfall,
        temperature: weatherData.temperature
      };
    }
    return { rainfall: rainfall ?? 0, temperature: temperature ?? 26 };
  };

  
  const getCalculationTemperature = (airTemperature: number): number => {
    return 0.7 * airTemperature;
  };

  
  
  
  const getCalculationRainfall = (weatherRainfall: number): number => {
    if (weatherRainfall <= 3) {
      return 0;
    } else {
      return 0.5 * (weatherRainfall - 3);
    }
  };

  
  const getCurrentCalculationValues = () => {
    const weatherValues = getCurrentWeatherValues();
    return {
      rainfall: getCalculationRainfall(weatherValues.rainfall),
      temperature: getCalculationTemperature(weatherValues.temperature)
    };
  };

  
  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  
  const getPressureStatus = (pressure: number): string => {
    if (pressure < 1000) return '(Low)';
    if (pressure > 1020) return '(High)';
    return '(Normal)';
  };

  
  const getAirQualityAssessment = (weatherData: {
    humidity: number;
    visibility: number;
    windSpeed: number;
    cloudiness: number;
  }): { level: string; color: string; emoji: string } => {
    const { humidity, visibility, windSpeed, cloudiness } = weatherData;
    let score = 0;
    
    
    if (visibility >= 10000) score += 2;
    else if (visibility >= 5000) score += 1;
    
    if (windSpeed >= 1 && windSpeed <= 5) score += 2;
    else if (windSpeed > 5) score += 1;
    
    if (humidity >= 40 && humidity <= 70) score += 2;
    else if (humidity < 80) score += 1;
    
    if (cloudiness <= 30) score += 2;
    else if (cloudiness <= 60) score += 1;
    
    if (score >= 7) return { level: 'Excellent', color: 'text-green-600', emoji: '🌟' };
    if (score >= 5) return { level: 'Good', color: 'text-blue-600', emoji: '😊' };
    if (score >= 3) return { level: 'Moderate', color: 'text-yellow-600', emoji: '😐' };
    return { level: 'Poor', color: 'text-red-600', emoji: '😷' };
  };

  
  const handleManualPositionSubmit = () => {
    const pos = parseFloat(manualPosition);
    if (!isNaN(pos) && pos >= 0 && pos <= 8013) {
      setSelectedPosition(pos);
      
      
      
      const currentWeather = getCurrentCalculationValues();
      const newData = calculateConcentration(pos, currentWeather.rainfall, currentWeather.temperature);
      setSelectedPositionData(newData);
    }
  };

  
  const handlePresetPosition = (position: number) => {
    console.log('Preset position clicked:', position);
    setSelectedPosition(position);
    
    
    const currentWeather = getCurrentCalculationValues();
    const newData = calculateConcentration(position, currentWeather.rainfall, currentWeather.temperature);
    setSelectedPositionData(newData);
  };

  
  const handleHeatmapSelect = (param: 'BOD0' | 'BOD1' | 'NH40' | 'NH41' | 'NO3') => {
    console.log('🎯 Heatmap parameter clicked:', param);
    const newParam = selectedParameter === param ? null : param;
    console.log('🔄 Setting selectedParameter from', selectedParameter, 'to', newParam);
    setSelectedParameter(newParam);
  };

  
  const getParameterColorInfo = (param: 'BOD0' | 'BOD1' | 'NH40' | 'NH41' | 'NO3') => {
    
    const range = calculateParameterRange(param);
    
    let description;
    if (heatmapMode === 'hard') {
      
      const hardRanges = {
        'BOD0': '0-38.1',
        'BOD1': '0-38.1', 
        'NH40': '0-15.3',
        'NH41': '0-15.3',
        'NO3': '0-15.55'
      };
      description = `Fixed (${hardRanges[param]} mg/L)`;
    } else {
      
      if (range.max !== -Infinity && range.min !== Infinity) {
        if (range.max === range.min) {
          
          description = `Dynamic (${range.min.toFixed(2)} mg/L)`;
        } else {
          
          description = `Dynamic (${range.min.toFixed(2)}-${range.max.toFixed(2)} mg/L)`;
        }
      } else {
        description = 'Calculating...';
      }
    }
    
    
    let bgClass, gradientStyle;
    
    if (param === 'BOD0' || param === 'BOD1') {
      
      bgClass = selectedParameter === param ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100';
      gradientStyle = { background: 'linear-gradient(to right, #ffffff 0%, #ffcccc 50%, #ff0000 100%)' };
    } else if (param === 'NH40' || param === 'NH41') {
      
      bgClass = selectedParameter === param ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100';
      gradientStyle = { background: 'linear-gradient(to right, #ffffff 0%, #ffffcc 50%, #ffff00 100%)' };
    } else if (param === 'NO3') {
      
      bgClass = selectedParameter === param ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100';
      gradientStyle = { background: 'linear-gradient(to right, #ffffff 0%, #ccddff 50%, #0066ff 100%)' };
    } else {
      
      bgClass = selectedParameter === param ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100';
      gradientStyle = { background: 'linear-gradient(to right, #ffffff 0%, #ffcccc 50%, #ff0000 100%)' };
    }
    
    return {
      bgClass,
      gradientStyle,
      description: description
    };
  };

  
  const toggleSeries = (seriesName: keyof typeof enabledSeries) => {
    setEnabledSeries(prev => ({
      ...prev,
      [seriesName]: !prev[seriesName]
    }));
  };

  
  useEffect(() => {
    if (realtimeMode && weatherData) {
      console.log('🌦️ Realtime weather updated:', weatherData);
      console.log('📊 New values - Rainfall:', weatherData.rainfall, 'mm/hr, Temperature:', weatherData.temperature, '°C');
      
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-300';
      notification.innerHTML = `🔄 Weather data updated<br>🌧️ Rain: ${weatherData.rainfall} mm/hr → ${getCalculationRainfall(weatherData.rainfall).toFixed(1)} mm/hr<br>🌡️ Temperature: ${weatherData.temperature}°C → ${getCalculationTemperature(weatherData.temperature).toFixed(1)}°C`;
      document.body.appendChild(notification);
      
      
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
      
      
      if (selectedPosition !== null) {
        const calculationRainfall = getCalculationRainfall(weatherData.rainfall);
        const calculationTemp = getCalculationTemperature(weatherData.temperature);
        const newData = calculateConcentration(selectedPosition, calculationRainfall, calculationTemp);
        setSelectedPositionData(newData);
      }
    }
  }, [weatherData, realtimeMode, selectedPosition]);

  
  useEffect(() => {
    if (!realtimeMode && selectedPosition !== null) {
      const calculationRainfall = getCalculationRainfall(rainfall ?? 0);
      const calculationTemp = getCalculationTemperature(temperature ?? 26);
      const newData = calculateConcentration(selectedPosition, calculationRainfall, calculationTemp);
      setSelectedPositionData(newData);
    }
  }, [rainfall, temperature, selectedPosition, realtimeMode, samplingStep]);

  
  useEffect(() => {
    console.log('📊 selectedParameter changed to:', selectedParameter);
  }, [selectedParameter]);

  
  const calculationValues = getCurrentCalculationValues();
  const heatmapKey = `${selectedParameter}-${calculationValues.rainfall}-${calculationValues.temperature}-${showHeatmap}-${heatmapMode}`;

  
  const calculateParameterRange = (parameter: 'BOD0' | 'BOD1' | 'NH40' | 'NH41' | 'NO3') => {
    const currentWeather = getCurrentCalculationValues();
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    
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

  
  const getHeatmapData = () => {
    if (!showHeatmap || !selectedParameter) return [];
    
    const currentWeather = getCurrentCalculationValues();
    const parameterRange = calculateParameterRange(selectedParameter);
    const heatmapPoints: Array<{ 
      lat: number; 
      lng: number; 
      intensity: number;
      value: number;
      parameter: string;
      color?: string;
    }> = [];
    
    
    for (let i = 0; i <= 80; i++) { 
      const progress = i / 80;
      const positionMeters = progress * RIVER_LENGTH;
      
      
      const startLat = 21.032323;
      const startLng = 105.919651;
      const endLat = 20.998456;
      const endLng = 105.952567;
      
      const lat = startLat + (endLat - startLat) * progress;
      const lng = startLng + (endLng - startLng) * progress;
      
      
      const waterQuality = calculateConcentration(positionMeters, currentWeather.rainfall, currentWeather.temperature);
      
      
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
      
      
      let colorScale, range, minValue, maxValue;
      
      if (heatmapMode === 'hard') {
        
        const scaleKey = selectedParameter === 'BOD0' ? 'BOD0' : selectedParameter === 'BOD1' ? 'BOD5' : selectedParameter;
        const hardScale = COLOR_SCALES[scaleKey] || COLOR_SCALES.BOD5;
        
        colorScale = {
          min: hardScale.min,
          max: hardScale.max,
          colors: hardScale.colors,
          colorStops: hardScale.colorStops
        };
        range = hardScale.max - hardScale.min;
        minValue = hardScale.min;
        maxValue = hardScale.max;
      } else {
        
        colorScale = {
          min: parameterRange.min,
          max: parameterRange.max,
          colors: selectedParameter === 'BOD0' || selectedParameter === 'BOD1' 
            ? ["white", "lightpink", "red"]
            : selectedParameter === 'NH40' || selectedParameter === 'NH41'
            ? ["white", "lightyellow", "gold"]
            : selectedParameter === 'NO3'
            ? ["white", "lightblue", "deepskyblue"]
            : ["white", "lightpink", "red"] 
        };
        range = parameterRange.max - parameterRange.min;
        minValue = parameterRange.min;
        maxValue = parameterRange.max;
      }
      
      const color = getColorFromValue(value, colorScale);
      
      
      const normalizedIntensity = range > 0 ? Math.max(0, Math.min(1, (value - minValue) / range)) : 0;
      
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

  
  const handleExportPDF = async () => {
    const currentWeather = getCurrentCalculationValues();
    const { generateExportData, exportToPDF } = await import('@/lib/export-utils');
    
    const exportData = generateExportData(currentWeather.rainfall, currentWeather.temperature);
    exportToPDF(exportData, currentWeather.rainfall, currentWeather.temperature);
  };

  const handleExportCSV = async () => {
    const currentWeather = getCurrentCalculationValues();
    const { generateExportData, downloadCSV } = await import('@/lib/export-utils');
    
    const exportData = generateExportData(currentWeather.rainfall, currentWeather.temperature);
    downloadCSV(exportData, currentWeather.rainfall, currentWeather.temperature);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="relative min-h-screen p-6">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            {showBackToHome && (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href="/">
                  <ArrowLeft className="size-4" aria-hidden />
                  Back
                </Link>
              </Button>
            )}
            <SidebarTrigger />
          </div>

          <div className="max-w-7xl mx-auto mt-16">
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800">
                River Water Quality Simulation
              </h1>
              <p className="mt-2 text-gray-600">
                Simulates concentrations of five constituents along an 8,013 m river reach
              </p>
            </header>

            {}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6">Control panel</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Weather inputs</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Rainfall (mm/hr)
                    </label>
                    <Input
                      type="number"
                      value={realtimeMode ? getCurrentWeatherValues().rainfall : (rainfall ?? '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setRainfall(null);
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            setRainfall(numValue);
                          }
                        }
                      }}
                      min="0"
                      step="0.1"
                      disabled={realtimeMode}
                      className={realtimeMode ? "bg-gray-100" : ""}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Temperature (°C)
                    </label>
                    <Input
                      type="number"
                      value={realtimeMode ? getCurrentWeatherValues().temperature : (temperature ?? '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setTemperature(null);
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            setTemperature(numValue);
                          }
                        }
                      }}
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
                    {realtimeMode ? '🔴 Turn off realtime' : '🟢 Turn on realtime'}
                  </Button>
                  {realtimeMode && (
                    <div className="text-xs text-gray-500 text-center space-y-1">
                      {weatherLoading ? (
                        <div className="text-blue-600 font-medium">🔄 Loading weather data...</div>
                      ) : weatherData ? (
                        <div>
                          <div className="text-green-600 font-medium">✅ Connected to OpenWeather API</div>
                          <div>📅 Updated: {new Date(weatherData.timestamp).toLocaleString('en-US')}</div>
                          <div className="text-blue-600">⏱️ Auto-refreshes every 5 minutes</div>
                        </div>
                      ) : (
                        <div className="text-amber-600">⏳ Waiting for weather data from API...</div>
                      )}
                    </div>
                  )}
                </div>

                {}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Select position (Z)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Enter position (0–8013 m)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={manualPosition}
                        onChange={(e) => setManualPosition(e.target.value)}
                        placeholder="Position (m)"
                        min="0"
                        max="8013"
                      />
                      <Button onClick={handleManualPositionSubmit} type="button">Go</Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Preset positions
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

                {}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Heatmap</h3>
                  
                  {}
                  <div className="mb-4">
                    <Button
                      onClick={() => setHeatmapMode(heatmapMode === 'hard' ? 'dynamic' : 'hard')}
                      variant={heatmapMode === 'dynamic' ? "default" : "outline"}
                      className="w-full"
                      type="button"
                    >
                      {heatmapMode === 'dynamic' ? '🎯 Mode: dynamic scale' : '📊 Mode: fixed scale'}
                    </Button>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {heatmapMode === 'dynamic' 
                        ? 'Based on actual min/max for each parameter' 
                        : 'Based on a fixed standard scale'
                      }
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHeatmapSelect('BOD0')}
                      className={`w-full h-auto py-3 border-2 transition-all ${getParameterColorInfo('BOD0').bgClass}`}
                      type="button"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">BOD5 sample 0</span>
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
                        <span className="font-medium">BOD5 sample 1</span>
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
                        <span className="font-medium">NH4+ sample 0</span>
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
                        <span className="font-medium">NH4+ sample 1</span>
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
                        <span className="font-medium">NO3- sample 1</span>
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
                    Turn off heatmap
                  </Button>
                </div>

                {}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Chart</h3>
                  <Button
                    onClick={() => setShowChart(!showChart)}
                    variant={showChart ? "default" : "outline"}
                    className="w-full"
                    type="button"
                  >
                    {showChart ? '📈 Hide chart' : '📊 Show chart'}
                  </Button>
                  
                  {}
                  {showChart && (
                    <div className="bg-gray-50 p-3 rounded border text-xs">
                      <div className="font-medium text-gray-700 mb-2">🎨 Line colors:</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#228B22'}}></div>
                          <span>BOD5 sample 0</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#FF8C00'}}></div>
                          <span>BOD5 sample 1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#663399'}}></div>
                          <span>NH4+ sample 0</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#1E90FF'}}></div>
                          <span>NH4+ sample 1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#90EE90'}}></div>
                          <span>NO3- sample 1</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Sampling points between gates
                    </label>
                    <select
                      value={samplingStep}
                      onChange={(e) => setSamplingStep(parseInt(e.target.value))}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value={1}>1 point/segment (11 total)</option>
                      <option value={2}>2 points/segment (16 total)</option>
                      <option value={5}>5 points/segment (31 total)</option>
                      <option value={10}>10 points/segment (56 total)</option>
                    </select>
                    <div className="text-xs text-gray-500 mt-1">
                      💡 Points plotted between each adjacent pair of gates
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

                {}
                {realtimeMode && weatherData && (
                  <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-700">Weather details</h3>
                    <div className="space-y-2 text-sm">
                      {/* Top row: highlight rainfall & temperature */}
                      <div className="flex flex-col gap-2 mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-blue-800">🌧️ Rainfall</span>
                          <span className="px-2 py-1 rounded-full bg-blue-600 text-white text-sm font-bold shadow-sm">
                            {weatherData.rainfall.toFixed(2)} mm/hr
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-orange-800">🌡️ Temperature</span>
                          <span className="px-2 py-1 rounded-full bg-orange-500 text-white text-sm font-bold shadow-sm">
                            {weatherData.temperature.toFixed(2)}°C
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <span>📍 Location:</span>
                        <span className="font-medium">{weatherData.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌅 Sunrise:</span>
                        <span className="font-medium">{new Date(weatherData.sunrise).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌇 Sunset:</span>
                        <span className="font-medium">{new Date(weatherData.sunset).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌡️ Feels like:</span>
                        <span className="font-medium">{weatherData.feelsLike.toFixed(1)}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>💧 Humidity:</span>
                        <span className="font-medium">{weatherData.humidity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⚡ Pressure:</span>
                        <span className="font-medium">{weatherData.pressure} hPa {getPressureStatus(weatherData.pressure)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌬️ Wind:</span>
                        <span className="font-medium">{weatherData.windSpeed.toFixed(1)} m/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🧭 Direction:</span>
                        <span className="font-medium">{getWindDirection(weatherData.windDirection)} ({weatherData.windDirection}°)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>👁️ Visibility:</span>
                        <span className="font-medium">{(weatherData.visibility / 1000).toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>☁️ Cloud cover:</span>
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
                          Updated: {new Date(weatherData.timestamp).toLocaleString()}
                        </div>
                        <div className="mt-3 pt-2 border-t border-blue-200">
                          {(() => {
                            const quality = getAirQualityAssessment(weatherData);
                            return (
                              <div className={`flex items-center gap-2 ${quality.color} font-medium`}>
                                <span>{quality.emoji}</span>
                                <span>Air quality: {quality.level}</span>
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

            {}
            {selectedPosition !== null && selectedPositionData && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  Concentration at {selectedPosition.toFixed(0)} m
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="bg-green-50 p-3 rounded border" style={{borderColor: '#228B22'}}>
                    <div className="flex items-center gap-2 font-medium text-green-800">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#228B22'}}></div>
                      BOD5 sample 0
                    </div>
                    <div className="text-green-700 font-semibold">{selectedPositionData.BOD5_sample0.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded border" style={{borderColor: '#FF8C00'}}>
                    <div className="flex items-center gap-2 font-medium text-orange-800">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#FF8C00'}}></div>
                      BOD5 sample 1
                    </div>
                    <div className="text-orange-700 font-semibold">{selectedPositionData.BOD5_sample1.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border" style={{borderColor: '#663399'}}>
                    <div className="flex items-center gap-2 font-medium text-purple-800">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#663399'}}></div>
                      NH4+ sample 0
                    </div>
                    <div className="text-purple-700 font-semibold">{selectedPositionData.NH4_sample0.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border" style={{borderColor: '#1E90FF'}}>
                    <div className="flex items-center gap-2 font-medium text-blue-800">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#1E90FF'}}></div>
                      NH4+ sample 1
                    </div>
                    <div className="text-blue-700 font-semibold">{selectedPositionData.NH4_sample1.toFixed(3)} mg/L</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded border" style={{borderColor: '#90EE90'}}>
                    <div className="flex items-center gap-2 font-medium text-green-700">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#90EE90'}}></div>
                      NO3- sample 1
                    </div>
                    <div className="text-green-600 font-semibold">{selectedPositionData.NO3_sample1.toFixed(3)} mg/L</div>
                  </div>
                </div>
              </div>
            )}

            {}
            {showChart && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Concentration chart</h2>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(enabledSeries).map(([seriesName, enabled]) => {
                      
                      const seriesConfig = {
                        'BOD5_sample0': { color: '#228B22', name: 'BOD5 sample 0', bgColor: 'bg-green-100' },
                        'BOD5_sample1': { color: '#FF8C00', name: 'BOD5 sample 1', bgColor: 'bg-orange-100' },
                        'NH4_sample0': { color: '#663399', name: 'NH4+ sample 0', bgColor: 'bg-purple-100' },
                        'NH4_sample1': { color: '#1E90FF', name: 'NH4+ sample 1', bgColor: 'bg-blue-100' },
                        'NO3_sample1': { color: '#90EE90', name: 'NO3- sample 1', bgColor: 'bg-green-50' }
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
                  key={`line-chart-${calculationValues.rainfall}-${calculationValues.temperature}-${samplingStep}-${JSON.stringify(enabledSeries)}`}
                  width={1200}
                  height={500}
                  rainfall={calculationValues.rainfall}
                  temperature={calculationValues.temperature}
                  enabledSeries={enabledSeries}
                  samplingStep={samplingStep}
                />
              </div>
            )}

            {}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              {}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200" style={{background: 'linear-gradient(to right, rgb(239 246 255), rgb(240 253 244)'}}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 text-sm">
                  {}
                  <div className="flex items-center gap-2">
                    <span>🌧️</span>
                    <span><strong>Weather rainfall:</strong> {getCurrentWeatherValues().rainfall.toFixed(1)} mm/hr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💧</span>
                    <span><strong>Calculated rainfall:</strong> {calculationValues.rainfall.toFixed(1)} mm/hr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🌡️</span>
                    <span><strong>Air temperature:</strong> {getCurrentWeatherValues().temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🧮</span>
                    <span><strong>Calculated temperature:</strong> {calculationValues.temperature.toFixed(1)}°C</span>
                  </div>
                  {realtimeMode && weatherData && (
                    <>
                      <div className="flex items-center gap-2">
                        <span>🌡️</span>
                        <span><strong>Feels like:</strong> {weatherData.feelsLike.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💧</span>
                        <span><strong>Humidity:</strong> {weatherData.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🌬️</span>
                        <span><strong>Wind:</strong> {weatherData.windSpeed.toFixed(1)} m/s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🧭</span>
                        <span><strong>Wind direction:</strong> {getWindDirection(weatherData.windDirection)} ({weatherData.windDirection}°)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🌫️</span>
                        <span><strong>Visibility:</strong> {(weatherData.visibility / 1000).toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>☁️</span>
                        <span><strong>Cloud cover:</strong> {weatherData.cloudiness}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⚡</span>
                        <span><strong>Pressure:</strong> {weatherData.pressure} hPa {getPressureStatus(weatherData.pressure)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Image 
                          src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`}
                          alt={weatherData.description}
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                        <span><strong>Description:</strong> {weatherData.description}</span>
                      </div>
                    </>
                  )}
                </div>
                
                {}
                <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
                  {realtimeMode && weatherData && (
                    <span className="text-green-600 font-medium">
                      🔄 Realtime — {weatherData.location} — updated {new Date(weatherData.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                  {realtimeMode && weatherLoading && (
                    <span className="text-blue-600 font-medium animate-pulse">🔄 Loading weather data...</span>
                  )}
                  {weatherError && (
                    <span className="text-red-600 font-medium">⚠️ Error: {weatherError}</span>
                  )}
                  {!realtimeMode && (
                    <span className="text-amber-600 font-medium">✏️ Manual mode — values entered by hand</span>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <RiverMap
                  key={heatmapKey}
                  width={1200}
                  height={600}
                  rainfall={calculationValues.rainfall}
                  temperature={calculationValues.temperature}
                  selectedParameter={selectedParameter}
                  heatmapMode={heatmapMode}
                  onPositionSelect={handlePositionSelect}
                />
              </div>
            </div>

            {}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Cau Bay River map</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    River origin at 21.032323, 105.919651
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
                  {showHeatmap ? '🎨 Turn off heatmap' : '📊 Turn on heatmap'}
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
                    colorName: 'red'
                  };
                } else if (selectedParameter === 'NH40' || selectedParameter === 'NH41') {
                  colorInfo = {
                    icon: '🟡',
                    color: 'text-yellow-700',
                    gradient: 'linear-gradient(to right, #ffffff, #ffffcc, #ffff00)',
                    midColor: 'bg-yellow-300',
                    maxColor: 'bg-yellow-500',
                    colorName: 'yellow'
                  };
                } else if (selectedParameter === 'NO3') {
                  colorInfo = {
                    icon: '🔵',
                    color: 'text-blue-700',
                    gradient: 'linear-gradient(to right, #ffffff, #ccddff, #0066ff)',
                    midColor: 'bg-blue-300',
                    maxColor: 'bg-blue-600',
                    colorName: 'blue'
                  };
                } else {
                  colorInfo = {
                    icon: '🔴',
                    color: 'text-red-700',
                    gradient: 'linear-gradient(to right, #ffffff, #ffcccc, #ff0000)',
                    midColor: 'bg-red-300',
                    maxColor: 'bg-red-600',
                    colorName: 'red'
                  };
                }
                
                return (
                  <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                    <div className="font-semibold mb-2">📊 Heatmap shows simulated {selectedParameter} concentration (dynamic color scale):</div>
                    
                    <div className="space-y-1 mb-2">
                      <div className={`font-medium ${colorInfo.color}`}>{colorInfo.icon} {selectedParameter} — dynamic color scale:</div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-16 h-4 rounded border" style={{background: colorInfo.gradient}}></span>
                        <span>{range.min.toFixed(3)} mg/L → {range.max.toFixed(3)} mg/L</span>
                      </div>
                      <div className="text-xs mt-1 text-gray-600 space-y-1">
                        <div>• <span className="inline-block w-3 h-3 mr-2 bg-white border"></span>Lowest value: <strong>{range.min.toFixed(3)} mg/L</strong> (white)</div>
                        <div>• <span className={`inline-block w-3 h-3 mr-2 ${colorInfo.midColor} border`}></span>Mid-range value: <strong>{((range.min + range.max) / 2).toFixed(3)} mg/L</strong> (light {colorInfo.colorName})</div>
                        <div>• <span className={`inline-block w-3 h-3 mr-2 ${colorInfo.maxColor} border`}></span>Highest value: <strong>{range.max.toFixed(3)} mg/L</strong> ({colorInfo.colorName})</div>
                      </div>
                      <div className="text-xs mt-2 text-gray-600 bg-white p-2 rounded border">
                        {selectedParameter === 'BOD0' && '* BOD5 sample 0: measured value from the first sample'}
                        {selectedParameter === 'BOD1' && '* BOD5 sample 1: measured value from the second sample'}
                        {selectedParameter === 'NH40' && '* NH4+ sample 0: measured value from the first sample'}
                        {selectedParameter === 'NH41' && '* NH4+ sample 1: measured value from the second sample'}
                        {selectedParameter === 'NO3' && '* NO3- sample 1: measured value from the second sample'}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-gray-600 text-xs border-t pt-2">
                      <strong>Current conditions:</strong>{' '}
                      <strong>Calculated rainfall:</strong> {calculationValues.rainfall.toFixed(1)} mm/hr (from {getCurrentWeatherValues().rainfall.toFixed(1)} mm/hr weather) |{' '}
                      <strong>Calculated temperature:</strong> {calculationValues.temperature.toFixed(1)}°C (from {getCurrentWeatherValues().temperature.toFixed(1)}°C air) |{' '}
                      <strong>Parameter:</strong> {selectedParameter}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      💡 <em>The color scale auto-adjusts to each parameter’s actual min–max range</em>
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
                title="Cau Bay River"
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
}