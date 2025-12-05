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

export type AlgorithmConstraintType = 'increasing' | 'decreasing';