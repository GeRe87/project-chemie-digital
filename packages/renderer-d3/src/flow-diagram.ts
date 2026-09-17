import type { DiagramBlock, SourceReference } from "../../core/src/index.ts";
import type { D3KnowledgeNetworkOptions } from "./index.ts";
import {
  createD3FlowLayout,
  deterministicFlowTextMeasure,
  wrapFlowText,
  type D3FlowLayout,
  type D3FlowLayoutEdge,
} from "./flow-layout.ts";

export type D3FlowOptions = D3KnowledgeNetworkOptions;

export type D3FlowDiagnosticCode =
  | "UNSUPPORTED_FLOW_DIAGRAM_TYPE"
  | "INVALID_FLOW_DIAGRAM"
  | "INVALID_FLOW_ADAPTER_OPTIONS";

export interface D3FlowDiagnostic {
  readonly code: D3FlowDiagnosticCode;
  readonly message: string;
}

export interface D3FlowRenderNode {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly emphasis?: "normal" | "supporting" | "primary";
  readonly visualRole?: string;
  readonly groupIds?: readonly string[];
  readonly readingIndex: number;
}

export interface D3FlowRenderGroup {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface D3FlowRenderEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly readingIndex: number;
  readonly visualRole?: string;
}

export interface D3FlowRenderModel {
  readonly version: "1.0";
  readonly diagramType: "flow" | "network";
  readonly sourceBlockId: string;
  readonly label: string;
  readonly description: string;
  readonly focusNodeId?: string;
  readonly nodes: readonly D3FlowRenderNode[];
  readonly groups: readonly D3FlowRenderGroup[];
  readonly edges: readonly D3FlowRenderEdge[];
  readonly states: readonly D3FlowRenderState[];
  readonly nodeReadingOrder: readonly string[];
  readonly edgeReadingOrder: readonly string[];
  readonly staticFallback: string;
  readonly reducedMotion: boolean;
  readonly interactionPolicy: D3FlowOptions["interactionPolicy"];
}

export interface D3FlowRenderModelResult {
  readonly model?: D3FlowRenderModel;
  readonly diagnostics: readonly D3FlowDiagnostic[];
}

export interface D3FlowRuntimeMount {
  update(layout: D3FlowLayout, activeNodeId?: string, activeStateId?: string): void;
  focusNode(nodeId: string): void;
  destroy(): void;
}

export interface D3FlowRuntimePort {
  measureHost(host: unknown): number;
  mount(host: unknown, model: D3FlowRenderModel, layout: D3FlowLayout, activeNodeId?: string, activeStateId?: string, onActiveStateChange?: (stateId?: string) => void): D3FlowRuntimeMount;
  observeResize?(host: unknown, callback: (width: number) => void): () => void;
}

export interface D3FlowComponent {
  readonly model: D3FlowRenderModel;
  readonly layout: D3FlowLayout;
  readonly staticFallback: string;
  readonly activeNodeId?: string;
  readonly activeStateId?: string;
  focusNode(nodeId?: string): void;
  setActiveState(stateId?: string): void;
  handleKey(key: string): boolean;
  resize(width?: number): D3FlowLayout;
  destroy(): void;
}

function cloneSources(values: readonly SourceReference[]): readonly SourceReference[] {
  return values.map((value) => ({
    resourceId: value.resourceId,
    ...(value.provenanceIds ? { provenanceIds: [...value.provenanceIds] } : {}),
    ...(value.relationPath ? { relationPath: value.relationPath } : {}),
  }));
}

function flowDiagnostic(code: D3FlowDiagnosticCode, message: string): D3FlowRenderModelResult {
  return { diagnostics: [{ code, message }] };
}

