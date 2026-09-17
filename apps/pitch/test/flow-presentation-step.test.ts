import assert from "node:assert/strict";
import test from "node:test";
import type { DiagramBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { mountPitchDiagrams, mountPitchFlowDiagrams, type PitchDiagramMount, type PitchFlowHost, type PitchFlowMount } from "../src/flow-runtime.ts";
import type { D3FlowComponent } from "../../../packages/renderer-d3/src/flow-diagram.ts";
import type { D3SequenceComponent } from "../../../packages/renderer-d3/src/sequence-diagram.ts";

class Host implements PitchFlowHost {
  attributes = new Map<string, string>();
  readonly listeners = new Map<string, EventListenerOrEventListenerObject>();
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  removeAttribute(name: string): void { this.attributes.delete(name); }
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void { this.listeners.set(type, listener); }
  removeEventListener(type: string): void { this.listeners.delete(type); }
  dispatchPresentationStep(step: number): void {
    const listener = this.listeners.get("pcd-presentation-step");
    if (typeof listener === "function") listener({ detail: { step } } as unknown as Event);
    else listener?.handleEvent({ detail: { step } } as unknown as Event);
  }
}

const source = [{ resourceId: "ex:diagram" }] as const;
const diagram: DiagramBlock = {
  kind: "diagram", id: "diagram:static", diagramType: "flow", label: "Static diagram", description: "Always complete.", source,
  nodes: [
    { id: "input", label: "Input", source },
    { id: "output", label: "Output", source },
  ],
  edges: [{ id: "input-output", sourceNodeId: "input", targetNodeId: "output", label: "becomes", source }],
};
const documents: SceneDocument[] = [{
  version: "1.1", id: "document:static", sourcePathId: "path:static",
  scenes: [{ id: "scene:static", source, readingOrder: [diagram.id], blocks: [diagram] }],
}];

test("pitch does not infer progressive disclosure from flow topology", () => {
  const host = new Host();
  host.setAttribute("data-flow-block-id", diagram.id);
  const mount: PitchFlowMount = () => ({
    model: {} as D3FlowComponent["model"], layout: {} as D3FlowComponent["layout"], staticFallback: "",
    focusNode() {}, handleKey() { return false; }, resize() { return {} as D3FlowComponent["layout"]; }, destroy() {},
  });
  const destroy = mountPitchFlowDiagrams([host], documents, { reducedMotion: true, interactionPolicy: "static" }, mount);
  assert.equal(host.getAttribute("data-presentation-step-host"), null);
  assert.equal(host.getAttribute("data-presentation-step-count"), null);
  assert.deepEqual([...host.listeners.keys()], []);
  destroy();
});

test("pitch maps Reveal fragment positions to authored diagram states and restores the base state", () => {
  const statefulDiagram: DiagramBlock = {
    ...diagram,
    id: "diagram:stateful",
    states: [
      { id: "state:overview", label: "Overview", source, sharedEdgeAnnotations: [] },
      { id: "state:detail", label: "Detail", source, sharedEdgeAnnotations: [] },
    ],
  };
  const statefulDocuments: SceneDocument[] = [{
    version: "1.2", id: "document:stateful", sourcePathId: "path:stateful",
    scenes: [{ id: "scene:stateful", source, readingOrder: [statefulDiagram.id], blocks: [statefulDiagram] }],
  }];
  const host = new Host();
  host.setAttribute("data-flow-block-id", statefulDiagram.id);
  const activeStates: Array<string | undefined> = [];
  const mount: PitchFlowMount = () => ({
    model: { states: statefulDiagram.states } as D3FlowComponent["model"],
    layout: {} as D3FlowComponent["layout"],
    staticFallback: "",
    focusNode() {},
    setActiveState(stateId) { activeStates.push(stateId); },
    handleKey() { return false; },
    resize() { return {} as D3FlowComponent["layout"]; },
    destroy() {},
  });

  const destroy = mountPitchFlowDiagrams([host], statefulDocuments, { reducedMotion: true, interactionPolicy: "keyboard" }, mount);
  assert.equal(host.getAttribute("data-presentation-step-count"), "2");
  assert.equal(host.getAttribute("data-presentation-step-host"), "diagram-state");
  host.dispatchPresentationStep(1);
  host.dispatchPresentationStep(2);
  host.dispatchPresentationStep(0);
  assert.deepEqual(activeStates, ["state:overview", "state:detail", undefined]);

  destroy();
  assert.equal(host.getAttribute("data-presentation-step-count"), null);
  assert.equal(host.getAttribute("data-presentation-step-host"), null);
});

test("pitch dispatches generic sequence states through the same Reveal progression host", () => {
  const sequence: DiagramBlock = {
    kind: "diagram", id: "diagram:sequence", diagramType: "sequence", label: "Generic exchange", description: "Stateful sequence.", source, nodes: [], edges: [],
    participantRoles: [{ id: "origin", label: "Origin", source }, { id: "target", label: "Target", source }],
    messages: [{ id: "request", sourceRoleId: "origin", targetRoleId: "target", label: "Request", source }],
    states: [{ id: "request-state", label: "Request", source, sharedEdgeAnnotations: [], activeMessageIds: ["request"] }],
  };
  const sequenceDocuments: SceneDocument[] = [{ version: "1.3", id: "document:sequence", sourcePathId: "path:sequence", scenes: [{ id: "scene:sequence", source, readingOrder: [sequence.id], blocks: [sequence] }] }];
  const host = new Host(); host.setAttribute("data-diagram-block-id", sequence.id);
  const activeStates: Array<string | undefined> = [];
  const mount: PitchDiagramMount = () => ({
    model: { states: sequence.states } as D3SequenceComponent["model"], layout: {} as D3SequenceComponent["layout"], staticFallback: "",
    setActiveState(stateId) { activeStates.push(stateId); }, handleKey() { return false; }, resize() { return {} as D3SequenceComponent["layout"]; }, destroy() {},
  });
  const destroy = mountPitchDiagrams([host], sequenceDocuments, { reducedMotion: true, interactionPolicy: "keyboard" }, mount);
  assert.equal(host.getAttribute("data-presentation-step-host"), "diagram-state");
  host.dispatchPresentationStep(1); host.dispatchPresentationStep(0);
  assert.deepEqual(activeStates, ["request-state", undefined]);
  destroy();
});
