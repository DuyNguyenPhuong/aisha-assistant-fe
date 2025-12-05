import type { WaterQualityData } from './types';
import { calculateT, calculateTBOD, calculateTN } from './coefficients';
import { D_BOD1, D_BOD0, D_NH41, D_NH40, D_NO31 } from './degradation';
import { truncateToTwoDecimals, applyAlgorithmConstraints } from './utils';

// Trường hợp 1: Z = 0 (vị trí 1. Sài Đồng)
export const calculateCase1 = (X: number): WaterQualityData => {
  const Q1 = 1250 + 13550 * X;
  
  const BOD1_1 = (47625 + 9 * 13550 * X) / Q1;
  const BOD0_1 = (47625 + 9 * 13550 * X) / Q1;
  const NH41_1 = (19125 + 0.56 * 13550 * X) / Q1;
  const NH40_1 = (19125 + 0.56 * 13550 * X) / Q1;
  const NO31_1 = (313 + 0.14 * 13550 * X) / Q1;

  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_1)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_1)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_1)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_1)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_1)),
  };
};

// Trường hợp 2: 0 < Z < 1110 (sau Sài Đồng đến trước Đài Tư 2m)
export const calculateCase2 = (Z: number, X: number, Y: number): WaterQualityData => {
  const Q1 = 1250 + 13550 * X;
  const time2 = (480 * Z) / Q1;
  
  const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
  const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
  const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

  const TBOD = calculateTBOD(time2, Y);
  const TN = calculateTN(time2, Y);

  let BOD1_Z = BOD_initial - calculateTBOD(time2, Y) * D_BOD1(time2);
  let BOD0_Z = BOD_initial - calculateTBOD(time2, Y) * D_BOD0(time2);
  let NH41_Z = NH4_initial - calculateTN(time2, Y) * D_NH41(time2);
  let NH40_Z = NH4_initial - calculateTN(time2, Y) * D_NH40(time2);
  let NO31_Z = NO3_initial - calculateTN(time2, Y) * D_NO31(time2);

  BOD1_Z = applyAlgorithmConstraints(BOD1_Z, BOD_initial, 'decreasing');
  BOD0_Z = applyAlgorithmConstraints(BOD0_Z, BOD_initial, 'decreasing');
  NH41_Z = applyAlgorithmConstraints(NH41_Z, NH4_initial, 'decreasing');
  NH40_Z = applyAlgorithmConstraints(NH40_Z, NH4_initial, 'decreasing');
  NO31_Z = applyAlgorithmConstraints(NO31_Z, NO3_initial, 'increasing');

  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z)),
  };
};

// Trường hợp 3: Z = 1110 (ngay trước cống 2. Đài Tư 2m)
export const calculateCase3 = (X: number, Y: number): WaterQualityData => {
  const Q1 = 1250 + 13550 * X;
  const time20 = 532800 / Q1; // 480 * 1110
  
  const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
  const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
  const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

  const TBOD = calculateTBOD(time20, Y);
  const TN = calculateTN(time20, Y);

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

  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z1110)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z1110)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z1110)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z1110)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z1110)),
  };
};

// Trường hợp 4: Z = 1112 (tại giữa cống Đài Tư)
export const calculateCase4 = (X: number): WaterQualityData => {
  const q2 = 230 + 3820 * X;
  
  const BOD1_Z1112 = (8736 + 34380 * X) / q2;
  const BOD0_Z1112 = (8736 + 34380 * X) / q2;
  const NH41_Z1112 = (3519 + 2139 * X) / q2;
  const NH40_Z1112 = (3519 + 2139 * X) / q2;
  const NO31_Z1112 = (58 + 535 * X) / q2;

  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z1112)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z1112)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z1112)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z1112)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z1112)),
  };
};

// Trường hợp 5: Z = 1114 (sau cống Đài Tư 2m)
export const calculateCase5 = (X: number, Y: number): WaterQualityData => {
  const Q1 = 1250 + 13550 * X;
  const q2 = 230 + 3820 * X;
  const Q2 = Q1 + q2; // 1480 + 17370 * X
  
  // Tính giá trị tại Z = 1110 (trước cống)
  const time20 = 532800 / Q1;
  const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
  const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
  const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

  const TBOD = calculateTBOD(time20, Y);
  const TN = calculateTN(time20, Y);

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

  // Giá trị tại cống (Z = 1112)
  const BOD1_Z1112 = (8736 + 34380 * X) / q2;
  const BOD0_Z1112 = (8736 + 34380 * X) / q2;
  const NH41_Z1112 = (3519 + 2139 * X) / q2;
  const NH40_Z1112 = (3519 + 2139 * X) / q2;
  const NO31_Z1112 = (58 + 535 * X) / q2;

  // Trung bình có trọng số
  const BOD1_2 = (BOD1_Z1110 * Q1 + BOD1_Z1112 * q2) / Q2;
  const BOD0_2 = (BOD0_Z1110 * Q1 + BOD0_Z1112 * q2) / Q2;
  const NH41_2 = (NH41_Z1110 * Q1 + NH41_Z1112 * q2) / Q2;
  const NH40_2 = (NH40_Z1110 * Q1 + NH40_Z1112 * q2) / Q2;
  const NO31_2 = (NO31_Z1110 * Q1 + NO31_Z1112 * q2) / Q2;

  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_2)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_2)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_2)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_2)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_2)),
  };
};

