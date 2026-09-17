import assert from "node:assert/strict";
import test from "node:test";
import type { DiagramBlock } from "../../core/src/index.ts";
import { createD3FlowRenderModel, createSvgD3FlowRuntime } from "../src/flow-diagram.ts";
import { createD3FlowLayout } from "../src/flow-layout.ts";

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly tagName: string;
  parent: FakeElement | null = null;
  textContent: string | null = null;
  clientWidth = 1200;

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  get className(): string { return this.attributes.get("class") ?? ""; }
  set className(value: string) { this.attributes.set("class", value); }
  get innerHTML(): string { return ""; }
  set innerHTML(value: string) {
    if (value !== "") throw new Error("Fake DOM only supports clearing innerHTML");
    this.children.splice(0);
  }

  readonly classList = {
    add: (...tokens: string[]): void => {
      const values = new Set(this.className.split(/\s+/u).filter(Boolean));
      for (const token of tokens) values.add(token);
      this.className = [...values].join(" ");
    },
    toggle: (token: string, force?: boolean): boolean => {
      const values = new Set(this.className.split(/\s+/u).filter(Boolean));
      const next = force ?? !values.has(token);
      if (next) values.add(token);
      else values.delete(token);
      this.className = [...values].join(" ");
      return next;
    },
  };

  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  setAttributeNS(_namespace: string | null, qualifiedName: string, value: string): void {
    this.attributes.set(qualifiedName, value);
  }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  hasAttribute(name: string): boolean { return this.attributes.has(name); }

  append(...nodes: FakeElement[]): void {
    for (const node of nodes) {
      node.parent = this;
      this.children.push(node);
    }
  }
  appendChild(node: FakeElement): FakeElement { this.append(node); return node; }
  replaceChildren(...nodes: FakeElement[]): void {
    this.children.splice(0);
    this.append(...nodes);
  }
  remove(): void {
    if (!this.parent) return;
    const index = this.parent.children.indexOf(this);
    if (index >= 0) this.parent.children.splice(index, 1);
    this.parent = null;
  }
  focus(): void { fakeDocument.activeElement = this; }

  findByClass(className: string): FakeElement[] {
    const ownClasses = this.className.split(/\s+/u).filter(Boolean);
    return [
      ...(ownClasses.includes(className) ? [this] : []),
      ...this.children.flatMap((child) => child.findByClass(className)),
    ];
  }

  findByTag(tagName: string): FakeElement[] {
    return [
      ...(this.tagName === tagName ? [this] : []),
      ...this.children.flatMap((child) => child.findByTag(tagName)),
    ];
  }
}

class FakeHTMLElement extends FakeElement {}

const fakeDocument = {
  activeElement: null as FakeElement | null,
  createElement(tagName: string): FakeHTMLElement { return new FakeHTMLElement(tagName); },
  createElementNS(_namespace: string | null, qualifiedName: string): FakeElement { return new FakeElement(qualifiedName); },
};

const block: DiagramBlock = {
  kind: "diagram",
  id: "diagram:whitespace",
  diagramType: "flow",
  label: "Whitespace flow",
  description: "Preserve authored label spacing.",
  source: [{ resourceId: "scene:whitespace" }],
  nodes: [
    { id: "node:a", label: "  Alpha  beta", source: [{ resourceId: "ex:a" }] },
    { id: "node:b", label: "Result", source: [{ resourceId: "ex:b" }] },
  ],
  edges: [
    { id: "edge:ab", sourceNodeId: "node:a", targetNodeId: "node:b", label: "  maps  to  ", source: [{ resourceId: "ex:maps" }] },
  ],
};

function installFakeDom(): () => void {
  const globals = globalThis as unknown as {
    document?: Document;
    HTMLElement?: typeof HTMLElement;
  };
  const originalDocument = globals.document;
  const originalHTMLElement = globals.HTMLElement;
  globals.document = fakeDocument as unknown as Document;
  globals.HTMLElement = FakeHTMLElement as unknown as typeof HTMLElement;
  return () => {
    if (originalDocument === undefined) delete globals.document;
    else globals.document = originalDocument;
    if (originalHTMLElement === undefined) delete globals.HTMLElement;
    else globals.HTMLElement = originalHTMLElement;
    fakeDocument.activeElement = null;
  };
}

test("concrete SVG runtime preserves authored leading and repeated whitespace in node and edge labels", () => {
  const restoreDom = installFakeDom();

  try {
    const rendered = createD3FlowRenderModel(block, { reducedMotion: true, interactionPolicy: "static" });
    assert.ok(rendered.model);
    const model = rendered.model;
    const layout = createD3FlowLayout(model, 1200);
    const host = new FakeHTMLElement("div");
    const mounted = createSvgD3FlowRuntime().mount(host, model, layout);

    assert.equal(host.children[0]?.tagName, "div");
    assert.equal(host.findByTag("section").length, 0);
    const nodeText = host.findByClass("d3-flow-node-label")[0];
    const edgeText = host.findByClass("d3-flow-edge-label")[0];
    assert.ok(nodeText);
    assert.ok(edgeText);
    assert.equal(nodeText.getAttribute("xml:space"), "preserve");
    assert.equal(edgeText.getAttribute("xml:space"), "preserve");
    assert.equal(nodeText.children.map((child) => child.textContent ?? "").join(""), block.nodes[0]!.label);
    assert.equal(edgeText.children.map((child) => child.textContent ?? "").join(""), block.edges[0]!.label);

    mounted.destroy();
    assert.equal(host.children.length, 0);
  } finally {
    restoreDom();
  }
});

