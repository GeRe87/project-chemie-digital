import assert from "node:assert/strict";
import test from "node:test";
import { validateSceneDocument, type SceneDocument } from "../src/scene-document.ts";

const source = [{ resourceId: "resource" }];

function documentWithState(): SceneDocument {
  return {
    version: "1.2",
    id: "document",
    sourcePathId: "path",
    scenes: [{
      id: "scene",
      source,
      readingOrder: ["diagram"],
      blocks: [{
        id: "diagram",
        kind: "diagram",
        diagramType: "flow",
        label: "Workflow",
        description: "An authored shared state.",
        source,
        nodes: [{ id: "first", label: "First", source }, { id: "second", label: "Second", source }],
        edges: [{ id: "left", sourceNodeId: "first", targetNodeId: "second", label: "go", source }, { id: "right", sourceNodeId: "second", targetNodeId: "first", label: "return", source }],
        states: [{ id: "shared", label: "Shared", source, sharedEdgeAnnotations: [{ id: "annotation", label: "Both edges share an authored state.", edgeIds: ["left", "right"], source }] }],
      }],
    }],
  };
}

test("SceneDocument 1.2 accepts authored diagram states and shared edge annotations", () => {
  assert.doesNotThrow(() => validateSceneDocument(documentWithState()));
});

test("diagram state annotations fail closed without two explicit known edge identities", () => {
  const document = documentWithState();
  const diagram = document.scenes[0]!.blocks[0]!;
  if (diagram.kind !== "diagram") throw new Error("Expected diagram");
  const invalid = { ...document, scenes: [{ ...document.scenes[0]!, blocks: [{ ...diagram, states: [{ ...diagram.states![0]!, sharedEdgeAnnotations: [{ ...diagram.states![0]!.sharedEdgeAnnotations[0]!, edgeIds: ["unknown"] }] }] }] }] };
  assert.throws(() => validateSceneDocument(invalid), /at least two unique edges/);
});

test("diagram states require SceneDocument 1.2 while 1.0 and 1.1 remain valid without them", () => {
  const document = documentWithState();
  assert.throws(() => validateSceneDocument({ ...document, version: "1.1" }), /diagram states require SceneDocument 1.2/);
});
