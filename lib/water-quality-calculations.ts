// Utility functions for river water quality calculations

export interface WaterQualityData {
  BOD5_sample0: number;
  BOD5_sample1: number;
  NH4_sample0: number;
  NH4_sample1: number;
  NO3_sample1: number;
}

export interface RiverPosition {
  name: string;
  position: number; // meters
}

// Định nghĩa các mốc vị trí
export const RIVER_POSITIONS: RiverPosition[] = [
  { name: "Sài Đồng", position: 0 },
  { name: "Đài Tư", position: 1112 },
  { name: "An Lạc", position: 3170 },
  { name: "Trâu Quỳ", position: 4590 },
  { name: "Đa Tốn", position: 7070 },
  { name: "Xuân Thụy", position: 8013 }
];

export const RIVER_LENGTH = 8013; // meters

// Tính hệ số T dựa trên nhiệt độ Y
export const calculateT = (temperature: number): number => {
  return 2.5 * Math.pow(10, (temperature - 26) / 10);
};

// Hàm tính toán nồng độ chính
export const calculateConcentration = (
  Z: number, // Vị trí dọc sông (0-8013m)
  X: number, // Lượng mưa (mm/hr)
  Y: number  // Nhiệt độ (°C)
): WaterQualityData => {
  const T = calculateT(Y);
  
  // Vị trí Z = 0 (Sài Đồng)
  if (Z === 0) {
    return {
      BOD5_sample0: (1250 + 13550 * X) / (47625 + 9 * 13550 * X),
      BOD5_sample1: (1250 + 13550 * X) / (47625 + 9 * 13550 * X),
      NH4_sample0: (1250 + 13550 * X) / (19125 + 0.56 * 13550 * X),
      NH4_sample1: (1250 + 13550 * X) / (19125 + 0.56 * 13550 * X),
      NO3_sample1: (1250 + 13550 * X) / (313 + 0.14 * 13550 * X)
    };
  }
  
  // Đoạn 0 < Z < 1112
  if (Z > 0 && Z < 1112) {
    const Q1 = 1250 + 13550 * X;
    const time2 = (480 * Z) / Q1;
    
    // Giá trị ban đầu từ Z=0
    const initial = calculateConcentration(0, X, Y);
    
    // Công thức suy giảm nồng độ với T và time2
    const decay_factor = Math.exp(-0.23 * T * time2 / 86400); // chuyển đổi thời gian sang ngày
    
    return {
      BOD5_sample0: initial.BOD5_sample0 * decay_factor,
      BOD5_sample1: initial.BOD5_sample1 * decay_factor,
      NH4_sample0: initial.NH4_sample0 * decay_factor,
      NH4_sample1: initial.NH4_sample1 * decay_factor,
      NO3_sample1: initial.NO3_sample1 * decay_factor
    };
  }
  
  // Vị trí Z = 1112 (Đài Tư)
  if (Z === 1112) {
    const Q1 = 1250 + 13550 * X;
    const Q2 = 1480 + 3500 * X;
    const time20 = 533760 / Q1;
    
    // Lấy kết quả từ đoạn trước (Z < 1112)
    const upstream = calculateConcentration(1111, X, Y);
    
    // Công thức pha trộn tại cống xả
    // Giả định nồng độ xả mới (có thể điều chỉnh theo data thực tế)
    const discharge_BOD5_0 = 25; // mg/L
    const discharge_BOD5_1 = 25; // mg/L
    const discharge_NH4_0 = 15; // mg/L
    const discharge_NH4_1 = 15; // mg/L
    const discharge_NO3_1 = 10; // mg/L
    
    return {
      BOD5_sample0: (Q1 * upstream.BOD5_sample0 + (Q2 - Q1) * discharge_BOD5_0) / Q2,
      BOD5_sample1: (Q1 * upstream.BOD5_sample1 + (Q2 - Q1) * discharge_BOD5_1) / Q2,
      NH4_sample0: (Q1 * upstream.NH4_sample0 + (Q2 - Q1) * discharge_NH4_0) / Q2,
      NH4_sample1: (Q1 * upstream.NH4_sample1 + (Q2 - Q1) * discharge_NH4_1) / Q2,
      NO3_sample1: (Q1 * upstream.NO3_sample1 + (Q2 - Q1) * discharge_NO3_1) / Q2
    };
  }
  
  // Đoạn 1112 < Z < 3170
  if (Z > 1112 && Z < 3170) {
    const Q2 = 1480 + 3500 * X;
    const time3 = (480 * (Z - 1112)) / Q2;
    
    // Lấy kết quả từ vị trí Đài Tư
    const position2 = calculateConcentration(1112, X, Y);
    
    // Suy giảm nồng độ
    const decay_factor = Math.exp(-0.23 * T * time3 / 86400);
    
    return {
      BOD5_sample0: position2.BOD5_sample0 * decay_factor,
      BOD5_sample1: position2.BOD5_sample1 * decay_factor,
      NH4_sample0: position2.NH4_sample0 * decay_factor,
      NH4_sample1: position2.NH4_sample1 * decay_factor,
      NO3_sample1: position2.NO3_sample1 * decay_factor
    };
  }
  
  // Vị trí Z = 3170 (An Lạc)
  if (Z === 3170) {
    const Q2 = 1480 + 3500 * X;
    const Q3 = 1710 + 2000 * X;
    
    const upstream = calculateConcentration(3169, X, Y);
    
    // Pha trộn với nước xả mới
    const discharge_BOD5_0 = 20;
    const discharge_BOD5_1 = 20;
    const discharge_NH4_0 = 12;
    const discharge_NH4_1 = 12;
    const discharge_NO3_1 = 8;
    
    return {
      BOD5_sample0: (Q2 * upstream.BOD5_sample0 + (Q3 - Q2) * discharge_BOD5_0) / Q3,
      BOD5_sample1: (Q2 * upstream.BOD5_sample1 + (Q3 - Q2) * discharge_BOD5_1) / Q3,
      NH4_sample0: (Q2 * upstream.NH4_sample0 + (Q3 - Q2) * discharge_NH4_0) / Q3,
      NH4_sample1: (Q2 * upstream.NH4_sample1 + (Q3 - Q2) * discharge_NH4_1) / Q3,
      NO3_sample1: (Q2 * upstream.NO3_sample1 + (Q3 - Q2) * discharge_NO3_1) / Q3
    };
  }
  
  // Đoạn 3170 < Z < 4590
  if (Z > 3170 && Z < 4590) {
    const Q3 = 1710 + 2000 * X;
    const time4 = (480 * (Z - 3170)) / Q3;
    
    const position3 = calculateConcentration(3170, X, Y);
    const decay_factor = Math.exp(-0.23 * T * time4 / 86400);
    
    return {
      BOD5_sample0: position3.BOD5_sample0 * decay_factor,
      BOD5_sample1: position3.BOD5_sample1 * decay_factor,
      NH4_sample0: position3.NH4_sample0 * decay_factor,
      NH4_sample1: position3.NH4_sample1 * decay_factor,
      NO3_sample1: position3.NO3_sample1 * decay_factor
    };
  }
  
  // Vị trí Z = 4590 (Trâu Quỳ)
  if (Z === 4590) {
    const Q3 = 1710 + 2000 * X;
    const Q4 = 1940 + 1500 * X;
    
    const upstream = calculateConcentration(4589, X, Y);
    
    const discharge_BOD5_0 = 18;
    const discharge_BOD5_1 = 18;
    const discharge_NH4_0 = 10;
    const discharge_NH4_1 = 10;
    const discharge_NO3_1 = 7;
    
    return {
      BOD5_sample0: (Q3 * upstream.BOD5_sample0 + (Q4 - Q3) * discharge_BOD5_0) / Q4,
      BOD5_sample1: (Q3 * upstream.BOD5_sample1 + (Q4 - Q3) * discharge_BOD5_1) / Q4,
      NH4_sample0: (Q3 * upstream.NH4_sample0 + (Q4 - Q3) * discharge_NH4_0) / Q4,
      NH4_sample1: (Q3 * upstream.NH4_sample1 + (Q4 - Q3) * discharge_NH4_1) / Q4,
      NO3_sample1: (Q3 * upstream.NO3_sample1 + (Q4 - Q3) * discharge_NO3_1) / Q4
    };
  }
  
  // Đoạn 4590 < Z < 7070
  if (Z > 4590 && Z < 7070) {
    const Q4 = 1940 + 1500 * X;
    const time5 = (480 * (Z - 4590)) / Q4;
    
    const position4 = calculateConcentration(4590, X, Y);
    const decay_factor = Math.exp(-0.23 * T * time5 / 86400);
    
    return {
      BOD5_sample0: position4.BOD5_sample0 * decay_factor,
      BOD5_sample1: position4.BOD5_sample1 * decay_factor,
      NH4_sample0: position4.NH4_sample0 * decay_factor,
      NH4_sample1: position4.NH4_sample1 * decay_factor,
      NO3_sample1: position4.NO3_sample1 * decay_factor
    };
  }
  
  // Vị trí Z = 7070 (Đa Tốn)
  if (Z === 7070) {
    const Q4 = 1940 + 1500 * X;
    const Q5 = 2170 + 1000 * X;
    
    const upstream = calculateConcentration(7069, X, Y);
    
    const discharge_BOD5_0 = 15;
    const discharge_BOD5_1 = 15;
    const discharge_NH4_0 = 8;
    const discharge_NH4_1 = 8;
    const discharge_NO3_1 = 6;
    
    return {
      BOD5_sample0: (Q4 * upstream.BOD5_sample0 + (Q5 - Q4) * discharge_BOD5_0) / Q5,
      BOD5_sample1: (Q4 * upstream.BOD5_sample1 + (Q5 - Q4) * discharge_BOD5_1) / Q5,
      NH4_sample0: (Q4 * upstream.NH4_sample0 + (Q5 - Q4) * discharge_NH4_0) / Q5,
      NH4_sample1: (Q4 * upstream.NH4_sample1 + (Q5 - Q4) * discharge_NH4_1) / Q5,
      NO3_sample1: (Q4 * upstream.NO3_sample1 + (Q5 - Q4) * discharge_NO3_1) / Q5
    };
  }
  
  // Đoạn 7070 < Z <= 8013 (Xuân Thụy)
  if (Z > 7070 && Z <= 8013) {
    const Q5 = 2170 + 1000 * X;
    const time6 = (480 * (Z - 7070)) / Q5;
    
    const position5 = calculateConcentration(7070, X, Y);
    const decay_factor = Math.exp(-0.23 * T * time6 / 86400);
    
    return {
      BOD5_sample0: position5.BOD5_sample0 * decay_factor,
      BOD5_sample1: position5.BOD5_sample1 * decay_factor,
      NH4_sample0: position5.NH4_sample0 * decay_factor,
      NH4_sample1: position5.NH4_sample1 * decay_factor,
      NO3_sample1: position5.NO3_sample1 * decay_factor
    };
  }
  
  // Giá trị mặc định nếu Z nằm ngoài phạm vi
  return {
    BOD5_sample0: 0,
    BOD5_sample1: 0,
    NH4_sample0: 0,
    NH4_sample1: 0,
    NO3_sample1: 0
  };
};

