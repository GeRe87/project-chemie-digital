import runtimeArtifact from "./generated/canonical-runtime.json" with { type: "json" };
import {
  validateCanonicalRuntimeArtifact,
  type CanonicalRuntimeSceneDocumentBinding,
  type TeachingOfferingRuntimeDocument,
} from "../../../packages/core/src/canonical-runtime.ts";
import { validateSceneDocument, type SceneDocument } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";

export interface CanonicalRuntimeArtifact {
  readonly artifactVersion: string;
  readonly datasetFingerprint: string;
  readonly datasetSnapshot: RdfDatasetSnapshot;
  readonly teachingOfferingDocuments?: readonly TeachingOfferingRuntimeDocument[];
  readonly sceneDocuments: readonly SceneDocument[];
  readonly sceneDocumentBindings?: readonly CanonicalRuntimeSceneDocumentBinding[];
}

export interface PitchCourseRuntime {
  readonly offering: TeachingOfferingRuntimeDocument;
  readonly sceneDocuments: readonly SceneDocument[];
  readonly bindings: readonly CanonicalRuntimeSceneDocumentBinding[];
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

export function compilePitchCourseRuntimeFromArtifact(candidate: unknown): PitchCourseRuntime {
  const validated = validateCanonicalRuntimeArtifact(candidate);
  if (validated.teachingOfferingDocuments.length !== 1) {
    throw new Error(
      `Pitch course world requires exactly one TeachingOffering document, received ${validated.teachingOfferingDocuments.length}`,
    );
  }
  if (validated.sceneDocuments.length === 0) {
    throw new Error("Pitch course world requires at least one bound SceneDocument");
  }
  const bindings = validated.sceneDocumentBindings ?? [];
  if (bindings.length !== validated.sceneDocuments.length) {
    throw new Error("Pitch course world requires one exact path binding for every SceneDocument");
  }
  const boundIds = new Set(bindings.map((binding) => binding.sceneDocumentId));
  if (boundIds.size !== validated.sceneDocuments.length) {
    throw new Error("Pitch course world requires every SceneDocument to have one unique exact path binding");
  }
  return {
    offering: validated.teachingOfferingDocuments[0]!,
    sceneDocuments: validated.sceneDocuments,
    bindings,
  };
}

export function compilePitchCourseRuntime(): PitchCourseRuntime | undefined {
  if (artifact.sceneDocuments.length <= 1) return undefined;
  return compilePitchCourseRuntimeFromArtifact(artifact);
}
