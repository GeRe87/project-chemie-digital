import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import type { CanonicalRuntimeArtifact } from "../src/graph-scene-data.ts";
import {
  loadCourseLevel, loadCourseManifest, loadSharedDatasetSnapshot, parseCourseManifest,
} from "../src/course-runtime-loader.ts";
import { mountCourseBootstrapStatus, runCourseBootstrap } from "../src/course-bootstrap.ts";

const fingerprint = `sha256:${"a".repeat(64)}`;
const iri = "https://w3id.org/project-chemie-digital/resource/";
const snapshot = { version: "1.0" as const, identity: fingerprint, entities: [], statements: [],
  source: [{ resourceId: "dataset", provenanceIds: ["ontology/dataset/course.trig"] }], supportedPredicates: [] };
const offering = { version: "1.0" as const, datasetFingerprint: fingerprint,
  offering: { id: `${iri}offering`, graphId: `${iri}graph`, labels: [{ value: "Course", language: "en" }], descriptions: [] },
  placements: [{ id: `${iri}placement`, unitId: `${iri}unit`, position: 1 }],
  units: [{ id: `${iri}unit`, labels: [{ value: "Unit", language: "en" }], descriptions: [],
    paths: [{ id: `${iri}path`, graphId: `${iri}path-graph`, labels: [{ value: "Path", language: "en" }], descriptions: [] }] }],
};
const document = { version: "1.0" as const, id: "document:first", sourcePathId: "ex:path", scenes: [{ id: "scene:first",
  source: [{ resourceId: "ex:concept" }], readingOrder: ["heading"], blocks: [{ id: "heading", kind: "prose" as const,
    text: "Heading", source: [{ resourceId: "ex:concept", relationPath: "skos:prefLabel@en" }], intent: { kind: "introduce" as const } }] }] };
const binding = { pathId: `${iri}path`, pathGraphId: `${iri}path-graph`, sceneDocumentId: document.id };
const artifact: CanonicalRuntimeArtifact = { artifactVersion: "1.0", datasetFingerprint: fingerprint, datasetSnapshot: snapshot,
  sceneDocuments: [document], sceneDocumentBindings: [binding], teachingOfferingDocuments: [offering] };
const hash = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex")}`;

function fixture(legacy = false, snapshotValue: unknown = snapshot) {
  const runtimeArtifact = { ...artifact, datasetSnapshot: snapshotValue };
  const graphText = JSON.stringify({ transportVersion: "2.0", datasetFingerprint: fingerprint, datasetSnapshot: snapshotValue });
  const sharedGraph = { path: "course-runtime/graph-abc.json", sha256: hash(graphText) };
  const payload = legacy ? runtimeArtifact : { ...runtimeArtifact, transport: { version: "2.0", snapshotScope: "scene-neighborhood", sharedGraph } };
  const levelText = JSON.stringify(payload);
  const manifest = { offering, bindings: [binding], documents: [{ id: document.id, pathId: document.sourcePathId,
    sceneIds: ["scene:first"], runtime: "course-runtime/level-abc.json", ...(!legacy ? { sha256: hash(levelText) } : {}) }],
    ...(!legacy ? { transportVersion: "2.0", datasetFingerprint: fingerprint, sharedGraph } : {}) };
  const files = new Map([
    ["course-runtime/manifest.json", JSON.stringify(manifest)], ["course-runtime/level-abc.json", levelText],
    ["course-runtime/graph-abc.json", graphText],
  ]);
  const requests: { path: string; cache: RequestCache | undefined }[] = [];
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input); requests.push({ path, cache: init?.cache });
    return new Response(files.get(path) ?? "Missing", { status: files.has(path) ? 200 : 404 });
  }) as typeof fetch;
  return { manifest, files, requests, fetcher };
}

test("world metadata and a level load without fetching the global graph", async () => {
  const data = fixture();
  const manifest = await loadCourseManifest(data.fetcher);
  const level = await loadCourseLevel(manifest, manifest.documents[0]!, data.fetcher);
  assert.deepEqual(level.sceneDocuments, artifact.sceneDocuments);
  assert.deepEqual(level.datasetSnapshot, snapshot);
  assert.deepEqual(data.requests, [
    { path: "course-runtime/manifest.json", cache: "no-cache" },
    { path: "course-runtime/level-abc.json", cache: "force-cache" },
  ]);
  assert.deepEqual(await loadSharedDatasetSnapshot(manifest, data.fetcher), snapshot);
  assert.equal(data.requests[2]!.path, "course-runtime/graph-abc.json");
});

test("legacy manifests and self-contained canonical levels remain readable", async () => {
  const data = fixture(true);
  const manifest = await loadCourseManifest(data.fetcher);
  assert.deepEqual(await loadCourseLevel(manifest, manifest.documents[0]!, data.fetcher), artifact);
});

