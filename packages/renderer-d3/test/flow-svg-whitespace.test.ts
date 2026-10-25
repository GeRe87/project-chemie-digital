import assert from "node:assert/strict";
import test from "node:test";
import type { DiagramBlock } from "../../core/src/index.ts";
import { VISUAL_MOTIF_KEYS } from "../../core/src/scene-document.ts";
import { createD3FlowRenderModel, createSvgD3FlowRuntime } from "../src/flow-diagram.ts";
import { createD3FlowLayout } from "../src/flow-layout.ts";

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly tagName: string;
  parent: FakeElement | null = null;
  textContent: string | null = null;
  clientWidth = 1200;
  readonly style = {
    properties: new Map<string, string>(),
    setProperty(name: string, value: string): void { this.properties.set(name, value); },
    getPropertyValue(name: string): string { return this.properties.get(name) ?? ""; },
  };

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
    assert.equal(nodeText.getAttribute("text-anchor"), "middle");
    assert.equal(nodeText.getAttribute("dominant-baseline"), "central");
    assert.equal(edgeText.getAttribute("dominant-baseline"), "central");
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

test("SVG renders source-linked mathematical notation separately from description", () => {
  const restoreDom = installFakeDom();
  try {
    const mathBlock: DiagramBlock = {
      ...block,
      nodes: block.nodes.map((node) => node.id === "node:a"
        ? { ...node, label: "INPUT", notation: "cᵢ", description: "Chosen concentration" }
        : node),
    };
    const result = createD3FlowRenderModel(mathBlock, { reducedMotion: true, interactionPolicy: "static" });
    assert.ok(result.model);
    const model = result.model!;
    const layout = createD3FlowLayout(model, 1200);
    const host = new FakeHTMLElement("div");
    const mounted = createSvgD3FlowRuntime().mount(host, model, layout);
    const notation = host.findByClass("d3-flow-node-notation");
    assert.equal(notation.length, 1);
    assert.equal(notation[0]!.children[0]!.textContent, "cᵢ");
    assert.equal(notation[0]!.getAttribute("xml:space"), "preserve");
    const descriptions = host.findByClass("d3-flow-node-body");
    assert.ok(descriptions.some((node) =>
      node.children.map((part) => part.textContent ?? "").join("") === "Chosen concentration"));
    assert.ok(descriptions.some((node) => node.children.length > 1), "exercise visual wrapping, not just a single tspan");
    const card = host.findByClass("d3-flow-node").find((node) => node.getAttribute("data-node-id") === "node:a")!;
    assert.equal(card.findByClass("d3-flow-node-header").length, 1);
    assert.equal(card.findByClass("d3-flow-node-body-group").length, 1);
    assert.equal(card.findByClass("d3-flow-node-title-divider").length, 1);
    const iconY = Number(notation[0]!.getAttribute("y"));
    const titleY = Number(card.findByClass("d3-flow-node-title")[0]!.getAttribute("y"));
    const dividerY = Number(card.findByClass("d3-flow-node-title-divider")[0]!.getAttribute("y1"));
    const bodyY = Number(descriptions.find((node) => node.parent?.className.includes("body-group"))!.getAttribute("y"));
    assert.ok(titleY - iconY >= 42, "the two-line icon band stays above the title even for a one-line title");
    assert.ok(dividerY > titleY && bodyY > dividerY, "the outer card is ordered as header, divider, body");
    assert.ok(host.findByClass("d3-flow-node").some((node) => node.getAttribute("data-node-has-notation") === "true"));
    mounted.destroy();
  } finally {
    restoreDom();
  }
});

