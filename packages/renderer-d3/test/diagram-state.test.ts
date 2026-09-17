import assert from "node:assert/strict";
import test from "node:test";
import { createD3FlowRenderModel, mountD3FlowDiagram, type D3FlowRuntimePort } from "../src/flow-diagram.ts";
import { createD3FlowLayout } from "../src/flow-layout.ts";
import type { DiagramBlock } from "../../core/src/scene-document.ts";

const source = [{ resourceId: "resource" }];
const block: DiagramBlock = {
  id: "diagram", kind: "diagram", diagramType: "flow", label: "Workflow", description: "State test", source,
  nodes: [{ id: "first", label: "First", source }, { id: "second", label: "Second", source }],
  edges: [{ id: "left", sourceNodeId: "first", targetNodeId: "second", label: "left", source }, { id: "right", sourceNodeId: "second", targetNodeId: "first", label: "right", source }],
  states: [{ id: "shared", label: "Shared", source, sharedEdgeAnnotations: [{ id: "annotation", label: "Explicitly shared", edgeIds: ["left", "right"], source }] }],
};

test("D3 preserves authored state and shared-edge identities without label inference", () => {
  const result = createD3FlowRenderModel(block, { reducedMotion: true, interactionPolicy: "keyboard" });
  assert.ok(result.model);
  assert.deepEqual(result.model?.states, block.states);
  assert.match(result.model?.staticFallback ?? "", /Explicitly shared/);
  assert.deepEqual(createD3FlowLayout(result.model!, 960).states, [{ id: "shared", sharedEdgeAnnotations: [{ id: "annotation", edgeIds: ["left", "right"] }] }]);
});

test("D3 rejects a shared-edge annotation that names an unknown edge", () => {
  const result = createD3FlowRenderModel({ ...block, states: [{ ...block.states![0]!, sharedEdgeAnnotations: [{ ...block.states![0]!.sharedEdgeAnnotations[0]!, edgeIds: ["left", "missing"] }] }] }, { reducedMotion: true, interactionPolicy: "static" });
  assert.equal(result.diagnostics[0]?.code, "INVALID_FLOW_DIAGRAM");
});

test("D3 exposes explicit state changes through the runtime API", () => {
  let stateChange: ((stateId?: string) => void) | undefined;
  const runtime: D3FlowRuntimePort = {
    measureHost() { return 960; },
    mount(_host, _model, _layout, _nodeId, _stateId, onActiveStateChange) {
      stateChange = onActiveStateChange;
      return { update() {}, focusNode() {}, destroy() {} };
    },
  };
  const mounted = mountD3FlowDiagram({}, block, { reducedMotion: true, interactionPolicy: "keyboard" }, runtime);
  assert.ok(!("diagnostics" in mounted));
  if ("diagnostics" in mounted) return;
  stateChange?.("shared");
  assert.equal(mounted.activeStateId, "shared");
  stateChange?.();
  assert.equal(mounted.activeStateId, undefined);
});
