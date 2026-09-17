import assert from "node:assert/strict";
import test from "node:test";
import { createD3SequenceLayout, createD3SequenceRenderModel, mountD3SequenceDiagram, resolveD3SequenceState, sequenceLayoutDataAttributes, type D3SequenceRuntimePort } from "../src/sequence-diagram.ts";
import type { DiagramBlock } from "../../core/src/scene-document.ts";

const source = [{ resourceId: "fixture" }];
const fixture: DiagramBlock = {
  id: "client-registry-runtime-consumer", kind: "diagram", diagramType: "sequence", label: "Client registry runtime consumer", description: "Generic interaction fixture.", source,
  nodes: [], edges: [],
  participantRoles: ["Client", "Registry", "Runtime", "Consumer"].map((label, index) => ({ id: label.toLowerCase(), label, source: [{ resourceId: `role-${index}` }] })),
  messages: [
    { id: "discover", sourceRoleId: "client", targetRoleId: "registry", label: "discover", source },
    { id: "resolve", sourceRoleId: "registry", targetRoleId: "runtime", label: "resolve", source },
    { id: "provide", sourceRoleId: "runtime", targetRoleId: "consumer", label: "provide", source },
  ],
  states: [{ id: "bound", label: "Bound actors", source, sharedEdgeAnnotations: [], activeMessageIds: ["discover", "resolve", "provide"], participantBindings: [
    { roleId: "client", participantId: "template", label: "Template", source }, { roleId: "consumer", participantId: "web-ui", label: "Web UI", source },
  ] }],
};

test("generic Client Registry Runtime Consumer sequence preserves substitutions and deterministic wide/narrow geometry", () => {
  const result = createD3SequenceRenderModel(fixture, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok(result.model);
  if (!result.model) return;
  const wide = createD3SequenceLayout(result.model, 960); const narrow = createD3SequenceLayout(result.model, 480);
  assert.equal(wide.compact, false); assert.equal(narrow.compact, true);
  assert.deepEqual(wide.lanes.map((lane) => lane.roleId), ["client", "registry", "runtime", "consumer"]);
  assert.deepEqual(result.model.states[0]?.participantBindings?.map((binding) => binding.label), ["Template", "Web UI"]);
  assert.deepEqual(createD3SequenceLayout(result.model, 960), wide);
  assert.ok(wide.lanes.every((lane, index) => index === 0 || lane.x > wide.lanes[index - 1]!.x));
  assert.ok(wide.messages.every((message, index) => index === 0 || message.y > wide.messages[index - 1]!.y));
  assert.ok(narrow.messages.every((message) => message.y >= 106 && message.y <= narrow.height));
  assert.match(result.model.staticFallback, /Template/);
  assert.match(sequenceLayoutDataAttributes(narrow).join(" "), /mode:compact/);
});

test("sequence runtime mounts deterministic layout and applies only authored message states", () => {
  const updates: Array<{ width: number; stateId: string | undefined }> = [];
  const runtime: D3SequenceRuntimePort = {
    measureHost() { return 960; },
    mount(_host, _model, layout, stateId) { updates.push({ width: layout.width, stateId }); return { update(next, nextStateId) { updates.push({ width: next.width, stateId: nextStateId }); }, destroy() {} }; },
  };
  const component = mountD3SequenceDiagram({}, fixture, { reducedMotion: true, interactionPolicy: "static" }, runtime);
  assert.ok("model" in component && !("diagnostics" in component));
  if (!("model" in component) || "diagnostics" in component) return;
  component.setActiveState("bound");
  component.resize(480);
  assert.deepEqual(updates, [{ width: 960, stateId: undefined }, { width: 960, stateId: "bound" }, { width: 480, stateId: "bound" }]);
  assert.deepEqual([...resolveD3SequenceState(component.model, "bound").activeMessageIds], ["discover", "resolve", "provide"]);
});