test("flow-card notation header remains in bounds for one-line and wrapped titles at wide/narrow widths", () => {
  const restoreDom = installFakeDom();
  try {
    for (const width of [1200, 390]) for (const label of ["ONE SUM", "A deliberately long flow-card heading that wraps over multiple lines"]) {
      const nodes: DiagramBlock["nodes"] = [
        { id: "a", label, notation: "∑", description: "One result per experiment.", source: [{ resourceId: "ex:a" }] },
        { id: "b", label: "RESULT", description: "The collected outcomes.", source: [{ resourceId: "ex:b" }] },
      ];
      const model = createD3FlowRenderModel({ ...block, nodes,
        edges: [{ id: "e", sourceNodeId: "a", targetNodeId: "b", label: "repeat", source: [{ resourceId: "ex:e" }] }] },
      { reducedMotion: true, interactionPolicy: "static" }).model!;
      const layout = createD3FlowLayout(model, width);
      const host = new FakeHTMLElement("div"); host.clientWidth = width;
      const mounted = createSvgD3FlowRuntime().mount(host, model, layout);
      for (const card of host.findByClass("d3-flow-node")) {
        const icon = card.findByClass("d3-flow-node-notation")[0];
        const title = card.findByClass("d3-flow-node-title")[0]!;
        const divider = card.findByClass("d3-flow-node-title-divider")[0]!;
        const body = card.findByClass("d3-flow-node-body")[0]!;
        if (icon) assert.ok(Number(title.getAttribute("y")) - Number(icon.getAttribute("y")) >= 42);
        assert.ok(Number(divider.getAttribute("y1")) > Number(title.getAttribute("y")));
        assert.ok(Number(body.getAttribute("y")) > Number(divider.getAttribute("y1")));
        assert.equal(card.findByClass("d3-flow-node-header").length, 1);
        assert.equal(card.findByClass("d3-flow-node-body-group").length, 1);
      }
      mounted.destroy();
    }
  } finally { restoreDom(); }
});

// Synthetic renderer fixture, not a content requirement for any lecture card.
test("generic process fixture displays mathematical notation without replacing authored prose", () => {
  const restoreDom = installFakeDom();
  try {
    const nodes: DiagramBlock["nodes"] = [
      { id: "input", label: "INPUT", notation: "cᵢ", visualRole: "input", source: [{ resourceId: "ex:input" }] },
      { id: "process", label: "PROCESS", notation: "f(cᵢ) + εᵢ", description: "Chemical and analytical process",
        visualRole: "process", source: [{ resourceId: "ex:process" }] },
      { id: "output", label: "OUTPUT", notation: "Aᵢ", visualRole: "output", source: [{ resourceId: "ex:output" }] },
      { id: "influences", label: "ADDITIONAL INFLUENCES", visualRole: "influences", source: [{ resourceId: "ex:influences" }],
        parts: [{ id: "prep", label: "Preparation", source: [{ resourceId: "ex:prep" }] },
                { id: "readout", label: "Measurement", source: [{ resourceId: "ex:readout" }] }] },
      { id: "residual", label: "UNEXPLAINED EFFECTS", notation: "εᵢ", visualRole: "residual", source: [{ resourceId: "ex:residual" }] },
    ];
    const edges: DiagramBlock["edges"] = [
      { id: "a", sourceNodeId: "input", targetNodeId: "process", label: "input", source: [{ resourceId: "ex:a" }] },
      { id: "b", sourceNodeId: "process", targetNodeId: "output", label: "produces", source: [{ resourceId: "ex:b" }] },
      { id: "c", sourceNodeId: "process", targetNodeId: "influences", label: "affected by", source: [{ resourceId: "ex:c" }] },
      { id: "d", sourceNodeId: "influences", targetNodeId: "residual", label: "aggregates", source: [{ resourceId: "ex:d" }] },
    ];
    const result = createD3FlowRenderModel({
      ...block, nodes, edges, label: "Experiment with unexplained influences",
    }, { reducedMotion: true, interactionPolicy: "static" });
    assert.ok(result.model);
    const layout = createD3FlowLayout(result.model!, 1200);
    assert.equal(layout.strategy, "process-system");
    const host = new FakeHTMLElement("div");
    const mounted = createSvgD3FlowRuntime().mount(host, result.model!, layout);
    const node = host.findByClass("d3-flow-node").find((item) => item.getAttribute("data-node-id") === "process");
    assert.ok(node);
    const formula = node.findByClass("d3-flow-node-notation");
    assert.equal(formula.length, 1);
    assert.equal(formula[0]!.children.map((item) => item.textContent ?? "").join(""), "f(cᵢ) + εᵢ");
    const prose = node.findByClass("d3-flow-node-body");
    assert.ok(prose.length > 0);
    assert.equal(prose.flatMap((item) => item.children.map((child) => child.textContent ?? "")).join(""), nodes[1]!.description);
    mounted.destroy();
  } finally {
    restoreDom();
  }
});

