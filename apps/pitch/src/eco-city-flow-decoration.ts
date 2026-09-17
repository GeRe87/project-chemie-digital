import "./eco-city-flow-decoration.css";

const SVG_NS = "http://www.w3.org/2000/svg";
const OPENING_WORKFLOW_SCENE = '[id="ex:scene-cogniflow-coupling-problem--scene"]';
const LABORATORY_DIVERSITY_SCENE = '[id="ex:scene-cogniflow-laboratory-diversity--scene"]';
const SECONDARY_WORKFLOW_NODE_IDS = new Set([
  "ex:node-cogniflow-common-analysis-b",
  "ex:node-cogniflow-common-meas-data-b",
  "ex:node-cogniflow-common-open-format-b",
  "ex:node-cogniflow-common-results-b",
]);
const SECONDARY_WORKFLOW_ROW_GAP = 50;
const ANALYSIS_METHOD_LABELS = new Map([
  ["ex:node-cogniflow-common-analysis", "LC-MS"],
  ["ex:node-cogniflow-common-analysis-b", "GC-MS"],
]);
const CUSTOM_SCRIPT_EDGE_TARGETS = new Set([
  "ex:edge-cogniflow-common-open-results",
  "ex:edge-cogniflow-common-open-b-results",
]);

function isSecondaryWorkflowEdge(sourceNodeId: string, targetNodeId: string): boolean {
  return SECONDARY_WORKFLOW_NODE_IDS.has(sourceNodeId) || SECONDARY_WORKFLOW_NODE_IDS.has(targetNodeId);
}

function isCustomScriptEdge(edgeId: string): boolean {
  return CUSTOM_SCRIPT_EDGE_TARGETS.has(edgeId);
}

function offsetSecondaryWorkflowElement(element: SVGElement): void {
  if (element.dataset.secondaryWorkflowOffset === "true") return;
  const transform = element.getAttribute("transform") ?? "";
  const match = /^translate\(([-+0-9.eE]+)[ ,]+([-+0-9.eE]+)\)$/u.exec(transform.trim());
  const x = match ? Number(match[1]) : 0;
  const y = match ? Number(match[2]) : 0;
  element.setAttribute("transform", `translate(${x} ${y + SECONDARY_WORKFLOW_ROW_GAP})`);
  element.dataset.secondaryWorkflowOffset = "true";
}

