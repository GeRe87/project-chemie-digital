import type {
  KnowledgeNetworkDocument,
  KnowledgeNetworkEdge,
  KnowledgeNetworkGroup,
  KnowledgeNetworkNode,
  DiagramBlock,
  SourceReference,
} from "../../core/src/index.ts";
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { flowPixelPath, wrapFlowText } from "./flow-layout.ts";

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
  readonly classification: "selected" | "related";
  readonly accessibleName: string;
  readonly nonColorMarker: "double-ring" | "dashed";
  readonly focusable: boolean;
}

export interface D3RenderEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly predicateId: string;
  readonly label: string;
  readonly directed: true;
  readonly accessibleName: string;
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
  focusFirstNode(preferredNodeId?: string): void;
  destroy(): void;
}

export interface D3RuntimePort {
  mount(host: unknown, model: D3KnowledgeNetworkRenderModel): D3RuntimeMount;
}

export interface D3KnowledgeNetworkComponent {
  readonly model: D3KnowledgeNetworkRenderModel;
  readonly staticFallback: string;
  focusNode(nodeId?: string): void;
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
  const rawClassification = (node as { classification?: unknown }).classification;
  const classification = rawClassification === "selected" ? "selected" : "related";
  return {
    id: node.id,
    semanticEntityId: node.semanticEntityId,
    label: node.label,
    semanticTypes: [...node.semanticTypes].sort(compareCanonical),
    groupIds: [...(node.groupIds ?? [])].sort(compareCanonical),
    source: copySources(node.source),
    readingIndex,
    classification,
    accessibleName: `${node.label}, ${classification === "selected" ? "selected in current scene" : "related resource"}`,
    nonColorMarker: classification === "selected" ? "double-ring" : "dashed",
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
    directed: true,
    accessibleName: `${edge.sourceNodeId} ${edge.label} ${edge.targetNodeId}`,
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

interface RuntimeNode extends SimulationNodeDatum {
  readonly id: string;
  readonly label: string;
  readonly classification: "selected" | "related";
  readonly nonColorMarker: "double-ring" | "dashed";
  x: number;
  y: number;
}

interface RuntimeEdge extends SimulationLinkDatum<RuntimeNode> {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly label: string;
  source: RuntimeNode;
  target: RuntimeNode;
}

function ensureHostElement(host: unknown): HTMLElement {
  if (!(host instanceof HTMLElement)) throw new Error("D3 host must be an HTMLElement");
  return host;
}

function initialNodePositions(nodes: readonly D3RenderNode[]): Map<string, { x: number; y: number }> {
  const count = Math.max(nodes.length, 1);
  const positions = new Map<string, { x: number; y: number }>();
  const radius = 190;
  const centerX = 320;
  const centerY = 230;
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const angle = (Math.PI * 2 * index) / count;
    positions.set(node.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }
  return positions;
}

function setGroupPosition(group: SVGGElement, x: number, y: number): void {
  group.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
}

function lineAttributes(line: SVGLineElement, x1: number, y1: number, x2: number, y2: number): void {
  line.setAttribute("x1", x1.toFixed(2));
  line.setAttribute("y1", y1.toFixed(2));
  line.setAttribute("x2", x2.toFixed(2));
  line.setAttribute("y2", y2.toFixed(2));
}

function midpoint(source: RuntimeNode, target: RuntimeNode): { x: number; y: number } {
  return {
    x: source.x + (target.x - source.x) / 2,
    y: source.y + (target.y - source.y) / 2,
  };
}

function staticModeEnabled(model: D3KnowledgeNetworkRenderModel): boolean {
  return model.reducedMotion || model.interactionPolicy === "static";
}

export function createSvgD3Runtime(): D3RuntimePort {
  return {
    mount(host, model): D3RuntimeMount {
      const hostElement = ensureHostElement(host);
      const svgNamespace = "http://www.w3.org/2000/svg";
      hostElement.innerHTML = "";
      const wrapper = document.createElement("section");
      wrapper.className = "d3-graph-runtime";
      const figure = document.createElement("figure");
      figure.className = "d3-graph-figure";
      const caption = document.createElement("figcaption");
      caption.className = "d3-graph-caption";
      caption.textContent = model.accessibility.description;
      const svg = document.createElementNS(svgNamespace, "svg");
      svg.setAttribute("class", "d3-graph-svg");
      svg.setAttribute("viewBox", "0 0 640 460");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", model.accessibility.label);
      svg.setAttribute("tabindex", "-1");
      const defs = document.createElementNS(svgNamespace, "defs");
      const markerId = `marker-${encodeURIComponent(model.sourceDocumentId)}`;
      const marker = document.createElementNS(svgNamespace, "marker");
      marker.setAttribute("id", markerId);
      marker.setAttribute("viewBox", "0 0 10 10");
      marker.setAttribute("refX", "8");
      marker.setAttribute("refY", "5");
      marker.setAttribute("markerWidth", "6");
      marker.setAttribute("markerHeight", "6");
      marker.setAttribute("orient", "auto");
      const markerPath = document.createElementNS(svgNamespace, "path");
      markerPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
      markerPath.setAttribute("class", "d3-edge-arrow");
      marker.append(markerPath);
      defs.append(marker);
      svg.append(defs);

      const edgeLayer = document.createElementNS(svgNamespace, "g");
      edgeLayer.setAttribute("class", "d3-edge-layer");
      const edgeLabelLayer = document.createElementNS(svgNamespace, "g");
      edgeLabelLayer.setAttribute("class", "d3-edge-label-layer");
      const nodeLayer = document.createElementNS(svgNamespace, "g");
      nodeLayer.setAttribute("class", "d3-node-layer");
      svg.append(edgeLayer, edgeLabelLayer, nodeLayer);
      figure.append(svg, caption);
      wrapper.append(figure);
      hostElement.append(wrapper);

      const positions = initialNodePositions(model.nodes);
      const runtimeNodes: RuntimeNode[] = model.nodes.map((node) => {
        const position = positions.get(node.id)!;
        return {
          id: node.id,
          label: node.label,
          classification: node.classification,
          nonColorMarker: node.nonColorMarker,
          x: position.x,
          y: position.y,
        };
      });
      const runtimeNodeById = new Map(runtimeNodes.map((node) => [node.id, node]));
      const runtimeEdges: RuntimeEdge[] = model.edges.map((edge) => {
        const source = runtimeNodeById.get(edge.sourceNodeId);
        const target = runtimeNodeById.get(edge.targetNodeId);
        if (!source || !target) throw new Error(`Unknown node in edge ${edge.id}`);
        return {
          id: edge.id,
          sourceNodeId: edge.sourceNodeId,
          targetNodeId: edge.targetNodeId,
          label: edge.label,
          source,
          target,
        };
      });

      const nodeElementById = new Map<string, SVGGElement>();
      const edgeElementById = new Map<string, { line: SVGLineElement; label: SVGTextElement }>();

      for (const edge of runtimeEdges) {
        const line = document.createElementNS(svgNamespace, "line");
        line.setAttribute("class", "d3-edge");
        line.setAttribute("data-edge-id", edge.id);
        line.setAttribute("data-source-node-id", edge.sourceNodeId);
        line.setAttribute("data-target-node-id", edge.targetNodeId);
        line.setAttribute("marker-end", `url(#${markerId})`);
        line.setAttribute("aria-label", `${edge.sourceNodeId} ${edge.label} ${edge.targetNodeId}`);
        const label = document.createElementNS(svgNamespace, "text");
        label.setAttribute("class", "d3-edge-label");
        label.setAttribute("data-edge-label-id", edge.id);
        label.textContent = edge.label;
        edgeLayer.append(line);
        edgeLabelLayer.append(label);
        edgeElementById.set(edge.id, { line, label });
      }

      for (const node of runtimeNodes) {
        const group = document.createElementNS(svgNamespace, "g");
        group.setAttribute("class", `d3-node d3-node-${node.classification}`);
        group.setAttribute("data-node-id", node.id);
        group.setAttribute("tabindex", "0");
        group.setAttribute("role", "button");
        group.setAttribute("aria-label", `${node.label}, ${node.classification === "selected" ? "selected in current scene" : "related resource"}`);
        const shape = document.createElementNS(svgNamespace, "rect");
        shape.setAttribute("x", "-52");
        shape.setAttribute("y", "-20");
        shape.setAttribute("width", "104");
        shape.setAttribute("height", "40");
        shape.setAttribute("rx", node.classification === "selected" ? "20" : "6");
        shape.setAttribute("class", `d3-node-shape d3-node-shape-${node.classification}`);
        group.append(shape);
        if (node.nonColorMarker === "double-ring") {
          const ring = document.createElementNS(svgNamespace, "rect");
          ring.setAttribute("x", "-58");
          ring.setAttribute("y", "-26");
          ring.setAttribute("width", "116");
          ring.setAttribute("height", "52");
          ring.setAttribute("rx", "24");
          ring.setAttribute("class", "d3-node-ring");
          group.append(ring);
        }
        const text = document.createElementNS(svgNamespace, "text");
        text.setAttribute("class", "d3-node-label");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.textContent = node.label;
        group.append(text);
        nodeLayer.append(group);
        nodeElementById.set(node.id, group);
      }

      const zoomState = { scale: 1, x: 0, y: 0 };
      const applyTransform = (): void => {
        const transform = `translate(${zoomState.x.toFixed(2)} ${zoomState.y.toFixed(2)}) scale(${zoomState.scale.toFixed(3)})`;
        edgeLayer.setAttribute("transform", transform);
        edgeLabelLayer.setAttribute("transform", transform);
        nodeLayer.setAttribute("transform", transform);
      };
      applyTransform();

      const renderFrame = (): void => {
        for (const node of runtimeNodes) {
          setGroupPosition(nodeElementById.get(node.id)!, node.x, node.y);
        }
        for (const edge of runtimeEdges) {
          const ref = edgeElementById.get(edge.id)!;
          lineAttributes(ref.line, edge.source.x, edge.source.y, edge.target.x, edge.target.y);
          const center = midpoint(edge.source, edge.target);
          ref.label.setAttribute("x", center.x.toFixed(2));
          ref.label.setAttribute("y", center.y.toFixed(2));
        }
      };
      renderFrame();

      let simulation: Simulation<RuntimeNode, RuntimeEdge> | null = null;
      if (!staticModeEnabled(model) && runtimeNodes.length > 1) {
        simulation = forceSimulation(runtimeNodes)
          .force("charge", forceManyBody().strength(-290))
          .force("link", forceLink(runtimeEdges).id((value) => (value as RuntimeNode).id).distance(150).strength(0.85))
          .force("center", forceCenter(320, 230))
          .alpha(0.8)
          .on("tick", renderFrame);
      }

      const onWheel = (event: WheelEvent): void => {
        event.preventDefault();
        const direction = event.deltaY < 0 ? 1.08 : 0.92;
        zoomState.scale = Math.max(0.55, Math.min(1.9, zoomState.scale * direction));
        applyTransform();
      };
      svg.addEventListener("wheel", onWheel, { passive: false });

      const onNodeFocus = (event: FocusEvent): void => {
        const element = event.currentTarget;
        if (!(element instanceof SVGGElement)) return;
        for (const candidate of nodeElementById.values()) {
          candidate.classList.toggle("d3-node-active", candidate === element);
        }
      };
      for (const element of nodeElementById.values()) element.addEventListener("focus", onNodeFocus);

      const resizeObserver = typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver((entries) => {
          const width = entries[0]?.contentRect.width ?? 640;
          const height = entries[0]?.contentRect.height ?? 460;
          svg.setAttribute("viewBox", `0 0 ${Math.max(640, Math.round(width))} ${Math.max(460, Math.round(height))}`);
        });
      resizeObserver?.observe(hostElement);

      let destroyed = false;
      const destroy = (): void => {
        if (destroyed) return;
        destroyed = true;
        simulation?.stop();
        simulation = null;
        svg.removeEventListener("wheel", onWheel);
        for (const element of nodeElementById.values()) element.removeEventListener("focus", onNodeFocus);
        resizeObserver?.disconnect();
        wrapper.remove();
      };

      const focusNode = (nodeId: string): void => {
        if (destroyed) return;
        const node = nodeElementById.get(nodeId);
        node?.focus();
      };

      return {
        focusNode,
        focusFirstNode(preferredNodeId) {
          if (destroyed) return;
          if (preferredNodeId && nodeElementById.has(preferredNodeId)) {
            focusNode(preferredNodeId);
            return;
          }
          const first = model.nodeReadingOrder.find((id) => nodeElementById.has(id));
          if (first) focusNode(first);
        },
        destroy,
      };
    },
  };
}

export function mountD3KnowledgeNetwork(
  host: unknown,
  document: KnowledgeNetworkDocument,
  options: D3KnowledgeNetworkOptions,
  runtime: D3RuntimePort = createSvgD3Runtime(),
): D3KnowledgeNetworkComponent | D3RenderModelResult {
  let result = createD3KnowledgeNetworkRenderModel(document, options);
  if (!result.model) return result;
  let model = result.model;
  let mounted = runtime.mount(host, model);
  const selectedNodeId = model.nodes.find((node) => node.classification === "selected")?.id ?? null;
  let focusIndex = selectedNodeId ? model.nodes.findIndex((node) => node.id === selectedNodeId) : (model.nodes.length > 0 ? 0 : -1);
  let destroyed = false;

  if (focusIndex >= 0) mounted.focusFirstNode(model.nodes[focusIndex]?.id);

  return {
    get model() { return model; },
    get staticFallback() { return model.accessibility.staticFallback; },
    focusNode(nodeId?: string): void {
      if (destroyed) return;
      if (nodeId) mounted.focusFirstNode(nodeId);
      else mounted.focusFirstNode();
    },
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
      const nextSelected = model.nodes.find((node) => node.classification === "selected")?.id ?? null;
      focusIndex = nextSelected ? model.nodes.findIndex((node) => node.id === nextSelected) : (model.nodes.length > 0 ? 0 : -1);
      if (focusIndex >= 0) mounted.focusFirstNode(model.nodes[focusIndex]?.id);
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

export interface D3FlowRenderNode {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly emphasis?: "normal" | "supporting" | "primary";
  readonly readingIndex: number;
}

export interface D3FlowRenderEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly readingIndex: number;
}

export interface D3FlowRenderModel {
  readonly version: "1.0";
  readonly sourceBlockId: string;
  readonly label: string;
  readonly description: string;
  readonly nodes: readonly D3FlowRenderNode[];
  readonly edges: readonly D3FlowRenderEdge[];
  readonly nodeReadingOrder: readonly string[];
  readonly edgeReadingOrder: readonly string[];
  readonly staticFallback: string;
  readonly reducedMotion: boolean;
  readonly interactionPolicy: D3KnowledgeNetworkOptions["interactionPolicy"];
}

export interface D3FlowRenderModelResult {
  readonly model?: D3FlowRenderModel;
  readonly diagnostics: readonly D3AdapterDiagnostic[];
}

export interface D3FlowComponent {
  readonly model: D3FlowRenderModel;
  readonly staticFallback: string;
  focusNode(nodeId?: string): void;
  handleKey(key: string): boolean;
  destroy(): void;
}

function flowStaticFallback(block: DiagramBlock): string {
  const labels = new Map(block.nodes.map((node) => [node.id, node.label]));
  return [
    block.description,
    "Nodes:",
    ...block.nodes.map((node) => `- ${node.label}`),
    "Relations:",
    ...block.edges.map((edge) => `- ${labels.get(edge.sourceNodeId) ?? edge.sourceNodeId} — ${edge.label} → ${labels.get(edge.targetNodeId) ?? edge.targetNodeId}`),
  ].join("\n");
}

export function createD3FlowRenderModel(block: DiagramBlock, options: D3KnowledgeNetworkOptions): D3FlowRenderModelResult {
  try {
    if (block.diagramType !== "flow") throw new Error(`Unsupported diagram type ${block.diagramType}`);
    if (block.nodes.length < 2) throw new Error("Flow diagram requires at least two nodes");
    const nodeIds = new Set(block.nodes.map((node) => node.id));
    const edgeIds = new Set(block.edges.map((edge) => edge.id));
    if (nodeIds.size !== block.nodes.length) throw new Error("Flow diagram node ids must be unique");
    if (edgeIds.size !== block.edges.length) throw new Error("Flow diagram edge ids must be unique");
    for (const edge of block.edges) {
      if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) throw new Error(`Flow edge ${edge.id} references an unknown node`);
    }
    const nodes = block.nodes.map((node, index) => ({
      id: node.id,
      label: node.label,
      source: node.source.map((source) => ({ ...source, ...(source.provenanceIds ? { provenanceIds: [...source.provenanceIds] } : {}) })),
      ...(node.emphasis ? { emphasis: node.emphasis } : {}),
      readingIndex: index,
    }));
    const edges = block.edges.map((edge, index) => ({
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      label: edge.label,
      source: edge.source.map((source) => ({ ...source, ...(source.provenanceIds ? { provenanceIds: [...source.provenanceIds] } : {}) })),
      readingIndex: index,
    }));
    const model: D3FlowRenderModel = {
      version: "1.0",
      sourceBlockId: block.id,
      label: block.label,
      description: block.description,
      nodes,
      edges,
      nodeReadingOrder: nodes.map((node) => node.id),
      edgeReadingOrder: edges.map((edge) => edge.id),
      staticFallback: flowStaticFallback(block),
      reducedMotion: options.reducedMotion,
      interactionPolicy: options.interactionPolicy,
    };
    return { model, diagnostics: [] };
  } catch (error) {
    return diagnostic("INVALID_KNOWLEDGE_NETWORK_DOCUMENT", error instanceof Error ? error.message : "Invalid flow diagram");
  }
}

export function mountD3FlowDiagram(host: unknown, model: D3FlowRenderModel): D3FlowComponent {
  if (!(host instanceof HTMLElement)) throw new Error("D3 flow host must be an HTMLElement");
  const svgNamespace = "http://www.w3.org/2000/svg";
  host.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "d3-flow-runtime";
  const figure = document.createElement("figure");
  figure.className = "d3-flow-figure";
  const caption = document.createElement("figcaption");
  caption.className = "d3-flow-caption";
  caption.textContent = model.description;
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.classList.add("d3-flow-svg");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", model.label);
  figure.append(svg, caption);
  wrapper.append(figure);
  host.append(wrapper);

  const nodeElements = new Map<string, SVGGElement>();
  const element = <K extends keyof SVGElementTagNameMap>(parent: SVGElement, tag: K, className: string, attributes: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
    const child = document.createElementNS(svgNamespace, tag);
    child.setAttribute("class", className);
    for (const [key, value] of Object.entries(attributes)) child.setAttribute(key, String(value));
    parent.append(child);
    return child;
  };
  const pixel = (parent: SVGElement, className: string, x: number, y: number, width: number, height: number, step = 4) =>
    element(parent, "path", className, { d: flowPixelPath(x, y, width, height, step) });
  let destroyed = false;
  let compact: boolean | undefined;
  let activeNodeId: string | undefined;
  const render = (force = false): void => {
    if (destroyed) return;
    // Limit the host's layout width by the viewport, including scaled presentation hosts.
    const nextCompact = Math.min(host.clientWidth || window.innerWidth, window.innerWidth) < 900;
    if (!force && compact === nextCompact) return;
    compact = nextCompact;
    const focusedId = (document.activeElement as Element | null)?.getAttribute("data-node-id");
    svg.replaceChildren();
    nodeElements.clear();
    svg.dataset.orientation = compact ? "vertical" : "horizontal";

    // Measure outside the slide: inactive Reveal slides can be display:none.
    const ruler = document.createElementNS(svgNamespace, "svg");
    ruler.classList.add("d3-flow-svg");
    ruler.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;visibility:hidden";
    ruler.setAttribute("aria-hidden", "true");
    document.body.append(ruler);
    const probe = element(ruler, "text", "d3-flow-node-label");
    const measure = (value: string): number => {
      probe.textContent = value;
      const bounds = probe.getBBox();
      return Math.max(probe.getComputedTextLength(), bounds.width + Math.abs(bounds.x));
    };
    const grid = (value: number) => Math.ceil(value / 4) * 4;
    const nodeWidth = grid(Math.max(320, Math.min(384, Math.max(...model.nodes.map((node) => measure(node.label))) + 112)));
    const nodeLines = model.nodes.map((node) => wrapFlowText(node.label, nodeWidth - 112, measure));
    const nodeHeight = grid(Math.max(132, ...nodeLines.map((lines) => lines.length * 32 + 80)));
    probe.setAttribute("class", "d3-flow-edge-label");
    const edgeLabels = model.edges.map((edge) => {
      const lines = wrapFlowText(edge.label, nodeWidth - 48, measure);
      return { lines, width: grid(Math.max(216, ...lines.map((line) => measure(line) + 48))), height: grid(Math.max(64, lines.length * 32 + 24)) };
    });
    const labelHeight = Math.max(64, ...edgeLabels.map((label) => label.height));
    const gap = 44;
    const nodeTop = 140 + labelHeight + 80;
    const rowGap = labelHeight + 64;
    const width = compact ? nodeWidth + 64 : 64 + model.nodes.length * nodeWidth + (model.nodes.length - 1) * gap;
    const height = compact ? 64 + model.nodes.length * nodeHeight + (model.nodes.length - 1) * rowGap : nodeTop + nodeHeight + 180;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.aspectRatio = `${width} / ${height}`;
    const desc = element(svg, "desc", "");
    desc.textContent = model.staticFallback;
    element(svg, "rect", "d3-flow-backdrop", { width, height });
    const decoration = element(svg, "g", "d3-flow-decoration", { "aria-hidden": "true" });
    if (!compact) {
      for (const [x, y] of [[32, 32], [width - 160, 48], [32, height - 100]]) {
        for (let col = 0; col < 6; col++) for (let row = 0; row < 3; row++) {
          element(decoration, "rect", "d3-flow-confetti", { x: x + col * 22, y: y + row * 22, width: 10, height: 10 });
        }
      }
      for (const [x, y] of [[220, 72], [width - 220, height - 76]]) {
        element(decoration, "path", "d3-flow-spark", { d: `M ${x} ${y - 20} h 8 v 16 h 16 v 8 h -16 v 16 h -8 v -16 h -16 v -8 h 16 Z` });
      }
      element(decoration, "rect", "d3-flow-confetti", { x: width * 0.18, y: height - 56, width: width * 0.64, height: 12 });
    }
    const positions = new Map(model.nodes.map((node, index) => [node.id, {
      x: compact ? 32 : 32 + index * (nodeWidth + gap),
      y: compact ? 32 + index * (nodeHeight + rowGap) : nodeTop,
    }]));
    const edgeLayer = element(svg, "g", "d3-flow-edge-layer");
    const nodeLayer = element(svg, "g", "d3-flow-node-layer");
    const text = (parent: SVGElement, className: string, lines: string[], x: number, y: number): SVGTextElement => {
      const label = element(parent, "text", className, { "text-anchor": "middle", "dominant-baseline": "alphabetic" });
      lines.forEach((line, index) => {
        const span = element(label, "tspan", "", { x, y: index * 32 });
        span.textContent = line;
      });
      // Center the actual ink box, including ascenders/descenders, not a guessed baseline.
      const measured = label.cloneNode(true) as SVGTextElement;
      ruler.append(measured);
      const bounds = measured.getBBox();
      measured.remove();
      label.setAttribute("transform", `translate(${x - (bounds.x + bounds.width / 2)} ${y - (bounds.y + bounds.height / 2)})`);
      return label;
    };
    for (const [index, edge] of model.edges.entries()) {
      const source = positions.get(edge.sourceNodeId)!;
      const target = positions.get(edge.targetNodeId)!;
      const { lines, width: labelWidth, height: pillHeight } = edgeLabels[index]!;
      const forward = compact ? target.y > source.y : target.x > source.x;
      const x1 = compact ? source.x + nodeWidth / 2 : source.x + (forward ? nodeWidth : 0);
      const y1 = compact ? source.y + (forward ? nodeHeight : 0) : source.y + nodeHeight / 2;
      const x2 = compact ? target.x + nodeWidth / 2 : target.x + (forward ? 0 : nodeWidth);
      const y2 = compact ? target.y + (forward ? 0 : nodeHeight) : target.y + nodeHeight / 2;
      const group = element(edgeLayer, "g", "d3-flow-edge", {
        "data-edge-id": edge.id, "aria-label": edge.label,
        "data-resource-id": edge.source.map((source) => source.resourceId).join(" "),
        "data-provenance-ids": edge.source.flatMap((source) => source.provenanceIds ?? []).join(" "),
      });
      element(group, "rect", "d3-flow-connector", {
        x: compact ? x1 - 10 : Math.min(x1, x2), y: compact ? Math.min(y1, y2) : y1 - 10,
        width: compact ? 20 : Math.abs(x2 - x1), height: compact ? Math.abs(y2 - y1) : 20,
      });
      const cx = (x1 + x2) / 2;
      const cy = compact ? (y1 + y2) / 2 : 140 + labelHeight / 2;
      if (!compact) {
        element(group, "line", "d3-flow-label-stem", { x1: cx, y1: cy + pillHeight / 2 + 12, x2: cx, y2: nodeTop - 12 });
        pixel(group, "d3-flow-connector", cx - 10, y1 - 14, 20, 28, 2);
        element(group, "rect", "d3-flow-connector-glint", { x: cx - 4, y: y1 - 8, width: 8, height: 8 });
      }
      const labelGroup = element(group, "g", "d3-flow-edge-label-group", { transform: `translate(${cx - labelWidth / 2} ${cy - pillHeight / 2})` });
      pixel(labelGroup, "d3-flow-shadow", 0, 12, labelWidth, pillHeight);
      pixel(labelGroup, "d3-flow-edge-label-backdrop", 0, 0, labelWidth, pillHeight);
      pixel(labelGroup, "d3-flow-edge-label-inset", 6, 6, labelWidth - 12, pillHeight - 14, 3);
      text(labelGroup, "d3-flow-edge-label", lines, labelWidth / 2, pillHeight / 2);
      // Small directional chevrons keep the authored edge direction explicit.
      element(group, "path", "d3-flow-edge-arrow", { d: compact
        ? `M ${x2 - 6} ${y2 - (forward ? 12 : -12)} l 6 ${forward ? 6 : -6} l 6 ${forward ? -6 : 6}`
        : `M ${x2 - (forward ? 12 : -12)} ${y2 - 6} l ${forward ? 6 : -6} 6 l ${forward ? -6 : 6} 6` });
    }
    for (const [index, node] of model.nodes.entries()) {
      const position = positions.get(node.id)!;
      const group = element(nodeLayer, "g", `d3-flow-node d3-flow-node-${node.emphasis ?? "normal"}`, {
        "data-node-id": node.id, role: "group", "aria-label": node.label,
        "data-resource-id": node.source.map((source) => source.resourceId).join(" "),
        "data-provenance-ids": node.source.flatMap((source) => source.provenanceIds ?? []).join(" "),
        transform: `translate(${position.x} ${position.y})`,
        ...(model.interactionPolicy === "keyboard" ? { tabindex: 0 } : {}),
      });
      pixel(group, "d3-flow-shadow d3-flow-shadow-far", 0, 24, nodeWidth, nodeHeight);
      pixel(group, "d3-flow-shadow", 0, 12, nodeWidth, nodeHeight);
      pixel(group, "d3-flow-node-outline", 0, 0, nodeWidth, nodeHeight);
      pixel(group, "d3-flow-node-bevel", 4, 4, nodeWidth - 8, nodeHeight - 12);
      pixel(group, "d3-flow-node-shape", 12, 16, nodeWidth - 24, nodeHeight - 32, 3);
      element(group, "path", "d3-flow-node-index-panel", { d: `M 24 20 H 76 V ${nodeHeight - 20} H 24 V ${nodeHeight - 24} H 20 V 24 H 24 Z` });
      element(group, "line", "d3-flow-node-divider", { x1: 76, y1: 20, x2: 76, y2: nodeHeight - 20 });
      element(group, "path", "d3-flow-node-glint", { d: `M 28 20 H ${nodeWidth - 28} M 16 32 V ${nodeHeight - 32}` });
      text(group, "d3-flow-node-step", [String(node.readingIndex + 1).padStart(2, "0")], 48, 50);
      text(group, "d3-flow-node-label", nodeLines[index]!, 88 + (nodeWidth - 112) / 2, nodeHeight / 2 + 16);
      pixel(group, "d3-flow-node-status", nodeWidth - 40, 28, 16, 20, 2);
      element(group, "rect", "d3-flow-connector-glint", { x: nodeWidth - 36, y: 30, width: 6, height: 6 });
      group.classList.toggle("d3-flow-node-active", activeNodeId === node.id);
      nodeElements.set(node.id, group);
    }
    ruler.remove();
    if (focusedId) nodeElements.get(focusedId)?.focus({ preventScroll: true });
  };
  render();
  let resizeFrame = 0;
  const onResize = (): void => {
    cancelAnimationFrame(resizeFrame);
    // Coalesce host resize and presentation relayout notifications.
    resizeFrame = requestAnimationFrame(() => render());
  };
  const observer = new ResizeObserver(onResize);
  observer.observe(host);
  window.addEventListener("resize", onResize);
  const onFontsLoaded = (): void => render(true);
  void document.fonts.ready.then(onFontsLoaded);
  document.fonts.addEventListener("loadingdone", onFontsLoaded);
  const focusNode = (nodeId?: string): void => {
    activeNodeId = nodeId;
    for (const [id, element] of nodeElements) element.classList.toggle("d3-flow-node-active", id === nodeId);
    if (nodeId) nodeElements.get(nodeId)?.focus();
  };
  let focusIndex = 0;
  const onKeyDown = (event: KeyboardEvent): void => {
    if (model.interactionPolicy !== "keyboard") return;
    if (event.key !== "ArrowRight" && event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const focusedId = document.activeElement?.getAttribute("data-node-id");
    const currentIndex = model.nodes.findIndex((node) => node.id === focusedId);
    if (currentIndex >= 0) focusIndex = currentIndex;
    focusIndex = event.key === "ArrowRight" || event.key === "ArrowDown"
      ? (focusIndex + 1) % model.nodes.length
      : (focusIndex - 1 + model.nodes.length) % model.nodes.length;
    focusNode(model.nodes[focusIndex]?.id);
  };
  svg.addEventListener("keydown", onKeyDown);
  return {
    model,
    staticFallback: model.staticFallback,
    focusNode,
    handleKey(key) {
      if (destroyed || model.interactionPolicy !== "keyboard") return false;
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(key)) return false;
      onKeyDown(new KeyboardEvent("keydown", { key }));
      return true;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      document.fonts.removeEventListener("loadingdone", onFontsLoaded);
      svg.removeEventListener("keydown", onKeyDown);
      wrapper.remove();
    },
  };
}
