export const SCENE_DOCUMENT_VERSION = "1.0" as const;
export const SCENE_DOCUMENT_FLOW_VERSION = "1.1" as const;

export type SceneDocumentVersion = typeof SCENE_DOCUMENT_VERSION | typeof SCENE_DOCUMENT_FLOW_VERSION;

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
  readonly diagramType: "flow";
  readonly label: string;
  readonly description: string;
  readonly nodes: readonly DiagramNode[];
  readonly edges: readonly DiagramEdge[];
  readonly focusNodeId?: string;
}

export type SceneBlock = ProseBlock | MathBlock | CodeBlock | MediaReferenceBlock | ListBlock | GroupBlock | PromptBlock | DiagramBlock;

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
  if (block.diagramType !== "flow") throw new SceneContractError(`${label} diagram type must be flow`);
  if (block.nodes.length < 2) throw new SceneContractError(`${label} diagram must contain at least two nodes`);
  if (block.edges.length < 1) throw new SceneContractError(`${label} diagram must contain at least one edge`);

  const nodeIds = block.nodes.map((node) => node.id);
  const nodeIdSet = new Set(nodeIds);
  if (nodeIdSet.size !== nodeIds.length) throw new SceneContractError(`${label} diagram contains duplicate node ids`);
  for (const node of block.nodes) {
    requireNonEmpty(node.id, `${label} diagram node id`);
    requireNonEmpty(node.label, `${label} diagram node ${node.id} label`);
    validateSource(node.source, `${label} diagram node ${node.id} source`);
  }

  const edgeIds = block.edges.map((edge) => edge.id);
  if (new Set(edgeIds).size !== edgeIds.length) throw new SceneContractError(`${label} diagram contains duplicate edge ids`);
  for (const edge of block.edges) {
    requireNonEmpty(edge.id, `${label} diagram edge id`);
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
      if (version !== SCENE_DOCUMENT_FLOW_VERSION) {
        throw new SceneContractError(`${label} block ${block.id} diagram requires SceneDocument ${SCENE_DOCUMENT_FLOW_VERSION}`);
      }
      validateDiagram(block, `${label} block ${block.id}`);
    }
  }
}

export function validateSceneDocument(document: SceneDocument): void {
  if (document.version !== SCENE_DOCUMENT_VERSION && document.version !== SCENE_DOCUMENT_FLOW_VERSION) {
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
