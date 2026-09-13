import assert from "node:assert/strict";
import test from "node:test";

import type { Scene } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";
import {
  semanticMultiViewProjection,
  semanticMultiViewStage,
  semanticTableModel,
} from "../src/semantic-multi-view-runtime.ts";

const scene: Scene = {
  id: "ex:scene-multi-view--scene",
  source: [{ resourceId: "ex:scene-multi-view" }],
  blocks: [
    {
      id: "ex:heading--block",
      kind: "prose",
      text: "Same Semantics, Different Views",
      source: [{ resourceId: "ex:concept" }],
      intent: { kind: "introduce" },
    },
    {
      id: "ex:code--block",
      kind: "code",
      language: "trig",
      code: "ex:chart a cd:ChartDefinition .",
      fallback: "ex:chart a cd:ChartDefinition .",
      editable: false,
      executable: false,
      source: [{ resourceId: "ex:code", relationPath: "cd:showsResource" }],
    },
    {
      id: "ex:chart-item--block",
      kind: "chart",
      chartType: "bar",
      label: "Service usage by provider type",
      description: "Illustrative workload",
      xAxis: { label: "Provider type" },
      yAxis: { label: "Relative workload" },
      data: [
        {
          id: "ex:obs-ingestion",
          category: "Data ingestion",
          value: 12,
          source: [{ resourceId: "ex:obs-ingestion", relationPath: "cd:numericValue" }],
        },
        {
          id: "ex:obs-analytics",
          category: "Analytics",
          value: 25,
          source: [{ resourceId: "ex:obs-analytics", relationPath: "cd:numericValue" }],
        },
      ],
      source: [{ resourceId: "ex:chart", relationPath: "cd:body" }],
    },
  ],
  readingOrder: ["ex:heading--block", "ex:code--block", "ex:chart-item--block"],
};

const snapshot: RdfDatasetSnapshot = {
  version: "1.0",
  identity: "sha256:test",
  entities: [],
  supportedPredicates: ["cd:showsResource"],
  source: [{ resourceId: "canonical-test" }],
  statements: [
    {
      sourceEntityId: "ex:code",
      predicateId: "cd:showsResource",
      targetEntityId: "ex:dataset",
      predicateLabel: "showsResource",
      source: [{ resourceId: "ex:code" }],
    },
    {
      sourceEntityId: "ex:code",
      predicateId: "cd:showsResource",
      targetEntityId: "ex:chart",
      predicateLabel: "showsResource",
      source: [{ resourceId: "ex:code" }],
    },
  ],
};

test("semantic multi-view projection requires an RDF showsResource link to the chart", () => {
  const projection = semanticMultiViewProjection(scene, snapshot);
  assert.equal(projection?.sceneId, scene.id);
  assert.equal(projection?.codeBlock.id, "ex:code--block");
  assert.equal(projection?.chartBlock.id, "ex:chart-item--block");

  const disconnected: RdfDatasetSnapshot = { ...snapshot, statements: snapshot.statements.slice(0, 1) };
  assert.equal(semanticMultiViewProjection(scene, disconnected), undefined);
});

test("semantic table projection preserves canonical bar observations", () => {
  const chart = scene.blocks.find((block) => block.kind === "chart");
  assert.ok(chart && chart.kind === "chart");
  const table = semanticTableModel(chart);
  assert.deepEqual(table.columns, ["Provider type", "Relative workload"]);
  assert.deepEqual(table.rows.map((row) => row.cells), [
    ["Data ingestion", "12"],
    ["Analytics", "25"],
  ]);
  assert.deepEqual(table.rows.map((row) => row.source[0]?.resourceId), [
    "ex:obs-ingestion",
    "ex:obs-analytics",
  ]);
});

test("semantic multi-view stage order is absolute and clamped", () => {
  assert.equal(semanticMultiViewStage(-4), "semantic");
  assert.equal(semanticMultiViewStage(0), "semantic");
  assert.equal(semanticMultiViewStage(1), "table");
  assert.equal(semanticMultiViewStage(2), "chart");
  assert.equal(semanticMultiViewStage(99), "chart");
});
