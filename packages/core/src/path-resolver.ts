export interface ResolvedPathStep {
  readonly id: string;
  readonly position: number;
  readonly viewType: string;
  readonly resourceIds: readonly string[];
}

export interface ResolvedLearningPath {
  readonly id: string;
  readonly topicId?: string;
  readonly steps: readonly ResolvedPathStep[];
}

/**
 * Renderer-neutral resolved-path contracts retained for scene composition.
 *
 * Active path resolution is performed from the canonical TriG Dataset by
 * `scripts/generate_canonical_runtime.py`. This module intentionally contains
 * no JSON-LD parser, repository fixture loader or second semantic source.
 */
