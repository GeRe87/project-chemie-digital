import assert from "node:assert/strict";
import test from "node:test";
import type { DiagramBlock } from "../../core/src/index.ts";
import { createD3FlowRenderModel, createSvgD3FlowRuntime } from "../src/flow-diagram.ts";
import { createD3FlowLayout } from "../src/flow-layout.ts";

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  parent: FakeElement | null = null;
  textContent: string | null = null;
  clientWidth = 1200;

  constructor(readonly tagName: string) {}

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

test("concrete SVG runtime preserves authored leading and repeated whitespace in node and edge labels", () => {
  const globals = globalThis as unknown as {
    document?: Document;
    HTMLElement?: typeof HTMLElement;
  };
  const originalDocument = globals.document;
  const originalHTMLElement = globals.HTMLElement;
  globals.document = fakeDocument as unknown as Document;
  globals.HTMLElement = FakeHTMLElement as unknown as typeof HTMLElement;

  try {
    const rendered = createD3FlowRenderModel(block, { reducedMotion: true, interactionPolicy: "static" });
    assert.ok(rendered.model);
    const model = rendered.model;
    const layout = createD3FlowLayout(model, 1200);
    const host = new FakeHTMLElement("div");
    const mounted = createSvgD3FlowRuntime().mount(host, model, layout);

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
    if (originalDocument === undefined) delete globals.document;
    else globals.document = originalDocument;
    if (originalHTMLElement === undefined) delete globals.HTMLElement;
    else globals.HTMLElement = originalHTMLElement;
    fakeDocument.activeElement = null;
  }
});
