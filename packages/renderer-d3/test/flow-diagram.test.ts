import assert from "node:assert/strict";
import test from "node:test";
import type { DiagramBlock } from "../../core/src/index.ts";
import {
  createD3FlowRenderModel,
  mountD3FlowDiagram,
  type D3FlowRuntimePort,
} from "../src/flow-diagram.ts";

const block: DiagramBlock = {
  kind: "diagram",
  id: "diagram:analytical-flow",
  diagramType: "flow",
  label: "Analytical data flow",
  description: "A canonical three-stage flow.",
  source: [{ resourceId: "scene:flow", relationPath: "cd:body", provenanceIds: ["prov:scene"] }],
  nodes: [
    { id: "node:raw", label: "Raw data", source: [{ resourceId: "ex:raw", relationPath: "skos:prefLabel@en" }] },
    { id: "node:metadata", label: "Metadata", source: [{ resourceId: "ex:metadata", relationPath: "dct:title", provenanceIds: ["prov:metadata"] }], emphasis: "primary" },
    { id: "node:reuse", label: "Reusable result", source: [{ resourceId: "ex:reuse", relationPath: "schema:name" }] },
  ],
  edges: [
    { id: "edge:describe", sourceNodeId: "node:raw", targetNodeId: "node:metadata", label: "described by", source: [{ resourceId: "ex:describe", relationPath: "skos:prefLabel@en" }] },
    { id: "edge:reuse", sourceNodeId: "node:metadata", targetNodeId: "node:reuse", label: "enables", source: [{ resourceId: "ex:enables", relationPath: "dct:title" }] },
  ],
  focusNodeId: "node:metadata",
};

const keyboardOptions = { reducedMotion: true, interactionPolicy: "keyboard" as const };

test("maps a canonical DiagramBlock deterministically without mutating it", () => {
  const before = JSON.stringify(block);
  const first = createD3FlowRenderModel(block, keyboardOptions);
  const second = createD3FlowRenderModel(structuredClone(block), keyboardOptions);
  assert.deepEqual(first.diagnostics, []);
  assert.deepEqual(second.diagnostics, []);
  assert.ok(first.model);
  assert.ok(second.model);
  assert.deepEqual(first.model, second.model);
  assert.equal(JSON.stringify(block), before);
  assert.equal(first.model.focusNodeId, "node:metadata");
  assert.deepEqual(first.model.nodeReadingOrder, ["node:raw", "node:metadata", "node:reuse"]);
  assert.deepEqual(first.model.edgeReadingOrder, ["edge:describe", "edge:reuse"]);
  assert.equal(first.model.nodes[1]!.emphasis, "primary");
  assert.equal(first.model.nodes[1]!.source[0]!.relationPath, "dct:title");
  assert.deepEqual(first.model.nodes[1]!.source[0]!.provenanceIds, ["prov:metadata"]);
  assert.match(first.model.staticFallback, /Raw data/);
  assert.match(first.model.staticFallback, /Metadata — enables → Reusable result/);
});

test("optional focus is valid and does not invent a focus node", () => {
  const withoutFocus = { ...block, focusNodeId: undefined } as DiagramBlock;
  const result = createD3FlowRenderModel(withoutFocus, keyboardOptions);
  assert.ok(result.model);
  assert.equal(result.model.focusNodeId, undefined);
});

test("accepts network diagrams including relation-free semantic groupings and fails closed for unsupported types", () => {
  const network = createD3FlowRenderModel({ ...block, diagramType: "network" }, keyboardOptions);
  assert.equal(network.model?.diagramType, "network");

  const relationFree = createD3FlowRenderModel({
    ...block,
    diagramType: "network",
    edges: [],
    groups: [{ id: "group:layer", label: "Layer", source: [{ resourceId: "group:layer" }] }],
    nodes: block.nodes.map((node) => ({ ...node, groupIds: node.id === "node:metadata" ? undefined : ["group:layer"] })),
  }, keyboardOptions);
  assert.equal(relationFree.model?.diagramType, "network");
  assert.deepEqual(relationFree.model?.edges, []);
  assert.match(relationFree.model?.staticFallback ?? "", /Groups:/);

  const unsupported = createD3FlowRenderModel({ ...block, diagramType: "hierarchy" } as unknown as DiagramBlock, keyboardOptions);
  assert.equal(unsupported.model, undefined);
  assert.equal(unsupported.diagnostics[0]!.code, "UNSUPPORTED_FLOW_DIAGRAM_TYPE");

  const invalid = createD3FlowRenderModel({
    ...block,
    edges: [{ ...block.edges[0]!, targetNodeId: "node:missing" }],
  }, keyboardOptions);
  assert.equal(invalid.model, undefined);
  assert.equal(invalid.diagnostics[0]!.code, "INVALID_FLOW_DIAGRAM");
  assert.match(invalid.diagnostics[0]!.message, /unknown node/);
});

