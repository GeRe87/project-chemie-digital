/** Additive SceneDocument capabilities, shared by validation and adapters. */
export const SCENE_DOCUMENT_VERSION = "1.0" as const;
export const SCENE_DOCUMENT_FLOW_VERSION = "1.1" as const;
export const SCENE_DOCUMENT_CHART_VERSION = "1.2" as const;
export const SCENE_DOCUMENT_SEQUENCE_VERSION = "1.3" as const;
export const SCENE_DOCUMENT_DEFINITION_LIST_VERSION = "1.4" as const;
export const SCENE_DOCUMENT_TABLE_VERSION = "1.5" as const;
export const SCENE_DOCUMENT_DOT_PLOT_VERSION = "1.6" as const;
export const SCENE_DOCUMENT_DERIVATION_VERSION = "1.7" as const;
export const SCENE_DOCUMENT_OBSERVATION_VERSION = "1.8" as const;
export const SCENE_DOCUMENT_BOX_PLOT_VERSION = "1.9" as const;
export const SCENE_DOCUMENT_HISTOGRAM_VERSION = "1.10" as const;
export const SCENE_DOCUMENT_EXPLORATION_VERSION = "1.11" as const;
export const SCENE_DOCUMENT_MOMENT_VERSION = "1.12" as const;
export const SCENE_DOCUMENT_BINARY_EXPERIMENT_VERSION = "1.13" as const;
export const SCENE_DOCUMENT_EXPERIMENT_VERSION = "1.14" as const;

export const SCENE_DOCUMENT_VERSIONS = [
  SCENE_DOCUMENT_VERSION, SCENE_DOCUMENT_FLOW_VERSION, SCENE_DOCUMENT_CHART_VERSION,
  SCENE_DOCUMENT_SEQUENCE_VERSION, SCENE_DOCUMENT_DEFINITION_LIST_VERSION,
  SCENE_DOCUMENT_TABLE_VERSION, SCENE_DOCUMENT_DOT_PLOT_VERSION, SCENE_DOCUMENT_DERIVATION_VERSION,
  SCENE_DOCUMENT_OBSERVATION_VERSION, SCENE_DOCUMENT_BOX_PLOT_VERSION,
  SCENE_DOCUMENT_HISTOGRAM_VERSION, SCENE_DOCUMENT_EXPLORATION_VERSION, SCENE_DOCUMENT_MOMENT_VERSION,
  SCENE_DOCUMENT_BINARY_EXPERIMENT_VERSION, SCENE_DOCUMENT_EXPERIMENT_VERSION,
] as const;
export type SceneDocumentVersion = typeof SCENE_DOCUMENT_VERSIONS[number];

export const SCENE_CAPABILITY_VERSION = {
  diagrams: SCENE_DOCUMENT_FLOW_VERSION,
  charts: SCENE_DOCUMENT_CHART_VERSION,
  diagramStates: SCENE_DOCUMENT_CHART_VERSION,
  sequenceDiagrams: SCENE_DOCUMENT_SEQUENCE_VERSION,
  definitionLists: SCENE_DOCUMENT_DEFINITION_LIST_VERSION,
  tables: SCENE_DOCUMENT_TABLE_VERSION,
  dotPlots: SCENE_DOCUMENT_DOT_PLOT_VERSION,
  derivations: SCENE_DOCUMENT_DERIVATION_VERSION,
  observationExplorers: SCENE_DOCUMENT_OBSERVATION_VERSION,
  boxPlots: SCENE_DOCUMENT_BOX_PLOT_VERSION,
  histograms: SCENE_DOCUMENT_HISTOGRAM_VERSION,
  exploration: SCENE_DOCUMENT_EXPLORATION_VERSION,
  moments: SCENE_DOCUMENT_MOMENT_VERSION,
  binaryExperiments: SCENE_DOCUMENT_BINARY_EXPERIMENT_VERSION,
  histogramReferences: SCENE_DOCUMENT_BINARY_EXPERIMENT_VERSION,
  chartDisplay: SCENE_DOCUMENT_BINARY_EXPERIMENT_VERSION,
  topics: SCENE_DOCUMENT_BINARY_EXPERIMENT_VERSION,
  experiments: SCENE_DOCUMENT_EXPERIMENT_VERSION,
} as const satisfies Record<string, SceneDocumentVersion>;
export type SceneCapability = keyof typeof SCENE_CAPABILITY_VERSION;

export function isSceneDocumentVersion(value: unknown): value is SceneDocumentVersion {
  return typeof value === "string" && (SCENE_DOCUMENT_VERSIONS as readonly string[]).includes(value);
}

export function supportsSceneCapability(version: SceneDocumentVersion, capability: SceneCapability): boolean {
  // Explicit ordered versions avoid lexical comparisons (1.10 precedes 1.9 lexically)
  // and do not accidentally accept unknown future versions.
  const current = SCENE_DOCUMENT_VERSIONS.indexOf(version);
  return current >= 0 && current >= SCENE_DOCUMENT_VERSIONS.indexOf(SCENE_CAPABILITY_VERSION[capability]);
}
