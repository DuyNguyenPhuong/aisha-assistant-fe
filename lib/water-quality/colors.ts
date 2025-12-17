export interface ColorScale {
  min: number;
  max: number;
  colors: string[];
}

export const COLOR_SCALES: { [key: string]: ColorScale } = {
  BOD5: {
    min: 0,
    max: 50,
    colors: ["white", "lightpink", "red"],
  },
  BOD0: {
    min: 0,
    max: 50,
    colors: ["white", "lightpink", "red"],
  },
  NH4: {
    min: 0,
    max: 25,
    colors: ["white", "lightyellow", "gold"],
  },
  NH40: {
    min: 0,
    max: 25,
    colors: ["white", "lightyellow", "gold"],
  },
  NH41: {
    min: 0,
    max: 25,
    colors: ["white", "lightyellow", "gold"],
  },
  NO3: {
    min: 0,
    max: 30,
    colors: ["white", "lightblue", "deepskyblue"],
  },
};

const interpolateColor = (
  color1: string,
  color2: string,
  t: number,
): string => {
  const getColorValues = (color: string) => {
    if (color === "white") return [255, 255, 255];
    if (color === "lightpink") return [255, 182, 193];
    if (color === "red") return [255, 0, 0];
    if (color === "lightyellow") return [255, 255, 224];
    if (color === "gold") return [255, 215, 0];
    if (color === "lightblue") return [173, 216, 230];
    if (color === "deepskyblue") return [0, 191, 255];
    return [0, 0, 0];
  };
  const c1 = getColorValues(color1);
  const c2 = getColorValues(color2);
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
};

export const getColorFromValue = (value: number, scale: ColorScale): string => {
  // Handle NaN and invalid values
  if (!isFinite(value) || isNaN(value)) {
    return "rgb(255, 255, 255)"; // Return white for invalid values
  }
  
  // Handle invalid scale
  if (!scale || !scale.colors || scale.colors.length < 3 || !isFinite(scale.min) || !isFinite(scale.max)) {
    return "rgb(255, 255, 255)"; // Return white for invalid scale
  }
  
  // Clamp value within the scale range
  const clampedValue = Math.min(Math.max(value, scale.min), scale.max);
  
  // Normalize to 0-1 based on the actual range
  const range = scale.max - scale.min;
  const normalizedValue = range > 0 ? (clampedValue - scale.min) / range : 0;
  
  if (normalizedValue <= 0.5) {
    const t = normalizedValue * 2;
    return interpolateColor(scale.colors[0], scale.colors[1], t);
  } else {
    const t = (normalizedValue - 0.5) * 2;
    return interpolateColor(scale.colors[1], scale.colors[2], t);
  }
};