test("network layout is deterministic from group membership rather than node identities or coordinates", () => {
  const network: DiagramBlock = {
    ...block,
    diagramType: "network",
    groups: [
      { id: "group:instruments", label: "Instruments", source: [{ resourceId: "ex:instruments" }] },
      { id: "group:processing", label: "Processing", source: [{ resourceId: "ex:processing-group" }] },
    ],
    nodes: [
      { ...block.nodes[0]!, groupIds: ["group:instruments"] },
      { ...block.nodes[1]!, groupIds: ["group:instruments"] },
      { ...block.nodes[2]!, visualRole: "highlight", groupIds: ["group:processing"] },
    ],
  };
  const first = mountD3FlowDiagram({}, network, keyboardOptions, {
    measureHost() { return 900; },
    mount() { return { update() {}, focusNode() {}, destroy() {} }; },
  });
  const second = mountD3FlowDiagram({}, structuredClone(network), keyboardOptions, {
    measureHost() { return 900; },
    mount() { return { update() {}, focusNode() {}, destroy() {} }; },
  });
  assert.ok(!("diagnostics" in first));
  assert.ok(!("diagnostics" in second));
  if ("diagnostics" in first || "diagnostics" in second) return;
  assert.deepEqual(first.layout, second.layout);
  const positions = new Map(first.layout.nodes.map((node) => [node.id, node]));
  assert.equal(positions.get("node:metadata")!.x, first.layout.width / 2);
  assert.equal(first.model.nodes[2]!.visualRole, "highlight");
  assert.deepEqual(first.model.nodes[2]!.groupIds, ["group:processing"]);
});

test("keyboard lifecycle prefers canonical focus and preserves it across responsive rerender", () => {
  const focused: string[] = [];
  const updates: Array<{ orientation: string; active?: string }> = [];
  const initial: Array<{ orientation: string; active?: string }> = [];
  let resizeCallback: ((width: number) => void) | undefined;
  let destroys = 0;
  let observerStops = 0;
  const runtime: D3FlowRuntimePort = {
    measureHost() { return 1200; },
    mount(_host, _model, layout, activeNodeId) {
      initial.push({ orientation: layout.orientation, active: activeNodeId });
      return {
        update(nextLayout, nextActiveNodeId) { updates.push({ orientation: nextLayout.orientation, active: nextActiveNodeId }); },
        focusNode(nodeId) { focused.push(nodeId); },
        destroy() { destroys += 1; },
      };
    },
    observeResize(_host, callback) {
      resizeCallback = callback;
      return () => { observerStops += 1; };
    },
  };

  const mounted = mountD3FlowDiagram({}, block, keyboardOptions, runtime);
  assert.ok(!("diagnostics" in mounted));
  if ("diagnostics" in mounted) return;

  assert.equal(mounted.layout.orientation, "horizontal");
  assert.equal(mounted.activeNodeId, "node:metadata");
  assert.deepEqual(initial, [{ orientation: "horizontal", active: "node:metadata" }]);
  assert.deepEqual(focused, ["node:metadata"]);

  assert.equal(mounted.handleKey("ArrowRight"), true);
  assert.equal(mounted.activeNodeId, "node:reuse");
  assert.equal(mounted.handleKey("Home"), true);
  assert.equal(mounted.activeNodeId, "node:raw");
  assert.equal(mounted.handleKey("End"), true);
  assert.equal(mounted.activeNodeId, "node:reuse");
  assert.equal(mounted.handleKey("PageDown"), false);

  resizeCallback?.(640);
  assert.equal(mounted.layout.orientation, "vertical");
  assert.deepEqual(updates.at(-1), { orientation: "vertical", active: "node:reuse" });

  mounted.destroy();
  mounted.destroy();
  assert.equal(destroys, 1);
  assert.equal(observerStops, 1);
});

test("static mode creates no keyboard focus traversal", () => {
  const focused: string[] = [];
  const runtime: D3FlowRuntimePort = {
    measureHost() { return 640; },
    mount() {
      return {
        update() {},
        focusNode(nodeId) { focused.push(nodeId); },
        destroy() {},
      };
    },
  };
  const mounted = mountD3FlowDiagram({}, block, { reducedMotion: true, interactionPolicy: "static" }, runtime);
  assert.ok(!("diagnostics" in mounted));
  if ("diagnostics" in mounted) return;
  assert.equal(mounted.layout.orientation, "vertical");
  assert.equal(mounted.handleKey("ArrowRight"), false);
  mounted.focusNode("node:raw");
  assert.deepEqual(focused, []);
});

test("mapping performs no network requests", () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests += 1; throw new Error("network forbidden"); };
  try {
    assert.ok(createD3FlowRenderModel(block, keyboardOptions).model);
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