test("compact canonical source paths match absolute offering bindings in both transport versions", async () => {
  for (const legacy of [false, true]) {
    const data = fixture(legacy);
    assert.equal(data.manifest.documents[0]!.pathId, "ex:path");
    assert.equal(data.manifest.bindings[0]!.pathId, `${iri}path`);
    const manifest = parseCourseManifest(data.manifest);
    assert.equal((await loadCourseLevel(manifest, manifest.documents[0]!, data.fetcher)).sceneDocuments[0]!.sourcePathId, "ex:path");
    // Metadata may use the absolute spelling too; the source remains compact.
    const absolute = parseCourseManifest({ ...data.manifest,
      documents: [{ ...data.manifest.documents[0]!, pathId: `${iri}path` }] });
    assert.equal((await loadCourseLevel(absolute, absolute.documents[0]!, data.fetcher)).sceneDocuments[0]!.sourcePathId, "ex:path");
    assert.throws(() => parseCourseManifest({ ...data.manifest,
      documents: [{ ...data.manifest.documents[0]!, pathId: "ex:other-path" }] }), /binding mismatch/);
  }
});

test("manifest parsing rejects foreign paths, unknown versions and duplicate bindings", () => {
  const data = fixture();
  for (const runtime of ["https://example.test/other.json", "../secret.json", "course-runtime/%2e%2e.json", "//example.test/a.json"]) {
    assert.throws(() => parseCourseManifest({ ...data.manifest, documents: [{ ...data.manifest.documents[0]!, runtime }] }), /local generated/);
  }
  assert.throws(() => parseCourseManifest({ ...data.manifest, transportVersion: "3.0" }), /Unsupported/);
  assert.throws(() => parseCourseManifest({ ...data.manifest, bindings: [binding, binding] }), /binding mismatch/);
});

test("tampered and missing level files fail visibly before presentation initialization", async () => {
  const data = fixture();
  const manifest = parseCourseManifest(data.manifest);
  const selected = manifest.documents[0]!;
  data.files.set(selected.runtime, data.files.get(selected.runtime)! + " ");
  await assert.rejects(loadCourseLevel(manifest, selected, data.fetcher), /integrity mismatch/);
  data.files.delete(selected.runtime);
  await assert.rejects(loadCourseLevel(manifest, selected, data.fetcher), /HTTP 404/);
});

test("wrong level identity is rejected even in legacy transports without digests", async () => {
  const data = fixture(true);
  const manifest = parseCourseManifest(data.manifest);
  data.files.set(manifest.documents[0]!.runtime, JSON.stringify({ ...artifact, sceneDocuments: [{ ...document, sourcePathId: `${iri}wrong-path` }] }));
  await assert.rejects(loadCourseLevel(manifest, manifest.documents[0]!, data.fetcher), /identity or revision mismatch/);
});

const completeSnapshot = {
  ...snapshot,
  entities: [{ id: "ex:concept", label: "Concept", semanticTypes: ["cd:Concept"], description: "Authored description",
    source: [{ resourceId: "ex:concept", provenanceIds: ["ex:graph"], relationPath: "skos:prefLabel@en" }],
    externalReferences: [{ uri: "https://example.test/reference", version: "1", integrity: "sha256:reference", mediaType: "text/html" }] }],
  statements: [{ sourceEntityId: "ex:concept", targetEntityId: "ex:concept", predicateId: "skos:related", predicateLabel: "related",
    source: [{ resourceId: "ex:concept", provenanceIds: ["ex:graph"] }], requiredReference: true }],
  supportedPredicates: ["skos:related"],
};

test("typed snapshot metadata and provenance survive level and shared-graph loading unchanged", async () => {
  for (const legacy of [false, true]) {
    const data = fixture(legacy, completeSnapshot);
    const manifest = parseCourseManifest(data.manifest);
    assert.deepEqual((await loadCourseLevel(manifest, manifest.documents[0]!, data.fetcher)).datasetSnapshot, completeSnapshot);
    if (!legacy) assert.deepEqual(await loadSharedDatasetSnapshot(manifest, data.fetcher), completeSnapshot);
  }
});

