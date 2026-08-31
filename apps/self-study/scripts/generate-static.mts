import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateCanonicalRuntimeArtifact } from "../../../packages/core/src/canonical-runtime.ts";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../../../packages/renderer-self-study/src/index.ts";

const runtimePath = fileURLToPath(new URL("../src/generated/canonical-runtime.json", import.meta.url));
const indexPath = fileURLToPath(new URL("../index.html", import.meta.url));
const artifact = validateCanonicalRuntimeArtifact(JSON.parse(await readFile(runtimePath, "utf8")));

const rendered = artifact.sceneDocuments.map((documentValue) => {
  const result = createSelfStudyRenderPlan(documentValue);
  if (!result.plan || result.diagnostics.length > 0) {
    throw new Error(result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("; ") || "Self-study render plan unavailable");
  }
  return `<article class="self-study-document" data-source-document-id="${result.plan.sourceDocumentId}">${renderSelfStudyHtml(result.plan, { interactive: false })}</article>`;
}).join("\n");

const source = await readFile(indexPath, "utf8");
const pattern = /(<!-- self-study-runtime-fallback:start -->).*?(<!-- self-study-runtime-fallback:end -->)/s;
if (!pattern.test(source)) throw new Error("Missing self-study fallback markers");
const updated = source.replace(pattern, `$1\n${rendered}\n      $2`);
await writeFile(indexPath, updated, "utf8");
