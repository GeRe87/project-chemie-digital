import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canonicalDatasetFingerprint,
  canonicalDatasetSnapshot,
  compilePitchSceneDocuments,
  compilePitchSceneDocumentsFromArtifact,
  STANDARD_DEVIATION_PATH_ID,
} from "../src/graph-scene-data.ts";
import { inferPitchLayout, installNoNetworkGuard, mountSceneDocuments, type MinimalElement } from "../src/preview.ts";
import type { Scene } from "../../../packages/core/src/scene-document.ts";

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
  assert.ok(canonicalDatasetSnapshot.entities.some((entity) => entity.id === "ex:sd-precision-poll"));
  assert.ok(canonicalDatasetSnapshot.statements.length > 0);
});

test("accepts a valid single SceneDocument without Standard Deviation path coupling", () => {
  const [standardDeviationDocument] = compilePitchSceneDocuments();
  assert.ok(standardDeviationDocument);
  const genericPathId = "ex:path-chemometrics-mean-values-lecture";
  const documents = compilePitchSceneDocumentsFromArtifact({
    artifactVersion: "1.0",
    datasetFingerprint: canonicalDatasetFingerprint,
    datasetSnapshot: canonicalDatasetSnapshot,
    sceneDocuments: [{ ...standardDeviationDocument, sourcePathId: genericPathId }],
  });
  assert.equal(documents.length, 1);
  assert.equal(documents[0]?.sourcePathId, genericPathId);
});

test("retains exactly-one SceneDocument cardinality for generic preview loading", () => {
  assert.throws(
    () => compilePitchSceneDocumentsFromArtifact({
      artifactVersion: "1.0",
      datasetFingerprint: canonicalDatasetFingerprint,
      datasetSnapshot: canonicalDatasetSnapshot,
      sceneDocuments: [],
    }),
    /exactly one SceneDocument/,
  );
});

test("infers an opening layout from a heading and supporting attribution blocks", () => {
  const scene: Scene = {
    id: "ex:scene-unseen-title--scene",
    source: [{ resourceId: "ex:scene-unseen-title" }],
    readingOrder: ["heading", "author-one", "author-two"],
    blocks: [
      { id: "heading", kind: "prose", text: "A graph-backed title", intent: { kind: "introduce" }, emphasis: "primary", source: [{ resourceId: "ex:title" }] },
      { id: "author-one", kind: "prose", text: "Author One", intent: { kind: "emphasize" }, emphasis: "supporting", source: [{ resourceId: "ex:author-one" }] },
      { id: "author-two", kind: "prose", text: "Author Two", intent: { kind: "emphasize" }, emphasis: "supporting", source: [{ resourceId: "ex:author-two" }] },
    ],
  };
  assert.equal(inferPitchLayout(scene), "opening");
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, [{
    version: "1.0",
    id: "ex:document",
    sourcePathId: "ex:path",
    scenes: [scene],
  }]);
  assert.equal(root.children[0]?.attributes.get("data-layout"), "opening");
  assert.equal(root.children[0]?.children[1]?.className, "citation");
  destroy();
});

test("does not use a scene identifier to recognize a generic opening", () => {
  const scene: Scene = {
    id: "ex:another-scene-id",
    source: [{ resourceId: "ex:scene" }],
    readingOrder: ["heading", "attribution"],
    blocks: [
      { id: "heading", kind: "prose", text: "Title", intent: { kind: "introduce" }, source: [{ resourceId: "ex:title" }] },
      { id: "attribution", kind: "prose", text: "Author", intent: { kind: "emphasize" }, emphasis: "supporting", source: [{ resourceId: "ex:author" }] },
    ],
  };
  assert.equal(inferPitchLayout(scene), "opening");
});

test("infers a process layout from a renderer-neutral flow diagram block", () => {
  const scene: Scene = {
    id: "ex:scene-process",
    source: [{ resourceId: "ex:scene-process" }],
    readingOrder: ["heading", "detail", "diagram"],
    blocks: [
      { id: "heading", kind: "prose", text: "Analytical process", intent: { kind: "introduce" }, source: [{ resourceId: "ex:heading" }] },
      { id: "detail", kind: "prose", text: "The process contains a standardization gap.", intent: { kind: "explain" }, source: [{ resourceId: "ex:detail" }] },
      {
        id: "diagram",
        kind: "diagram",
        diagramType: "flow",
        label: "Analytical process",
        description: "Flow",
        source: [{ resourceId: "ex:diagram" }],
        nodes: [
          { id: "one", label: "One", source: [{ resourceId: "ex:one" }] },
          { id: "two", label: "Two", source: [{ resourceId: "ex:two" }] },
        ],
        edges: [{ id: "edge", sourceNodeId: "one", targetNodeId: "two", label: "to", source: [{ resourceId: "ex:edge" }] }],
      },
    ],
  };
  assert.equal(inferPitchLayout(scene), "process");
  const diagramOnlyScene: Scene = { ...scene, blocks: [scene.blocks[2]!], readingOrder: ["diagram"] };
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, [{
    version: "1.0",
    id: "ex:document",
    sourcePathId: "ex:path",
    scenes: [diagramOnlyScene],
  }]);
  assert.equal(root.children[0]?.attributes.get("data-diagram-only"), "true");
  assert.equal(root.children[0]?.attributes.get("aria-label"), "Analytical process");
  destroy();
});

