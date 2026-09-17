export const SCENE_DOCUMENT_VERSION = "1.0" as const;
export const SCENE_DOCUMENT_FLOW_VERSION = "1.1" as const;
export const SCENE_DOCUMENT_CHART_VERSION = "1.2" as const;

export type SceneDocumentVersion =
  | typeof SCENE_DOCUMENT_VERSION
  | typeof SCENE_DOCUMENT_FLOW_VERSION
  | typeof SCENE_DOCUMENT_CHART_VERSION;

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
  readonly kind: "math";
  readonly expression: string;
  readonly spokenText: string;
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
  readonly fallback: string;
}

export interface DiagramNode {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly emphasis?: "normal" | "supporting" | "primary";
  readonly visualRole?: string;
  readonly groupIds?: readonly string[];
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
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface DiagramBlock extends SceneBlockBase {
  readonly kind: "diagram";
  readonly diagramType: "flow" | "network";
  readonly label: string;
  readonly description: string;
  readonly nodes: readonly DiagramNode[];
  readonly groups?: readonly DiagramGroup[];
  readonly edges: readonly DiagramEdge[];
  readonly focusNodeId?: string;
}

export interface ChartAxis {
  readonly label: string;
  readonly unit?: string;
}

export interface BarChartDatum {
  readonly id: string;
  readonly category: string;
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

export interface LineChartPointAnnotation {
  readonly id: string;
  readonly kind: "point";
  readonly seriesId: string;
  readonly datumId: string;
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

export interface BarChartBlock extends SceneBlockBase {
  readonly kind: "chart";
  readonly chartType: "bar";
  readonly label: string;
  readonly description: string;
  readonly xAxis: ChartAxis;
  readonly yAxis: ChartAxis;
  readonly data: readonly BarChartDatum[];
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
}

export type ChartBlock = BarChartBlock | LineChartBlock;

export type SceneBlock =
  | ProseBlock
  | MathBlock
  | CodeBlock
  | MediaReferenceBlock
  | ListBlock
  | GroupBlock
  | PromptBlock
  | DiagramBlock
  | ChartBlock;

export interface Scene {
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

function validateDiagram(block: DiagramBlock, label: string): void {
  requireNonEmpty(block.label, `${label} diagram label`);
  requireNonEmpty(block.description, `${label} diagram description`);
  if (block.diagramType !== "flow" && block.diagramType !== "network") throw new SceneContractError(`${label} diagram type must be flow or network`);
  if (block.nodes.length < 2) throw new SceneContractError(`${label} diagram must contain at least two nodes`);
  if (block.edges.length < 1) throw new SceneContractError(`${label} diagram must contain at least one edge`);

  const nodeIdSet = new Set<string>();
  for (const node of block.nodes) {
    requireNonEmpty(node.id, `${label} diagram node id`);
    if (nodeIdSet.has(node.id)) throw new SceneContractError(`${label} diagram contains duplicate node ids`);
    nodeIdSet.add(node.id);
    requireNonEmpty(node.label, `${label} diagram node ${node.id} label`);
    if (node.visualRole !== undefined && !/^[a-z][a-z0-9-]*$/u.test(node.visualRole)) {
      throw new SceneContractError(`${label} diagram node ${node.id} visualRole must be a lowercase token`);
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
    requireNonEmpty(edge.id, `${label} diagram edge id`);
    if (edgeIdSet.has(edge.id)) throw new SceneContractError(`${label} diagram contains duplicate edge ids`);
    edgeIdSet.add(edge.id);
    requireNonEmpty(edge.label, `${label} diagram edge ${edge.id} label`);
    requireNonEmpty(edge.sourceNodeId, `${label} diagram edge ${edge.id} sourceNodeId`);
    requireNonEmpty(edge.targetNodeId, `${label} diagram edge ${edge.id} targetNodeId`);
    if (!nodeIdSet.has(edge.sourceNodeId) || !nodeIdSet.has(edge.targetNodeId)) {
      throw new SceneContractError(`${label} diagram edge ${edge.id} references an unknown node`);
    }
    validateSource(edge.source, `${label} diagram edge ${edge.id} source`);
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

  if (block.chartType === "bar") {
    if (block.data.length === 0) throw new SceneContractError(`${label} bar chart must contain at least one datum`);
    const ids = new Set<string>();
    for (const datum of block.data) {
      requireNonEmpty(datum.id, `${label} bar datum id`);
      if (ids.has(datum.id)) throw new SceneContractError(`${label} bar chart contains duplicate datum ids`);
      ids.add(datum.id);
      requireNonEmpty(datum.category, `${label} bar datum ${datum.id} category`);
      if (!Number.isFinite(datum.value)) throw new SceneContractError(`${label} bar datum ${datum.id} value must be finite`);
      validateSource(datum.source, `${label} bar datum ${datum.id} source`);
    }
    return;
  }

  if (block.chartType !== "line") throw new SceneContractError(`${label} chart type must be bar or line`);
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

function validateBlocks(blocks: readonly SceneBlock[], label: string, version: SceneDocumentVersion): void {
  const ids = blocks.map((block) => block.id);
  if (new Set(ids).size !== ids.length) throw new SceneContractError(`${label} contains duplicate block ids`);
  validateDisclosureOrders(blocks, label);

  for (const block of blocks) {
    requireNonEmpty(block.id, `${label} block id`);
    validateSource(block.source, `${label} block ${block.id} source`);
    if (block.disclosure && (!Number.isInteger(block.disclosure.order) || block.disclosure.order < 0)) {
      throw new SceneContractError(`${label} block ${block.id} disclosure order must be a non-negative integer`);
    }
    if (block.kind === "group") {
      validateBlocks(block.children, `${label} group ${block.id}`, version);
      validateOrderedIds(block.readingOrder, block.children.map((child) => child.id), `${label} group ${block.id} readingOrder`);
    }
    if (block.kind === "list") {
      if (block.listStyle !== "unordered" && block.listStyle !== "ordered") {
        throw new SceneContractError(`${label} list ${block.id} listStyle must be ordered or unordered`);
      }
      validateListItems(block.items, `${label} list ${block.id}`);
    }
    if (block.kind === "math") requireNonEmpty(block.spokenText, `${label} math ${block.id} spokenText`);
    if (block.kind === "code") {
      requireNonEmpty(block.language, `${label} code ${block.id} language`);
      requireNonEmpty(block.code, `${label} code ${block.id} code`);
      requireNonEmpty(block.fallback, `${label} code ${block.id} fallback`);
    }
    if (block.kind === "media-reference") requireNonEmpty(block.alternativeText, `${label} media ${block.id} alternativeText`);
    if (block.kind === "prompt") requireNonEmpty(block.fallback, `${label} prompt ${block.id} fallback`);
    if (block.kind === "diagram") {
      if (version !== SCENE_DOCUMENT_FLOW_VERSION && version !== SCENE_DOCUMENT_CHART_VERSION) {
        throw new SceneContractError(`${label} block ${block.id} diagram requires SceneDocument ${SCENE_DOCUMENT_FLOW_VERSION} or newer`);
      }
      validateDiagram(block, `${label} block ${block.id}`);
    }
    if (block.kind === "chart") {
      if (version !== SCENE_DOCUMENT_CHART_VERSION) {
        throw new SceneContractError(`${label} block ${block.id} chart requires SceneDocument ${SCENE_DOCUMENT_CHART_VERSION}`);
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
  ) {
    throw new SceneContractError(`Unsupported scene document version: ${document.version}`);
  }
  requireNonEmpty(document.id, "SceneDocument id");
  requireNonEmpty(document.sourcePathId, "SceneDocument sourcePathId");

  const sceneIds = document.scenes.map((scene) => scene.id);
  if (new Set(sceneIds).size !== sceneIds.length) throw new SceneContractError("SceneDocument contains duplicate scene ids");

  for (const scene of document.scenes) {
    requireNonEmpty(scene.id, "Scene id");
    validateSource(scene.source, `Scene ${scene.id} source`);
    validateBlocks(scene.blocks, `Scene ${scene.id}`, document.version);
    validateOrderedIds(scene.readingOrder, scene.blocks.map((block) => block.id), `Scene ${scene.id} readingOrder`);
  }
}
