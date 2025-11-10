"use client"

import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import RiverMap from '@/components/river-map';
import LineChart from '@/components/water-quality-chart';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { RIVER_POSITIONS, WaterQualityData } from '@/lib/water-quality-calculations';

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

  // Handle manual position input
  const handleManualPositionSubmit = () => {
    const pos = parseFloat(manualPosition);
    if (!isNaN(pos) && pos >= 0 && pos <= 8013) {
      setSelectedPosition(pos);
      setManualPosition('');
    }
  };

  // Handle preset position selection
  const handlePresetPosition = (position: number) => {
    setSelectedPosition(position);
  };

  // Toggle series
  const toggleSeries = (seriesName: keyof typeof enabledSeries) => {
    setEnabledSeries(prev => ({
      ...prev,
      [seriesName]: !prev[seriesName]
    }));
  };

  // Realtime weather simulation (mocked)
  useEffect(() => {
    if (!realtimeMode) return;

    const interval = setInterval(() => {
      // Simulate weather changes
      setRainfall(prev => Math.max(0, prev + (Math.random() - 0.5) * 2));
      setTemperature(prev => Math.max(15, Math.min(35, prev + (Math.random() - 0.5) * 2)));
    }, 300000); // 5 minutes = 300000ms

    return () => clearInterval(interval);
  }, [realtimeMode]);

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
              <h2 className="text-xl font-semibold mb-4">Bảng điều khiển</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Weather Controls */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Thông số thời tiết</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Lượng mưa (mm/hr)
                    </label>
                    <Input
                      type="number"
                      value={rainfall}
                      onChange={(e) => setRainfall(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.1"
                      disabled={realtimeMode}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nhiệt độ (°C)
                    </label>
                    <Input
                      type="number"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value) || 25)}
                      min="0"
                      max="50"
                      disabled={realtimeMode}
                    />
                  </div>
                  <Button
                    onClick={() => setRealtimeMode(!realtimeMode)}
                    variant={realtimeMode ? "destructive" : "default"}
                    className="w-full"
                  >
                    {realtimeMode ? 'Tắt Realtime' : 'Bật Realtime'}
                  </Button>
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
                      <Button onClick={handleManualPositionSubmit}>Đi</Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Vị trí preset
                    </label>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {RIVER_POSITIONS.map((pos, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetPosition(pos.position)}
                          className="text-xs px-2 py-1"
                        >
                          {pos.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Heatmap Controls */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Heatmap</h3>
                  <div className="space-y-2">
                    {['BOD5', 'NH4', 'NO3'].map(param => (
                      <Button
                        key={param}
                        variant={selectedParameter === param ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedParameter(
                          selectedParameter === param ? null : param as 'BOD5' | 'NH4' | 'NO3'
                        )}
                        className="w-full"
                      >
                        {param}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedParameter(null)}
                    className="w-full"
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
                  >
                    {showChart ? 'Ẩn biểu đồ' : 'Hiện biểu đồ'}
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
              </div>
            </div>

            {/* River Map */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <RiverMap
                width={1000}
                height={500}
                rainfall={rainfall}
                temperature={temperature}
                selectedParameter={selectedParameter}
                onPositionSelect={handlePositionSelect}
              />
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
                  width={1000}
                  height={400}
                  rainfall={rainfall}
                  temperature={temperature}
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