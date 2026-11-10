import assert from "node:assert/strict";
import { test } from "node:test";
import { d3FlowEdgePath } from "../src/flow-diagram.ts";
import {
  createD3FlowLayout,
  type D3FlowLayout,
  type D3FlowLayoutInput,
  type D3FlowLayoutNode,
  type D3FlowLayoutPoint,
} from "../src/flow-layout.ts";

function fixture(): D3FlowLayoutInput {
  return {
    diagramType: "flow",
    nodes: [
      { id: "copper", label: "First", description: "A short description." },
      { id: "willow", label: "Middle", description: "A longer description explaining the intermediate operation and its result." },
      { id: "harbor", label: "Last", description: "The resulting comparison." },
    ],
    edges: [
      { id: "near-one", sourceNodeId: "copper", targetNodeId: "willow", label: "Next" },
      { id: "near-two", sourceNodeId: "willow", targetNodeId: "harbor", label: "Next" },
      { id: "comparison", sourceNodeId: "copper", targetNodeId: "harbor", label: "Total −2 pp", visualRole: "comparison" },
    ],
  };
}

function assertFinite(layout: D3FlowLayout): void {
  assert.ok(Number.isFinite(layout.width) && layout.width > 0);
  assert.ok(Number.isFinite(layout.height) && layout.height > 0);
  for (const node of layout.nodes) {
    for (const value of [node.x, node.y, node.width, node.height]) assert.ok(Number.isFinite(value));
  }
  for (const edge of layout.edges) {
    for (const value of [edge.x1, edge.y1, edge.x2, edge.y2, edge.labelX, edge.labelY]) {
      assert.ok(Number.isFinite(value));
    }
    for (const point of edge.routePoints ?? []) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    }
  }
}

// Independent orthogonal-segment invariant, not an expected routing algorithm.
function assertMissesInterior(a: D3FlowLayoutPoint, b: D3FlowLayoutPoint, node: D3FlowLayoutNode): void {
  const left = node.x - node.width / 2;
  const right = node.x + node.width / 2;
  const top = node.y - node.height / 2;
  const bottom = node.y + node.height / 2;
  if (a.y === b.y) {
    assert.ok(!(a.y > top && a.y < bottom
      && Math.max(a.x, b.x) > left && Math.min(a.x, b.x) < right));
  } else {
    assert.equal(a.x, b.x);
    assert.ok(!(a.x > left && a.x < right
      && Math.max(a.y, b.y) > top && Math.min(a.y, b.y) < bottom));
  }
}

// Parse emitted absolute SVG commands independently of the routing implementation.
function parseSvgPolyline(path: string): D3FlowLayoutPoint[] {
  const tokens: string[] = [];
  const tokenPattern = /[MLHV]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
  let end = 0;
  for (const match of path.matchAll(tokenPattern)) {
    assert.match(path.slice(end, match.index), /^[\s,]*$/);
    tokens.push(match[0]);
    end = match.index! + match[0].length;
  }
  assert.match(path.slice(end), /^[\s,]*$/);
  assert.equal(tokens[0], "M");
  let index = 0;
  let command = "";
  const points: D3FlowLayoutPoint[] = [];
  function number(): number {
    const token = tokens[index++];
    assert.ok(token !== undefined && !/^[MLHV]$/.test(token));
    const value = Number(token);
    assert.ok(Number.isFinite(value));
    return value;
  }
  while (index < tokens.length) {
    if (/^[MLHV]$/.test(tokens[index]!)) command = tokens[index++]!;
    assert.ok(command === "M" || command === "L" || command === "H" || command === "V");
    const previous = points[points.length - 1];
    let point: D3FlowLayoutPoint;
    if (command === "M" || command === "L") {
      if (command === "M") assert.equal(points.length, 0, "expected one continuous subpath");
      else assert.ok(previous);
      point = { x: number(), y: number() };
    } else {
      assert.ok(previous);
      point = command === "H"
        ? { x: number(), y: previous.y }
        : { x: previous.x, y: number() };
    }
    points.push(point);
    if (command === "M") command = "L";
  }
  assert.ok(points.length >= 2);
  return points;
}

// Same-input node geometry recorded before the routing change, not a different graph.
const nodeGeometry = new Map<number, readonly {id:string;x:number;y:number;width:number;height:number}[]>([
  [900, [{"id": "copper", "x": 150, "y": 236, "width": 252, "height": 202}, {"id": "willow", "x": 588.89, "y": 236, "width": 279.78, "height": 202}, {"id": "harbor", "x": 1027.78, "y": 236, "width": 252, "height": 202}]],
  [1200, [{"id": "copper", "x": 161.11, "y": 236, "width": 252, "height": 202}, {"id": "willow", "x": 600, "y": 236, "width": 279.78, "height": 202}, {"id": "harbor", "x": 1038.8899999999999, "y": 236, "width": 252, "height": 202}]]
]);

