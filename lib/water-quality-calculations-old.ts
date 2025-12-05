import type { WaterQualityData, RiverPosition } from './water-quality/types';
import { RIVER_POSITIONS, CRITICAL_POSITIONS, RIVER_LENGTH } from './water-quality/constants';
import { calculateT, calculateTBOD, calculateTN } from './water-quality/coefficients';
import { D_BOD1, D_BOD0, D_NH41, D_NH40, D_NO31 } from './water-quality/degradation';
import { truncateToTwoDecimals, applyAlgorithmConstraints } from './water-quality/utils';
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
  const T = calculateT(Y);

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

  // Tạm thời giữ lại logic cũ cho demo - nên extract tất cả sau
  if (false && Z === 3168) {
    const Q2 = 1480 + 17370 * X;
    const time30 = 1520640 / Q2; // 480 * 3168
    
    // Tính BOD1.2, BOD0.2, NH41.2, NH40.2, NO31.2 từ Z = 1114
    const Q1 = 1250 + 13550 * X;
    const q2 = 230 + 3820 * X;
    
    const time20 = 532800 / Q1;
    const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
    const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
    const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

    let BOD1_Z1110 = BOD_initial - calculateTBOD(time20, Y) * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - calculateTBOD(time20, Y) * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - calculateTN(time20, Y) * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - calculateTN(time20, Y) * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - calculateTN(time20, Y) * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, 'decreasing');
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, 'decreasing');
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, 'decreasing');
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, 'decreasing');
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, 'increasing');

    const BOD1_Z1112 = (8736 + 34380 * X) / q2;
    const BOD0_Z1112 = (8736 + 34380 * X) / q2;
    const NH41_Z1112 = (3519 + 2139 * X) / q2;
    const NH40_Z1112 = (3519 + 2139 * X) / q2;
    const NO31_Z1112 = (58 + 535 * X) / q2;

    const BOD1_2 = (BOD1_Z1110 * Q1 + BOD1_Z1112 * q2) / Q2;
    const BOD0_2 = (BOD0_Z1110 * Q1 + BOD0_Z1112 * q2) / Q2;
    const NH41_2 = (NH41_Z1110 * Q1 + NH41_Z1112 * q2) / Q2;
    const NH40_2 = (NH40_Z1110 * Q1 + NH40_Z1112 * q2) / Q2;
    const NO31_2 = (NO31_Z1110 * Q1 + NO31_Z1112 * q2) / Q2;

    // Suy giảm từ BOD1.2 đến Z = 3168
    let BOD1_Z3168 = BOD1_2 - calculateTBOD(time30, Y) * D_BOD1(time30);
    let BOD0_Z3168 = BOD0_2 - calculateTBOD(time30, Y) * D_BOD0(time30);
    let NH41_Z3168 = NH41_2 - calculateTN(time30, Y) * D_NH41(time30);
    let NH40_Z3168 = NH40_2 - calculateTN(time30, Y) * D_NH40(time30);
    let NO31_Z3168 = NO31_2 - calculateTN(time30, Y) * D_NO31(time30);

    BOD1_Z3168 = applyAlgorithmConstraints(BOD1_Z3168, BOD1_2, 'decreasing');
    BOD0_Z3168 = applyAlgorithmConstraints(BOD0_Z3168, BOD0_2, 'decreasing');
    NH41_Z3168 = applyAlgorithmConstraints(NH41_Z3168, NH41_2, 'decreasing');
    NH40_Z3168 = applyAlgorithmConstraints(NH40_Z3168, NH40_2, 'decreasing');
    NO31_Z3168 = applyAlgorithmConstraints(NO31_Z3168, NO31_2, 'increasing');

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z3168)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z3168)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z3168)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z3168)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z3168)),
    };
  }

  // Trường hợp 8: Z = 3170 (tại giữa cống An Lạc)
  if (Z === 3170) {
    return calculateCase8(X);
  }



  // Trường hợp 9: Z = 3172 (sau cống An Lạc 2m)
  if (Z === 3172) {
    return calculateCase9(X, Y);
  }

  // Tạm thời giữ lại logic cũ cho demo
  if (false && Z === 3172) {
    const Q2 = 1480 + 17370 * X;
    const q3 = 1042 + 18330 * X;
    const Q3 = Q2 + q3; // 2522 + 35700 * X
    
    // Tính giá trị BOD1.Z3168, BOD0.Z3168, NH41.Z3168, NH40.Z3168, NO31.Z3168
    const time30 = 1520640 / Q2;
    
    const Q1 = 1250 + 13550 * X;
    const q2 = 230 + 3820 * X;
    
    const time20 = 532800 / Q1;
    const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
    const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
    const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

    let BOD1_Z1110 = BOD_initial - calculateTBOD(time20, Y) * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - calculateTBOD(time20, Y) * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - calculateTN(time20, Y) * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - calculateTN(time20, Y) * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - calculateTN(time20, Y) * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, 'decreasing');
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, 'decreasing');
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, 'decreasing');
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, 'decreasing');
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, 'increasing');

    const BOD1_Z1112 = (8736 + 34380 * X) / q2;
    const BOD0_Z1112 = (8736 + 34380 * X) / q2;
    const NH41_Z1112 = (3519 + 2139 * X) / q2;
    const NH40_Z1112 = (3519 + 2139 * X) / q2;
    const NO31_Z1112 = (58 + 535 * X) / q2;

    const BOD1_2 = (BOD1_Z1110 * Q1 + BOD1_Z1112 * q2) / Q2;
    const BOD0_2 = (BOD0_Z1110 * Q1 + BOD0_Z1112 * q2) / Q2;
    const NH41_2 = (NH41_Z1110 * Q1 + NH41_Z1112 * q2) / Q2;
    const NH40_2 = (NH40_Z1110 * Q1 + NH40_Z1112 * q2) / Q2;
    const NO31_2 = (NO31_Z1110 * Q1 + NO31_Z1112 * q2) / Q2;

    let BOD1_Z3168 = BOD1_2 - calculateTBOD(time30, Y) * D_BOD1(time30);
    let BOD0_Z3168 = BOD0_2 - calculateTBOD(time30, Y) * D_BOD0(time30);
    let NH41_Z3168 = NH41_2 - calculateTN(time30, Y) * D_NH41(time30);
    let NH40_Z3168 = NH40_2 - calculateTN(time30, Y) * D_NH40(time30);
    let NO31_Z3168 = NO31_2 - calculateTN(time30, Y) * D_NO31(time30);

    BOD1_Z3168 = applyAlgorithmConstraints(BOD1_Z3168, BOD1_2, 'decreasing');
    BOD0_Z3168 = applyAlgorithmConstraints(BOD0_Z3168, BOD0_2, 'decreasing');
    NH41_Z3168 = applyAlgorithmConstraints(NH41_Z3168, NH41_2, 'decreasing');
    NH40_Z3168 = applyAlgorithmConstraints(NH40_Z3168, NH40_2, 'decreasing');
    NO31_Z3168 = applyAlgorithmConstraints(NO31_Z3168, NO31_2, 'increasing');

    // Giá trị tại cống Z3170
    const BOD1_Z3170 = (39688 + 164970 * X) / q3;
    const BOD0_Z3170 = (39688 + 164970 * X) / q3;
    const NH41_Z3170 = (15938 + 10265 * X) / q3;
    const NH40_Z3170 = (15938 + 10265 * X) / q3;
    const NO31_Z3170 = (260 + 2566 * X) / q3;

    // Trung bình có trọng số
    const BOD1_3 = (BOD1_Z3168 * Q2 + BOD1_Z3170 * q3) / Q3;
    const BOD0_3 = (BOD0_Z3168 * Q2 + BOD0_Z3170 * q3) / Q3;
    const NH41_3 = (NH41_Z3168 * Q2 + NH41_Z3170 * q3) / Q3;
    const NH40_3 = (NH40_Z3168 * Q2 + NH40_Z3170 * q3) / Q3;
    const NO31_3 = (NO31_Z3168 * Q2 + NO31_Z3170 * q3) / Q3;

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_3)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_3)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_3)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_3)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_3)),
    };
  }

  // Trường hợp 10: 3172 < Z < 4588 (từ sau An Lạc 2m đến trước Trâu Quỳ 2m)
  if (Z > 3172 && Z < 4588) {
    return calculateCase10(Z, X, Y);
  }

  // Tạm thời giữ lại logic cũ cho demo
  if (false && Z > 3172 && Z < 4588) {
    const Q3 = 2522 + 35700 * X;
    const time4 = (480 * Z) / Q3;
    
    // Tính giá trị BOD1.3, BOD0.3, NH41.3, NH40.3, NO31.3 từ Z = 3172
    const Q2 = 1480 + 17370 * X;
    const q3 = 1042 + 18330 * X;
    
    const time30 = 1520640 / Q2;
    
    const Q1 = 1250 + 13550 * X;
    const q2 = 230 + 3820 * X;
    
    const time20 = 532800 / Q1;
    const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
    const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
    const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

    let BOD1_Z1110 = BOD_initial - calculateTBOD(time20, Y) * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - calculateTBOD(time20, Y) * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - calculateTN(time20, Y) * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - calculateTN(time20, Y) * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - calculateTN(time20, Y) * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, 'decreasing');
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, 'decreasing');
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, 'decreasing');
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, 'decreasing');
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, 'increasing');

    const BOD1_Z1112 = (8736 + 34380 * X) / q2;
    const BOD0_Z1112 = (8736 + 34380 * X) / q2;
    const NH41_Z1112 = (3519 + 2139 * X) / q2;
    const NH40_Z1112 = (3519 + 2139 * X) / q2;
    const NO31_Z1112 = (58 + 535 * X) / q2;

    const BOD1_2 = (BOD1_Z1110 * Q1 + BOD1_Z1112 * q2) / Q2;
    const BOD0_2 = (BOD0_Z1110 * Q1 + BOD0_Z1112 * q2) / Q2;
    const NH41_2 = (NH41_Z1110 * Q1 + NH41_Z1112 * q2) / Q2;
    const NH40_2 = (NH40_Z1110 * Q1 + NH40_Z1112 * q2) / Q2;
    const NO31_2 = (NO31_Z1110 * Q1 + NO31_Z1112 * q2) / Q2;

    let BOD1_Z3168 = BOD1_2 - calculateTBOD(time30, Y) * D_BOD1(time30);
    let BOD0_Z3168 = BOD0_2 - calculateTBOD(time30, Y) * D_BOD0(time30);
    let NH41_Z3168 = NH41_2 - calculateTN(time30, Y) * D_NH41(time30);
    let NH40_Z3168 = NH40_2 - calculateTN(time30, Y) * D_NH40(time30);
    let NO31_Z3168 = NO31_2 - calculateTN(time30, Y) * D_NO31(time30);

    BOD1_Z3168 = applyAlgorithmConstraints(BOD1_Z3168, BOD1_2, 'decreasing');
    BOD0_Z3168 = applyAlgorithmConstraints(BOD0_Z3168, BOD0_2, 'decreasing');
    NH41_Z3168 = applyAlgorithmConstraints(NH41_Z3168, NH41_2, 'decreasing');
    NH40_Z3168 = applyAlgorithmConstraints(NH40_Z3168, NH40_2, 'decreasing');
    NO31_Z3168 = applyAlgorithmConstraints(NO31_Z3168, NO31_2, 'increasing');

    const BOD1_Z3170 = (39688 + 164970 * X) / q3;
    const BOD0_Z3170 = (39688 + 164970 * X) / q3;
    const NH41_Z3170 = (15938 + 10265 * X) / q3;
    const NH40_Z3170 = (15938 + 10265 * X) / q3;
    const NO31_Z3170 = (260 + 2566 * X) / q3;

    const BOD1_3 = (BOD1_Z3168 * Q2 + BOD1_Z3170 * q3) / Q3;
    const BOD0_3 = (BOD0_Z3168 * Q2 + BOD0_Z3170 * q3) / Q3;
    const NH41_3 = (NH41_Z3168 * Q2 + NH41_Z3170 * q3) / Q3;
    const NH40_3 = (NH40_Z3168 * Q2 + NH40_Z3170 * q3) / Q3;
    const NO31_3 = (NO31_Z3168 * Q2 + NO31_Z3170 * q3) / Q3;

    // Suy giảm từ BOD1.3 đến Z hiện tại
    let BOD1_Z = BOD1_3 - calculateTBOD(time4, Y) * D_BOD1(time4);
    let BOD0_Z = BOD0_3 - calculateTBOD(time4, Y) * D_BOD0(time4);
    let NH41_Z = NH41_3 - calculateTN(time4, Y) * D_NH41(time4);
    let NH40_Z = NH40_3 - calculateTN(time4, Y) * D_NH40(time4);
    let NO31_Z = NO31_3 - calculateTN(time4, Y) * D_NO31(time4);

    BOD1_Z = applyAlgorithmConstraints(BOD1_Z, BOD1_3, 'decreasing');
    BOD0_Z = applyAlgorithmConstraints(BOD0_Z, BOD0_3, 'decreasing');
    NH41_Z = applyAlgorithmConstraints(NH41_Z, NH41_3, 'decreasing');
    NH40_Z = applyAlgorithmConstraints(NH40_Z, NH40_3, 'decreasing');
    NO31_Z = applyAlgorithmConstraints(NO31_Z, NO31_3, 'increasing');

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z)),
    };
  }

  // Trường hợp 11: Z = 4588 (ngay trước cống Trâu Quỳ 2m)
  if (Z === 4588) {
    return calculateCase11(X, Y);
  }

  // Tạm thời giữ lại logic cũ cho demo
  if (false && Z === 4588) {
    // Tương tự như trường hợp 3172 < Z < 4588 tại Z = 4588
    return calculateConcentration(4587, X, Y); // Gọi đệ quy với Z gần 4588
  }

  // Trường hợp 12: Z = 4590 (tại giữa cống Trâu Quỳ)
  if (Z === 4590) {
    return calculateCase12(X);
  }

  // Tạm thời giữ lại logic cũ cho demo
  if (false && Z === 4590) {
    const q4 = 2317 + 11020 * X;
    
    const BOD1_Z4590 = (88278 + 99180 * X) / q4;
    const BOD0_Z4590 = (88278 + 99180 * X) / q4;
    const NH41_Z4590 = (35450 + 6171 * X) / q4;
    const NH40_Z4590 = (35450 + 6171 * X) / q4;
    const NO31_Z4590 = (579 + 1543 * X) / q4;

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z4590)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z4590)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z4590)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z4590)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z4590)),
    };
  }

  // Trường hợp 13: Z = 4592 (sau cống Trâu Quỳ 2m)
  if (Z === 4592) {
    return calculateCase13(X, Y);
  }

  // Tạm thời giữ lại logic cũ cho demo
  if (false && Z === 4592) {
    const Q3 = 2522 + 35700 * X;
    const q4 = 2317 + 11020 * X;
    const Q4 = Q3 + q4; // 4839 + 46720 * X
    
    // Tính giá trị BOD1.Z4588, BOD0.Z4588, ... tại Z = 4588
    const time4_4588 = (480 * 4588) / Q3;
    
    // Tái sử dụng logic từ Z = 3172 để tính giá trị tại 4588
    const Q2 = 1480 + 17370 * X;
    const q3 = 1042 + 18330 * X;
    
    const time30 = 1520640 / Q2;
    
    const Q1 = 1250 + 13550 * X;
    const q2 = 230 + 3820 * X;
    
    const time20 = 532800 / Q1;
    const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
    const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
    const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

    let BOD1_Z1110 = BOD_initial - calculateTBOD(time20, Y) * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - calculateTBOD(time20, Y) * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - calculateTN(time20, Y) * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - calculateTN(time20, Y) * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - calculateTN(time20, Y) * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, 'decreasing');
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, 'decreasing');
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, 'decreasing');
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, 'decreasing');
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, 'increasing');

    const BOD1_Z1112 = (8736 + 34380 * X) / q2;
    const BOD0_Z1112 = (8736 + 34380 * X) / q2;
    const NH41_Z1112 = (3519 + 2139 * X) / q2;
    const NH40_Z1112 = (3519 + 2139 * X) / q2;
    const NO31_Z1112 = (58 + 535 * X) / q2;

    const BOD1_2 = (BOD1_Z1110 * Q1 + BOD1_Z1112 * q2) / Q2;
    const BOD0_2 = (BOD0_Z1110 * Q1 + BOD0_Z1112 * q2) / Q2;
    const NH41_2 = (NH41_Z1110 * Q1 + NH41_Z1112 * q2) / Q2;
    const NH40_2 = (NH40_Z1110 * Q1 + NH40_Z1112 * q2) / Q2;
    const NO31_2 = (NO31_Z1110 * Q1 + NO31_Z1112 * q2) / Q2;

    let BOD1_Z3168 = BOD1_2 - calculateTBOD(time30, Y) * D_BOD1(time30);
    let BOD0_Z3168 = BOD0_2 - calculateTBOD(time30, Y) * D_BOD0(time30);
    let NH41_Z3168 = NH41_2 - calculateTN(time30, Y) * D_NH41(time30);
    let NH40_Z3168 = NH40_2 - calculateTN(time30, Y) * D_NH40(time30);
    let NO31_Z3168 = NO31_2 - calculateTN(time30, Y) * D_NO31(time30);

    BOD1_Z3168 = applyAlgorithmConstraints(BOD1_Z3168, BOD1_2, 'decreasing');
    BOD0_Z3168 = applyAlgorithmConstraints(BOD0_Z3168, BOD0_2, 'decreasing');
    NH41_Z3168 = applyAlgorithmConstraints(NH41_Z3168, NH41_2, 'decreasing');
    NH40_Z3168 = applyAlgorithmConstraints(NH40_Z3168, NH40_2, 'decreasing');
    NO31_Z3168 = applyAlgorithmConstraints(NO31_Z3168, NO31_2, 'increasing');

    const BOD1_Z3170 = (39688 + 164970 * X) / q3;
    const BOD0_Z3170 = (39688 + 164970 * X) / q3;
    const NH41_Z3170 = (15938 + 10265 * X) / q3;
    const NH40_Z3170 = (15938 + 10265 * X) / q3;
    const NO31_Z3170 = (260 + 2566 * X) / q3;

    const BOD1_3 = (BOD1_Z3168 * Q2 + BOD1_Z3170 * q3) / Q3;
    const BOD0_3 = (BOD0_Z3168 * Q2 + BOD0_Z3170 * q3) / Q3;
    const NH41_3 = (NH41_Z3168 * Q2 + NH41_Z3170 * q3) / Q3;
    const NH40_3 = (NH40_Z3168 * Q2 + NH40_Z3170 * q3) / Q3;
    const NO31_3 = (NO31_Z3168 * Q2 + NO31_Z3170 * q3) / Q3;

    let BOD1_Z4588 = BOD1_3 - calculateTBOD(time4_4588, Y) * D_BOD1(time4_4588);
    let BOD0_Z4588 = BOD0_3 - calculateTBOD(time4_4588, Y) * D_BOD0(time4_4588);
    let NH41_Z4588 = NH41_3 - calculateTN(time4_4588, Y) * D_NH41(time4_4588);
    let NH40_Z4588 = NH40_3 - calculateTN(time4_4588, Y) * D_NH40(time4_4588);
    let NO31_Z4588 = NO31_3 - calculateTN(time4_4588, Y) * D_NO31(time4_4588);

    BOD1_Z4588 = applyAlgorithmConstraints(BOD1_Z4588, BOD1_3, 'decreasing');
    BOD0_Z4588 = applyAlgorithmConstraints(BOD0_Z4588, BOD0_3, 'decreasing');
    NH41_Z4588 = applyAlgorithmConstraints(NH41_Z4588, NH41_3, 'decreasing');
    NH40_Z4588 = applyAlgorithmConstraints(NH40_Z4588, NH40_3, 'decreasing');
    NO31_Z4588 = applyAlgorithmConstraints(NO31_Z4588, NO31_3, 'increasing');

    // Giá trị tại cống Z4590
    const BOD1_Z4590 = (88278 + 99180 * X) / q4;
    const BOD0_Z4590 = (88278 + 99180 * X) / q4;
    const NH41_Z4590 = (35450 + 6171 * X) / q4;
    const NH40_Z4590 = (35450 + 6171 * X) / q4;
    const NO31_Z4590 = (579 + 1543 * X) / q4;

    // Trung bình có trọng số
    const BOD1_4 = (BOD1_Z4588 * Q3 + BOD1_Z4590 * q4) / Q4;
    const BOD0_4 = (BOD0_Z4588 * Q3 + BOD0_Z4590 * q4) / Q4;
    const NH41_4 = (NH41_Z4588 * Q3 + NH41_Z4590 * q4) / Q4;
    const NH40_4 = (NH40_Z4588 * Q3 + NH40_Z4590 * q4) / Q4;
    const NO31_4 = (NO31_Z4588 * Q3 + NO31_Z4590 * q4) / Q4;

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_4)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_4)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_4)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_4)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_4)),
    };
  }

  // Trường hợp 14: 4592 < Z < 7068 (từ sau Trâu Quỳ đến trước Đa Tốn 2m)
  if (Z > 4592 && Z < 7068) {
    return calculateCase14(Z, X, Y);
  }

  // Tạm thời giữ lại logic cũ cho demo
  if (false && Z > 4592 && Z < 7068) {
    const Q4 = 4839 + 46720 * X;
    const time5 = (480 * Z) / Q4;
    
    // Tính giá trị BOD1.4, BOD0.4, NH41.4, NH40.4, NO31.4 từ Z = 4592
    // Sử dụng toàn bộ chain calculation từ đầu
    const Q3 = 2522 + 35700 * X;
    const q4 = 2317 + 11020 * X;
    const Q2 = 1480 + 17370 * X;
    const q3 = 1042 + 18330 * X;
    const Q1 = 1250 + 13550 * X;
    const q2 = 230 + 3820 * X;
    
    // Tính từ đầu
    const time20 = 532800 / Q1;
    const time30 = 1520640 / Q2;
    const time4_4588 = (480 * 4588) / Q3;
    
    const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
    const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
    const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

    // Z = 1110
    let BOD1_Z1110 = BOD_initial - calculateTBOD(time20, Y) * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - calculateTBOD(time20, Y) * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - calculateTN(time20, Y) * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - calculateTN(time20, Y) * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - calculateTN(time20, Y) * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, 'decreasing');
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, 'decreasing');
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, 'decreasing');
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, 'decreasing');
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, 'increasing');

    // Z = 1112 (cống)
    const BOD1_Z1112 = (8736 + 34380 * X) / q2;
    const BOD0_Z1112 = (8736 + 34380 * X) / q2;
    const NH41_Z1112 = (3519 + 2139 * X) / q2;
    const NH40_Z1112 = (3519 + 2139 * X) / q2;
    const NO31_Z1112 = (58 + 535 * X) / q2;

    // Z = 1114 (mixing)
    const BOD1_2 = (BOD1_Z1110 * Q1 + BOD1_Z1112 * q2) / Q2;
    const BOD0_2 = (BOD0_Z1110 * Q1 + BOD0_Z1112 * q2) / Q2;
    const NH41_2 = (NH41_Z1110 * Q1 + NH41_Z1112 * q2) / Q2;
    const NH40_2 = (NH40_Z1110 * Q1 + NH40_Z1112 * q2) / Q2;
    const NO31_2 = (NO31_Z1110 * Q1 + NO31_Z1112 * q2) / Q2;

    // Z = 3168
    let BOD1_Z3168 = BOD1_2 - calculateTBOD(time30, Y) * D_BOD1(time30);
    let BOD0_Z3168 = BOD0_2 - calculateTBOD(time30, Y) * D_BOD0(time30);
    let NH41_Z3168 = NH41_2 - calculateTN(time30, Y) * D_NH41(time30);
    let NH40_Z3168 = NH40_2 - calculateTN(time30, Y) * D_NH40(time30);
    let NO31_Z3168 = NO31_2 - calculateTN(time30, Y) * D_NO31(time30);

    BOD1_Z3168 = applyAlgorithmConstraints(BOD1_Z3168, BOD1_2, 'decreasing');
    BOD0_Z3168 = applyAlgorithmConstraints(BOD0_Z3168, BOD0_2, 'decreasing');
    NH41_Z3168 = applyAlgorithmConstraints(NH41_Z3168, NH41_2, 'decreasing');
    NH40_Z3168 = applyAlgorithmConstraints(NH40_Z3168, NH40_2, 'decreasing');
    NO31_Z3168 = applyAlgorithmConstraints(NO31_Z3168, NO31_2, 'increasing');

    // Z = 3170 (cống An Lạc)
    const BOD1_Z3170 = (39688 + 164970 * X) / q3;
    const BOD0_Z3170 = (39688 + 164970 * X) / q3;
    const NH41_Z3170 = (15938 + 10265 * X) / q3;
    const NH40_Z3170 = (15938 + 10265 * X) / q3;
    const NO31_Z3170 = (260 + 2566 * X) / q3;

    // Z = 3172 (mixing)
    const BOD1_3 = (BOD1_Z3168 * Q2 + BOD1_Z3170 * q3) / Q3;
    const BOD0_3 = (BOD0_Z3168 * Q2 + BOD0_Z3170 * q3) / Q3;
    const NH41_3 = (NH41_Z3168 * Q2 + NH41_Z3170 * q3) / Q3;
    const NH40_3 = (NH40_Z3168 * Q2 + NH40_Z3170 * q3) / Q3;
    const NO31_3 = (NO31_Z3168 * Q2 + NO31_Z3170 * q3) / Q3;

    // Z = 4588
    let BOD1_Z4588 = BOD1_3 - calculateTBOD(time4_4588, Y) * D_BOD1(time4_4588);
    let BOD0_Z4588 = BOD0_3 - calculateTBOD(time4_4588, Y) * D_BOD0(time4_4588);
    let NH41_Z4588 = NH41_3 - calculateTN(time4_4588, Y) * D_NH41(time4_4588);
    let NH40_Z4588 = NH40_3 - calculateTN(time4_4588, Y) * D_NH40(time4_4588);
    let NO31_Z4588 = NO31_3 - calculateTN(time4_4588, Y) * D_NO31(time4_4588);

    BOD1_Z4588 = applyAlgorithmConstraints(BOD1_Z4588, BOD1_3, 'decreasing');
    BOD0_Z4588 = applyAlgorithmConstraints(BOD0_Z4588, BOD0_3, 'decreasing');
    NH41_Z4588 = applyAlgorithmConstraints(NH41_Z4588, NH41_3, 'decreasing');
    NH40_Z4588 = applyAlgorithmConstraints(NH40_Z4588, NH40_3, 'decreasing');
    NO31_Z4588 = applyAlgorithmConstraints(NO31_Z4588, NO31_3, 'increasing');

    // Z = 4590 (cống Trâu Quỳ)
    const BOD1_Z4590 = (88278 + 99180 * X) / q4;
    const BOD0_Z4590 = (88278 + 99180 * X) / q4;
    const NH41_Z4590 = (35450 + 6171 * X) / q4;
    const NH40_Z4590 = (35450 + 6171 * X) / q4;
    const NO31_Z4590 = (579 + 1543 * X) / q4;

    // Z = 4592 (mixing)
    const BOD1_4 = (BOD1_Z4588 * Q3 + BOD1_Z4590 * q4) / Q4;
    const BOD0_4 = (BOD0_Z4588 * Q3 + BOD0_Z4590 * q4) / Q4;
    const NH41_4 = (NH41_Z4588 * Q3 + NH41_Z4590 * q4) / Q4;
    const NH40_4 = (NH40_Z4588 * Q3 + NH40_Z4590 * q4) / Q4;
    const NO31_4 = (NO31_Z4588 * Q3 + NO31_Z4590 * q4) / Q4;

    // Suy giảm từ BOD1.4 đến Z hiện tại
    let BOD1_Z = BOD1_4 - calculateTBOD(time5, Y) * D_BOD1(time5);
    let BOD0_Z = BOD0_4 - calculateTBOD(time5, Y) * D_BOD0(time5);
    let NH41_Z = NH41_4 - calculateTN(time5, Y) * D_NH41(time5);
    let NH40_Z = NH40_4 - calculateTN(time5, Y) * D_NH40(time5);
    let NO31_Z = NO31_4 - calculateTN(time5, Y) * D_NO31(time5);

    BOD1_Z = applyAlgorithmConstraints(BOD1_Z, BOD1_4, 'decreasing');
    BOD0_Z = applyAlgorithmConstraints(BOD0_Z, BOD0_4, 'decreasing');
    NH41_Z = applyAlgorithmConstraints(NH41_Z, NH41_4, 'decreasing');
    NH40_Z = applyAlgorithmConstraints(NH40_Z, NH40_4, 'decreasing');
    NO31_Z = applyAlgorithmConstraints(NO31_Z, NO31_4, 'increasing');

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z)),
    };
  }

  // Trường hợp 15: Z = 7068 (ngay trước cống Đa Tốn 2m)
  if (Z === 7068) {
    return calculateCase15(X, Y);
  }

  // Tạm thời giữ lại logic cũ cho demo
  if (false && Z === 7068) {
    return calculateConcentration(7067, X, Y); // Gọi đệ quy với Z gần 7068
  }

  // Trường hợp 16: Z = 7070 (tại giữa cống Đa Tốn)
  if (Z === 7070) {
    return calculateCase16(X);
  }

  // Tạm thời giữ lại logic cũ cho demo
  if (false && Z === 7070) {
    const q5 = 1235 + 6890 * X;
    
    const BOD1_Z7070 = (47054 + 62010 * X) / q5;
    const BOD0_Z7070 = (47054 + 62010 * X) / q5;
    const NH41_Z7070 = (18896 + 3858 * X) / q5;
    const NH40_Z7070 = (18896 + 3858 * X) / q5;
    const NO31_Z7070 = (309 + 965 * X) / q5;

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z7070)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z7070)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z7070)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z7070)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z7070)),
    };
  }

  // Trường hợp 17: Z = 7072 (sau cống Đa Tốn 2m)
  if (Z === 7072) {
    return calculateCase17(X, Y);
  }

  // Tạm thời giữ lại logic cũ cho demo
  if (false && Z === 7072) {
    const Q4 = 4839 + 46720 * X;
    const q5 = 1235 + 6890 * X;
    const Q5 = Q4 + q5; // 6074 + 53610 * X
    
    // Tính giá trị tại Z = 7068 bằng cách gọi calculateConcentration(7067, X, Y)
    const valuesAt7067 = calculateConcentration(7067, X, Y);
    const BOD1_Z7068 = valuesAt7067.BOD5_sample1;
    const BOD0_Z7068 = valuesAt7067.BOD5_sample0;
    const NH41_Z7068 = valuesAt7067.NH4_sample1;
    const NH40_Z7068 = valuesAt7067.NH4_sample0;
    const NO31_Z7068 = valuesAt7067.NO3_sample1;

    // Z = 7070 (cống Đa Tốn)
    const BOD1_Z7070 = (47054 + 62010 * X) / q5;
    const BOD0_Z7070 = (47054 + 62010 * X) / q5;
    const NH41_Z7070 = (18896 + 3858 * X) / q5;
    const NH40_Z7070 = (18896 + 3858 * X) / q5;
    const NO31_Z7070 = (309 + 965 * X) / q5;

    // Trung bình có trọng số
    const BOD1_5 = (BOD1_Z7068 * Q4 + BOD1_Z7070 * q5) / Q5;
    const BOD0_5 = (BOD0_Z7068 * Q4 + BOD0_Z7070 * q5) / Q5;
    const NH41_5 = (NH41_Z7068 * Q4 + NH41_Z7070 * q5) / Q5;
    const NH40_5 = (NH40_Z7068 * Q4 + NH40_Z7070 * q5) / Q5;
    const NO31_5 = (NO31_Z7068 * Q4 + NO31_Z7070 * q5) / Q5;

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_5)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_5)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_5)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_5)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_5)),
    };
  }

  // Trường hợp 18: 7072 < Z ≤ RIVER_LENGTH (từ sau Đa Tốn đến cuối sông/Xuân Thụy)
  if (Z > 7072 && Z <= RIVER_LENGTH) {
    return calculateCase18(Z, X, Y);
  }

  // Tạm thời giữ lại logic cũ cho demo
  if (false && Z > 7072 && Z <= RIVER_LENGTH) {
    const Q5 = 6074 + 53610 * X;
    const time6 = (480 * Z) / Q5;
    
    // Tính giá trị BOD1.5, BOD0.5, NH41.5, NH40.5, NO31.5 từ Z = 7072
    const valuesAt7072 = calculateConcentration(7072, X, Y);
    const BOD1_5 = valuesAt7072.BOD5_sample1;
    const BOD0_5 = valuesAt7072.BOD5_sample0;
    const NH41_5 = valuesAt7072.NH4_sample1;
    const NH40_5 = valuesAt7072.NH4_sample0;
    const NO31_5 = valuesAt7072.NO3_sample1;

    // Suy giảm từ BOD1.5 đến Z hiện tại
    let BOD1_Z = BOD1_5 - calculateTBOD(time6, Y) * D_BOD1(time6);
    let BOD0_Z = BOD0_5 - calculateTBOD(time6, Y) * D_BOD0(time6);
    let NH41_Z = NH41_5 - calculateTN(time6, Y) * D_NH41(time6);
    let NH40_Z = NH40_5 - calculateTN(time6, Y) * D_NH40(time6);
    let NO31_Z = NO31_5 - calculateTN(time6, Y) * D_NO31(time6);

    BOD1_Z = applyAlgorithmConstraints(BOD1_Z, BOD1_5, 'decreasing');
    BOD0_Z = applyAlgorithmConstraints(BOD0_Z, BOD0_5, 'decreasing');
    NH41_Z = applyAlgorithmConstraints(NH41_Z, NH41_5, 'decreasing');
    NH40_Z = applyAlgorithmConstraints(NH40_Z, NH40_5, 'decreasing');
    NO31_Z = applyAlgorithmConstraints(NO31_Z, NO31_5, 'increasing');

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z)),
    };
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