function numberAttribute(element: Element, name: string): number | undefined {
  const raw = element.getAttribute(name);
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function steppedRectPath(x: number, y: number, width: number, height: number, step: number): string {
  const s = Math.max(2, Math.min(step, width / 4, height / 4));
  const right = x + width;
  const bottom = y + height;
  return [
    `M ${x + s} ${y}`,
    `H ${right - s}`,
    `V ${y + s / 2}`,
    `H ${right - s / 2}`,
    `V ${y + s}`,
    `H ${right}`,
    `V ${bottom - s}`,
    `H ${right - s / 2}`,
    `V ${bottom - s / 2}`,
    `H ${right - s}`,
    `V ${bottom}`,
    `H ${x + s}`,
    `V ${bottom - s / 2}`,
    `H ${x + s / 2}`,
    `V ${bottom - s}`,
    `H ${x}`,
    `V ${y + s}`,
    `H ${x + s / 2}`,
    `V ${y + s / 2}`,
    `H ${x + s}`,
    "Z",
  ].join(" ");
}

function numberTabPath(x: number, y: number, width: number, height: number, step: number): string {
  const s = Math.max(2, Math.min(step, width / 4, height / 5));
  const right = x + width;
  const bottom = y + height;
  return [
    `M ${x + s} ${y}`,
    `H ${right - s}`,
    `V ${y + s}`,
    `H ${right}`,
    `V ${bottom - s}`,
    `H ${right - s}`,
    `V ${bottom}`,
    `H ${x + s}`,
    `V ${bottom - s / 2}`,
    `H ${x}`,
    `V ${y + s / 2}`,
    `H ${x + s}`,
    "Z",
  ].join(" ");
}

function createPath(className: string, d: string): SVGPathElement {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("class", className);
  path.setAttribute("d", d);
  path.setAttribute("vector-effect", "non-scaling-stroke");
  path.setAttribute("aria-hidden", "true");
  return path;
}

function createRect(className: string, x: number, y: number, width: number, height: number): SVGRectElement {
  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("class", className);
  rect.setAttribute("x", String(x));
  rect.setAttribute("y", String(y));
  rect.setAttribute("width", String(width));
  rect.setAttribute("height", String(height));
  rect.setAttribute("aria-hidden", "true");
  return rect;
}

function createStatusMarker(cx: number, cy: number, size: number): SVGRectElement {
  const led = createRect("d3-flow-pixel-node-led", cx - size / 2, cy - size / 2, size, size);
  led.setAttribute("rx", String(size / 2));
  led.setAttribute("ry", String(size / 2));
  return led;
}

function createText(className: string, x: number, y: number, value: string): SVGTextElement {
  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("class", className);
  text.setAttribute("x", String(x));
  text.setAttribute("y", String(y));
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("aria-hidden", "true");
  text.textContent = value;
  return text;
}

function createSocket(x: number, y: number, size: number): SVGRectElement {
  return createRect("d3-flow-pixel-socket", x - size / 2, y - size / 2, size, size);
}

function createScene2Connector(x: number, y: number): SVGGElement {
  const connector = document.createElementNS(SVG_NS, "g");
  connector.setAttribute("class", "d3-flow-pixel-connector");
  connector.setAttribute("aria-hidden", "true");
  connector.append(
    createRect("d3-flow-pixel-connector-shadow", x - 7, y - 4, 18, 12),
    createRect("d3-flow-pixel-connector-shell", x - 9, y - 6, 18, 12),
    createRect("d3-flow-pixel-connector-core", x - 7, y - 4, 14, 8),
    createRect("d3-flow-pixel-connector-contact", x - 2, y - 3, 4, 6),
  );
  return connector;
}

interface NodeBounds {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly centerX: number;
  readonly centerY: number;
}

interface EdgeEndpoints {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

function edgeEndpoints(element: SVGGraphicsElement): EdgeEndpoints | undefined {
  const x1 = numberAttribute(element, "x1");
  const y1 = numberAttribute(element, "y1");
  const x2 = numberAttribute(element, "x2");
  const y2 = numberAttribute(element, "y2");
  if (x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined) {
    return { x1, y1, x2, y2 };
  }

  if (element instanceof SVGPathElement) {
    try {
      const length = element.getTotalLength();
      if (!Number.isFinite(length)) return undefined;
      const start = element.getPointAtLength(0);
      const end = element.getPointAtLength(length);
      return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function translatedNodeBounds(svg: SVGSVGElement, nodeId: string): NodeBounds | undefined {
  const group = svg.querySelector<SVGGElement>(`.d3-flow-node[data-node-id="${CSS.escape(nodeId)}"]`);
  const shape = group?.querySelector<SVGRectElement>(".d3-flow-node-shape");
  if (!group || !shape) return undefined;

  const transform = group.getAttribute("transform") ?? "";
  const match = /^translate\(([-+0-9.eE]+)[ ,]+([-+0-9.eE]+)\)$/u.exec(transform.trim());
  const offsetX = match ? Number(match[1]) : Number.NaN;
  const offsetY = match ? Number(match[2]) : Number.NaN;
  const x = numberAttribute(shape, "x");
  const y = numberAttribute(shape, "y");
  const width = numberAttribute(shape, "width");
  const height = numberAttribute(shape, "height");
  if (![offsetX, offsetY, x, y, width, height].every(Number.isFinite)) return undefined;

  const left = offsetX + (x as number);
  const top = offsetY + (y as number);
  const right = left + (width as number);
  const bottom = top + (height as number);
  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  };
}

function decorateNode(svg: SVGSVGElement, group: SVGGElement, readingIndex: number): void {
  if (group.dataset.pixelDecorated === "true") return;
  const shape = group.querySelector<SVGRectElement>(".d3-flow-node-shape");
  if (!shape) return;
  const x = numberAttribute(shape, "x");
  let y = numberAttribute(shape, "y");
  const width = numberAttribute(shape, "width");
  let height = numberAttribute(shape, "height");
  const nodeId = group.getAttribute("data-node-id");
  if (x === undefined || y === undefined || width === undefined || height === undefined || !nodeId) return;

  const scene2 = svg.closest(OPENING_WORKFLOW_SCENE) !== null;
  // Only the presentation shell changes; node centers, order and labels remain
  // renderer-owned. Keep the hidden hit shape aligned for bounds and callouts.
  if (scene2 && svg.getAttribute("data-orientation") === "horizontal") {
    const shellHeight = Math.max(88, height - 24);
    y += (height - shellHeight) / 2;
    height = shellHeight;
    shape.setAttribute("y", String(y));
    shape.setAttribute("height", String(height));
  }

  const shadow = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-shadow", steppedRectPath(x, y, width, height, 6));
  shadow.setAttribute("transform", "translate(3 3)");
  const outer = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-outer", steppedRectPath(x, y, width, height, 6));
  const middle = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-middle", steppedRectPath(x + 3, y + 3, width - 6, height - 6, 5));
  const inner = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-inner", steppedRectPath(x + 5, y + 5, width - 10, height - 10, 4));

  const tabWidth = Math.min(48, Math.max(42, width * 0.17));
  const tabX = x + (scene2 ? 8 : 11);
  const tabY = y + (scene2 ? 8 : 14);
  const tabHeight = Math.max(26, height - (scene2 ? 16 : 28));
  const tab = createPath("d3-flow-pixel-node-tab", scene2
    ? `M ${tabX + 6} ${tabY} H ${tabX + tabWidth} V ${tabY + tabHeight} H ${tabX + 6} V ${tabY + tabHeight - 3} H ${tabX + 3} V ${tabY + tabHeight - 6} H ${tabX} V ${tabY + 6} H ${tabX + 3} V ${tabY + 3} H ${tabX + 6} Z`
    : numberTabPath(tabX, tabY, tabWidth, tabHeight, 5));
  const number = createText(
    "d3-flow-pixel-node-number",
    tabX + tabWidth / 2 - 1,
    y + height / 2 + 1,
    String(readingIndex + 1).padStart(2, "0"),
  );
  const led = createStatusMarker(x + width - 18, y + 18, 11);
  const method = ANALYSIS_METHOD_LABELS.get(nodeId);

  group.insertBefore(shadow, shape);
  group.insertBefore(outer, shape);
  group.insertBefore(middle, shape);
  group.insertBefore(inner, shape);
  group.insertBefore(tab, shape);
  if (scene2) {
    group.insertBefore(createRect("d3-flow-pixel-node-divider", tabX + tabWidth, tabY, 3, tabHeight), shape);
  }
  group.insertBefore(number, shape);
  group.insertBefore(led, shape);
  if (method) {
    const methodLabel = createText("d3-flow-pixel-method-label", x - 18, y + height / 2, method);
    methodLabel.setAttribute("text-anchor", "end");
    group.insertBefore(methodLabel, shape);
  }

  const label = group.querySelector<SVGTextElement>(".d3-flow-node-label");
  if (label) {
    const labelOffset = Math.min(27, tabWidth * 0.55);
    label.setAttribute("x", String(labelOffset));
    label.setAttribute("dominant-baseline", "middle");
    for (const tspan of Array.from(label.querySelectorAll<SVGTSpanElement>("tspan"))) {
      tspan.setAttribute("x", String(labelOffset));
    }
  }

  const orientation = svg.getAttribute("data-orientation") ?? "horizontal";
  const hasIncoming = svg.querySelector(`.d3-flow-edge[data-target-node-id="${CSS.escape(nodeId)}"]`) !== null;
  const hasOutgoing = svg.querySelector(`.d3-flow-edge[data-source-node-id="${CSS.escape(nodeId)}"]`) !== null;
  const socketSize = 15;
  if (orientation === "horizontal") {
    if (hasIncoming) group.insertBefore(scene2 ? createScene2Connector(x, 0) : createSocket(x, 0, socketSize), shape);
    if (hasOutgoing) group.insertBefore(scene2 ? createScene2Connector(x + width, 0) : createSocket(x + width, 0, socketSize), shape);
  } else {
    if (hasIncoming) group.insertBefore(createSocket(0, y, socketSize), shape);
    if (hasOutgoing) group.insertBefore(createSocket(0, y + height, socketSize), shape);
  }

  shape.classList.add("d3-flow-node-shape-base");
  group.dataset.pixelDecorated = "true";
}

interface CustomScriptAnchor {
  readonly x: number;
  readonly y: number;
  readonly secondary: boolean;
}

function decorateEdges(svg: SVGSVGElement): void {
  const scene2 = svg.closest(OPENING_WORKFLOW_SCENE) !== null && svg.getAttribute("data-orientation") === "horizontal";
  const laboratory = svg.closest(LABORATORY_DIVERSITY_SCENE) !== null;
  const edges = Array.from(svg.querySelectorAll<SVGGraphicsElement>(".d3-flow-edge"));
  const labels = Array.from(svg.querySelectorAll<SVGTextElement>(".d3-flow-edge-label"));
  const nodeLayer = svg.querySelector<SVGGElement>(".d3-flow-node-layer");
  let flowCenterY = 0;
  try {
    const box = nodeLayer?.getBBox();
    if (box) flowCenterY = box.y + box.height / 2;
  } catch {
    flowCenterY = 0;
  }
  const customScriptAnchors: CustomScriptAnchor[] = [];

  edges.forEach((edge, index) => {
    if (edge.dataset.pixelDecorated === "true") return;
    const sourceNodeId = edge.getAttribute("data-source-node-id") ?? "";
    const targetNodeId = edge.getAttribute("data-target-node-id") ?? "";
    const customScript = isCustomScriptEdge(edge.getAttribute("data-edge-id") ?? "");
    const secondaryWorkflow = isSecondaryWorkflowEdge(sourceNodeId, targetNodeId);
    if (secondaryWorkflow) offsetSecondaryWorkflowElement(edge);
    const endpoints = edgeEndpoints(edge);
    if (!endpoints) return;
    let x1 = endpoints.x1;
    let x2 = endpoints.x2;
    let y1 = endpoints.y1 + (secondaryWorkflow ? SECONDARY_WORKFLOW_ROW_GAP : 0);
    let y2 = endpoints.y2 + (secondaryWorkflow ? SECONDARY_WORKFLOW_ROW_GAP : 0);
    const sourceBounds = translatedNodeBounds(svg, sourceNodeId);
    const targetBounds = translatedNodeBounds(svg, targetNodeId);
    if (laboratory && sourceBounds && targetBounds) {
      const sourceOnLeft = sourceBounds.centerX < targetBounds.centerX;
      x1 = sourceOnLeft ? sourceBounds.right : sourceBounds.left;
      x2 = sourceOnLeft ? targetBounds.left : targetBounds.right;
      y1 = sourceBounds.centerY;
      y2 = targetBounds.centerY;
    }
    const middleX = x1 + (x2 - x1) / 2;
    const isHorizontal = Math.abs(y2 - y1) < 1;
    const d = isHorizontal
      ? `M ${x1} ${y1} H ${x2}`
      : `M ${x1} ${y1} H ${middleX} V ${y2} H ${x2}`;
    const path = createPath("d3-flow-pixel-edge-path", d);
    path.setAttribute("data-source-node-id", sourceNodeId);
    path.setAttribute("data-target-node-id", targetNodeId);
    if (secondaryWorkflow) path.dataset.secondaryWorkflow = "true";
    edge.parentNode?.insertBefore(path, edge);
    edge.dataset.pixelDecorated = "true";

    const label = labels[index];
    if (!label) return;
    if (secondaryWorkflow) label.dataset.secondaryWorkflow = "true";
    if (customScript) label.dataset.customScriptAnnotation = "true";

    let labelX = middleX;
    let labelY = Math.min(y1, y2) - 24;
    if (sourceBounds && targetBounds) {
      if (isHorizontal) {
        labelX = (sourceBounds.right + targetBounds.left) / 2;
        labelY = Math.min(sourceBounds.top, targetBounds.top) - 24;
      } else {
        const sourceDistance = Math.abs(sourceBounds.centerY - flowCenterY);
        const targetDistance = Math.abs(targetBounds.centerY - flowCenterY);
        const outer = sourceDistance >= targetDistance ? sourceBounds : targetBounds;
        const above = outer.centerY < flowCenterY;
        labelX = (sourceBounds.right + targetBounds.left) / 2;
        labelY = above
          ? Math.min(sourceBounds.top, targetBounds.top) - 24
          : Math.max(sourceBounds.bottom, targetBounds.bottom) + 30;
      }
      if (scene2) {
        labelY = Math.min(sourceBounds.top, targetBounds.top) - 50;
        if (!isHorizontal) {
          const sourceIsOuter = Math.abs(sourceBounds.centerY - flowCenterY) >= Math.abs(targetBounds.centerY - flowCenterY);
          const outer = sourceIsOuter ? sourceBounds : targetBounds;
          // Above each card, away from the vertical routing trunk so the
          // callout stays paired with its source or target node.
          labelX = outer.centerX + (sourceIsOuter ? 1 : -1) * (outer.right - outer.left) * 0.3;
          labelY = outer.top - (outer.centerY > flowCenterY ? 42 : 50);
        }
      }
    }

    label.setAttribute("x", String(labelX));
    label.setAttribute("y", String(labelY));
    for (const tspan of Array.from(label.querySelectorAll<SVGTSpanElement>("tspan"))) {
      tspan.setAttribute("x", String(labelX));
    }

    let box: DOMRect | SVGRect;
    try {
      box = label.getBBox();
    } catch {
      return;
    }
    if (!(box.width > 0) || !(box.height > 0)) return;
    const padX = scene2 ? 14 : 10;
    const padY = scene2 ? 9 : 6;
    const pill = createPath(
      "d3-flow-pixel-edge-pill",
      steppedRectPath(box.x - padX, box.y - padY, box.width + padX * 2, box.height + padY * 2, scene2 ? 8 : 5),
    );
    if (secondaryWorkflow) pill.dataset.secondaryWorkflow = "true";
    if (customScript) pill.dataset.customScriptAnnotation = "true";

    // For horizontal edges the connection line runs through the node centers.
    // Extend the stem so the callout visually meets the edge path.
    const edgeY = isHorizontal
      ? (y1 + y2) / 2
      : sourceBounds && targetBounds
        ? (sourceBounds.centerY + targetBounds.centerY) / 2
        : flowCenterY;
    const labelAboveFlow = labelY < edgeY;
    const stemStartY = labelAboveFlow ? box.y + box.height + padY : box.y - padY;
    const stemEndY = isHorizontal
      ? edgeY
      : stemStartY + (labelAboveFlow ? 13 : -13);
    const stem = scene2 ? document.createElementNS(SVG_NS, "g") : createPath(
      "d3-flow-pixel-edge-path d3-flow-pixel-edge-stem",
      `M ${labelX} ${stemStartY} V ${stemEndY}`,
    );
    if (scene2) {
      stem.setAttribute("class", "d3-flow-pixel-edge-path d3-flow-pixel-edge-stem");
      stem.setAttribute("aria-hidden", "true");
      // Filled squares descending from the above-card pill to the edge path.
      const step = 6;
      const dotSize = 3;
      const start = labelAboveFlow ? stemStartY + 4 : stemStartY - 4;
      const direction = labelAboveFlow ? 1 : -1;
      for (let dotY = start; (labelAboveFlow ? dotY < stemEndY : dotY > stemEndY); dotY += direction * step) {
        stem.append(createRect("d3-flow-pixel-stem-dot", labelX - dotSize / 2, dotY, dotSize, dotSize));
      }
    } else {
      stem.setAttribute("data-source-node-id", sourceNodeId);
      stem.setAttribute("data-target-node-id", targetNodeId);
      stem.setAttribute("style", "stroke-width:2px;stroke-dasharray:3 2;filter:none");
    }
    if (secondaryWorkflow) stem.dataset.secondaryWorkflow = "true";
    if (customScript) stem.dataset.customScriptAnnotation = "true";
    label.parentNode?.insertBefore(stem, label);
    label.parentNode?.insertBefore(pill, label);
    label.dataset.pixelDecorated = "true";
    if (customScript) customScriptAnchors.push({ x: middleX, y: (y1 + y2) / 2, secondary: secondaryWorkflow });
  });

  if (!scene2 || customScriptAnchors.length !== 2 || svg.querySelector("[data-custom-script-consolidation]")) return;
  const primary = customScriptAnchors.find((anchor) => !anchor.secondary);
  const secondary = customScriptAnchors.find((anchor) => anchor.secondary);
  if (!primary || !secondary) return;

  const label = createText(
    "d3-flow-pixel-consolidated-annotation-label",
    (primary.x + secondary.x) / 2,
    (primary.y + secondary.y) / 2,
    "one custom script ?",
  );
  label.dataset.customScriptConsolidation = "true";
  svg.append(label);
  let box: DOMRect | SVGRect;
  try {
    box = label.getBBox();
  } catch {
    label.remove();
    return;
  }
  const pill = createPath(
    "d3-flow-pixel-consolidated-annotation-pill",
    steppedRectPath(box.x - 22, box.y - 9, box.width + 44, box.height + 18, 8),
  );
  pill.dataset.customScriptConsolidation = "true";
  label.before(pill);

  const stems = document.createElementNS(SVG_NS, "g");
  stems.setAttribute("class", "d3-flow-pixel-consolidated-annotation-stems");
  stems.setAttribute("aria-hidden", "true");
  stems.dataset.customScriptConsolidation = "true";
  const dotSize = 3;
  const step = 6;
  const x = (primary.x + secondary.x) / 2;
  for (let y = box.y - 4; y > primary.y; y -= step) {
    stems.append(createRect("d3-flow-pixel-stem-dot", x - dotSize / 2, y, dotSize, dotSize));
  }
  for (let y = box.y + box.height + 4; y < secondary.y; y += step) {
    stems.append(createRect("d3-flow-pixel-stem-dot", x - dotSize / 2, y, dotSize, dotSize));
  }
  label.before(stems);
}

function fitViewBoxToFlow(svg: SVGSVGElement): void {
  // The generic flow renderer owns the linear workflow's complete viewBox. The
  // former dependency graph needed a compact crop, but applying that crop to
  // four horizontal layers cuts cards and connector paths out of the SVG.
  if (svg.closest(OPENING_WORKFLOW_SCENE) !== null) return;
  const nodeLayer = svg.querySelector<SVGGElement>(".d3-flow-node-layer");
  const edgeLayer = svg.querySelector<SVGGElement>(".d3-flow-edge-layer");
  if (!nodeLayer || !edgeLayer) return;

  let nodeBox: DOMRect | SVGRect;
  let edgeBox: DOMRect | SVGRect;
  try {
    nodeBox = nodeLayer.getBBox();
    edgeBox = edgeLayer.getBBox();
  } catch {
    return;
  }

  const minX = Math.min(nodeBox.x, edgeBox.x);
  const minY = Math.min(nodeBox.y, edgeBox.y);
  const maxX = Math.max(nodeBox.x + nodeBox.width, edgeBox.x + edgeBox.width);
  const maxY = Math.max(nodeBox.y + nodeBox.height, edgeBox.y + edgeBox.height);
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  if (!(contentWidth > 0) || !(contentHeight > 0)) return;

  const padX = Math.max(22, contentWidth * 0.022);
  const padY = Math.max(20, contentHeight * 0.06);
  const viewWidth = contentWidth + padX * 2;
  const viewHeight = contentHeight + padY * 2;
  svg.setAttribute("viewBox", `${minX - padX} ${minY - padY} ${viewWidth} ${viewHeight}`);
  svg.removeAttribute("height");
  svg.style.aspectRatio = `${viewWidth} / ${viewHeight}`;
  svg.dataset.ecoCityFit = "true";
}

function decorateSvg(svg: SVGSVGElement): void {
  const nodes = Array.from(svg.querySelectorAll<SVGGElement>(".d3-flow-node"));
  nodes.forEach((group, index) => {
    if (SECONDARY_WORKFLOW_NODE_IDS.has(group.getAttribute("data-node-id") ?? "")) {
      group.dataset.secondaryWorkflow = "true";
      offsetSecondaryWorkflowElement(group);
    }
    decorateNode(svg, group, index);
  });
  decorateEdges(svg);
  fitViewBoxToFlow(svg);
}

function decorateRoot(root: ParentNode): void {
  for (const svg of Array.from(root.querySelectorAll<SVGSVGElement>(".d3-flow-svg"))) decorateSvg(svg);
}

export function mountEcoCityFlowDecorations(root: HTMLElement): () => void {
  // Reveal treats any descendant <section> as a vertical slide. Its scroll
  // controller would extract the D3 wrapper from this scene, losing both the
  // scene CSS boundary and the host's presentation-step fragments. Adapt only
  // the embedding element, preserving the renderer's live SVG and listeners.
  const embeddings = Array.from(root.querySelectorAll<HTMLElement>(`${OPENING_WORKFLOW_SCENE} section.d3-flow-runtime`)).map((runtime) => {
    const container = document.createElement("div");
    for (const attribute of Array.from(runtime.attributes)) container.setAttribute(attribute.name, attribute.value);
    container.append(...Array.from(runtime.childNodes));
    runtime.replaceWith(container);
    return { runtime, container };
  });
  let frame = 0;
  const schedule = (): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      decorateRoot(root);
    });
  };

  decorateRoot(root);
  root.querySelector<HTMLElement>(`${LABORATORY_DIVERSITY_SCENE} .d3-flow-host`)?.setAttribute("data-presentation-step-count", "0");
  const secondaryWorkflowHost = root.querySelector<HTMLElement>(`${OPENING_WORKFLOW_SCENE} .d3-flow-host`);
  const applySecondaryWorkflowStep = (step: number): void => {
    if (!secondaryWorkflowHost) return;
    secondaryWorkflowHost.dataset.secondaryWorkflowVisible = step >= 1 ? "true" : "false";
    secondaryWorkflowHost.dataset.customScriptConsolidated = step >= 2 ? "true" : "false";
  };
  const secondaryWorkflowListener: EventListener = (event) => {
    const step = (event as CustomEvent<{ step?: unknown }>).detail?.step;
    if (typeof step === "number") applySecondaryWorkflowStep(step);
  };
  if (secondaryWorkflowHost) {
    // The upper workflow expands first; the next fragment consolidates the two
    // custom-script annotations into one cross-workflow question.
    secondaryWorkflowHost.setAttribute("data-presentation-step-count", "2");
    secondaryWorkflowHost.addEventListener("pcd-presentation-step", secondaryWorkflowListener);
    applySecondaryWorkflowStep(0);
  }
  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  schedule();

  return () => {
    observer.disconnect();
    secondaryWorkflowHost?.removeEventListener("pcd-presentation-step", secondaryWorkflowListener);
    if (frame) window.cancelAnimationFrame(frame);
    // Restore the element held by renderer-d3 before its own teardown runs.
    for (const { runtime, container } of embeddings) {
      runtime.append(...Array.from(container.childNodes));
      container.replaceWith(runtime);
    }
  };
}
