import test from "node:test";
import assert from "node:assert/strict";
import { validateSceneDocument, timelineStaticFallback, type TimelineChartBlock } from "../src/scene-document.ts";

const source = [{resourceId: "urn:source:generic-schedule"}];
const identity = (id: string) => ({id, label: id, source});
const chart: TimelineChartBlock = {
  ...identity("chart"), kind: "chart", chartType: "timeline", description: "Unrelated generic laboratory schedule",
  xAxis: {label: "Elapsed time", unit: "s"}, yAxis: {label: "Resource"}, categories: [identity("wash")],
  scenarios: [{...identity("routine"), lanes: [{...identity("washer"), intervals: [
    {...identity("run-a"), start: 0, end: 20, categoryId: "wash"},
    {...identity("run-b"), start: 25, end: 45, categoryId: "wash"},
  ]}]}],
};
const document = {version: "1.13" as const, id: "doc", sourcePathId: "path", scenes: [
  {id: "scene", source, blocks: [chart], readingOrder: [chart.id]},
]};

test("timeline accepts unrelated semantic identities and exports all bounds", () => {
  validateSceneDocument(document);
  assert.match(timelineStaticFallback(chart), /washer; run-b: 25–45 s; wash/);
  assert.throws(() => validateSceneDocument({...document, version: "1.12"}), /1.13/);
});
test("timeline rejects overlaps, nonfinite bounds and unknown categories", () => {
  for (const change of [{start: 19}, {end: Infinity}, {categoryId: "unknown"}]) {
    const broken = structuredClone(document);
    Object.assign(broken.scenes[0].blocks[0].scenarios[0].lanes[0].intervals[1], change);
    assert.throws(() => validateSceneDocument(broken), /Timeline intervals/);
  }
});