test("concrete SVG runtime keeps marker ids unique per mount and stable across rerenders", () => {
  const restoreDom = installFakeDom();

  try {
    const secondBlock: DiagramBlock = {
      ...block,
      label: "Second flow with reused block id",
      description: "Represents the same canonical block id in another SceneDocument.",
      source: [{ resourceId: "scene:other-document" }],
    };
    const renderedA = createD3FlowRenderModel(block, { reducedMotion: true, interactionPolicy: "static" });
    const renderedB = createD3FlowRenderModel(secondBlock, { reducedMotion: true, interactionPolicy: "static" });
    assert.ok(renderedA.model);
    assert.ok(renderedB.model);
    assert.equal(renderedA.model.sourceBlockId, renderedB.model.sourceBlockId);

    const layoutA = createD3FlowLayout(renderedA.model, 1200);
    const layoutB = createD3FlowLayout(renderedB.model, 1200);
    const hostA = new FakeHTMLElement("div");
    const hostB = new FakeHTMLElement("div");
    const runtime = createSvgD3FlowRuntime();
    const mountedA = runtime.mount(hostA, renderedA.model, layoutA);
    const mountedB = runtime.mount(hostB, renderedB.model, layoutB);

    const markerA = hostA.findByTag("marker")[0];
    const markerB = hostB.findByTag("marker")[0];
    const edgeA = hostA.findByClass("d3-flow-edge")[0];
    const edgeB = hostB.findByClass("d3-flow-edge")[0];
    assert.ok(markerA);
    assert.ok(markerB);
    assert.ok(edgeA);
    assert.ok(edgeB);
    const markerAId = markerA.getAttribute("id");
    const markerBId = markerB.getAttribute("id");
    assert.ok(markerAId);
    assert.ok(markerBId);
    assert.equal(markerA.getAttribute("markerWidth"), "3.5");
    assert.equal(markerA.getAttribute("markerHeight"), "4");
    assert.notEqual(markerAId, markerBId);
    assert.equal(edgeA.getAttribute("marker-end"), `url(#${markerAId})`);
    assert.equal(edgeB.getAttribute("marker-end"), `url(#${markerBId})`);

    mountedA.update(createD3FlowLayout(renderedA.model, 640));
    const rerenderedMarkerA = hostA.findByTag("marker")[0];
    const rerenderedEdgeA = hostA.findByClass("d3-flow-edge")[0];
    assert.ok(rerenderedMarkerA);
    assert.ok(rerenderedEdgeA);
    assert.equal(rerenderedMarkerA.getAttribute("id"), markerAId);
    assert.equal(rerenderedEdgeA.getAttribute("marker-end"), `url(#${markerAId})`);

    mountedA.destroy();
    mountedB.destroy();
    assert.equal(hostA.children.length, 0);
    assert.equal(hostB.children.length, 0);
  } finally {
    restoreDom();
  }
});

test("effective edge visualRole policy: explicit wins, equal endpoint roles propagate, mixed or one-sided stay neutral", () => {
  const restoreDom = installFakeDom();

  try {
    const roleBlock: DiagramBlock = {
      ...block,
      nodes: [
        { ...block.nodes[0]!, id: "node:a", visualRole: "comparison" },
        { ...block.nodes[0]!, id: "node:b", visualRole: "comparison" },
        { ...block.nodes[0]!, id: "node:c", visualRole: "highlight" },
        { ...block.nodes[0]!, id: "node:d" },
      ],
      edges: [
        { ...block.edges[0]!, id: "edge:explicit", sourceNodeId: "node:a", targetNodeId: "node:d", visualRole: "highlight" },
        { ...block.edges[0]!, id: "edge:equal", sourceNodeId: "node:a", targetNodeId: "node:b" },
        { ...block.edges[0]!, id: "edge:mixed", sourceNodeId: "node:a", targetNodeId: "node:c" },
        { ...block.edges[0]!, id: "edge:one-sided-source", sourceNodeId: "node:a", targetNodeId: "node:d" },
        { ...block.edges[0]!, id: "edge:one-sided-target", sourceNodeId: "node:d", targetNodeId: "node:a" },
      ],
    };
    const rendered = createD3FlowRenderModel(roleBlock, { reducedMotion: true, interactionPolicy: "static" });
    assert.ok(rendered.model);
    if (!rendered.model) return;
    const edgeById = new Map(rendered.model.edges.map((edge) => [edge.id, edge]));
    assert.equal(edgeById.get("edge:explicit")?.visualRole, "highlight");
    assert.equal(edgeById.get("edge:equal")?.visualRole, "comparison");
    assert.equal(edgeById.get("edge:mixed")?.visualRole, undefined);
    assert.equal(edgeById.get("edge:one-sided-source")?.visualRole, undefined);
    assert.equal(edgeById.get("edge:one-sided-target")?.visualRole, undefined);

    const host = new FakeHTMLElement("div");
    const mounted = createSvgD3FlowRuntime().mount(host, rendered.model, createD3FlowLayout(rendered.model, 1200));
    const edgeElements = host.findByClass("d3-flow-edge");
    const explicitEdge = edgeElements.find((el) => el.getAttribute("data-edge-id") === "edge:explicit");
    const equalEdge = edgeElements.find((el) => el.getAttribute("data-edge-id") === "edge:equal");
    const mixedEdge = edgeElements.find((el) => el.getAttribute("data-edge-id") === "edge:mixed");
    assert.equal(explicitEdge?.getAttribute("data-visual-role"), "highlight");
    assert.equal(equalEdge?.getAttribute("data-visual-role"), "comparison");
    assert.equal(mixedEdge?.hasAttribute("data-visual-role"), false);

    mounted.destroy();
  } finally {
    restoreDom();
  }
});
