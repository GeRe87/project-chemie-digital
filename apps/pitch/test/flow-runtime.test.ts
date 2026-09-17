import assert from "node:assert/strict";
import test from "node:test";
import type { DiagramBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import {
  createD3FlowRenderModel,
  mountD3FlowDiagram,
  type D3FlowComponent,
  type D3FlowOptions,
  type D3FlowRuntimePort,
} from "../../../packages/renderer-d3/src/flow-diagram.ts";
import { createD3FlowLayout } from "../../../packages/renderer-d3/src/flow-layout.ts";
import { mountPitchFlowDiagrams, type PitchFlowHost, type PitchFlowMount } from "../src/flow-runtime.ts";
import { mountSceneDocuments, type MinimalElement } from "../src/preview.ts";

class FakeElement implements MinimalElement, PitchFlowHost {
  private html = "";
  private listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  className = "";
  textContent: string | null = null;
  children: FakeElement[] = [];
  attributes = new Map<string, string>();
  lastKeydownStopped = false;

  get innerHTML(): string { return this.html; }
  set innerHTML(value: string) {
    this.html = value;
    if (value === "") this.children = [];
  }
  appendChild(node: MinimalElement): void { this.children.push(node as FakeElement); }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener);
  }
  dispatchKey(key: string): boolean {
    let prevented = false;
    let stopped = false;
    const event = {
      key,
      preventDefault() { prevented = true; },
      stopPropagation() { stopped = true; },
    } as unknown as Event;
    for (const listener of this.listeners.get("keydown") ?? []) {
      if (typeof listener === "function") listener(event);
      else listener.handleEvent(event);
    }
    this.lastKeydownStopped = stopped;
    return prevented;
  }
  listenerCount(type: string): number { return this.listeners.get(type)?.size ?? 0; }
}

const source = [{ resourceId: "ex:flow-scene", relationPath: "cd:body", provenanceIds: ["prov:flow"] }] as const;
const diagram: DiagramBlock = {
  kind: "diagram",
  id: "diagram:flow",
  diagramType: "flow",
  label: "Canonical flow",
  description: "Two-step canonical diagram.",
  source,
  nodes: [
    { id: "node:a", label: "Input data", source: [{ resourceId: "ex:input", relationPath: "skos:prefLabel@en" }] },
    { id: "node:b", label: "Reusable result", source: [{ resourceId: "ex:result", relationPath: "dct:title" }], emphasis: "primary" },
  ],
  edges: [
    { id: "edge:ab", sourceNodeId: "node:a", targetNodeId: "node:b", label: "becomes", source: [{ resourceId: "ex:becomes", relationPath: "skos:prefLabel@en" }] },
  ],
  focusNodeId: "node:b",
};

const document: SceneDocument = {
  version: "1.1",
  id: "document:flow",
  sourcePathId: "path:flow",
  scenes: [{
    id: "scene:flow",
    source,
    readingOrder: ["heading", diagram.id],
    blocks: [
      {
        kind: "prose",
        id: "heading",
        text: "Flow scene",
        source,
        intent: { kind: "introduce" },
      },
      diagram,
    ],
  }],
};

const options: D3FlowOptions = { reducedMotion: true, interactionPolicy: "keyboard" };

test("pitch preview creates a canonical renderer host and complete static fallback", () => {
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, [document]);
  assert.equal(root.children.length, 1);
  const section = root.children[0]!;
  assert.equal(section.children[0]!.textContent, "Flow scene");
  const host = section.children[1]!;
  assert.equal(host.className, "d3-diagram-host d3-flow-host");
  assert.equal(host.getAttribute("data-diagram-block-id"), diagram.id);
  assert.equal(host.getAttribute("data-flow-block-id"), diagram.id);
  assert.equal(host.getAttribute("data-diagram-type"), "flow");
  assert.equal(host.getAttribute("aria-label"), diagram.label);
  assert.equal(host.getAttribute("data-resource-id"), "ex:flow-scene");
  assert.equal(host.getAttribute("data-relation-path"), "cd:body");
  assert.match(host.children[0]!.textContent ?? "", /Input data/);
  assert.match(host.children[0]!.textContent ?? "", /Input data — becomes → Reusable result/);
  destroy();
  assert.equal(root.children.length, 0);
});

test("pitch flow runtime passes the exact canonical block to renderer-d3 and cleans up once", () => {
  const host = new FakeElement();
  host.setAttribute("data-flow-block-id", diagram.id);
  const received: Array<{ block: DiagramBlock; options: D3FlowOptions }> = [];
  let destroys = 0;

  const mount: PitchFlowMount = (_host, block, rendererOptions) => {
    received.push({ block, options: rendererOptions });
    const rendered = createD3FlowRenderModel(block, rendererOptions);
    assert.ok(rendered.model);
    const model = rendered.model;
    const layout = createD3FlowLayout(model, 1200);
    const component: D3FlowComponent = {
      model,
      layout,
      staticFallback: model.staticFallback,
      activeNodeId: model.focusNodeId,
      focusNode() {},
      handleKey() { return false; },
      resize() { return layout; },
      destroy() { destroys += 1; },
    };
    return component;
  };

  const destroy = mountPitchFlowDiagrams([host], [document], options, mount);
  assert.equal(received.length, 1);
  assert.equal(received[0]!.block, diagram);
  assert.deepEqual(received[0]!.options, options);
  destroy();
  destroy();
  assert.equal(destroys, 1);
});

