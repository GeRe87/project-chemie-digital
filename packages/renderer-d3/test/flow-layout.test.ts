import assert from "node:assert/strict";
import test from "node:test";
import {
  createD3FlowLayout,
  flowOrientationForWidth,
  wrapFlowText,
} from "../src/flow-layout.ts";

const input = {
  nodes: [
    { id: "node:raw", label: "Raw analytical data" },
    { id: "node:metadata", label: "Metadata and semantic meaning" },
    { id: "node:reuse", label: "FAIR reusable output" },
  ],
  edges: [
    { id: "edge:describe", sourceNodeId: "node:raw", targetNodeId: "node:metadata", label: "describe" },
    { id: "edge:reuse", sourceNodeId: "node:metadata", targetNodeId: "node:reuse", label: "enables reuse" },
  ],
} as const;

const branchedInput = {
  nodes: [
    { id: "raw", label: "RAW DATA" },
    { id: "process", label: "PROCESS" },
    { id: "algorithm", label: "ALGORITHM" },
    { id: "parameters", label: "PARAMETERS" },
    { id: "artifact", label: "ARTIFACT" },
  ],
  edges: [
    { id: "raw-process", sourceNodeId: "raw", targetNodeId: "process", label: "input" },
    { id: "raw-algorithm", sourceNodeId: "raw", targetNodeId: "algorithm", label: "software" },
    { id: "raw-parameters", sourceNodeId: "raw", targetNodeId: "parameters", label: "configuration" },
    { id: "process-artifact", sourceNodeId: "process", targetNodeId: "artifact", label: "produces" },
    { id: "algorithm-artifact", sourceNodeId: "algorithm", targetNodeId: "artifact", label: "recorded with" },
    { id: "parameters-artifact", sourceNodeId: "parameters", targetNodeId: "artifact", label: "recorded with" },
  ],
} as const;

test("selects horizontal and vertical layouts from host width without reordering semantics", () => {
  assert.equal(flowOrientationForWidth(1200), "horizontal");
  assert.equal(flowOrientationForWidth(640), "vertical");

  const wide = createD3FlowLayout(input, 1200);
  const narrow = createD3FlowLayout(input, 640);
  assert.equal(wide.orientation, "horizontal");
  assert.equal(narrow.orientation, "vertical");
  assert.deepEqual(wide.nodes.map((node) => node.id), input.nodes.map((node) => node.id));
  assert.deepEqual(narrow.nodes.map((node) => node.id), input.nodes.map((node) => node.id));
  assert.deepEqual(wide.edges.map((edge) => edge.id), input.edges.map((edge) => edge.id));
  assert.deepEqual(narrow.edges.map((edge) => edge.id), input.edges.map((edge) => edge.id));
  assert.ok(wide.nodes[1]!.x > wide.nodes[0]!.x);
  assert.equal(wide.nodes[1]!.y, wide.nodes[0]!.y);
  assert.ok(narrow.nodes[1]!.y > narrow.nodes[0]!.y);
  assert.equal(narrow.nodes[1]!.x, narrow.nodes[0]!.x);
});

test("long horizontal node labels wrap before colliding with card chrome", () => {
  const layout = createD3FlowLayout({
    nodes: [
      { id: "input", label: "FAIR / OPEN DATA" },
      { id: "processing", label: "CUSTOM PROCESSING" },
      { id: "result", label: "RESULT" },
    ],
    edges: [
      { id: "a", sourceNodeId: "input", targetNodeId: "processing", label: "processed by" },
      { id: "b", sourceNodeId: "processing", targetNodeId: "result", label: "produces" },
    ],
  }, 1200);
  const processing = layout.nodes.find((node) => node.id === "processing")!;
  assert.ok(processing.labelLines.length >= 2);
  assert.equal(processing.labelLines.join(""), "CUSTOM PROCESSING");
});

test("horizontal flow content is centered when the host is wider than its intrinsic graph", () => {
  const wide = createD3FlowLayout(input, 1600);
  const left = Math.min(...wide.nodes.map((node) => node.x - node.width / 2));
  const right = Math.max(...wide.nodes.map((node) => node.x + node.width / 2));
  assert.ok(Math.abs((left + right) / 2 - wide.width / 2) < 1);
});

