// Hàm làm tròn xuống 2 chữ số thập phân
export const truncateToTwoDecimals = (value: number): number => {
  // Handle NaN, Infinity, and undefined/null cases
  if (!isFinite(value) || isNaN(value)) {
    return 0;
  }
  return Math.floor(value * 100) / 100;
};

// Quy tắc ràng buộc thuật toán:
// 1. BOD5 mẫu 1,0 & NH4 mẫu 1,0: Nếu Zi+1 > Zi thì Zi+1 = Zi (chỉ giảm hoặc giữ nguyên)
// 2. NO3: Nếu Zi+1 < Zi thì Zi+1 = Zi (chỉ tăng hoặc giữ nguyên)
export const applyAlgorithmConstraints = (
  newValue: number,
  previousValue: number,
  constraintType: 'decreasing' | 'increasing' | 'none'
): number => {
  // Handle NaN cases - return previous value as fallback
  if (!isFinite(newValue) || isNaN(newValue)) {
    return isFinite(previousValue) && !isNaN(previousValue) ? previousValue : 0;
  }
  if (!isFinite(previousValue) || isNaN(previousValue)) {
    return newValue;
  }
  
  if (constraintType === 'decreasing' && newValue > previousValue) {
    return previousValue;
  } else if (constraintType === 'increasing' && newValue < previousValue) {
    return previousValue;
  } else {
    return newValue;
  }
};