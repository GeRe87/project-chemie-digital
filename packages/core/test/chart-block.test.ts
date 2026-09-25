import assert from "node:assert/strict";
import test from "node:test";
import { SCENE_DOCUMENT_CHART_VERSION, validateSceneDocument, type SceneDocument } from "../src/scene-document.ts";
function chartDocument(): SceneDocument { return { version: SCENE_DOCUMENT_CHART_VERSION, id: "doc", sourcePathId: "path", scenes: [{ id: "scene", source: [{ resourceId: "scene-source" }], readingOrder: ["chart"], blocks: [{ id: "chart", kind: "chart", chartType: "bar", label: "Service usage by provider type", description: "Illustrative values", xAxis: { label: "Provider type" }, yAxis: { label: "Relative workload" }, data: [{ id: "a", category: "Data ingestion", value: 12, source: [{ resourceId: "a" }] }, { id: "b", category: "Analytics", value: 25, source: [{ resourceId: "b" }] }], source: [{ resourceId: "chart-source" }] }] }] }; }
test("SceneDocument 1.2 accepts canonical bar ChartBlock", () => assert.doesNotThrow(() => validateSceneDocument(chartDocument())));
test("bar ChartBlock fails closed on non-finite values", () => { const document = chartDocument(); const chart = document.scenes[0]!.blocks[0]!; assert.equal(chart.kind, "chart"); (chart.data as unknown as Array<{ value: number }>)[0]!.value = Number.NaN; assert.throws(() => validateSceneDocument(document), /must be finite/); });


test("SceneDocument 1.2 accepts a source-linked line chart with point and range annotations", () => {
  const document: SceneDocument = {
    version: SCENE_DOCUMENT_CHART_VERSION,
    id: "line-doc",
    sourcePathId: "path",
    scenes: [{
      id: "scene",
      source: [{ resourceId: "scene-source" }],
      readingOrder: ["line"],
      blocks: [{
        id: "line",
        kind: "chart",
        chartType: "line",
        label: "Chromatogram Example",
        description: "Synthetic illustrative signal",
        xAxis: { label: "Retention time", unit: "min" },
        yAxis: { label: "Intensity", unit: "a.u." },
        series: [{
          id: "series",
          label: "Illustrative chromatographic signal",
          source: [{ resourceId: "series" }],
          data: [
            { id: "p1", x: 4.0, y: 5, source: [{ resourceId: "p1" }] },
            { id: "p2", x: 4.8, y: 100, source: [{ resourceId: "p2" }] },
            { id: "p3", x: 5.2, y: 25, source: [{ resourceId: "p3" }] },
          ],
        }],
        annotations: [
          {
            id: "a1",
            kind: "point",
            seriesId: "series",
            datumId: "p2",
            label: "Peak apex",
            source: [{ resourceId: "a1" }],
          },
          {
            id: "a2",
            kind: "x-range",
            seriesId: "series",
            startDatumId: "p1",
            endDatumId: "p3",
            label: "Integrated area",
            source: [{ resourceId: "a2" }],
          },
        ],
        source: [{ resourceId: "line-source" }],
      }],
    }],
  };

  assert.doesNotThrow(() => validateSceneDocument(document));
});
