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
  return Math.max(88, 40 + Math.max(lines.length, 1) * 22);
}

function midpoint(a: number, b: number): number {
  return a + (b - a) / 2;
}

/** Deterministic renderer-only geometry derived from canonical array order. */
export function createD3FlowLayout(input: D3FlowLayoutInput, hostWidth: number): D3FlowLayout {
  const orientation = flowOrientationForWidth(hostWidth);
  const margin = 32;
  const horizontalNodeWidth = 220;
  const verticalNodeWidth = Math.max(220, Math.min(360, hostWidth - margin * 2));
  const horizontalGap = 96;
  const verticalGap = 76;
  const labelWidth = 176;

  const nodeInputs = input.nodes.map((node) => ({
    ...node,
    labelLines: wrapFlowText(node.label, (orientation === "horizontal" ? horizontalNodeWidth : verticalNodeWidth) - 32),
  }));

  const nodes: D3FlowLayoutNode[] = [];
  if (orientation === "horizontal") {
    const maxHeight = Math.max(88, ...nodeInputs.map((node) => nodeHeight(node.labelLines)));
    const contentWidth = nodeInputs.length * horizontalNodeWidth + Math.max(0, nodeInputs.length - 1) * horizontalGap;
    const width = Math.max(hostWidth, contentWidth + margin * 2);
    const centerY = margin + maxHeight / 2 + 36;
    let cursorX = margin;
    for (const node of nodeInputs) {
      const height = nodeHeight(node.labelLines);
      nodes.push({ id: node.id, x: cursorX + horizontalNodeWidth / 2, y: centerY, width: horizontalNodeWidth, height, labelLines: node.labelLines });
      cursorX += horizontalNodeWidth + horizontalGap;
    }
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const edges = input.edges.map((edge) => {
      const source = nodeById.get(edge.sourceNodeId);
      const target = nodeById.get(edge.targetNodeId);
      if (!source || !target) throw new Error(`Flow edge ${edge.id} references an unknown layout node`);
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
        labelY: source.y - 24,
        labelLines: wrapFlowText(edge.label, labelWidth),
      };
    });
    const edgeLineCount = Math.max(1, ...edges.map((edge) => edge.labelLines.length));
    return { orientation, width, height: centerY + maxHeight / 2 + margin + edgeLineCount * 22, nodes, edges };
  }

  const width = Math.max(320, hostWidth);
  const centerX = width / 2;
  let cursorY = margin + 36;
  for (const node of nodeInputs) {
    const height = nodeHeight(node.labelLines);
    nodes.push({ id: node.id, x: centerX, y: cursorY + height / 2, width: verticalNodeWidth, height, labelLines: node.labelLines });
    cursorY += height + verticalGap;
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = input.edges.map((edge) => {
    const source = nodeById.get(edge.sourceNodeId);
    const target = nodeById.get(edge.targetNodeId);
    if (!source || !target) throw new Error(`Flow edge ${edge.id} references an unknown layout node`);
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
      labelX: source.x + labelWidth / 2 + 16,
      labelY: midpoint(y1, y2),
      labelLines: wrapFlowText(edge.label, labelWidth),
    };
  });
  const bottom = nodes.length === 0 ? margin : nodes[nodes.length - 1]!.y + nodes[nodes.length - 1]!.height / 2;
  return { orientation, width, height: bottom + margin + 36, nodes, edges };
}
