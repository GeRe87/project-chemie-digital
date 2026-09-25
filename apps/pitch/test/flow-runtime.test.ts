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
  removeAttribute(name: string): void { this.attributes.delete(name); }
  querySelector<E extends Element = Element>(selector: string): E | null {
    for (const child of this.children) {
      if (selector.startsWith(".") && child.className === selector.slice(1)) return child as unknown as E;
      if (selector.startsWith("#") && child.attributes.get("id") === selector.slice(1)) return child as unknown as E;
      const found = child.querySelector<E>(selector);
      if (found) return found;
    }
    return null;
  }
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
  dispatchEvent(event: Event): boolean {
    for (const listener of this.listeners.get(event.type) ?? []) {
      if (typeof listener === "function") listener(event);
      else listener.handleEvent(event);
    }
    return true;
  }
  listenerCount(type: string): number { return this.listeners.get(type)?.size ?? 0; }
}

// Minimal fake DOM for integration tests that exercise the real renderer runtime.
class FakeDomNode {
  readonly attributes = new Map<string, string>();
  readonly children: FakeDomNode[] = [];
  parent: FakeDomNode | null = null;
  textContent: string | null = null;
  readonly tagName: string;

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  get className(): string { return this.attributes.get("class") ?? ""; }
  set className(value: string) { this.attributes.set("class", value); }

  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  setAttributeNS(_namespace: string | null, qualifiedName: string, value: string): void { this.attributes.set(qualifiedName, value); }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  removeAttribute(name: string): void { this.attributes.delete(name); }

  append(...nodes: FakeDomNode[]): void {
    for (const node of nodes) {
      node.parent = this;
      this.children.push(node);
    }
  }
  appendChild(node: FakeDomNode): FakeDomNode { this.append(node); return node; }
  removeChild(node: FakeDomNode): FakeDomNode {
    const index = this.children.indexOf(node);
    if (index >= 0) this.children.splice(index, 1);
    node.parent = null;
    return node;
  }
  replaceChildren(...nodes: FakeDomNode[]): void {
    this.children.splice(0);
    this.append(...nodes);
  }
  remove(): void {
    if (this.parent) this.parent.removeChild(this);
  }

  querySelector(selector: string): FakeDomNode | null {
    for (const child of this.children) {
      if (selector.startsWith(".") && child.className === selector.slice(1)) return child;
      if (selector.startsWith("#") && child.getAttribute("id") === selector.slice(1)) return child;
      const found = child.querySelector(selector);
      if (found) return found;
    }
    return null;
  }
}

class FakeDomElement extends FakeDomNode {
  clientWidth = 1200;
  innerHTML = "";
}

class FakeDomHTMLElement extends FakeDomElement {}

class FakeDomDocument {
  activeElement: FakeDomNode | null = null;
  createElement(tagName: string): FakeDomHTMLElement { return new FakeDomHTMLElement(tagName); }
  createElementNS(_namespace: string | null, qualifiedName: string): FakeDomNode { return new FakeDomNode(qualifiedName); }
}

class FakeDomHost extends FakeDomHTMLElement implements PitchFlowHost {
  private listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  set innerHTML(value: string) {
    if (value !== "" && value !== this.innerHTML) throw new Error("Fake DOM only supports clearing innerHTML");
    this.children.splice(0);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const set = this.listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener);
  }
  dispatchEvent(event: Event): boolean {
    for (const listener of this.listeners.get(event.type) ?? []) {
      if (typeof listener === "function") listener(event);
      else listener.handleEvent(event);
    }
    return true;
  }
}