function requireNonEmpty(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be non-empty`);
}

export interface D3FlowRenderState {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly sharedEdgeAnnotations: readonly { readonly id: string; readonly label: string; readonly edgeIds: readonly string[]; readonly source: readonly SourceReference[] }[];
  readonly activeNodeIds?: readonly string[];
  readonly activeEdgeIds?: readonly string[];
  readonly activeGroupIds?: readonly string[];
  readonly focusNodeId?: string;
  readonly focusGroupId?: string;
  readonly contextGroupIds?: readonly string[];
}

export interface D3FlowResolvedState {
  readonly activeNodeIds: ReadonlySet<string>;
  readonly activeEdgeIds: ReadonlySet<string>;
  readonly activeGroupIds: ReadonlySet<string>;
  readonly contextGroupIds: ReadonlySet<string>;
  readonly contextNodeIds: ReadonlySet<string>;
  readonly contextEdgeIds: ReadonlySet<string>;
  readonly visibleNodeIds: ReadonlySet<string>;
  readonly visibleEdgeIds: ReadonlySet<string>;
  readonly focusNodeIds: ReadonlySet<string>;
  readonly focusNodeId?: string;
  readonly focusGroupId?: string;
}

export interface D3FlowFocusBounds {
  readonly nodeIds: readonly string[];
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface D3FlowSharedAnnotationGeometry {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly stems: readonly { readonly edgeId: string; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number }[];
}

function validateVisualRole(value: unknown, label: string): void {
  if (value !== undefined && (typeof value !== "string" || !/^[a-z][a-z0-9-]*$/u.test(value))) {
    throw new Error(`${label} visualRole must be a lowercase token`);
  }
}

function validateOptions(options: D3FlowOptions): void {
  if (typeof options.reducedMotion !== "boolean") throw new Error("reducedMotion must be boolean");
  if (options.interactionPolicy !== "keyboard" && options.interactionPolicy !== "static") {
    throw new Error("interactionPolicy must be keyboard or static");
  }
}

function validateFlowBlock(block: DiagramBlock): void {
  if ((block as { kind?: unknown }).kind !== "diagram") throw new Error("Flow renderer requires a diagram block");
  if ((block as { diagramType?: unknown }).diagramType !== "flow" && (block as { diagramType?: unknown }).diagramType !== "network") {
    throw new Error(`Unsupported diagram type ${String((block as { diagramType?: unknown }).diagramType)}`);
  }
  requireNonEmpty(block.id, "Flow diagram id");
  requireNonEmpty(block.label, "Flow diagram label");
  requireNonEmpty(block.description, "Flow diagram description");
  if (block.nodes.length < 2) throw new Error("Flow diagram requires at least two nodes");
  if (block.edges.length < 1) throw new Error("Flow diagram requires at least one edge");

  const nodeIds = block.nodes.map((node) => node.id);
  if (new Set(nodeIds).size !== nodeIds.length) throw new Error("Flow diagram node ids must be unique");
  const nodeIdSet = new Set(nodeIds);
  for (const node of block.nodes) {
    requireNonEmpty(node.id, "Flow node id");
    requireNonEmpty(node.label, `Flow node ${node.id} label`);
    validateVisualRole(node.visualRole, `Flow node ${node.id}`);
  }
  const groupIds = (block.groups ?? []).map((group) => group.id);
  if (new Set(groupIds).size !== groupIds.length) throw new Error("Flow diagram group ids must be unique");
  for (const node of block.nodes) {
    for (const groupId of node.groupIds ?? []) {
      if (!groupIds.includes(groupId)) throw new Error(`Flow node ${node.id} references an unknown group`);
    }
  }

  const edgeIds = block.edges.map((edge) => edge.id);
  if (new Set(edgeIds).size !== edgeIds.length) throw new Error("Flow diagram edge ids must be unique");
  for (const edge of block.edges) {
    requireNonEmpty(edge.id, "Flow edge id");
    requireNonEmpty(edge.label, `Flow edge ${edge.id} label`);
    validateVisualRole(edge.visualRole, `Flow edge ${edge.id}`);
    if (!nodeIdSet.has(edge.sourceNodeId) || !nodeIdSet.has(edge.targetNodeId)) {
      throw new Error(`Flow edge ${edge.id} references an unknown node`);
    }
  }
  if (block.focusNodeId !== undefined && !nodeIdSet.has(block.focusNodeId)) {
    throw new Error("Flow diagram focusNodeId references an unknown node");
  }
  const stateIds = new Set<string>();
  const annotationIds = new Set<string>();
  for (const state of block.states ?? []) {
    requireNonEmpty(state.id, "Flow diagram state id");
    if (stateIds.has(state.id)) throw new Error("Flow diagram state ids must be unique");
    stateIds.add(state.id);
    requireNonEmpty(state.label, `Flow diagram state ${state.id} label`);
    if (state.focusNodeId !== undefined && state.focusGroupId !== undefined) throw new Error(`Flow diagram state ${state.id} may focus one node or one group, not both`);
    const validateStateIds = (ids: readonly string[] | undefined, knownIds: readonly string[], kind: string): void => {
      if (ids === undefined) return;
      if (new Set(ids).size !== ids.length) throw new Error(`Flow diagram state ${state.id} contains duplicate active ${kind} ids`);
      for (const id of ids) if (!knownIds.includes(id)) throw new Error(`Flow diagram state ${state.id} references an unknown ${kind}`);
    };
    validateStateIds(state.activeNodeIds, nodeIds, "node");
    validateStateIds(state.activeEdgeIds, edgeIds, "edge");
    validateStateIds(state.activeGroupIds, groupIds, "group");
    validateStateIds(state.contextGroupIds, groupIds, "context group");
    if (state.focusNodeId !== undefined && !nodeIdSet.has(state.focusNodeId)) throw new Error(`Flow diagram state ${state.id} focusNodeId references an unknown node`);
    if (state.focusGroupId !== undefined && !groupIds.includes(state.focusGroupId)) throw new Error(`Flow diagram state ${state.id} focusGroupId references an unknown group`);
    for (const annotation of state.sharedEdgeAnnotations) {
      requireNonEmpty(annotation.id, "Flow shared edge annotation id");
      if (annotationIds.has(annotation.id)) throw new Error("Flow shared edge annotation ids must be unique");
      annotationIds.add(annotation.id);
      requireNonEmpty(annotation.label, `Flow shared edge annotation ${annotation.id} label`);
      if (annotation.edgeIds.length < 2 || new Set(annotation.edgeIds).size !== annotation.edgeIds.length) throw new Error(`Flow shared edge annotation ${annotation.id} requires at least two unique edges`);
      for (const edgeId of annotation.edgeIds) if (!edgeIds.includes(edgeId)) throw new Error(`Flow shared edge annotation ${annotation.id} references an unknown edge`);
    }
  }
}

function flowStaticFallback(block: DiagramBlock): string {
  const labels = new Map(block.nodes.map((node) => [node.id, node.label]));
  return [
    block.label,
    block.description,
    "Nodes:",
    ...block.nodes.map((node) => `- ${node.label}`),
    "Relations:",
    ...block.edges.map((edge) => `- ${labels.get(edge.sourceNodeId) ?? edge.sourceNodeId} — ${edge.label} → ${labels.get(edge.targetNodeId) ?? edge.targetNodeId}`),
    ...(block.states ?? []).flatMap((state) => [
      `State: ${state.label}`,
      ...(state.activeNodeIds ? [`- Active nodes: ${state.activeNodeIds.join(", ")}`] : []),
      ...(state.activeEdgeIds ? [`- Active relations: ${state.activeEdgeIds.join(", ")}`] : []),
      ...(state.activeGroupIds ? [`- Active groups: ${state.activeGroupIds.join(", ")}`] : []),
      ...(state.focusNodeId ? [`- Focus node: ${state.focusNodeId}`] : []),
      ...(state.focusGroupId ? [`- Focus group: ${state.focusGroupId}`] : []),
      ...(state.contextGroupIds ? [`- Context groups: ${state.contextGroupIds.join(", ")}`] : []),
      ...state.sharedEdgeAnnotations.map((annotation) => `- ${annotation.label}`),
    ]),
  ].join("\n");
}

/**
 * Group policy is intentionally renderer-generic: active groups activate their members,
 * context groups reveal their members as context, and relationships are only visible
 * when both endpoints are visible. Focus changes treatment, not graph membership.
 */
export function resolveD3FlowState(model: D3FlowRenderModel, stateId?: string): D3FlowResolvedState {
  const state = model.states.find((candidate) => candidate.id === stateId);
  const membersByGroup = new Map(model.groups.map((group) => [group.id, new Set<string>()]));
  for (const node of model.nodes) {
    for (const groupId of node.groupIds ?? []) membersByGroup.get(groupId)?.add(node.id);
  }
  const stateSelected = state !== undefined;
  const activeGroupIds = new Set(state?.activeGroupIds ?? (stateSelected ? [] : model.groups.map((group) => group.id)));
  const contextGroupIds = new Set(state?.contextGroupIds ?? []);
  const activeNodeIds = new Set(state?.activeNodeIds ?? (stateSelected ? [] : model.nodes.map((node) => node.id)));
  const contextNodeIds = new Set<string>();
  for (const groupId of activeGroupIds) for (const nodeId of membersByGroup.get(groupId) ?? []) activeNodeIds.add(nodeId);
  for (const groupId of contextGroupIds) for (const nodeId of membersByGroup.get(groupId) ?? []) {
    if (!activeNodeIds.has(nodeId)) contextNodeIds.add(nodeId);
  }
  const visibleNodeIds = new Set([...activeNodeIds, ...contextNodeIds]);
  const requestedEdgeIds = new Set(state?.activeEdgeIds ?? (stateSelected ? [] : model.edges.map((edge) => edge.id)));
  const activeEdgeIds = new Set<string>();
  const contextEdgeIds = new Set<string>();
  for (const edge of model.edges) {
    if (!visibleNodeIds.has(edge.sourceNodeId) || !visibleNodeIds.has(edge.targetNodeId)) continue;
    if (requestedEdgeIds.has(edge.id)) activeEdgeIds.add(edge.id);
    else if (!stateSelected || (contextNodeIds.has(edge.sourceNodeId) || contextNodeIds.has(edge.targetNodeId))) contextEdgeIds.add(edge.id);
  }
  const focusNodeIds = new Set<string>();
  if (state?.focusNodeId) focusNodeIds.add(state.focusNodeId);
  if (state?.focusGroupId) for (const nodeId of membersByGroup.get(state.focusGroupId) ?? []) focusNodeIds.add(nodeId);
  return {
    activeNodeIds,
    activeEdgeIds,
    activeGroupIds,
    contextGroupIds,
    contextNodeIds,
    contextEdgeIds,
    visibleNodeIds,
    visibleEdgeIds: new Set([...activeEdgeIds, ...contextEdgeIds]),
    focusNodeIds,
    ...(state?.focusNodeId ? { focusNodeId: state.focusNodeId } : {}),
    ...(state?.focusGroupId ? { focusGroupId: state.focusGroupId } : {}),
  };
}

/** Renderer-derived lens bounds deliberately remain absent from authored RDF. */
export function resolveD3FlowFocusBounds(
  layout: D3FlowLayout,
  state: D3FlowResolvedState,
): D3FlowFocusBounds | undefined {
  const nodes = layout.nodes.filter((node) => state.focusNodeIds.has(node.id));
  if (nodes.length === 0) return undefined;
  const padding = 24;
  const left = Math.max(0, Math.min(...nodes.map((node) => node.x - node.width / 2)) - padding);
  const top = Math.max(0, Math.min(...nodes.map((node) => node.y - node.height / 2)) - padding);
  const right = Math.min(layout.width, Math.max(...nodes.map((node) => node.x + node.width / 2)) + padding);
  const bottom = Math.min(layout.height, Math.max(...nodes.map((node) => node.y + node.height / 2)) + padding);
  return { nodeIds: nodes.map((node) => node.id), x: left, y: top, width: right - left, height: bottom - top };
}

function reconcileKeyedChildren(parent: SVGElement, next: SVGElement): void {
  const existingByKey = new Map(Array.from(parent.children, (child) => [child.getAttribute("data-key"), child]));
  const nextKeys = new Set<string>();
  for (const candidate of Array.from(next.children)) {
    const key = candidate.getAttribute("data-key");
    if (!key) continue;
    nextKeys.add(key);
    const existing = existingByKey.get(key);
    if (!existing) {
      parent.append(candidate);
      continue;
    }
    const removeAttribute = (existing as unknown as { removeAttribute?: (name: string) => void }).removeAttribute;
    if (removeAttribute) for (const attribute of Array.from(existing.attributes)) removeAttribute.call(existing, attribute.name);
    for (const attribute of Array.from(candidate.attributes)) existing.setAttribute(attribute.name, attribute.value);
    existing.replaceChildren(...Array.from(candidate.children));
  }
  for (const [key, child] of existingByKey) if (!key || !nextKeys.has(key)) child.remove();
}

function effectiveEdgeVisualRole(
  edge: DiagramBlock["edges"][number],
  nodeVisualRoles: ReadonlyMap<string, string | undefined>,
): string | undefined {
  if (edge.visualRole) return edge.visualRole;
  const sourceRole = nodeVisualRoles.get(edge.sourceNodeId);
  const targetRole = nodeVisualRoles.get(edge.targetNodeId);
  return sourceRole ?? targetRole;
}

export function createD3FlowRenderModel(block: DiagramBlock, options: D3FlowOptions): D3FlowRenderModelResult {
  try {
    validateOptions(options);
  } catch (error) {
    return flowDiagnostic("INVALID_FLOW_ADAPTER_OPTIONS", error instanceof Error ? error.message : "Invalid flow adapter options");
  }

  if ((block as { diagramType?: unknown }).diagramType !== "flow" && (block as { diagramType?: unknown }).diagramType !== "network") {
    return flowDiagnostic("UNSUPPORTED_FLOW_DIAGRAM_TYPE", `Unsupported diagram type ${String((block as { diagramType?: unknown }).diagramType)}`);
  }

  try {
    validateFlowBlock(block);
    const nodes = block.nodes.map((node, readingIndex): D3FlowRenderNode => ({
      id: node.id,
      label: node.label,
      source: cloneSources(node.source),
      ...(node.emphasis ? { emphasis: node.emphasis } : {}),
       ...(node.visualRole ? { visualRole: node.visualRole } : {}),
       ...(node.groupIds ? { groupIds: [...node.groupIds] } : {}),
      readingIndex,
    }));
      const nodeVisualRoles = new Map(block.nodes.map((node) => [node.id, node.visualRole]));
      const edges = block.edges.map((edge, readingIndex): D3FlowRenderEdge => {
        const visualRole = effectiveEdgeVisualRole(edge, nodeVisualRoles);
        return {
          id: edge.id,
          sourceNodeId: edge.sourceNodeId,
          targetNodeId: edge.targetNodeId,
          label: edge.label,
          source: cloneSources(edge.source),
          readingIndex,
          ...(visualRole ? { visualRole } : {}),
        };
      });
      const groups = (block.groups ?? []).map((group): D3FlowRenderGroup => ({
        id: group.id,
        label: group.label,
        source: cloneSources(group.source),
      }));
      const states = (block.states ?? []).map((state): D3FlowRenderState => ({
        id: state.id,
        label: state.label,
        source: cloneSources(state.source),
        sharedEdgeAnnotations: state.sharedEdgeAnnotations.map((annotation) => ({
          id: annotation.id,
          label: annotation.label,
          edgeIds: [...annotation.edgeIds],
          source: cloneSources(annotation.source),
        })),
        ...(state.activeNodeIds ? { activeNodeIds: [...state.activeNodeIds] } : {}),
        ...(state.activeEdgeIds ? { activeEdgeIds: [...state.activeEdgeIds] } : {}),
        ...(state.activeGroupIds ? { activeGroupIds: [...state.activeGroupIds] } : {}),
        ...(state.focusNodeId ? { focusNodeId: state.focusNodeId } : {}),
        ...(state.focusGroupId ? { focusGroupId: state.focusGroupId } : {}),
        ...(state.contextGroupIds ? { contextGroupIds: [...state.contextGroupIds] } : {}),
      }));
    return {
      model: {
        version: "1.0",
        diagramType: block.diagramType,
        sourceBlockId: block.id,
        label: block.label,
        description: block.description,
        ...(block.focusNodeId ? { focusNodeId: block.focusNodeId } : {}),
        nodes,
        groups,
        edges,
        states,
        nodeReadingOrder: nodes.map((node) => node.id),
        edgeReadingOrder: edges.map((edge) => edge.id),
        staticFallback: flowStaticFallback(block),
        reducedMotion: options.reducedMotion,
        interactionPolicy: options.interactionPolicy,
      },
      diagnostics: [],
    };
  } catch (error) {
    return flowDiagnostic("INVALID_FLOW_DIAGRAM", error instanceof Error ? error.message : "Invalid flow diagram");
  }
}

function ensureHostElement(host: unknown): HTMLElement {
  if (!(host instanceof HTMLElement)) throw new Error("D3 flow host must be an HTMLElement");
  return host;
}

export function resolveD3FlowHostWidth(hostWidth: number, viewportWidth?: number): number {
  const host = Number.isFinite(hostWidth) && hostWidth > 0 ? hostWidth : undefined;
  const viewport = viewportWidth !== undefined && Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : undefined;
  const resolved = Math.min(host ?? viewport ?? 960, viewport ?? host ?? 960);
  return Math.max(320, resolved);
}

let flowMarkerMountSequence = 0;

function markerIdFor(model: D3FlowRenderModel, mountSequence: number, visualRole?: string): string {
  const role = visualRole ? `-${visualRole}` : "";
  return `d3-flow-arrow${role}-${model.sourceBlockId.replace(/[^A-Za-z0-9_-]/gu, "_")}-${mountSequence}`;
}

function addTextLines(parent: SVGElement, lines: readonly string[], x: number, y: number, className: string): SVGTextElement {
  const namespace = "http://www.w3.org/2000/svg";
  const xmlNamespace = "http://www.w3.org/XML/1998/namespace";
  const text = document.createElementNS(namespace, "text");
  text.setAttribute("class", className);
  text.setAttribute("x", String(x));
  text.setAttribute("y", String(y - ((Math.max(lines.length, 1) - 1) * 11)));
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("fill", "currentColor");
  text.setAttributeNS(xmlNamespace, "xml:space", "preserve");
  lines.forEach((line, index) => {
    const tspan = document.createElementNS(namespace, "tspan");
    tspan.setAttribute("x", String(x));
    tspan.setAttribute("dy", index === 0 ? "0" : "22");
    tspan.textContent = line;
    text.append(tspan);
  });
  parent.append(text);
  return text;
}

function orthogonalEdgePath(edge: D3FlowLayoutEdge, orientation: D3FlowLayout["orientation"]): string {
  if (orientation === "horizontal") {
    const elbowX = edge.x1 + (edge.x2 - edge.x1) / 2;
    return `M ${edge.x1} ${edge.y1} H ${elbowX} V ${edge.y2} H ${edge.x2}`;
  }
  const elbowY = edge.y1 + (edge.y2 - edge.y1) / 2;
  return `M ${edge.x1} ${edge.y1} V ${elbowY} H ${edge.x2} V ${edge.y2}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

/** Renderer-owned callout placement joins any explicit 2..N edge targets. */
export function resolveD3FlowSharedAnnotationGeometry(
  layout: D3FlowLayout,
  annotation: { readonly id: string; readonly label: string; readonly edgeIds: readonly string[] },
): D3FlowSharedAnnotationGeometry | undefined {
  const labelMaxWidth = 130;
  const lineHeight = 22;
  const verticalPadding = 12;
  const edgesById = new Map(layout.edges.map((edge) => [edge.id, edge]));
  const edges = annotation.edgeIds.map((id) => edgesById.get(id)).filter((edge): edge is D3FlowLayoutEdge => Boolean(edge));
  if (edges.length !== annotation.edgeIds.length) return undefined;
  const lines = wrapFlowText(annotation.label, labelMaxWidth);
  const width = Math.max(96, ...lines.map((line) => deterministicFlowTextMeasure(line))) + 28;
  const height = Math.max(34, lines.length * lineHeight + verticalPadding);
  const x = clamp(edges.reduce((sum, edge) => sum + edge.labelX, 0) / edges.length, width / 2 + 12, layout.width - width / 2 - 12);
  const y = Math.max(height / 2 + 12, Math.min(...edges.map((edge) => edge.labelY)) - height / 2 - 22);
  return {
    id: annotation.id,
    label: annotation.label,
    x,
    y,
    width,
    height,
    stems: edges.map((edge) => ({
      edgeId: edge.id,
      x1: clamp(edge.labelX, x - width / 2 + 8, x + width / 2 - 8),
      y1: edge.labelY >= y ? y + height / 2 : y - height / 2,
      x2: edge.labelX,
      y2: edge.labelY,
    })),
  };
}

function addEdgeLabel(parent: SVGElement, edge: D3FlowLayoutEdge, orientation: D3FlowLayout["orientation"]): void {
  const namespace = "http://www.w3.org/2000/svg";
  const lineCount = Math.max(edge.labelLines.length, 1);
  const textWidth = Math.max(48, ...edge.labelLines.map((line) => deterministicFlowTextMeasure(line)));
  const panelWidth = textWidth + 26;
  const panelHeight = Math.max(34, lineCount * 22 + 12);
  const group = document.createElementNS(namespace, "g");
  group.setAttribute("class", "d3-flow-edge-label-group");
  group.setAttribute("data-key", `edge-label:${edge.id}`);
  group.setAttribute("data-edge-id", edge.id);
  if (edge.visualRole) group.setAttribute("data-visual-role", edge.visualRole);

  const panel = document.createElementNS(namespace, "rect");
  panel.setAttribute("class", "d3-flow-edge-label-panel");
  panel.setAttribute("x", String(edge.labelX - panelWidth / 2));
  panel.setAttribute("y", String(edge.labelY - panelHeight / 2 - 2));
  panel.setAttribute("width", String(panelWidth));
  panel.setAttribute("height", String(panelHeight));
  panel.setAttribute("rx", "4");
  panel.setAttribute("aria-hidden", "true");
  if (edge.visualRole) panel.setAttribute("data-visual-role", edge.visualRole);
  group.append(panel);

  const stem = document.createElementNS(namespace, "line");
  stem.setAttribute("class", "d3-flow-edge-label-stem");
  stem.setAttribute("x1", String(edge.labelX));
  stem.setAttribute("x2", String(edge.labelX));
  stem.setAttribute("y1", String(edge.labelY + panelHeight / 2 - 2));
  stem.setAttribute("y2", String(orientation === "horizontal" ? edge.y1 - 8 : edge.labelY + panelHeight / 2 + 14));
  stem.setAttribute("aria-hidden", "true");
  if (edge.visualRole) stem.setAttribute("data-visual-role", edge.visualRole);
  group.append(stem);

  addTextLines(group, edge.labelLines, edge.labelX, edge.labelY, "d3-flow-edge-label");
  parent.append(group);
}

function addSharedEdgeAnnotation(parent: SVGElement, geometry: D3FlowSharedAnnotationGeometry): void {
  const namespace = "http://www.w3.org/2000/svg";
  const group = document.createElementNS(namespace, "g");
  group.setAttribute("class", "d3-flow-shared-edge-annotation");
  group.setAttribute("data-key", `shared-edge-annotation:${geometry.id}`);
  group.setAttribute("data-shared-edge-annotation-id", geometry.id);
  group.setAttribute("data-edge-ids", geometry.stems.map((stem) => stem.edgeId).join(" "));
  for (const stemGeometry of geometry.stems) {
    const stem = document.createElementNS(namespace, "line");
    stem.setAttribute("class", "d3-flow-shared-edge-annotation-stem");
    stem.setAttribute("data-edge-id", stemGeometry.edgeId);
    stem.setAttribute("x1", String(stemGeometry.x1));
    stem.setAttribute("y1", String(stemGeometry.y1));
    stem.setAttribute("x2", String(stemGeometry.x2));
    stem.setAttribute("y2", String(stemGeometry.y2));
    stem.setAttribute("aria-hidden", "true");
    group.append(stem);
  }
  const panel = document.createElementNS(namespace, "rect");
  panel.setAttribute("class", "d3-flow-shared-edge-annotation-panel");
  panel.setAttribute("x", String(geometry.x - geometry.width / 2));
  panel.setAttribute("y", String(geometry.y - geometry.height / 2));
  panel.setAttribute("width", String(geometry.width));
  panel.setAttribute("height", String(geometry.height));
  panel.setAttribute("rx", "4");
  panel.setAttribute("aria-hidden", "true");
  group.append(panel);
  addTextLines(group, wrapFlowText(geometry.label, 130), geometry.x, geometry.y, "d3-flow-shared-edge-annotation-label");
  parent.append(group);
}

function addNodeChrome(
  group: SVGGElement,
  width: number,
  height: number,
  readingIndex: number,
): void {
  const namespace = "http://www.w3.org/2000/svg";
  const inset = 11;
  const indexSegmentWidth = Math.min(58, Math.max(32, width * .2));
  const dividerX = -width / 2 + 18 + indexSegmentWidth;

  const inner = document.createElementNS(namespace, "rect");
  inner.setAttribute("class", "d3-flow-node-inner-frame");
  inner.setAttribute("x", String(-width / 2 + inset));
  inner.setAttribute("y", String(-height / 2 + inset));
  inner.setAttribute("width", String(Math.max(0, width - inset * 2)));
  inner.setAttribute("height", String(Math.max(0, height - inset * 2)));
  inner.setAttribute("rx", "2");
  inner.setAttribute("aria-hidden", "true");
  group.append(inner);

  const rail = document.createElementNS(namespace, "rect");
  rail.setAttribute("class", "d3-flow-node-rail");
  rail.setAttribute("x", String(-width / 2 + 18));
  rail.setAttribute("y", String(-height / 2 + 18));
  rail.setAttribute("width", String(indexSegmentWidth));
  rail.setAttribute("height", String(Math.max(0, height - 36)));
  rail.setAttribute("aria-hidden", "true");
  group.append(rail);

  const divider = document.createElementNS(namespace, "line");
  divider.setAttribute("class", "d3-flow-node-divider");
  divider.setAttribute("x1", String(dividerX));
  divider.setAttribute("x2", String(dividerX));
  divider.setAttribute("y1", String(-height / 2 + 18));
  divider.setAttribute("y2", String(height / 2 - 18));
  divider.setAttribute("aria-hidden", "true");
  group.append(divider);

  const status = document.createElementNS(namespace, "circle");
  status.setAttribute("class", "d3-flow-node-status");
  status.setAttribute("cx", String(width / 2 - 24));
  status.setAttribute("cy", String(-height / 2 + 24));
  status.setAttribute("r", "6");
  status.setAttribute("aria-hidden", "true");
  group.append(status);

  const index = document.createElementNS(namespace, "text");
  index.setAttribute("class", "d3-flow-node-index");
  index.setAttribute("x", String(-width / 2 + 18 + indexSegmentWidth / 2));
  index.setAttribute("y", "6");
  index.setAttribute("text-anchor", "middle");
  index.setAttribute("dominant-baseline", "middle");
  index.setAttribute("aria-hidden", "true");
  index.textContent = String(readingIndex + 1).padStart(2, "0");
  group.append(index);
}

export function createSvgD3FlowRuntime(): D3FlowRuntimePort {
  return {
    measureHost(host): number {
      const element = ensureHostElement(host);
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : undefined;
      return resolveD3FlowHostWidth(element.clientWidth, viewportWidth);
    },
    mount(host, model, initialLayout, initialActiveNodeId, initialActiveStateId, onActiveStateChange): D3FlowRuntimeMount {
      const hostElement = ensureHostElement(host);
      const namespace = "http://www.w3.org/2000/svg";
      const mountSequence = ++flowMarkerMountSequence;
      hostElement.innerHTML = "";
      // A div prevents Reveal from treating the renderer-owned wrapper as a nested slide.
      const wrapper = document.createElement("div");
      wrapper.className = "d3-flow-runtime";
      const figure = document.createElement("figure");
      figure.className = "d3-flow-figure";
      const caption = document.createElement("figcaption");
      caption.className = "d3-flow-caption";
      caption.textContent = model.description;
      const svg = document.createElementNS(namespace, "svg");
      svg.setAttribute("class", "d3-flow-svg");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", model.label);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.setAttribute("width", "100%");
      figure.append(svg, caption);
      wrapper.append(figure);
      hostElement.append(wrapper);

      let destroyed = false;
      let nodeElements = new Map<string, SVGGElement>();
      let activeNodeId = initialActiveNodeId;
      let activeStateId = initialActiveStateId;
      let edgeLayer: SVGGElement | undefined;
      let nodeLayer: SVGGElement | undefined;
      let descriptionElement: SVGElement | undefined;
      let definitionsElement: SVGElement | undefined;

      const render = (layout: D3FlowLayout, requestedActiveNodeId?: string, requestedActiveStateId?: string): void => {
        if (destroyed) return;
        const previouslyFocusedId = (document.activeElement as Element | null)?.getAttribute("data-node-id") ?? undefined;
        activeNodeId = requestedActiveNodeId;
        activeStateId = requestedActiveStateId;
        svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
        svg.setAttribute("height", String(layout.height));
        svg.setAttribute("data-orientation", layout.orientation);
        svg.setAttribute("data-reduced-motion", String(model.reducedMotion));

        const desc = descriptionElement ?? document.createElementNS(namespace, "desc");
        desc.textContent = model.staticFallback;
        if (!descriptionElement) {
          descriptionElement = desc;
          svg.append(desc);
        }

        if (!definitionsElement) {
          const defs = document.createElementNS(namespace, "defs");
          const edgeRoles = [...new Set(model.edges.map((edge) => edge.visualRole).filter((role): role is string => Boolean(role)))];
          for (const visualRole of [undefined, ...edgeRoles]) {
            const marker = document.createElementNS(namespace, "marker");
            marker.setAttribute("id", markerIdFor(model, mountSequence, visualRole));
            marker.setAttribute("class", "d3-flow-edge-marker");
            marker.setAttribute("viewBox", "0 0 10 10");
            marker.setAttribute("refX", "9");
            marker.setAttribute("refY", "5");
            marker.setAttribute("markerWidth", "3.5");
            marker.setAttribute("markerHeight", "4");
            marker.setAttribute("orient", "auto-start-reverse");
            if (visualRole) marker.setAttribute("data-visual-role", visualRole);
            const arrow = document.createElementNS(namespace, "path");
            arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
            arrow.setAttribute("fill", "currentColor");
            marker.append(arrow);
            defs.append(marker);
          }
          definitionsElement = defs;
          svg.append(defs);
        }

        const nextEdgeLayer = document.createElementNS(namespace, "g");
        nextEdgeLayer.setAttribute("class", "d3-flow-edge-layer");
        const activeState = model.states.find((state) => state.id === activeStateId);
        const resolvedState = resolveD3FlowState(model, activeStateId);
        const focusBounds = resolveD3FlowFocusBounds(layout, resolvedState);
        if (focusBounds) svg.setAttribute("data-diagram-state-focus-bounds", `${focusBounds.x} ${focusBounds.y} ${focusBounds.width} ${focusBounds.height}`);
        else (svg as unknown as { removeAttribute?: (name: string) => void }).removeAttribute?.("data-diagram-state-focus-bounds");
        const activeAnnotatedEdgeIds = new Set(activeState?.sharedEdgeAnnotations.flatMap((annotation) => annotation.edgeIds) ?? []);
        for (const edge of layout.edges) {
          if (!resolvedState.visibleEdgeIds.has(edge.id)) continue;
          const path = document.createElementNS(namespace, "path");
          path.setAttribute("class", "d3-flow-edge");
          path.setAttribute("data-key", `edge:${edge.id}`);
          path.setAttribute("data-edge-id", edge.id);
          path.setAttribute("data-source-node-id", edge.sourceNodeId);
          path.setAttribute("data-target-node-id", edge.targetNodeId);
          if (resolvedState.contextGroupIds.size) path.setAttribute("data-diagram-state-context-groups", [...resolvedState.contextGroupIds].join(" "));
          if (resolvedState.contextEdgeIds.has(edge.id)) path.setAttribute("data-diagram-state-context", "true");
          if (resolvedState.focusNodeIds.has(edge.sourceNodeId) && resolvedState.focusNodeIds.has(edge.targetNodeId)) path.setAttribute("data-diagram-state-focus", "true");
           if (edge.visualRole) path.setAttribute("data-visual-role", edge.visualRole);
           if (activeAnnotatedEdgeIds.has(edge.id)) path.classList.add("d3-flow-edge-state-active");
          path.setAttribute("d", orthogonalEdgePath(edge, layout.orientation));
          path.setAttribute("stroke", "currentColor");
          path.setAttribute("fill", "none");
          path.setAttribute("marker-end", `url(#${markerIdFor(model, mountSequence, edge.visualRole)})`);
          nextEdgeLayer.append(path);
           if (!activeAnnotatedEdgeIds.has(edge.id)) addEdgeLabel(nextEdgeLayer, edge, layout.orientation);
         }
        for (const annotation of activeState?.sharedEdgeAnnotations ?? []) {
          const geometry = resolveD3FlowSharedAnnotationGeometry(layout, annotation);
          if (geometry) addSharedEdgeAnnotation(nextEdgeLayer, geometry);
        }
        if (!edgeLayer) {
          edgeLayer = nextEdgeLayer;
          svg.append(edgeLayer);
        } else reconcileKeyedChildren(edgeLayer, nextEdgeLayer);

        const modelNodeById = new Map(model.nodes.map((node) => [node.id, node]));
        const nextNodeLayer = document.createElementNS(namespace, "g");
        nextNodeLayer.setAttribute("class", "d3-flow-node-layer");
        const nextNodeElements = new Map<string, SVGGElement>();
        for (const layoutNode of layout.nodes) {
          const modelNode = modelNodeById.get(layoutNode.id)!;
          if (!resolvedState.visibleNodeIds.has(modelNode.id)) continue;
          const group = document.createElementNS(namespace, "g");
          group.setAttribute("class", `d3-flow-node${modelNode.emphasis ? ` d3-flow-node-${modelNode.emphasis}` : ""}`);
          group.setAttribute("data-key", `node:${modelNode.id}`);
          group.setAttribute("data-node-id", modelNode.id);
           if (modelNode.visualRole) group.setAttribute("data-visual-role", modelNode.visualRole);
          if (modelNode.groupIds?.length) group.setAttribute("data-group-ids", modelNode.groupIds.join(" "));
          if (modelNode.groupIds?.some((groupId) => resolvedState.contextGroupIds.has(groupId))) group.setAttribute("data-diagram-state-context", "true");
          if (resolvedState.focusNodeIds.has(modelNode.id)) group.setAttribute("data-diagram-state-focus", "true");
          group.setAttribute("aria-label", modelNode.label);
          group.setAttribute("transform", `translate(${layoutNode.x} ${layoutNode.y})`);
          if (model.interactionPolicy === "keyboard") {
            group.setAttribute("tabindex", "0");
            group.setAttribute("role", "button");
          }
          const rect = document.createElementNS(namespace, "rect");
          rect.setAttribute("class", "d3-flow-node-shape");
          rect.setAttribute("x", String(-layoutNode.width / 2));
          rect.setAttribute("y", String(-layoutNode.height / 2));
          rect.setAttribute("width", String(layoutNode.width));
          rect.setAttribute("height", String(layoutNode.height));
          rect.setAttribute("rx", "8");
          rect.setAttribute("fill", "none");
          rect.setAttribute("stroke", "currentColor");
          group.append(rect);
          addNodeChrome(group, layoutNode.width, layoutNode.height, modelNode.readingIndex);
          const indexSegmentWidth = Math.min(58, Math.max(32, layoutNode.width * .2));
          addTextLines(group, layoutNode.labelLines, (-layoutNode.width / 2 + 18 + indexSegmentWidth + layoutNode.width / 2) / 2, 0, "d3-flow-node-label");
          if (modelNode.id === activeNodeId) group.classList.add("d3-flow-node-active");
          nextNodeLayer.append(group);
          nextNodeElements.set(modelNode.id, group);
        }
        if (!nodeLayer) {
          nodeLayer = nextNodeLayer;
          svg.append(nodeLayer);
        } else reconcileKeyedChildren(nodeLayer, nextNodeLayer);
        nodeElements = nextNodeElements;
        if (model.interactionPolicy === "keyboard" && previouslyFocusedId && previouslyFocusedId === activeNodeId) {
          nodeElements.get(previouslyFocusedId)?.focus();
        }
      };

      render(initialLayout, initialActiveNodeId, initialActiveStateId);

      return {
        update(layout, requestedActiveNodeId, requestedActiveStateId) {
          render(layout, requestedActiveNodeId, requestedActiveStateId);
        },
        focusNode(nodeId) {
          if (destroyed || model.interactionPolicy !== "keyboard" || !nodeElements.has(nodeId)) return;
          activeNodeId = nodeId;
          for (const [id, element] of nodeElements) element.classList.toggle("d3-flow-node-active", id === nodeId);
          nodeElements.get(nodeId)?.focus();
        },
        destroy() {
          if (destroyed) return;
          destroyed = true;
          wrapper.remove();
          nodeElements.clear();
        },
      };
    },
    observeResize(host, callback) {
      const hostElement = ensureHostElement(host);
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver((entries) => {
          const measuredWidth = entries[0]?.contentRect.width;
          const hostWidth = measuredWidth && measuredWidth > 0 ? measuredWidth : hostElement.clientWidth;
          const viewportWidth = typeof window !== "undefined" ? window.innerWidth : undefined;
          callback(resolveD3FlowHostWidth(hostWidth, viewportWidth));
        });
        observer.observe(hostElement);
        return () => observer.disconnect();
      }
      if (typeof window !== "undefined") {
        const onResize = (): void => callback(resolveD3FlowHostWidth(hostElement.clientWidth, window.innerWidth));
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
      }
      return () => {};
    },
  };
}

