/** Compare all current graph consumers against full and scoped course snapshots.
 * Invoked by the focused Python transport integration test on its isolated data. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CanonicalRuntimeArtifact } from "../apps/pitch/src/graph-scene-data.ts";
import { projectSceneSummary } from "../apps/pitch/src/graph-summary-shell.ts";
import { semanticMultiViewProjection } from "../apps/pitch/src/semantic-multi-view-runtime.ts";
import { semanticSourceResourceOrder } from "../apps/pitch/src/semantic-source-runtime.ts";
import { loadCourseLevel, loadCourseManifest } from "../apps/pitch/src/course-runtime-loader.ts";
import { walkSceneBlocks } from "../packages/core/src/scene-blocks.ts";

const [artifactPath, publicPath] = process.argv.slice(2);
if (!artifactPath || !publicPath) throw new Error("Expected canonical artifact and public directory");
const full = JSON.parse(readFileSync(artifactPath, "utf8")) as CanonicalRuntimeArtifact;
const fetcher = (async (input: string | URL | Request) =>
  new Response(readFileSync(join(publicPath, String(input)), "utf8"))) as typeof fetch;
const manifest = await loadCourseManifest(fetcher);
let projected = 0;
let equivalentDiagnostics = 0;
for (const entry of manifest.documents) {
  const level = await loadCourseLevel(manifest, entry, fetcher);
  const document = full.sceneDocuments.find(document => document.id === entry.id)!;
  assert.deepEqual(level.sceneDocuments, [document]);
  assert.deepEqual(level.datasetSnapshot.source, full.datasetSnapshot.source);
  for (const scene of document.scenes) {
    const attempt = (snapshot: typeof full.datasetSnapshot) => {
      try { return { document: projectSceneSummary(snapshot, scene) }; }
      catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
    };
    const expected = attempt(full.datasetSnapshot);
    assert.deepEqual(attempt(level.datasetSnapshot), expected, `Graph/provenance changed for ${scene.id}`);
    if (expected.document) projected++; else equivalentDiagnostics++;
    assert.deepEqual(semanticMultiViewProjection(scene, level.datasetSnapshot), semanticMultiViewProjection(scene, full.datasetSnapshot));
    for (const block of walkSceneBlocks(scene.blocks)) {
      if (block.kind === "code") assert.deepEqual(semanticSourceResourceOrder(block, level.datasetSnapshot), semanticSourceResourceOrder(block, full.datasetSnapshot));
    }
  }
}
assert.ok(projected > 0, "No graph projection was exercised");
console.log(JSON.stringify({ projected, equivalentDiagnostics }));
