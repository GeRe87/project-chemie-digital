import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { SceneDocument } from "../../core/src/scene-document.ts";
import {
  canonicalSerializeSelfStudyRenderPlan,
  createSelfStudyRenderPlan,
  renderSelfStudyHtml,
  type SelfStudyNodePlan,
} from "../src/index.ts";

const fixtureUrl = new URL("../../../docs/examples/standard-deviation-scene-document-1.0.json", import.meta.url);

async function fixture(): Promise<SceneDocument> {
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as SceneDocument;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function extendedDocument(document: SceneDocument): SceneDocument {
  const result = clone(document) as any;
  const scene = result.scenes[0];
  scene.blocks.push(
    {
      id: "block:media",
      kind: "media-reference",
      source: [{ resourceId: "ex:media", provenanceIds: ["graph:test"] }],
      uri: "https://example.invalid/resource.pdf",
      mediaType: "application/pdf",
      alternativeText: "Begleitmaterial",
      disclosure: { order: 10, mode: "optional" },
      intent: { kind: "explain" },
    },
    {
      id: "block:group",
      kind: "group",
      source: [{ resourceId: "ex:group", provenanceIds: ["graph:test"] }],
      disclosure: { order: 11, mode: "progressive" },
      readingOrder: ["block:group-b", "block:group-a"],
      children: [
        { id: "block:group-a", kind: "prose", source: [{ resourceId: "ex:a" }], text: "A", disclosure: { order: 0, mode: "initial" } },
        { id: "block:group-b", kind: "prose", source: [{ resourceId: "ex:b" }], text: "B", disclosure: { order: 1, mode: "progressive" } },
      ],
    },
    {
      id: "block:code",
      kind: "code",
      source: [{ resourceId: "ex:code" }],
      language: "r",
      code: "sd(c(6, 8, 10))",
      editable: true,
      executable: true,
      fallback: "R-Beispiel zur Standardabweichung",
      disclosure: { order: 12, mode: "progressive" },
      intent: { kind: "practice" },
    },
  );
  scene.readingOrder.push("block:media", "block:group", "block:code");
  return result as SceneDocument;
}

function leafNodes(nodes: readonly SelfStudyNodePlan[]): SelfStudyNodePlan[] {
  return nodes.flatMap((node) => node.kind === "group" ? leafNodes(node.children) : [node]);
}

test("same SceneDocument produces byte-identical self-study render plans", async () => {
  const document = await fixture();
  const first = createSelfStudyRenderPlan(document);
  const second = createSelfStudyRenderPlan(document);
  assert.deepEqual(first.diagnostics, []);
  assert.ok(first.plan && second.plan);
  assert.equal(canonicalSerializeSelfStudyRenderPlan(first.plan), canonicalSerializeSelfStudyRenderPlan(second.plan));
});

test("canonical scene and source identities plus reading order are preserved", async () => {
  const document = await fixture();
  const plan = createSelfStudyRenderPlan(document).plan!;
  assert.equal(plan.sourceDocumentId, document.id);
  assert.equal(plan.sourcePathId, document.sourcePathId);
  assert.deepEqual(plan.sections.map((section) => section.sourceSceneId), document.scenes.map((scene) => scene.id));
  for (const [index, section] of plan.sections.entries()) {
    const scene = document.scenes[index]!;
    assert.deepEqual(section.source, scene.source);
    assert.deepEqual(section.readingOrder, scene.readingOrder);
    assert.deepEqual(section.nodes.map((node) => node.sourceBlockId), scene.readingOrder);
  }
});

test("all current block kinds map and nested group reading order is authoritative", async () => {
  const document = extendedDocument(await fixture());
  const plan = createSelfStudyRenderPlan(document).plan!;
  const topLevelKinds = new Set(plan.sections.flatMap((section) => section.nodes.map((node) => node.kind)));
  for (const kind of ["prose", "math", "code", "media-reference", "group", "prompt"]) assert.ok(topLevelKinds.has(kind as any), `missing ${kind}`);
  const group = plan.sections[0]!.nodes.find((node) => node.sourceBlockId === "block:group");
  assert.equal(group?.kind, "group");
  if (!group || group.kind !== "group") throw new Error("group missing");
  assert.deepEqual(group.readingOrder, ["block:group-b", "block:group-a"]);
  assert.deepEqual(group.children.map((child) => child.sourceBlockId), ["block:group-b", "block:group-a"]);
});

test("optional and progressive disclosure metadata remains deterministic and renderer-owned", async () => {
  const plan = createSelfStudyRenderPlan(extendedDocument(await fixture())).plan!;
  const nodes = plan.sections[0]!.nodes;
  assert.equal(nodes.find((node) => node.sourceBlockId === "block:media")?.disclosureMode, "optional");
  assert.equal(nodes.find((node) => node.sourceBlockId === "block:group")?.disclosureMode, "progressive");
  assert.equal(nodes.find((node) => node.sourceBlockId === "block:code")?.disclosureMode, "progressive");
  assert.deepEqual(nodes.filter((node) => node.disclosureMode === "progressive").map((node) => node.disclosure?.order), [11, 12]);
});

test("invalid SceneDocument fails atomically before render-plan creation", async () => {
  const invalid = clone(await fixture()) as SceneDocument & { version: string };
  invalid.version = "2.0";
  let result = createSelfStudyRenderPlan(invalid as SceneDocument);
  assert.equal(result.plan, undefined);
  assert.equal(result.diagnostics[0]?.code, "UNSUPPORTED_SCENE_DOCUMENT_VERSION");

  const broken = clone(await fixture()) as any;
  broken.scenes[0].readingOrder = ["unknown-block"];
  result = createSelfStudyRenderPlan(broken as SceneDocument);
  assert.equal(result.plan, undefined);
  assert.equal(result.diagnostics[0]?.code, "INVALID_SCENE_DOCUMENT");
});

test("static fallback exposes all leaf authored content and never relies on details", async () => {
  const plan = createSelfStudyRenderPlan(extendedDocument(await fixture())).plan!;
  const html = renderSelfStudyHtml(plan, { interactive: false });
  for (const section of plan.sections) {
    assert.ok(html.includes(section.semanticLabel));
    for (const node of leafNodes(section.nodes)) {
      const probe = node.staticFallback.slice(0, Math.min(20, node.staticFallback.length));
      const escaped = probe.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      assert.ok(html.includes(escaped) || html.includes(probe), `missing leaf fallback ${node.sourceBlockId}`);
    }
  }
  assert.match(html, /Begleitmaterial/);
  assert.match(html, /sd\(c\(6, 8, 10\)\)/);
  assert.doesNotMatch(html, /<details/);
});

test("interactive HTML uses native details while retaining authored fallbacks", async () => {
  const plan = createSelfStudyRenderPlan(extendedDocument(await fixture())).plan!;
  const html = renderSelfStudyHtml(plan, { interactive: true });
  assert.match(html, /data-disclosure-mode="optional"/);
  assert.match(html, /data-disclosure-mode="progressive"/);
  assert.match(html, /<details/);
  assert.match(html, /class="self-study-fallback"/);
});

test("renderer source has no semantic-store, network, persistence or analytics dependency", async () => {
  const files = [new URL("../src/index.ts", import.meta.url), new URL("../src/browser.ts", import.meta.url)];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /Fuseki|SPARQL|localStorage|indexedDB|document\.cookie|telemetry|analytics|fetch\s*\(/i);
  }
});

test("core does not import the self-study renderer", async () => {
  for (const path of ["../../core/src/index.ts", "../../core/src/scene-document.ts", "../../core/src/scene-composer.ts"]) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /renderer-self-study|SelfStudyRenderPlan/i);
  }
});