test("partial pitch flow mounting rolls back prior components and keyboard listeners", () => {
  const mountedHost = new FakeElement();
  mountedHost.setAttribute("data-flow-block-id", diagram.id);
  const failingHost = new FakeElement();
  failingHost.setAttribute("data-flow-block-id", "diagram:missing");
  let destroys = 0;

  const mount: PitchFlowMount = (_host, block, rendererOptions) => {
    const rendered = createD3FlowRenderModel(block, rendererOptions);
    assert.ok(rendered.model);
    const model = rendered.model;
    const layout = createD3FlowLayout(model, 1200);
    return {
      model,
      layout,
      staticFallback: model.staticFallback,
      activeNodeId: model.focusNodeId,
      focusNode() {},
      handleKey() { return false; },
      resize() { return layout; },
      destroy() { destroys += 1; },
    };
  };

  assert.throws(
    () => mountPitchFlowDiagrams([mountedHost, failingHost], [document], options, mount),
    /unknown block diagram:missing/,
  );
  assert.equal(mountedHost.listenerCount("keydown"), 0);
  assert.equal(mountedHost.dispatchKey("ArrowRight"), false);
  assert.equal(destroys, 1);
});

test("real DOM keydown wiring drives the existing deterministic D3 traversal and is removed on cleanup", () => {
  const host = new FakeElement();
  host.setAttribute("data-flow-block-id", diagram.id);
  const focused: string[] = [];
  const runtime: D3FlowRuntimePort = {
    measureHost() { return 1200; },
    mount() {
      return {
        update() {},
        focusNode(nodeId) { focused.push(nodeId); },
        destroy() {},
      };
    },
  };
  const mount: PitchFlowMount = (target, block, rendererOptions) => mountD3FlowDiagram(target, block, rendererOptions, runtime);

  const destroy = mountPitchFlowDiagrams([host], [document], options, mount);
  assert.equal(host.listenerCount("keydown"), 1);
  assert.deepEqual(focused, ["node:b"]);

  assert.equal(host.dispatchKey("ArrowRight"), true);
  assert.equal(host.lastKeydownStopped, true);
  assert.equal(focused.at(-1), "node:a");
  assert.equal(host.dispatchKey("Home"), true);
  assert.equal(host.lastKeydownStopped, true);
  assert.equal(focused.at(-1), "node:a");
  assert.equal(host.dispatchKey("End"), true);
  assert.equal(host.lastKeydownStopped, true);
  assert.equal(focused.at(-1), "node:b");
  const beforeUnsupported = focused.length;
  assert.equal(host.dispatchKey("PageDown"), false);
  assert.equal(host.lastKeydownStopped, false);
  assert.equal(focused.length, beforeUnsupported);

  destroy();
  assert.equal(host.listenerCount("keydown"), 0);
  const beforeDestroyed = focused.length;
  assert.equal(host.dispatchKey("ArrowLeft"), false);
  assert.equal(host.lastKeydownStopped, false);
  assert.equal(focused.length, beforeDestroyed);

  const staticHost = new FakeElement();
  staticHost.setAttribute("data-flow-block-id", diagram.id);
  const destroyStatic = mountPitchFlowDiagrams(
    [staticHost],
    [document],
    { reducedMotion: true, interactionPolicy: "static" },
    mount,
  );
  assert.equal(staticHost.listenerCount("keydown"), 0);
  assert.equal(staticHost.dispatchKey("ArrowRight"), false);
  assert.equal(staticHost.lastKeydownStopped, false);
  destroyStatic();
});

test("pitch flow runtime fails closed for unknown hosts and renderer diagnostics", () => {
  const missing = new FakeElement();
  missing.setAttribute("data-flow-block-id", "diagram:missing");
  assert.throws(() => mountPitchFlowDiagrams([missing], [document], options), /unknown block diagram:missing/);

  const host = new FakeElement();
  host.setAttribute("data-flow-block-id", diagram.id);
  const failingMount: PitchFlowMount = () => ({
    diagnostics: [{ code: "INVALID_FLOW_DIAGRAM", message: "synthetic failure" }],
  });
  assert.throws(
    () => mountPitchFlowDiagrams([host], [document], options, failingMount),
    /INVALID_FLOW_DIAGRAM.*synthetic failure/,
  );
});