test("malformed snapshots fail at the raw boundary even when level and shared hashes are correct", async () => {
  const invalidFields: readonly [readonly (string | number)[], unknown][] = [
    [[], null], [["version"], "2.0"], [["identity"], `sha256:${"b".repeat(64)}`],
    [["entities"], {}], [["statements"], null], [["supportedPredicates"], "skos:related"],
    [["supportedPredicates", 0], null], [["source"], []], [["source", 0], null],
    [["source", 0, "resourceId"], 4], [["source", 0, "provenanceIds"], "ex:graph"],
    [["source", 0, "provenanceIds", 0], null], [["source", 0, "relationPath"], false],
    [["entities", 0], null], [["entities", 0, "id"], null], [["entities", 0, "label"], 7],
    [["entities", 0, "semanticTypes"], {}], [["entities", 0, "semanticTypes", 0], false],
    [["entities", 0, "description"], {}], [["entities", 0, "source"], []],
    [["entities", 0, "source", 0], []], [["entities", 0, "source", 0, "relationPath"], ""],
    [["entities", 0, "externalReferences"], {}], [["entities", 0, "externalReferences", 0], null],
    [["entities", 0, "externalReferences", 0, "uri"], 3],
    [["entities", 0, "externalReferences", 0, "version"], false],
    [["entities", 0, "externalReferences", 0, "integrity"], []],
    [["entities", 0, "externalReferences", 0, "mediaType"], {}],
    [["statements", 0], null], [["statements", 0, "sourceEntityId"], 9],
    [["statements", 0, "targetEntityId"], {}], [["statements", 0, "predicateId"], false],
    [["statements", 0, "predicateLabel"], ""], [["statements", 0, "source"], []],
    [["statements", 0, "source", 0, "provenanceIds", 0], 8],
    [["statements", 0, "requiredReference"], "true"],
  ];
  for (const [path, value] of invalidFields) {
    let malformed: unknown = structuredClone(completeSnapshot);
    if (path.length === 0) malformed = value;
    else {
      let owner = malformed as Record<string | number, unknown>;
      for (const key of path.slice(0, -1)) owner = owner[key] as Record<string | number, unknown>;
      owner[path[path.length - 1]!] = value;
    }
    const label = path.reduce<string>((result, key) => typeof key === "number" ? `${result}[${key}]` : `${result}.${key}`, "datasetSnapshot");
    const boundaryError = (error: unknown) => error instanceof Error && !(error instanceof TypeError) && error.message.startsWith(label);
    for (const legacy of [false, true]) {
      // fixture() deliberately recomputes every digest after the malformed
      // producer value is serialized, so integrity checks alone cannot reject it.
      const data = fixture(legacy, malformed);
      const manifest = parseCourseManifest(data.manifest);
      await assert.rejects(loadCourseLevel(manifest, manifest.documents[0]!, data.fetcher), boundaryError, label);
      if (!legacy) await assert.rejects(loadSharedDatasetSnapshot(manifest, data.fetcher), boundaryError, label);
    }
  }
});

test("a rejected manifest, fetch or dynamic import reaches the common recovery boundary", async () => {
  for (const reason of [new Error("Manifest invalid"), new TypeError("Failed to fetch"), new Error("Failed to fetch dynamically imported module")]) {
    const failures: unknown[] = [];
    const succeeded = await runCourseBootstrap(() => Promise.reject(reason), {
      ready() { assert.fail("failed bootstrap must not become ready"); }, failed(error) { failures.push(error); },
    });
    assert.equal(succeeded, false);
    assert.deepEqual(failures, [reason]);
  }
  let ready = false;
  assert.equal(await runCourseBootstrap(async () => {}, { ready() { ready = true; }, failed() { assert.fail(); } }), true);
  assert.equal(ready, true);
});

class ElementFixture {
  className = ""; textContent = ""; tabIndex = 0; hidden = false; type = ""; href = ""; focused = false; removed = false;
  dataset: Record<string, string> = {}; attributes: Record<string, string> = {};
  children: ElementFixture[] = []; listeners = new Map<string, () => void>();
  append(...elements: ElementFixture[]) { this.children.push(...elements); }
  setAttribute(name: string, value: string) { this.attributes[name] = value; }
  addEventListener(name: string, listener: () => void) { this.listeners.set(name, listener); }
  remove() { this.removed = true; }
  focus() { this.focused = true; }
}

test("loading recovery exposes an accessible error, retry action and static fallback", () => {
  const body = new ElementFixture();
  const presentation = new ElementFixture();
  const owner = { body, createElement: () => new ElementFixture(), querySelectorAll: () => [presentation] } as unknown as Document;
  let retries = 0;
  const status = mountCourseBootstrapStatus(owner, { staticHref: "./course-runtime/static-course.html", retry: () => { retries++; } });
  const shell = body.children[0]!;
  const [heading, message, retry, fallback] = shell.children[0]!.children;
  assert.equal(shell.attributes.role, "status");
  assert.equal(retry!.hidden, true);
  status.failed(new Error("Failed to fetch"));
  assert.equal(shell.attributes.role, "alert");
  assert.equal(message!.textContent, "Failed to fetch");
  assert.equal(heading!.focused, true);
  assert.equal(presentation.hidden, true);
  assert.equal(retry!.hidden, false);
  retry!.listeners.get("click")!();
  assert.equal(retries, 1);
  assert.equal(fallback!.href, "./course-runtime/static-course.html");
  status.ready();
  assert.equal(shell.removed, true);
});
