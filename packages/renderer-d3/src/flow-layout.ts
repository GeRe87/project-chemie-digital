export type D3FlowOrientation = "horizontal" | "vertical";
export type D3FlowLayoutStrategy = "layered-flow" | "grouped-network" | "radial-network" | "triadic-network" | "concentric-network";

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
  readonly groups?: readonly { readonly id: string; readonly label?: string }[];
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

export interface D3FlowLayoutGroup {
  readonly id: string;
  readonly label: string;
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly labelX: number;
  readonly labelY: number;
  readonly memberNodeIds: readonly string[];
}

export interface D3FlowLayout {
  readonly orientation: D3FlowOrientation;
  readonly strategy: D3FlowLayoutStrategy;
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly D3FlowLayoutNode[];
  readonly edges: readonly D3FlowLayoutEdge[];
  readonly groups: readonly D3FlowLayoutGroup[];
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
const HORIZONTAL_LABEL_WIDTH = 178;
const HORIZONTAL_NODE_MIN_WIDTH = 268;
const HORIZONTAL_NODE_MAX_WIDTH = 326;
const HORIZONTAL_NODE_CHROME = 132;
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
  return segmentGraphemes(value).length * 11;
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

interface LayoutRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function edgeLabelRect(edge: D3FlowLayoutEdge): LayoutRect {
  const lineCount = Math.max(edge.labelLines.length, 1);
  const textWidth = Math.max(48, ...edge.labelLines.map((line) => deterministicFlowTextMeasure(line)));
  const compact = textWidth <= 130;
  return {
    x: edge.labelX,
    y: edge.labelY,
    width: textWidth + (compact ? 18 : 26),
    height: Math.max(compact ? 30 : EDGE_LABEL_MIN_HEIGHT, lineCount * EDGE_LABEL_LINE_HEIGHT + EDGE_LABEL_VERTICAL_PADDING),
  };
}

function overlaps(left: LayoutRect, right: LayoutRect, padding = 0): boolean {
  return Math.abs(left.x - right.x) < (left.width + right.width) / 2 + padding
    && Math.abs(left.y - right.y) < (left.height + right.height) / 2 + padding;
}

function insideLayout(rect: LayoutRect, width: number, height: number, margin = 8): boolean {
  return rect.x - rect.width / 2 >= margin
    && rect.x + rect.width / 2 <= width - margin
    && rect.y - rect.height / 2 >= margin
    && rect.y + rect.height / 2 <= height - margin;
}

function translatedEdge(edge: D3FlowLayoutEdge, x: number, y: number): D3FlowLayoutEdge {
  return { ...edge, labelX: x, labelY: y };
}

function candidateEdgeLabelPositions(
  edge: D3FlowLayoutEdge,
  source: D3FlowLayoutNode,
  target: D3FlowLayoutNode,
  strategy: D3FlowLayoutStrategy,
  orientation: D3FlowOrientation,
  layoutWidth: number,
): readonly { readonly x: number; readonly y: number }[] {
  const panel = edgeLabelRect(edge);
  const edgeMidX = midpoint(edge.x1, edge.x2);
  const edgeMidY = midpoint(edge.y1, edge.y2);
  const candidates: Array<{ x: number; y: number }> = [];

  if (strategy === "triadic-network" && Math.abs(source.y - target.y) < 1) {
    const below = Math.max(
      source.y + source.height / 2,
      target.y + target.height / 2,
    ) + panel.height / 2 + 18;
    candidates.push({ x: edgeMidX, y: below });
    candidates.push({ x: edgeMidX, y: below + 24 });
  }

  if (strategy === "layered-flow" && orientation === "vertical") {
    const right = Math.max(
      source.x + source.width / 2,
      target.x + target.width / 2,
    ) + panel.width / 2 + 22;
    const left = Math.min(
      source.x - source.width / 2,
      target.x - target.width / 2,
    ) - panel.width / 2 - 22;
    const preferRight = right + panel.width / 2 <= layoutWidth - 8;
    if (preferRight) {
      candidates.push({ x: right, y: edgeMidY });
      candidates.push({ x: left, y: edgeMidY });
    } else {
      candidates.push({ x: left, y: edgeMidY });
      candidates.push({ x: right, y: edgeMidY });
    }
  }

  if (strategy === "layered-flow" && orientation === "horizontal") {
    const above = Math.min(
      source.y - source.height / 2,
      target.y - target.height / 2,
    ) - panel.height / 2 - 18;
    const below = Math.max(
      source.y + source.height / 2,
      target.y + target.height / 2,
    ) + panel.height / 2 + 18;
    candidates.push({ x: edgeMidX, y: above });
    candidates.push({ x: edgeMidX, y: below });
  }

  candidates.push({ x: edge.labelX, y: edge.labelY });

  const step = 24;
  for (let ring = 1; ring <= 8; ring += 1) {
    if (orientation === "vertical") {
      candidates.push({ x: edge.labelX + ring * step, y: edge.labelY });
      candidates.push({ x: edge.labelX - ring * step, y: edge.labelY });
      candidates.push({ x: edge.labelX + ring * step, y: edge.labelY + ring * 8 });
      candidates.push({ x: edge.labelX - ring * step, y: edge.labelY - ring * 8 });
    } else {
      candidates.push({ x: edge.labelX, y: edge.labelY - ring * step });
      candidates.push({ x: edge.labelX, y: edge.labelY + ring * step });
      candidates.push({ x: edge.labelX + ring * 8, y: edge.labelY - ring * step });
      candidates.push({ x: edge.labelX - ring * 8, y: edge.labelY + ring * step });
    }
  }
  return candidates;
}

function resolveEdgeLabelCollisions(
  edges: readonly D3FlowLayoutEdge[],
  nodes: readonly D3FlowLayoutNode[],
  width: number,
  height: number,
  strategy: D3FlowLayoutStrategy,
  orientation: D3FlowOrientation,
): readonly D3FlowLayoutEdge[] {
  const placedLabelRects: LayoutRect[] = [];
  const nodeRects: LayoutRect[] = nodes.map((node) => ({
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  }));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return edges.map((edge) => {
    const source = nodeById.get(edge.sourceNodeId);
    const target = nodeById.get(edge.targetNodeId);
    if (!source || !target) return edge;

    const candidates = candidateEdgeLabelPositions(edge, source, target, strategy, orientation, width);
    let chosen = edge;
    let chosenRect = edgeLabelRect(edge);

    for (const candidate of candidates) {
      const translated = translatedEdge(edge, candidate.x, candidate.y);
      const rect = edgeLabelRect(translated);
      if (!insideLayout(rect, width, height)) continue;
      if (nodeRects.some((node) => overlaps(rect, node, 10))) continue;
      if (placedLabelRects.some((label) => overlaps(rect, label, 8))) continue;
      chosen = translated;
      chosenRect = rect;
      break;
    }

    placedLabelRects.push(chosenRect);
    return chosen;
  });
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

  const contentOffsetX = Math.max(0, (width - intrinsicWidth) / 2);
  let layerLeft = margin + contentOffsetX;
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
  const clusterRadius = Math.max(280, Math.min(460, 150 + clusterCount * 50 + maxNodeWidth * 0.4));
  const clusterNodeRadius = Math.min(220, Math.max(140, maxNodeWidth * 0.7));
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
    const radius = bucket.length === 1 ? 0 : Math.min(clusterNodeRadius, Math.max(90, 36 + bucket.length * 32 + maxNodeWidth * 0.25));
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
  const maxNodeHeight = Math.max(80, ...prepared.map((node) => node.height));
  return {
    width,
    height: Math.max(520, centerY + clusterRadius + clusterNodeRadius + maxNodeHeight / 2 + NETWORK_MARGIN),
    nodes: prepared.map((node) => nodes.find((candidate) => candidate.id === node.id)!),
  };
}

function isTriadicNetwork(input: D3FlowLayoutInput): boolean {
  if (input.diagramType !== "network" || (input.groups?.length ?? 0) !== 0) return false;
  if (input.nodes.length !== 3 || input.edges.length < 2) return false;
  const connected = new Set<string>();
  for (const edge of input.edges) {
    connected.add(edge.sourceNodeId);
    connected.add(edge.targetNodeId);
  }
  return input.nodes.every((node) => connected.has(node.id));
}

function triadicNetworkLayout(
  prepared: readonly PreparedNode[],
  hostWidth: number,
): { readonly width: number; readonly height: number; readonly nodes: readonly D3FlowLayoutNode[] } {
  const width = Math.max(360, hostWidth);
  const height = Math.max(320, Math.min(390, width * 0.78));
  const nodeWidth = Math.max(158, Math.min(188, width * 0.39));
  const topY = height * 0.24;
  const bottomY = height * 0.68;
  const leftX = width * 0.27;
  const rightX = width * 0.73;
  const positions = [
    { x: width / 2, y: topY },
    { x: rightX, y: bottomY },
    { x: leftX, y: bottomY },
  ] as const;

  return {
    width,
    height,
    nodes: prepared.map((node, index): D3FlowLayoutNode => {
      const labelLines = wrapFlowText(node.label, Math.max(126, nodeWidth - 24));
      const position = positions[index]!;
      return {
        id: node.id,
        x: position.x,
        y: position.y,
        width: nodeWidth,
        height: Math.max(64, 30 + labelLines.length * 21),
        labelLines,
      };
    }),
  };
}

function isCompactRadialNetwork(input: D3FlowLayoutInput): boolean {
  return input.diagramType === "network"
    && (input.groups?.length ?? 0) === 0
    && input.nodes.length >= 3
    && input.nodes.length <= 6
    && input.edges.length >= input.nodes.length - 1;
}

function compactRadialNetworkLayout(
  prepared: readonly PreparedNode[],
  hostWidth: number,
): { readonly width: number; readonly height: number; readonly nodes: readonly D3FlowLayoutNode[] } {
  const width = Math.max(FLOW_MIN_WIDTH, hostWidth);
  const height = Math.max(320, Math.min(450, width * 0.9));
  const centerX = width / 2;
  const centerY = height / 2;
  const nodeWidth = Math.max(146, Math.min(176, width * 0.39));
  const radiusX = Math.max(96, Math.min(width * 0.32, (width - nodeWidth) / 2 - 14));
  const radiusY = Math.max(96, Math.min(height * 0.34, (height - 68) / 2 - 16));

  const nodes = prepared.map((node, index): D3FlowLayoutNode => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / prepared.length;
    const labelLines = wrapFlowText(node.label, Math.max(118, nodeWidth - 28));
    return {
      id: node.id,
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
      width: nodeWidth,
      height: Math.max(62, 28 + labelLines.length * 21),
      labelLines,
    };
  });
  return { width, height, nodes };
}

