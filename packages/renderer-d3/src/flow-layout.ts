export type D3FlowOrientation = "horizontal" | "vertical";

export interface D3FlowLayoutNodeInput {
  readonly id: string;
  readonly label: string;
  readonly groupIds?: readonly string[];
}

export interface D3FlowLayoutEdgeInput {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly label: string;
  readonly visualRole?: string;
}

export interface D3FlowLayoutInput {
  readonly nodes: readonly D3FlowLayoutNodeInput[];
  readonly edges: readonly D3FlowLayoutEdgeInput[];
  readonly diagramType?: "flow" | "network";
  readonly groups?: readonly { readonly id: string }[];
  readonly focusNodeId?: string;
  readonly states?: readonly { readonly id: string; readonly sharedEdgeAnnotations: readonly { readonly id: string; readonly edgeIds: readonly string[] }[] }[];
}

export interface D3FlowLayoutNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly labelLines: readonly string[];
}

export interface D3FlowLayoutEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly labelX: number;
  readonly labelY: number;
  readonly labelLines: readonly string[];
  readonly visualRole?: string;
}

export interface D3FlowLayout {
  readonly orientation: D3FlowOrientation;
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly D3FlowLayoutNode[];
  readonly edges: readonly D3FlowLayoutEdge[];
  readonly states: readonly { readonly id: string; readonly sharedEdgeAnnotations: readonly { readonly id: string; readonly edgeIds: readonly string[] }[] }[];
}

interface GraphemeSegment {
  readonly segment: string;
}

interface GraphemeSegmenter {
  segment(value: string): Iterable<GraphemeSegment>;
}

interface GraphemeSegmenterConstructor {
  new (locales?: string | readonly string[], options?: { granularity: "grapheme" }): GraphemeSegmenter;
}

interface PreparedNode extends D3FlowLayoutNodeInput {
  readonly inputIndex: number;
  readonly labelLines: readonly string[];
  readonly width: number;
  readonly height: number;
}

// Renderer-local geometry constraints keep authored graph content readable across hosts.
const FLOW_MIN_WIDTH = 320;
const FLOW_HORIZONTAL_BREAKPOINT = 900;
const FLOW_NODE_MIN_HEIGHT = 112;
const HORIZONTAL_LABEL_WIDTH = 150;
const HORIZONTAL_NODE_MIN_WIDTH = 240;
const HORIZONTAL_NODE_MAX_WIDTH = 286;
const HORIZONTAL_NODE_CHROME = 118;
// Keep relationship callouts above the workflow rather than inside card bounds.
const HORIZONTAL_EDGE_LABEL_CLEARANCE = 94;
const EDGE_LABEL_MAX_WIDTH = 130;
const EDGE_LABEL_LINE_HEIGHT = 22;
const EDGE_LABEL_MIN_HEIGHT = 34;
const EDGE_LABEL_VERTICAL_PADDING = 12;
const PARALLEL_LABEL_BREATHING_ROOM = 12;
const NETWORK_COMPACT_BREAKPOINT = 720;
const NETWORK_MARGIN = 32;
const NETWORK_NODE_MAX_WIDTH = 210;
const NETWORK_CLUSTER_GAP = 42;

function segmentGraphemes(value: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: GraphemeSegmenterConstructor }).Segmenter;
  if (!Segmenter) throw new Error("Intl.Segmenter is required for grapheme-safe flow text layout");
  return Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(value), ({ segment }) => segment);
}

export function deterministicFlowTextMeasure(value: string): number {
  return segmentGraphemes(value).length * 8;
}

/**
 * Wrap renderer text without truncating any authored characters. Long unspaced
 * identifiers are split only at Unicode grapheme boundaries.
 */
