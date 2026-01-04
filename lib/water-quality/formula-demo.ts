// Demo và test các công thức quy đổi mới
import { convertAirTemperatureToCalculation, convertRainfallToRiverRainfall } from './water-quality/coefficients';

/**
 * Hàm demo để hiển thị cách thức quy đổi nhiệt độ và lượng mưa
 */
export const demonstrateNewFormulas = () => {
  console.log('=== DEMO CÔNG THỨC QUY ĐỔI MỚI ===\n');
  
  console.log('1. Công thức quy đổi nhiệt độ: T = 0.7 * Tair');
  const airTemperatures = [20, 25, 30, 35];
  airTemperatures.forEach(temp => {
    const converted = convertAirTemperatureToCalculation(temp);
    console.log(`   Tair = ${temp}°C → T = ${converted}°C`);
  });
  
  console.log('\n2. Công thức quy đổi lượng mưa:');
  console.log('   - Nếu Rmưa ≤ 3mm/giờ: Rmưa,sông = 0');
  console.log('   - Nếu Rmưa > 3mm/giờ: Rmưa,sông = 50% * (Rmưa - 3)');
  
  const rainfallValues = [0, 1, 3, 5, 10, 20, 50];
  rainfallValues.forEach(rain => {
    const converted = convertRainfallToRiverRainfall(rain);
    console.log(`   Rmưa = ${rain}mm/h → Rmưa,sông = ${converted}mm/h`);
  });
  
  console.log('\n=== KẾT THÚC DEMO ===');
};

/**
 * So sánh kết quả tính toán trước và sau khi áp dụng công thức mới
 */
export const compareCalculationResults = (airTemp: number, rawRainfall: number) => {
  // Dữ liệu gốc (theo cách cũ)
  const oldTemperature = airTemp; // Sử dụng trực tiếp nhiệt độ không khí
  const oldRainfall = rawRainfall; // Sử dụng trực tiếp lượng mưa
  
  // Dữ liệu mới (theo công thức quy đổi)
  const newTemperature = convertAirTemperatureToCalculation(airTemp);
  const newRainfall = convertRainfallToRiverRainfall(rawRainfall);
  
  return {
    input: {
      airTemperature: airTemp,
      rawRainfall: rawRainfall
    },
    oldMethod: {
      temperature: oldTemperature,
      rainfall: oldRainfall
    },
    newMethod: {
      temperature: newTemperature,
      rainfall: newRainfall
    },
    changes: {
      temperatureChange: newTemperature - oldTemperature,
      rainfallChange: newRainfall - oldRainfall,
      temperatureChangePercent: ((newTemperature - oldTemperature) / oldTemperature * 100).toFixed(1),
      rainfallChangePercent: oldRainfall !== 0 ? ((newRainfall - oldRainfall) / oldRainfall * 100).toFixed(1) : 'N/A'
    }
  };
};