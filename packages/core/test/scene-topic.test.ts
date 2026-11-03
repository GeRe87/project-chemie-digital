import test from "node:test";
import assert from "node:assert/strict";
import { validateSceneDocument, type SceneDocument } from "../src/scene-document.ts";

const source = [{ resourceId: "urn:authored-topic", relationPath: "skos:prefLabel@en" }];
const document = (topic: unknown, version: SceneDocument["version"] = "1.13"): SceneDocument => ({
  version, id: "doc", sourcePathId: "urn:path",
  scenes: [{ id: "scene", source, blocks: [{ id: "heading", kind: "prose", text: "A specific step", source }], readingOrder: ["heading"], ...(topic === undefined ? {} : { topic }) }],
} as SceneDocument);

test("authored topic context is optional, source-linked and gated to unpublished 1.13", () => {
  validateSceneDocument(document({ label: "Sampling · Student-t", source }));
  validateSceneDocument(document(undefined, "1.0"));
  assert.throws(() => validateSceneDocument(document({ label: "Sampling", source }, "1.12")), /1.13/);
});

test("empty, malformed, unbounded and unsourced topic context fails closed", () => {
  for (const topic of [null, "text", {}, { label: " ", source }, { label: "x".repeat(81), source }, { label: "Sampling", source: [] }, { label: "Sampling" }, { label: "Sampling", source: [{ resourceId: "" }] }]) {
    assert.throws(() => validateSceneDocument(document(topic)));
  }
});