export function wrapFlowText(
  text: string,
  maxWidth: number,
  measure: (value: string) => number = deterministicFlowTextMeasure,
): string[] {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) throw new Error("Flow text maxWidth must be positive");

  const lines: string[] = [];
  const paragraphParts = text.split(/(\r?\n)/u);
  for (let index = 0; index < paragraphParts.length; index += 2) {
    const paragraph = paragraphParts[index] ?? "";
    const authoredLineBreak = paragraphParts[index + 1] ?? "";
    if (paragraph.length === 0) {
      lines.push(authoredLineBreak);
      continue;
    }

    const tokens = paragraph.match(/\s+|\S+/gu) ?? [paragraph];
    let line = "";
    for (const token of tokens) {
      const candidate = line + token;
      if (line.length > 0 && measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line.length === 0 && measure(token) <= maxWidth) {
        line = token;
        continue;
      }
      if (line.length > 0) {
        lines.push(line);
        line = "";
      }
      if (measure(token) <= maxWidth) {
        line = token;
        continue;
      }
      for (const grapheme of segmentGraphemes(token)) {
        const graphemeCandidate = line + grapheme;
        if (line.length > 0 && measure(graphemeCandidate) > maxWidth) {
          lines.push(line);
          line = "";
        }
        line += grapheme;
      }
    }
    lines.push(line + authoredLineBreak);
  }
  return lines;
}

export function flowOrientationForWidth(hostWidth: number): D3FlowOrientation {
  if (!Number.isFinite(hostWidth) || hostWidth <= 0) throw new Error("Flow host width must be positive");
  return hostWidth < FLOW_HORIZONTAL_BREAKPOINT ? "vertical" : "horizontal";
}

function nodeHeight(lines: readonly string[]): number {
  return Math.max(FLOW_NODE_MIN_HEIGHT, 62 + Math.max(lines.length, 1) * 24);
}

function horizontalNodeWidth(lines: readonly string[]): number {
  const longestLine = Math.max(0, ...lines.map((line) => deterministicFlowTextMeasure(line)));
  return Math.max(
    HORIZONTAL_NODE_MIN_WIDTH,
    Math.min(HORIZONTAL_NODE_MAX_WIDTH, longestLine + HORIZONTAL_NODE_CHROME),
  );
}

function midpoint(a: number, b: number): number {
  return a + (b - a) / 2;
}