test("branched DAGs place same-depth provenance siblings in one visual layer", () => {
  const wide = createD3FlowLayout(branchedInput, 1200);
  const byId = new Map(wide.nodes.map((node) => [node.id, node]));
  const raw = byId.get("raw")!;
  const process = byId.get("process")!;
  const algorithm = byId.get("algorithm")!;
  const parameters = byId.get("parameters")!;
  const artifact = byId.get("artifact")!;

  assert.ok(process.x > raw.x);
  assert.equal(process.x, algorithm.x);
  assert.equal(process.x, parameters.x);
  assert.notEqual(process.y, algorithm.y);
  assert.notEqual(algorithm.y, parameters.y);
  assert.ok(artifact.x > process.x);
  assert.ok(wide.width < 1500, "layering should avoid a five-node linear strip");

  const narrow = createD3FlowLayout(branchedInput, 640);
  const narrowById = new Map(narrow.nodes.map((node) => [node.id, node]));
  assert.equal(narrowById.get("process")!.y, narrowById.get("algorithm")!.y);
  assert.equal(narrowById.get("process")!.y, narrowById.get("parameters")!.y);
  assert.notEqual(narrowById.get("process")!.x, narrowById.get("algorithm")!.x);
  assert.ok(narrowById.get("artifact")!.y > narrowById.get("process")!.y);
});

test("parallel flow rows reserve generic breathing room for relationship label panels", () => {
  const plain = createD3FlowLayout(branchedInput, 1200);
  const detailed = createD3FlowLayout({
    ...branchedInput,
    edges: branchedInput.edges.map((edge) => edge.id === "raw-algorithm" ? { ...edge, label: "software configuration and environment provenance" } : edge),
  }, 1200);
  const rowDistance = (layout: ReturnType<typeof createD3FlowLayout>): number => {
    const byId = new Map(layout.nodes.map((node) => [node.id, node]));
    return Math.abs(byId.get("algorithm")!.y - byId.get("process")!.y);
  };

  assert.ok(rowDistance(plain) >= 92, "one-line label panels retain 12px of breathing room");
  assert.ok(rowDistance(detailed) > rowDistance(plain), "wrapped label panels increase parallel row clearance");
});

test("network layouts place the authored focus centrally and cluster typed group memberships radially", () => {
  const network = createD3FlowLayout({
    diagramType: "network",
    focusNodeId: "processing",
    groups: [{ id: "mass" }, { id: "separation" }],
    nodes: [
      { id: "lcms", label: "LC-MS", groupIds: ["mass"] },
      { id: "gcms", label: "GC-MS", groupIds: ["mass"] },
      { id: "hplc", label: "HPLC", groupIds: ["separation"] },
      { id: "ion", label: "Ion chromatograph", groupIds: ["separation"] },
      { id: "processing", label: "Common processing" },
    ],
    edges: [
      { id: "lcms-processing", sourceNodeId: "lcms", targetNodeId: "processing", label: "feeds" },
      { id: "gcms-processing", sourceNodeId: "gcms", targetNodeId: "processing", label: "feeds" },
      { id: "hplc-processing", sourceNodeId: "hplc", targetNodeId: "processing", label: "feeds" },
      { id: "ion-processing", sourceNodeId: "ion", targetNodeId: "processing", label: "feeds" },
    ],
  }, 1200);
  const byId = new Map(network.nodes.map((node) => [node.id, node]));
  const focus = byId.get("processing")!;
  assert.equal(focus.x, network.width / 2);
  assert.ok(Math.abs(focus.y - network.height / 2) < 100);
  assert.ok(byId.get("lcms")!.y < focus.y);
  assert.ok(byId.get("hplc")!.y > focus.y);
  assert.ok(byId.get("lcms")!.y < byId.get("hplc")!.y);
});

