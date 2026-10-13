import { readFileSync } from "node:fs";
import { validateCanonicalRuntimeArtifact } from "../packages/core/src/canonical-runtime.ts";
import { createPitchCourseWorldModel } from "../apps/pitch/src/course-world.ts";

// Reuse the same contracts/world projection as the browser, never a build menu.
const [file, offeringId] = process.argv.slice(2);
if (!file || !offeringId) throw new Error("Usage: validate_course_transport.mts runtime.json offeringIRI");
const artifact = validateCanonicalRuntimeArtifact(JSON.parse(readFileSync(file, "utf8")));
if (artifact.teachingOfferingDocuments.length !== 1 || artifact.teachingOfferingDocuments[0]!.offering.id !== offeringId) {
  throw new Error("Generated artifact does not select exactly the requested offering");
}
// The current Pitch entry switches to course mode only for multiple documents.
if (artifact.sceneDocuments.length < 2) throw new Error("Offering cannot enter the existing Pitch overworld mode");
const model = createPitchCourseWorldModel(artifact.teachingOfferingDocuments[0]!, artifact.sceneDocuments,
  artifact.sceneDocumentBindings ?? []);
console.log(JSON.stringify(model));
