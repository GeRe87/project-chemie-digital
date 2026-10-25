import assert from "node:assert/strict";
import test from "node:test";
import { cyclicRegressionWindow, ordinaryLeastSquares, regressionWindowResult, validateRegressionChart, type RegressionChartBlock } from "../src/regression-chart.ts";
import { compareCalibrationWindows } from "../src/calibration-evaluation.ts";

const source = [{resourceId: "urn:unrelated:calibration"}];
const data = [0, 1, 2, 3, 4].map((x, i) => ({id: `point-${i}`, x, y: 2 * x + 1, source}));
const block: RegressionChartBlock = {id: "cal", kind: "chart", chartType: "regression", label: "Generic calibration", description: "Exact teaching coordinates", source,
  xAxis: {label: "Assigned mass", unit: "mg"}, yAxis: {label: "Response", unit: "a.u."}, data,
  windows: [{id: "window", label: "All five standards", datumIds: data.map(d => d.id), source}]};

test("ordinary least squares and held-out inverse prediction agree on an exact line", () => {
  validateRegressionChart(block);
  assert.deepEqual(ordinaryLeastSquares(data), {slope: 2, intercept: 1});
  assert.equal(regressionWindowResult(block, block.windows[0]!).meanAbsoluteError, 0);
});
test("invalid windows, missing predictor variation and zero inverse slopes fail closed", () => {
  assert.throws(() => ordinaryLeastSquares([{x: 1, y: 3}, {x: 1, y: 4}]), /variation/);
  assert.throws(() => validateRegressionChart({...block, windows: [{...block.windows[0]!, datumIds: ["missing", "point-1", "point-2"]}]}), /unknown observation/);
  assert.throws(() => validateRegressionChart({...block, data: data.map(d => ({...d, y: 1}))}), /nonzero slope/);
});

test("FIFO advances one member and wraps without changing window size", () => {
  const window = {...block.windows[0]!, datumIds:data.slice(0,3).map(d=>d.id), cycleIntervalMs:750};
  assert.deepEqual(cyclicRegressionWindow(block,window,1).datumIds, ["point-1","point-2","point-3"]);
  assert.deepEqual(cyclicRegressionWindow(block,window,4).datumIds, ["point-4","point-0","point-1"]);
  assert.deepEqual(cyclicRegressionWindow(block,window,5).datumIds, window.datumIds);
  validateRegressionChart({...block,windows:[window]});
});
test("neighbor calibration evaluation normalizes each replicate before averaging", () => {
  const calibration=Array.from({length:12},(_,x)=>({x,y:2*x+1}));
  const comparison=compareCalibrationWindows(calibration,[{response:5,sampleMass:2},{response:9,sampleMass:4},{response:13,sampleMass:6}],4,3,2,1000);
  assert.equal(comparison.local.mean,1000);assert.equal(comparison.ensemble.mean,1000);
  assert.equal(comparison.neighboring.length,5);assert.equal(comparison.ensemble.standardError,0);
  assert.throws(()=>compareCalibrationWindows(calibration,[{response:5,sampleMass:2},{response:9,sampleMass:4}],0,3,2,1000),/without duplicating/);
});
