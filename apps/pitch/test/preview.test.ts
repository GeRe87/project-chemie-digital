import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compilePitchSceneDocuments, STANDARD_DEVIATION_SCENE_ID } from "../src/graph-scene-data.ts";
import {
  conceptDocument as generatedConceptDocument,
  resourceDocument as generatedResourceDocument,
  sceneDocument as generatedSceneDocument,
} from "../src/generated/standard-deviation-scene-data.ts";
import { installNoNetworkGuard, mountSceneDocuments, type MinimalElement } from "../src/preview.ts";

class FakeElement implements MinimalElement {
  private html = ""; className = ""; textContent: string | null = null; children: FakeElement[] = []; attributes = new Map<string,string>();
  get innerHTML(): string { return this.html; }
  set innerHTML(value: string) { this.html = value; if (value === "") this.children = []; }
  appendChild(node: MinimalElement): void { this.children.push(node as FakeElement); }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
}

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}

test("portable browser data boundary remains identical to authored JSON-LD", () => {
  assert.deepEqual(generatedConceptDocument, readJson("../../../content/concepts/standard-deviation.jsonld"));
  assert.deepEqual(generatedResourceDocument, readJson("../../../content/resources/standard-deviation-resources.jsonld"));
  assert.deepEqual(generatedSceneDocument, readJson("../../../content/scenes/standard-deviation-definition-with-citation.jsonld"));
});

test("renders the compiled standard-deviation scene with RDF identity and provenance", () => {
  const documents = compilePitchSceneDocuments();
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, documents);
  assert.equal(root.children.length, 1);
  const section = root.children[0]!;
  assert.equal(section.attributes.get("data-source-path-id"), STANDARD_DEVIATION_SCENE_ID);
  assert.equal(section.children[0]?.textContent, "Standardabweichung");
  assert.equal(section.children[1]?.attributes.get("data-resource-id"), "ex:standard-deviation-definition-basic");
  assert.match(section.children[1]?.attributes.get("data-provenance-ids") ?? "", /reference-statistics-01/);
  destroy(); assert.equal(root.children.length, 0); destroy();
});

test("RDF definition mutation propagates without renderer edits", async () => {
  const { compileGraphBackedScene } = await import("../../../packages/core/src/graph-scene-compiler.ts");
  const conceptDocument = readJson("../../../content/concepts/standard-deviation.jsonld");
  const resourceDocument = readJson("../../../content/resources/standard-deviation-resources.jsonld") as { "@graph": Array<Record<string, unknown>> };
  const sceneDocument = readJson("../../../content/scenes/standard-deviation-definition-with-citation.jsonld");
  const definition = resourceDocument["@graph"].find((node) => node.id === "ex:standard-deviation-definition-basic");
  assert.ok(definition);
  definition.body = { "@value": "Mutierte RDF-Definition", "@language": "de" };
  const result = compileGraphBackedScene({ conceptDocument, resourceDocument, sceneDocument }, STANDARD_DEVIATION_SCENE_ID);
  assert.ok(result.document, JSON.stringify(result.diagnostics));
  const root = new FakeElement(); mountSceneDocuments({ root, createElement: () => new FakeElement() }, [result.document]);
  assert.equal(root.children[0]?.children[1]?.textContent, "Mutierte RDF-Definition");
});

test("renderer runtime contains no duplicated authored pitch prose", () => {
  const runtime = ["../src/preview.ts", "../src/main.ts"].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
  const resources = readJson("../../../content/resources/standard-deviation-resources.jsonld") as { "@graph": Array<Record<string, unknown>> };
  const definition = resources["@graph"].find((node) => node.id === "ex:standard-deviation-definition-basic");
  assert.ok(definition);
  const body = (definition.body as { "@value": string })["@value"];
  assert.equal(runtime.includes(body), false);
  assert.equal(runtime.includes("Standardabweichung"), false);
});

test("keeps the complete static fallback", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.equal([...html.matchAll(/data-pitch-step=/g)].length, 9);
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
