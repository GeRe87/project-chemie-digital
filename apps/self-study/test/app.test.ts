import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  validateCanonicalRuntimeArtifact,
  type CanonicalRuntimeArtifact,
} from "../../../packages/core/src/canonical-runtime.ts";
import { createLearnerStateDocument } from "../../../packages/learner-state/src/index.ts";
import { createSelfStudyRenderPlan, type SelfStudyNodePlan } from "../../../packages/renderer-self-study/src/index.ts";
import type { SelfStudyController } from "../../../packages/renderer-self-study/src/browser.ts";
import {
  createSelfStudyLearnerRuntime,
  restoreSelfStudyLearnerStateAtomically,
} from "../src/learner-state.ts";

const appRoot = new URL("../", import.meta.url);

async function readRuntimeArtifact(): Promise<CanonicalRuntimeArtifact> {
  const source: unknown = JSON.parse(await readFile(new URL("src/generated/canonical-runtime.json", appRoot), "utf8"));
  return validateCanonicalRuntimeArtifact(source);
}

function leaves(nodes: readonly SelfStudyNodePlan[]): SelfStudyNodePlan[] {
  return nodes.flatMap((node) => node.kind === "group" ? leaves(node.children) : [node]);
}

test("self-study app consumes a validated generated canonical SceneDocument transport", async () => {
  const artifact = await readRuntimeArtifact();
  assert.equal(artifact.artifactVersion, "1.0");
  assert.match(artifact.datasetFingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.ok(artifact.sceneDocuments.length > 0);
  for (const documentValue of artifact.sceneDocuments) {
    const result = createSelfStudyRenderPlan(documentValue);
    assert.deepEqual(result.diagnostics, []);
    assert.ok(result.plan);
  }
});

test("generated runtime exposes the validated Chemometrics course bundle in authored placement order", async () => {
  const artifact = await readRuntimeArtifact();
  assert.equal(artifact.teachingOfferingDocuments.length, 1);
  const documentValue = artifact.teachingOfferingDocuments[0]!;
  assert.equal(documentValue.datasetFingerprint, artifact.datasetFingerprint);
  assert.equal(
    documentValue.offering.id,
    "https://w3id.org/project-chemie-digital/resource/teaching-offering-chemometrics-applied-statistics",
  );

  const placementsByUnit = new Map(documentValue.placements.map((item) => [item.unitId, item]));
  const random = placementsByUnit.get("https://w3id.org/project-chemie-digital/resource/learning-unit-random-variables");
  const mean = placementsByUnit.get("https://w3id.org/project-chemie-digital/resource/learning-unit-mean-values");
  const variance = placementsByUnit.get("https://w3id.org/project-chemie-digital/resource/learning-unit-variance-dispersion");
  assert.ok(random);
  assert.ok(mean);
  assert.ok(variance);
  assert.ok(random.position < mean.position);
  assert.ok(mean.position < variance.position);
  assert.equal(mean.position - random.position, 10);
  assert.equal(variance.position - mean.position, 10);

  const introduction = placementsByUnit.get("https://w3id.org/project-chemie-digital/resource/learning-unit-chemometrics-introduction");
  if (introduction) {
    assert.ok(introduction.position < random.position);
    assert.equal(random.position - introduction.position, 10);
  }

  assert.ok(artifact.sceneDocumentBindings);
  const boundPathIds = new Set(artifact.sceneDocumentBindings.map((item) => item.pathId));
  assert.ok(boundPathIds.has("https://w3id.org/project-chemie-digital/resource/path-chemometrics-random-variables-lecture"));
  assert.ok(boundPathIds.has("https://w3id.org/project-chemie-digital/resource/path-chemometrics-mean-values-lecture"));
  assert.ok(!boundPathIds.has("https://w3id.org/project-chemie-digital/resource/path-chemometrics-variance-dispersion-lecture"));
  if (introduction) {
    assert.ok(boundPathIds.has("https://w3id.org/project-chemie-digital/resource/path-chemometrics-introduction"));
  }
});

test("browser and static loaders share the core runtime validator without app-local artifact schemas", async () => {
  const browserSource = await readFile(new URL("src/scene-data.ts", appRoot), "utf8");
  const staticSource = await readFile(new URL("scripts/generate-static.mts", appRoot), "utf8");
  for (const source of [browserSource, staticSource]) {
    assert.match(source, /validateCanonicalRuntimeArtifact/);
    assert.doesNotMatch(source, /interface\s+(CanonicalRuntimeArtifact|RuntimeArtifact)/);
    assert.doesNotMatch(source, /as\s+(CanonicalRuntimeArtifact|RuntimeArtifact)/);
  }
  assert.match(browserSource, /canonicalSelfStudyTeachingOfferingDocuments/);
  assert.doesNotMatch(staticSource, /teachingOfferingDocuments\.(map|forEach)|canonicalSelfStudyTeachingOfferingDocuments/);
});

test("generated static-first shell contains all self-study leaf fallback content", async () => {
  const artifact = await readRuntimeArtifact();
  const index = await readFile(new URL("index.html", appRoot), "utf8");
  assert.match(index, /self-study-runtime-fallback:start/);
  assert.match(index, /self-study-runtime-fallback:end/);
  assert.match(index, /class="self-study-document"/);
  assert.match(index, /class="course-world"/);
  assert.match(index, /Course map/);
  assert.match(index, /In preparation/);
  assert.match(index, /href="#course-document-/);
  for (const documentValue of artifact.sceneDocuments) {
    const plan = createSelfStudyRenderPlan(documentValue).plan!;
    for (const section of plan.sections) {
      assert.ok(index.includes(section.semanticLabel), `missing static section ${section.semanticLabel}`);
      for (const node of leaves(section.nodes)) {
        const probe = node.staticFallback.slice(0, Math.min(24, node.staticFallback.length));
        const escaped = probe.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        assert.ok(index.includes(escaped) || index.includes(probe), `missing static fallback ${node.sourceBlockId}`);
      }
    }
  }
});

test("browser app has no semantic-store, persistence, account or telemetry integration", async () => {
  for (const path of ["src/main.ts", "src/scene-data.ts", "src/course-world.ts", "src/learner-state.ts", "scripts/generate-static.mts"]) {
    const source = await readFile(new URL(path, appRoot), "utf8");
    assert.doesNotMatch(source, /Fuseki|SPARQL|localStorage|indexedDB|document\.cookie|telemetry|analytics|account|fetch\s*\(/i);
  }
});

test("course world browser navigation keeps all renderable documents mounted and switches visibility only", async () => {
  const main = await readFile(new URL("src/main.ts", appRoot), "utf8");
  assert.match(main, /availableCourseWorldDocumentIds/);
  assert.match(main, /controllers\.push\(mountSelfStudyRenderPlan/);
  assert.match(main, /documentRoot\.hidden = true/);
  assert.match(main, /element\.hidden = candidateId !== documentId/);
  assert.match(main, /worldRoot\.hidden = true/);
  assert.match(main, /studyRoot\.hidden = false/);
  assert.match(main, /Back to course map/);
  assert.doesNotMatch(main, /sourcePathId\.(replace|split)|endsWith\(|startsWith\("ex:"\)/);
});

test("successful enhancement removes static duplicate anchor targets only after all mounts", async () => {
  const main = await readFile(new URL("src/main.ts", appRoot), "utf8");
  const mountIndex = main.lastIndexOf("controllers.push(mountSelfStudyRenderPlan");
  const clearFallbackIndex = main.indexOf("fallbackRoot.replaceChildren()");
  const hideFallbackIndex = main.indexOf("fallbackRoot.hidden = true");
  const showEnhancedIndex = main.indexOf("enhancedRoot.hidden = false");
  const catchIndex = main.indexOf("} catch (error)");

  assert.ok(mountIndex >= 0, "enhancement mount is missing");
  assert.ok(clearFallbackIndex > mountIndex, "static fallback must only be removed after successful mounts");
  assert.ok(clearFallbackIndex < hideFallbackIndex, "duplicate fallback ids must be removed before hiding the static root");
  assert.ok(hideFallbackIndex < showEnhancedIndex, "enhanced root must only become visible after fallback targets are removed");
  assert.ok(showEnhancedIndex < catchIndex, "success lifecycle must complete before the failure path");

  const failurePath = main.slice(catchIndex);
  assert.doesNotMatch(failurePath, /fallbackRoot\.replaceChildren\(\)/, "failure recovery must preserve generated static content");
  assert.match(failurePath, /fallbackRoot\.hidden = false/, "failure recovery must restore the static root");
});

test("static fallback stays present when enhancement is unavailable", async () => {
  const index = await readFile(new URL("index.html", appRoot), "utf8");
  const main = await readFile(new URL("src/main.ts", appRoot), "utf8");
  assert.match(index, /id="self-study-static"/);
  assert.match(index, /id="self-study-enhanced"[^>]*hidden/);
  assert.match(main, /fallbackRoot\.hidden = true/);
  assert.match(main, /catch \(error\)[\s\S]*fallbackRoot\.hidden = false/);
});

test("learner-state runtime is derived only from renderer source identities", async () => {
  const artifact = await readRuntimeArtifact();
  const plans = artifact.sceneDocuments.map((documentValue) => createSelfStudyRenderPlan(documentValue).plan!);
  const runtime = createSelfStudyLearnerRuntime(artifact.datasetFingerprint, plans);
  assert.equal(runtime.datasetFingerprint, artifact.datasetFingerprint);
  assert.deepEqual(runtime.documents.map((item) => item.documentId), plans.map((plan) => plan.sourceDocumentId));
  for (const [index, documentValue] of runtime.documents.entries()) {
    assert.deepEqual(documentValue.sceneIds, plans[index]!.sections.map((section) => section.sourceSceneId));
    assert.ok(documentValue.blocks.every((block) => block.sceneId && block.blockId));
  }
});

test("restore preflights every controller before applying any learner-state mutation", () => {
  let commits = 0;
  const first: SelfStudyController = {
    sourceDocumentId: "doc:first",
    captureLearnerState: () => ({ documentId: "doc:first", promptResponses: [], disclosures: [] }),
    prepareLearnerStateRestore: () => () => { commits += 1; },
    destroy: () => undefined,
  };
  const second: SelfStudyController = {
    sourceDocumentId: "doc:second",
    captureLearnerState: () => ({ documentId: "doc:second", promptResponses: [], disclosures: [] }),
    prepareLearnerStateRestore: () => { throw new Error("preflight failed"); },
    destroy: () => undefined,
  };
  const documentValue = createLearnerStateDocument("sha256:test", []);
  assert.throws(() => restoreSelfStudyLearnerStateAtomically(documentValue, [first, second]), /preflight failed/);
  assert.equal(commits, 0);
});

test("explicit learner-state chrome is local-file based and reload remains ephemeral", async () => {
  const source = await readFile(new URL("src/learner-state.ts", appRoot), "utf8");
  assert.match(source, /Lernstand exportieren/);
  assert.match(source, /Lernstand importieren/);
  assert.match(source, /new Blob/);
  assert.match(source, /file\.text\(\)/);
  assert.doesNotMatch(source, /beforeunload|pagehide|visibilitychange/i);
});
