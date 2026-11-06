/** Structural checks at the unknown JSON boundary, before semantic validation.
 *
 * Every typed field is covered by a schema; the mapped Fields<T> type makes new
 * required or optional model fields a typecheck error until they are validated.
 * Extra fields remain allowed for additive transport metadata. Values are checked
 * without coercion, mutation, or executing renderer code.
 */
import type {
  AccessibilityMetadata, SourceReference, DidacticIntent, Disclosure, SceneBlockBase,
  ProseBlock, MathBlock, CodeBlock, MediaReferenceBlock, ListItem, ListBlock,
  DefinitionListEntry, DefinitionListBlock, TableColumn, TableCell, TableRow, TableBlock,
  GroupBlock, PromptBlock, DiagramNodePart, DiagramNode, DiagramGroup, DiagramEdge,
  SharedEdgeAnnotation, DiagramState, ParticipantRole, ParticipantBinding, InteractionMessage,
  DiagramBlock, ChartAxis, BarChartDatum, LineChartDatum, LineChartSeries,
  BarChartPointAnnotation, LineChartPointAnnotation, LineChartRangeAnnotation, LiveChartUpdate,
  BarChartBlock, LineChartBlock, DotPlotGroup, ChartReferenceLine, DotPlotBlock, ChartBlock,
  DerivationFormula, DerivationAssumption, MathematicalRule, DerivationStep,
  MathematicalDerivationSection, MathematicalDerivationDetail, SceneBlock, Scene, SceneDocument,
} from "./scene-document.ts";
import type { BinaryExperiment, BinaryExperimentStage } from "./binary-experiment.ts";
import type { BoxPlotBlock } from "./box-plot.ts";
import type { HistogramBlock, Histogram2DBlock, HistogramState } from "./histogram.ts";
import type {
  ObservationExplorerBlock, ObservationSeries, ComparisonResult, ComparisonStage, SummaryComparison,
} from "./observation-explorer.ts";
import { experimentKinds, type ExperimentBlock, type ExperimentParameter } from "./distribution-experiment.ts";
import { isSceneDocumentVersion, type SceneDocumentVersion } from "./scene-version.ts";

export class SceneContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SceneContractError";
  }
}

export const VISUAL_MOTIF_KEYS = [
  "discussion", "hands-on", "statistics", "inference", "regression", "design-of-experiments",
  "multivariate", "machine-learning", "calibration-flasks", "sampling-lake", "nonlinear-curve",
  "multiple-inputs", "neural-network", "other-models",
] as const;
export type VisualMotifKey = typeof VISUAL_MOTIF_KEYS[number];

type Context = Set<object>;
interface Check<T> {
  readonly validate: (value: unknown, path: string, ancestors: Context) => void;
  /** Type-only witness: a number check cannot satisfy a string field. */
  readonly valueType?: T;
}
type Fields<T> = { readonly [K in keyof T]-?: Check<T[K]> };

