export interface WaterQualityData {
  BOD5_sample0: number;
  BOD5_sample1: number;
  NH4_sample0: number;
  NH4_sample1: number;
  NO3_sample1: number;
}

export interface RiverPosition {
  name: string;
  position: number;
}

export const RIVER_POSITIONS: RiverPosition[] = [
  { name: "Sài Đồng", position: 0 },
  { name: "Đài Tư", position: 1112 },
  { name: "An Lạc", position: 3170 },
  { name: "Trâu Quỳ", position: 4590 },
  { name: "Đa Tốn", position: 7070 },
  { name: "Xuân Thụy", position: 8013 },
];

export const RIVER_LENGTH = 8013;

// Hệ số nhiệt độ: T = 2.5^((Y - 26)/10)
const calculateT = (temperature: number): number => {
  return Math.pow(2.5, (temperature - 26) / 10);
};

// Hàm suy giảm BOD1
const D_BOD1 = (time: number): number => {
  return -1e-5 * time * time + 0.0305 * time - 0.4113;
};

// Hàm suy giảm BOD0
const D_BOD0 = (time: number): number => {
  return 0.0012 * time - 2e-15;
};

// Hàm suy giảm NH41
const D_NH41 = (time: number): number => {
  return -1e-6 * time * time + 0.0021 * time - 0.0121;
};

// Hàm suy giảm NH40
const D_NH40 = (time: number): number => {
  return -2e-7 * time * time + 0.0003 * time - 0.0006;
};

// Hàm suy giảm NO31
const D_NO31 = (time: number): number => {
  return 6e-7 * time * time - 0.0006 * time - 0.0085;
};

// Hàm làm tròn xuống 2 chữ số thập phân
const truncateToTwoDecimals = (value: number): number => {
  return Math.floor(value * 100) / 100;
};

// Quy tắc ràng buộc: Zi+1 > Zi ⇒ Zi+1 = Zi; Zi+1 < Zi ⇒ Zi+1 = Zi
const applyAlgorithmConstraints = (
  newValue: number,
  previousValue: number,
  isDecreasing: boolean
): number => {
  if (isDecreasing) {
    // BOD1 mẫu 1: chỉ giảm hoặc giữ nguyên
    return newValue > previousValue ? previousValue : newValue;
  } else {
    // Các chất khác: không áp dụng constraints - cho phép tự nhiên degradation
    return newValue;
  }
};

