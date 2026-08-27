import runtimeArtifact from "./generated/canonical-runtime.json" with { type: "json" };
import { validateSceneDocument, type SceneDocument } from "@project-chemie-digital/core";

interface CanonicalRuntimeArtifact {
  readonly artifactVersion: "1.0";
  readonly datasetFingerprint: string;
  readonly sceneDocuments: readonly SceneDocument[];
}

const artifact = runtimeArtifact as CanonicalRuntimeArtifact;

if (artifact.artifactVersion !== "1.0") {
  throw new Error(`Unsupported canonical runtime artifact: ${String(artifact.artifactVersion)}`);
}

export const canonicalDatasetFingerprint = artifact.datasetFingerprint;

export function canonicalSelfStudySceneDocuments(): readonly SceneDocument[] {
  if (!artifact.datasetFingerprint.startsWith("sha256:")) throw new Error("Canonical Dataset fingerprint is missing");
  if (artifact.sceneDocuments.length === 0) throw new Error("Canonical runtime contains no SceneDocument");
  for (const document of artifact.sceneDocuments) validateSceneDocument(document);
  return artifact.sceneDocuments;
}
