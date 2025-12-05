// Hàm suy giảm BOD1
export const D_BOD1 = (time: number): number => {
  return -1e-5 * time * time + 0.0305 * time - 0.4113;
};

// Hàm suy giảm BOD0
export const D_BOD0 = (time: number): number => {
  return 0.0012 * time - 2e-15;
};

// Hàm suy giảm NH41
export const D_NH41 = (time: number): number => {
  return -1e-6 * time * time + 0.0021 * time - 0.0121;
};

// Hàm suy giảm NH40
export const D_NH40 = (time: number): number => {
  return -2e-7 * time * time + 0.0003 * time - 0.0006;
};

// Hàm suy giảm NO31
export const D_NO31 = (time: number): number => {
  return 6e-7 * time * time - 0.0006 * time - 0.0085;
};