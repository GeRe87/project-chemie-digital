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
// A public collection must not accidentally carry unrelated internal work.
if (/cogniflow/i.test(JSON.stringify(artifact))) throw new Error("Unrelated internal metadata in public presentation transport");
console.log(JSON.stringify({ title: collection.title }));
