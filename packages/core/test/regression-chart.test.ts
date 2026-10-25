import assert from "node:assert/strict";
import test from "node:test";
import { ordinaryLeastSquares, regressionWindowResult, validateRegressionChart, type RegressionChartBlock } from "../src/regression-chart.ts";

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
