import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { createSelfStudyRenderPlan, type SelfStudyNodePlan } from "../../../packages/renderer-self-study/src/index.ts";

const appRoot = new URL("../", import.meta.url);

interface RuntimeArtifact {
  readonly artifactVersion: "1.0";
  readonly datasetFingerprint: string;
  readonly sceneDocuments: readonly SceneDocument[];
}

function leaves(nodes: readonly SelfStudyNodePlan[]): SelfStudyNodePlan[] {
  return nodes.flatMap((node) => node.kind === "group" ? leaves(node.children) : [node]);
}

test("self-study app consumes a generated canonical SceneDocument transport", async () => {
  const artifact = JSON.parse(await readFile(new URL("src/generated/canonical-runtime.json", appRoot), "utf8")) as RuntimeArtifact;
  assert.equal(artifact.artifactVersion, "1.0");
  assert.match(artifact.datasetFingerprint, /^sha256:/);
  assert.ok(artifact.sceneDocuments.length > 0);
  for (const documentValue of artifact.sceneDocuments) {
    const result = createSelfStudyRenderPlan(documentValue);
    assert.deepEqual(result.diagnostics, []);
    assert.ok(result.plan);
  }
});

test("generated static-first shell contains all self-study leaf fallback content", async () => {
  const artifact = JSON.parse(await readFile(new URL("src/generated/canonical-runtime.json", appRoot), "utf8")) as RuntimeArtifact;
  const index = await readFile(new URL("index.html", appRoot), "utf8");
  assert.match(index, /self-study-runtime-fallback:start/);
  assert.match(index, /self-study-runtime-fallback:end/);
  assert.match(index, /class="self-study-document"/);
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
  for (const path of ["src/main.ts", "src/scene-data.ts", "scripts/generate-static.mts"]) {
    const source = await readFile(new URL(path, appRoot), "utf8");
    assert.doesNotMatch(source, /Fuseki|SPARQL|localStorage|indexedDB|document\.cookie|telemetry|analytics|account|fetch\s*\(/i);
  }
});

test("static fallback stays present when enhancement is unavailable", async () => {
  const index = await readFile(new URL("index.html", appRoot), "utf8");
  const main = await readFile(new URL("src/main.ts", appRoot), "utf8");
  assert.match(index, /id="self-study-static"/);
  assert.match(index, /id="self-study-enhanced"[^>]*hidden/);
  assert.match(main, /fallbackRoot\.hidden = true/);
  assert.match(main, /catch \(error\)[\s\S]*fallbackRoot\.hidden = false/);
});
