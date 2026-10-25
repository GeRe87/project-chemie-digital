import { scaleLinear } from "d3-scale";
import { timelineStaticFallback, type TimelineChartBlock } from "../../core/src/scene-document.ts";

const NS = "http://www.w3.org/2000/svg";

/** Generic interval comparison: no scheduling policy or subject identities here. */
export function mountD3TimelineChart(host: HTMLElement, block: TimelineChartBlock, options: {reducedMotion: boolean}) {
  const progressive = block.scenarios.length > 1;
  let currentStep = progressive ? 0 : 1;
  host.replaceChildren();
  if (progressive) {
    host.setAttribute("data-presentation-step-count", String(block.scenarios.length));
    host.setAttribute("data-presentation-step-host", "chart");
  }
  const figure = document.createElement("figure"); figure.className = "d3-chart-figure d3-chart-figure-timeline";
  figure.tabIndex = 0;
  figure.setAttribute("data-presentation-interactive", "true");
  figure.setAttribute("aria-label", "Timeline comparison. Scroll horizontally on narrow screens.");
  const scrollKeys = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault(); event.stopPropagation();
    figure.scrollBy({left: event.key === "ArrowRight" ? 120 : -120, behavior: options.reducedMotion ? "instant" : "smooth"});
  };
  figure.addEventListener("keydown", scrollKeys);
  const canvas = document.createElementNS(NS, "svg");
  canvas.classList.add("d3-chart-svg", "d3-timeline-svg");
  canvas.setAttribute("role", "img");
  const caption = document.createElement("figcaption"); caption.className = "d3-chart-caption";
  caption.textContent = block.description;
  const fallback = document.createElement("pre"); fallback.className = "d3-chart-static-fallback";
  fallback.textContent = timelineStaticFallback(block);
  figure.append(canvas, caption, fallback); host.append(figure);
  const add = (parent: Element, tag: string, attrs: Record<string, string | number>, text?: string) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text;
    parent.append(node); return node;
  };
  const width = 1280, height = 620, left = 150, right = 1230, top = 70, bottom = 555;
  const max = Math.max(...block.scenarios.flatMap(s => s.lanes.flatMap(l => l.intervals.map(i => i.end))));
  const x = scaleLinear().domain([0, max]).nice(6).range([left, right]);
  canvas.setAttribute("viewBox", `0 0 ${width} ${height}`);
  for (const tick of x.ticks(6)) {
    add(canvas, "line", {class: "d3-chart-grid-line", x1: x(tick), x2: x(tick), y1: top, y2: bottom});
    add(canvas, "text", {class: "d3-chart-tick-label", x: x(tick), y: bottom + 30, "text-anchor": "middle"}, String(tick));
  }
  add(canvas, "text", {class: "d3-chart-axis-title", x: (left + right) / 2, y: 612, "text-anchor": "middle"}, `${block.xAxis.label} (${block.xAxis.unit})`);
  const categoryIndex = new Map(block.categories.map((category, index) => [category.id, index % 5 + 1]));
  block.categories.forEach((category, index) => {
    const xx = 20 + index * (width - 40) / block.categories.length;
    add(canvas, "rect", {class: `d3-chart-series-${categoryIndex.get(category.id)}`, x: xx, y: 15, width: 20, height: 18, rx: 3});
    add(canvas, "text", {class: "d3-timeline-legend", x: xx + 28, y: 31}, category.label);
  });
  const totalRows = block.scenarios.reduce((n, s) => n + s.lanes.length + 0.8, 0);
  const rowHeight = (bottom - top - 15) / totalRows;
  let row = 0;
  const groups = block.scenarios.map((scenario, index) => {
    const group = add(canvas, "g", {"data-timeline-scenario-id": scenario.id});
    (group as SVGElement).style.transition = options.reducedMotion ? "none" : "opacity 300ms ease";
    const total = Math.max(...scenario.lanes.flatMap(l => l.intervals.map(i => i.end)));
    add(group, "text", {class: "d3-timeline-scenario", x: left, y: top + row * rowHeight + 20}, scenario.label);
    add(group, "text", {class: "d3-timeline-total", x: right, y: top + row * rowHeight + 20, "text-anchor": "end"}, `${total} ${block.xAxis.unit}`);
    row += 0.8;
    for (const lane of scenario.lanes) {
      const yy = top + row * rowHeight;
      add(group, "text", {class: "d3-timeline-lane", x: left - 16, y: yy + rowHeight * 0.56, "text-anchor": "end"}, lane.label);
      for (const interval of lane.intervals) {
        const xx = x(interval.start), w = x(interval.end) - xx;
        const barHeight = Math.max(15, Math.min(48, rowHeight - 10));
        const rect = add(group, "rect", {class: `d3-timeline-interval d3-chart-series-${categoryIndex.get(interval.categoryId)}`, x: xx, y: yy + (rowHeight - barHeight) / 2, width: w, height: barHeight, rx: 3});
        add(rect, "title", {}, `${interval.label}; ${block.categories.find(c => c.id === interval.categoryId)?.label}: ${interval.start}–${interval.end} ${block.xAxis.unit}`);
        if (w >= 42) add(group, "text", {class: "d3-timeline-run", x: xx + w / 2, y: yy + rowHeight * 0.56, "text-anchor": "middle"}, interval.label);
      }
      row++;
    }
    return {group, index};
  });
  const apply = () => {
    for (const {group, index} of groups) {
      const visible = !progressive || currentStep > index;
      (group as SVGElement).style.opacity = visible ? "1" : "0";
      group.setAttribute("aria-hidden", String(!visible));
    }
    host.setAttribute("data-presentation-step", String(currentStep));
    canvas.setAttribute("aria-label", `${block.label}. ${block.description}. ${block.scenarios.filter((_, i) => !progressive || i < currentStep).map(s => s.label).join("; ")}. Full interval values follow in the text alternative.`);
  };
  const setStep = (step: number) => { currentStep = Math.max(0, Math.min(block.scenarios.length, Math.trunc(Number.isFinite(step) ? step : 0))); apply(); };
  const listener = (event: Event) => setStep((event as CustomEvent<{step: number}>).detail.step);
  if (progressive) host.addEventListener("pcd-presentation-step", listener);
  apply();
  return {stepCount: progressive ? block.scenarios.length : 0, setStep, destroy() {
    figure.removeEventListener("keydown", scrollKeys);
    host.removeEventListener("pcd-presentation-step", listener);
    host.removeAttribute("data-presentation-step-count"); host.removeAttribute("data-presentation-step-host");
    host.removeAttribute("data-presentation-step"); figure.remove();
  }};
}
