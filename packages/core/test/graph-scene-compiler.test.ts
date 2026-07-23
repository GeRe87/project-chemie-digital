import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  compileGraphBackedScene,
  loadRepositoryStandardDeviationScene,
  type GraphSceneDataset,
  type GraphSceneDiagnosticCode,
} from "../src/graph-scene-compiler.ts";

const sceneId = "ex:scene-standard-deviation-definition-with-citation";

async function dataset(): Promise<GraphSceneDataset> {
  return loadRepositoryStandardDeviationScene(fileURLToPath(new URL("../../..", import.meta.url)));
}

function clone(value: GraphSceneDataset): GraphSceneDataset {
  return structuredClone(value);
}

function expectOnly(result: ReturnType<typeof compileGraphBackedScene>, code: GraphSceneDiagnosticCode): void {
  assert.equal(result.document, undefined);
  assert.equal(result.canonicalJson, undefined);
  assert.deepEqual(result.diagnostics.map((item) => item.code), [code]);
}

test("compiles the graph-backed definition-with-citation scene with RDF traceability", async () => {
  const result = compileGraphBackedScene(await dataset(), sceneId);
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.document);
  assert.equal(result.document.sourcePathId, sceneId);
  assert.deepEqual(result.document.scenes[0]?.readingOrder, [
    "ex:scene-standard-deviation-heading--block",
    "ex:scene-standard-deviation-definition--block",
    "ex:scene-standard-deviation-citation--block",
  ]);
  const [heading, definition, citation] = result.document.scenes[0]!.blocks;
  assert.equal(heading?.kind, "prose");
  assert.equal(heading?.kind === "prose" ? heading.text : undefined, "Standardabweichung");
  assert.deepEqual(heading?.source, [{ resourceId: "ex:standard-deviation" }]);
  assert.equal(definition?.kind === "prose" ? definition.text : undefined, "Die Standardabweichung beschreibt die typische Streuung einzelner Beobachtungen um ihren arithmetischen Mittelwert.");
  assert.deepEqual(definition?.source, [{ resourceId: "ex:standard-deviation-definition-basic", provenanceIds: ["ex:reference-statistics-01"] }]);
  assert.equal(citation?.kind === "prose" ? citation.text : undefined, "Einführende Statistikreferenz");
  assert.deepEqual(citation?.source, [{ resourceId: "ex:reference-statistics-01" }]);
});

test("is byte-stable for identical logical datasets regardless of node and set ordering", async () => {
  const original = await dataset();
  const reordered = clone(original) as GraphSceneDataset & {
    resourceDocument: { "@graph": unknown[] };
    sceneDocument: { "@graph": Array<Record<string, unknown>> };
  };
  reordered.resourceDocument["@graph"].reverse();
  reordered.sceneDocument["@graph"].reverse();
  const scene = reordered.sceneDocument["@graph"].find((node) => node.id === sceneId)!;
  (scene.hasSceneItem as unknown[]).reverse();
  const first = compileGraphBackedScene(original, sceneId);
  const second = compileGraphBackedScene(reordered, sceneId);
  assert.equal(second.canonicalJson, first.canonicalJson);
  assert.equal(compileGraphBackedScene(original, sceneId).canonicalJson, first.canonicalJson);
});

test("loads only repository-local files and contains no network client path", async () => {
  const source = await readFile(new URL("../src/graph-scene-compiler.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bfetch\s*\(|https?:\/\/(?!www\.w3\.org|w3id\.org|schema\.org)/);
  assert.deepEqual(compileGraphBackedScene(await dataset(), sceneId).diagnostics, []);
});

test("rejects unresolved selected resources atomically", async () => {
  const changed = clone(await dataset()) as GraphSceneDataset & { sceneDocument: { "@graph": Array<Record<string, unknown>> } };
  const item = changed.sceneDocument["@graph"].find((node) => node.id === "ex:scene-standard-deviation-definition")!;
  item.selectsResource = "ex:missing-definition";
  expectOnly(compileGraphBackedScene(changed, sceneId), "MISSING_RESOURCE");
});

test("rejects ambiguous German labels atomically", async () => {
  const changed = clone(await dataset()) as GraphSceneDataset & { conceptDocument: Record<string, unknown> };
  changed.conceptDocument.label = [
    { "@value": "Standardabweichung", "@language": "de" },
    { "@value": "Streuung", "@language": "de" },
  ];
  expectOnly(compileGraphBackedScene(changed, sceneId), "AMBIGUOUS_LANGUAGE");
});

test("rejects missing definition and source relation targets atomically", async () => {
  const missingDefinition = clone(await dataset()) as GraphSceneDataset & { conceptDocument: Record<string, unknown> };
  missingDefinition.conceptDocument.hasDefinition = "ex:missing-definition";
  expectOnly(compileGraphBackedScene(missingDefinition, sceneId), "MISSING_RELATION_TARGET");

  const missingSource = clone(await dataset()) as GraphSceneDataset & { resourceDocument: { "@graph": Array<Record<string, unknown>> } };
  const definition = missingSource.resourceDocument["@graph"].find((node) => node.id === "ex:standard-deviation-definition-basic")!;
  definition.hasSource = "ex:missing-source";
  expectOnly(compileGraphBackedScene(missingSource, sceneId), "MISSING_RELATION_TARGET");
});

test("rejects duplicate or non-contiguous ordering atomically", async () => {
  const changed = clone(await dataset()) as GraphSceneDataset & { sceneDocument: { "@graph": Array<Record<string, unknown>> } };
  const item = changed.sceneDocument["@graph"].find((node) => node.id === "ex:scene-standard-deviation-citation")!;
  item.position = 2;
  expectOnly(compileGraphBackedScene(changed, sceneId), "INVALID_ORDERING");
});

test("rejects unsupported communicative roles and selection paths atomically", async () => {
  const unsupportedRole = clone(await dataset()) as GraphSceneDataset & { sceneDocument: { "@graph": Array<Record<string, unknown>> } };
  const roleItem = unsupportedRole.sceneDocument["@graph"].find((node) => node.id === "ex:scene-standard-deviation-heading")!;
  roleItem.communicativeRole = "cd:UnknownRole";
  expectOnly(compileGraphBackedScene(unsupportedRole, sceneId), "UNSUPPORTED_ROLE");

  const unsupportedPath = clone(await dataset()) as GraphSceneDataset & { sceneDocument: { "@graph": Array<Record<string, unknown>> } };
  const pathItem = unsupportedPath.sceneDocument["@graph"].find((node) => node.id === "ex:scene-standard-deviation-definition")!;
  pathItem.selectionPath = "cd:body";
  expectOnly(compileGraphBackedScene(unsupportedPath, sceneId), "UNSUPPORTED_SELECTION_PATH");
});