test("small ungrouped networks stay spatial inside a narrow presentation panel", () => {
  const layout = createD3FlowLayout({
    diagramType: "network",
    nodes: [
      { id: "anna", label: "Anna" },
      { id: "essen", label: "Essen" },
      { id: "university", label: "University" },
    ],
    edges: [
      { id: "lives", sourceNodeId: "anna", targetNodeId: "essen", label: "livesIn" },
      { id: "works", sourceNodeId: "anna", targetNodeId: "university", label: "worksAt" },
      { id: "located", sourceNodeId: "university", targetNodeId: "essen", label: "locatedIn" },
    ],
  }, 420);

  assert.equal(layout.strategy, "triadic-network");
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  assert.notEqual(byId.get("anna")!.x, byId.get("essen")!.x);
  assert.notEqual(byId.get("essen")!.x, byId.get("university")!.x);
  assert.equal(new Set(layout.nodes.map((node) => node.y)).size, 2);
  assert.ok(layout.nodes.every((node) => node.labelLines.length === 1), "short entity labels stay on one line");
  assert.ok(byId.get("anna")!.y < byId.get("essen")!.y);
  assert.equal(byId.get("essen")!.y, byId.get("university")!.y);
  assert.equal(byId.get("anna")!.x, layout.width / 2);
  assert.ok(byId.get("university")!.x < byId.get("anna")!.x);
  assert.ok(byId.get("essen")!.x > byId.get("anna")!.x);
  assert.ok(layout.nodes.every((node) => node.width >= 146), "compact network nodes reserve readable label width");
  assert.ok(layout.edges.some((edge) => edge.x1 !== edge.x2 && edge.y1 !== edge.y2));

  const center = { x: layout.width / 2, y: layout.height / 2 };
  for (const edge of layout.edges) {
    const edgeMid = { x: (edge.x1 + edge.x2) / 2, y: (edge.y1 + edge.y2) / 2 };
    const midpointDistance = Math.hypot(edgeMid.x - center.x, edgeMid.y - center.y);
    const labelDistance = Math.hypot(edge.labelX - center.x, edge.labelY - center.y);
    assert.ok(labelDistance > midpointDistance, "relationship labels move away from the network center");
  }

  const baseEdge = layout.edges.find((edge) => {
    const source = byId.get(edge.sourceNodeId)!;
    const target = byId.get(edge.targetNodeId)!;
    return Math.abs(source.y - target.y) < 1;
  })!;
  const baseSource = byId.get(baseEdge.sourceNodeId)!;
  const baseTarget = byId.get(baseEdge.targetNodeId)!;
  assert.ok(
    baseEdge.labelY > Math.max(
      baseSource.y + baseSource.height / 2,
      baseTarget.y + baseTarget.height / 2,
    ),
    "lower relationship label clears both endpoint nodes",
  );
});

test("relation-free focused grouped networks use deterministic concentric rings", () => {
  const layout = createD3FlowLayout({
    diagramType: "network",
    focusNodeId: "focus",
    groups: [
      { id: "group:inner", label: "Inner layer" },
      { id: "group:outer", label: "Outer layer" },
    ],
    nodes: [
      { id: "focus", label: "Core" },
      { id: "inner:a", label: "Alpha", groupIds: ["group:inner"] },
      { id: "inner:b", label: "Beta", groupIds: ["group:inner"] },
      { id: "outer:a", label: "Gamma", groupIds: ["group:outer"] },
      { id: "outer:b", label: "Delta", groupIds: ["group:outer"] },
      { id: "outer:c", label: "Epsilon", groupIds: ["group:outer"] },
    ],
    edges: [],
  }, 1200);

  assert.equal(layout.strategy, "concentric-network");
  assert.equal(layout.groups.length, 2);
  assert.ok(layout.groups[1]!.radius > layout.groups[0]!.radius);
  assert.ok(layout.nodes.find((node) => node.id === "inner:a")!.width > layout.nodes.find((node) => node.id === "outer:a")!.width);
  assert.ok(layout.nodes.every((node) => node.width === node.height), "concentric nodes render as true circles");
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  assert.equal(byId.get("focus")!.x, layout.width / 2);
  assert.equal(byId.get("focus")!.y, layout.groups[0]!.cy);
  const radius = (id: string) => Math.hypot(
    byId.get(id)!.x - layout.groups[0]!.cx,
    byId.get(id)!.y - layout.groups[0]!.cy,
  );
  assert.ok(Math.abs(radius("inner:a") - layout.groups[0]!.radius) < 0.001);
  assert.ok(Math.abs(radius("outer:a") - layout.groups[1]!.radius) < 0.001);
  assert.deepEqual(layout.nodes.map((node) => node.id), ["focus", "inner:a", "inner:b", "outer:a", "outer:b", "outer:c"]);
});

