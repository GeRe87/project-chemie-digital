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
