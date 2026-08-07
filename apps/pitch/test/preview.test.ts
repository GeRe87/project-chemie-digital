import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canonicalDatasetFingerprint,
  canonicalDatasetSnapshot,
  compilePitchSceneDocuments,
  STANDARD_DEVIATION_PATH_ID,
} from "../src/graph-scene-data.ts";
import { installNoNetworkGuard, mountSceneDocuments, type MinimalElement } from "../src/preview.ts";

class FakeElement implements MinimalElement {
  private html = ""; className = ""; textContent: string | null = null; children: FakeElement[] = []; attributes = new Map<string,string>();
  get innerHTML(): string { return this.html; }
  set innerHTML(value: string) { this.html = value; if (value === "") this.children = []; }
  appendChild(node: MinimalElement): void { this.children.push(node as FakeElement); }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
}

test("canonical runtime exposes one fingerprinted Dataset snapshot", () => {
  assert.match(canonicalDatasetFingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.equal(canonicalDatasetSnapshot.identity, canonicalDatasetFingerprint);
  assert.ok(canonicalDatasetSnapshot.entities.some((entity) => entity.id === "ex:standard-deviation"));
  assert.ok(canonicalDatasetSnapshot.statements.length > 0);
});

test("renders the complete nine-scene Standardabweichung path with RDF provenance", () => {
  const documents = compilePitchSceneDocuments();
  assert.equal(documents.length, 1);
  assert.equal(documents[0]?.sourcePathId, STANDARD_DEVIATION_PATH_ID);
  assert.equal(documents[0]?.scenes.length, 9);
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, documents);
  assert.equal(root.children.length, 9);
  const first = root.children[0]!;
  assert.equal(first.attributes.get("data-source-path-id"), STANDARD_DEVIATION_PATH_ID);
  assert.equal(first.children[0]?.textContent, "Standardabweichung");
  assert.equal(first.children[1]?.attributes.get("data-resource-id"), "ex:sd-definition-basic-de");
  assert.match(first.children[1]?.attributes.get("data-provenance-ids") ?? "", /graph\/specifications\/standard-deviation/);
  assert.equal(first.children[1]?.attributes.get("data-relation-path"), "cd:hasDefinition");
  destroy(); assert.equal(root.children.length, 0); destroy();
});

test("renders the canonical formula locally as KaTeX math", () => {
  const documents = compilePitchSceneDocuments();
  const formulaBlock = documents[0]!.scenes[3]!.blocks[1]!;
  assert.equal(formulaBlock.kind, "math");
  if (formulaBlock.kind !== "math") throw new Error("expected math block");
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, documents);
  const formulaNode = root.children[3]!.children[1]!;
  assert.equal(formulaNode.className, "math-display");
  assert.equal(formulaNode.attributes.get("role"), "math");
  assert.equal(formulaNode.attributes.get("aria-label"), formulaBlock.spokenText);
  assert.equal(formulaNode.attributes.get("data-resource-id"), "ex:sample-sd-formula");
  assert.match(formulaNode.innerHTML, /class="katex-display"/);
  assert.match(formulaNode.innerHTML, /<math/);
  destroy();
});

test("renderer runtime contains no audience-authored Standardabweichung prose", () => {
  const runtime = ["../src/preview.ts", "../src/main.ts", "../src/graph-scene-data.ts"]
    .map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
  assert.equal(runtime.includes("Die Standardabweichung beschreibt, wie stark Werte"), false);
  assert.equal(runtime.includes("Koffeinbestimmung"), false);
});

test("keeps a complete nine-item static fallback boundary", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const documents = compilePitchSceneDocuments();
  const sceneIds = [...html.matchAll(/data-pitch-step="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(sceneIds, documents[0]!.scenes.map((scene) => scene.id));
  for (const scene of documents[0]!.scenes) {
    for (const block of scene.blocks) {
      if (block.kind === "prose") assert.ok(html.includes(block.text), `static fallback is missing ${block.id}`);
      if (block.kind === "math") {
        assert.ok(html.includes(block.expression), `static fallback is missing math expression ${block.id}`);
        assert.ok(html.includes(block.spokenText), `static fallback is missing spoken math alternative ${block.id}`);
      }
    }
  }
  assert.match(html, /math-fallback/);
  assert.match(html, /Introductory Statistics|NIST\/SEMATECH/);
});

test("rejects missing compiled input before partial mounting", () => {
  const root = new FakeElement();
  assert.throws(() => mountSceneDocuments({ root, createElement: () => new FakeElement() }, []), /at least one/);
  assert.equal(root.children.length, 0);
});

test("prohibits runtime network calls and restores the host", () => {
  const original = () => Promise.resolve(new Response());
  const target: { fetch?: typeof fetch; XMLHttpRequest?: unknown; WebSocket?: unknown } = { fetch: original as typeof fetch };
  const restore = installNoNetworkGuard(target); assert.throws(() => target.fetch?.("https://example.invalid"), /prohibited/); restore(); assert.equal(target.fetch, original);
});
