type Point3 = readonly [number, number, number];
type Point2 = readonly [number, number];

const initialAzimuth = 0.46;
const initialElevation = 0.39;
const rotationPerPixel = 0.008;

/** Numeric geometry only. Paths, surfaces and marks stay in their authored SVG
 * groups so the presentation runtime still owns the reveal state. */
export function mountTeachingSvgOrbit(svg: SVGSVGElement): () => void {
  if (svg.dataset.teachingOrbit !== "true") return () => {};
  const marks = [...svg.querySelectorAll<SVGElement>("[data-orbit-points]")].map(node => ({
    node,
    points: node.dataset.orbitPoints!.split(" ").map(point => point.split(",").map(Number) as unknown as Point3),
    offset: node.dataset.orbitOffset?.split(",").map(Number) ?? [0, 0],
  }));
  const points = marks.flatMap(mark => mark.points);
  if (!points.length) return () => {};
  const { x, y, width, height } = svg.viewBox.baseVal;
  let azimuth = initialAzimuth;
  let elevation = initialElevation;
  let drag: { id: number; x: number; y: number } | undefined;
  const listeners = new AbortController();

  function render() {
    const ca = Math.cos(azimuth), sa = Math.sin(azimuth);
    const ce = Math.cos(elevation), se = Math.sin(elevation);
    const rotate = ([u, v, w]: Point3): Point2 => [u * ca + v * sa, (u * sa - v * ca) * se - w * ce];
    const projected = points.map(rotate);
    const horizontal = projected.map(point => point[0]);
    const vertical = projected.map(point => point[1]);
    const left = Math.min(...horizontal), right = Math.max(...horizontal);
    const top = Math.min(...vertical), bottom = Math.max(...vertical);
    const scale = Math.min(width * 0.80 / (right - left), height * 0.65 / (bottom - top), 2);
    const project = (world: Point3): Point2 => {
      const [u, v] = rotate(world);
      return [x + width / 2 + (u - (left + right) / 2) * scale,
              y + height * 0.50 + (v - (top + bottom) / 2) * scale];
    };
    for (const { node, points, offset: [dx = 0, dy = 0] } of marks) {
      const screen = points.map(project);
      const coordinates = screen.map(point => point.map(value => value.toFixed(2)).join(","));
      if (node.localName === "polygon") {
        node.setAttribute("points", coordinates.join(" "));
      } else if (node.localName === "path") {
        node.setAttribute("d", "M" + coordinates.join(" L"));
      } else {
        const [u, v] = screen[0]!;
        const attribute = node.localName === "circle" ? "c" : "";
        node.setAttribute(attribute + "x", (u + dx).toFixed(2));
        node.setAttribute(attribute + "y", (v + dy).toFixed(2));
      }
    }
  }

  function rotateBy(horizontal: number, vertical: number) {
    azimuth = (azimuth + horizontal) % (2 * Math.PI);
    elevation = Math.max(0.10, Math.min(1.32, elevation + vertical));
    render();
  }

  function reset() {
    azimuth = initialAzimuth;
    elevation = initialElevation;
    render();
  }

  const options = { signal: listeners.signal };
  svg.setAttribute("tabindex", "0");
  svg.setAttribute("aria-description", "Drag to rotate. With focus, use Alt and arrow keys. Double-click or press 0 to reset the view.");
  svg.style.cursor = "grab";
  svg.style.touchAction = "none";
  svg.style.userSelect = "none";

  const hint = svg.ownerDocument.createElementNS(svg.namespaceURI, "text");
  hint.setAttribute("x", String(x + width / 2));
  hint.setAttribute("y", String(y + height - 12));
  hint.setAttribute("text-anchor", "middle");
  hint.setAttribute("font-family", "system-ui, sans-serif");
  hint.setAttribute("font-size", "18");
  hint.setAttribute("fill", "currentColor");
  hint.setAttribute("aria-hidden", "true");
  hint.textContent = "Drag to rotate · Double-click to reset";
  svg.append(hint);

  svg.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    // Keep the keyboard focus indicator for Tab users without framing the plot after a drag.
    event.preventDefault();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    svg.setPointerCapture(event.pointerId);
    svg.style.cursor = "grabbing";
  }, options);
  svg.addEventListener("pointermove", event => {
    if (drag?.id !== event.pointerId) return;
    rotateBy((event.clientX - drag.x) * rotationPerPixel, (event.clientY - drag.y) * rotationPerPixel);
    drag.x = event.clientX;
    drag.y = event.clientY;
  }, options);
  const stopDragging = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    drag = undefined;
    svg.style.cursor = "grab";
  };
  svg.addEventListener("pointerup", stopDragging, options);
  svg.addEventListener("pointercancel", stopDragging, options);
  svg.addEventListener("lostpointercapture", stopDragging, options);
  svg.addEventListener("touchstart", event => event.stopPropagation(), { ...options, passive: true });
  svg.addEventListener("dblclick", reset, options);
  svg.addEventListener("keydown", event => {
    const directions: Partial<Record<string, Point2>> = {
      ArrowLeft: [-0.14, 0], ArrowRight: [0.14, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12],
    };
    const direction = event.altKey ? directions[event.key] : undefined;
    if (!direction && event.key !== "0") return;
    event.preventDefault();
    event.stopPropagation();
    if (direction) rotateBy(...direction);
    else reset();
  }, options);
  render();
  return () => listeners.abort();
}
