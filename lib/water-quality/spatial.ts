import { RIVER_LENGTH } from './constants';

export const pixelToMeter = (x: number, canvasWidth: number): number => {
  return (x / canvasWidth) * RIVER_LENGTH;
};

export const meterToPixel = (meter: number, canvasWidth: number): number => {
  return (meter / RIVER_LENGTH) * canvasWidth;
};