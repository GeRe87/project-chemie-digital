import { validatePresentationTitle, type PresentationTitleMetadata } from "./presentation-metadata.ts";
import { validateObservationExplorer, type ObservationExplorerBlock } from "./observation-explorer.ts";
import { boxPlotSummary, type BoxPlotBlock } from "./box-plot.ts";
import { validateHistogram, type HistogramBlock, type Histogram2DBlock } from "./histogram.ts";
import { validateRegressionChart, type RegressionChartBlock } from "./regression-chart.ts";
export const SCENE_DOCUMENT_HISTOGRAM_VERSION = "1.10" as const;
export const SCENE_DOCUMENT_EXPLORATION_VERSION = "1.11" as const;
export const SCENE_DOCUMENT_MOMENT_VERSION = "1.12" as const;
export const SCENE_DOCUMENT_TIMELINE_VERSION = "1.13" as const;
export const SCENE_DOCUMENT_REGRESSION_VERSION = "1.14" as const;
export const SCENE_DOCUMENT_BOX_PLOT_VERSION = "1.9" as const;
export const SCENE_DOCUMENT_OBSERVATION_VERSION = "1.8" as const;
export const SCENE_DOCUMENT_VERSION = "1.0" as const;
export const SCENE_DOCUMENT_FLOW_VERSION = "1.1" as const;
export const SCENE_DOCUMENT_CHART_VERSION = "1.2" as const;
export const SCENE_DOCUMENT_SEQUENCE_VERSION = "1.3" as const;
export const SCENE_DOCUMENT_DEFINITION_LIST_VERSION = "1.4" as const;
export const SCENE_DOCUMENT_TABLE_VERSION = "1.5" as const;
export const SCENE_DOCUMENT_DOT_PLOT_VERSION = "1.6" as const;
export const SCENE_DOCUMENT_DERIVATION_VERSION = "1.7" as const;

export type SceneDocumentVersion =
  | typeof SCENE_DOCUMENT_VERSION
  | typeof SCENE_DOCUMENT_FLOW_VERSION
  | typeof SCENE_DOCUMENT_CHART_VERSION
  | typeof SCENE_DOCUMENT_SEQUENCE_VERSION
  | typeof SCENE_DOCUMENT_DEFINITION_LIST_VERSION
  | typeof SCENE_DOCUMENT_TABLE_VERSION
  | typeof SCENE_DOCUMENT_DOT_PLOT_VERSION
  | typeof SCENE_DOCUMENT_DERIVATION_VERSION
  | typeof SCENE_DOCUMENT_OBSERVATION_VERSION
  | typeof SCENE_DOCUMENT_BOX_PLOT_VERSION
  | typeof SCENE_DOCUMENT_HISTOGRAM_VERSION
  | typeof SCENE_DOCUMENT_EXPLORATION_VERSION
  | typeof SCENE_DOCUMENT_MOMENT_VERSION
  | typeof SCENE_DOCUMENT_TIMELINE_VERSION
  | typeof SCENE_DOCUMENT_REGRESSION_VERSION;

export const VISUAL_MOTIF_KEYS = [
  "discussion",
  "hands-on",
  "statistics",
  "inference",
  "regression",
  "design-of-experiments",
  "multivariate",
  "machine-learning",
  "calibration-flasks",
  "sampling-lake",
  "nonlinear-curve",
  "multiple-inputs",
  "neural-network",
  "other-models",
  "data-import",
  "peak-search",
  "shared-peak-shape",
  "marker-selection",
  "semantic-model",
  "processing-composition",
  "average-operation",
  "event-server",
  "execution-engine",
  "workflow-results",
  "measurement-ready",
  "event-handler",
  "data-server",
] as const;

export type VisualMotifKey = typeof VISUAL_MOTIF_KEYS[number];

export interface SourceReference {
  readonly resourceId: string;
  readonly provenanceIds?: readonly string[];
  readonly relationPath?: string;
}

export interface AccessibilityMetadata {
  readonly label?: string;
  readonly description?: string;
  readonly nonVisualAlternative?: string;
}

export interface DidacticIntent {
  readonly kind:
    | "introduce"
    | "explain"
    | "emphasize"
    | "contrast"
    | "practice"
    | "reflect"
    | "derive";
}

export interface Disclosure {
  readonly order: number;
  readonly mode: "initial" | "progressive" | "optional";
  readonly step?: number;
  readonly triggerResourceId?: string;
}

interface SceneBlockBase {
  readonly id: string;
  readonly source: readonly SourceReference[];
  readonly disclosure?: Disclosure;
  readonly emphasis?: "normal" | "supporting" | "primary";
  readonly intent?: DidacticIntent;
  readonly accessibility?: AccessibilityMetadata;
}

export interface ProseBlock extends SceneBlockBase {
  readonly kind: "prose";
  readonly text: string;
  readonly format?: "plain" | "markdown";
}

export interface MathBlock extends SceneBlockBase {
  readonly label?: string;
  readonly kind: "math";
  readonly expression: string;
  readonly spokenText: string;
  /** Explicit semantic transformations; absence retains ordinary formula behavior. */
  readonly derivation?: MathematicalDerivationSection;
  /** Optional full proofs; their authored sections do not become slide stages. */
  readonly derivationDetails?: readonly MathematicalDerivationDetail[];
}

export interface DerivationFormula {
  readonly label?: string;
  readonly id: string;
  readonly expression: string;
  readonly source: readonly SourceReference[];
}
export interface DerivationAssumption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly source: readonly SourceReference[];
}
export interface MathematicalRule {
  readonly id: string;
  readonly label: string;
  readonly formula: DerivationFormula;
  readonly description: string;
  readonly source: readonly SourceReference[];
}
export interface DerivationStep {
  readonly id: string;
  readonly order: number;
  readonly from: DerivationFormula;
  readonly to: DerivationFormula;
  readonly operation: string;
  readonly kind: "equivalence" | "implication" | "statistical";
  readonly kindLabel: string;
  readonly rule: MathematicalRule;
  readonly explanation: { readonly id: string; readonly text: string; readonly application: DerivationFormula; readonly source: readonly SourceReference[] };
  readonly assumptions: readonly DerivationAssumption[];
  readonly source: readonly SourceReference[];
}
export interface MathematicalDerivationSection {
  readonly id: string;
  readonly derivationId: string;
  readonly label: string;
  readonly firstOrder: number;
  readonly lastOrder: number;
  readonly steps: readonly DerivationStep[];
  readonly legend: readonly DefinitionListEntry[];
  readonly source: readonly SourceReference[];
}

export interface MathematicalDerivationDetail {
  readonly id: string;
  readonly label: string;
  readonly stepCount: number;
  readonly inputFormulaId: string;
  readonly resultFormulaId: string;
  readonly sections: readonly MathematicalDerivationSection[];
  readonly source: readonly SourceReference[];
}

export function validateMathematicalDerivationDetail(detail: MathematicalDerivationDetail): void {
  requireNonEmpty(detail.id, "detail derivation id");
  requireNonEmpty(detail.label, "detail derivation label");
  validateSource(detail.source, "detail derivation source");
  if (!detail.sections.length || !Number.isInteger(detail.stepCount) || detail.stepCount < 1) throw new SceneContractError("Detail derivation needs complete authored sections");
  let order = 1;
  let previous = detail.inputFormulaId;
  const ids = new Set<string>();
  for (const section of detail.sections) {
    validateMathematicalDerivation(section);
    if (ids.has(section.id) || section.derivationId !== detail.id || section.firstOrder !== order || section.steps[0]!.from.id !== previous) throw new SceneContractError("Detail sections must uniquely and continuously cover their derivation");
    ids.add(section.id); order = section.lastOrder + 1; previous = section.steps.at(-1)!.to.id;
  }
  if (order !== detail.stepCount + 1 || previous !== detail.resultFormulaId) throw new SceneContractError("Incomplete detail derivation boundaries");
}

export function mathematicalDerivationText(section: MathematicalDerivationSection): string {
  return [section.steps[0]!.from.expression, ...section.steps.flatMap(step => [step.operation,
    step.rule.formula.expression, step.to.expression, step.rule.description,
    step.explanation.application.expression, step.explanation.text, ...step.assumptions.map(a => a.description)]),
    ...section.legend.map(e => `${e.term}: ${e.description ?? ""}`)].join("\n");
}

