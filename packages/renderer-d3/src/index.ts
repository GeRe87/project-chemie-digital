import type {
  KnowledgeNetworkDocument,
  KnowledgeNetworkEdge,
  KnowledgeNetworkGroup,
  KnowledgeNetworkNode,
  SourceReference,
} from "../../core/src/index.ts";

export interface D3KnowledgeNetworkOptions {
  readonly reducedMotion: boolean;
  readonly interactionPolicy: "keyboard" | "static";
}

export type D3AdapterDiagnosticCode =
  | "UNSUPPORTED_KNOWLEDGE_NETWORK_VERSION"
  | "INVALID_KNOWLEDGE_NETWORK_DOCUMENT"
  | "INVALID_ADAPTER_OPTIONS"
  | "D3_RENDER_MODEL_CONTRACT_VIOLATION";

export interface D3AdapterDiagnostic {
  readonly code: D3AdapterDiagnosticCode;
  readonly message: string;
}

export interface D3RenderNode {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly label: string;
  readonly semanticTypes: readonly string[];
  readonly groupIds: readonly string[];
  readonly source: readonly SourceReference[];
  readonly readingIndex: number;
  readonly focusable: boolean;
}

export interface D3RenderEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly predicateId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly readingIndex: number;
}

export interface D3RenderGroup {
  readonly id: string;
  readonly label: string;
  readonly memberNodeIds: readonly string[];
}

export interface D3KnowledgeNetworkRenderModel {
  readonly version: "1.0";
  readonly sourceDocumentId: string;
  readonly reducedMotion: boolean;
  readonly interactionPolicy: D3KnowledgeNetworkOptions["interactionPolicy"];
  readonly nodes: readonly D3RenderNode[];
  readonly edges: readonly D3RenderEdge[];
  readonly groups: readonly D3RenderGroup[];
  readonly nodeReadingOrder: readonly string[];
  readonly edgeReadingOrder: readonly string[];
  readonly accessibility: {
    readonly label: string;
    readonly description: string;
    readonly staticFallback: string;
  };
}

export interface D3RenderModelResult {
  readonly model?: D3KnowledgeNetworkRenderModel;
  readonly diagnostics: readonly D3AdapterDiagnostic[];
}

export interface D3RuntimeMount {
  focusNode(nodeId: string): void;
  destroy(): void;
}

export interface D3RuntimePort {
  mount(host: unknown, model: D3KnowledgeNetworkRenderModel): D3RuntimeMount;
}

export interface D3KnowledgeNetworkComponent {
  readonly model: D3KnowledgeNetworkRenderModel;
  readonly staticFallback: string;
  handleKey(key: string): boolean;
  render(document: KnowledgeNetworkDocument): D3RenderModelResult;
  destroy(): void;
}

