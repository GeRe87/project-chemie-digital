import assert from "node:assert/strict";
import test from "node:test";

import { createD3LineChartRenderModel } from "../src/line-chart.ts";
import type { LineChartBlock } from "../../core/src/scene-document.ts";

const block: LineChartBlock = {
  id: "chromatogram",
  kind: "chart",
  chartType: "line",
  label: "Chromatogram Example",
  description: "Synthetic illustrative signal; not measured experimental data",
  xAxis: { label: "Retention time", unit: "min" },
  yAxis: { label: "Intensity", unit: "a.u." },
  series: [{
    id: "signal",
    label: "Illustrative chromatographic signal",
    source: [{ resourceId: "signal" }],
    data: [
      { id: "p1", x: 4.0, y: 5, source: [{ resourceId: "p1" }] },
      { id: "p2", x: 4.4, y: 12, source: [{ resourceId: "p2" }] },
      { id: "p3", x: 4.8, y: 100, source: [{ resourceId: "p3" }] },
      { id: "p4", x: 5.2, y: 25, source: [{ resourceId: "p4" }] },
    ],
  }],
  annotations: [
    {
      id: "apex",
      kind: "point",
      seriesId: "signal",
      datumId: "p3",
      label: "Peak apex",
      source: [{ resourceId: "apex" }],
    },
    {
      id: "area",
      kind: "x-range",
      seriesId: "signal",
      startDatumId: "p2",
      endDatumId: "p4",
      label: "Integrated area",
      source: [{ resourceId: "area" }],
    },
  ],
  source: [{ resourceId: "chart" }],
};

test("line render model preserves scientific coordinates and annotations", () => {
  const result = createD3LineChartRenderModel(block);
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.model);
  assert.deepEqual(
    result.model.series[0]!.data.map((datum) => [datum.x, datum.y]),
    [[4.0, 5], [4.4, 12], [4.8, 100], [5.2, 25]],
  );
  assert.deepEqual(
    result.model.annotations.map((annotation) => annotation.label),
    ["Peak apex", "Integrated area"],
  );
  assert.match(result.model.staticFallback, /x=4.8 min/);
  assert.match(result.model.staticFallback, /Peak apex/);
});
