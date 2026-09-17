import type { DiagramBlock, SourceReference } from "../../core/src/index.ts";
import type { D3KnowledgeNetworkOptions } from "./index.ts";
import {
  createD3FlowLayout,
  deterministicFlowTextMeasure,
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
  update(layout: D3FlowLayout, activeNodeId?: string): void;
  focusNode(nodeId: string): void;
  destroy(): void;
}

export interface D3FlowRuntimePort {
  measureHost(host: unknown): number;
  mount(host: unknown, model: D3FlowRenderModel, layout: D3FlowLayout, activeNodeId?: string): D3FlowRuntimeMount;
  observeResize?(host: unknown, callback: (width: number) => void): () => void;
}

export interface D3FlowComponent {
  readonly model: D3FlowRenderModel;
  readonly layout: D3FlowLayout;
  readonly staticFallback: string;
  readonly activeNodeId?: string;
  focusNode(nodeId?: string): void;
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
  ].join("\n");
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
      const edges = block.edges.map((edge, readingIndex): D3FlowRenderEdge => ({
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      label: edge.label,
       source: cloneSources(edge.source),
       readingIndex,
       ...(edge.visualRole ? { visualRole: edge.visualRole } : {}),
      }));
      const groups = (block.groups ?? []).map((group): D3FlowRenderGroup => ({
        id: group.id,
        label: group.label,
        source: cloneSources(group.source),
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

function addEdgeLabel(parent: SVGElement, edge: D3FlowLayoutEdge, orientation: D3FlowLayout["orientation"]): void {
  const namespace = "http://www.w3.org/2000/svg";
  const lineCount = Math.max(edge.labelLines.length, 1);
  const textWidth = Math.max(48, ...edge.labelLines.map((line) => deterministicFlowTextMeasure(line)));
  const panelWidth = textWidth + 26;
  const panelHeight = Math.max(34, lineCount * 22 + 12);
  const group = document.createElementNS(namespace, "g");
  group.setAttribute("class", "d3-flow-edge-label-group");
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
    mount(host, model, initialLayout, initialActiveNodeId): D3FlowRuntimeMount {
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

      const render = (layout: D3FlowLayout, requestedActiveNodeId?: string): void => {
        if (destroyed) return;
        const previouslyFocusedId = (document.activeElement as Element | null)?.getAttribute("data-node-id") ?? undefined;
        activeNodeId = requestedActiveNodeId;
        svg.replaceChildren();
        svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
        svg.setAttribute("height", String(layout.height));
        svg.setAttribute("data-orientation", layout.orientation);

        const desc = document.createElementNS(namespace, "desc");
        desc.textContent = model.staticFallback;
        svg.append(desc);

        const defs = document.createElementNS(namespace, "defs");
        const edgeRoles = [...new Set(model.edges.map((edge) => edge.visualRole).filter((role): role is string => Boolean(role)))];
        for (const visualRole of [undefined, ...edgeRoles]) {
          const marker = document.createElementNS(namespace, "marker");
          marker.setAttribute("id", markerIdFor(model, mountSequence, visualRole));
          marker.setAttribute("class", "d3-flow-edge-marker");
          marker.setAttribute("viewBox", "0 0 10 10");
          marker.setAttribute("refX", "9");
          marker.setAttribute("refY", "5");
          marker.setAttribute("markerWidth", visualRole === "annotation" ? "4" : "6");
          marker.setAttribute("markerHeight", visualRole === "annotation" ? "4" : "6");
          marker.setAttribute("orient", "auto-start-reverse");
          if (visualRole) marker.setAttribute("data-visual-role", visualRole);
          const arrow = document.createElementNS(namespace, "path");
          arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
          arrow.setAttribute("fill", "currentColor");
          marker.append(arrow);
          defs.append(marker);
        }
        svg.append(defs);

        const edgeLayer = document.createElementNS(namespace, "g");
        edgeLayer.setAttribute("class", "d3-flow-edge-layer");
        for (const edge of layout.edges) {
          const path = document.createElementNS(namespace, "path");
          path.setAttribute("class", "d3-flow-edge");
          path.setAttribute("data-edge-id", edge.id);
          path.setAttribute("data-source-node-id", edge.sourceNodeId);
          path.setAttribute("data-target-node-id", edge.targetNodeId);
          if (edge.visualRole) path.setAttribute("data-visual-role", edge.visualRole);
          path.setAttribute("d", orthogonalEdgePath(edge, layout.orientation));
          path.setAttribute("stroke", "currentColor");
          path.setAttribute("fill", "none");
          path.setAttribute("marker-end", `url(#${markerIdFor(model, mountSequence, edge.visualRole)})`);
          edgeLayer.append(path);
          addEdgeLabel(edgeLayer, edge, layout.orientation);
        }
        svg.append(edgeLayer);

        const modelNodeById = new Map(model.nodes.map((node) => [node.id, node]));
        const nodeLayer = document.createElementNS(namespace, "g");
        nodeLayer.setAttribute("class", "d3-flow-node-layer");
        const nextNodeElements = new Map<string, SVGGElement>();
        for (const layoutNode of layout.nodes) {
          const modelNode = modelNodeById.get(layoutNode.id)!;
          const group = document.createElementNS(namespace, "g");
          group.setAttribute("class", `d3-flow-node${modelNode.emphasis ? ` d3-flow-node-${modelNode.emphasis}` : ""}`);
          group.setAttribute("data-node-id", modelNode.id);
           if (modelNode.visualRole) group.setAttribute("data-visual-role", modelNode.visualRole);
           if (modelNode.groupIds?.length) group.setAttribute("data-group-ids", modelNode.groupIds.join(" "));
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
          nodeLayer.append(group);
          nextNodeElements.set(modelNode.id, group);
        }
        svg.append(nodeLayer);
        nodeElements = nextNodeElements;
        if (model.interactionPolicy === "keyboard" && previouslyFocusedId && previouslyFocusedId === activeNodeId) {
          nodeElements.get(previouslyFocusedId)?.focus();
        }
      };

      render(initialLayout, initialActiveNodeId);

      return {
        update(layout, requestedActiveNodeId) {
          render(layout, requestedActiveNodeId);
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
  const mounted = runtime.mount(host, model, layout, activeNodeId);
  if (model.interactionPolicy === "keyboard" && activeNodeId) mounted.focusNode(activeNodeId);

  const resize = (width?: number): D3FlowLayout => {
    if (destroyed) return layout;
    layout = createLayout(width ?? runtime.measureHost(host));
    mounted.update(layout, activeNodeId);
    return layout;
  };
  const stopObserving = runtime.observeResize?.(host, (width) => { resize(width); }) ?? (() => {});

  return {
    model,
    get layout() { return layout; },
    get staticFallback() { return model.staticFallback; },
    get activeNodeId() { return activeNodeId; },
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
