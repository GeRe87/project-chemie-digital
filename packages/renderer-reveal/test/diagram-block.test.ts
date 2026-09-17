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

function sequenceDocument(): SceneDocument {
  const source = [{ resourceId: "ex:sequence", provenanceIds: ["graph:sequence"] }];
  return {
    version: "1.3", id: "scene-document:sequence", sourcePathId: "ex:path-sequence", scenes: [{
      id: "scene:sequence", source, accessibility: { label: "Provider exchange" }, readingOrder: ["block:sequence"], blocks: [{
        id: "block:sequence", kind: "diagram", source, diagramType: "sequence", label: "Provider exchange", description: "An authored service exchange.", nodes: [], edges: [],
        participantRoles: [{ id: "provider", label: "Provider", source }, { id: "database", label: "Database", source }],
        messages: [{ id: "discover", sourceRoleId: "provider", targetRoleId: "database", label: "discover", source }],
        states: [{ id: "state:bound", label: "Bound provider", source, sharedEdgeAnnotations: [], activeMessageIds: ["discover"], participantBindings: [{ roleId: "provider", participantId: "package-template", label: "Package Template", source: [{ resourceId: "ex:binding", provenanceIds: ["graph:binding"] }] }] }],
      }],
    }],
  };
}

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

test("Reveal 1.2 preserves authored shared-edge states in its static fallback", () => {
  const diagram = document.scenes[0]!.blocks[0]!;
  if (diagram.kind !== "diagram") throw new Error("expected diagram");
  const stateDocument: SceneDocument = {
    ...document,
    version: "1.2",
    scenes: [{ ...document.scenes[0]!, blocks: [{
      ...diagram,
      edges: [...diagram.edges, { ...diagram.edges[0]!, id: "edge:reprocess", sourceNodeId: "node:processing", targetNodeId: "node:measurement" }],
      states: [{ id: "state:custom-script", label: "Shared custom script", source: diagram.source, sharedEdgeAnnotations: [{ id: "annotation:custom-script", label: "Both routes use one custom script.", edgeIds: ["edge:data", "edge:reprocess"], source: diagram.source }] }],
    }] }],
  };
  const result = createRevealRenderPlan(stateDocument, { reducedMotion: true, interactionPolicy: "static" });
  assert.deepEqual(result.diagnostics, []);
  const node = result.plan?.sections[0]?.nodes[0];
  assert.ok(node && node.kind === "diagram");
  if (!node || node.kind !== "diagram") return;
  assert.equal(node.states?.[0]?.id, "state:custom-script");
  assert.match(node.staticFallback, /Both routes use one custom script/);
});

test("Reveal 1.3 preserves cloned sequence state semantics and readable fallback content", () => {
  const sequence = sequenceDocument();
  const result = createRevealRenderPlan(sequence, { reducedMotion: true, interactionPolicy: "static" });
  assert.deepEqual(result.diagnostics, []);
  const node = result.plan?.sections[0]?.nodes[0];
  assert.ok(node && node.kind === "diagram");
  if (!node || node.kind !== "diagram") return;
  const state = node.states?.[0];
  const authoredState = (sequence.scenes[0]!.blocks[0]! as Extract<SceneDocument["scenes"][number]["blocks"][number], { kind: "diagram" }>).states![0]!;
  assert.deepEqual(state?.activeMessageIds, ["discover"]);
  assert.deepEqual(state?.participantBindings, authoredState.participantBindings);
  assert.notEqual(state?.activeMessageIds, authoredState.activeMessageIds);
  assert.notEqual(state?.participantBindings, authoredState.participantBindings);
  assert.notEqual(state?.participantBindings?.[0]?.source, authoredState.participantBindings?.[0]?.source);
  assert.match(node.staticFallback, /Participants:\n- Provider\n- Database/);
  assert.match(node.staticFallback, /Provider — discover → Database/);
  assert.match(node.staticFallback, /Active messages: discover/);
  assert.match(node.staticFallback, /Provider: Package Template/);
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
