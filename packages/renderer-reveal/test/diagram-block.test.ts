import assert from "node:assert/strict";
import test from "node:test";

import type { SceneDocument } from "../../core/src/scene-document.ts";
import { createPitchComponentDocument, createRevealRenderPlan } from "../src/index.ts";

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

test("Reveal 1.1 preserves a complete static flow diagram instead of rejecting the primitive", () => {
  const result = createRevealRenderPlan(document, { reducedMotion: false, interactionPolicy: "static" });
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.plan);
  assert.equal(result.plan.version, "1.1");
  const node = result.plan.sections[0]!.nodes[0]!;
  assert.equal(node.kind, "diagram");
  if (node.kind !== "diagram") throw new Error("expected diagram plan");
  assert.equal(node.diagramType, "flow");
  assert.equal(node.focusNodeId, "node:processing");
  assert.deepEqual(node.source, document.scenes[0]!.blocks[0]!.source);
  assert.deepEqual(node.nodes[1]!.source, [{ resourceId: "ex:processing", provenanceIds: ["graph:flow"], relationPath: "skos:prefLabel@en" }]);
  assert.deepEqual(node.edges[0]!.source, [{ resourceId: "ex:edge-data", provenanceIds: ["graph:flow"], relationPath: "skos:prefLabel@en" }]);
  assert.match(node.staticFallback, /Measurement — produces data for → Data processing/);
});

test("Pitch component projection retains the diagram as readable renderer-owned content", () => {
  const plan = createRevealRenderPlan(document, { reducedMotion: true, interactionPolicy: "static" }).plan!;
  const componentDocument = createPitchComponentDocument(plan);
  const component = componentDocument.sections[0]!.components[0]!;
  assert.equal(component.kind, "diagram");
  assert.match(component.staticFallback, /Analytical process/);
  assert.match(component.staticFallback, /Data processing/);
  assert.deepEqual(component.sourceResourceIds, ["ex:flow"]);
});

test("legacy SceneDocument 1.0 remains accepted when it does not contain diagrams", () => {
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
  const result = createRevealRenderPlan(legacy, { reducedMotion: false, interactionPolicy: "static" });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.plan?.sections[0]?.nodes[0]?.kind, "prose");
});
