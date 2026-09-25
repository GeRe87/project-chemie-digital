import assert from "node:assert/strict";
import test from "node:test";

import type {
  DiagramBlock,
  LineChartBlock,
  Scene,
  SourceReference,
} from "../../../packages/core/src/scene-document.ts";
import {
  analyticalProofProjection,
  analyticalProofStepState,
  linearFlowNodeOrder,
} from "../src/analytical-proof-runtime.ts";

const source = (resourceId: string): readonly SourceReference[] => [{ resourceId }];

const chart: LineChartBlock = {
  kind: "chart",
  chartType: "line",
  id: "chart:proof",
  label: "One signal. Five explicit states.",
  description: "Trace to reusable result",
  source: source("ex:chart-proof"),
  xAxis: { label: "Retention time", unit: "min" },
  yAxis: { label: "Intensity", unit: "a.u." },
  series: [{
    id: "series:signal",
    label: "Signal",
    source: source("ex:dataset-signal"),
    data: [
      { id: "o1", x: 1, y: 2, source: source("ex:o1") },
      { id: "o2", x: 2, y: 5, source: source("ex:o2") },
    ],
  }],
  annotations: [
    { id: "a1", kind: "point", seriesId: "series:signal", datumId: "o1", label: "Baseline estimate", source: source("ex:a1") },
    { id: "a2", kind: "point", seriesId: "series:signal", datumId: "o2", label: "Peak apex / model anchor", source: source("ex:a2") },
    { id: "a3", kind: "x-range", seriesId: "series:signal", startDatumId: "o1", endDatumId: "o2", label: "Integration window", source: source("ex:a3") },
  ],
};

const flow: DiagramBlock = {
  kind: "diagram",
  diagramType: "flow",
  id: "flow:proof",
  label: "Result lineage",
  description: "Raw signal to FAIR artifact",
  source: source("ex:flow-proof"),
  nodes: [
    { id: "raw", label: "RAW SIGNAL", source: source("ex:raw") },
    { id: "baseline", label: "BASELINE ESTIMATE", source: source("ex:baseline") },
    { id: "model", label: "ASYMMETRIC MODEL", source: source("ex:model") },
    { id: "quantified", label: "AREA + UNCERTAINTY", source: source("ex:quantified") },
    { id: "fair", label: "FAIR ARTIFACT", source: source("ex:fair") },
  ],
  edges: [
    { id: "e1", sourceNodeId: "raw", targetNodeId: "baseline", label: "estimate", source: source("ex:e1") },
    { id: "e2", sourceNodeId: "baseline", targetNodeId: "model", label: "model", source: source("ex:e2") },
    { id: "e3", sourceNodeId: "model", targetNodeId: "quantified", label: "quantify", source: source("ex:e3") },
    { id: "e4", sourceNodeId: "quantified", targetNodeId: "fair", label: "package", source: source("ex:e4") },
  ],
};

const scene: Scene = {
  id: "scene:proof",
  source: source("ex:scene-proof"),
  blocks: [
    {
      kind: "prose",
      id: "heading",
      source: source("ex:proof"),
      text: "From Raw Signal to Reusable Result",
      intent: { kind: "introduce" },
    },
    chart,
    flow,
  ],
  readingOrder: ["heading", chart.id, flow.id],
};

test("linear analytical lineage preserves semantic node order", () => {
  assert.deepEqual(linearFlowNodeOrder(flow), ["raw", "baseline", "model", "quantified", "fair"]);
});

test("analytical proof projection pairs four chart reveals with a five-stage result lineage", () => {
  const projection = analyticalProofProjection(scene);
  assert.ok(projection);
  assert.equal(projection.chartBlock.id, chart.id);
  assert.equal(projection.flowBlock.id, flow.id);
  assert.equal(projection.stepCount, 5);
  assert.deepEqual(projection.flowNodeOrder, ["raw", "baseline", "model", "quantified", "fair"]);
});

test("final FAIR step freezes the fully interpreted chart while advancing the lineage", () => {
  assert.deepEqual(analyticalProofStepState(0, 4, 5), { step: 0, chartStep: 0, flowStep: 0 });
  assert.deepEqual(analyticalProofStepState(1, 4, 5), { step: 1, chartStep: 1, flowStep: 1 });
  assert.deepEqual(analyticalProofStepState(4, 4, 5), { step: 4, chartStep: 4, flowStep: 4 });
  assert.deepEqual(analyticalProofStepState(5, 4, 5), { step: 5, chartStep: 4, flowStep: 5 });
  assert.deepEqual(analyticalProofStepState(99, 4, 5), { step: 5, chartStep: 4, flowStep: 5 });
});

test("branched flow diagrams do not accidentally opt into analytical proof synchronization", () => {
  const branched: DiagramBlock = {
    ...flow,
    nodes: [...flow.nodes, { id: "side", label: "SIDE", source: source("ex:side") }],
    edges: [
      ...flow.edges,
      { id: "branch", sourceNodeId: "raw", targetNodeId: "side", label: "branch", source: source("ex:branch") },
    ],
  };
  assert.equal(linearFlowNodeOrder(branched), undefined);
});
