import { ordinaryLeastSquares } from "./regression-chart.ts";

export interface SampleReplicate { readonly response: number; readonly sampleMass: number; }
export function meanAndStandardError(values: readonly number[]) {
  if (values.length < 2 || values.some(v => !Number.isFinite(v))) throw new Error("At least two finite results required");
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return {mean, standardError: Math.sqrt(variance / values.length)};
}
export function evaluateNormalizedSample(calibrants: readonly {x:number;y:number}[], replicates: readonly SampleReplicate[], normalizationFactor: number) {
  const fit = ordinaryLeastSquares(calibrants);
  if (fit.slope === 0 || !Number.isFinite(normalizationFactor) || normalizationFactor <= 0) throw new Error("Normalization requires a nonzero slope and positive conversion factor");
  const values = replicates.map(r => {
    if (!Number.isFinite(r.response) || !Number.isFinite(r.sampleMass) || r.sampleMass <= 0) throw new Error("Replicate response must be finite and sample mass positive");
    return (r.response - fit.intercept) / fit.slope / r.sampleMass * normalizationFactor;
  });
  return {values, ...meanAndStandardError(values)};
}
/** Neighboring calibration-window means overlap: the resulting SE is descriptive. */
export function compareCalibrationWindows(data: readonly {x:number;y:number}[], replicates: readonly SampleReplicate[], start: number, size: number, radius: number, factor: number) {
  if (![start,size,radius].every(Number.isInteger) || size < 3 || radius < 1 || start-radius < 0 || start+radius+size > data.length) throw new Error("Neighbor windows must fit the calibration data without duplicating boundary windows");
  const local = evaluateNormalizedSample(data.slice(start, start+size), replicates, factor);
  const neighboring = Array.from({length:2*radius+1}, (_, i) => evaluateNormalizedSample(data.slice(start-radius+i, start-radius+i+size), replicates, factor).mean);
  return {local, neighboring, ensemble: meanAndStandardError(neighboring)};
}