for (const width of [900, 1200]) {
  test(`same-row forward comparison avoids intermediate cards at ${width}`, () => {
    const input = fixture();
    const snapshot = JSON.stringify(input);
    const layout = createD3FlowLayout(input, width);
    assert.equal(layout.strategy, "layered-flow");
    assert.equal(layout.orientation, "horizontal");
    assertFinite(layout);
    const source = layout.nodes.find(node => node.id === "copper")!;
    const middle = layout.nodes.find(node => node.id === "willow")!;
    const target = layout.nodes.find(node => node.id === "harbor")!;
    assert.ok(Math.abs(source.y - middle.y) < 1);
    assert.ok(Math.abs(source.y - target.y) < 1);
    const edge = layout.edges.find(item => item.id === "comparison")!;
    assert.ok(edge.routePoints && edge.routePoints.length >= 4);
    assert.deepEqual(edge.routePoints[0], { x: source.x + source.width / 2, y: source.y });
    assert.deepEqual(edge.routePoints[edge.routePoints.length - 1], { x: target.x - target.width / 2, y: target.y });
    assert.deepEqual(edge.routePoints[0], { x: edge.x1, y: edge.y1 });
    assert.deepEqual(edge.routePoints[edge.routePoints.length - 1], { x: edge.x2, y: edge.y2 });
    for (const point of edge.routePoints) {
      assert.ok(point.x >= 0 && point.x <= layout.width);
      assert.ok(point.y >= 0 && point.y <= layout.height);
    }
    for (let index = 1; index < edge.routePoints.length; index++) {
      const a = edge.routePoints[index - 1]!;
      const b = edge.routePoints[index]!;
      assert.ok(a.x === b.x || a.y === b.y);
      assertMissesInterior(a, b, middle);
    }
    const svgPoints = parseSvgPolyline(d3FlowEdgePath(edge, layout.orientation, layout.strategy));
    assert.deepEqual(svgPoints[0], { x: edge.x1, y: edge.y1 });
    assert.deepEqual(svgPoints[svgPoints.length - 1], { x: edge.x2, y: edge.y2 });
    for (const point of svgPoints) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
      assert.ok(point.x >= 0 && point.x <= layout.width);
      assert.ok(point.y >= 0 && point.y <= layout.height);
    }
    for (let index = 1; index < svgPoints.length; index++) {
      const a = svgPoints[index - 1]!;
      const b = svgPoints[index]!;
      assert.ok(a.x === b.x || a.y === b.y);
      assertMissesInterior(a, b, middle);
    }
    for (const [id, from, to] of [
      ["near-one", source, middle],
      ["near-two", middle, target],
    ] as const) {
      const adjacent = layout.edges.find(item => item.id === id)!;
      assert.equal(adjacent.routePoints, undefined);
      assert.deepEqual(
        [adjacent.x1, adjacent.y1, adjacent.x2, adjacent.y2],
        [from.x + from.width / 2, from.y, to.x - to.width / 2, to.y],
      );
    }
    assert.deepEqual(layout.nodes.map(node => node.id), input.nodes.map(node => node.id));
    assert.deepEqual(layout.edges.map(item => item.id), input.edges.map(item => item.id));
    for (const authored of input.edges) {
      const actual = layout.edges.find(item => item.id === authored.id)!;
      assert.equal(actual.sourceNodeId, authored.sourceNodeId);
      assert.equal(actual.targetNodeId, authored.targetNodeId);
      assert.equal(actual.visualRole, authored.visualRole);
      assert.equal(actual.labelLines.join(" "), authored.label);
    }
    assert.deepEqual(layout.nodes.map(({id,x,y,width,height}) => ({id,x,y,width,height})), nodeGeometry.get(width));
    assert.deepEqual(createD3FlowLayout(input, width), layout);
    assert.equal(JSON.stringify(input), snapshot);
  });
}

test("an unobstructed long edge does not acquire a detour", () => {
  const input: D3FlowLayoutInput = {
    diagramType: "flow",
    nodes: [
      { id: "west", label: "Start" },
      { id: "east", label: "Finish" },
    ],
    edges: [{ id: "open", sourceNodeId: "west", targetNodeId: "east", label: "An unobstructed connection with a longer label" }],
  };
  const layout = createD3FlowLayout(input, 1200);
  assertFinite(layout);
  assert.equal(layout.orientation, "horizontal");
  assert.equal(layout.edges[0]!.routePoints, undefined);
});

test("narrow vertical flow remains finite, deterministic and unmodified", () => {
  const input = fixture();
  const snapshot = JSON.stringify(input);
  const layout = createD3FlowLayout(input, 320);
  assert.equal(layout.orientation, "vertical");
  assertFinite(layout);
  for (const edge of layout.edges) assert.equal(edge.routePoints, undefined);
  assert.deepEqual(createD3FlowLayout(input, 320), layout);
  assert.equal(JSON.stringify(input), snapshot);
});