// Chuyển đổi vị trí pixel sang mét trên sông
export const pixelToMeter = (x: number, canvasWidth: number): number => {
  return (x / canvasWidth) * RIVER_LENGTH;
};

// Chuyển đổi mét sang pixel
export const meterToPixel = (meter: number, canvasWidth: number): number => {
  return (meter / RIVER_LENGTH) * canvasWidth;
};

// Thang màu cho heatmap
export interface ColorScale {
  min: number;
  max: number;
  colors: string[];
}

export const COLOR_SCALES: { [key: string]: ColorScale } = {
  BOD5: {
    min: 0,
    max: 50,
    colors: ['white', 'lightpink', 'red']
  },
  NH4: {
    min: 0,
    max: 25,
    colors: ['white', 'lightyellow', 'gold']
  },
  NO3: {
    min: 0,
    max: 30,
    colors: ['white', 'lightblue', 'deepskyblue']
  }
};

// Hàm tạo màu từ giá trị nồng độ
export const getColorFromValue = (value: number, scale: ColorScale): string => {
  const normalizedValue = Math.min(Math.max(value, scale.min), scale.max) / scale.max;
  
  if (normalizedValue <= 0.5) {
    // Interpolate between first and second color
    const t = normalizedValue * 2;
    return interpolateColor(scale.colors[0], scale.colors[1], t);
  } else {
    // Interpolate between second and third color
    const t = (normalizedValue - 0.5) * 2;
    return interpolateColor(scale.colors[1], scale.colors[2], t);
  }
};

// Hàm nội suy màu
const interpolateColor = (color1: string, color2: string, t: number): string => {
  // Đơn giản hóa - sử dụng RGB interpolation
  const getColorValues = (color: string) => {
    if (color === 'white') return [255, 255, 255];
    if (color === 'lightpink') return [255, 182, 193];
    if (color === 'red') return [255, 0, 0];
    if (color === 'lightyellow') return [255, 255, 224];
    if (color === 'gold') return [255, 215, 0];
    if (color === 'lightblue') return [173, 216, 230];
    if (color === 'deepskyblue') return [0, 191, 255];
    return [0, 0, 0]; // fallback
  };
  
  const c1 = getColorValues(color1);
  const c2 = getColorValues(color2);
  
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  
  return `rgb(${r}, ${g}, ${b})`;
};