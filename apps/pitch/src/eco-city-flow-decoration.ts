import "./eco-city-flow-decoration.css";

const SVG_NS = "http://www.w3.org/2000/svg";

function numberAttribute(element: Element, name: string): number | undefined {
  const value = Number(element.getAttribute(name));
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
  const s = Math.max(3, Math.min(step, width / 4, height / 5));
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

function createCircle(className: string, cx: number, cy: number, radius: number): SVGCircleElement {
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("class", className);
  circle.setAttribute("cx", String(cx));
  circle.setAttribute("cy", String(cy));
  circle.setAttribute("r", String(radius));
  circle.setAttribute("aria-hidden", "true");
  return circle;
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

function decorateNode(svg: SVGSVGElement, group: SVGGElement, readingIndex: number): void {
  if (group.dataset.pixelDecorated === "true") return;
  const shape = group.querySelector<SVGRectElement>(".d3-flow-node-shape");
  if (!shape) return;
  const x = numberAttribute(shape, "x");
  const y = numberAttribute(shape, "y");
  const width = numberAttribute(shape, "width");
  const height = numberAttribute(shape, "height");
  const nodeId = group.getAttribute("data-node-id");
  if (x === undefined || y === undefined || width === undefined || height === undefined || !nodeId) return;

  const shadow = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-shadow", steppedRectPath(x, y, width, height, 16));
  shadow.setAttribute("transform", "translate(8 9)");
  const outer = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-outer", steppedRectPath(x, y, width, height, 16));
  const middle = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-middle", steppedRectPath(x + 5, y + 5, width - 10, height - 10, 13));
  const inner = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-inner", steppedRectPath(x + 11, y + 11, width - 22, height - 22, 10));

  const tabWidth = Math.min(54, Math.max(48, width * 0.2));
  const tabX = x + 13;
  const tabY = y + 17;
  const tabHeight = Math.max(28, height - 34);
  const tab = createPath("d3-flow-pixel-node-tab", numberTabPath(tabX, tabY, tabWidth, tabHeight, 8));
  const number = createText(
    "d3-flow-pixel-node-number",
    tabX + tabWidth / 2 - 1,
    y + height / 2 + 1,
    String(readingIndex + 1).padStart(2, "0"),
  );
  const led = createCircle("d3-flow-pixel-node-led", x + width - 21, y + 20, 7);

  group.insertBefore(shadow, shape);
  group.insertBefore(outer, shape);
  group.insertBefore(middle, shape);
  group.insertBefore(inner, shape);
  group.insertBefore(tab, shape);
  group.insertBefore(number, shape);
  group.insertBefore(led, shape);

  const label = group.querySelector<SVGTextElement>(".d3-flow-node-label");
  if (label) {
    const labelOffset = Math.min(30, tabWidth * 0.54);
    label.setAttribute("x", String(labelOffset));
    for (const tspan of Array.from(label.querySelectorAll<SVGTSpanElement>("tspan"))) {
      tspan.setAttribute("x", String(labelOffset));
    }
  }

  const orientation = svg.getAttribute("data-orientation") ?? "horizontal";
  const hasIncoming = svg.querySelector(`.d3-flow-edge[data-target-node-id="${CSS.escape(nodeId)}"]`) !== null;
  const hasOutgoing = svg.querySelector(`.d3-flow-edge[data-source-node-id="${CSS.escape(nodeId)}"]`) !== null;
  const socketSize = 20;
  if (orientation === "horizontal") {
    if (hasIncoming) group.insertBefore(createSocket(x, 0, socketSize), shape);
    if (hasOutgoing) group.insertBefore(createSocket(x + width, 0, socketSize), shape);
  } else {
    if (hasIncoming) group.insertBefore(createSocket(0, y, socketSize), shape);
    if (hasOutgoing) group.insertBefore(createSocket(0, y + height, socketSize), shape);
  }

  shape.classList.add("d3-flow-node-shape-base");
  group.dataset.pixelDecorated = "true";
}

function decorateEdges(svg: SVGSVGElement): void {
  const lines = Array.from(svg.querySelectorAll<SVGLineElement>(".d3-flow-edge"));
  const labels = Array.from(svg.querySelectorAll<SVGTextElement>(".d3-flow-edge-label"));

  lines.forEach((line, index) => {
    if (line.dataset.pixelDecorated === "true") return;
    const x1 = numberAttribute(line, "x1");
    const y1 = numberAttribute(line, "y1");
    const x2 = numberAttribute(line, "x2");
    const y2 = numberAttribute(line, "y2");
    if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) return;

    const middleX = x1 + (x2 - x1) / 2;
    const isHorizontal = Math.abs(y2 - y1) < 1;
    const d = isHorizontal
      ? `M ${x1} ${y1} H ${x2}`
      : `M ${x1} ${y1} H ${middleX} V ${y2} H ${x2}`;
    const path = createPath("d3-flow-pixel-edge-path", d);
    path.setAttribute("data-source-node-id", line.getAttribute("data-source-node-id") ?? "");
    path.setAttribute("data-target-node-id", line.getAttribute("data-target-node-id") ?? "");
    line.parentNode?.insertBefore(path, line);
    line.dataset.pixelDecorated = "true";

    const label = labels[index];
    if (!label) return;
    const labelX = middleX;
    const labelY = isHorizontal ? y1 - 34 : Math.min(y1, y2) - 30;
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
    const padX = 14;
    const padY = 8;
    const pill = createPath(
      "d3-flow-pixel-edge-pill",
      steppedRectPath(box.x - padX, box.y - padY, box.width + padX * 2, box.height + padY * 2, 8),
    );
    label.parentNode?.insertBefore(pill, label);
    label.dataset.pixelDecorated = "true";
  });
}

function fitViewBoxToFlow(svg: SVGSVGElement): void {
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

  const padX = Math.max(24, contentWidth * 0.025);
  const padY = Math.max(34, contentHeight * 0.15);
  const viewWidth = contentWidth + padX * 2;
  const viewHeight = contentHeight + padY * 2;
  svg.setAttribute("viewBox", `${minX - padX} ${minY - padY} ${viewWidth} ${viewHeight}`);
  svg.removeAttribute("height");
  svg.style.aspectRatio = `${viewWidth} / ${viewHeight}`;
  svg.dataset.ecoCityFit = "true";
}

function decorateSvg(svg: SVGSVGElement): void {
  const nodes = Array.from(svg.querySelectorAll<SVGGElement>(".d3-flow-node"));
  nodes.forEach((group, index) => decorateNode(svg, group, index));
  decorateEdges(svg);
  fitViewBoxToFlow(svg);
}

function decorateRoot(root: ParentNode): void {
  for (const svg of Array.from(root.querySelectorAll<SVGSVGElement>(".d3-flow-svg"))) decorateSvg(svg);
}

export function mountEcoCityFlowDecorations(root: HTMLElement): () => void {
  let frame = 0;
  const schedule = (): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      decorateRoot(root);
    });
  };

  decorateRoot(root);
  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  schedule();

  return () => {
    observer.disconnect();
    if (frame) window.cancelAnimationFrame(frame);
  };
}
