import assert from "node:assert/strict";
import test from "node:test";
import type { DiagramBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { mountPitchFlowDiagrams, type PitchFlowHost, type PitchFlowMount } from "../src/flow-runtime.ts";
import type { D3FlowComponent } from "../../../packages/renderer-d3/src/flow-diagram.ts";

class Host implements PitchFlowHost {
  attributes = new Map<string, string>();
  readonly listeners: string[] = [];
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  addEventListener(type: string): void { this.listeners.push(type); }
  removeEventListener(): void {}
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
  assert.deepEqual(host.listeners, []);
  destroy();
});