// Placeholder cases 6-18 (cần implement đầy đủ logic sau)
export const calculateCase6 = (Z: number, X: number, Y: number): WaterQualityData => {
  const Q2 = 1480 + 17370 * X;
  const time3 = 480 * (Z - 1112) / Q2; // Time from 1112 to current Z
  
  // Get values from case 5 (Z = 1114) - the mixed values after Dai Tu
  const case5Values = calculateCase5(X, Y);
  const BOD1_2 = case5Values.BOD5_sample1;
  const BOD0_2 = case5Values.BOD5_sample0;
  const NH41_2 = case5Values.NH4_sample1;
  const NH40_2 = case5Values.NH4_sample0;
  const NO31_2 = case5Values.NO3_sample1;

  // Degradation from BOD1.2 to current Z
  let BOD1_Z = BOD1_2 - calculateTBOD(time3, Y) * D_BOD1(time3);
  let BOD0_Z = BOD0_2 - calculateTBOD(time3, Y) * D_BOD0(time3);
  let NH41_Z = NH41_2 - calculateTN(time3, Y) * D_NH41(time3);
  let NH40_Z = NH40_2 - calculateTN(time3, Y) * D_NH40(time3);
  let NO31_Z = NO31_2 - calculateTN(time3, Y) * D_NO31(time3);

  BOD1_Z = applyAlgorithmConstraints(BOD1_Z, BOD1_2, 'decreasing');
  BOD0_Z = applyAlgorithmConstraints(BOD0_Z, BOD0_2, 'decreasing');
  NH41_Z = applyAlgorithmConstraints(NH41_Z, NH41_2, 'decreasing');
  NH40_Z = applyAlgorithmConstraints(NH40_Z, NH40_2, 'decreasing');
  NO31_Z = applyAlgorithmConstraints(NO31_Z, NO31_2, 'increasing');

  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z)),
  };
};

export const calculateCase7 = (X: number, Y: number): WaterQualityData => {
  const Q2 = 1480 + 17370 * X;
  const time30 = 480 * (3168 - 1112) / Q2; // Time from 1112 to 3168
  
  // Get values from case 5 (Z = 1114) - the mixed values after Dai Tu
  const case5Values = calculateCase5(X, Y);
  const BOD1_2 = case5Values.BOD5_sample1;
  const BOD0_2 = case5Values.BOD5_sample0;
  const NH41_2 = case5Values.NH4_sample1;
  const NH40_2 = case5Values.NH4_sample0;
  const NO31_2 = case5Values.NO3_sample1;

  // Degradation from BOD1.2 (at 1114) to Z = 3168
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
};

export const calculateCase8 = (X: number): WaterQualityData => {
  const q3 = 1042 + 18330 * X;
  
  const BOD1_Z3170 = (39688 + 164970 * X) / q3;
  const BOD0_Z3170 = (39688 + 164970 * X) / q3;
  const NH41_Z3170 = (15938 + 10265 * X) / q3;
  const NH40_Z3170 = (15938 + 10265 * X) / q3;
  const NO31_Z3170 = (260 + 2566 * X) / q3;

  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z3170)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z3170)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z3170)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z3170)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z3170)),
  };
};

export const calculateCase9 = (X: number, Y: number): WaterQualityData => {
  const Q2 = 1480 + 17370 * X;
  const q3 = 1042 + 18330 * X;
  const Q3 = Q2 + q3; // 2522 + 35700 * X
  
  // Get values from case 7 (Z = 3168)
  const case7Values = calculateCase7(X, Y);
  const BOD1_Z3168 = case7Values.BOD5_sample1;
  const BOD0_Z3168 = case7Values.BOD5_sample0;
  const NH41_Z3168 = case7Values.NH4_sample1;
  const NH40_Z3168 = case7Values.NH4_sample0;
  const NO31_Z3168 = case7Values.NO3_sample1;

  // Values at sewer Z3170 (same as case 8)
  const BOD1_Z3170 = (39688 + 164970 * X) / q3;
  const BOD0_Z3170 = (39688 + 164970 * X) / q3;
  const NH41_Z3170 = (15938 + 10265 * X) / q3;
  const NH40_Z3170 = (15938 + 10265 * X) / q3;
  const NO31_Z3170 = (260 + 2566 * X) / q3;

  // Weighted average mixing
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
};