test("dense outer rings reserve enough width for readable two-line labels", () => {
  const outerLabels = [
    "Package template",
    "Example package",
    "Service client",
    "MCP gateway",
    "Service creator",
    "Runtime",
    "Workspace store",
    "Bootstrap core",
    "Bootstrap instance",
    "Bootstrap orchestrator",
    "Local source",
    "PyPI source",
  ];
  const layout = createD3FlowLayout({
    diagramType: "network",
    focusNodeId: "core",
    groups: [
      { id: "concepts", label: "Concept layer" },
      { id: "specifications", label: "Specification layer" },
    ],
    nodes: [
      { id: "core", label: "Core" },
      { id: "concept:a", label: "Service", groupIds: ["concepts"] },
      { id: "concept:b", label: "Workspace", groupIds: ["concepts"] },
      { id: "concept:c", label: "Data processing", groupIds: ["concepts"] },
      { id: "concept:d", label: "Package", groupIds: ["concepts"] },
      { id: "concept:e", label: "Installation profile", groupIds: ["concepts"] },
      ...outerLabels.map((label, index) => ({ id: `spec:${index}`, label, groupIds: ["specifications"] })),
    ],
    edges: [],
  }, 1180);

  assert.equal(layout.strategy, "concentric-network");
  const outer = layout.nodes.filter((node) => node.id.startsWith("spec:"));
  assert.equal(outer.length, outerLabels.length);
  assert.ok(outer.every((node) => node.width >= 126));
  assert.ok(outer.every((node) => node.width === node.height), "outer ring nodes stay circular");
  assert.ok(outer.every((node) => node.labelLines.length <= 3), "outer labels should stay within three lines");
  const conceptById = new Map(layout.nodes.map((node) => [node.id, node]));
  assert.deepEqual(
    conceptById.get("concept:e")!.labelLines.map((line) => line.trim()),
    ["Installation", "profile"],
    "inner-ring wrap should use the circle width before splitting words",
  );
  assert.ok(
    outer.find((node) => node.id === "spec:8")!.labelLines.every((line) => line.trim() !== "Bootstra"),
    "outer-ring wrap should not split Bootstrap prematurely",
  );
  assert.ok(layout.groups[1]!.radius >= 300);
  assert.ok(layout.height <= layout.groups[1]!.radius * 2 + 125, "concentric viewBox stays tight enough for scale-to-fit");
  const labelRects = layout.groups.map((group) => ({
    id: group.id,
    x: group.labelX,
    y: group.labelY,
    width: group.labelWidth,
    height: group.labelHeight,
  }));
  const collides = (
    left: { x: number; y: number; width: number; height: number },
    right: { x: number; y: number; width: number; height: number },
    padding = 0,
  ) => Math.abs(left.x - right.x) < (left.width + right.width) / 2 + padding
    && Math.abs(left.y - right.y) < (left.height + right.height) / 2 + padding;

  for (const group of layout.groups) {
    const labelRect = labelRects.find((candidate) => candidate.id === group.id)!;
    assert.ok(layout.nodes.every((node) => !collides(labelRect, node, 10)), `${group.id} label clears every node`);
    assert.ok(
      Math.abs(Math.hypot(group.labelAnchorX - group.cx, group.labelAnchorY - group.cy) - group.radius) < 0.001,
      `${group.id} annotation anchor lies on its ring`,
    );
    assert.ok(
      Math.hypot(group.labelX - group.labelAnchorX, group.labelY - group.labelAnchorY) > 20,
      `${group.id} annotation line has visible length`,
    );
  }
  assert.equal(collides(labelRects[0]!, labelRects[1]!, 12), false, "layer labels must not overlap each other");
});

