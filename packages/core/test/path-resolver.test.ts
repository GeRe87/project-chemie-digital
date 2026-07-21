import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  PathResolutionError,
  resolveLearningPath,
  type JsonLdDocument,
} from "../src/path-resolver.ts";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

async function fixture(path: string): Promise<JsonLdDocument> {
  return JSON.parse(await readFile(`${repositoryRoot}${path}`, "utf8")) as JsonLdDocument;
}

async function documents(): Promise<JsonLdDocument[]> {
  return [
    await fixture("content/concepts/standard-deviation.jsonld"),
    await fixture("content/resources/standard-deviation-resources.jsonld"),
    await fixture("content/paths/standard-deviation-default.jsonld"),
  ];
}

async function pitchDocuments(): Promise<JsonLdDocument[]> {
  return [
    await fixture("content/concepts/chemie-digital-platform.jsonld"),
    await fixture("content/resources/pitch-content.jsonld"),
    await fixture("content/paths/studiendekanat-pitch.jsonld"),
  ];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function pathDocument(docs: JsonLdDocument[], index = 2): Record<string, unknown>[] {
  return docs[index]["@graph"] as Record<string, unknown>[];
}

function expectResolutionError(action: () => unknown, message: RegExp): void {
  assert.throws(action, (error: unknown) => error instanceof PathResolutionError && message.test(error.message));
}

test("resolves the five-step fixture by position, independent of source order", async () => {
  const docs = await documents();
  pathDocument(docs).reverse();

  const resolved = resolveLearningPath(docs, "ex:standard-deviation-default-path");

  assert.equal(resolved.steps.length, 5);
  assert.deepEqual(resolved.steps.map((step) => step.position), [1, 2, 3, 4, 5]);
  assert.deepEqual(resolved.steps[2].resourceIds, [
    "ex:symbol-n",
    "ex:symbol-s",
    "ex:symbol-x-bar",
    "ex:symbol-x-i",
  ]);
  assert.equal(resolved.steps[0].viewType, "concept-introduction");
});

test("resolves the pitch narrative deterministically by semantic purpose", async () => {
  const docs = await pitchDocuments();
  pathDocument(docs).reverse();

  const resolved = resolveLearningPath(docs, "ex:studiendekanat-pitch-path-v1");

  assert.deepEqual(resolved.steps.map((step) => step.position), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(resolved.steps.map((step) => step.viewType), [
    "context-and-opportunity",
    "core-proposition",
    "architecture-layer-explanation",
    "didactic-orchestration-explanation",
    "transformation-boundary-explanation",
    "separation-of-concerns",
    "reuse-and-transfer",
    "proof-of-concept",
    "purpose-and-next-step",
  ]);
  assert.deepEqual(resolved.steps[7].resourceIds, ["ex:pitch-standard-deviation-proof"]);
});

test("rejects a duplicate pitch path position deterministically", async () => {
  const docs = clone(await pitchDocuments());
  const graph = pathDocument(docs);
  graph.find((node) => node.id === "ex:pitch-step-knowledge-first")!.position = 1;
  expectResolutionError(() => resolveLearningPath(docs, "ex:studiendekanat-pitch-path-v1"), /Duplicate path position/);
});

test("fails when the selected path is missing", async () => {
  const docs = await documents();
  expectResolutionError(() => resolveLearningPath(docs, "ex:missing"), /Learning path not found/);
});

test("fails when a referenced step is missing", async () => {
  const docs = await documents();
  const path = pathDocument(docs).find((node) => node.id === "ex:standard-deviation-default-path")!;
  path.hasStep = ["ex:missing-step"];
  expectResolutionError(() => resolveLearningPath(docs, String(path.id)), /Path step not found/);
});

test("fails when a referenced resource is missing", async () => {
  const docs = await documents();
  const step = pathDocument(docs).find((node) => node.id === "ex:sd-step-definition")!;
  step.usesResource = "ex:missing-resource";
  expectResolutionError(() => resolveLearningPath(docs, "ex:standard-deviation-default-path"), /Resource not found/);
});

test("fails on duplicate positions", async () => {
  const docs = await documents();
  const graph = pathDocument(docs);
  graph.find((node) => node.id === "ex:sd-step-expression")!.position = 1;
  expectResolutionError(() => resolveLearningPath(docs, "ex:standard-deviation-default-path"), /Duplicate path position/);
});

test("fails on non-integer positions", async () => {
  const docs = clone(await documents());
  pathDocument(docs).find((node) => node.id === "ex:sd-step-definition")!.position = 1.5;
  expectResolutionError(() => resolveLearningPath(docs, "ex:standard-deviation-default-path"), /must be an integer/);
});

test("fails on non-positive positions", async () => {
  const docs = clone(await documents());
  pathDocument(docs).find((node) => node.id === "ex:sd-step-definition")!.position = 0;
  expectResolutionError(() => resolveLearningPath(docs, "ex:standard-deviation-default-path"), /must be positive/);
});