export const calculateCase10 = (Z: number, X: number, Y: number): WaterQualityData => {
  const Q3 = 2522 + 35700 * X;
  const time4 = 480 * (Z - 3170) / Q3; // Time from 3170 to current Z
  
  // Get values from case 9 (Z = 3172)
  const case9Values = calculateCase9(X, Y);
  const BOD1_3 = case9Values.BOD5_sample1;
  const BOD0_3 = case9Values.BOD5_sample0;
  const NH41_3 = case9Values.NH4_sample1;
  const NH40_3 = case9Values.NH4_sample0;
  const NO31_3 = case9Values.NO3_sample1;

  // Degradation from BOD1.3 to current Z
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
};

export const calculateCase11 = (X: number, Y: number): WaterQualityData => {
  const Q3 = 2522 + 35700 * X;
  const time40 = 480 * (4588 - 3170) / Q3; // 680640 / Q3
  
  // Get values from case 9 (Z = 3172)
  const case9Values = calculateCase9(X, Y);
  const BOD1_3 = case9Values.BOD5_sample1;
  const BOD0_3 = case9Values.BOD5_sample0;
  const NH41_3 = case9Values.NH4_sample1;
  const NH40_3 = case9Values.NH4_sample0;
  const NO31_3 = case9Values.NO3_sample1;

  // Degradation from BOD1.3 to Z = 4588
  let BOD1_Z4588 = BOD1_3 - calculateTBOD(time40, Y) * D_BOD1(time40);
  let BOD0_Z4588 = BOD0_3 - calculateTBOD(time40, Y) * D_BOD0(time40);
  let NH41_Z4588 = NH41_3 - calculateTN(time40, Y) * D_NH41(time40);
  let NH40_Z4588 = NH40_3 - calculateTN(time40, Y) * D_NH40(time40);
  let NO31_Z4588 = NO31_3 - calculateTN(time40, Y) * D_NO31(time40);

  BOD1_Z4588 = applyAlgorithmConstraints(BOD1_Z4588, BOD1_3, 'decreasing');
  BOD0_Z4588 = applyAlgorithmConstraints(BOD0_Z4588, BOD0_3, 'decreasing');
  NH41_Z4588 = applyAlgorithmConstraints(NH41_Z4588, NH41_3, 'decreasing');
  NH40_Z4588 = applyAlgorithmConstraints(NH40_Z4588, NH40_3, 'decreasing');
  NO31_Z4588 = applyAlgorithmConstraints(NO31_Z4588, NO31_3, 'increasing');

  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z4588)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z4588)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z4588)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z4588)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z4588)),
  };
};

export const calculateCase12 = (X: number): WaterQualityData => {
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
};

export const calculateCase13 = (X: number, Y: number): WaterQualityData => {
  const Q3 = 2522 + 35700 * X;
  const q4 = 2317 + 11020 * X;
  const Q4 = Q3 + q4; // 4839 + 46720 * X
  
  // Get values from case 11 (Z = 4588)
  const case11Values = calculateCase11(X, Y);
  const BOD1_Z4588 = case11Values.BOD5_sample1;
  const BOD0_Z4588 = case11Values.BOD5_sample0;
  const NH41_Z4588 = case11Values.NH4_sample1;
  const NH40_Z4588 = case11Values.NH4_sample0;
  const NO31_Z4588 = case11Values.NO3_sample1;

  // Values at sewer Z4590 (same as case 12)
  const case12Values = calculateCase12(X);
  const BOD1_Z4590 = case12Values.BOD5_sample1;
  const BOD0_Z4590 = case12Values.BOD5_sample0;
  const NH41_Z4590 = case12Values.NH4_sample1;
  const NH40_Z4590 = case12Values.NH4_sample0;
  const NO31_Z4590 = case12Values.NO3_sample1;

  // Weighted average mixing - NOTE: Formula in requirements uses BOD1.Z4590, not BOD1.Z3170
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
};

