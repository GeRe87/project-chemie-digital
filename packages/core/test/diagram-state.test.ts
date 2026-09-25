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

function sequenceDocument(version: SceneDocument["version"]): SceneDocument {
  return {
    version,
    id: "sequence-document",
    sourcePathId: "path",
    scenes: [{
      id: "sequence-scene",
      source,
      readingOrder: ["sequence"],
      blocks: [{
        id: "sequence",
        kind: "diagram",
        diagramType: "sequence",
        label: "Provider exchange",
        description: "Roles exchange an authored message.",
        source,
        nodes: [],
        edges: [],
        participantRoles: [{ id: "provider", label: "Provider", source }, { id: "consumer", label: "Consumer", source }],
        messages: [{ id: "discover", sourceRoleId: "provider", targetRoleId: "consumer", label: "discover", source }],
        states: [{ id: "bound", label: "Bound actors", source, sharedEdgeAnnotations: [], activeMessageIds: ["discover"], participantBindings: [{ roleId: "provider", participantId: "package", label: "Package Template", source }] }],
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

test("diagram state selections require owned identities and one focus target", () => {
  const document = documentWithState();
  const diagram = document.scenes[0]!.blocks[0]!;
  if (diagram.kind !== "diagram") throw new Error("Expected diagram");
  const grouped = { ...diagram, groups: [{ id: "domain", label: "Domain", source }, { id: "context", label: "Context", source }], nodes: [{ ...diagram.nodes[0]!, groupIds: ["domain"] }, { ...diagram.nodes[1]!, groupIds: ["context"] }], states: [{ ...diagram.states![0]!, activeNodeIds: ["first"], activeEdgeIds: ["left"], activeGroupIds: ["domain"], focusGroupId: "domain", contextGroupIds: ["context"] }] };
  assert.doesNotThrow(() => validateSceneDocument({ ...document, scenes: [{ ...document.scenes[0]!, blocks: [grouped] }] }));
  assert.throws(() => validateSceneDocument({ ...document, scenes: [{ ...document.scenes[0]!, blocks: [{ ...grouped, states: [{ ...grouped.states![0]!, focusNodeId: "first" }] }] }] }), /may focus one node or one group/);
});

test("flow diagrams remain valid in 1.1 and stateful flow diagrams remain valid in 1.2", () => {
  const stateful = documentWithState();
  const diagram = stateful.scenes[0]!.blocks[0]!;
  if (diagram.kind !== "diagram") throw new Error("Expected diagram");
  assert.doesNotThrow(() => validateSceneDocument({ ...stateful, version: "1.1", scenes: [{ ...stateful.scenes[0]!, blocks: [{ ...diagram, states: undefined }] }] }));
  assert.doesNotThrow(() => validateSceneDocument(stateful));
});

test("sequence diagrams and sequence state semantics require SceneDocument 1.3", () => {
  assert.throws(() => validateSceneDocument(sequenceDocument("1.2")), /sequence diagram requires SceneDocument 1.3/);
  assert.doesNotThrow(() => validateSceneDocument(sequenceDocument("1.3")));
});

test("non-sequence diagrams reject sequence-only participant and state semantics", () => {
  const document = documentWithState();
  const diagram = document.scenes[0]!.blocks[0]!;
  if (diagram.kind !== "diagram") throw new Error("Expected diagram");
  assert.throws(() => validateSceneDocument({ ...document, scenes: [{ ...document.scenes[0]!, blocks: [{ ...diagram, participantRoles: [{ id: "provider", label: "Provider", source }], messages: [{ id: "discover", sourceRoleId: "provider", targetRoleId: "provider", label: "discover", source }] }] }] }), /only sequence diagrams may define participant roles or messages/);
  assert.throws(() => validateSceneDocument({ ...document, scenes: [{ ...document.scenes[0]!, blocks: [{ ...diagram, states: [{ ...diagram.states![0]!, activeMessageIds: ["discover"] }] }] }] }), /only sequence diagrams may define active messages or participant bindings/);
});