function compareCanonical(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function copySources(values: readonly SourceReference[]): readonly SourceReference[] {
  return values.map((value) => ({
    resourceId: value.resourceId,
    ...(value.provenanceIds ? { provenanceIds: [...value.provenanceIds].sort(compareCanonical) } : {}),
  }));
}

function diagnostic(code: D3AdapterDiagnosticCode, message: string): D3RenderModelResult {
  return { diagnostics: [{ code, message }] };
}

function validateOptions(options: D3KnowledgeNetworkOptions): void {
  if (typeof options.reducedMotion !== "boolean") throw new Error("reducedMotion must be boolean");
  if (options.interactionPolicy !== "keyboard" && options.interactionPolicy !== "static") {
    throw new Error("interactionPolicy must be keyboard or static");
  }
}

function validateDocument(document: KnowledgeNetworkDocument): void {
  if ((document as { version?: unknown }).version !== "1.0") throw new Error("unsupported version");
  const nodeIds = document.nodes.map((node) => node.id);
  const edgeIds = document.edges.map((edge) => edge.id);
  if (new Set(nodeIds).size !== nodeIds.length) throw new Error("duplicate node ids");
  if (new Set(edgeIds).size !== edgeIds.length) throw new Error("duplicate edge ids");
  const nodeSet = new Set(nodeIds);
  for (const edge of document.edges) {
    if (!nodeSet.has(edge.sourceNodeId) || !nodeSet.has(edge.targetNodeId)) throw new Error("edge references unknown node");
  }
  if (document.accessibility.nodeReadingOrder.length !== nodeIds.length) throw new Error("invalid node reading order");
  if (document.accessibility.edgeReadingOrder.length !== edgeIds.length) throw new Error("invalid edge reading order");
  if (document.accessibility.nodeReadingOrder.some((id) => !nodeSet.has(id))) throw new Error("unknown node in reading order");
  if (document.accessibility.edgeReadingOrder.some((id) => !new Set(edgeIds).has(id))) throw new Error("unknown edge in reading order");
  if (document.accessibility.staticFallback.length === 0) throw new Error("static fallback is required");
}

function mapNode(node: KnowledgeNetworkNode, readingIndex: number, focusable: boolean): D3RenderNode {
  return {
    id: node.id,
    semanticEntityId: node.semanticEntityId,
    label: node.label,
    semanticTypes: [...node.semanticTypes].sort(compareCanonical),
    groupIds: [...(node.groupIds ?? [])].sort(compareCanonical),
    source: copySources(node.source),
    readingIndex,
    focusable,
  };
}

function mapEdge(edge: KnowledgeNetworkEdge, readingIndex: number): D3RenderEdge {
  return {
    id: edge.id,
    sourceNodeId: edge.sourceNodeId,
    targetNodeId: edge.targetNodeId,
    predicateId: edge.predicateId,
    label: edge.label,
    source: copySources(edge.source),
    readingIndex,
  };
}

function mapGroup(group: KnowledgeNetworkGroup): D3RenderGroup {
  return { id: group.id, label: group.label, memberNodeIds: [...group.memberNodeIds].sort(compareCanonical) };
}

export function createD3KnowledgeNetworkRenderModel(
  document: KnowledgeNetworkDocument,
  options: D3KnowledgeNetworkOptions,
): D3RenderModelResult {
  if ((document as { version?: unknown }).version !== "1.0") {
    return diagnostic("UNSUPPORTED_KNOWLEDGE_NETWORK_VERSION", `Unsupported KnowledgeNetworkDocument version: ${String((document as { version?: unknown }).version)}`);
  }
  try {
    validateOptions(options);
  } catch (error) {
    return diagnostic("INVALID_ADAPTER_OPTIONS", error instanceof Error ? error.message : "Invalid adapter options");
  }
  try {
    validateDocument(document);
    const nodeById = new Map(document.nodes.map((node) => [node.id, node]));
    const edgeById = new Map(document.edges.map((edge) => [edge.id, edge]));
    const focusable = options.interactionPolicy === "keyboard";
    const nodes = document.accessibility.nodeReadingOrder.map((id, index) => mapNode(nodeById.get(id)!, index, focusable));
    const edges = document.accessibility.edgeReadingOrder.map((id, index) => mapEdge(edgeById.get(id)!, index));
    const groups = [...(document.groups ?? [])].sort((a, b) => compareCanonical(a.id, b.id)).map(mapGroup);
    return {
      model: {
        version: "1.0",
        sourceDocumentId: document.id,
        reducedMotion: options.reducedMotion,
        interactionPolicy: options.interactionPolicy,
        nodes,
        edges,
        groups,
        nodeReadingOrder: nodes.map((node) => node.id),
        edgeReadingOrder: edges.map((edge) => edge.id),
        accessibility: {
          label: document.accessibility.label,
          description: document.accessibility.description,
          staticFallback: document.accessibility.staticFallback,
        },
      },
      diagnostics: [],
    };
  } catch (error) {
    return diagnostic("INVALID_KNOWLEDGE_NETWORK_DOCUMENT", error instanceof Error ? error.message : "Invalid KnowledgeNetworkDocument");
  }
}

export function canonicalSerializeD3RenderModel(model: D3KnowledgeNetworkRenderModel): string {
  return JSON.stringify(model);
}

export function mountD3KnowledgeNetwork(
  host: unknown,
  document: KnowledgeNetworkDocument,
  options: D3KnowledgeNetworkOptions,
  runtime: D3RuntimePort,
): D3KnowledgeNetworkComponent | D3RenderModelResult {
  let result = createD3KnowledgeNetworkRenderModel(document, options);
  if (!result.model) return result;
  let model = result.model;
  let mounted = runtime.mount(host, model);
  let focusIndex = model.nodes.length > 0 ? 0 : -1;
  let destroyed = false;

  return {
    get model() { return model; },
    get staticFallback() { return model.accessibility.staticFallback; },
    handleKey(key: string): boolean {
      if (destroyed || model.interactionPolicy !== "keyboard" || model.nodes.length === 0) return false;
      if (key !== "ArrowRight" && key !== "ArrowDown" && key !== "ArrowLeft" && key !== "ArrowUp" && key !== "Home" && key !== "End") return false;
      if (key === "Home") focusIndex = 0;
      else if (key === "End") focusIndex = model.nodes.length - 1;
      else if (key === "ArrowRight" || key === "ArrowDown") focusIndex = (focusIndex + 1) % model.nodes.length;
      else focusIndex = (focusIndex - 1 + model.nodes.length) % model.nodes.length;
      mounted.focusNode(model.nodes[focusIndex].id);
      return true;
    },
    render(nextDocument: KnowledgeNetworkDocument): D3RenderModelResult {
      if (destroyed) return diagnostic("D3_RENDER_MODEL_CONTRACT_VIOLATION", "Component is destroyed");
      const next = createD3KnowledgeNetworkRenderModel(nextDocument, options);
      if (!next.model) return next;
      mounted.destroy();
      model = next.model;
      mounted = runtime.mount(host, model);
      focusIndex = model.nodes.length > 0 ? 0 : -1;
      result = next;
      return next;
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      mounted.destroy();
    },
  };
}
