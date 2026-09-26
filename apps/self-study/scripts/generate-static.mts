import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateCanonicalRuntimeArtifact } from "../../../packages/core/src/canonical-runtime.ts";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../../../packages/renderer-self-study/src/index.ts";
import {
  availableCourseWorldDocumentIds,
  createCourseWorldModel,
  renderCourseWorldHtml,
  sceneDocumentAnchorId,
} from "../src/course-world.ts";

const runtimePath = fileURLToPath(new URL("../src/generated/canonical-runtime.json", import.meta.url));
const indexPath = fileURLToPath(new URL("../index.html", import.meta.url));
const artifact = validateCanonicalRuntimeArtifact(JSON.parse(await readFile(runtimePath, "utf8")));

if (artifact.teachingOfferingDocuments.length !== 1) {
  throw new Error(`Static Self-Study course world requires exactly one TeachingOffering document, received ${artifact.teachingOfferingDocuments.length}`);
}
if (!artifact.sceneDocumentBindings) {
  throw new Error("Static Self-Study course world requires sceneDocumentBindings");
}

const world = createCourseWorldModel(
  artifact.teachingOfferingDocuments[0]!,
  artifact.sceneDocuments,
  artifact.sceneDocumentBindings,
  "en",
);
const documentsById = new Map(artifact.sceneDocuments.map((documentValue) => [documentValue.id, documentValue]));

const renderedDocuments = availableCourseWorldDocumentIds(world).map((documentId) => {
  const documentValue = documentsById.get(documentId);
  if (!documentValue) throw new Error(`Missing bound SceneDocument ${documentId}`);
  const result = createSelfStudyRenderPlan(documentValue);
  if (!result.plan || result.diagnostics.length > 0) {
    throw new Error(result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("; ") || "Self-study render plan unavailable");
  }
  return `<article id="${sceneDocumentAnchorId(documentId)}" class="self-study-document" data-source-document-id="${documentId}">
    <nav class="course-world-back-navigation" aria-label="Course navigation"><a class="course-world-back" href="#course-world">← Back to course map</a></nav>
    ${renderSelfStudyHtml(result.plan, { interactive: false })}
  </article>`;
}).join("\n");

const rendered = `${renderCourseWorldHtml(world, { interactive: false })}
<section class="self-study-static-documents" aria-label="Available course content">
${renderedDocuments}
</section>`;

const source = await readFile(indexPath, "utf8");
const pattern = /(<!-- self-study-runtime-fallback:start -->).*?(<!-- self-study-runtime-fallback:end -->)/s;
if (!pattern.test(source)) throw new Error("Missing self-study fallback markers");
const updated = source.replace(pattern, `$1\n${rendered}\n      $2`);
await writeFile(indexPath, updated, "utf8");