test("highlighted three-step cards reserve room for titles, thumbnails and descriptions", () => {
  const nodes: DiagramBlock["nodes"] = ["Input port", "ProcessingUnit", "Output port"].map((label, i) => ({
    id: `part-${i}`, label, description: "Required meaning\nType and structure\nUnits",
    visualMotif: "hands-on", visualMotifRole: "highlight", source: [{resourceId: `ex:part-${i}`}],
  }));
  const edges = nodes.slice(1).map((node, i) => ({id: `connection-${i}`, sourceNodeId: nodes[i]!.id,
    targetNodeId: node.id, label: "data", source: [{resourceId: `ex:connection-${i}`}]}));
  const result = createD3FlowRenderModel({...block, diagramType: "flow", nodes, edges, states: []}, {reducedMotion: true, interactionPolicy: "static"});
  assert.ok(result.model);
  for (const width of [700, 1200]) {
    const layout = createD3FlowLayout(result.model, width);
    assert.ok(layout.nodes.every(node => node.height >= 276));
    assert.equal(layout.nodes.length, 3);
  }
  assert.deepEqual(createD3FlowLayout(result.model, 1200).nodes[1]!.labelLines, ["ProcessingUnit"]);
});

test("three composite flow columns preserve their nine source-linked subcards", () => {
  const restoreDom = installFakeDom();
  try {
    const nodes = ["Vocabulary", "Specializations", "Operation"].map((label, i) => ({
      id: `column-${i}`, label, source: [{resourceId: `ex:column-${i}`}],
      parts: Array.from({length: 3}, (_, j) => ({id: `part-${i}-${j}`, label: `Part ${j}`,
        description: "A defined relationship\nA second line", source: [{resourceId: `ex:part-${i}-${j}`}]})),
    }));
    const edges = nodes.slice(1).map((node, i) => ({id: `edge-${i}`, sourceNodeId: nodes[i]!.id,
      targetNodeId: node.id, label: "specialize", source: [{resourceId: `ex:edge-${i}`}]}));
    const result = createD3FlowRenderModel({...block, diagramType: "flow", nodes, edges, states: []}, {reducedMotion: true, interactionPolicy: "static"});
    assert.ok(result.model);
    const layout = createD3FlowLayout(result.model, 1200);
    assert.ok(layout.nodes[0]!.x < layout.nodes[1]!.x && layout.nodes[1]!.x < layout.nodes[2]!.x);
    assert.ok(layout.nodes.every(node => node.height > 350));
    const host = new FakeHTMLElement("div");
    const mounted = createSvgD3FlowRuntime().mount(host, result.model, layout);
    assert.equal(host.findByClass("d3-flow-node-part-panel").length, 9);
    assert.equal(host.findByClass("d3-flow-node-part-title").length, 9);
    mounted.destroy();
  } finally { restoreDom(); }
});

test("processing thumbnails use shared SVG paths without animation states", () => {
  const restoreDom = installFakeDom();
  try {
    const motifs = ["data-import", "peak-search", "shared-peak-shape", "marker-selection", "regression"] as const;
    const nodes: DiagramBlock["nodes"] = motifs.map((visualMotif, i) => ({
      id: `step-${i}`, label: `Step ${i}`, description: "Processing result",
      visualMotif, visualMotifRole: "highlight", source: [{resourceId: `ex:step-${i}`}],
    }));
    const edges = nodes.slice(1).map((node, i) => ({
      id: `edge-${i}`, sourceNodeId: nodes[i]!.id, targetNodeId: node.id,
      label: "Marker areas", source: [{resourceId: `ex:edge-${i}`}],
    }));
    const rendered = createD3FlowRenderModel({...block, nodes, edges, states: []}, {
      reducedMotion: true, interactionPolicy: "static",
    });
    assert.ok(rendered.model);
    const layout = createD3FlowLayout(rendered.model!, 1190);
    const host = new FakeHTMLElement("div");
    const mounted = createSvgD3FlowRuntime().mount(host, rendered.model!, layout);
    assert.deepEqual(host.findByClass("d3-flow-node-motif").map(element => element.getAttribute("data-visual-motif")), [...motifs]);
    assert.ok(host.findByClass("d3-flow-node-motif").every(element => element.findByTag("path").length >= 2));
    mounted.destroy();
  } finally {
    restoreDom();
  }
});