function topologicalLayers(input: D3FlowLayoutInput): readonly (readonly string[])[] {
  const ids = new Set(input.nodes.map((node) => node.id));
  const indegree = new Map(input.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();
  for (const edge of input.edges) {
    if (!ids.has(edge.sourceNodeId) || !ids.has(edge.targetNodeId)) {
      throw new Error(`Flow edge ${edge.id} references an unknown layout node`);
    }
    indegree.set(edge.targetNodeId, (indegree.get(edge.targetNodeId) ?? 0) + 1);
    const targets = outgoing.get(edge.sourceNodeId) ?? [];
    targets.push(edge.targetNodeId);
    outgoing.set(edge.sourceNodeId, targets);
  }

  const remaining = new Set(ids);
  const layers: string[][] = [];
  while (remaining.size > 0) {
    const layer = input.nodes
      .filter((node) => remaining.has(node.id) && (indegree.get(node.id) ?? 0) === 0)
      .map((node) => node.id);
    if (layer.length === 0) {
      return input.nodes.map((node) => [node.id]);
    }
    layers.push(layer);
    for (const id of layer) {
      remaining.delete(id);
      for (const target of outgoing.get(id) ?? []) {
        indegree.set(target, Math.max(0, (indegree.get(target) ?? 0) - 1));
      }
    }
  }
  return layers;
}

function horizontalLayeredLayout(
  input: D3FlowLayoutInput,
  prepared: readonly PreparedNode[],
  layers: readonly (readonly string[])[],
  hostWidth: number,
): { readonly width: number; readonly height: number; readonly nodes: readonly D3FlowLayoutNode[] } {
  const margin = 24;
  const layerGap = 56;
  const siblingGap = 54;
  const nodeById = new Map(prepared.map((node) => [node.id, node]));
  const layerWidths = layers.map((layer) => Math.max(...layer.map((id) => nodeById.get(id)?.width ?? HORIZONTAL_NODE_MIN_WIDTH)));
  const layerGapFor = (layer: readonly string[]): number => {
    if (layer.length < 2) return siblingGap;
    const ids = new Set(layer);
    const tallestLabelPanel = Math.max(
      0,
      ...input.edges
        .filter((edge) => ids.has(edge.sourceNodeId) || ids.has(edge.targetNodeId))
        .map((edge) => Math.max(
          EDGE_LABEL_MIN_HEIGHT,
          wrapFlowText(edge.label, EDGE_LABEL_MAX_WIDTH).length * EDGE_LABEL_LINE_HEIGHT + EDGE_LABEL_VERTICAL_PADDING,
        )),
    );
    // Labels move half as far apart as their sibling nodes, so double their clearance.
    return Math.max(siblingGap, 2 * (tallestLabelPanel + PARALLEL_LABEL_BREATHING_ROOM));
  };
  const layerHeights = layers.map((layer) =>
    layer.reduce((sum, id) => sum + (nodeById.get(id)?.height ?? 112), 0) + Math.max(0, layer.length - 1) * layerGapFor(layer),
  );
  const contentHeight = Math.max(112, ...layerHeights);
  const intrinsicWidth = margin * 2 + layerWidths.reduce((sum, width) => sum + width, 0) + Math.max(0, layers.length - 1) * layerGap;
  const width = Math.max(hostWidth, intrinsicWidth);
  const height = margin * 2 + HORIZONTAL_EDGE_LABEL_CLEARANCE + contentHeight + 34;
  const byId = new Map<string, D3FlowLayoutNode>();

  let layerLeft = margin;
  layers.forEach((layer, layerIndex) => {
    const layerWidth = layerWidths[layerIndex] ?? HORIZONTAL_NODE_MIN_WIDTH;
    const layerHeight = layerHeights[layerIndex] ?? 0;
    const rowGap = layerGapFor(layer);
    let cursorY = margin + HORIZONTAL_EDGE_LABEL_CLEARANCE + 17 + (contentHeight - layerHeight) / 2;
    const x = layerLeft + layerWidth / 2;
    for (const id of layer) {
      const node = nodeById.get(id)!;
      byId.set(id, {
        id,
        x,
        y: cursorY + node.height / 2,
        width: node.width,
        height: node.height,
        labelLines: node.labelLines,
      });
      cursorY += node.height + rowGap;
    }
    layerLeft += layerWidth + layerGap;
  });

  return {
    width,
    height,
    nodes: prepared.map((node) => byId.get(node.id)!),
  };
}

function verticalLayeredLayout(
  prepared: readonly PreparedNode[],
  layers: readonly (readonly string[])[],
  hostWidth: number,
): { readonly width: number; readonly height: number; readonly nodes: readonly D3FlowLayoutNode[] } {
  const margin = 24;
  const layerGap = 52;
  const siblingGap = 16;
  const nodeById = new Map(prepared.map((node) => [node.id, node]));
  const width = Math.max(FLOW_MIN_WIDTH, hostWidth);
  const byId = new Map<string, D3FlowLayoutNode>();
  let cursorY = margin + 22;

  for (const layer of layers) {
    const availableWidth = Math.max(180, width - margin * 2 - Math.max(0, layer.length - 1) * siblingGap);
    const nodeWidth = Math.max(180, Math.min(390, availableWidth / Math.max(1, layer.length)));
    const layerNodes = layer.map((id) => {
      const original = nodeById.get(id)!;
      const labelLines = wrapFlowText(original.label, Math.max(120, nodeWidth - 64));
      return { ...original, labelLines, width: nodeWidth, height: nodeHeight(labelLines) };
    });
    const layerHeight = Math.max(112, ...layerNodes.map((node) => node.height));
    const contentWidth = layerNodes.length * nodeWidth + Math.max(0, layerNodes.length - 1) * siblingGap;
    let cursorX = (width - contentWidth) / 2;
    for (const node of layerNodes) {
      byId.set(node.id, {
        id: node.id,
        x: cursorX + nodeWidth / 2,
        y: cursorY + layerHeight / 2,
        width: nodeWidth,
        height: node.height,
        labelLines: node.labelLines,
      });
      cursorX += nodeWidth + siblingGap;
    }
    cursorY += layerHeight + layerGap;
  }

  return {
    width,
    height: Math.max(240, cursorY - layerGap + margin + 22),
    nodes: prepared.map((node) => byId.get(node.id)!),
  };
}

function groupedNetworkLayout(
  input: D3FlowLayoutInput,
  prepared: readonly PreparedNode[],
  hostWidth: number,
): { readonly width: number; readonly height: number; readonly nodes: readonly D3FlowLayoutNode[] } {
  const width = Math.max(FLOW_MIN_WIDTH, hostWidth);
  const groupIds = input.groups?.map((group) => group.id) ?? [];
  const groupIndex = new Map(groupIds.map((id, index) => [id, index]));
  const buckets = new Map<string, PreparedNode[]>();
  for (const node of prepared) {
    const memberships = node.groupIds ?? [];
    const groupId = memberships.find((id) => groupIndex.has(id)) ?? `ungrouped-${node.inputIndex}`;
    const bucket = buckets.get(groupId) ?? [];
    bucket.push(node);
    buckets.set(groupId, bucket);
  }
  const orderedBuckets = [...buckets.entries()].sort(([left], [right]) => {
    const leftIndex = groupIndex.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = groupIndex.get(right) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex || left.localeCompare(right);
  });
  const focusNode = input.focusNodeId ? prepared.find((node) => node.id === input.focusNodeId) : undefined;
  const clusteredBuckets = orderedBuckets
    .map(([id, bucket]) => [id, bucket.filter((node) => node.id !== focusNode?.id)] as const)
    .filter(([, bucket]) => bucket.length > 0);
  const networkNodeWidth = Math.min(NETWORK_NODE_MAX_WIDTH, Math.max(160, width - NETWORK_MARGIN * 2));

  if (width < NETWORK_COMPACT_BREAKPOINT) {
    const nodes: D3FlowLayoutNode[] = [];
    let cursorY = NETWORK_MARGIN;
    if (focusNode) {
      nodes.push({
        id: focusNode.id,
        x: width / 2,
        y: cursorY + focusNode.height / 2,
        width: Math.min(networkNodeWidth, focusNode.width),
        height: focusNode.height,
        labelLines: focusNode.labelLines,
      });
      cursorY += focusNode.height + NETWORK_CLUSTER_GAP;
    }
    for (const [, bucket] of clusteredBuckets) {
      for (const node of bucket) {
        nodes.push({
          id: node.id,
          x: width / 2,
          y: cursorY + node.height / 2,
          width: Math.min(networkNodeWidth, node.width),
          height: node.height,
          labelLines: node.labelLines,
        });
        cursorY += node.height + NETWORK_CLUSTER_GAP;
      }
    }
    return {
      width,
      height: Math.max(240, cursorY - NETWORK_CLUSTER_GAP + NETWORK_MARGIN),
      nodes: prepared.map((node) => nodes.find((candidate) => candidate.id === node.id)!),
    };
  }

  const clusterCount = Math.max(clusteredBuckets.length, 1);
  const maxNodeWidth = Math.max(160, ...prepared.map((node) => Math.min(networkNodeWidth, node.width)));
  const clusterRadius = Math.max(260, Math.min(420, 140 + clusterCount * 44 + maxNodeWidth * 0.35));
  const clusterNodeRadius = Math.min(160, Math.max(110, maxNodeWidth * 0.55));
  const centerX = width / 2;
  const centerY = NETWORK_MARGIN + clusterRadius + clusterNodeRadius + 92;
  const nodes: D3FlowLayoutNode[] = [];
  if (focusNode) {
    nodes.push({
      id: focusNode.id,
      x: centerX,
      y: centerY,
      width: Math.min(240, focusNode.width),
      height: focusNode.height,
      labelLines: focusNode.labelLines,
    });
  }
  for (const [index, [, bucket]] of clusteredBuckets.entries()) {
    const clusterAngle = -Math.PI / 2 + (2 * Math.PI * index) / clusterCount;
    const clusterX = centerX + Math.cos(clusterAngle) * clusterRadius;
    const clusterY = centerY + Math.sin(clusterAngle) * clusterRadius;
    const radius = bucket.length === 1 ? 0 : Math.min(clusterNodeRadius, Math.max(70, 28 + bucket.length * 28));
    bucket.forEach((node, nodeIndex) => {
      const angle = clusterAngle + (2 * Math.PI * nodeIndex) / Math.max(bucket.length, 1);
      nodes.push({
        id: node.id,
        x: clusterX + Math.cos(angle) * radius,
        y: clusterY + Math.sin(angle) * radius,
        width: Math.min(networkNodeWidth, node.width),
        height: node.height,
        labelLines: node.labelLines,
      });
    });
  }
  return {
    width,
    height: Math.max(520, centerY + clusterRadius + clusterNodeRadius + NETWORK_MARGIN),
    nodes: prepared.map((node) => nodes.find((candidate) => candidate.id === node.id)!),
  };
}

/** Deterministic renderer-only geometry derived from graph topology and canonical array order. */
export function createD3FlowLayout(input: D3FlowLayoutInput, hostWidth: number): D3FlowLayout {
  const orientation = flowOrientationForWidth(hostWidth);
  const prepared: PreparedNode[] = input.nodes.map((node, inputIndex) => {
    const labelLines = wrapFlowText(node.label, HORIZONTAL_LABEL_WIDTH);
    return {
      ...node,
      inputIndex,
      labelLines,
      width: horizontalNodeWidth(labelLines),
      height: nodeHeight(labelLines),
    };
  });
  const layers = topologicalLayers(input);
  const geometry = input.diagramType === "network"
    ? groupedNetworkLayout(input, prepared, hostWidth)
    : orientation === "horizontal"
      ? horizontalLayeredLayout(input, prepared, layers, hostWidth)
      : verticalLayeredLayout(prepared, layers, hostWidth);

  const nodeById = new Map(geometry.nodes.map((node) => [node.id, node]));
  const edges = input.edges.map((edge) => {
    const source = nodeById.get(edge.sourceNodeId);
    const target = nodeById.get(edge.targetNodeId);
    if (!source || !target) throw new Error(`Flow edge ${edge.id} references an unknown layout node`);

    if (input.diagramType !== "network" && orientation === "horizontal") {
      const forward = target.x >= source.x;
      const x1 = source.x + (forward ? source.width / 2 : -source.width / 2);
      const x2 = target.x + (forward ? -target.width / 2 : target.width / 2);
      return {
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        x1,
        y1: source.y,
        x2,
        y2: target.y,
        labelX: midpoint(x1, x2),
        labelY: midpoint(source.y, target.y) - HORIZONTAL_EDGE_LABEL_CLEARANCE,
        labelLines: wrapFlowText(edge.label, EDGE_LABEL_MAX_WIDTH),
        ...(edge.visualRole ? { visualRole: edge.visualRole } : {}),
      };
    }

    const downward = target.y >= source.y;
    const y1 = source.y + (downward ? source.height / 2 : -source.height / 2);
    const y2 = target.y + (downward ? -target.height / 2 : target.height / 2);
    return {
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      x1: source.x,
      y1,
      x2: target.x,
      y2,
      labelX: midpoint(source.x, target.x) + 20,
      labelY: midpoint(y1, y2),
      labelLines: wrapFlowText(edge.label, EDGE_LABEL_MAX_WIDTH),
      ...(edge.visualRole ? { visualRole: edge.visualRole } : {}),
    };
  });

  return {
    orientation,
    width: geometry.width,
    height: geometry.height,
    nodes: geometry.nodes,
    edges,
    states: (input.states ?? []).map((state) => ({
      id: state.id,
      sharedEdgeAnnotations: state.sharedEdgeAnnotations.map((annotation) => ({ id: annotation.id, edgeIds: [...annotation.edgeIds] })),
    })),
  };
}
