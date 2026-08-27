export const AUTHORING_DRAFT_CONTRACT_VERSION = "1.0" as const;
export const AUTHORING_VALIDATION_CONTRACT_VERSION = "1.0" as const;
export const AUTHORING_PREVIEW_CONTRACT_VERSION = "1.0" as const;
export const AUTHORING_PROMOTION_CONTRACT_VERSION = "1.0" as const;

export type AuthoringSeverity = "violation" | "warning" | "info";

/** Renderer-neutral metadata for one complete named-graph candidate draft. */
export interface AuthoringDraftMetadata {
  readonly contractVersion: typeof AUTHORING_DRAFT_CONTRACT_VERSION;
  readonly draftId: string;
  readonly baseDatasetFingerprint: `sha256:${string}`;
  readonly targetGraphIri: string;
  readonly candidatePath: string;
  readonly checkoutCandidateSha256: `sha256:${string}`;
  readonly validationPath: string;
  readonly previewPath: string;
  readonly promotionPath: string;
}

/** Structured SHACL result; a future UI must not scrape CLI prose. */
export interface AuthoringDiagnostic {
  readonly severity: AuthoringSeverity | string;
  readonly focusNode: string | null;
  readonly resultPath: string | null;
  readonly sourceShape: string | null;
  readonly sourceConstraintComponent: string | null;
  readonly value: string | null;
  readonly message: readonly string[];
}

export interface AuthoringValidationResult {
  readonly contractVersion: typeof AUTHORING_VALIDATION_CONTRACT_VERSION;
  readonly draftId: string;
  readonly targetGraphIri: string;
  readonly baseDatasetFingerprint: `sha256:${string}`;
  readonly candidateFileSha256: `sha256:${string}`;
  readonly candidateDatasetFingerprint: `sha256:${string}`;
  readonly conforms: boolean;
  readonly diagnostics: readonly AuthoringDiagnostic[];
}

export interface AuthoringPreview<TSceneDocument = unknown> {
  readonly contractVersion: typeof AUTHORING_PREVIEW_CONTRACT_VERSION;
  readonly draftId: string;
  readonly baseDatasetFingerprint: `sha256:${string}`;
  readonly candidateDatasetFingerprint: `sha256:${string}`;
  readonly sceneDocument: TSceneDocument;
}

export interface AuthoringPromotionManifest {
  readonly contractVersion: typeof AUTHORING_PROMOTION_CONTRACT_VERSION;
  readonly status: "ready-for-human-review";
  readonly draftId: string;
  readonly targetGraphIri: string;
  readonly baseDatasetFingerprint: `sha256:${string}`;
  readonly candidateFile: string;
  readonly candidateFileSha256: `sha256:${string}`;
  readonly candidateDatasetFingerprint: `sha256:${string}`;
  readonly validation: {
    readonly path: string;
    readonly sha256: `sha256:${string}`;
    readonly conforms: true;
  };
  readonly preview: {
    readonly path: string;
    readonly sha256: `sha256:${string}`;
    readonly sceneDocumentId: string;
  };
  /** Always false in v0.1: promotion preparation is review-only. */
  readonly canonicalWritePerformed: false;
}