test("hierarchy thumbnails are rendered as native SVG paths for all five authored motifs", () => {
  const restoreDom = installFakeDom();
  try {
    const motifs = ["regression", "nonlinear-curve", "multiple-inputs", "neural-network", "other-models"] as const;
    const nodes: DiagramBlock["nodes"] = [
      { id: "root", label: "MODEL FUNCTION", notation: "f(xᵢ)", visualRole: "hierarchy-root",
        source: [{ resourceId: "ex:root" }] },
      ...motifs.map((motif, i) => ({
        id: `family-${i}`, label: `Family ${i}`, description: `Example ${i}`,
        visualRole: i === 4 ? "hierarchy-other" : "hierarchy-option",
        visualMotif: motif, visualMotifRole: "highlight" as const,
        source: [{ resourceId: `ex:family-${i}` }],
      })),
    ];
    const edges: DiagramBlock["edges"] = nodes.slice(1).map((node, i) => ({
      id: `edge-${i}`, sourceNodeId: "root", targetNodeId: node.id,
      label: "example", source: [{ resourceId: `ex:edge-${i}` }],
    }));
    const rendered = createD3FlowRenderModel({ ...block, nodes, edges }, {
      reducedMotion: true, interactionPolicy: "static",
    });
    assert.ok(rendered.model);
    const layout = createD3FlowLayout(rendered.model!, 1190);
    assert.equal(layout.strategy, "hierarchy-fanout");
    const host = new FakeHTMLElement("div");
    const mounted = createSvgD3FlowRuntime().mount(host, rendered.model!, layout);
    assert.equal(host.findByClass("d3-flow-node-motif").length, 5);
    assert.ok(host.findByClass("d3-flow-node").every((element) =>
      element.style.getPropertyValue("--d3-flow-card-hue") !== ""));
    const motifsSeen = host.findByClass("d3-flow-node-motif").map((element) => element.getAttribute("data-visual-motif"));
    assert.deepEqual(motifsSeen, [...motifs]);
    assert.ok(host.findByClass("d3-flow-node-motif").every((element) => element.findByTag("path").length > 0));
    assert.equal(host.findByClass("d3-flow-node-notation").length, 1);
    assert.equal(host.findByClass("d3-flow-edge").length, 5);
    assert.ok(host.findByClass("d3-flow-edge").every((element) => (element.getAttribute("d") ?? "").includes(" L ")));
    mounted.destroy();
  } finally {
    restoreDom();
  }
});

test("every supported semantic motif has reusable native SVG primitives outside a hierarchy", () => {
  const restoreDom = installFakeDom();
  try {
    for (const visualMotif of VISUAL_MOTIF_KEYS) {
      const rendered = createD3FlowRenderModel({
        ...block,
        nodes: block.nodes.map((node, index) => index === 0
          ? { ...node, description: "  Generic  illustration\nwith authored spacing", visualMotif, visualMotifRole: "highlight" }
          : node),
      }, { reducedMotion: true, interactionPolicy: "static" });
      assert.ok(rendered.model);
      const host = new FakeHTMLElement("div");
      const mounted = createSvgD3FlowRuntime().mount(host, rendered.model, createD3FlowLayout(rendered.model, 1200));
      const motifs = host.findByClass("d3-flow-node-motif");
      assert.equal(motifs.length, 1, visualMotif);
      assert.equal(motifs[0]!.getAttribute("data-visual-motif"), visualMotif);
      assert.ok(motifs[0]!.findByTag("path").every((path) => (path.getAttribute("d") ?? "").startsWith("M")), visualMotif);
      assert.equal(host.findByClass("d3-flow-node-body")[0]!.children.map((child) => child.textContent ?? "").join(""),
        "  Generic  illustration\nwith authored spacing");
      mounted.destroy();
    }
  } finally {
    restoreDom();
  }
});
