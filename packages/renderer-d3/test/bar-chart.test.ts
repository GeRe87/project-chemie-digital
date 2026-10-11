import assert from "node:assert/strict";
import test from "node:test";
import { barChartEmphasisDatumIds, barChartGeometryForDensity, barChartGrouping, createD3BarChartRenderModel } from "../src/bar-chart.ts";
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


test("semantic bar annotation overrides numeric maximum as the final emphasis", () => {
  const annotated: ChartBlock = {
    ...block,
    annotations: [{
      id: "annotation-a",
      kind: "point",
      datumId: "a",
      label: "Authored analytical focus",
      source: [{ resourceId: "annotation-a" }],
    }],
  };
  const result = createD3BarChartRenderModel(annotated);
  assert.ok(result.model);
  assert.deepEqual([...barChartEmphasisDatumIds(result.model)], ["a"]);
  assert.match(result.model.staticFallback, /Authored analytical focus/);
});

test("bar emphasis retains maximum fallback when no semantic annotation exists", () => {
  const result = createD3BarChartRenderModel(block);
  assert.ok(result.model);
  assert.deepEqual([...barChartEmphasisDatumIds(result.model)], ["c"]);
});


test("grouped bar render model preserves bundles and repeated categories", () => {
  const grouped: ChartBlock = {
    ...block,
    data: [
      { id: "s1-r1", group: "Site 1", category: "Replicate 1", value: 5.02, source: [{ resourceId: "s1-r1" }] },
      { id: "s1-r2", group: "Site 1", category: "Replicate 2", value: 4.96, source: [{ resourceId: "s1-r2" }] },
      { id: "s1-r3", group: "Site 1", category: "Replicate 3", value: 5.05, source: [{ resourceId: "s1-r3" }] },
      { id: "s2-r1", group: "Site 2", category: "Replicate 1", value: 4.98, source: [{ resourceId: "s2-r1" }] },
      { id: "s2-r2", group: "Site 2", category: "Replicate 2", value: 5.01, source: [{ resourceId: "s2-r2" }] },
      { id: "s2-r3", group: "Site 2", category: "Replicate 3", value: 4.95, source: [{ resourceId: "s2-r3" }] },
    ],
  };
  const result = createD3BarChartRenderModel(grouped);
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.model);
  assert.deepEqual(barChartGrouping(result.model), {
    groups: ["Site 1", "Site 2"],
    categories: ["Replicate 1", "Replicate 2", "Replicate 3"],
  });
  assert.match(result.model.staticFallback, /Site 1 \/ Replicate 1: 5\.02/);
});

test("bar renderer rejects partially grouped data", () => {
  const mixed: ChartBlock = {
    ...block,
    data: [
      { id: "a", group: "Site 1", category: "Replicate 1", value: 1, source: [{ resourceId: "a" }] },
      { id: "b", category: "Replicate 2", value: 2, source: [{ resourceId: "b" }] },
    ],
  };
  const result = createD3BarChartRenderModel(mixed);
  assert.equal(result.model, undefined);
  assert.match(result.diagnostics[0]?.message ?? "", /assign a group to every datum/);
});
