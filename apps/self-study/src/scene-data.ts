import runtimeArtifact from "./generated/canonical-runtime.json" with { type: "json" };
import {
  validateCanonicalRuntimeArtifact,
  type SceneDocument,
  type TeachingOfferingRuntimeDocument,
} from "../../../packages/core/src/index.ts";

const artifact = validateCanonicalRuntimeArtifact(runtimeArtifact);

export const canonicalDatasetFingerprint = artifact.datasetFingerprint;

export function canonicalSelfStudySceneDocuments(): readonly SceneDocument[] {
  if (artifact.sceneDocuments.length === 0) throw new Error("Canonical runtime contains no SceneDocument");
  return artifact.sceneDocuments;
}

export function canonicalSelfStudyTeachingOfferingDocuments(): readonly TeachingOfferingRuntimeDocument[] {
  return artifact.teachingOfferingDocuments;
}
