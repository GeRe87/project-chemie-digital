import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { SceneDocument } from "../../core/src/scene-document.ts";
import {
  canonicalSerializeRevealRenderPlan,
  createRevealRenderPlan,
} from "../src/index.ts";

const fixtureUrl = new URL("../../../docs/examples/standard-deviation-scene-document-1.0.json", import.meta.url);

async function fixture(): Promise<SceneDocument> {
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as SceneDocument;
}

const interactive = { reducedMotion: false, interactionPolicy: "interactive-when-supported" } as const;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

test("golden plan preserves all five standard-deviation scenes and semantic identities", async () => {
  const document = await fixture();
  const result = createRevealRenderPlan(document, interactive);
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.plan);
  assert.equal(result.plan.version, "1.0");
  assert.equal(result.plan.sourceDocumentId, document.id);
  assert.equal(result.plan.sourcePathId, document.sourcePathId);
  assert.equal(result.plan.sections.length, 5);
  assert.deepEqual(result.plan.sections.map((section) => section.sourceSceneId), document.scenes.map((scene) => scene.id));
  assert.deepEqual(result.plan.sections.map((section) => section.semanticLabel), [
    "Standardabweichung: Definition",
    "Stichprobenstandardabweichung: Formel",
    "Formelzeichen der Stichprobenstandardabweichung",
    "Anwendungsbeispiele zur Standardabweichung",
    "Übung zur Stichprobenstandardabweichung",
  ]);
  for (const [index, section] of result.plan.sections.entries()) {
    const scene = document.scenes[index]!;
    assert.deepEqual(section.readingOrder, scene.readingOrder);
    assert.deepEqual(section.source, scene.source);
    assert.deepEqual(section.nodes.map((node) => node.sourceBlockId), scene.blocks.map((block) => block.id));
  }
  assert.deepEqual(result.plan.sections.map((section) => section.nodes.map((node) => node.kind)), [
    ["prose"], ["math"], ["math", "math", "math", "math"], ["prose", "prose"], ["prompt"],
  ]);
});

test("canonical serialization is byte-stable across repeated runs", async () => {
  const document = await fixture();
  const first = createRevealRenderPlan(document, interactive).plan!;
  const second = createRevealRenderPlan(document, interactive).plan!;
  assert.equal(canonicalSerializeRevealRenderPlan(first), canonicalSerializeRevealRenderPlan(second));
});

test("source references, disclosure, intent and accessible alternatives are preserved", async () => {
  const document = await fixture();
  const plan = createRevealRenderPlan(document, interactive).plan!;
  const definition = plan.sections[0]!.nodes[0]!;
  assert.deepEqual(definition.source, document.scenes[0]!.blocks[0]!.source);
  assert.deepEqual(definition.disclosure, { order: 0, mode: "initial" });
  assert.deepEqual(definition.intent, { kind: "introduce" });
  const math = plan.sections[1]!.nodes[0]!;
  assert.equal(math.kind, "math");
  if (math.kind === "math") assert.match(math.staticFallback, /Quadratwurzel/);
  const prompt = plan.sections[4]!.nodes[0]!;
  assert.equal(prompt.kind, "prompt");
  if (prompt.kind === "prompt") assert.equal(prompt.staticFallback, prompt.fallback);
});

test("static and reduced-motion modes retain complete semantic content without fragments", async () => {
  const document = await fixture();
  const progressive = clone(document);
  progressive.scenes[3]!.blocks[1]!.disclosure = { order: 1, mode: "progressive" };
  const staticPlan = createRevealRenderPlan(progressive, { reducedMotion: false, interactionPolicy: "static" }).plan!;
  const reducedPlan = createRevealRenderPlan(progressive, { reducedMotion: true, interactionPolicy: "interactive-when-supported" }).plan!;
  for (const plan of [staticPlan, reducedPlan]) {
    assert.equal(plan.sections.length, document.scenes.length);
    assert.equal(plan.sections[3]!.nodes.length, 2);
    assert.equal(plan.sections[3]!.nodes[1]!.fragment, undefined);
    assert.ok(plan.sections[3]!.nodes[1]!.staticFallback.length > 0);
  }
});

test("interactive mode derives fragment metadata from disclosure order", async () => {
  const document = await fixture();
  const progressive = clone(document);
  progressive.scenes[3]!.blocks[1]!.disclosure = { order: 1, mode: "progressive" };
  const node = createRevealRenderPlan(progressive, interactive).plan!.sections[3]!.nodes[1]!;
  assert.deepEqual(node.fragment, { index: 1, mode: "progressive" });
});

test("stable diagnostics fail atomically", async () => {
  const document = await fixture();
  const unsupportedVersion = clone(document) as SceneDocument & { version: string };
  unsupportedVersion.version = "2.0";
  let result = createRevealRenderPlan(unsupportedVersion as SceneDocument, interactive);
  assert.equal(result.plan, undefined);
  assert.equal(result.diagnostics[0]!.code, "UNSUPPORTED_SCENE_DOCUMENT_VERSION");

  const duplicateDisclosure = clone(document);
  duplicateDisclosure.scenes[3]!.blocks[1]!.disclosure = { order: 0, mode: "progressive" };
  result = createRevealRenderPlan(duplicateDisclosure, interactive);
  assert.equal(result.plan, undefined);
  assert.equal(result.diagnostics[0]!.code, "INVALID_DISCLOSURE_ORDER");

  const missingAlternative = clone(document);
  const math = missingAlternative.scenes[1]!.blocks[0]!;
  if (math.kind === "math") math.spokenText = "";
  result = createRevealRenderPlan(missingAlternative, interactive);
  assert.equal(result.plan, undefined);
  assert.equal(result.diagnostics[0]!.code, "INVALID_SCENE_DOCUMENT");

  const unsupportedPrimitive = clone(document) as unknown as { scenes: Array<{ blocks: Array<Record<string, unknown>> }> };
  unsupportedPrimitive.scenes[0]!.blocks[0]!.kind = "chart";
  result = createRevealRenderPlan(unsupportedPrimitive as unknown as SceneDocument, interactive);
  assert.equal(result.plan, undefined);
  assert.equal(result.diagnostics[0]!.code, "UNSUPPORTED_PRIMITIVE");
});

test("plan generation performs no network I/O and captures no learner state", async () => {
  const document = await fixture();
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("network forbidden");
  }) as typeof fetch;
  try {
    const result = createRevealRenderPlan(document, interactive);
    assert.ok(result.plan);
    assert.equal(fetchCalls, 0);
    assert.equal("learnerState" in result.plan, false);
    assert.equal("telemetry" in result.plan, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("core and composer sources do not import the renderer package", async () => {
  const files = [
    new URL("../../core/src/index.ts", import.meta.url),
    new URL("../../core/src/scene-document.ts", import.meta.url),
    new URL("../../core/src/scene-composer.ts", import.meta.url),
  ];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    assert.doesNotMatch(content, /renderer-reveal|RevealRenderPlan|reveal\.js/i);
  }
});