export const calculateConcentration = (
  Z: number,
  X: number,
  Y: number,
): WaterQualityData => {
  Z = Math.max(0, Math.min(8013, Z));
  const T = calculateT(Y);

  // Trường hợp 1: Z = 0 (vị trí 1. Sài Đồng)
  if (Z === 0) {
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
  }

  // Trường hợp 2: 0 < Z < 1110 (sau Sài Đồng đến trước Đài Tư 2m)
  if (Z > 0 && Z < 1110) {
    const Q1 = 1250 + 13550 * X;
    const time2 = (480 * Z) / Q1;
    
    const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
    const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
    const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

    let BOD1_Z = BOD_initial - T * D_BOD1(time2);
    let BOD0_Z = BOD_initial - T * D_BOD0(time2);
    let NH41_Z = NH4_initial - T * D_NH41(time2);
    let NH40_Z = NH4_initial - T * D_NH40(time2);
    let NO31_Z = NO3_initial - T * D_NO31(time2);

    // Áp dụng constraints
    BOD1_Z = applyAlgorithmConstraints(BOD1_Z, BOD_initial, true);
    BOD0_Z = applyAlgorithmConstraints(BOD0_Z, BOD_initial, false);
    NH41_Z = applyAlgorithmConstraints(NH41_Z, NH4_initial, false);
    NH40_Z = applyAlgorithmConstraints(NH40_Z, NH4_initial, false);
    NO31_Z = applyAlgorithmConstraints(NO31_Z, NO3_initial, false);

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z)),
    };
  }

  // Trường hợp 3: Z = 1110 (ngay trước cống 2. Đài Tư 2m)
  if (Z === 1110) {
    const Q1 = 1250 + 13550 * X;
    const time20 = 532800 / Q1; // 480 * 1110
    
    const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
    const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
    const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

    let BOD1_Z1110 = BOD_initial - T * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - T * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - T * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - T * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - T * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, true);
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, false);
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, false);
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, false);
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, false);

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z1110)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z1110)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z1110)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z1110)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z1110)),
    };
  }

  // Trường hợp 4: Z = 1112 (tại giữa cống Đài Tư)
  if (Z === 1112) {
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
  }

  // Trường hợp 5: Z = 1114 (sau cống Đài Tư 2m)
  if (Z === 1114) {
    const Q1 = 1250 + 13550 * X;
    const q2 = 230 + 3820 * X;
    const Q2 = Q1 + q2; // 1480 + 17370 * X
    
    // Tính giá trị tại Z = 1110 (trước cống)
    const time20 = 532800 / Q1;
    const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
    const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
    const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

    let BOD1_Z1110 = BOD_initial - T * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - T * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - T * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - T * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - T * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, true);
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, false);
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, false);
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, false);
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, false);

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
  }

  // Trường hợp 6: 1114 < Z < 3168 (sau Đài Tư → trước An Lạc 2m)
  if (Z > 1114 && Z < 3168) {
    const Q2 = 1480 + 17370 * X;
    const time3 = (480 * Z) / Q2;
    
    // Tính BOD1.2, BOD0.2, NH41.2, NH40.2, NO31.2 từ Z = 1114
    const Q1 = 1250 + 13550 * X;
    const q2 = 230 + 3820 * X;
    
    const time20 = 532800 / Q1;
    const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
    const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
    const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

    let BOD1_Z1110 = BOD_initial - T * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - T * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - T * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - T * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - T * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, true);
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, false);
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, false);
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, false);
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, false);

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

    // Suy giảm từ BOD1.2 đến Z hiện tại
    let BOD1_Z = BOD1_2 - T * D_BOD1(time3);
    let BOD0_Z = BOD0_2 - T * D_BOD0(time3);
    let NH41_Z = NH41_2 - T * D_NH41(time3);
    let NH40_Z = NH40_2 - T * D_NH40(time3);
    let NO31_Z = NO31_2 - T * D_NO31(time3);

    BOD1_Z = applyAlgorithmConstraints(BOD1_Z, BOD1_2, true);
    BOD0_Z = applyAlgorithmConstraints(BOD0_Z, BOD0_2, false);
    NH41_Z = applyAlgorithmConstraints(NH41_Z, NH41_2, false);
    NH40_Z = applyAlgorithmConstraints(NH40_Z, NH40_2, false);
    NO31_Z = applyAlgorithmConstraints(NO31_Z, NO31_2, false);

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z)),
    };
  }

  // Trường hợp 7: Z = 3168 (ngay trước An Lạc 2m)
  if (Z === 3168) {
    const Q2 = 1480 + 17370 * X;
    const time30 = 1520640 / Q2; // 480 * 3168
    
    // Tính BOD1.2, BOD0.2, NH41.2, NH40.2, NO31.2 từ Z = 1114
    const Q1 = 1250 + 13550 * X;
    const q2 = 230 + 3820 * X;
    
    const time20 = 532800 / Q1;
    const BOD_initial = (47625 + 9 * 13550 * X) / Q1;
    const NH4_initial = (19125 + 0.56 * 13550 * X) / Q1;
    const NO3_initial = (313 + 0.14 * 13550 * X) / Q1;

    let BOD1_Z1110 = BOD_initial - T * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - T * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - T * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - T * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - T * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, true);
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, false);
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, false);
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, false);
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, false);

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
    let BOD1_Z3168 = BOD1_2 - T * D_BOD1(time30);
    let BOD0_Z3168 = BOD0_2 - T * D_BOD0(time30);
    let NH41_Z3168 = NH41_2 - T * D_NH41(time30);
    let NH40_Z3168 = NH40_2 - T * D_NH40(time30);
    let NO31_Z3168 = NO31_2 - T * D_NO31(time30);

    BOD1_Z3168 = applyAlgorithmConstraints(BOD1_Z3168, BOD1_2, true);
    BOD0_Z3168 = applyAlgorithmConstraints(BOD0_Z3168, BOD0_2, false);
    NH41_Z3168 = applyAlgorithmConstraints(NH41_Z3168, NH41_2, false);
    NH40_Z3168 = applyAlgorithmConstraints(NH40_Z3168, NH40_2, false);
    NO31_Z3168 = applyAlgorithmConstraints(NO31_Z3168, NO31_2, false);

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
  }

  // Trường hợp 9: Z = 3172 (sau cống An Lạc 2m)
  if (Z === 3172) {
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

    let BOD1_Z1110 = BOD_initial - T * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - T * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - T * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - T * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - T * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, true);
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, false);
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, false);
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, false);
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, false);

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

    let BOD1_Z3168 = BOD1_2 - T * D_BOD1(time30);
    let BOD0_Z3168 = BOD0_2 - T * D_BOD0(time30);
    let NH41_Z3168 = NH41_2 - T * D_NH41(time30);
    let NH40_Z3168 = NH40_2 - T * D_NH40(time30);
    let NO31_Z3168 = NO31_2 - T * D_NO31(time30);

    BOD1_Z3168 = applyAlgorithmConstraints(BOD1_Z3168, BOD1_2, true);
    BOD0_Z3168 = applyAlgorithmConstraints(BOD0_Z3168, BOD0_2, false);
    NH41_Z3168 = applyAlgorithmConstraints(NH41_Z3168, NH41_2, false);
    NH40_Z3168 = applyAlgorithmConstraints(NH40_Z3168, NH40_2, false);
    NO31_Z3168 = applyAlgorithmConstraints(NO31_Z3168, NO31_2, false);

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

    let BOD1_Z1110 = BOD_initial - T * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - T * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - T * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - T * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - T * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, true);
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, false);
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, false);
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, false);
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, false);

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

    let BOD1_Z3168 = BOD1_2 - T * D_BOD1(time30);
    let BOD0_Z3168 = BOD0_2 - T * D_BOD0(time30);
    let NH41_Z3168 = NH41_2 - T * D_NH41(time30);
    let NH40_Z3168 = NH40_2 - T * D_NH40(time30);
    let NO31_Z3168 = NO31_2 - T * D_NO31(time30);

    BOD1_Z3168 = applyAlgorithmConstraints(BOD1_Z3168, BOD1_2, true);
    BOD0_Z3168 = applyAlgorithmConstraints(BOD0_Z3168, BOD0_2, false);
    NH41_Z3168 = applyAlgorithmConstraints(NH41_Z3168, NH41_2, false);
    NH40_Z3168 = applyAlgorithmConstraints(NH40_Z3168, NH40_2, false);
    NO31_Z3168 = applyAlgorithmConstraints(NO31_Z3168, NO31_2, false);

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
    let BOD1_Z = BOD1_3 - T * D_BOD1(time4);
    let BOD0_Z = BOD0_3 - T * D_BOD0(time4);
    let NH41_Z = NH41_3 - T * D_NH41(time4);
    let NH40_Z = NH40_3 - T * D_NH40(time4);
    let NO31_Z = NO31_3 - T * D_NO31(time4);

    BOD1_Z = applyAlgorithmConstraints(BOD1_Z, BOD1_3, true);
    BOD0_Z = applyAlgorithmConstraints(BOD0_Z, BOD0_3, false);
    NH41_Z = applyAlgorithmConstraints(NH41_Z, NH41_3, false);
    NH40_Z = applyAlgorithmConstraints(NH40_Z, NH40_3, false);
    NO31_Z = applyAlgorithmConstraints(NO31_Z, NO31_3, false);

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
    // Tương tự như trường hợp 3172 < Z < 4588 tại Z = 4588
    return calculateConcentration(4587, X, Y); // Gọi đệ quy với Z gần 4588
  }

  // Trường hợp 12: Z = 4590 (tại giữa cống Trâu Quỳ)
  if (Z === 4590) {
    const q4 = 1383 + 24330 * X;
    
    const BOD1_Z4590 = (52650 + 219330 * X) / q4;
    const BOD0_Z4590 = (52650 + 219330 * X) / q4;
    const NH41_Z4590 = (21168 + 13632 * X) / q4;
    const NH40_Z4590 = (21168 + 13632 * X) / q4;
    const NO31_Z4590 = (346 + 3410 * X) / q4;

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
    const Q3 = 2522 + 35700 * X;
    const q4 = 1383 + 24330 * X;
    const Q4 = Q3 + q4; // 3905 + 60030 * X
    
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

    let BOD1_Z1110 = BOD_initial - T * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - T * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - T * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - T * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - T * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, true);
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, false);
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, false);
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, false);
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, false);

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

    let BOD1_Z3168 = BOD1_2 - T * D_BOD1(time30);
    let BOD0_Z3168 = BOD0_2 - T * D_BOD0(time30);
    let NH41_Z3168 = NH41_2 - T * D_NH41(time30);
    let NH40_Z3168 = NH40_2 - T * D_NH40(time30);
    let NO31_Z3168 = NO31_2 - T * D_NO31(time30);

    BOD1_Z3168 = applyAlgorithmConstraints(BOD1_Z3168, BOD1_2, true);
    BOD0_Z3168 = applyAlgorithmConstraints(BOD0_Z3168, BOD0_2, false);
    NH41_Z3168 = applyAlgorithmConstraints(NH41_Z3168, NH41_2, false);
    NH40_Z3168 = applyAlgorithmConstraints(NH40_Z3168, NH40_2, false);
    NO31_Z3168 = applyAlgorithmConstraints(NO31_Z3168, NO31_2, false);

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

    let BOD1_Z4588 = BOD1_3 - T * D_BOD1(time4_4588);
    let BOD0_Z4588 = BOD0_3 - T * D_BOD0(time4_4588);
    let NH41_Z4588 = NH41_3 - T * D_NH41(time4_4588);
    let NH40_Z4588 = NH40_3 - T * D_NH40(time4_4588);
    let NO31_Z4588 = NO31_3 - T * D_NO31(time4_4588);

    BOD1_Z4588 = applyAlgorithmConstraints(BOD1_Z4588, BOD1_3, true);
    BOD0_Z4588 = applyAlgorithmConstraints(BOD0_Z4588, BOD0_3, false);
    NH41_Z4588 = applyAlgorithmConstraints(NH41_Z4588, NH41_3, false);
    NH40_Z4588 = applyAlgorithmConstraints(NH40_Z4588, NH40_3, false);
    NO31_Z4588 = applyAlgorithmConstraints(NO31_Z4588, NO31_3, false);

    // Giá trị tại cống Z4590
    const BOD1_Z4590 = (52650 + 219330 * X) / q4;
    const BOD0_Z4590 = (52650 + 219330 * X) / q4;
    const NH41_Z4590 = (21168 + 13632 * X) / q4;
    const NH40_Z4590 = (21168 + 13632 * X) / q4;
    const NO31_Z4590 = (346 + 3410 * X) / q4;

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
    const Q4 = 3905 + 60030 * X;
    const time5 = (480 * Z) / Q4;
    
    // Tính giá trị BOD1.4, BOD0.4, NH41.4, NH40.4, NO31.4 từ Z = 4592
    // Sử dụng toàn bộ chain calculation từ đầu
    const Q3 = 2522 + 35700 * X;
    const q4 = 1383 + 24330 * X;
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
    let BOD1_Z1110 = BOD_initial - T * D_BOD1(time20);
    let BOD0_Z1110 = BOD_initial - T * D_BOD0(time20);
    let NH41_Z1110 = NH4_initial - T * D_NH41(time20);
    let NH40_Z1110 = NH4_initial - T * D_NH40(time20);
    let NO31_Z1110 = NO3_initial - T * D_NO31(time20);

    BOD1_Z1110 = applyAlgorithmConstraints(BOD1_Z1110, BOD_initial, true);
    BOD0_Z1110 = applyAlgorithmConstraints(BOD0_Z1110, BOD_initial, false);
    NH41_Z1110 = applyAlgorithmConstraints(NH41_Z1110, NH4_initial, false);
    NH40_Z1110 = applyAlgorithmConstraints(NH40_Z1110, NH4_initial, false);
    NO31_Z1110 = applyAlgorithmConstraints(NO31_Z1110, NO3_initial, false);

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
    let BOD1_Z3168 = BOD1_2 - T * D_BOD1(time30);
    let BOD0_Z3168 = BOD0_2 - T * D_BOD0(time30);
    let NH41_Z3168 = NH41_2 - T * D_NH41(time30);
    let NH40_Z3168 = NH40_2 - T * D_NH40(time30);
    let NO31_Z3168 = NO31_2 - T * D_NO31(time30);

    BOD1_Z3168 = applyAlgorithmConstraints(BOD1_Z3168, BOD1_2, true);
    BOD0_Z3168 = applyAlgorithmConstraints(BOD0_Z3168, BOD0_2, false);
    NH41_Z3168 = applyAlgorithmConstraints(NH41_Z3168, NH41_2, false);
    NH40_Z3168 = applyAlgorithmConstraints(NH40_Z3168, NH40_2, false);
    NO31_Z3168 = applyAlgorithmConstraints(NO31_Z3168, NO31_2, false);

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
    let BOD1_Z4588 = BOD1_3 - T * D_BOD1(time4_4588);
    let BOD0_Z4588 = BOD0_3 - T * D_BOD0(time4_4588);
    let NH41_Z4588 = NH41_3 - T * D_NH41(time4_4588);
    let NH40_Z4588 = NH40_3 - T * D_NH40(time4_4588);
    let NO31_Z4588 = NO31_3 - T * D_NO31(time4_4588);

    BOD1_Z4588 = applyAlgorithmConstraints(BOD1_Z4588, BOD1_3, true);
    BOD0_Z4588 = applyAlgorithmConstraints(BOD0_Z4588, BOD0_3, false);
    NH41_Z4588 = applyAlgorithmConstraints(NH41_Z4588, NH41_3, false);
    NH40_Z4588 = applyAlgorithmConstraints(NH40_Z4588, NH40_3, false);
    NO31_Z4588 = applyAlgorithmConstraints(NO31_Z4588, NO31_3, false);

    // Z = 4590 (cống Trâu Quỳ)
    const BOD1_Z4590 = (52650 + 219330 * X) / q4;
    const BOD0_Z4590 = (52650 + 219330 * X) / q4;
    const NH41_Z4590 = (21168 + 13632 * X) / q4;
    const NH40_Z4590 = (21168 + 13632 * X) / q4;
    const NO31_Z4590 = (346 + 3410 * X) / q4;

    // Z = 4592 (mixing)
    const BOD1_4 = (BOD1_Z4588 * Q3 + BOD1_Z4590 * q4) / Q4;
    const BOD0_4 = (BOD0_Z4588 * Q3 + BOD0_Z4590 * q4) / Q4;
    const NH41_4 = (NH41_Z4588 * Q3 + NH41_Z4590 * q4) / Q4;
    const NH40_4 = (NH40_Z4588 * Q3 + NH40_Z4590 * q4) / Q4;
    const NO31_4 = (NO31_Z4588 * Q3 + NO31_Z4590 * q4) / Q4;

    // Suy giảm từ BOD1.4 đến Z hiện tại
    let BOD1_Z = BOD1_4 - T * D_BOD1(time5);
    let BOD0_Z = BOD0_4 - T * D_BOD0(time5);
    let NH41_Z = NH41_4 - T * D_NH41(time5);
    let NH40_Z = NH40_4 - T * D_NH40(time5);
    let NO31_Z = NO31_4 - T * D_NO31(time5);

    BOD1_Z = applyAlgorithmConstraints(BOD1_Z, BOD1_4, true);
    BOD0_Z = applyAlgorithmConstraints(BOD0_Z, BOD0_4, false);
    NH41_Z = applyAlgorithmConstraints(NH41_Z, NH41_4, false);
    NH40_Z = applyAlgorithmConstraints(NH40_Z, NH40_4, false);
    NO31_Z = applyAlgorithmConstraints(NO31_Z, NO31_4, false);

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
    return calculateConcentration(7067, X, Y); // Gọi đệ quy với Z gần 7068
  }

  // Trường hợp 16: Z = 7070 (tại giữa cống Đa Tốn)
  if (Z === 7070) {
    const q5 = 120 + 2100 * X;
    
    const BOD1_Z7070 = (4560 + 18900 * X) / q5;
    const BOD0_Z7070 = (4560 + 18900 * X) / q5;
    const NH41_Z7070 = (1833 + 1179 * X) / q5;
    const NH40_Z7070 = (1833 + 1179 * X) / q5;
    const NO31_Z7070 = (30 + 295 * X) / q5;

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
    const Q4 = 3905 + 60030 * X;
    const q5 = 120 + 2100 * X;
    const Q5 = Q4 + q5; // 4025 + 62130 * X
    
    // Tính giá trị tại Z = 7068 bằng cách gọi calculateConcentration(7067, X, Y)
    const valuesAt7067 = calculateConcentration(7067, X, Y);
    const BOD1_Z7068 = valuesAt7067.BOD5_sample1;
    const BOD0_Z7068 = valuesAt7067.BOD5_sample0;
    const NH41_Z7068 = valuesAt7067.NH4_sample1;
    const NH40_Z7068 = valuesAt7067.NH4_sample0;
    const NO31_Z7068 = valuesAt7067.NO3_sample1;

    // Z = 7070 (cống Đa Tốn)
    const BOD1_Z7070 = (4560 + 18900 * X) / q5;
    const BOD0_Z7070 = (4560 + 18900 * X) / q5;
    const NH41_Z7070 = (1833 + 1179 * X) / q5;
    const NH40_Z7070 = (1833 + 1179 * X) / q5;
    const NO31_Z7070 = (30 + 295 * X) / q5;

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

  // Trường hợp 18: 7072 < Z ≤ 8013 (từ sau Đa Tốn đến cuối sông/Xuân Thụy)
  if (Z > 7072 && Z <= 8013) {
    const Q5 = 4025 + 62130 * X;
    const time6 = (480 * Z) / Q5;
    
    // Tính giá trị BOD1.5, BOD0.5, NH41.5, NH40.5, NO31.5 từ Z = 7072
    const valuesAt7072 = calculateConcentration(7072, X, Y);
    const BOD1_5 = valuesAt7072.BOD5_sample1;
    const BOD0_5 = valuesAt7072.BOD5_sample0;
    const NH41_5 = valuesAt7072.NH4_sample1;
    const NH40_5 = valuesAt7072.NH4_sample0;
    const NO31_5 = valuesAt7072.NO3_sample1;

    // Suy giảm từ BOD1.5 đến Z hiện tại
    let BOD1_Z = BOD1_5 - T * D_BOD1(time6);
    let BOD0_Z = BOD0_5 - T * D_BOD0(time6);
    let NH41_Z = NH41_5 - T * D_NH41(time6);
    let NH40_Z = NH40_5 - T * D_NH40(time6);
    let NO31_Z = NO31_5 - T * D_NO31(time6);

    BOD1_Z = applyAlgorithmConstraints(BOD1_Z, BOD1_5, true);
    BOD0_Z = applyAlgorithmConstraints(BOD0_Z, BOD0_5, false);
    NH41_Z = applyAlgorithmConstraints(NH41_Z, NH41_5, false);
    NH40_Z = applyAlgorithmConstraints(NH40_Z, NH40_5, false);
    NO31_Z = applyAlgorithmConstraints(NO31_Z, NO31_5, false);

    return {
      BOD5_sample0: Math.max(0, truncateToTwoDecimals(BOD0_Z)),
      BOD5_sample1: Math.max(0, truncateToTwoDecimals(BOD1_Z)),
      NH4_sample0: Math.max(0, truncateToTwoDecimals(NH40_Z)),
      NH4_sample1: Math.max(0, truncateToTwoDecimals(NH41_Z)),
      NO3_sample1: Math.max(0, truncateToTwoDecimals(NO31_Z)),
    };
  }

  // Trường hợp mặc định
  return {
    BOD5_sample0: Math.max(0, truncateToTwoDecimals(5.0)),
    BOD5_sample1: Math.max(0, truncateToTwoDecimals(5.0)),
    NH4_sample0: Math.max(0, truncateToTwoDecimals(2.5)),
    NH4_sample1: Math.max(0, truncateToTwoDecimals(2.5)),
    NO3_sample1: Math.max(0, truncateToTwoDecimals(1.5)),
  };
};

export const pixelToMeter = (x: number, canvasWidth: number): number => {
  return (x / canvasWidth) * RIVER_LENGTH;
};

export const meterToPixel = (meter: number, canvasWidth: number): number => {
  return (meter / RIVER_LENGTH) * canvasWidth;
};

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

export const getColorFromValue = (value: number, scale: ColorScale): string => {
  const normalizedValue =
    Math.min(Math.max(value, scale.min), scale.max) / scale.max;
  if (normalizedValue <= 0.5) {
    const t = normalizedValue * 2;
    return interpolateColor(scale.colors[0], scale.colors[1], t);
  } else {
    const t = (normalizedValue - 0.5) * 2;
    return interpolateColor(scale.colors[1], scale.colors[2], t);
  }
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