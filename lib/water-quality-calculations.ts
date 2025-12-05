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

  // Trường hợp 1: Z = 0 (vị trí 1. Sài Đồng)
  if (Z === 0) {
    return calculateCase1(X);
  }

  // Trường hợp 2: 0 < Z < 1110 (sau Sài Đồng đến trước Đài Tư 2m)
  if (Z > 0 && Z < 1110) {
    return calculateCase2(Z, X, Y);
  }

  // Trường hợp 3: Z = 1110 (ngay trước cống 2. Đài Tư 2m)
  if (Z === 1110) {
    return calculateCase3(X, Y);
  }

  // Trường hợp 4: Z = 1112 (tại giữa cống Đài Tư)
  if (Z === 1112) {
    return calculateCase4(X);
  }

  // Trường hợp 5: Z = 1114 (sau cống Đài Tư 2m)
  if (Z === 1114) {
    return calculateCase5(X, Y);
  }

  // Trường hợp 6: 1114 < Z < 3168 (sau Đài Tư → trước An Lạc 2m)
  if (Z > 1114 && Z < 3168) {
    return calculateCase6(Z, X, Y);
  }

  // Trường hợp 7: Z = 3168 (ngay trước An Lạc 2m)
  if (Z === 3168) {
    return calculateCase7(X, Y);
  }

  // Trường hợp 8: Z = 3170 (tại giữa cống An Lạc)
  if (Z === 3170) {
    return calculateCase8(X);
  }

  // Trường hợp 9: Z = 3172 (sau cống An Lạc 2m)
  if (Z === 3172) {
    return calculateCase9(X, Y);
  }

  // Trường hợp 10: 3172 < Z < 4588 (từ sau An Lạc 2m đến trước Trâu Quỳ 2m)
  if (Z > 3172 && Z < 4588) {
    return calculateCase10(Z, X, Y);
  }

  // Trường hợp 11: Z = 4588 (ngay trước cống Trâu Quỳ 2m)
  if (Z === 4588) {
    return calculateCase11(X, Y);
  }

  // Trường hợp 12: Z = 4590 (tại giữa cống Trâu Quỳ)
  if (Z === 4590) {
    return calculateCase12(X);
  }

  // Trường hợp 13: Z = 4592 (sau cống Trâu Quỳ 2m)
  if (Z === 4592) {
    return calculateCase13(X, Y);
  }

  // Trường hợp 14: 4592 < Z < 7068 (từ sau Trâu Quỳ đến trước Đa Tốn 2m)
  if (Z > 4592 && Z < 7068) {
    return calculateCase14(Z, X, Y);
  }

  // Trường hợp 15: Z = 7068 (ngay trước cống Đa Tốn 2m)
  if (Z === 7068) {
    return calculateCase15(X, Y);
  }

  // Trường hợp 16: Z = 7070 (tại giữa cống Đa Tốn)
  if (Z === 7070) {
    return calculateCase16(X);
  }

  // Trường hợp 17: Z = 7072 (sau cống Đa Tốn 2m)
  if (Z === 7072) {
    return calculateCase17(X, Y);
  }

  // Trường hợp 18: 7072 < Z ≤ RIVER_LENGTH (từ sau Đa Tốn đến cuối sông/Xuân Thụy)
  if (Z > 7072 && Z <= RIVER_LENGTH) {
    return calculateCase18(Z, X, Y);
  }

  // Trường hợp mặc định
  return calculateDefaultCase();
};

// Export types and functions for external use
export type { WaterQualityData, RiverPosition } from './water-quality/types';
export { RIVER_POSITIONS, CRITICAL_POSITIONS, RIVER_LENGTH } from './water-quality/constants';
export type { ColorScale } from './water-quality/colors';
export { COLOR_SCALES, getColorFromValue } from './water-quality/colors';
export { pixelToMeter, meterToPixel } from './water-quality/spatial';