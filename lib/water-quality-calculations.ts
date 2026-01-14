import type { WaterQualityData, RiverPosition } from './water-quality/types';
import { RIVER_LENGTH } from './water-quality/constants';
import { ColorScale, COLOR_SCALES, getColorFromValue } from './water-quality/colors';
import { pixelToMeter, meterToPixel } from './water-quality/spatial';
import { 
  calculateCase1, calculateCase2, calculateCase3, calculateCase4, calculateCase5,
  calculateCase6, calculateCase7, calculateCase8, calculateCase9, calculateCase10,
  calculateCase11, calculateCase12, calculateCase13, calculateCase14, calculateCase15,
  calculateCase16, calculateCase17, calculateCase18, calculateDefaultCase 
} from './water-quality/calculation-cases';

export const calculateConcentration = (
  Z: number,
  X: number,
  Y: number,
): WaterQualityData => {
  Z = Math.max(0, Math.min(RIVER_LENGTH, Z));

  if (Z === 0) {
    return calculateCase1(X);
  }

  if (Z > 0 && Z < 1110) {
    return calculateCase2(Z, X, Y);
  }

  if (Z === 1110) {
    return calculateCase3(X, Y);
  }

  if (Z === 1112) {
    return calculateCase4(X);
  }

  if (Z === 1114) {
    return calculateCase5(X, Y);
  }

  if (Z > 1114 && Z < 3168) {
    return calculateCase6(Z, X, Y);
  }

  if (Z === 3168) {
    return calculateCase7(X, Y);
  }

  if (Z === 3170) {
    return calculateCase8(X);
  }

  if (Z === 3172) {
    return calculateCase9(X, Y);
  }

  if (Z > 3172 && Z < 4588) {
    return calculateCase10(Z, X, Y);
  }

  if (Z === 4588) {
    return calculateCase11(X, Y);
  }

  if (Z === 4590) {
    return calculateCase12(X);
  }

  if (Z === 4592) {
    return calculateCase13(X, Y);
  }

  if (Z > 4592 && Z < 7068) {
    return calculateCase14(Z, X, Y);
  }

  if (Z === 7068) {
    return calculateCase15(X, Y);
  }

  if (Z === 7070) {
    return calculateCase16(X);
  }

  if (Z === 7072) {
    return calculateCase17(X, Y);
  }

  if (Z > 7072 && Z <= RIVER_LENGTH) {
    return calculateCase18(Z, X, Y);
  }

  return calculateDefaultCase();
};

export type { WaterQualityData, RiverPosition } from './water-quality/types';
export { RIVER_POSITIONS, CRITICAL_POSITIONS, RIVER_LENGTH } from './water-quality/constants';
export type { ColorScale } from './water-quality/colors';
export { COLOR_SCALES, getColorFromValue } from './water-quality/colors';
export { pixelToMeter, meterToPixel } from './water-quality/spatial';