function fail(path: string, requirement: string): never {
  throw new SceneContractError(`${path} ${requirement}`);
}
const text: Check<string> = { validate(value, path) {
  if (typeof value !== "string") fail(path, "must be a string");
} };
const number: Check<number> = { validate(value, path) {
  if (typeof value !== "number") fail(path, "must be a number");
  if (!Number.isFinite(value)) fail(path, "must be finite");
} };
const boolean: Check<boolean> = { validate(value, path) {
  if (typeof value !== "boolean") fail(path, "must be boolean");
} };
const absent: Check<undefined> = { validate(value, path) {
  if (value !== undefined) fail(path, "is not supported for this block");
} };
function choice<const T extends readonly string[]>(...values: T): Check<T[number]> {
  return { validate(value, path) {
    if (typeof value !== "string" || !values.includes(value)) fail(path, `must be one of: ${values.join(", ")}`);
  } };
}
function optional<T>(check: Check<T>): Check<T | undefined> {
  return { validate(value, path, ancestors) {
    if (value !== undefined) check.validate(value, path, ancestors);
  } };
}
function within(value: object, path: string, ancestors: Context, validate: () => void): void {
  if (ancestors.has(value)) fail(path, "must not contain a cycle");
  ancestors.add(value);
  try { validate(); } finally { ancestors.delete(value); }
}
function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(path, "must be an object");
  return value as Record<string, unknown>;
}
function object<T>(fields: Fields<T>): Check<T> {
  return { validate(value, path, ancestors) {
    const valueRecord = record(value, path);
    within(valueRecord, path, ancestors, () => {
      for (const [key, check] of Object.entries(fields) as [string, Check<unknown>][]) {
        check.validate(valueRecord[key], `${path}.${key}`, ancestors);
      }
    });
  } };
}
function array<T>(check: Check<T>): Check<readonly T[]> {
  return { validate(value, path, ancestors) {
    if (!Array.isArray(value)) fail(path, "must be an array");
    within(value, path, ancestors, () => {
      // An indexed loop also rejects sparse arrays; Array.forEach would skip holes.
      for (let index = 0; index < value.length; index++) check.validate(value[index], `${path}[${index}]`, ancestors);
    });
  } };
}
const pair: Check<readonly [number, number]> = { validate(value, path, ancestors) {
  if (!Array.isArray(value) || value.length !== 2) fail(path, "must be a pair of finite numbers");
  array(number).validate(value, path, ancestors);
} };
function lazy<T>(get: () => Check<T>): Check<T> {
  return { validate: (value, path, ancestors) => get().validate(value, path, ancestors) };
}
function tagged<T, K extends keyof T & string>(
  key: K,
  variants: { readonly [V in Extract<T[K], string>]: Check<Extract<T, Record<K, V>>> },
): Check<T> {
  return { validate(value, path, ancestors) {
    const valueRecord = record(value, path);
    const discriminator = valueRecord[key];
    if (typeof discriminator !== "string" || !Object.hasOwn(variants, discriminator)) {
      fail(`${path}.${key}`, `is unsupported; expected one of: ${Object.keys(variants).join(", ")}`);
    }
    (variants as Record<string, Check<unknown>>)[discriminator]!.validate(value, path, ancestors);
  } };
}

