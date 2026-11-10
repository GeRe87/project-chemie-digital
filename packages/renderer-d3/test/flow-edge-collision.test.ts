import assert from "node:assert/strict";
import test from "node:test";
import {
  createD3FlowLayout,
  d3FlowEdgeLabelPanelGeometry,
  resolveEdgeLabelCollisions,
  type D3FlowLayoutEdge,
  type D3FlowLayoutNode,
  type D3FlowLayoutStrategy,
} from "../src/flow-layout.ts";

type Rect = {x: number; y: number; width: number; height: number};
const overlaps = (a: Rect, b: Rect, padding: number): boolean =>
  Math.abs(a.x - b.x) < (a.width + b.width) / 2 + padding
  && Math.abs(a.y - b.y) < (a.height + b.height) / 2 + padding;

function assertClear(edges: readonly D3FlowLayoutEdge[], nodes: readonly D3FlowLayoutNode[], width: number, height: number, strategy: D3FlowLayoutStrategy): void {
  const panels = edges.filter(edge => edge.labelLines.length).map(edge => d3FlowEdgeLabelPanelGeometry(edge, strategy));
  for (const [index, panel] of panels.entries()) {
    assert.ok(panel.x - panel.width / 2 >= 8);
    assert.ok(panel.x + panel.width / 2 <= width - 8);
    assert.ok(panel.y - panel.height / 2 >= 8);
    assert.ok(panel.y + panel.height / 2 <= height - 8);
    for (const node of nodes) assert.equal(overlaps(panel, node, 10), false);
    for (const previous of panels.slice(0, index)) assert.equal(overlaps(panel, previous, 8), false);
  }
}

const graph = {
  diagramType: "flow" as const,
  nodes: ["q7", "z2", "m9", "v4"].map(id => ({id, label: `Item ${id}`})),
  edges: [
    {id: "r8", sourceNodeId: "q7", targetNodeId: "m9", label: "  Praxisbeitrag  "},
    {id: "s3", sourceNodeId: "z2", targetNodeId: "m9", label: "Shares context"},
    {id: "t6", sourceNodeId: "z2", targetNodeId: "v4", label: "Supports work"},
  ],
};

test("exact panel geometry retains SVG dimensions and its two-pixel offset", () => {
  const edge = {labelX: 100, labelY: 80, labelLines: ["abcdefghij", "x"]};
  assert.deepEqual(d3FlowEdgeLabelPanelGeometry(edge, "layered-flow"), {x: 100, y: 78, width: 136, height: 56});
  for (const strategy of ["radial-network", "triadic-network"] as const) {
    assert.deepEqual(d3FlowEdgeLabelPanelGeometry(edge, strategy), {x: 100, y: 78, width: 163.5, height: 48});
  }
  assert.equal(d3FlowEdgeLabelPanelGeometry({...edge, labelLines: ["x"]}, "layered-flow").height, 34);
  assert.equal(d3FlowEdgeLabelPanelGeometry({...edge, labelLines: ["x"]}, "radial-network").height, 30);
});

test("opaque two-source two-target topology retains every authored character and clears actual panels", () => {
  const snapshot = JSON.stringify(graph);
  const layout = createD3FlowLayout(graph, 1395);
  assert.deepEqual(createD3FlowLayout(graph, 1395), layout);
  assertClear(layout.edges, layout.nodes, layout.width, layout.height, layout.strategy);
  assert.deepEqual(layout.nodes.map(node => node.id), graph.nodes.map(node => node.id));
  for (const [index, edge] of layout.edges.entries()) {
    const authored = graph.edges[index]!;
    assert.equal(edge.id, authored.id);
    assert.equal(edge.sourceNodeId, authored.sourceNodeId);
    assert.equal(edge.targetNodeId, authored.targetNodeId);
    assert.equal(edge.labelLines.join(""), authored.label);
  }
  assert.equal(JSON.stringify(graph), snapshot);
});

const nodes: readonly D3FlowLayoutNode[] = [
  {id: "q7", x: 650, y: 210, width: 400, height: 380, labelLines: ["Source"], bodyLines: []},
  {id: "z2", x: 650, y: 610, width: 400, height: 380, labelLines: ["Source"], bodyLines: []},
  {id: "m9", x: 650, y: 1010, width: 400, height: 380, labelLines: ["Target"], bodyLines: []},
  {id: "v4", x: 650, y: 1410, width: 400, height: 380, labelLines: ["Target"], bodyLines: []},
];
const crowded: readonly D3FlowLayoutEdge[] = graph.edges.map(edge => ({
  ...edge, x1: 650, y1: 810, x2: 650, y2: 820,
  labelX: 650, labelY: 810, labelLines: [edge.label],
}));

test("bounded fallback reaches empty side gutters after every local horizontal candidate fails", () => {
  for (const strategy of ["layered-flow", "radial-network", "triadic-network"] as const) {
    const resolved = resolveEdgeLabelCollisions(crowded, nodes, 1395, 1620, strategy, "horizontal");
    assertClear(resolved, nodes, 1395, 1620, strategy);
    assert.deepEqual(resolveEdgeLabelCollisions(crowded, nodes, 1395, 1620, strategy, "horizontal"), resolved);
    for (const [index, edge] of resolved.entries()) {
      const original = crowded[index]!;
      assert.ok(Math.abs(edge.labelX - original.labelX) > 64);
      assert.deepEqual({...edge, labelX: original.labelX, labelY: original.labelY}, original);
    }
  }
});

test("already valid local placement remains unchanged", () => {
  const edge = {...crowded[0]!, labelX: 180, labelY: 810};
  const resolved = resolveEdgeLabelCollisions([edge], nodes, 1395, 1620, "grouped-network", "horizontal");
  assert.deepEqual(resolved, [edge]);
});

test("missing room honestly retains unresolved geometry without changing nodes or labels", () => {
  const edge = crowded[0]!;
  const full = [{...nodes[0]!, x: 697.5, y: 810, width: 1395, height: 1620}];
  const snapshot = JSON.stringify({edge, full});
  const resolved = resolveEdgeLabelCollisions([edge], full, 1395, 1620, "grouped-network", "horizontal");
  assert.deepEqual(resolved, [edge]);
  assert.equal(overlaps(d3FlowEdgeLabelPanelGeometry(resolved[0]!, "grouped-network"), full[0]!, 10), true);
  assert.equal(JSON.stringify({edge, full}), snapshot);
});
