import assert from "node:assert/strict";
import test from "node:test";
import type { Scene, SceneBlock, SceneDocument, SourceReference } from "../../../packages/core/src/scene-document.ts";
import { validateSceneDocument } from "../../../packages/core/src/scene-document.ts";
import {
  inferRevealCompositionPlan,
  resolveCodeFunctionLegendUnits,
  resolveDefinitionFormulaPairs,
  resolveFormulaLegendUnits,
} from "../../../packages/renderer-reveal/src/composition-policy.ts";
import { mountSceneDocuments, type MinimalElement } from "../src/preview.ts";

const source = (resourceId: string, relationPath?: string): readonly SourceReference[] => [
  { resourceId, provenanceIds: ["https://example.org/graph/content"], ...(relationPath ? { relationPath } : {}) },
];
const heading: SceneBlock = {
  id: "heading", kind: "prose", text: "Neutral structure", intent: { kind: "introduce" }, source: source("urn:heading"),
};
const formula = (id: string): SceneBlock => ({
  id, kind: "math", expression: "z=1", spokenText: "z equals one", source: source(`urn:${id}`),
});
const card = (id: string, emphasis: "primary" | "supporting" = "primary", owner?: string): SceneBlock => ({
  id, kind: "definition-list", emphasis,
  source: owner ? [...source(owner, "dct:hasPart"), ...source(`urn:${id}`, "cd:hasDefinitionListEntry")] : source(`urn:${id}`),
  entries: [{ id: `${id}-entry`, term: "Label", description: "Explanation", source: source(`urn:${id}-entry`) }],
});
const scene = (blocks: readonly SceneBlock[]): Scene => ({
  id: "neutral", source: source("urn:neutral"), blocks: [heading, ...blocks], readingOrder: [heading.id, ...blocks.map(b => b.id)],
});
const document = (value: Scene): SceneDocument => ({
  version: "1.7", id: "neutral-document", sourcePathId: "urn:path", scenes: [value],
});

class Element implements MinimalElement {
  className = "";
  textContent: string | null = null;
  innerHTML = "";
  children: Element[] = [];
  attributes = new Map<string, string>();
  appendChild(node: MinimalElement): void { this.children.push(node as Element); }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
}
function walk(element: Element): Element[] { return [element, ...element.children.flatMap(walk)]; }
function render(value: Scene): Element[] {
  const input = document(value);
  validateSceneDocument(input);
  const root = new Element();
  mountSceneDocuments({ root, createElement: () => new Element() }, [input]);
  return walk(root);
}

test("a supporting legend cannot also consume the next independent formula", () => {
  const input = scene([card("context"), formula("a"), card("legend", "supporting", "urn:a"), formula("b")]);
  const before = JSON.stringify(input);
  assert.equal(resolveDefinitionFormulaPairs(input), undefined);
  assert.deepEqual(resolveFormulaLegendUnits(input).map(unit => unit.map(b => b.id)), [["context", "a", "legend"]]);
  const nodes = render(input);
  assert.deepEqual(nodes.filter(e => e.attributes.get("data-component-kind") === "formula")
    .map(e => e.attributes.get("data-resource-id")), ["urn:a", "urn:b"]);
  for (const resource of ["urn:context", "urn:a", "urn:legend", "urn:b"]) {
    assert.ok(nodes.some(e => e.attributes.get("data-resource-id")?.split(" ").includes(resource)), resource);
  }
  assert.ok(nodes.some(e => e.attributes.get("data-provenance-ids") === "https://example.org/graph/content"));
  assert.equal(JSON.stringify(input), before, "projection must not mutate semantic input");
});

test("adjacency without the owning dct:hasPart relation never creates a formula legend", () => {
  for (const relationPath of [undefined, "dct:references", "cd:hasKeyPoint"]) {
    const unrelated: SceneBlock = { ...card("unrelated", "supporting"), source: source("urn:a", relationPath) };
    const input = scene([formula("a"), unrelated, formula("b")]);
    assert.deepEqual(resolveFormulaLegendUnits(input), []);
    assert.equal(render(input).filter(e => e.attributes.get("data-component-kind") === "formula").length, 2);
  }
  assert.deepEqual(resolveFormulaLegendUnits(scene([formula("a"), card("wrong-owner", "supporting", "urn:b")])), []);
});

test("formula ownership checks every source and preserves explicit reading order", () => {
  const a = { ...formula("a"), source: [...source("urn:extra"), ...source("urn:a")] };
  const input = scene([a, card("legend", "supporting", "urn:a")]);
  const reordered = { ...input, blocks: [...input.blocks].reverse() };
  assert.deepEqual(resolveFormulaLegendUnits(reordered).map(u => u.map(b => b.id)), [["a", "legend"]]);
  assert.deepEqual(inferRevealCompositionPlan(reordered), inferRevealCompositionPlan(input));
});

test("code legend ownership does not depend on source-array order", () => {
  const code: SceneBlock = { id: "code", kind: "code", language: "r", code: "1+1", fallback: "1+1",
    editable: true, executable: true, source: source("urn:code") };
  const input = scene([code, card("functions", "supporting", "urn:code")]);
  const changed = scene([{ ...code, source: [...source("urn:other"), ...code.source] }, input.blocks[2]!]);
  assert.deepEqual(resolveCodeFunctionLegendUnits(changed).map(u => [u.code.id, u.legend.id]), [["code", "functions"]]);
  assert.deepEqual(inferRevealCompositionPlan(changed), inferRevealCompositionPlan(input));
});

test("consistent identity and label substitution preserves structural layout and grouping", () => {
  const input = scene([formula("a"), card("legend", "supporting", "urn:a"), formula("b")]);
  const substitute = (value: unknown): unknown => {
    if (typeof value === "string") return value.replaceAll("urn:", "https://unrelated.example/")
      .replaceAll("Label", "Other").replaceAll("Explanation", "Other words");
    if (Array.isArray(value)) return value.map(substitute);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, substitute(v)]));
    return value;
  };
  const changed = substitute(input) as Scene;
  validateSceneDocument(document(changed));
  assert.deepEqual(inferRevealCompositionPlan(changed), inferRevealCompositionPlan(input));
  assert.deepEqual(resolveFormulaLegendUnits(changed).map(u => u.map(b => b.id)), [["a", "legend"]]);
  assert.deepEqual(resolveFormulaLegendUnits(scene([])), []);
  assert.deepEqual(inferRevealCompositionPlan(scene([])).placements.map(p => p.blockId), ["heading"]);
});