const strings = array(text);
const source = array(object<SourceReference>({
  resourceId: text, provenanceIds: optional(strings), relationPath: optional(text),
}));
const identity = { id: text, source };
const labelled = { ...identity, label: text };
const described = { ...labelled, description: text };
const emphasis = choice("normal", "supporting", "primary");
const motif: Check<VisualMotifKey> = { validate(value, path) {
  if (typeof value !== "string" || !(VISUAL_MOTIF_KEYS as readonly string[]).includes(value)) {
    fail(path, "is not supported");
  }
} };
const motifRole: Check<"supporting" | "highlight"> = { validate(value, path) {
  if (value !== "supporting" && value !== "highlight") fail(path, "must be supporting or highlight");
} };
const accessibility = object<AccessibilityMetadata>({
  label: optional(text), description: optional(text), nonVisualAlternative: optional(text),
});
const disclosure = object<Disclosure>({
  order: number, mode: choice("initial", "progressive", "optional"), step: optional(number),
  triggerResourceId: optional(text),
});
const base = {
  ...identity, disclosure: optional(disclosure), emphasis: optional(emphasis),
  intent: optional(object<DidacticIntent>({ kind: choice("introduce", "explain", "emphasize", "contrast", "practice", "reflect", "derive") })),
  accessibility: optional(accessibility),
} satisfies Fields<SceneBlockBase>;
const definitionEntry = object<DefinitionListEntry>({
  ...identity, term: text, description: optional(text), explanation: optional(text), expression: optional(text),
  symbol: optional(boolean), visualMotif: optional(motif), visualMotifRole: optional(motifRole),
});
const formula = object<DerivationFormula>({ ...identity, label: optional(text), expression: text });
const assumption = object<DerivationAssumption>(described);
const rule = object<MathematicalRule>({ ...described, formula });
const derivationStep = object<DerivationStep>({
  ...identity, order: number, from: formula, to: formula, operation: text,
  kind: choice("equivalence", "implication", "statistical"), kindLabel: text, rule,
  explanation: object<DerivationStep["explanation"]>({ ...identity, text, application: formula }),
  assumptions: array(assumption),
});
const derivation = object<MathematicalDerivationSection>({
  ...labelled, derivationId: text, firstOrder: number, lastOrder: number,
  steps: array(derivationStep), legend: array(definitionEntry),
});
const derivationDetail = object<MathematicalDerivationDetail>({
  ...labelled, stepCount: number, inputFormulaId: text, resultFormulaId: text, sections: array(derivation),
});
const binaryStage = object<BinaryExperimentStage>({
  ...identity, prompt: text, revealLevel: number, trialCount: optional(number), positiveProbability: optional(number),
  arrangementIndex: optional(number), caseIndex: optional(number), seriesRun: optional(number),
});
const binary = object<BinaryExperiment>({
  ...identity, mode: choice("decision", "series", "sequence", "arrangements", "distribution", "zero", "assumptions"),
  targetCount: optional(number), trialCount: number, positiveProbability: number, seed: number,
  positiveLabel: text, negativeLabel: text, unitLabel: text, trialName: text, stages: optional(array(binaryStage)),
});
const diagramNode = object<DiagramNode>({
  ...labelled, notation: optional(text), description: optional(text), emphasis: optional(emphasis),
  visualRole: optional(text), visualMotif: optional(motif), visualMotifRole: optional(motifRole), groupIds: optional(strings),
  parts: optional(array(object<DiagramNodePart>({ ...labelled, description: optional(text) }))),
});
const diagramEdge = object<DiagramEdge>({
  ...labelled, sourceNodeId: text, targetNodeId: text, visualRole: optional(text),
});
const participantBinding = object<ParticipantBinding>({ roleId: text, participantId: text, label: text, source });
const diagramState = object<DiagramState>({
  ...labelled, sharedEdgeAnnotations: array(object<SharedEdgeAnnotation>({ ...labelled, edgeIds: strings })),
  activeNodeIds: optional(strings), activeEdgeIds: optional(strings), activeGroupIds: optional(strings),
  focusNodeId: optional(text), focusGroupId: optional(text), contextGroupIds: optional(strings),
  activeMessageIds: optional(strings), participantBindings: optional(array(participantBinding)),
});
const diagram = object<DiagramBlock>({
  ...base, kind: choice("diagram"), diagramType: choice("flow", "network", "sequence"), label: text, description: text,
  nodes: array(diagramNode), edges: array(diagramEdge), groups: optional(array(object<DiagramGroup>(labelled))),
  focusNodeId: optional(text), states: optional(array(diagramState)), binaryExperiment: optional(binary),
  participantRoles: optional(array(object<ParticipantRole>(labelled))),
  messages: optional(array(object<InteractionMessage>({ ...labelled, sourceRoleId: text, targetRoleId: text }))),
});
const axis = object<ChartAxis>({ label: text, unit: optional(text) });
const chartBase = { ...base, kind: choice("chart"), label: text, description: text, xAxis: axis, yAxis: axis };
const lineDatum = object<LineChartDatum>({ ...identity, x: number, y: number });
const lineSeries = object<LineChartSeries>({ ...labelled, data: array(lineDatum) });
const referenceLine = object<ChartReferenceLine>({ ...labelled, value: number });
const dotGroup = object<DotPlotGroup>({
  ...labelled, data: array(object<DotPlotGroup["data"][number]>({ ...identity, value: number, label: optional(text) })),
  x: optional(number), summary: optional(referenceLine),
  interval: optional(object<NonNullable<DotPlotGroup["interval"]>>({ ...labelled, lower: number, upper: number })),
});
const liveUpdate = object<LiveChartUpdate>({ intervalMs: number, jitterAmplitude: number, decimalPlaces: number });
const barPoint = object<BarChartPointAnnotation>({ ...labelled, kind: choice("point"), datumId: text });
const lineAnnotation = tagged<LineChartPointAnnotation | LineChartRangeAnnotation, "kind">("kind", {
  point: object<LineChartPointAnnotation>({ ...labelled, kind: choice("point"), datumId: text, seriesId: text }),
  "x-range": object<LineChartRangeAnnotation>({ ...labelled, kind: choice("x-range"), seriesId: text, startDatumId: text, endDatumId: text }),
});
const comparisonResult = object<ComparisonResult>({ ...labelled, value: number, unit: text, propertyId: text });
const observationSeries = object<ObservationSeries>({
  ...labelled, datasetId: text,
  data: array(object<ObservationSeries["data"][number]>({ ...labelled, value: number })),
  summaries: optional(object<NonNullable<ObservationSeries["summaries"]>>({
    mean: comparisonResult, variance: comparisonResult, sd: comparisonResult,
  })),
});
const comparisonStage: Check<ComparisonStage> = object<ComparisonStage>({
  ...labelled, prompt: text,
  mode: choice("observations", "mean", "spread", "summaries", "overlay", "rank", "interval", "mirror", "topics", "distribution"),
  topics: optional(array(object<{ text: string; source: readonly SourceReference[] }>({ text, source }))),
  investigations: optional(array(lazy(() => comparisonStage))), allowOverlay: optional(boolean),
});
const comparison = object<SummaryComparison>({
  minimum: number, maximum: number, stages: array(comparisonStage), interval: pair,
  details: array(object<SummaryComparison["details"][number]>({ text: optional(text), expression: optional(text), source })),
});
const histogramBase = { ...chartBase, edges: array(number) };
const chart = tagged<ChartBlock, "chartType">("chartType", {
  bar: object<BarChartBlock>({
    ...chartBase, chartType: choice("bar"),
    data: array(object<BarChartDatum>({ ...identity, category: text, group: optional(text), value: number })),
    annotations: optional(array(barPoint)), liveUpdate: optional(liveUpdate), presentation: optional(choice("progressive", "complete")),
  }),
  line: object<LineChartBlock>({
    ...chartBase, chartType: choice("line"), series: array(lineSeries), annotations: optional(array(lineAnnotation)),
    liveUpdate: optional(liveUpdate), presentation: optional(choice("progressive", "complete")),
    interpolation: optional(choice("linear", "step-after")), showPoints: optional(boolean), yDomain: optional(pair),
  }),
  dot: object<DotPlotBlock>({
    ...chartBase, chartType: choice("dot"), groups: array(dotGroup), referenceLine: optional(referenceLine),
    xScale: optional(choice("linear")), yMinimum: optional(number), markerRadius: optional(number), markerOpacity: optional(number),
    summaryRadius: optional(number), drawStems: optional(boolean), observationLabel: optional(text), summaryLabel: optional(text),
    curves: optional(array(lineSeries)), liveUpdate: absent,
  }),
  box: object<BoxPlotBlock & SceneBlockBase>({
    ...chartBase, chartType: choice("box"), groups: array(dotGroup), quantileMethod: choice("type7"), fenceMultiplier: number,
    yMinimum: optional(number), showObservations: optional(boolean), liveUpdate: absent,
  }),
  histogram: object<HistogramBlock & SceneBlockBase>({
    ...histogramBase, chartType: choice("histogram"), normalization: choice("count", "density"),
    data: array(object<HistogramBlock["data"][number]>({ ...identity, value: number })),
    curves: optional(array(lineSeries)), binCounts: optional(array(number)),
    states: optional(array(object<HistogramState>({ ...described, binCounts: array(number) }))),
    binAdjustment: optional(object<NonNullable<HistogramBlock["binAdjustment"]>>({ minimumWidth: number, maximumWidth: number, widthStep: number })),
  }),
  histogram2d: object<Histogram2DBlock & SceneBlockBase>({
    ...histogramBase, chartType: choice("histogram2d"), yEdges: array(number),
    data: array(object<Histogram2DBlock["data"][number]>({ ...identity, value: number, y: number })),
  }),
  observations: object<ObservationExplorerBlock & SceneBlockBase>({
    ...chartBase, chartType: choice("observations"), view: choice("compare", "order", "count", "ecdf", "summary", "moments"),
    momentMetric: optional(choice("mean", "variance", "kurtosis", "skewness")), compact: optional(boolean), interactive: optional(boolean),
    series: array(observationSeries), liveUpdate: absent, comparison: optional(comparison),
    threshold: optional(object<NonNullable<ObservationExplorerBlock["threshold"]>>({
      minimum: number, maximum: number, initial: number, step: number, lowerInitial: optional(number),
    })),
    formal: optional(object<NonNullable<ObservationExplorerBlock["formal"]>>({ definition: text, expression: text, spokenText: text, source })),
  }),
  experiment: object<ExperimentBlock>({
    ...chartBase, chartType: choice("experiment"), experimentKind: choice(...experimentKinds),
    parameters: array(object<ExperimentParameter>({
      ...labelled, key: text, value: number, minimum: number, maximum: number, step: number, adjustable: boolean,
    })),
    data: optional(array(object<NonNullable<ExperimentBlock["data"]>[number]>({
      x: number, y: number, z: optional(number), label: text, source,
    }))),
  }),
});
const block: Check<SceneBlock> = tagged<SceneBlock, "kind">("kind", {
  prose: object<ProseBlock>({ ...base, kind: choice("prose"), text, format: optional(choice("plain", "markdown")) }),
  math: object<MathBlock>({
    ...base, kind: choice("math"), label: optional(text), expression: text, spokenText: text,
    derivation: optional(derivation), derivationDetails: optional(array(derivationDetail)),
  }),
  code: object<CodeBlock>({ ...base, kind: choice("code"), language: text, code: text, editable: boolean, executable: boolean, fallback: text }),
  "media-reference": object<MediaReferenceBlock>({
    ...base, kind: choice("media-reference"), uri: text, mediaType: optional(text), version: optional(text), integrity: optional(text), alternativeText: text, caption: optional(text),
  }),
  list: object<ListBlock>({
    ...base, kind: choice("list"), listStyle: choice("unordered", "ordered"), items: array(object<ListItem>({ ...identity, text })),
  }),
  "definition-list": object<DefinitionListBlock>({ ...base, kind: choice("definition-list"), entries: array(definitionEntry) }),
  table: object<TableBlock>({
    ...base, kind: choice("table"), caption: text, description: optional(text), columns: array(object<TableColumn>(labelled)),
    rows: array(object<TableRow>({ ...identity, cells: array(object<TableCell>({ ...identity, text })) })),
  }),
  group: object<GroupBlock>({ ...base, kind: choice("group"), children: array(lazy(() => block)), readingOrder: strings }),
  prompt: object<PromptBlock>({
    ...base, kind: choice("prompt"), prompt: text, responseMode: choice("reflection", "single-choice", "multiple-choice", "free-text"),
    options: optional(strings), optionIds: optional(strings), correctOptionId: optional(text), expectedResult: optional(text), fallback: text,
  }),
  diagram,
  chart,
});
const version: Check<SceneDocumentVersion> = { validate(value) {
  if (!isSceneDocumentVersion(value)) throw new SceneContractError(`Unsupported scene document version: ${String(value)}`);
} };
const document = object<SceneDocument>({
  version, id: text, sourcePathId: text,
  scenes: array(object<Scene>({
    ...identity, blocks: array(block), readingOrder: strings, narration: optional(text), accessibility: optional(accessibility),
    topic: optional(object<NonNullable<Scene["topic"]>>({ label: text, source })),
  })),
});

export function assertSceneDocumentStructure(value: unknown): asserts value is SceneDocument {
  document.validate(value, "SceneDocument", new Set());
}
