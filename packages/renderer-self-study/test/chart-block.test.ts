import assert from "node:assert/strict";
import test from "node:test";
import type { SceneDocument } from "../../core/src/scene-document.ts";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../src/index.ts";

test("bar charts remain structured and render as semantic static tables", () => {
  const document: SceneDocument = {
    version: "1.2",
    id: "scene-document:self-study-bar-chart",
    sourcePathId: "path:self-study-bar-chart",
    scenes: [{
      id: "scene:bar-chart",
      source: [{ resourceId: "resource:scene" }],
      blocks: [{
        id: "block:bar-chart",
        kind: "chart",
        chartType: "bar",
        label: "Measured response",
        description: "Three observations",
        xAxis: { label: "Sample" },
        yAxis: { label: "Response", unit: "AU" },
        data: [
          { id: "datum:a", category: "A", value: 1.2, source: [{ resourceId: "resource:datum:a" }] },
          { id: "datum:b", category: "B", value: 2.4, source: [{ resourceId: "resource:datum:b" }] },
        ],
        annotations: [{
          id: "annotation:b",
          kind: "point",
          datumId: "datum:b",
          label: "Largest response",
          source: [{ resourceId: "resource:annotation:b" }],
        }],
        source: [{ resourceId: "resource:bar-chart" }],
      }],
      readingOrder: ["block:bar-chart"],
    }],
  };

  const result = createSelfStudyRenderPlan(document);
  assert.deepEqual(result.diagnostics, []);
  const node = result.plan!.sections[0]!.nodes[0]!;
  assert.equal(node.kind, "chart");
  if (node.kind !== "chart" || node.chartType !== "bar") throw new Error("expected bar chart");
  assert.equal(node.data[1]!.value, 2.4);
  assert.equal(node.annotations?.[0]?.label, "Largest response");

  const html = renderSelfStudyHtml(result.plan!, { interactive: false });
  assert.match(html, /data-chart-type="bar"/);
  assert.match(html, /data-chart-datum-id="datum:b"/);
  assert.match(html, /Response/);
  assert.match(html, /Largest response/);
});

test("line charts preserve series, points and range annotations in static output", () => {
  const document: SceneDocument = {
    version: "1.2",
    id: "scene-document:self-study-line-chart",
    sourcePathId: "path:self-study-line-chart",
    scenes: [{
      id: "scene:line-chart",
      source: [{ resourceId: "resource:scene" }],
      blocks: [{
        id: "block:line-chart",
        kind: "chart",
        chartType: "line",
        label: "Calibration",
        description: "Illustrative response curve",
        xAxis: { label: "Concentration", unit: "mg/L" },
        yAxis: { label: "Signal", unit: "AU" },
        series: [{
          id: "series:calibration",
          label: "Calibration series",
          source: [{ resourceId: "resource:series" }],
          data: [
            { id: "point:1", x: 1, y: 0.1, source: [{ resourceId: "resource:point:1" }] },
            { id: "point:2", x: 2, y: 0.2, source: [{ resourceId: "resource:point:2" }] },
          ],
        }],
        annotations: [{
          id: "annotation:range",
          kind: "x-range",
          seriesId: "series:calibration",
          startDatumId: "point:1",
          endDatumId: "point:2",
          label: "Working range",
          source: [{ resourceId: "resource:annotation:range" }],
        }],
        source: [{ resourceId: "resource:line-chart" }],
      }],
      readingOrder: ["block:line-chart"],
    }],
  };

  const result = createSelfStudyRenderPlan(document);
  assert.deepEqual(result.diagnostics, []);
  const node = result.plan!.sections[0]!.nodes[0]!;
  assert.equal(node.kind, "chart");
  if (node.kind !== "chart" || node.chartType !== "line") throw new Error("expected line chart");
  assert.equal(node.series[0]!.data[1]!.y, 0.2);
  assert.equal(node.annotations?.[0]?.kind, "x-range");

  const html = renderSelfStudyHtml(result.plan!, { interactive: false });
  assert.match(html, /data-chart-type="line"/);
  assert.match(html, /data-chart-series-id="series:calibration"/);
  assert.match(html, /data-chart-datum-id="point:2"/);
  assert.match(html, /Working range/);
});
