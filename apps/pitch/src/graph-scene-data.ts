import runtimeArtifact from "./generated/canonical-runtime.json" with { type: "json" };
import { validateSceneDocument, type SceneDocument } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";

interface CanonicalRuntimeArtifact {
  readonly artifactVersion: "1.0";
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

export function compilePitchSceneDocuments(): readonly SceneDocument[] {
  if (!artifact.datasetFingerprint.startsWith("sha256:")) throw new Error("Canonical Dataset fingerprint is missing");
  if (artifact.sceneDocuments.length !== 1) throw new Error("Canonical runtime requires exactly one Standardabweichung SceneDocument");
  const [document] = artifact.sceneDocuments;
  if (!document || document.sourcePathId !== STANDARD_DEVIATION_PATH_ID) throw new Error("Canonical Standardabweichung path is missing");
  validateSceneDocument(document);
  return artifact.sceneDocuments;
}