export function mountD3FlowDiagram(
  host: unknown,
  block: DiagramBlock,
  options: D3FlowOptions,
  runtime: D3FlowRuntimePort = createSvgD3FlowRuntime(),
): D3FlowComponent | D3FlowRenderModelResult {
  const result = createD3FlowRenderModel(block, options);
  if (!result.model) return result;
  const model = result.model;
  const createLayout = (width: number): D3FlowLayout => {
     return createD3FlowLayout(model, width);
  };
  let layout = createLayout(runtime.measureHost(host));
  let activeNodeId = model.focusNodeId ?? (model.interactionPolicy === "keyboard" ? model.nodeReadingOrder[0] : undefined);
  let focusIndex = activeNodeId ? model.nodeReadingOrder.indexOf(activeNodeId) : -1;
  let destroyed = false;
  let activeStateId: string | undefined;
  const mounted = runtime.mount(host, model, layout, activeNodeId, activeStateId, (stateId) => {
    if (stateId !== undefined && !model.states.some((state) => state.id === stateId)) return;
    activeStateId = stateId;
  });
  if (model.interactionPolicy === "keyboard" && activeNodeId) mounted.focusNode(activeNodeId);

  const resize = (width?: number): D3FlowLayout => {
    if (destroyed) return layout;
    layout = createLayout(width ?? runtime.measureHost(host));
    mounted.update(layout, activeNodeId, activeStateId);
    return layout;
  };
  const stopObserving = runtime.observeResize?.(host, (width) => { resize(width); }) ?? (() => {});

  return {
    model,
    get layout() { return layout; },
    get staticFallback() { return model.staticFallback; },
    get activeNodeId() { return activeNodeId; },
    get activeStateId() { return activeStateId; },
    focusNode(nodeId) {
      if (destroyed || model.interactionPolicy !== "keyboard") return;
      const target = nodeId ?? model.focusNodeId ?? model.nodeReadingOrder[0];
      if (!target) return;
      const nextIndex = model.nodeReadingOrder.indexOf(target);
      if (nextIndex < 0) return;
      activeNodeId = target;
      focusIndex = nextIndex;
      mounted.focusNode(target);
    },
    setActiveState(stateId) {
      if (destroyed) return;
      if (stateId !== undefined && !model.states.some((state) => state.id === stateId)) return;
      activeStateId = stateId;
      mounted.update(layout, activeNodeId, activeStateId);
    },
    handleKey(key) {
      if (destroyed || model.interactionPolicy !== "keyboard" || model.nodeReadingOrder.length === 0) return false;
      if (key !== "ArrowRight" && key !== "ArrowDown" && key !== "ArrowLeft" && key !== "ArrowUp" && key !== "Home" && key !== "End") return false;
      if (key === "Home") focusIndex = 0;
      else if (key === "End") focusIndex = model.nodeReadingOrder.length - 1;
      else if (key === "ArrowRight" || key === "ArrowDown") focusIndex = (Math.max(focusIndex, 0) + 1) % model.nodeReadingOrder.length;
      else focusIndex = (Math.max(focusIndex, 0) - 1 + model.nodeReadingOrder.length) % model.nodeReadingOrder.length;
      activeNodeId = model.nodeReadingOrder[focusIndex];
      mounted.focusNode(activeNodeId);
      return true;
    },
    resize,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopObserving();
      mounted.destroy();
    },
  };
}
