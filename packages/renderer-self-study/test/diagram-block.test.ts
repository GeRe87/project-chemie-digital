import assert from "node:assert/strict";
import test from "node:test";

import type { SceneDocument } from "../../core/src/scene-document.ts";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../src/index.ts";

const document: SceneDocument = {
  version: "1.1",
  id: "scene-document:flow",
  sourcePathId: "ex:path-flow",
  scenes: [{
    id: "scene:flow",
    source: [{ resourceId: "ex:flow-scene", provenanceIds: ["graph:flow-scene"] }],
    accessibility: { label: "Analytical process" },
    readingOrder: ["block:flow"],
    blocks: [{
      id: "block:flow",
      kind: "diagram",
      source: [{ resourceId: "ex:flow", provenanceIds: ["graph:flow"], relationPath: "cd:body" }],
      diagramType: "flow",
      label: "Analytical process",
      description: "Measurement produces data for processing.",
      focusNodeId: "node:processing",
      nodes: [
        {
          id: "node:measurement",
          label: "Measurement",
          source: [{ resourceId: "ex:measurement", provenanceIds: ["graph:flow"], relationPath: "skos:prefLabel@en" }],
        },
        {
          id: "node:processing",
          label: "Data processing",
          source: [{ resourceId: "ex:processing", provenanceIds: ["graph:flow"], relationPath: "skos:prefLabel@en" }],
          emphasis: "primary",
        },
      ],
      edges: [{
        id: "edge:data",
        sourceNodeId: "node:measurement",
        targetNodeId: "node:processing",
        label: "produces data for",
        source: [{ resourceId: "ex:edge-data", provenanceIds: ["graph:flow"], relationPath: "skos:prefLabel@en" }],
      }],
    }],
  }],
};

test("self-study 1.1 preserves flow structure, provenance and reading order", () => {
  const result = createSelfStudyRenderPlan(document);
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.plan);
  assert.equal(result.plan.version, "1.1");
  const node = result.plan.sections[0]!.nodes[0]!;
  assert.equal(node.kind, "diagram");
  if (node.kind !== "diagram") throw new Error("expected diagram plan");
  assert.equal(node.focusNodeId, "node:processing");
  assert.deepEqual(node.source, document.scenes[0]!.blocks[0]!.source);
  assert.deepEqual(node.nodes.map((item) => item.id), ["node:measurement", "node:processing"]);
  assert.deepEqual(node.edges.map((item) => item.id), ["edge:data"]);
  assert.match(node.staticFallback, /Measurement — produces data for → Data processing/);
});

test("self-study HTML exposes a complete non-D3 diagram fallback with source identities", () => {
  const plan = createSelfStudyRenderPlan(document).plan!;
  const html = renderSelfStudyHtml(plan, { interactive: false });
  assert.match(html, /class="self-study-diagram"/);
  assert.match(html, /data-diagram-node-id="node:measurement"/);
  assert.match(html, /data-diagram-node-id="node:processing"/);
  assert.match(html, /data-diagram-edge-id="edge:data"/);
  assert.match(html, /data-resource-id="ex:edge-data"/);
  assert.match(html, /data-relation-path="skos:prefLabel@en"/);
  assert.match(html, /Measurement — produces data for → Data processing/);
});

test("legacy SceneDocument 1.0 remains self-study compatible", () => {
  const legacy: SceneDocument = {
    version: "1.0",
    id: "scene-document:legacy",
    sourcePathId: "ex:path-legacy",
    scenes: [{
      id: "scene:legacy",
      source: [{ resourceId: "ex:legacy" }],
      accessibility: { label: "Legacy" },
      blocks: [{ id: "block:legacy", kind: "prose", source: [{ resourceId: "ex:legacy" }], text: "Legacy content" }],
      readingOrder: ["block:legacy"],
    }],
  };
  const result = createSelfStudyRenderPlan(legacy);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.plan?.sections[0]?.nodes[0]?.kind, "prose");
});