export function validateMathematicalDerivation(section: MathematicalDerivationSection): void {
  requireNonEmpty(section.id, "derivation section id");
  requireNonEmpty(section.derivationId, "derivation id");
  requireNonEmpty(section.label, "derivation label");
  validateSource(section.source, "derivation section source");
  if (!section.steps.length || section.steps.length > 2) throw new SceneContractError("Derivation section needs one or two steps; author explicit contiguous sections instead of shrinking formulas");
  if (!Number.isInteger(section.firstOrder) || section.firstOrder < 1) throw new SceneContractError("Invalid first derivation step");
  if (section.lastOrder !== section.firstOrder + section.steps.length - 1) throw new SceneContractError("Invalid derivation section range");
  const formula = (f: DerivationFormula) => {
    requireNonEmpty(f.id, "derivation formula id"); requireNonEmpty(f.expression, "derivation formula expression"); validateSource(f.source, "derivation formula source");
    if (f.label !== undefined) requireNonEmpty(f.label, "derivation formula label");
  };
  for (const [i, step] of section.steps.entries()) {
    if (step.order !== section.firstOrder + i) throw new SceneContractError("Derivation step order must be contiguous");
    if (i && section.steps[i - 1]!.to.id !== step.from.id) throw new SceneContractError("Disconnected derivation formulas");
    formula(step.from); formula(step.to); formula(step.rule.formula); formula(step.explanation.application);
    requireNonEmpty(step.id, "derivation step id"); requireNonEmpty(step.operation, "derivation operation");
    if (!["equivalence", "implication", "statistical"].includes(step.kind)) throw new SceneContractError("Unknown derivation transformation kind");
    requireNonEmpty(step.kindLabel, "derivation kind label"); requireNonEmpty(step.rule.id, "derivation rule id");
    requireNonEmpty(step.rule.label, "derivation rule label"); requireNonEmpty(step.rule.description, "derivation rule description");
    requireNonEmpty(step.explanation.text, "derivation explanation"); validateSource(step.source, "derivation step source");
    validateSource(step.rule.source, "mathematical rule source"); validateSource(step.explanation.source, "derivation explanation source");
    if (step.kind === "statistical" && !step.assumptions.length) throw new SceneContractError("Statistical transformation requires explicit assumptions");
    for (const assumption of step.assumptions) {
      requireNonEmpty(assumption.id, "assumption id"); requireNonEmpty(assumption.label, "assumption label");
      requireNonEmpty(assumption.description, "assumption description"); validateSource(assumption.source, "assumption source");
    }
  }
  if (!section.legend.length) throw new SceneContractError("Derivation requires a symbol legend");
  for (const entry of section.legend) { requireNonEmpty(entry.term, "derivation legend term"); requireNonEmpty(entry.description ?? "", "derivation legend definition"); validateSource(entry.source, "derivation legend source");
    if (entry.expression !== undefined) requireNonEmpty(entry.expression, "derivation symbol expression");
  }
}

export interface CodeBlock extends SceneBlockBase {
  readonly kind: "code";
  readonly language: string;
  readonly code: string;
  readonly editable: boolean;
  readonly executable: boolean;
  readonly fallback: string;
}

export interface MediaReferenceBlock extends SceneBlockBase {
  readonly kind: "media-reference";
  readonly uri: string;
  readonly mediaType?: string;
  readonly version?: string;
  readonly integrity?: string;
  readonly alternativeText: string;
  readonly crop?: {readonly x: number; readonly y: number; readonly width: number; readonly height: number};
  readonly redactions?: readonly {readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly start: number; readonly end: number; readonly label: string}[];
}

export interface ListItem {
  readonly id: string;
  readonly text: string;
  readonly source: readonly SourceReference[];
}

export interface ListBlock extends SceneBlockBase {
  readonly kind: "list";
  readonly listStyle: "unordered" | "ordered";
  readonly items: readonly ListItem[];
}

export interface DefinitionListEntry {
  readonly expression?: string;
  readonly symbol?: boolean;
  readonly id: string;
  readonly term: string;
  readonly description?: string;
  readonly visualMotif?: VisualMotifKey;
  readonly visualMotifRole?: "supporting" | "highlight";
  readonly source: readonly SourceReference[];
}

export interface DefinitionListBlock extends SceneBlockBase {
  readonly kind: "definition-list";
  readonly entries: readonly DefinitionListEntry[];
}

