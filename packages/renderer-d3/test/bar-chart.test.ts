import assert from "node:assert/strict";
import test from "node:test";
import { barChartGeometryForDensity, createD3BarChartRenderModel } from "../src/bar-chart.ts";
import type { ChartBlock } from "../../core/src/scene-document.ts";
const block: ChartBlock = { id: "chart", kind: "chart", chartType: "bar", label: "Service usage by provider type", description: "Illustrative values, not measured telemetry", xAxis: { label: "Provider type" }, yAxis: { label: "Relative workload" }, data: [{ id: "a", category: "Data ingestion", value: 12, source: [{ resourceId: "a" }] }, { id: "b", category: "Signal processing", value: 18, source: [{ resourceId: "b" }] }, { id: "c", category: "Analytics", value: 25, source: [{ resourceId: "c" }] }, { id: "d", category: "Semantics", value: 14, source: [{ resourceId: "d" }] }, { id: "e", category: "Reporting", value: 9, source: [{ resourceId: "e" }] }], source: [{ resourceId: "chart-source" }] };
test("bar render model preserves canonical datum order and fallback", () => { const result = createD3BarChartRenderModel(block); assert.deepEqual(result.diagnostics, []); assert.ok(result.model); assert.deepEqual(result.model.data.map((datum) => datum.value), [12,18,25,14,9]); assert.match(result.model.staticFallback, /Data ingestion: 12/); assert.match(result.model.staticFallback, /Reporting: 9/); });

test("bar chart density geometry reduces chrome before evidence size", () => {
  const comfortable = barChartGeometryForDensity("comfortable");
  const dense = barChartGeometryForDensity("dense");
  const compact = barChartGeometryForDensity("compact");
  assert.ok(dense.minimumWidth < comfortable.minimumWidth);
  assert.ok(compact.minimumWidth < dense.minimumWidth);
  assert.ok(dense.margin.left < comfortable.margin.left);
  assert.ok(compact.margin.bottom < dense.margin.bottom);
  assert.ok(compact.minimumHeight < dense.minimumHeight);
});