export const calculateCase14 = (Z: number, X: number, Y: number): WaterQualityData => {
  const Q4 = 4839 + 46720 * X;
  const time5 = 480 * (Z - 4590) / Q4; // Time from 4590 to current Z
  
  // Get values from case 13 (Z = 4592)
  const case13Values = calculateCase13(X, Y);
  const BOD1_4 = case13Values.BOD5_sample1;
  const BOD0_4 = case13Values.BOD5_sample0;
  const NH41_4 = case13Values.NH4_sample1;
  const NH40_4 = case13Values.NH4_sample0;
  const NO31_4 = case13Values.NO3_sample1;

  // Degradation from BOD1.4 to current Z
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
};

export const calculateCase15 = (X: number, Y: number): WaterQualityData => {
  const Q4 = 4839 + 46720 * X;
  const time50 = 480 * (7068 - 4590) / Q4; // 1189440 / Q4
  
  // Get values from case 13 (Z = 4592)
  const case13Values = calculateCase13(X, Y);
  const BOD1_4 = case13Values.BOD5_sample1;
  const BOD0_4 = case13Values.BOD5_sample0;
  const NH41_4 = case13Values.NH4_sample1;
  const NH40_4 = case13Values.NH4_sample0;
  const NO31_4 = case13Values.NO3_sample1;

  // Degradation from BOD1.4 to Z = 7068
  let BOD1_Z7068 = BOD1_4 - calculateTBOD(time50, Y) * D_BOD1(time50);
  let BOD0_Z7068 = BOD0_4 - calculateTBOD(time50, Y) * D_BOD0(time50);
  let NH41_Z7068 = NH41_4 - calculateTN(time50, Y) * D_NH41(time50);
  let NH40_Z7068 = NH40_4 - calculateTN(time50, Y) * D_NH40(time50);
  let NO31_Z7068 = NO31_4 - calculateTN(time50, Y) * D_NO31(time50);

  BOD1_Z7068 = applyAlgorithmConstraints(BOD1_Z7068, BOD1_4, 'decreasing');
  BOD0_Z7068 = applyAlgorithmConstraints(BOD0_Z7068, BOD0_4, 'decreasing');
  NH41_Z7068 = applyAlgorithmConstraints(NH41_Z7068, NH41_4, 'decreasing');
  NH40_Z7068 = applyAlgorithmConstraints(NH40_Z7068, NH40_4, 'decreasing');
  NO31_Z7068 = applyAlgorithmConstraints(NO31_Z7068, NO31_4, 'increasing');

  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z7068)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z7068)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z7068)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z7068)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z7068)),
  };
};

export const calculateCase16 = (X: number): WaterQualityData => {
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
};

export const calculateCase17 = (X: number, Y: number): WaterQualityData => {
  const Q4 = 4839 + 46720 * X;
  const q5 = 1235 + 6890 * X;
  const Q5 = Q4 + q5; // 6074 + 53610 * X
  
  // Get values from case 15 (Z = 7068)
  const case15Values = calculateCase15(X, Y);
  const BOD1_Z7068 = case15Values.BOD5_sample1;
  const BOD0_Z7068 = case15Values.BOD5_sample0;
  const NH41_Z7068 = case15Values.NH4_sample1;
  const NH40_Z7068 = case15Values.NH4_sample0;
  const NO31_Z7068 = case15Values.NO3_sample1;

  // Values at sewer Z7070 (same as case 16)
  const case16Values = calculateCase16(X);
  const BOD1_Z7070 = case16Values.BOD5_sample1;
  const BOD0_Z7070 = case16Values.BOD5_sample0;
  const NH41_Z7070 = case16Values.NH4_sample1;
  const NH40_Z7070 = case16Values.NH4_sample0;
  const NO31_Z7070 = case16Values.NO3_sample1;

  // Weighted average mixing
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
};

export const calculateCase18 = (Z: number, X: number, Y: number): WaterQualityData => {
  const Q5 = 6074 + 53610 * X;
  const time6 = 480 * (Z - 7070) / Q5; // Time from 7070 to current Z
  
  // Get values from case 17 (Z = 7072)
  const case17Values = calculateCase17(X, Y);
  const BOD1_5 = case17Values.BOD5_sample1;
  const BOD0_5 = case17Values.BOD5_sample0;
  const NH41_5 = case17Values.NH4_sample1;
  const NH40_5 = case17Values.NH4_sample0;
  const NO31_5 = case17Values.NO3_sample1;

  // Degradation from BOD1.5 to current Z
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
};

// Default case for invalid positions
export const calculateDefaultCase = (): WaterQualityData => {
  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(5.0)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(5.0)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(2.5)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(2.5)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(1.5)),
  };
};