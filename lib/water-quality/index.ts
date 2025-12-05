// Main water quality calculation exports
export { calculateConcentration } from '../water-quality-calculations';

// Types
export type { WaterQualityData, RiverPosition, AlgorithmConstraintType } from './types';

// Constants
export { RIVER_POSITIONS, CRITICAL_POSITIONS, RIVER_LENGTH } from './constants';

// Mathematical functions
export { calculateT, calculateTBOD, calculateTN } from './coefficients';
export { D_BOD1, D_BOD0, D_NH41, D_NH40, D_NO31 } from './degradation';

// Utilities
export { truncateToTwoDecimals, applyAlgorithmConstraints } from './utils';

// Color and visualization
export type { ColorScale } from './colors';
export { COLOR_SCALES, getColorFromValue } from './colors';

// Spatial utilities
export { pixelToMeter, meterToPixel } from './spatial';