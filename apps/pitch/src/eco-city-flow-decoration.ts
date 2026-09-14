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

function createPath(className: string, d: string): SVGPathElement {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("class", className);
  path.setAttribute("d", d);
  path.setAttribute("vector-effect", "non-scaling-stroke");
  path.setAttribute("aria-hidden", "true");
  return path;
}

function createSocket(x: number, y: number, size: number): SVGRectElement {
  const socket = document.createElementNS(SVG_NS, "rect");
  socket.setAttribute("class", "d3-flow-pixel-socket");
  socket.setAttribute("x", String(x - size / 2));
  socket.setAttribute("y", String(y - size / 2));
  socket.setAttribute("width", String(size));
  socket.setAttribute("height", String(size));
  socket.setAttribute("aria-hidden", "true");
  return socket;
}

function decorateNode(svg: SVGSVGElement, group: SVGGElement): void {
  if (group.dataset.pixelDecorated === "true") return;
  const shape = group.querySelector<SVGRectElement>(".d3-flow-node-shape");
  if (!shape) return;
  const x = numberAttribute(shape, "x");
  const y = numberAttribute(shape, "y");
  const width = numberAttribute(shape, "width");
  const height = numberAttribute(shape, "height");
  const nodeId = group.getAttribute("data-node-id");
  if (x === undefined || y === undefined || width === undefined || height === undefined || !nodeId) return;

  const shadow = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-shadow", steppedRectPath(x, y, width, height, 14));
  shadow.setAttribute("transform", "translate(7 7)");
  const outer = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-outer", steppedRectPath(x, y, width, height, 14));
  const middle = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-middle", steppedRectPath(x + 5, y + 5, width - 10, height - 10, 11));
  const inner = createPath("d3-flow-pixel-frame d3-flow-pixel-frame-inner", steppedRectPath(x + 10, y + 10, width - 20, height - 20, 8));

  group.insertBefore(shadow, shape);
  group.insertBefore(outer, shape);
  group.insertBefore(middle, shape);
  group.insertBefore(inner, shape);

  const orientation = svg.getAttribute("data-orientation") ?? "horizontal";
  const hasIncoming = svg.querySelector(`.d3-flow-edge[data-target-node-id="${CSS.escape(nodeId)}"]`) !== null;
  const hasOutgoing = svg.querySelector(`.d3-flow-edge[data-source-node-id="${CSS.escape(nodeId)}"]`) !== null;
  const socketSize = 16;
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

function decorateEdgeLabels(svg: SVGSVGElement): void {
  const labels = Array.from(svg.querySelectorAll<SVGTextElement>(".d3-flow-edge-label"));
  for (const label of labels) {
    if (label.dataset.pixelDecorated === "true") continue;
    let box: DOMRect | SVGRect;
    try {
      box = label.getBBox();
    } catch {
      continue;
    }
    if (!(box.width > 0) || !(box.height > 0)) continue;
    const pill = document.createElementNS(SVG_NS, "rect");
    pill.setAttribute("class", "d3-flow-pixel-edge-pill");
    pill.setAttribute("x", String(box.x - 9));
    pill.setAttribute("y", String(box.y - 5));
    pill.setAttribute("width", String(box.width + 18));
    pill.setAttribute("height", String(box.height + 10));
    pill.setAttribute("aria-hidden", "true");
    label.parentNode?.insertBefore(pill, label);
    label.dataset.pixelDecorated = "true";
  }
}

function decorateSvg(svg: SVGSVGElement): void {
  for (const group of Array.from(svg.querySelectorAll<SVGGElement>(".d3-flow-node"))) decorateNode(svg, group);
  decorateEdgeLabels(svg);
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
