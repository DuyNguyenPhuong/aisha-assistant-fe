
export const calculateT = (temperature: number): number => {
  return Math.pow(2.5, (temperature - 26) / 10);
};


export const calculateTBOD = (time: number, temperature: number): number => {
  const timeInDays = time / 60 / 24;
  const numerator = 1 - Math.exp(-timeInDays * 0.165 * Math.pow(1.091, temperature - 20));
  const denominator = 1 - Math.exp(-timeInDays * 0.279);
  return denominator !== 0 ? numerator / denominator : 0;
};


export const calculateTN = (time: number, temperature: number): number => {
  const timeInDays = time / 60 / 24;
  const numerator = Math.exp(-timeInDays * 0.165 * Math.pow(1.091, temperature - 20));
  const denominator = Math.exp(-timeInDays * 0.279);
  return denominator !== 0 ? numerator / denominator : 0;
};