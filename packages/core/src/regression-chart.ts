import type { ChartAxis, SourceReference } from "./scene-document.ts";

export interface RegressionObservation {
  readonly id: string; readonly x: number; readonly y: number; readonly source: readonly SourceReference[];
}
export interface RegressionWindow {
  readonly id: string; readonly label: string; readonly datumIds: readonly string[]; readonly source: readonly SourceReference[];
  readonly cycleIntervalMs?: number;
}
export interface RegressionChartBlock {
  readonly id: string;
  readonly kind: "chart";
  readonly chartType: "regression";
  readonly label: string;
  readonly description: string;
  readonly source: readonly SourceReference[];
  readonly xAxis: ChartAxis;
  readonly yAxis: ChartAxis;
  readonly data: readonly RegressionObservation[];
  readonly windows: readonly RegressionWindow[];
  readonly liveUpdate?: never;
}

export function ordinaryLeastSquares(points: readonly {x: number; y: number}[]) {
  if (points.length < 2 || points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) throw new Error("Regression requires finite paired observations");
  const xMean = points.reduce((s, p) => s + p.x, 0) / points.length;
  const yMean = points.reduce((s, p) => s + p.y, 0) / points.length;
  const xx = points.reduce((s, p) => s + (p.x - xMean) ** 2, 0);
  if (!(xx > 0)) throw new Error("Regression requires variation in the predictor");
  const slope = points.reduce((s, p) => s + (p.x - xMean) * (p.y - yMean), 0) / xx;
  const intercept = yMean - slope * xMean;
  if (![slope, intercept].every(Number.isFinite)) throw new Error("Regression fit is not finite");
  return {slope, intercept};
}

export function regressionWindowResult(block: RegressionChartBlock, window: RegressionWindow) {
  const byId = new Map(block.data.map(d => [d.id, d]));
  const points = window.datumIds.map(id => {
    const point = byId.get(id); if (!point) throw new Error("Regression window references an unknown observation"); return point;
  });
  if (points.length < 3) throw new Error("Leave-one-out regression requires at least three observations");
  const fit = ordinaryLeastSquares(points);
  if (fit.slope === 0) throw new Error("Inverse prediction requires a nonzero slope");
  const errors = points.map((point, i) => {
    const heldOut = ordinaryLeastSquares(points.filter((_, j) => i !== j));
    if (heldOut.slope === 0) throw new Error("Inverse prediction requires a nonzero slope in every held-out fit");
    const value = Math.abs((point.y - heldOut.intercept) / heldOut.slope - point.x);
    if (!Number.isFinite(value)) throw new Error("Inverse prediction error must be finite");
    return {id: point.id, value};
  });
  return {...fit, points, errors, meanAbsoluteError: errors.reduce((s, e) => s + e.value, 0) / errors.length};
}

export function validateRegressionChart(block: RegressionChartBlock): void {
  if (!block.xAxis.unit || !block.yAxis.unit || !block.data.length || !block.windows.length || block.liveUpdate !== undefined) throw new Error("Regression requires units, data and windows without live jitter");
  const ids = new Set<string>();
  for (const datum of block.data) {
    if (!datum.id || ids.has(datum.id) || !datum.source.length || !Number.isFinite(datum.x) || !Number.isFinite(datum.y)) throw new Error("Invalid regression observation or duplicate identity");
    ids.add(datum.id);
  }
  const windows = new Set<string>();
  for (const window of block.windows) {
    if (!window.id || windows.has(window.id) || !window.label || !window.source.length || new Set(window.datumIds).size !== window.datumIds.length) throw new Error("Regression windows require unique identities and members, labels and provenance");
    windows.add(window.id); regressionWindowResult(block, window);
    if (window.cycleIntervalMs !== undefined) {
      if (!Number.isInteger(window.cycleIntervalMs) || window.cycleIntervalMs < 100) throw new Error("Cycle interval must be an integer of at least 100 ms");
      const start = block.data.findIndex(d => d.id === window.datumIds[0]);
      if (window.datumIds.length > block.data.length || window.datumIds.some((id, i) => id !== block.data[(start + i) % block.data.length]?.id)) throw new Error("Cyclic windows must begin with a contiguous FIFO selection");
      for (let i = 0; i < block.data.length; i++) regressionWindowResult(block, cyclicRegressionWindow(block, window, i));
    }
  }
}

export function cyclicRegressionWindow(block: RegressionChartBlock, window: RegressionWindow, offset: number): RegressionWindow {
  const n = block.data.length, first = block.data.findIndex(d => d.id === window.datumIds[0]);
  if (first < 0 || !Number.isInteger(offset)) throw new Error("Invalid cyclic window start or offset");
  const start = ((first + offset) % n + n) % n;
  return {...window, datumIds: window.datumIds.map((_, i) => block.data[(start + i) % n]!.id)};
}

export function regressionStaticFallback(block: RegressionChartBlock): string {
  return [block.label, block.description,
    ...block.data.map((p, i) => `${i + 1}: ${p.id}; ${p.x} ${block.xAxis.unit}; ${p.y} ${block.yAxis.unit}`),
    ...block.windows.map(w => `${w.label}; observations: ${w.datumIds.join(", ")}; mean absolute leave-one-out inverse-prediction error: ${regressionWindowResult(block, w).meanAbsoluteError} ${block.xAxis.unit}${w.cycleIntervalMs ? `; FIFO advances one observation every ${w.cycleIntervalMs} ms, wraps to the beginning, pause control available` : ""}`),
  ].join("\n");
}