test("vertical flow labels avoid all node cards and each other", () => {
  const layout = createD3FlowLayout({
    nodes: [
      { id: "core", label: "Core" },
      { id: "concepts", label: "Concepts" },
      { id: "specifications", label: "Specifications" },
    ],
    edges: [
      { id: "core-concepts", sourceNodeId: "core", targetNodeId: "concepts", label: "vocabulary for" },
      { id: "concepts-specs", sourceNodeId: "concepts", targetNodeId: "specifications", label: "used by" },
    ],
  }, 780);

  assert.equal(layout.orientation, "vertical");
  const rect = (edge: (typeof layout.edges)[number]) => ({
    x: edge.labelX,
    y: edge.labelY,
    width: Math.max(48, ...edge.labelLines.map((line) => line.length * 11)) + 18,
    height: Math.max(30, edge.labelLines.length * 22 + 12),
  });
  const hit = (a: {x:number;y:number;width:number;height:number}, b: {x:number;y:number;width:number;height:number}) =>
    Math.abs(a.x - b.x) < (a.width + b.width) / 2 + 6
    && Math.abs(a.y - b.y) < (a.height + b.height) / 2 + 6;

  for (const edge of layout.edges) {
    const label = rect(edge);
    for (const node of layout.nodes) {
      assert.equal(hit(label, node), false, `${edge.id} label must not overlap ${node.id}`);
    }
  }
  assert.equal(hit(rect(layout.edges[0]!), rect(layout.edges[1]!)), false, "edge labels must not overlap each other");
});

test("wrapFlowText preserves all authored characters", () => {
  const text = "alpha  beta gamma-delta";
  const lines = wrapFlowText(text, 7, (value) => Array.from(value).length);
  assert.equal(lines.join(""), text);
  assert.ok(lines.length > 1);
});

test("wrapFlowText preserves authored LF and CRLF delimiters while wrapping", () => {
  const text = "alpha beta\ngamma\r\ndelta";
  const lines = wrapFlowText(text, 5, (value) => Array.from(value).length);
  assert.deepEqual(lines, ["alpha", " beta\n", "gamma\r\n", "delta"]);
  assert.equal(lines.join(""), text);
});

test("long unspaced identifiers are split only at grapheme boundaries", () => {
  const scientist = "👩‍🔬";
  const identifier = `AB${scientist}CD${scientist}EF`;
  const lines = wrapFlowText(identifier, 2, (value) => {
    const Segmenter = (Intl as unknown as { Segmenter: new (locale?: string, options?: { granularity: "grapheme" }) => { segment(text: string): Iterable<{ segment: string }> } }).Segmenter;
    return Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(value)).length;
  });
  assert.equal(lines.join(""), identifier);
  assert.equal(lines.filter((line) => line.includes(scientist)).length, 2);
  assert.ok(lines.every((line) => !line.includes("👩") || line.includes(scientist)));
});

test("grapheme-dependent wrapping fails closed when Intl.Segmenter is unavailable", () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, "Segmenter");
  Object.defineProperty(Intl, "Segmenter", { value: undefined, configurable: true, writable: true });
  try {
    assert.throws(
      () => wrapFlowText("A👩‍🔬B", 8),
      /Intl\.Segmenter is required for grapheme-safe flow text layout/,
    );
  } finally {
    if (descriptor) Object.defineProperty(Intl, "Segmenter", descriptor);
    else delete (Intl as unknown as { Segmenter?: unknown }).Segmenter;
  }
});

test("layout fails closed when an edge references an unknown node", () => {
  assert.throws(
    () => createD3FlowLayout({ ...input, edges: [{ ...input.edges[0], targetNodeId: "node:missing" }] }, 1200),
    /unknown layout node/,
  );
});
