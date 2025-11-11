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
export const calculateT = (temperature: number): number => {
  return Math.pow(2.5, (temperature - 26) / 10);
};
const D_BOD1 = (time: number): number => {
  return -1e-5 * Math.pow(time, 2) + 0.0305 * time - 0.4113;
};
const D_BOD0 = (time: number): number => {
  return 0.0012 * time - 2e-15;
};
const D_NH41 = (time: number): number => {
  return -1e-6 * Math.pow(time, 2) + 0.0021 * time - 0.0121;
};
const D_NH40 = (time: number): number => {
  return -2e-7 * Math.pow(time, 2) + 0.0003 * time - 0.0006;
};
const D_NO31 = (time: number): number => {
  return 6e-7 * Math.pow(time, 2) - 0.0006 * time - 0.0085;
};
interface SegmentResult {
  BOD1: number;
  BOD0: number;
  NH41: number;
  NH40: number;
  NO31: number;
}
const calculateSegmentConcentrations = (
  X: number,
  Y: number,
): {
  seg1: SegmentResult;
  seg2: SegmentResult;
  seg3: SegmentResult;
  seg4: SegmentResult;
  seg5: SegmentResult;
} => {
  const T = calculateT(Y);
  console.log(X, Y, T);
  const Q1 = 1250 + 13550 * X;
  const BOD_base1 = (47625 + 9 * 13550 * X) / Q1;
  const NH4_base1 = (19125 + 0.56 * 13550 * X) / Q1;
  const NO3_base1 = (313 + 0.14 * 13550 * X) / Q1;
  const seg1: SegmentResult = {
    BOD1: BOD_base1,
    BOD0: BOD_base1,
    NH41: NH4_base1,
    NH40: NH4_base1,
    NO31: NO3_base1,
  };
  const Q2 = 1480 + 3500 * X;
  const time20 = 533760 / Q1;
  const Q1_reduced = 1250 + 2000 * X;
  const BOD1_before_mix =
    (47625 + 9 * 2000 * X) / Q1_reduced - T * D_BOD1(time20);
  const BOD0_before_mix =
    (47625 + 9 * 2000 * X) / Q1_reduced - T * D_BOD0(time20);
  const NH41_before_mix =
    (19125 + 0.56 * 2000 * X) / Q1_reduced - T * D_NH41(time20);
  const NH40_before_mix =
    (19125 + 0.56 * 2000 * X) / Q1_reduced - T * D_NH40(time20);
  const NO31_before_mix =
    (313 + 0.14 * 2000 * X) / Q1_reduced - T * D_NO31(time20);
  const seg2: SegmentResult = {
    BOD1: (BOD1_before_mix * Q1_reduced + (8763 + 9 * 1500 * X)) / Q2,
    BOD0: (BOD0_before_mix * Q1_reduced + (8763 + 9 * 1500 * X)) / Q2,
    NH41: (NH41_before_mix * Q1_reduced + (3519 + 0.56 * 2000 * X)) / Q2,
    NH40: (NH40_before_mix * Q1_reduced + (3519 + 0.56 * 2000 * X)) / Q2,
    NO31: (NO31_before_mix * Q1_reduced + (58 + 0.14 * 1500 * X)) / Q2,
  };
  const Q3 = 2522 + 6600 * X;
  const time30 = 987840 / Q2;
  const BOD1_3_before_mix = seg2.BOD1 - T * D_BOD1(time30);
  const BOD0_3_before_mix = seg2.BOD0 - T * D_BOD1(time30);
  const NH41_3_before_mix = seg2.NH41 - T * D_NH41(time30);
  const NH40_3_before_mix = seg2.NH40 - T * D_NH40(time30);
  const NO31_3_before_mix = seg2.NO31 - T * D_NO31(time30);
  const seg3: SegmentResult = {
    BOD1: (BOD1_3_before_mix * Q2 + (39688 + 9 * 3100 * X)) / Q3,
    BOD0: (BOD0_3_before_mix * Q2 + (39688 + 9 * 3100 * X)) / Q3,
    NH41: (NH41_3_before_mix * Q2 + (15938 + 0.56 * 3100 * X)) / Q3,
    NH40: (NH40_3_before_mix * Q2 + (15938 + 0.56 * 3100 * X)) / Q3,
    NO31: (NO31_3_before_mix * Q2 + (260 + 0.14 * 3100 * X)) / Q3,
  };
  const Q4 = 4839 + 8800 * X;
  const time40 = 1215360 / Q3;
  const BOD1_4_before_mix = seg3.BOD1 - T * D_BOD1(time40);
  const BOD0_4_before_mix = seg3.BOD0 - T * D_BOD1(time40);
  const NH41_4_before_mix = seg3.NH41 - T * D_NH41(time40);
  const NH40_4_before_mix = seg3.NH40 - T * D_NH40(time40);
  const NO31_4_before_mix = seg3.NO31 - T * D_NO31(time40);
  const seg4: SegmentResult = {
    BOD1: (BOD1_4_before_mix * Q3 + (88278 + 9 * 2200 * X)) / Q4,
    BOD0: (BOD0_4_before_mix * Q3 + (88278 + 9 * 2200 * X)) / Q4,
    NH41: (NH41_4_before_mix * Q3 + (35450 + 0.56 * 2200 * X)) / Q4,
    NH40: (NH40_4_before_mix * Q3 + (35450 + 0.56 * 2200 * X)) / Q4,
    NO31: (NO31_4_before_mix * Q3 + (579 + 0.14 * 2200 * X)) / Q4,
  };
  const Q5 = 6074 + 10150 * X;
  const time50 = 2178240 / Q4;
  const BOD1_5_before_mix = seg4.BOD1 - T * D_BOD1(time50);
  const BOD0_5_before_mix = seg4.BOD0 - T * D_BOD1(time50);
  const NH41_5_before_mix = seg4.NH41 - T * D_NH41(time50);
  const NH40_5_before_mix = seg4.NH40 - T * D_NH40(time50);
  const NO31_5_before_mix = seg4.NO31 - T * D_NO31(time50);
  const seg5: SegmentResult = {
    BOD1: (BOD1_5_before_mix * Q4 + (47054 + 9 * 1350 * X)) / Q5,
    BOD0: (BOD0_5_before_mix * Q4 + (47054 + 9 * 1350 * X)) / Q5,
    NH41: (NH41_5_before_mix * Q4 + (18896 + 0.56 * 1350 * X)) / Q5,
    NH40: (NH40_5_before_mix * Q4 + (18896 + 0.56 * 1350 * X)) / Q5,
    NO31: (NO31_5_before_mix * Q4 + (309 + 0.14 * 1350 * X)) / Q5,
  };
  return { seg1, seg2, seg3, seg4, seg5 };
};
export const calculateConcentration = (
  Z: number,
  X: number,
  Y: number,
): WaterQualityData => {
  Z = Math.max(0, Math.min(8013, Z));
  const T = calculateT(Y);
  const segments = calculateSegmentConcentrations(X, Y);
  if (Z === 0) {
    return {
      BOD5_sample0: Math.max(0, segments.seg1.BOD0),
      BOD5_sample1: Math.max(0, segments.seg1.BOD1),
      NH4_sample0: Math.max(0, segments.seg1.NH40),
      NH4_sample1: Math.max(0, segments.seg1.NH41),
      NO3_sample1: Math.max(0, segments.seg1.NO31),
    };
  }
  if (Z > 0 && Z < 1112) {
    const Q1 = 1250 + 13550 * X;
    const time2 = (480 * Z) / Q1;
    return {
      BOD5_sample0: Math.max(0, segments.seg1.BOD0 - T * D_BOD0(time2)),
      BOD5_sample1: Math.max(0, segments.seg1.BOD1 - T * D_BOD1(time2)),
      NH4_sample0: Math.max(0, segments.seg1.NH40 - T * D_NH40(time2)),
      NH4_sample1: Math.max(0, segments.seg1.NH41 - T * D_NH41(time2)),
      NO3_sample1: Math.max(0, segments.seg1.NO31 - T * D_NO31(time2)),
    };
  }
  if (Z === 1112) {
    return {
      BOD5_sample0: Math.max(0, segments.seg2.BOD0),
      BOD5_sample1: Math.max(0, segments.seg2.BOD1),
      NH4_sample0: Math.max(0, segments.seg2.NH40),
      NH4_sample1: Math.max(0, segments.seg2.NH41),
      NO3_sample1: Math.max(0, segments.seg2.NO31),
    };
  }
  if (Z > 1112 && Z < 3170) {
    const Q2 = 1480 + 3500 * X;
    const time3 = (480 * Z) / Q2;
    return {
      BOD5_sample0: Math.max(0, segments.seg2.BOD0 - T * D_BOD0(time3)),
      BOD5_sample1: Math.max(0, segments.seg2.BOD1 - T * D_BOD1(time3)),
      NH4_sample0: Math.max(0, segments.seg2.NH40 - T * D_NH40(time3)),
      NH4_sample1: Math.max(0, segments.seg2.NH41 - T * D_NH41(time3)),
      NO3_sample1: Math.max(0, segments.seg2.NO31 - T * D_NO31(time3)),
    };
  }
  if (Z === 3170) {
    return {
      BOD5_sample0: Math.max(0, segments.seg3.BOD0),
      BOD5_sample1: Math.max(0, segments.seg3.BOD1),
      NH4_sample0: Math.max(0, segments.seg3.NH40),
      NH4_sample1: Math.max(0, segments.seg3.NH41),
      NO3_sample1: Math.max(0, segments.seg3.NO31),
    };
  }
  if (Z > 3170 && Z < 4590) {
    const Q3 = 2522 + 6600 * X;
    const time4 = (480 * Z) / Q3;
    return {
      BOD5_sample0: Math.max(0, segments.seg3.BOD0 - T * D_BOD0(time4)),
      BOD5_sample1: Math.max(0, segments.seg3.BOD1 - T * D_BOD1(time4)),
      NH4_sample0: Math.max(0, segments.seg3.NH40 - T * D_NH40(time4)),
      NH4_sample1: Math.max(0, segments.seg3.NH41 - T * D_NH41(time4)),
      NO3_sample1: Math.max(0, segments.seg3.NO31 - T * D_NO31(time4)),
    };
  }
  if (Z === 4590) {
    return {
      BOD5_sample0: Math.max(0, segments.seg4.BOD0),
      BOD5_sample1: Math.max(0, segments.seg4.BOD1),
      NH4_sample0: Math.max(0, segments.seg4.NH40),
      NH4_sample1: Math.max(0, segments.seg4.NH41),
      NO3_sample1: Math.max(0, segments.seg4.NO31),
    };
  }
  if (Z > 4590 && Z < 7070) {
    const Q4 = 4839 + 8800 * X;
    const time5 = (480 * Z) / Q4;
    return {
      BOD5_sample0: Math.max(0, segments.seg4.BOD0 - T * D_BOD0(time5)),
      BOD5_sample1: Math.max(0, segments.seg4.BOD1 - T * D_BOD1(time5)),
      NH4_sample0: Math.max(0, segments.seg4.NH40 - T * D_NH40(time5)),
      NH4_sample1: Math.max(0, segments.seg4.NH41 - T * D_NH41(time5)),
      NO3_sample1: Math.max(0, segments.seg4.NO31 - T * D_NO31(time5)),
    };
  }
  if (Z === 7070) {
    return {
      BOD5_sample0: Math.max(0, segments.seg5.BOD0),
      BOD5_sample1: Math.max(0, segments.seg5.BOD1),
      NH4_sample0: Math.max(0, segments.seg5.NH40),
      NH4_sample1: Math.max(0, segments.seg5.NH41),
      NO3_sample1: Math.max(0, segments.seg5.NO31),
    };
  }
  if (Z > 7070 && Z <= 8013) {
    const Q5 = 6074 + 10150 * X;
    const time6 = (480 * Z) / Q5;
    return {
      BOD5_sample0: Math.max(0, segments.seg5.BOD0 - T * D_BOD0(time6)),
      BOD5_sample1: Math.max(0, segments.seg5.BOD1 - T * D_BOD1(time6)),
      NH4_sample0: Math.max(0, segments.seg5.NH40 - T * D_NH40(time6)),
      NH4_sample1: Math.max(0, segments.seg5.NH41 - T * D_NH41(time6)),
      NO3_sample1: Math.max(0, segments.seg5.NO31 - T * D_NO31(time6)),
    };
  }
  return {
    BOD5_sample0: 0,
    BOD5_sample1: 0,
    NH4_sample0: 0,
    NH4_sample1: 0,
    NO3_sample1: 0,
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
  NH4: {
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
