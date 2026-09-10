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

test("wrapFlowText preserves all authored characters", () => {
  const text = "alpha  beta gamma-delta";
  const lines = wrapFlowText(text, 7, (value) => Array.from(value).length);
  assert.equal(lines.join(""), text);
  assert.ok(lines.length > 1);
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
