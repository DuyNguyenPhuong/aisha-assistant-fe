// Hàm suy giảm BOD1 (BOD5 mẫu 1)
export const D_BOD1 = (time: number): number => {
  return -1e-5 * time * time + 0.0311 * time - 0.438;
};

// Hàm suy giảm BOD0 (BOD mẫu 0)
export const D_BOD0 = (time: number): number => {
  return -2e-8 * time * time + 0.0012 * time - 0.0002;
};

// Hàm suy giảm NH41 (NH4+ mẫu 1)
export const D_NH41 = (time: number): number => {
  return -2e-6 * time * time + 0.0023 * time - 0.0199;
};

// Hàm suy giảm NH40 (NH4+ mẫu 0)
export const D_NH40 = (time: number): number => {
  return -3e-7 * time * time + 0.0003 * time - 0.0012;
};

// Hàm suy giảm NO31 (NO3- mẫu 1)
export const D_NO31 = (time: number): number => {
  return 9e-7 * time * time - 0.0009 * time + 0.0293;
};