test("rejects unsupported canonical runtime artifact versions at runtime", () => {
  const [document] = compilePitchSceneDocuments();
  assert.ok(document);
  assert.throws(
    () => compilePitchSceneDocumentsFromArtifact({
      artifactVersion: "2.0",
      datasetFingerprint: canonicalDatasetFingerprint,
      datasetSnapshot: canonicalDatasetSnapshot,
      sceneDocuments: [document],
    }),
    /Unsupported canonical runtime artifact: 2\.0/,
  );
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

test("renders canonical graph-backed audience poll before the executable R code", () => {
  const documents = compilePitchSceneDocuments();
  const pollBlock = documents[0]!.scenes[8]!.blocks[3]!;
  assert.equal(pollBlock.kind, "prompt");
  if (pollBlock.kind !== "prompt") throw new Error("expected prompt block");
  assert.equal(pollBlock.responseMode, "single-choice");
  assert.deepEqual(pollBlock.options, ["Messreihe A", "Messreihe B"]);
  assert.deepEqual(pollBlock.source.map((source) => source.resourceId), [
    "ex:sd-precision-poll",
    "ex:sd-precision-option-a",
    "ex:sd-precision-option-b",
  ]);
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, documents);
  const exercise = root.children[8]!;
  assert.equal(exercise.children.length, 5);
  const shell = exercise.children[3]!;
  assert.equal(shell.className, "live-poll");
  assert.equal(shell.attributes.get("data-poll-key"), "ex:sd-precision-poll");
  assert.equal(shell.attributes.get("data-poll-option-ids"), "ex:sd-precision-option-a ex:sd-precision-option-b");
  assert.equal(shell.attributes.get("data-relation-path"), "cd:hasAudiencePoll cd:hasPollOption");
  assert.match(shell.attributes.get("data-provenance-ids") ?? "", /graph\/specifications\/standard-deviation/);
  assert.match(shell.children[0]?.textContent ?? "", /Welche Messreihe ist präziser/);
  assert.deepEqual(shell.children[1]?.children.map((item) => item.textContent), ["Messreihe A", "Messreihe B"]);
  destroy();
});

test("renders canonical R code as an executable static shell", () => {
  const documents = compilePitchSceneDocuments();
  const codeBlock = documents[0]!.scenes[8]!.blocks[4]!;
  assert.equal(codeBlock.kind, "code");
  if (codeBlock.kind !== "code") throw new Error("expected code block");
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, documents);
  const exercise = root.children[8]!;
  assert.equal(exercise.children.length, 5);
  const shell = exercise.children[4]!;
  assert.equal(shell.className, "code-block");
  assert.equal(shell.attributes.get("data-code-block-id"), codeBlock.id);
  assert.equal(shell.attributes.get("data-language"), "r");
  assert.equal(shell.attributes.get("data-editable"), "true");
  assert.equal(shell.attributes.get("data-executable"), "true");
  assert.equal(shell.attributes.get("data-resource-id"), "ex:sd-r-code-example");
  assert.equal(shell.attributes.get("data-relation-path"), "cd:hasCodeExample");
  assert.equal(shell.children[0]?.className, "code-static-fallback");
  assert.equal(shell.children[0]?.children[0]?.textContent, "x <- c(6, 8, 10)\nsd(x)");
  destroy();
});

test("renderer runtime contains no audience-authored Standardabweichung prose", () => {
  const runtime = [
    "../src/preview.ts",
    "../src/main.ts",
    "../src/graph-scene-data.ts",
    "../src/code-runtime.ts",
    "../src/poll-runtime.ts",
  ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
  assert.equal(runtime.includes("Die Standardabweichung beschreibt, wie stark Werte"), false);
  assert.equal(runtime.includes("Koffeinbestimmung"), false);
  assert.equal(runtime.includes("x <- c(6, 8, 10)"), false);
  assert.equal(runtime.includes("Messreihe A: 9, 10, 11"), false);
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
      if (block.kind === "prompt") {
        assert.ok(html.includes(block.prompt), `static fallback is missing poll prompt ${block.id}`);
        for (const option of block.options ?? []) assert.ok(html.includes(option), `static fallback is missing poll option ${option}`);
      }
      if (block.kind === "code") {
        assert.ok(html.includes("x &lt;- c(6, 8, 10)"), `static fallback is missing code ${block.id}`);
        assert.ok(html.includes('data-language="r"'), `static fallback is missing code language ${block.id}`);
      }
    }
  }
  assert.match(html, /math-fallback/);
  assert.match(html, /poll-fallback/);
  assert.match(html, /code-fallback/);
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
