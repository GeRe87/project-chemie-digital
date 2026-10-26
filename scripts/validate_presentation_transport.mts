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
// The talk's documented SHACL interfaces retain their authoritative RDF
// namespace, including when shown as authored TriG. Its *IRI* is not permission
// to insert the internal system's brand into slide copy or speaker notes.
const CANONICAL_ONTOLOGY_NAMESPACE = "https://cogniflow.odea-project.org/cf#";
// Canonical source resources may use additional paths on the same authoritative
// ontology host. A complete source IRI is identity metadata, not user-facing copy.
const SOURCE_IDENTITY = /^https:\/\/cogniflow\.odea-project\.org\/[A-Za-z0-9_./#%~-]+$/;
const SOURCE_IDENTITIES_IN_CODE = /https:\/\/cogniflow\.odea-project\.org\/[A-Za-z0-9_./#%~-]+/g;
const FORBIDDEN_BRAND = /cogniflow/i;
const VISIBLE_TEXT_FIELDS = new Set([
  "title", "subtitle", "name", "label", "description", "text", "term",
  "narration", "fallback", "prompt", "alternativeText", "body",
]);
function assertPublicPresentationPolicy(value: unknown): void {
  // Match every string at its precise structural location: this keeps the
  // failure actionable without exposing unpublished content in CI logs.
  const check = (node: unknown, path: string, key?: string): void => {
    if (typeof node === "string") {
      if (key && VISIBLE_TEXT_FIELDS.has(key) && FORBIDDEN_BRAND.test(node)) {
        throw new Error(`Internal branding in presentation text at ${path}`);
      }
      // Fully qualified canonical RDF resource identifiers are preserved.
      // Inside source-derived TriG, canonical namespace IRIs are also preserved;
      // ordinary copy, prose and unrelated products remain prohibited.
      if (SOURCE_IDENTITY.test(node)) return;
      const unbranded = key === "code"
        ? node.replaceAll(SOURCE_IDENTITIES_IN_CODE, "")
        : node.replaceAll(CANONICAL_ONTOLOGY_NAMESPACE, "");
      if (FORBIDDEN_BRAND.test(unbranded)) {
        throw new Error(`Unrelated internal branding in public presentation transport at ${path}${path === "artifact.datasetSnapshot.entities[0].id" ? ` (RDF identifier: ${node})` : ""}`);
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
  check(value, "artifact");
}
assertPublicPresentationPolicy(artifact);
console.log(JSON.stringify({ title: collection.title }));
