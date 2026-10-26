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
const FORBIDDEN_BRAND = /cogniflow/i;
const VISIBLE_TEXT_FIELDS = new Set([
  "title", "subtitle", "name", "label", "description", "text", "term",
  "narration", "fallback", "prompt", "alternativeText", "body",
]);
function assertPublicPresentationPolicy(value: unknown): void {
  // Permit only this exact, immutable RDF vocabulary IRI. Other references
  // to the product name anywhere in the transport remain prohibited.
  const nonVocabulary = JSON.stringify(value).replaceAll(CANONICAL_ONTOLOGY_NAMESPACE, "");
  if (FORBIDDEN_BRAND.test(nonVocabulary)) {
    throw new Error("Unrelated internal branding in public presentation transport");
  }
  // An exact RDF namespace may appear inside inspectable TriG code, but must
  // never be smuggled into a slide label, description, alt text, or narration.
  const checkVisibleText = (node: unknown, path: string): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => checkVisibleText(item, `${path}[${index}]`));
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (typeof child === "string" && VISIBLE_TEXT_FIELDS.has(key) && FORBIDDEN_BRAND.test(child)) {
        throw new Error(`Internal branding in presentation text at ${path}.${key}`);
      }
      if (child && typeof child === "object") checkVisibleText(child, `${path}.${key}`);
    }
  };
  checkVisibleText(value, "artifact");
}
assertPublicPresentationPolicy(artifact);
console.log(JSON.stringify({ title: collection.title }));