function networkEdgeGeometry(
  source: D3FlowLayoutNode,
  target: D3FlowLayoutNode,
  layoutCenter?: { readonly x: number; readonly y: number },
): Pick<D3FlowLayoutEdge, "x1" | "y1" | "x2" | "y2" | "labelX" | "labelY"> {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const boundaryScale = (node: D3FlowLayoutNode): number => {
    const normalizedX = Math.abs(dx) / Math.max(node.width / 2, 1);
    const normalizedY = Math.abs(dy) / Math.max(node.height / 2, 1);
    return 1 / Math.max(normalizedX, normalizedY, 1e-6);
  };
  const sourceScale = boundaryScale(source);
  const targetScale = boundaryScale(target);
  const x1 = source.x + dx * sourceScale;
  const y1 = source.y + dy * sourceScale;
  const x2 = target.x - dx * targetScale;
  const y2 = target.y - dy * targetScale;
  const edgeMidX = midpoint(x1, x2);
  const edgeMidY = midpoint(y1, y2);

  if (layoutCenter) {
    const outwardX = edgeMidX - layoutCenter.x;
    const outwardY = edgeMidY - layoutCenter.y;
    const outwardLength = Math.hypot(outwardX, outwardY) || 1;
    const labelOffset = 30;
    return {
      x1,
      y1,
      x2,
      y2,
      labelX: edgeMidX + (outwardX / outwardLength) * labelOffset,
      labelY: edgeMidY + (outwardY / outwardLength) * labelOffset,
    };
  }

  const length = Math.hypot(dx, dy) || 1;
  const labelOffset = 16;
  return {
    x1,
    y1,
    x2,
    y2,
    labelX: edgeMidX - (dy / length) * labelOffset,
    labelY: edgeMidY + (dx / length) * labelOffset,
  };
}

