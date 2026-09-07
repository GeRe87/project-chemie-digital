import runtimeArtifact from "./generated/canonical-runtime.json" with { type: "json" };
import { validateSceneDocument, type SceneDocument } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";

export interface CanonicalRuntimeArtifact {
  readonly artifactVersion: string;
  readonly datasetFingerprint: string;
  readonly datasetSnapshot: RdfDatasetSnapshot;
  readonly sceneDocuments: readonly SceneDocument[];
}

const artifact = runtimeArtifact as CanonicalRuntimeArtifact;

if (artifact.artifactVersion !== "1.0") {
  throw new Error(`Unsupported canonical runtime artifact: ${String(artifact.artifactVersion)}`);
}

export const STANDARD_DEVIATION_PATH_ID = "ex:path-standard-deviation";
export const canonicalDatasetSnapshot = artifact.datasetSnapshot;
export const canonicalDatasetFingerprint = artifact.datasetFingerprint;

export function compilePitchSceneDocumentsFromArtifact(candidate: CanonicalRuntimeArtifact): readonly SceneDocument[] {
  if (candidate.artifactVersion !== "1.0") {
    throw new Error(`Unsupported canonical runtime artifact: ${String(candidate.artifactVersion)}`);
  }
  if (!candidate.datasetFingerprint.startsWith("sha256:")) throw new Error("Canonical Dataset fingerprint is missing");
  if (candidate.sceneDocuments.length !== 1) throw new Error("Canonical runtime requires exactly one SceneDocument");
  const [document] = candidate.sceneDocuments;
  if (!document) throw new Error("Canonical SceneDocument is missing");
  validateSceneDocument(document);
  return candidate.sceneDocuments;
}

export function compilePitchSceneDocuments(): readonly SceneDocument[] {
  return compilePitchSceneDocumentsFromArtifact(artifact);
}
