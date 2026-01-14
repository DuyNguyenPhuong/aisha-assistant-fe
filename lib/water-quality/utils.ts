
export const truncateToTwoDecimals = (value: number): number => {
  
  if (!isFinite(value) || isNaN(value)) {
    return 0;
  }
  return Math.floor(value * 100) / 100;
};




export const applyAlgorithmConstraints = (
  newValue: number,
  previousValue: number,
  constraintType: 'decreasing' | 'increasing' | 'none'
): number => {
  
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