function isConcentricNetwork(input: D3FlowLayoutInput): boolean {
  if (input.diagramType !== "network" || !input.focusNodeId || input.edges.length !== 0) return false;
  const groups = input.groups ?? [];
  if (groups.length < 2) return false;
  const groupIds = new Set(groups.map((group) => group.id));
  const members = input.nodes.filter((node) => node.id !== input.focusNodeId);
  if (members.length === 0) return false;
  if (!groups.every((group) => members.some((node) => node.groupIds?.includes(group.id)))) return false;
  return members.every((node) => {
    const memberships = (node.groupIds ?? []).filter((groupId) => groupIds.has(groupId));
    return memberships.length === 1;
  });
}

function concentricNetworkLayout(
  input: D3FlowLayoutInput,
  prepared: readonly PreparedNode[],
  hostWidth: number,
): {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly D3FlowLayoutNode[];
  readonly groups: readonly D3FlowLayoutGroup[];
} {
  const groups = input.groups ?? [];
  const focusNode = prepared.find((node) => node.id === input.focusNodeId);
  if (!focusNode) throw new Error("Concentric network requires its focus node in the node set");

  const groupRadius = (index: number): number => 205 + index * 145;
  const outerRadius = groupRadius(Math.max(0, groups.length - 1));
  const width = Math.max(780, Math.min(hostWidth, 1040), outerRadius * 2 + 180);
  const height = Math.max(740, outerRadius * 2 + 120);
  const cx = width / 2;
  const cy = outerRadius + 58;
  const nodes: D3FlowLayoutNode[] = [];
  const layoutGroups: D3FlowLayoutGroup[] = [];

  const focusDiameter = 166;
  const focusLines = wrapFlowText(focusNode.label, focusDiameter - 42);
  nodes.push({
    id: focusNode.id,
    x: cx,
    y: cy,
    width: focusDiameter,
    height: focusDiameter,
    labelLines: focusLines,
  });

  groups.forEach((group, groupIndex) => {
    const members = prepared.filter((node) => node.id !== focusNode.id && node.groupIds?.includes(group.id));
    const radius = groupRadius(groupIndex);
    const arcAllowance = members.length > 0 ? (2 * Math.PI * radius) / members.length : 180;
    const minimumDiameter = groupIndex === 0 ? 156 : 126;
    const maximumDiameter = groupIndex === 0 ? 174 : 142;
    const availableDiameter = Math.max(minimumDiameter, Math.min(maximumDiameter, arcAllowance * 0.74));
    const memberLayouts = members.map((node, memberIndex): D3FlowLayoutNode => {
      const angle = -Math.PI / 2 + (2 * Math.PI * memberIndex) / Math.max(1, members.length);
      const wrapWidth = Math.max(
        groupIndex === 0 ? 132 : 108,
        availableDiameter - (groupIndex === 0 ? 16 : 14),
      );
      const labelLines = wrapFlowText(node.label, wrapWidth);
      const textHeight = Math.max(1, labelLines.length) * 17;
      const longestLine = Math.max(0, ...labelLines.map((line) => deterministicFlowTextMeasure(line)));
      const textDiameter = Math.max(longestLine + 28, textHeight + 38);
      const diameter = Math.max(
        minimumDiameter,
        Math.min(maximumDiameter, Math.max(availableDiameter, textDiameter)),
      );
      return {
        id: node.id,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        width: diameter,
        height: diameter,
        labelLines,
      };
    });
    const maxMemberHeight = Math.max(0, ...memberLayouts.map((node) => node.height));
    const labelClearance = Math.max(54, maxMemberHeight / 2 + 28);
    layoutGroups.push({
      id: group.id,
      label: group.label ?? group.id,
      cx,
      cy,
      radius,
      labelX: cx,
      labelY: cy - radius - labelClearance,
      memberNodeIds: members.map((node) => node.id),
    });
    nodes.push(...memberLayouts);
  });

  return {
    width,
    height,
    nodes: prepared.map((node) => nodes.find((candidate) => candidate.id === node.id)!),
    groups: layoutGroups,
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
  const concentric = isConcentricNetwork(input)
    ? concentricNetworkLayout(input, prepared, hostWidth)
    : undefined;
  const triadic = !concentric && isTriadicNetwork(input)
    ? triadicNetworkLayout(prepared, hostWidth)
    : undefined;
  const radial = !concentric && !triadic && isCompactRadialNetwork(input)
    ? compactRadialNetworkLayout(prepared, hostWidth)
    : undefined;
  const geometry = concentric
    ?? triadic
    ?? radial
    ?? (input.diagramType === "network"
      ? groupedNetworkLayout(input, prepared, hostWidth)
      : orientation === "horizontal"
        ? horizontalLayeredLayout(input, prepared, layers, hostWidth)
        : verticalLayeredLayout(prepared, layers, hostWidth));

  const nodeById = new Map(geometry.nodes.map((node) => [node.id, node]));
  const rawEdges = input.edges.map((edge) => {
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

    if (input.diagramType === "network") {
      return {
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        ...networkEdgeGeometry(
          source,
          target,
          radial || triadic ? { x: geometry.width / 2, y: geometry.height / 2 } : undefined,
        ),
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

  const strategy: D3FlowLayoutStrategy = concentric
    ? "concentric-network"
    : triadic
      ? "triadic-network"
      : radial
        ? "radial-network"
        : input.diagramType === "network"
          ? "grouped-network"
          : "layered-flow";
  const edges = resolveEdgeLabelCollisions(
    rawEdges,
    geometry.nodes,
    geometry.width,
    geometry.height,
    strategy,
    orientation,
  );

  return {
    orientation,
    strategy,
    width: geometry.width,
    height: geometry.height,
    nodes: geometry.nodes,
    edges,
    groups: concentric?.groups ?? [],
    states: (input.states ?? []).map((state) => ({
      id: state.id,
      sharedEdgeAnnotations: state.sharedEdgeAnnotations.map((annotation) => ({ id: annotation.id, edgeIds: [...annotation.edgeIds] })),
    })),
  };
}
