import fs from "node:fs";
import { validateCanonicalRuntimeArtifact } from "../packages/core/src/canonical-runtime.ts";
import { resolvePresentationCollection } from "../packages/core/src/presentation-collection.ts";

const artifact = JSON.parse(fs.readFileSync(process.argv[2]!, "utf8"));
validateCanonicalRuntimeArtifact(artifact);
const collection = artifact.presentationCollection;
if (collection.id !== process.argv[3]) throw new Error("Collection identity mismatch");
resolvePresentationCollection(collection, artifact.sceneDocuments.map((d: {id: string; sourcePathId: string; scenes: {id: string}[]}) => ({
  id: d.id, pathId: d.sourcePathId, sceneIds: d.scenes.map(s => s.id), runtime: "",
})), artifact.sceneDocumentBindings);
// Preserve canonical RDF identifiers, provenance and asset paths unchanged.
// The publication restriction applies to audience-visible titles, labels,
// descriptions, narration, and to promotional text within source-code excerpts.
// A source IRI is not an assertion that a product name should appear in copy.
const CANONICAL_SOURCE_IRI = /https:\/\/cogniflow\.odea-project\.org\/[A-Za-z0-9_./#%~-]+/g;
const EXISTING_DEMO_ASSET = /\/cogniflow-showcase\/[A-Za-z0-9_./~-]+/g;
const FORBIDDEN_BRAND = /cogniflow/i;
const VISIBLE_TEXT_FIELDS = new Set([
  "title", "subtitle", "name", "label", "description", "text", "term",
  "narration", "prompt", "alternativeText", "body",
]);
function assertPublicPresentationPolicy(value: unknown): void {
  const check = (node: unknown, path: string, key?: string): void => {
    if (typeof node === "string") {
      if (key && VISIBLE_TEXT_FIELDS.has(key) && FORBIDDEN_BRAND.test(node)) {
        throw new Error(`Internal branding in presentation text at ${path}`);
      }
      if (key === "code" || key === "fallback") {
        // Inspectable TriG retains authoritative vocabulary IRIs, and static
        // fallbacks may include existing file URLs. No promotional text is
        // allowed outside those precise technical references.
        const proseOnly = node.replaceAll(CANONICAL_SOURCE_IRI, "")
          .replaceAll(EXISTING_DEMO_ASSET, "");
        if (FORBIDDEN_BRAND.test(proseOnly)) {
          throw new Error(`Unrelated internal branding in public presentation transport at ${path}`);
        }
      }
      return;
    }
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => check(item, `${path}[${index}]`));
    } else {
      for (const [field, child] of Object.entries(node)) check(child, `${path}.${field}`, field);
    }
  };
  // Do not mistake machine-readable snapshot identifiers or reference URLs for
  // displayed labels. The scoped canonical snapshot is separately validated.
  check((value as {presentationCollection?: unknown}).presentationCollection, "collection");
  check((value as {sceneDocuments?: unknown}).sceneDocuments, "sceneDocuments");
  check((value as {teachingOfferingDocuments?: unknown}).teachingOfferingDocuments, "teachingOfferings");
}
assertPublicPresentationPolicy(artifact);
console.log(JSON.stringify({ title: collection.title }));
