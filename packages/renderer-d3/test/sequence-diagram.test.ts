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
  assert.ok(narrow.lanes.every((lane, index) => index === 0 || lane.y > narrow.lanes[index - 1]!.y));
  assert.ok(narrow.messages.every((message) => message.y >= 24 && message.y <= narrow.height));
  assert.match(result.model.staticFallback, /Template/);
  assert.match(sequenceLayoutDataAttributes(narrow).join(" "), /mode:compact/);
});

test("compact sequence layout stacks participants vertically without overlap", () => {
  const result = createD3SequenceRenderModel(fixture, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok(result.model);
  if (!result.model) return;
  const compact = createD3SequenceLayout(result.model, 480);
  assert.equal(compact.compact, true);
  const cardHeight = 32;
  for (let index = 0; index < compact.lanes.length; index += 1) {
    const lane = compact.lanes[index]!;
    assert.equal(lane.x, 240);
    assert.ok(lane.y > 0);
    if (index > 0) {
      const previous = compact.lanes[index - 1]!;
      assert.ok(lane.y - previous.y >= cardHeight + 16, "participants must not overlap vertically");
    }
  }
});

test("compact sequence layout places messages meaningfully between source and target participants", () => {
  const result = createD3SequenceRenderModel(fixture, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok(result.model);
  if (!result.model) return;
  const compact = createD3SequenceLayout(result.model, 480);
  const laneById = new Map(compact.lanes.map((lane) => [lane.roleId, lane]));
  for (const message of compact.messages) {
    const source = laneById.get(message.sourceRoleId)!;
    const target = laneById.get(message.targetRoleId)!;
    const minY = Math.min(source.y, target.y);
    const maxY = Math.max(source.y, target.y);
    assert.ok(message.y > minY, `message ${message.id} must be below its upper participant`);
    assert.ok(message.y < maxY, `message ${message.id} must be above its lower participant`);
    assert.equal(message.sourceX, source.x);
    assert.equal(message.targetX, target.x);
  }
});

test("compact sequence self-message stays beside its participant", () => {
  const selfFixture: DiagramBlock = {
    ...fixture,
    messages: [{ id: "self", sourceRoleId: "client", targetRoleId: "client", label: "self-call", source }],
  };
  const result = createD3SequenceRenderModel(selfFixture, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok(result.model);
  if (!result.model) return;
  const compact = createD3SequenceLayout(result.model, 480);
  assert.equal(compact.messages.length, 1);
  const message = compact.messages[0]!;
  const client = compact.lanes.find((lane) => lane.roleId === "client")!;
  assert.equal(message.y, client.y);
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