function installFakeDom(): () => void {
  const globals = globalThis as unknown as { document?: Document; HTMLElement?: typeof HTMLElement };
  const originalDocument = globals.document;
  const originalHTMLElement = globals.HTMLElement;
  globals.document = new FakeDomDocument() as unknown as Document;
  globals.HTMLElement = FakeDomHTMLElement as unknown as typeof HTMLElement;
  return () => {
    if (originalDocument === undefined) delete globals.document;
    else globals.document = originalDocument;
    if (originalHTMLElement === undefined) delete globals.HTMLElement;
    else globals.HTMLElement = originalHTMLElement;
  };
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

const statefulDiagram: DiagramBlock = {
  kind: "diagram",
  id: "diagram:stateful",
  diagramType: "network",
  label: "Network evolution",
  description: "Three-state network diagram for accessibility tests.",
  source,
  nodes: [
    { id: "node:a", label: "Alpha", source: [{ resourceId: "ex:alpha", relationPath: "skos:prefLabel@en" }] },
    { id: "node:b", label: "Beta", source: [{ resourceId: "ex:beta", relationPath: "skos:prefLabel@en" }] },
  ],
  edges: [
    { id: "edge:ab", sourceNodeId: "node:a", targetNodeId: "node:b", label: "connects", source: [{ resourceId: "ex:connects", relationPath: "skos:prefLabel@en" }] },
  ],
  states: [
    { id: "state:base", label: "Base view", source: [], sharedEdgeAnnotations: [], activeNodeIds: ["node:a"], activeEdgeIds: ["edge:ab"] },
    { id: "state:focus", label: "Beta focus", source: [], sharedEdgeAnnotations: [], activeNodeIds: ["node:a", "node:b"], focusNodeId: "node:b" },
    { id: "state:context", label: "Context emphasis", source: [], sharedEdgeAnnotations: [], activeNodeIds: ["node:a", "node:b"], contextGroupIds: [] },
  ],
};

const statefulDocument: SceneDocument = {
  version: "1.1",
  id: "document:stateful",
  sourcePathId: "path:stateful",
  scenes: [{
    id: "scene:stateful",
    source,
    readingOrder: [statefulDiagram.id],
    blocks: [statefulDiagram],
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

function createLiveRegion(text: string): FakeElement {
  const live = new FakeElement();
  live.className = "pcd-diagram-live-region";
  live.setAttribute("aria-live", "polite");
  live.textContent = text;
  return live;
}

test("base diagram accessible description uses block label and live region matches", () => {
  const host = new FakeElement();
  host.setAttribute("data-flow-block-id", statefulDiagram.id);
  host.setAttribute("aria-label", statefulDiagram.label);
  host.appendChild(createLiveRegion(statefulDiagram.label));

  let activeStateId: string | undefined;
  const mount: PitchFlowMount = (_host, block, rendererOptions) => {
    const rendered = createD3FlowRenderModel(block, rendererOptions);
    assert.ok(rendered.model);
    const model = rendered.model;
    const layout = createD3FlowLayout(model, 1200);
    return {
      model,
      layout,
      staticFallback: model.staticFallback,
      activeStateId,
      focusNode() {},
      setActiveState(stateId) { activeStateId = stateId; },
      handleKey() { return false; },
      resize() { return layout; },
      destroy() {},
    };
  };

  const destroy = mountPitchFlowDiagrams([host], [statefulDocument], options, mount);
  assert.equal(host.getAttribute("aria-label"), statefulDiagram.label);
  assert.equal(host.querySelector(".pcd-diagram-live-region")?.textContent, statefulDiagram.label);
  destroy();
});

test("state activation updates accessible state description and live region", () => {
  const host = new FakeElement();
  host.setAttribute("data-flow-block-id", statefulDiagram.id);
  host.setAttribute("aria-label", statefulDiagram.label);
  host.appendChild(createLiveRegion(statefulDiagram.label));

  let activeStateId: string | undefined;
  const mount: PitchFlowMount = (_host, block, rendererOptions) => {
    const rendered = createD3FlowRenderModel(block, rendererOptions);
    assert.ok(rendered.model);
    const model = rendered.model;
    const layout = createD3FlowLayout(model, 1200);
    return {
      model,
      layout,
      staticFallback: model.staticFallback,
      get activeStateId() { return activeStateId; },
      focusNode() {},
      setActiveState(stateId) { activeStateId = stateId; },
      handleKey() { return false; },
      resize() { return layout; },
      destroy() {},
    };
  };

  const destroy = mountPitchFlowDiagrams([host], [statefulDocument], options, mount);
  host.dispatchEvent({ type: "pcd-presentation-step", detail: { step: 2 } } as unknown as Event);
  assert.equal(host.getAttribute("aria-label"), `${statefulDiagram.label}: Beta focus`);
  assert.equal(host.querySelector(".pcd-diagram-live-region")?.textContent, `${statefulDiagram.label}: Beta focus`);
  destroy();
});

test("reverse navigation and reset restore base accessible description", () => {
  const host = new FakeElement();
  host.setAttribute("data-flow-block-id", statefulDiagram.id);
  host.appendChild(createLiveRegion(statefulDiagram.label));

  let activeStateId: string | undefined;
  const mount: PitchFlowMount = (_host, block, rendererOptions) => {
    const rendered = createD3FlowRenderModel(block, rendererOptions);
    assert.ok(rendered.model);
    const model = rendered.model;
    const layout = createD3FlowLayout(model, 1200);
    return {
      model,
      layout,
      staticFallback: model.staticFallback,
      get activeStateId() { return activeStateId; },
      focusNode() {},
      setActiveState(stateId) { activeStateId = stateId; },
      handleKey() { return false; },
      resize() { return layout; },
      destroy() {},
    };
  };

  const destroy = mountPitchFlowDiagrams([host], [statefulDocument], options, mount);
  host.dispatchEvent({ type: "pcd-presentation-step", detail: { step: 3 } } as unknown as Event);
  assert.equal(host.getAttribute("aria-label"), `${statefulDiagram.label}: Context emphasis`);
  host.dispatchEvent({ type: "pcd-presentation-step", detail: { step: 1 } } as unknown as Event);
  assert.equal(host.getAttribute("aria-label"), `${statefulDiagram.label}: Base view`);
  host.dispatchEvent({ type: "pcd-presentation-step", detail: { step: 0 } } as unknown as Event);
  assert.equal(host.getAttribute("aria-label"), statefulDiagram.label);
  destroy();
});

test("sequence diagram state labels use the same generic accessibility mechanism", () => {
  const host = new FakeElement();
  host.setAttribute("data-flow-block-id", "diagram:sequence");
  host.appendChild(createLiveRegion("Sequence"));

  const sequenceDiagram: DiagramBlock = {
    kind: "diagram",
    id: "diagram:sequence",
    diagramType: "sequence",
    label: "Service process",
    description: "Participant interaction.",
    source,
    nodes: [],
    edges: [],
    participantRoles: [
      { id: "role:provider", label: "Provider", source: [] },
      { id: "role:consumer", label: "Consumer", source: [] },
    ],
    messages: [
      { id: "msg:request", label: "Request", sourceRoleId: "role:consumer", targetRoleId: "role:provider", source: [] },
    ],
    states: [
      { id: "state:intro", label: "Introduce roles", source: [], sharedEdgeAnnotations: [], activeMessageIds: [] },
      { id: "state:request", label: "Send request", source: [], sharedEdgeAnnotations: [], activeMessageIds: ["msg:request"] },
    ],
  };
  const sequenceDocument: SceneDocument = {
    version: "1.1",
    id: "document:sequence",
    sourcePathId: "path:sequence",
    scenes: [{ id: "scene:sequence", source, readingOrder: [sequenceDiagram.id], blocks: [sequenceDiagram] }],
  };

  let activeStateId: string | undefined;
  const mount: PitchFlowMount = (_host, block) => {
    const model = {
      version: "1.0" as const,
      sourceBlockId: block.id,
      label: block.label,
      description: block.description,
      participantRoles: block.participantRoles ?? [],
      messages: block.messages ?? [],
      states: block.states ?? [],
      staticFallback: "",
      reducedMotion: true,
    };
    return {
      model,
      layout: { width: 800, height: 200, compact: false, lanes: [], messages: [] },
      staticFallback: "",
      get activeStateId() { return activeStateId; },
      setActiveState(stateId) { activeStateId = stateId; },
      handleKey() { return false; },
      resize() { return { width: 800, height: 200, compact: false, lanes: [], messages: [] }; },
      destroy() {},
    };
  };

  const destroy = mountPitchFlowDiagrams([host], [sequenceDocument], options, mount);
  assert.equal(host.getAttribute("aria-label"), sequenceDiagram.label);
  host.dispatchEvent({ type: "pcd-presentation-step", detail: { step: 2 } } as unknown as Event);
  assert.equal(host.getAttribute("aria-label"), `${sequenceDiagram.label}: Send request`);
  destroy();
});

test("reduced motion does not suppress accessibility state updates", () => {
  const host = new FakeElement();
  host.setAttribute("data-flow-block-id", statefulDiagram.id);
  host.appendChild(createLiveRegion(statefulDiagram.label));

  let activeStateId: string | undefined;
  const reducedMotionOptions: D3FlowOptions = { reducedMotion: true, interactionPolicy: "static" };
  const mount: PitchFlowMount = (_host, block, rendererOptions) => {
    const rendered = createD3FlowRenderModel(block, rendererOptions);
    assert.ok(rendered.model);
    const model = rendered.model;
    const layout = createD3FlowLayout(model, 1200);
    return {
      model,
      layout,
      staticFallback: model.staticFallback,
      get activeStateId() { return activeStateId; },
      focusNode() {},
      setActiveState(stateId) { activeStateId = stateId; },
      handleKey() { return false; },
      resize() { return layout; },
      destroy() {},
    };
  };

  const destroy = mountPitchFlowDiagrams([host], [statefulDocument], reducedMotionOptions, mount);
  host.dispatchEvent({ type: "pcd-presentation-step", detail: { step: 2 } } as unknown as Event);
  assert.equal(host.getAttribute("aria-label"), `${statefulDiagram.label}: Beta focus`);
  destroy();
});

test("real runtime mount preserves the aria-live region and accessibility updates survive state changes", () => {
  const restoreDom = installFakeDom();
  try {
    const host = new FakeDomHost();
    host.setAttribute("data-flow-block-id", statefulDiagram.id);
    const fakeDocument = (globalThis as unknown as { document: FakeDomDocument }).document;
    const live = fakeDocument.createElement("span");
    live.className = "pcd-diagram-live-region";
    live.setAttribute("aria-live", "polite");
    live.textContent = "initial";
    host.appendChild(live);

    const destroy = mountPitchFlowDiagrams(
      [host],
      [statefulDocument],
      { reducedMotion: true, interactionPolicy: "static" },
      mountD3FlowDiagram,
    );

    const preserved = host.querySelector(".pcd-diagram-live-region");
    assert.ok(preserved, "live region should survive the real renderer mount");
    assert.equal(preserved.textContent, statefulDiagram.label);

    host.dispatchEvent({ type: "pcd-presentation-step", detail: { step: 2 } } as unknown as Event);
    assert.equal(preserved.textContent, `${statefulDiagram.label}: Beta focus`);

    host.dispatchEvent({ type: "pcd-presentation-step", detail: { step: 0 } } as unknown as Event);
    assert.equal(preserved.textContent, statefulDiagram.label);

    destroy();
  } finally {
    restoreDom();
  }
});