export interface TableColumn {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface TableCell {
  readonly id: string;
  readonly text: string;
  readonly source: readonly SourceReference[];
}

export interface TableRow {
  readonly id: string;
  readonly cells: readonly TableCell[];
  readonly source: readonly SourceReference[];
}

export interface TableBlock extends SceneBlockBase {
  readonly kind: "table";
  readonly caption: string;
  readonly description?: string;
  readonly columns: readonly TableColumn[];
  readonly rows: readonly TableRow[];
}

export interface GroupBlock extends SceneBlockBase {
  readonly kind: "group";
  readonly children: readonly SceneBlock[];
  readonly readingOrder: readonly string[];
}

export interface PromptBlock extends SceneBlockBase {
  readonly kind: "prompt";
  readonly prompt: string;
  readonly responseMode: "reflection" | "single-choice" | "multiple-choice" | "free-text";
  readonly options?: readonly string[];
  readonly optionIds?: readonly string[];
  readonly correctOptionId?: string;
  readonly expectedResult?: string;
  readonly fallback: string;
}

export interface DiagramNodePart {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly parentPartId?: string;
  readonly referencePartId?: string;
  readonly source: readonly SourceReference[];
}

export interface DiagramNode {
  readonly id: string;
  readonly label: string;
  /** Author-defined mathematical or technical notation (skos:notation). */
  readonly notation?: string;
  readonly description?: string;
  readonly source: readonly SourceReference[];
  readonly emphasis?: "normal" | "supporting" | "primary";
  readonly visualRole?: string;
  readonly visualMotif?: VisualMotifKey;
  readonly visualMotifRole?: "supporting" | "highlight";
  readonly groupIds?: readonly string[];
  readonly parts?: readonly DiagramNodePart[];
}

export interface DiagramGroup {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface DiagramEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly sourcePartId?: string;
  readonly targetPartId?: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly visualRole?: string;
  readonly codeDetail?: {readonly label: string; readonly description: string; readonly language: "trig"; readonly code: string; readonly source: readonly SourceReference[]};
}

export interface SharedEdgeAnnotation {
  readonly id: string;
  readonly label: string;
  readonly edgeIds: readonly string[];
  readonly source: readonly SourceReference[];
}

export interface DiagramState {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly sharedEdgeAnnotations: readonly SharedEdgeAnnotation[];
  readonly activeNodeIds?: readonly string[];
  readonly activeEdgeIds?: readonly string[];
  readonly activeGroupIds?: readonly string[];
  readonly focusNodeId?: string;
  readonly focusGroupId?: string;
  readonly contextGroupIds?: readonly string[];
  readonly activeMessageIds?: readonly string[];
  readonly participantBindings?: readonly ParticipantBinding[];
  readonly nodePresentations?: readonly {
    readonly nodeId: string; readonly label?: string; readonly description?: string;
    readonly visualMotif?: VisualMotifKey; readonly thumbnail?: {readonly uri: string; readonly alternativeText: string};
    readonly transition?: "replace-left"; readonly source: readonly SourceReference[];
  }[];
}

export interface ParticipantRole {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

/** A state-owned concrete actor for a stable process role. */
export interface ParticipantBinding {
  readonly roleId: string;
  readonly participantId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface InteractionMessage {
  readonly id: string;
  readonly sourceRoleId: string;
  readonly targetRoleId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface DiagramBlock extends SceneBlockBase {
  readonly kind: "diagram";
  readonly diagramType: "flow" | "network" | "sequence";
  readonly label: string;
  readonly description: string;
  readonly nodes: readonly DiagramNode[];
  readonly groups?: readonly DiagramGroup[];
  readonly edges: readonly DiagramEdge[];
  readonly focusNodeId?: string;
  readonly states?: readonly DiagramState[];
  readonly participantRoles?: readonly ParticipantRole[];
  readonly messages?: readonly InteractionMessage[];
}

export interface ChartAxis {
  readonly label: string;
  readonly unit?: string;
}

export interface BarChartDatum {
  readonly id: string;
  readonly category: string;
  readonly group?: string;
  readonly value: number;
  readonly source: readonly SourceReference[];
}

export interface LineChartDatum {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly source: readonly SourceReference[];
}

export interface LineChartSeries {
  readonly id: string;
  readonly label: string;
  readonly data: readonly LineChartDatum[];
  readonly source: readonly SourceReference[];
}

export interface BarChartPointAnnotation {
  readonly id: string;
  readonly kind: "point";
  readonly datumId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface LineChartPointAnnotation {
  readonly id: string;
  readonly kind: "point";
  readonly seriesId: string;
  readonly datumId: string;
  /** Reveal and focus this series at the annotation's presentation stage. */
  readonly focusSeries?: boolean;
  readonly media?: {readonly uri: string; readonly darkUri?: string; readonly alternativeText: string};
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface LineChartRangeAnnotation {
  readonly id: string;
  readonly kind: "x-range";
  readonly seriesId: string;
  readonly startDatumId: string;
  readonly endDatumId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export type LineChartAnnotation = LineChartPointAnnotation | LineChartRangeAnnotation;

export interface LiveChartUpdate {
  readonly intervalMs: number;
  readonly jitterAmplitude: number;
  readonly decimalPlaces: number;
}

export interface BarChartBlock extends SceneBlockBase {
  readonly kind: "chart";
  readonly chartType: "bar";
  readonly label: string;
  readonly description: string;
  readonly xAxis: ChartAxis;
  readonly yAxis: ChartAxis;
  readonly data: readonly BarChartDatum[];
  readonly annotations?: readonly BarChartPointAnnotation[];
  readonly liveUpdate?: LiveChartUpdate;
}

export interface LineChartBlock extends SceneBlockBase {
  readonly kind: "chart";
  readonly chartType: "line";
  readonly label: string;
  readonly description: string;
  readonly xAxis: ChartAxis;
  readonly yAxis: ChartAxis;
  readonly series: readonly LineChartSeries[];
  readonly annotations?: readonly LineChartAnnotation[];
  readonly yMinimum?: number;
  readonly liveUpdate?: LiveChartUpdate;
}

export interface DotPlotGroup {
  readonly id: string;
  readonly label: string;
  readonly disclosureStep?: number;
  readonly source: readonly SourceReference[];
  readonly data: readonly { readonly id: string; readonly value: number; readonly label?: string; readonly source: readonly SourceReference[] }[];
  readonly x?: number;
  readonly summary?: ChartReferenceLine;
  readonly interval?: {readonly id:string;readonly label:string;readonly lower:number;readonly upper:number;readonly role?:"coverage"|"descriptive-error";readonly source:readonly SourceReference[]};
}

export interface ChartReferenceLine {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly source: readonly SourceReference[];
}

export interface DotPlotBlock extends SceneBlockBase {
  readonly kind: "chart";
  readonly chartType: "dot";
  readonly label: string;
  readonly description: string;
  readonly xAxis: ChartAxis;
  readonly yAxis: ChartAxis;
  readonly groups: readonly DotPlotGroup[];
  readonly referenceLine?: ChartReferenceLine;
  readonly xScale?: "linear";
  readonly yMinimum?: number;
  readonly markerRadius?: number;
  readonly markerOpacity?: number;
  readonly summaryRadius?: number;
  readonly drawStems?: boolean;
  readonly observationLabel?: string;
  readonly summaryLabel?: string;
  readonly curves?: readonly LineChartSeries[];
  readonly showSummaryValues?: boolean;
  readonly liveUpdate?: never;
}

export interface TimelineInterval {
  readonly showRunLabel?: boolean;
  readonly id: string;
  readonly label: string;
  readonly start: number;
  readonly end: number;
  readonly categoryId: string;
  readonly source: readonly SourceReference[];
}

export interface TimelineChartBlock extends SceneBlockBase {
  readonly kind: "chart";
  readonly chartType: "timeline";
  readonly label: string;
  readonly description: string;
  /** Optional on-demand presentation; static exports still include the graph. */
  readonly presentation?: "inline" | "dialog";
  readonly xAxis: ChartAxis;
  readonly yAxis: ChartAxis;
  readonly categories: readonly { readonly id: string; readonly label: string; readonly source: readonly SourceReference[] }[];
  readonly scenarios: readonly {
    readonly id: string;
    readonly label: string;
    readonly source: readonly SourceReference[];
    readonly lanes: readonly {
      readonly id: string;
      readonly label: string;
      readonly source: readonly SourceReference[];
      readonly intervals: readonly TimelineInterval[];
    }[];
  }[];
  readonly liveUpdate?: never;
}

export function timelineStaticFallback(block: TimelineChartBlock): string {
  const unit = block.xAxis.unit ?? "";
  return [block.label, block.description, ...block.scenarios.flatMap(scenario =>
    scenario.lanes.flatMap(lane => lane.intervals.map(interval =>
      `${scenario.label}; ${lane.label}; ${interval.label}: ${interval.start}–${interval.end} ${unit}; ${block.categories.find(c => c.id === interval.categoryId)?.label ?? interval.categoryId}`)))].join("\n");
}

export type ChartBlock = BarChartBlock | LineChartBlock | DotPlotBlock | TimelineChartBlock | ((RegressionChartBlock | HistogramBlock | Histogram2DBlock | BoxPlotBlock | ObservationExplorerBlock) & SceneBlockBase);

export function dotPlotStaticFallback(block: DotPlotBlock): string {
  const unit = block.yAxis.unit ? ` ${block.yAxis.unit}` : "";
  return [block.label, block.description,
    ...block.groups.flatMap((group) => group.data.map((datum) => `${group.label}${datum.label ? `, ${datum.label}` : ""}: ${datum.value}${unit}${block.drawStems && block.referenceLine ? `; deviation ${datum.value - block.referenceLine.value >= 0 ? "+" : ""}${datum.value - block.referenceLine.value}${unit}` : ""}`)),
    ...block.groups.flatMap(group => group.summary ? [`${group.label}, ${group.summary.label}: ${group.summary.value}${unit}`] : []),
    ...block.groups.flatMap(g=>g.interval?[`${g.interval.label}: [${g.interval.lower}, ${g.interval.upper}]${unit}; ${g.interval.role === "descriptive-error" ? "descriptive error display, not coverage or a confidence interval" : `closed interval contains ${g.data.filter(d=>d.value>=g.interval!.lower&&d.value<=g.interval!.upper).length}/${g.data.length} observations (${100*g.data.filter(d=>d.value>=g.interval!.lower&&d.value<=g.interval!.upper).length/g.data.length}%)`}.`]:[]),
    ...(block.curves ?? []).flatMap(curve => curve.data.map(datum => `${curve.label}: x=${datum.x}, y=${datum.y}${unit}`)),
    ...(block.referenceLine ? [`${block.referenceLine.label}: ${block.referenceLine.value}${unit}`] : []),
  ].join("\n");
}

export type SceneBlock =
  | ProseBlock
  | MathBlock
  | CodeBlock
  | MediaReferenceBlock
  | ListBlock
  | DefinitionListBlock
  | TableBlock
  | GroupBlock
  | PromptBlock
  | DiagramBlock
  | ChartBlock;

export interface Scene {
  readonly presentationTitle?: PresentationTitleMetadata;
  readonly id: string;
  readonly source: readonly SourceReference[];
  readonly blocks: readonly SceneBlock[];
  readonly readingOrder: readonly string[];
  readonly narration?: string;
  readonly accessibility?: AccessibilityMetadata;
}

export interface SceneDocument {
  readonly version: SceneDocumentVersion;
  readonly id: string;
  readonly sourcePathId: string;
  readonly scenes: readonly Scene[];
}

export class SceneContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SceneContractError";
  }
}

function requireNonEmpty(value: string, label: string): void {
  if (value.length === 0) throw new SceneContractError(`${label} must be non-empty`);
}

function validateSource(source: readonly SourceReference[], label: string): void {
  if (source.length === 0) throw new SceneContractError(`${label} must retain at least one source resource`);
  for (const item of source) {
    requireNonEmpty(item.resourceId, `${label} resourceId`);
    if (item.relationPath !== undefined) requireNonEmpty(item.relationPath, `${label} relationPath`);
  }
}

function validateOrderedIds(ids: readonly string[], actualIds: readonly string[], label: string): void {
  if (ids.length !== actualIds.length || new Set(ids).size !== ids.length) {
    throw new SceneContractError(`${label} must list every child exactly once`);
  }
  for (const id of ids) if (!actualIds.includes(id)) throw new SceneContractError(`${label} references unknown id ${id}`);
}

function validateDisclosureOrders(blocks: readonly SceneBlock[], label: string): void {
  const disclosedBlocks = blocks.filter((block) => block.disclosure !== undefined);
  const orders = disclosedBlocks.map((block) => block.disclosure!.order);
  if (new Set(orders).size !== orders.length) {
    throw new SceneContractError(`${label} disclosure orders must be unique among siblings`);
  }
}

function validateListItems(items: readonly ListItem[], label: string): void {
  if (items.length === 0) throw new SceneContractError(`${label} must contain at least one item`);
  const ids = items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw new SceneContractError(`${label} contains duplicate item ids`);
  for (const item of items) {
    requireNonEmpty(item.id, `${label} item id`);
    requireNonEmpty(item.text, `${label} item ${item.id} text`);
    validateSource(item.source, `${label} item ${item.id} source`);
  }
}

function validateVisualMotif(value: VisualMotifKey | undefined, label: string): void {
  if (value !== undefined && !(VISUAL_MOTIF_KEYS as readonly string[]).includes(value)) {
    throw new SceneContractError(`${label} visualMotif is not supported`);
  }
}

function validateDefinitionListEntries(entries: readonly DefinitionListEntry[], label: string): void {
  if (entries.length === 0) throw new SceneContractError(`${label} must contain at least one entry`);
  const ids = new Set<string>();
  for (const entry of entries) {
    requireNonEmpty(entry.id, `${label} entry id`);
    if (ids.has(entry.id)) throw new SceneContractError(`${label} contains duplicate entry ids`);
    ids.add(entry.id);
    requireNonEmpty(entry.term, `${label} entry ${entry.id} term`);
    if (entry.expression !== undefined) requireNonEmpty(entry.expression, `${label} entry ${entry.id} symbol expression`);
    if (entry.symbol !== undefined && typeof entry.symbol !== "boolean") throw new SceneContractError(`${label} symbol flag must be boolean`);
    if (entry.description !== undefined) requireNonEmpty(entry.description, `${label} entry ${entry.id} description`);
    if (entry.visualMotifRole !== undefined && entry.visualMotifRole !== "supporting" && entry.visualMotifRole !== "highlight") {
      throw new SceneContractError(`${label} entry ${entry.id} visualMotifRole must be supporting or highlight`);
    }
    validateVisualMotif(entry.visualMotif, `${label} entry ${entry.id}`);
    validateSource(entry.source, `${label} entry ${entry.id} source`);
  }
}

function validateTable(block: TableBlock, label: string): void {
  requireNonEmpty(block.caption, `${label} caption`);
  if (block.description !== undefined) requireNonEmpty(block.description, `${label} description`);
  if (block.columns.length === 0) throw new SceneContractError(`${label} must contain at least one column`);
  if (block.rows.length === 0) throw new SceneContractError(`${label} must contain at least one row`);

  const columnIds = new Set<string>();
  for (const column of block.columns) {
    requireNonEmpty(column.id, `${label} column id`);
    if (columnIds.has(column.id)) throw new SceneContractError(`${label} contains duplicate column ids`);
    columnIds.add(column.id);
    requireNonEmpty(column.label, `${label} column ${column.id} label`);
    validateSource(column.source, `${label} column ${column.id} source`);
  }

  const rowIds = new Set<string>();
  const cellIds = new Set<string>();
  for (const row of block.rows) {
    requireNonEmpty(row.id, `${label} row id`);
    if (rowIds.has(row.id)) throw new SceneContractError(`${label} contains duplicate row ids`);
    rowIds.add(row.id);
    validateSource(row.source, `${label} row ${row.id} source`);
    if (row.cells.length !== block.columns.length) {
      throw new SceneContractError(`${label} row ${row.id} must contain exactly one cell per column`);
    }
    for (const cell of row.cells) {
      requireNonEmpty(cell.id, `${label} cell id`);
      if (cellIds.has(cell.id)) throw new SceneContractError(`${label} contains duplicate cell ids`);
      cellIds.add(cell.id);
      requireNonEmpty(cell.text, `${label} cell ${cell.id} text`);
      validateSource(cell.source, `${label} cell ${cell.id} source`);
    }
  }
}

function validateDiagram(block: DiagramBlock, label: string): void {
  if (block.presentation !== undefined && !["inline", "dialog"].includes(block.presentation)) throw new SceneContractError(`${label} diagram presentation must be inline or dialog`);
  requireNonEmpty(block.label, `${label} diagram label`);
  requireNonEmpty(block.description, `${label} diagram description`);
  if (block.diagramType !== "flow" && block.diagramType !== "network" && block.diagramType !== "sequence") throw new SceneContractError(`${label} diagram type must be flow, network or sequence`);
  if (block.diagramType !== "sequence" && block.nodes.length < 2) throw new SceneContractError(`${label} diagram must contain at least two nodes`);
  if (block.diagramType === "flow" && block.edges.length < 1) throw new SceneContractError(`${label} flow diagram must contain at least one edge`);
  if (block.diagramType === "sequence" && (block.participantRoles?.length ?? 0) < 2) throw new SceneContractError(`${label} sequence must contain at least two participant roles`);
  if (block.diagramType === "sequence" && (block.messages?.length ?? 0) < 1) throw new SceneContractError(`${label} sequence must contain at least one message`);

  const allPartIds = new Set(block.nodes.flatMap(node => (node.parts ?? []).map(part => part.id)));
  const nodeIdSet = new Set<string>();
  for (const node of block.nodes) {
    requireNonEmpty(node.id, `${label} diagram node id`);
    if (nodeIdSet.has(node.id)) throw new SceneContractError(`${label} diagram contains duplicate node ids`);
    nodeIdSet.add(node.id);
    requireNonEmpty(node.label, `${label} diagram node ${node.id} label`);
    if (node.notation !== undefined) requireNonEmpty(node.notation.trim(), `${label} diagram node ${node.id} notation`);
    if (node.description !== undefined) requireNonEmpty(node.description, `${label} diagram node ${node.id} description`);
    if (node.visualRole !== undefined && !/^[a-z][a-z0-9-]*$/u.test(node.visualRole)) {
      throw new SceneContractError(`${label} diagram node ${node.id} visualRole must be a lowercase token`);
    }
    if (node.parts !== undefined) {
      if (!Array.isArray(node.parts) || node.parts.length < 2) {
        throw new SceneContractError(`${label} diagram node ${node.id} parts requires at least two entries`);
      }
      const partIds = new Set<string>();
      for (const part of node.parts) {
        requireNonEmpty(part.id, `${label} diagram node ${node.id} part id`);
        if (partIds.has(part.id)) throw new SceneContractError(`${label} diagram node ${node.id} has duplicate part ids`);
        partIds.add(part.id);
        requireNonEmpty(part.label, `${label} diagram node ${node.id} part ${part.id} label`);
        if (part.description !== undefined) requireNonEmpty(part.description, `${label} diagram node ${node.id} part ${part.id} description`);
        validateSource(part.source, `${label} diagram node ${node.id} part ${part.id} source`);
        if (part.referencePartId && !allPartIds.has(part.referencePartId)) throw new SceneContractError("Part reference must target a diagram part");
        const seen = new Set<string>([part.id]);
        let parent = part.parentPartId;
        while (parent) {
          if (seen.has(parent)) throw new SceneContractError("Part parent relations must be acyclic");
          seen.add(parent);
          const owner = node.parts.find(candidate => candidate.id === parent);
          if (!owner) throw new SceneContractError("Part parent must belong to the same node");
          parent = owner.parentPartId;
        }
      }
    }
    validateVisualMotif(node.visualMotif, `${label} diagram node ${node.id}`);
    if (node.visualMotifRole !== undefined && node.visualMotifRole !== "supporting" && node.visualMotifRole !== "highlight") {
      throw new SceneContractError(`${label} diagram node ${node.id} visualMotifRole must be supporting or highlight`);
    }
    validateSource(node.source, `${label} diagram node ${node.id} source`);
  }

  const groupIds = new Set<string>();
  for (const group of block.groups ?? []) {
    requireNonEmpty(group.id, `${label} diagram group id`);
    if (groupIds.has(group.id)) throw new SceneContractError(`${label} diagram contains duplicate group ids`);
    groupIds.add(group.id);
    requireNonEmpty(group.label, `${label} diagram group ${group.id} label`);
    validateSource(group.source, `${label} diagram group ${group.id} source`);
  }
  for (const node of block.nodes) {
    for (const groupId of node.groupIds ?? []) {
      if (!groupIds.has(groupId)) throw new SceneContractError(`${label} diagram node ${node.id} references an unknown group`);
    }
  }

  const edgeIdSet = new Set<string>();
  for (const edge of block.edges) {
    if (edge.codeDetail) {
      requireNonEmpty(edge.codeDetail.label, "Diagram detail label");
      requireNonEmpty(edge.codeDetail.description, "Diagram detail description");
      requireNonEmpty(edge.codeDetail.code, "Diagram detail code");
      if (edge.codeDetail.language !== "trig") throw new SceneContractError("Diagram port detail must be TriG");
      validateSource(edge.codeDetail.source, "Diagram detail source");
    }
    requireNonEmpty(edge.id, `${label} diagram edge id`);
    if (edgeIdSet.has(edge.id)) throw new SceneContractError(`${label} diagram contains duplicate edge ids`);
    edgeIdSet.add(edge.id);
    requireNonEmpty(edge.label, `${label} diagram edge ${edge.id} label`);
    if (edge.visualRole !== undefined && !/^[a-z][a-z0-9-]*$/u.test(edge.visualRole)) {
      throw new SceneContractError(`${label} diagram edge ${edge.id} visualRole must be a lowercase token`);
    }
    requireNonEmpty(edge.sourceNodeId, `${label} diagram edge ${edge.id} sourceNodeId`);
    requireNonEmpty(edge.targetNodeId, `${label} diagram edge ${edge.id} targetNodeId`);
    if (!nodeIdSet.has(edge.sourceNodeId) || !nodeIdSet.has(edge.targetNodeId)) {
      throw new SceneContractError(`${label} diagram edge ${edge.id} references an unknown node`);
    }
    for (const [nodeId, partId] of [[edge.sourceNodeId, edge.sourcePartId], [edge.targetNodeId, edge.targetPartId]]) {
      if (partId !== undefined && !block.nodes.find(node => node.id === nodeId)?.parts?.some(part => part.id === partId)) {
        throw new SceneContractError(`${label} edge endpoint part must belong to its endpoint node`);
      }
    }
    validateSource(edge.source, `${label} diagram edge ${edge.id} source`);
  }

  const stateIds = new Set<string>();
  const roleIds = new Set((block.participantRoles ?? []).map((role) => role.id));
  for (const role of block.participantRoles ?? []) {
    requireNonEmpty(role.id, `${label} participant role id`); requireNonEmpty(role.label, `${label} participant role ${role.id} label`); validateSource(role.source, `${label} participant role ${role.id} source`);
  }
  if (roleIds.size !== (block.participantRoles ?? []).length) throw new SceneContractError(`${label} sequence contains duplicate participant role ids`);
  const messageIds = new Set<string>();
  for (const message of block.messages ?? []) {
    requireNonEmpty(message.id, `${label} interaction message id`); requireNonEmpty(message.label, `${label} interaction message ${message.id} label`);
    if (messageIds.has(message.id)) throw new SceneContractError(`${label} sequence contains duplicate message ids`); messageIds.add(message.id);
    if (!roleIds.has(message.sourceRoleId) || !roleIds.has(message.targetRoleId)) throw new SceneContractError(`${label} interaction message ${message.id} references an unknown participant role`);
    validateSource(message.source, `${label} interaction message ${message.id} source`);
  }
  const annotationIds = new Set<string>();
  for (const state of block.states ?? []) {
    const presented = new Set<string>();
    for (const presentation of state.nodePresentations ?? []) {
      if (!block.nodes.some(node => node.id === presentation.nodeId) || presented.has(presentation.nodeId)) throw new SceneContractError("Node presentation must reference a unique diagram node");
      presented.add(presentation.nodeId); validateSource(presentation.source, "Node presentation source");
      if (presentation.label !== undefined) requireNonEmpty(presentation.label, "Node presentation label");
      if (presentation.description !== undefined) requireNonEmpty(presentation.description, "Node presentation description");
      validateVisualMotif(presentation.visualMotif, "Node presentation motif");
      if (presentation.transition !== undefined && presentation.transition !== "replace-left") throw new SceneContractError("Unsupported node transition");
      if (presentation.thumbnail && (!/^\/[A-Za-z0-9_./-]+$/.test(presentation.thumbnail.uri) || presentation.thumbnail.uri.includes(".."))) throw new SceneContractError("Thumbnail must be a local asset");
    }
    requireNonEmpty(state.id, `${label} diagram state id`);
    if (stateIds.has(state.id)) throw new SceneContractError(`${label} diagram contains duplicate state ids`);
    stateIds.add(state.id);
    requireNonEmpty(state.label, `${label} diagram state ${state.id} label`);
    validateSource(state.source, `${label} diagram state ${state.id} source`);
    if (state.focusNodeId !== undefined && state.focusGroupId !== undefined) {
      throw new SceneContractError(`${label} diagram state ${state.id} may focus one node or one group, not both`);
    }
    const validateStateIds = (ids: readonly string[] | undefined, knownIds: ReadonlySet<string>, kind: string): void => {
      if (ids === undefined) return;
      if (new Set(ids).size !== ids.length) throw new SceneContractError(`${label} diagram state ${state.id} contains duplicate active ${kind} ids`);
      for (const id of ids) if (!knownIds.has(id)) throw new SceneContractError(`${label} diagram state ${state.id} references an unknown ${kind}`);
    };
    validateStateIds(state.activeNodeIds, nodeIdSet, "node");
    validateStateIds(state.activeEdgeIds, edgeIdSet, "edge");
    validateStateIds(state.activeGroupIds, groupIds, "group");
    validateStateIds(state.contextGroupIds, groupIds, "context group");
    validateStateIds(state.activeMessageIds, messageIds, "message");
    const boundRoles = new Set<string>();
    for (const binding of state.participantBindings ?? []) {
      if (!roleIds.has(binding.roleId)) throw new SceneContractError(`${label} diagram state ${state.id} binding references an unknown participant role`);
      if (boundRoles.has(binding.roleId)) throw new SceneContractError(`${label} diagram state ${state.id} contains duplicate participant role bindings`);
      boundRoles.add(binding.roleId); requireNonEmpty(binding.participantId, `${label} diagram state ${state.id} participant id`); requireNonEmpty(binding.label, `${label} diagram state ${state.id} participant label`); validateSource(binding.source, `${label} diagram state ${state.id} participant binding`);
    }
    if (state.focusNodeId !== undefined && !nodeIdSet.has(state.focusNodeId)) {
      throw new SceneContractError(`${label} diagram state ${state.id} focusNodeId references an unknown node`);
    }
    if (state.focusGroupId !== undefined && !groupIds.has(state.focusGroupId)) {
      throw new SceneContractError(`${label} diagram state ${state.id} focusGroupId references an unknown group`);
    }
    for (const annotation of state.sharedEdgeAnnotations) {
      requireNonEmpty(annotation.id, `${label} shared edge annotation id`);
      if (annotationIds.has(annotation.id)) throw new SceneContractError(`${label} diagram contains duplicate shared edge annotation ids`);
      annotationIds.add(annotation.id);
      requireNonEmpty(annotation.label, `${label} shared edge annotation ${annotation.id} label`);
      validateSource(annotation.source, `${label} shared edge annotation ${annotation.id} source`);
      if (annotation.edgeIds.length < 2 || new Set(annotation.edgeIds).size !== annotation.edgeIds.length) {
        throw new SceneContractError(`${label} shared edge annotation ${annotation.id} must identify at least two unique edges`);
      }
      for (const edgeId of annotation.edgeIds) {
        if (!edgeIdSet.has(edgeId)) throw new SceneContractError(`${label} shared edge annotation ${annotation.id} references an unknown edge`);
      }
    }
  }

  if (block.focusNodeId !== undefined) {
    requireNonEmpty(block.focusNodeId, `${label} diagram focusNodeId`);
    if (!nodeIdSet.has(block.focusNodeId)) throw new SceneContractError(`${label} diagram focusNodeId references an unknown node`);
  }
}

function validateChart(block: ChartBlock, label: string): void {
  requireNonEmpty(block.label, `${label} chart label`);
  requireNonEmpty(block.description, `${label} chart description`);
  requireNonEmpty(block.xAxis.label, `${label} chart x-axis label`);
  requireNonEmpty(block.yAxis.label, `${label} chart y-axis label`);
  if (block.xAxis.unit !== undefined) requireNonEmpty(block.xAxis.unit, `${label} chart x-axis unit`);
  if (block.yAxis.unit !== undefined) requireNonEmpty(block.yAxis.unit, `${label} chart y-axis unit`);
  if (block.chartType === "regression") {
    try { validateRegressionChart(block); } catch (error) { throw new SceneContractError(String(error)); }
    return;
  }
  if (block.chartType === "timeline") {
    if (!block.xAxis.unit || !block.categories.length || !block.scenarios.length || block.liveUpdate !== undefined) throw new SceneContractError("Timeline requires units, categories and scenarios, without live jitter");
    const ids = new Set<string>();
    const identity = (item: {id: string; label: string; source: readonly SourceReference[]}) => {
      requireNonEmpty(item.id, "Timeline id"); requireNonEmpty(item.label, "Timeline label"); validateSource(item.source, "Timeline source");
      if (ids.has(item.id)) throw new SceneContractError("Duplicate timeline identity"); ids.add(item.id);
    };
    block.categories.forEach(identity);
    const categories = new Set(block.categories.map(c => c.id));
    for (const scenario of block.scenarios) {
      identity(scenario);
      if (!scenario.lanes.length) throw new SceneContractError("Timeline scenario requires lanes");
      for (const lane of scenario.lanes) {
        identity(lane);
        if (!lane.intervals.length) throw new SceneContractError("Timeline lane requires intervals");
        let previousEnd = -Infinity;
        for (const interval of lane.intervals) {
          identity(interval);
          if (interval.showRunLabel !== undefined && typeof interval.showRunLabel !== "boolean") throw new SceneContractError("Timeline run-label selection must be boolean");
          if (!categories.has(interval.categoryId) || !Number.isFinite(interval.start) || !Number.isFinite(interval.end)
            || interval.start < 0 || interval.end <= interval.start || interval.start < previousEnd) throw new SceneContractError("Timeline intervals require known categories, ordered finite bounds and no lane overlap");
          previousEnd = interval.end;
        }
      }
    }
    return;
  }
  if(block.chartType==="histogram"||block.chartType==="histogram2d"){
    try{validateHistogram(block);}catch(error){throw new SceneContractError(String(error));}return;
  }
  if (block.chartType === "observations") {
    try { validateObservationExplorer(block); } catch (error) { throw new SceneContractError(String(error)); }
    return;
  }
  if (block.chartType === "box") {
    if(block.showObservations!==undefined&&typeof block.showObservations!=="boolean")throw new SceneContractError("Box-plot observation display must be boolean");
    if(block.liveUpdate!==undefined)throw new SceneContractError("Box plots do not support live jitter");
    if (block.quantileMethod!=="type7" || !block.yAxis.unit || !block.groups.length || !Number.isFinite(block.fenceMultiplier)) throw new SceneContractError("Box plots require type7, units, groups and a finite fence multiplier");
    if(block.groups.some(g=>g.x!==undefined||g.summary!==undefined||g.interval!==undefined))throw new SceneContractError("Box plots require unmodified categorical observation groups");
    // Reuse the ordinary categorical-observation provenance contract.
    validateChart({...block,chartType:"dot"},label);
    try { for(const group of block.groups)boxPlotSummary(group.data.map(d=>d.value),block.fenceMultiplier); }
    catch(error){throw new SceneContractError(String(error));}
    return;
  }
  if (block.liveUpdate !== undefined) {
    if (!Number.isInteger(block.liveUpdate.intervalMs) || block.liveUpdate.intervalMs < 250) {
      throw new SceneContractError(`${label} live chart interval must be an integer >= 250 ms`);
    }
    if (!Number.isFinite(block.liveUpdate.jitterAmplitude) || block.liveUpdate.jitterAmplitude <= 0) {
      throw new SceneContractError(`${label} live chart jitter amplitude must be finite and positive`);
    }
    if (!Number.isInteger(block.liveUpdate.decimalPlaces) || block.liveUpdate.decimalPlaces < 0 || block.liveUpdate.decimalPlaces > 6) {
      throw new SceneContractError(`${label} live chart decimal places must be an integer from 0 to 6`);
    }
  }

  if (block.chartType === "bar") {
    if (block.data.length === 0) throw new SceneContractError(`${label} bar chart must contain at least one datum`);
    const ids = new Set<string>();
    for (const datum of block.data) {
      requireNonEmpty(datum.id, `${label} bar datum id`);
      if (ids.has(datum.id)) throw new SceneContractError(`${label} bar chart contains duplicate datum ids`);
      ids.add(datum.id);
      requireNonEmpty(datum.category, `${label} bar datum ${datum.id} category`);
      if (datum.group !== undefined) requireNonEmpty(datum.group, `${label} bar datum ${datum.id} group`);
      if (!Number.isFinite(datum.value)) throw new SceneContractError(`${label} bar datum ${datum.id} value must be finite`);
      validateSource(datum.source, `${label} bar datum ${datum.id} source`);
    }
    const groupedDatumCount = block.data.filter((datum) => datum.group !== undefined).length;
    if (groupedDatumCount !== 0 && groupedDatumCount !== block.data.length) {
      throw new SceneContractError(`${label} grouped bar chart must assign a group to every datum`);
    }
    const annotationIds = new Set<string>();
    for (const annotation of block.annotations ?? []) {
      requireNonEmpty(annotation.id, `${label} annotation id`);
      if (annotationIds.has(annotation.id)) throw new SceneContractError(`${label} contains duplicate annotation ids`);
      annotationIds.add(annotation.id);
      requireNonEmpty(annotation.label, `${label} annotation ${annotation.id} label`);
      validateSource(annotation.source, `${label} annotation ${annotation.id} source`);
      if (annotation.kind !== "point") throw new SceneContractError(`${label} bar annotation ${annotation.id} must be a point annotation`);
      if (!ids.has(annotation.datumId)) {
        throw new SceneContractError(`${label} point annotation ${annotation.id} references an unknown datum`);
      }
    }
    return;
  }

  if (block.chartType === "dot") {
    if (block.showSummaryValues !== undefined && typeof block.showSummaryValues !== "boolean") throw new SceneContractError("showSummaryValues must be boolean");
    const steps = [...new Set(block.groups.map(g => g.disclosureStep ?? 1))].sort((a,b) => a-b);
    if (steps.some((step,i) => step !== i+1)) throw new SceneContractError("Dot group reveal stages must be contiguous and start at one");
    if (block.xScale !== undefined && block.xScale !== "linear") throw new SceneContractError(`${label} invalid dot x-scale`);
    for (const size of [block.markerRadius, block.summaryRadius]) {
      if (size !== undefined && (!Number.isFinite(size) || size <= 0 || size > 20)) throw new SceneContractError(`${label} invalid marker radius`);
    }
    if (block.drawStems !== undefined && typeof block.drawStems !== "boolean") throw new SceneContractError("drawStems must be boolean");
    if (block.drawStems && (!block.referenceLine || block.xScale || block.groups.some(g => g.summary || g.data.some(d => !d.label)))) throw new SceneContractError("Categorical stems require a reference and an authored category label for every observation, without group summary markers");
    if (block.markerOpacity !== undefined && (!Number.isFinite(block.markerOpacity) || block.markerOpacity <= 0 || block.markerOpacity > 1)) throw new SceneContractError(`${label} invalid marker opacity`);
    if (block.yMinimum !== undefined && !Number.isFinite(block.yMinimum)) throw new SceneContractError(`${label} invalid y minimum`);
    const requireVisible = (value: number) => {
      if (!Number.isFinite(value) || (block.yMinimum !== undefined && value < block.yMinimum)) throw new SceneContractError(`${label} value below y minimum or nonfinite`);
    };
    if (!block.yAxis.unit) throw new SceneContractError(`${label} dot plot requires a numeric axis unit`);
    if (!block.groups.length) throw new SceneContractError(`${label} dot plot requires groups`);
    const groupIds = new Set<string>();
    for (const group of block.groups) {
      if (group.disclosureStep !== undefined && (!Number.isInteger(group.disclosureStep) || group.disclosureStep < 1)) throw new SceneContractError("Dot group disclosure step must be positive integer");
      requireNonEmpty(group.id, `${label} group id`);
      if (groupIds.has(group.id)) throw new SceneContractError(`${label} duplicate group id`);
      groupIds.add(group.id);
      requireNonEmpty(group.label, `${label} group label`);
      validateSource(group.source, `${label} group source`);
      if(group.interval){
        if (group.interval.role !== undefined && !["coverage", "descriptive-error"].includes(group.interval.role)) throw new SceneContractError("Unknown interval role");
        const i=group.interval;requireNonEmpty(i.id,`${label} interval id`);requireNonEmpty(i.label,`${label} interval label`);validateSource(i.source,`${label} interval source`);requireVisible(i.lower);requireVisible(i.upper);
        if(i.lower>i.upper||block.xScale||block.drawStems)throw new SceneContractError("Intervals require ordered bounds on categorical groups");
      }
      if (block.xScale === "linear" && !Number.isFinite(group.x)) throw new SceneContractError(`${label} numeric dot group requires x`);
      if (group.summary) {
        requireNonEmpty(group.summary.id, `${label} summary id`);
        requireNonEmpty(group.summary.label, `${label} summary label`);
        validateSource(group.summary.source, `${label} summary source`);
        requireVisible(group.summary.value);
      }
      if (!group.data.length) throw new SceneContractError(`${label} dot group requires observations`);
      const ids = new Set<string>();
      for (const datum of group.data) {
        requireNonEmpty(datum.id, `${label} dot datum id`);
        if (ids.has(datum.id)) throw new SceneContractError(`${label} duplicate dot datum id`);
        ids.add(datum.id);
        if (!Number.isFinite(datum.value)) throw new SceneContractError(`${label} dot value must be finite`);
        requireVisible(datum.value);
        validateSource(datum.source, `${label} dot datum source`);
      }
    }
    if (block.referenceLine) {
      requireNonEmpty(block.referenceLine.id, `${label} reference id`);
      requireNonEmpty(block.referenceLine.label, `${label} reference label`);
      if (!Number.isFinite(block.referenceLine.value)) throw new SceneContractError(`${label} reference value must be finite`);
      requireVisible(block.referenceLine.value);
      validateSource(block.referenceLine.source, `${label} reference source`);
    }
    for (const curve of block.curves ?? []) {
      if (block.xScale !== "linear") throw new SceneContractError(`${label} curve requires numeric x-scale`);
      requireNonEmpty(curve.id, `${label} curve id`);
      requireNonEmpty(curve.label, `${label} curve label`);
      validateSource(curve.source, `${label} curve source`);
      if (curve.data.length < 2) throw new SceneContractError(`${label} curve needs two points`);
      let previous = -Infinity;
      for (const datum of curve.data) {
        if (!Number.isFinite(datum.x) || datum.x <= previous) throw new SceneContractError(`${label} curve x must increase`);
        previous = datum.x;
        requireVisible(datum.y);
        validateSource(datum.source, `${label} curve point source`);
      }
    }
    return;
  }
  if (block.chartType !== "line") throw new SceneContractError(`${label} chart type must be bar, line or dot`);
  if (block.yMinimum !== undefined && (!Number.isFinite(block.yMinimum) || block.series.some(s => s.data.some(d => d.y < block.yMinimum!)))) throw new SceneContractError("Line-chart lower bound must be finite and must not clip data");
  if (block.series.length === 0) throw new SceneContractError(`${label} line chart must contain at least one series`);

  const seriesIds = new Set<string>();
  const datumBySeries = new Map<string, Map<string, LineChartDatum>>();
  for (const series of block.series) {
    requireNonEmpty(series.id, `${label} line series id`);
    if (seriesIds.has(series.id)) throw new SceneContractError(`${label} line chart contains duplicate series ids`);
    seriesIds.add(series.id);
    requireNonEmpty(series.label, `${label} line series ${series.id} label`);
    validateSource(series.source, `${label} line series ${series.id} source`);
    if (series.data.length < 2) throw new SceneContractError(`${label} line series ${series.id} must contain at least two points`);

    const datumIds = new Set<string>();
    const datumMap = new Map<string, LineChartDatum>();
    let previousX: number | undefined;
    for (const datum of series.data) {
      requireNonEmpty(datum.id, `${label} line datum id`);
      if (datumIds.has(datum.id)) throw new SceneContractError(`${label} line series ${series.id} contains duplicate datum ids`);
      datumIds.add(datum.id);
      if (!Number.isFinite(datum.x) || !Number.isFinite(datum.y)) {
        throw new SceneContractError(`${label} line datum ${datum.id} coordinates must be finite`);
      }
      if (previousX !== undefined && datum.x <= previousX) {
        throw new SceneContractError(`${label} line series ${series.id} x values must be strictly increasing`);
      }
      previousX = datum.x;
      validateSource(datum.source, `${label} line datum ${datum.id} source`);
      datumMap.set(datum.id, datum);
    }
    datumBySeries.set(series.id, datumMap);
  }

  const annotationIds = new Set<string>();
  for (const annotation of block.annotations ?? []) {
    requireNonEmpty(annotation.id, `${label} annotation id`);
    if (annotationIds.has(annotation.id)) throw new SceneContractError(`${label} contains duplicate annotation ids`);
    annotationIds.add(annotation.id);
    requireNonEmpty(annotation.label, `${label} annotation ${annotation.id} label`);
    validateSource(annotation.source, `${label} annotation ${annotation.id} source`);
    const series = datumBySeries.get(annotation.seriesId);
    if (!series) throw new SceneContractError(`${label} annotation ${annotation.id} references an unknown series`);
    if (annotation.kind === "point") {
      if (annotation.media && (!/^\/[A-Za-z0-9_./-]+$/.test(annotation.media.uri) || annotation.media.uri.includes("..") || typeof annotation.media.alternativeText !== "string" || !annotation.media.alternativeText.trim())) {
        throw new SceneContractError("Annotation media requires a local asset and alternative text");
      }
      if (annotation.media?.darkUri !== undefined && (!/^\/[A-Za-z0-9_./-]+$/.test(annotation.media.darkUri) || annotation.media.darkUri.includes(".."))) throw new SceneContractError("Annotation dark media must be a local asset");
      if (annotation.focusSeries !== undefined && typeof annotation.focusSeries !== "boolean") {
        throw new SceneContractError(`${label} point annotation focusSeries must be boolean`);
      }
      if (!series.has(annotation.datumId)) {
        throw new SceneContractError(`${label} point annotation ${annotation.id} references an unknown datum`);
      }
      continue;
    }
    const startDatum = series.get(annotation.startDatumId);
    const endDatum = series.get(annotation.endDatumId);
    if (!startDatum || !endDatum) {
      throw new SceneContractError(`${label} range annotation ${annotation.id} references an unknown datum`);
    }
    if (startDatum.x > endDatum.x) {
      throw new SceneContractError(`${label} range annotation ${annotation.id} must progress from lower to higher x`);
    }
  }
}

function validateBlocks(blocks: readonly SceneBlock[], label: string, declaredVersion: SceneDocumentVersion): void {
  // 1.8 is additive to 1.7; retain the declared version through nested groups.
  const version = declaredVersion === SCENE_DOCUMENT_OBSERVATION_VERSION || declaredVersion === SCENE_DOCUMENT_BOX_PLOT_VERSION || declaredVersion === SCENE_DOCUMENT_HISTOGRAM_VERSION || declaredVersion===SCENE_DOCUMENT_EXPLORATION_VERSION || declaredVersion===SCENE_DOCUMENT_MOMENT_VERSION || declaredVersion===SCENE_DOCUMENT_TIMELINE_VERSION || declaredVersion===SCENE_DOCUMENT_REGRESSION_VERSION ? SCENE_DOCUMENT_DERIVATION_VERSION : declaredVersion;
  const ids = blocks.map((block) => block.id);
  if (new Set(ids).size !== ids.length) throw new SceneContractError(`${label} contains duplicate block ids`);
  validateDisclosureOrders(blocks, label);

  for (const block of blocks) {
    requireNonEmpty(block.id, `${label} block id`);
    validateSource(block.source, `${label} block ${block.id} source`);
    if (block.disclosure && (!Number.isInteger(block.disclosure.order) || block.disclosure.order < 0)) {
      throw new SceneContractError(`${label} block ${block.id} disclosure order must be a non-negative integer`);
    }
    if (block.disclosure?.step !== undefined) {
      if (!Number.isInteger(block.disclosure.step) || block.disclosure.step < 1) {
        throw new SceneContractError(`${label} block ${block.id} disclosure step must be a positive integer`);
      }
      if (block.disclosure.mode !== "progressive") {
        throw new SceneContractError(`${label} block ${block.id} disclosure step requires progressive mode`);
      }
      if (block.disclosure.triggerResourceId === undefined) {
        throw new SceneContractError(`${label} block ${block.id} progressive disclosure step requires triggerResourceId`);
      }
    }
    if (block.disclosure?.triggerResourceId !== undefined) {
      requireNonEmpty(block.disclosure.triggerResourceId, `${label} block ${block.id} disclosure triggerResourceId`);
    }
    if (block.kind === "group") {
      validateBlocks(block.children, `${label} group ${block.id}`, declaredVersion);
      validateOrderedIds(block.readingOrder, block.children.map((child) => child.id), `${label} group ${block.id} readingOrder`);
    }
    if (block.kind === "list") {
      if (block.listStyle !== "unordered" && block.listStyle !== "ordered") {
        throw new SceneContractError(`${label} list ${block.id} listStyle must be ordered or unordered`);
      }
      validateListItems(block.items, `${label} list ${block.id}`);
    }
    if (block.kind === "definition-list") {
      if (version !== SCENE_DOCUMENT_DEFINITION_LIST_VERSION && version !== SCENE_DOCUMENT_TABLE_VERSION && version !== SCENE_DOCUMENT_DOT_PLOT_VERSION && version !== SCENE_DOCUMENT_DERIVATION_VERSION) {
        throw new SceneContractError(`${label} block ${block.id} definition list requires SceneDocument ${SCENE_DOCUMENT_DEFINITION_LIST_VERSION} or newer`);
      }
      validateDefinitionListEntries(block.entries, `${label} definition list ${block.id}`);
    }
    if (block.kind === "table") {
      if (version !== SCENE_DOCUMENT_TABLE_VERSION && version !== SCENE_DOCUMENT_DOT_PLOT_VERSION && version !== SCENE_DOCUMENT_DERIVATION_VERSION) {
        throw new SceneContractError(`${label} block ${block.id} table requires SceneDocument ${SCENE_DOCUMENT_TABLE_VERSION}`);
      }
      validateTable(block, `${label} table ${block.id}`);
    }
    if (block.kind === "math") {
      if (block.label !== undefined) requireNonEmpty(block.label, "math label");
      requireNonEmpty(block.spokenText, `${label} math ${block.id} spokenText`);
      if (block.derivation) {
        if (version !== SCENE_DOCUMENT_DERIVATION_VERSION) throw new SceneContractError("Semantic derivations require SceneDocument 1.7");
        validateMathematicalDerivation(block.derivation);
        if (block.expression !== block.derivation.steps[0]!.from.expression) throw new SceneContractError("Derivation input must match its MathBlock expression");
      }
      if (block.derivationDetails !== undefined) {
        if (version !== SCENE_DOCUMENT_DERIVATION_VERSION || !block.derivationDetails.length) throw new SceneContractError("Derivation details require nonempty SceneDocument 1.7 content");
        for (const detail of block.derivationDetails) validateMathematicalDerivationDetail(detail);
      }
    }
    if (block.kind === "code") {
      requireNonEmpty(block.language, `${label} code ${block.id} language`);
      requireNonEmpty(block.code, `${label} code ${block.id} code`);
      requireNonEmpty(block.fallback, `${label} code ${block.id} fallback`);
    }
    if (block.kind === "media-reference") {
      requireNonEmpty(block.alternativeText, `${label} media ${block.id} alternativeText`);
      const rectangle = (r: {x: number; y: number; width: number; height: number}) =>
        [r.x, r.y, r.width, r.height].every(Number.isFinite) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= 1 && r.y + r.height <= 1;
      if (block.crop && !rectangle(block.crop)) throw new SceneContractError("Invalid normalized media crop");
      if (block.redactions?.length && (!block.crop || !block.mediaType?.startsWith("video/"))) throw new SceneContractError("Redactions require cropped video");
      for (const region of block.redactions ?? []) {
        if (!rectangle(region) || !Number.isFinite(region.start) || !Number.isFinite(region.end) || region.start < 0 || region.end <= region.start) throw new SceneContractError("Invalid media redaction");
        requireNonEmpty(region.label, "Media redaction label");
      }
    }
    if (block.kind === "prompt") {
      requireNonEmpty(block.fallback, `${label} prompt ${block.id} fallback`);
      if (block.options !== undefined) {
        if (block.options.length < 2) throw new SceneContractError(`${label} prompt ${block.id} requires at least two options`);
        for (const option of block.options) requireNonEmpty(option, `${label} prompt ${block.id} option`);
      }
      if (block.optionIds !== undefined) {
        if (block.options === undefined || block.optionIds.length !== block.options.length) {
          throw new SceneContractError(`${label} prompt ${block.id} optionIds must match options`);
        }
        if (new Set(block.optionIds).size !== block.optionIds.length) {
          throw new SceneContractError(`${label} prompt ${block.id} optionIds must be unique`);
        }
        for (const optionId of block.optionIds) requireNonEmpty(optionId, `${label} prompt ${block.id} option id`);
      }
      if (block.correctOptionId !== undefined) {
        requireNonEmpty(block.correctOptionId, `${label} prompt ${block.id} correctOptionId`);
        if (block.responseMode !== "single-choice" || block.optionIds === undefined || !block.optionIds.includes(block.correctOptionId)) {
          throw new SceneContractError(`${label} prompt ${block.id} correctOptionId must identify an authored single-choice option`);
        }
      }
      if (block.expectedResult !== undefined) {
        requireNonEmpty(block.expectedResult, `${label} prompt ${block.id} expectedResult`);
      }
    }
    if (block.kind === "diagram") {
       if (version !== SCENE_DOCUMENT_FLOW_VERSION && version !== SCENE_DOCUMENT_CHART_VERSION && version !== SCENE_DOCUMENT_SEQUENCE_VERSION && version !== SCENE_DOCUMENT_DEFINITION_LIST_VERSION && version !== SCENE_DOCUMENT_TABLE_VERSION && version !== SCENE_DOCUMENT_DOT_PLOT_VERSION && version !== SCENE_DOCUMENT_DERIVATION_VERSION) {
        throw new SceneContractError(`${label} block ${block.id} diagram requires SceneDocument ${SCENE_DOCUMENT_FLOW_VERSION} or newer`);
      }
      if (block.diagramType === "sequence" && version !== SCENE_DOCUMENT_SEQUENCE_VERSION && version !== SCENE_DOCUMENT_DEFINITION_LIST_VERSION && version !== SCENE_DOCUMENT_TABLE_VERSION && version !== SCENE_DOCUMENT_DOT_PLOT_VERSION && version !== SCENE_DOCUMENT_DERIVATION_VERSION) {
        throw new SceneContractError(`${label} block ${block.id} sequence diagram requires SceneDocument ${SCENE_DOCUMENT_SEQUENCE_VERSION}`);
      }
      if (block.diagramType !== "sequence" && (block.participantRoles !== undefined || block.messages !== undefined)) {
        throw new SceneContractError(`${label} block ${block.id} only sequence diagrams may define participant roles or messages`);
      }
       if (block.states !== undefined && version !== SCENE_DOCUMENT_CHART_VERSION && version !== SCENE_DOCUMENT_SEQUENCE_VERSION && version !== SCENE_DOCUMENT_DEFINITION_LIST_VERSION && version !== SCENE_DOCUMENT_TABLE_VERSION && version !== SCENE_DOCUMENT_DOT_PLOT_VERSION && version !== SCENE_DOCUMENT_DERIVATION_VERSION) {
        throw new SceneContractError(`${label} block ${block.id} diagram states require SceneDocument ${SCENE_DOCUMENT_CHART_VERSION}`);
      }
      if (block.diagramType !== "sequence" && block.states?.some((state) => state.activeMessageIds !== undefined || state.participantBindings !== undefined)) {
        throw new SceneContractError(`${label} block ${block.id} only sequence diagrams may define active messages or participant bindings`);
      }
      validateDiagram(block, `${label} block ${block.id}`);
    }
    if (block.kind === "chart") {
      const exploration=declaredVersion===SCENE_DOCUMENT_EXPLORATION_VERSION||declaredVersion===SCENE_DOCUMENT_MOMENT_VERSION||declaredVersion===SCENE_DOCUMENT_TIMELINE_VERSION||declaredVersion===SCENE_DOCUMENT_REGRESSION_VERSION;
      if(block.chartType==="regression"&&declaredVersion!==SCENE_DOCUMENT_REGRESSION_VERSION)throw new SceneContractError("Regression charts require SceneDocument 1.14");
      if(block.chartType==="timeline"&&declaredVersion!==SCENE_DOCUMENT_TIMELINE_VERSION&&declaredVersion!==SCENE_DOCUMENT_REGRESSION_VERSION)throw new SceneContractError("Timelines require SceneDocument 1.13");
      if(block.chartType==="observations"&&block.view==="moments"&&declaredVersion!==SCENE_DOCUMENT_MOMENT_VERSION&&declaredVersion!==SCENE_DOCUMENT_TIMELINE_VERSION&&declaredVersion!==SCENE_DOCUMENT_REGRESSION_VERSION)throw new SceneContractError("Moment views require SceneDocument 1.12");
      if(!exploration&&((block.chartType==="histogram"&&block.binAdjustment)||(block.chartType==="dot"&&block.groups.some(g=>g.interval))||(block.chartType==="observations"&&(block.compact!==undefined||block.interactive!==undefined||block.view==="ecdf"&&block.series.length>1))))throw new SceneContractError("Exploration options require SceneDocument 1.11");
      if ((block.chartType==="histogram"||block.chartType==="histogram2d")&&declaredVersion!==SCENE_DOCUMENT_HISTOGRAM_VERSION&&!exploration)throw new SceneContractError("Histograms require SceneDocument 1.10");
      if (block.chartType === "box" && declaredVersion !== SCENE_DOCUMENT_BOX_PLOT_VERSION && declaredVersion!==SCENE_DOCUMENT_HISTOGRAM_VERSION&&!exploration) throw new SceneContractError("Box plots require SceneDocument 1.9");
      if (block.chartType === "observations" && declaredVersion !== SCENE_DOCUMENT_OBSERVATION_VERSION && declaredVersion !== SCENE_DOCUMENT_BOX_PLOT_VERSION && declaredVersion!==SCENE_DOCUMENT_HISTOGRAM_VERSION&&!exploration) throw new SceneContractError("Observation explorers require SceneDocument 1.8");
        if (version !== SCENE_DOCUMENT_CHART_VERSION && version !== SCENE_DOCUMENT_SEQUENCE_VERSION && version !== SCENE_DOCUMENT_DEFINITION_LIST_VERSION && version !== SCENE_DOCUMENT_TABLE_VERSION && version !== SCENE_DOCUMENT_DOT_PLOT_VERSION && version !== SCENE_DOCUMENT_DERIVATION_VERSION) {
        throw new SceneContractError(`${label} block ${block.id} chart requires SceneDocument ${SCENE_DOCUMENT_CHART_VERSION}`);
      }
      if (block.chartType === "dot" && version !== SCENE_DOCUMENT_DOT_PLOT_VERSION && version !== SCENE_DOCUMENT_DERIVATION_VERSION) {
        throw new SceneContractError(`${label} dot plot requires SceneDocument ${SCENE_DOCUMENT_DOT_PLOT_VERSION}`);
      }
      validateChart(block, `${label} block ${block.id}`);
    }
  }
}

export function validateSceneDocument(document: SceneDocument): void {
  if (
    document.version !== SCENE_DOCUMENT_VERSION
    && document.version !== SCENE_DOCUMENT_FLOW_VERSION
    && document.version !== SCENE_DOCUMENT_CHART_VERSION
    && document.version !== SCENE_DOCUMENT_SEQUENCE_VERSION
    && document.version !== SCENE_DOCUMENT_DEFINITION_LIST_VERSION
    && document.version !== SCENE_DOCUMENT_TABLE_VERSION
    && document.version !== SCENE_DOCUMENT_DOT_PLOT_VERSION
    && document.version !== SCENE_DOCUMENT_DERIVATION_VERSION
    && document.version !== SCENE_DOCUMENT_OBSERVATION_VERSION
    && document.version !== SCENE_DOCUMENT_BOX_PLOT_VERSION
    && document.version !== SCENE_DOCUMENT_HISTOGRAM_VERSION
    && document.version !== SCENE_DOCUMENT_EXPLORATION_VERSION
    && document.version !== SCENE_DOCUMENT_MOMENT_VERSION
    && document.version !== SCENE_DOCUMENT_TIMELINE_VERSION
    && document.version !== SCENE_DOCUMENT_REGRESSION_VERSION
  ) {
    throw new SceneContractError(`Unsupported scene document version: ${document.version}`);
  }
  requireNonEmpty(document.id, "SceneDocument id");
  requireNonEmpty(document.sourcePathId, "SceneDocument sourcePathId");

  const sceneIds = document.scenes.map((scene) => scene.id);
  if (new Set(sceneIds).size !== sceneIds.length) throw new SceneContractError("SceneDocument contains duplicate scene ids");

  for (const scene of document.scenes) {
    if (scene.presentationTitle !== undefined) validatePresentationTitle(scene.presentationTitle);
    if (scene.narration !== undefined && (typeof scene.narration !== "string" || !scene.narration.trim())) throw new SceneContractError("Scene narration must be non-empty authored text");
    requireNonEmpty(scene.id, "Scene id");
    validateSource(scene.source, `Scene ${scene.id} source`);
    validateBlocks(scene.blocks, `Scene ${scene.id}`, document.version);
    validateOrderedIds(scene.readingOrder, scene.blocks.map((block) => block.id), `Scene ${scene.id} readingOrder`);
  }
}
