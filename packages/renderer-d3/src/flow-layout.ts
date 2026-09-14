export type D3FlowOrientation = "horizontal" | "vertical";

export interface D3FlowLayoutNodeInput {
  readonly id: string;
  readonly label: string;
}

export interface D3FlowLayoutEdgeInput {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly label: string;
}

export interface D3FlowLayoutInput {
  readonly nodes: readonly D3FlowLayoutNodeInput[];
  readonly edges: readonly D3FlowLayoutEdgeInput[];
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
}

export interface D3FlowLayout {
  readonly orientation: D3FlowOrientation;
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly D3FlowLayoutNode[];
  readonly edges: readonly D3FlowLayoutEdge[];
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
  readonly height: number;
}

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
  return hostWidth < 900 ? "vertical" : "horizontal";
}

function nodeHeight(lines: readonly string[]): number {
  return Math.max(104, 52 + Math.max(lines.length, 1) * 24);
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
  const nodeWidth = 250;
  const layerGap = 44;
  const siblingGap = 22;
  const nodeById = new Map(prepared.map((node) => [node.id, node]));
  const layerHeights = layers.map((layer) =>
    layer.reduce((sum, id) => sum + (nodeById.get(id)?.height ?? 104), 0) + Math.max(0, layer.length - 1) * siblingGap,
  );
  const contentHeight = Math.max(104, ...layerHeights);
  const width = Math.max(hostWidth, margin * 2 + layers.length * nodeWidth + Math.max(0, layers.length - 1) * layerGap);
  const height = margin * 2 + contentHeight + 34;
  const byId = new Map<string, D3FlowLayoutNode>();

  layers.forEach((layer, layerIndex) => {
    const layerHeight = layerHeights[layerIndex] ?? 0;
    let cursorY = margin + 17 + (contentHeight - layerHeight) / 2;
    const x = margin + nodeWidth / 2 + layerIndex * (nodeWidth + layerGap);
    for (const id of layer) {
      const node = nodeById.get(id)!;
      byId.set(id, {
        id,
        x,
        y: cursorY + node.height / 2,
        width: nodeWidth,
        height: node.height,
        labelLines: node.labelLines,
      });
      cursorY += node.height + siblingGap;
    }
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
  const width = Math.max(320, hostWidth);
  const byId = new Map<string, D3FlowLayoutNode>();
  let cursorY = margin + 22;

  for (const layer of layers) {
    const availableWidth = Math.max(180, width - margin * 2 - Math.max(0, layer.length - 1) * siblingGap);
    const nodeWidth = Math.max(180, Math.min(390, availableWidth / Math.max(1, layer.length)));
    const layerNodes = layer.map((id) => {
      const original = nodeById.get(id)!;
      const labelLines = wrapFlowText(original.label, nodeWidth - 38);
      return { ...original, labelLines, height: nodeHeight(labelLines) };
    });
    const layerHeight = Math.max(104, ...layerNodes.map((node) => node.height));
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

/** Deterministic renderer-only geometry derived from graph topology and canonical array order. */
export function createD3FlowLayout(input: D3FlowLayoutInput, hostWidth: number): D3FlowLayout {
  const orientation = flowOrientationForWidth(hostWidth);
  const horizontalNodeWidth = 250;
  const labelWidth = 190;
  const prepared: PreparedNode[] = input.nodes.map((node, inputIndex) => {
    const labelLines = wrapFlowText(node.label, horizontalNodeWidth - 38);
    return { ...node, inputIndex, labelLines, height: nodeHeight(labelLines) };
  });
  const layers = topologicalLayers(input);
  const geometry = orientation === "horizontal"
    ? horizontalLayeredLayout(input, prepared, layers, hostWidth)
    : verticalLayeredLayout(prepared, layers, hostWidth);

  const nodeById = new Map(geometry.nodes.map((node) => [node.id, node]));
  const edges = input.edges.map((edge) => {
    const source = nodeById.get(edge.sourceNodeId);
    const target = nodeById.get(edge.targetNodeId);
    if (!source || !target) throw new Error(`Flow edge ${edge.id} references an unknown layout node`);

    if (orientation === "horizontal") {
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
        labelY: midpoint(source.y, target.y) - 20,
        labelLines: wrapFlowText(edge.label, labelWidth),
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
      labelLines: wrapFlowText(edge.label, labelWidth),
    };
  });

  return {
    orientation,
    width: geometry.width,
    height: geometry.height,
    nodes: geometry.nodes,
    edges,
  };
}
