import { scaleLinear } from "d3-scale";
import { cyclicRegressionWindow, regressionStaticFallback, regressionWindowResult, type RegressionChartBlock } from "../../core/src/regression-chart.ts";

/** Linked window membership, paired observations/OLS and held-out errors. */
export function mountD3RegressionChart(host: HTMLElement, block: RegressionChartBlock, options: {reducedMotion: boolean}) {
  const NS = "http://www.w3.org/2000/svg";
  const figure = document.createElement("figure"); figure.className = "d3-chart-figure d3-chart-figure-scrollable";
  figure.tabIndex = 0; figure.dataset.presentationInteractive = "true";
  figure.setAttribute("aria-label", "Regression chart. Scroll horizontally on narrow screens.");
  const canvas = document.createElementNS(NS, "svg"); canvas.classList.add("d3-chart-svg", "d3-regression-svg");
  canvas.setAttribute("viewBox", "0 0 1280 620"); canvas.setAttribute("role", "img");
  const caption = document.createElement("figcaption"); caption.className = "d3-chart-caption"; caption.textContent = block.description;
  const controls = document.createElement("span"); controls.className = "d3-regression-cycle-controls"; controls.hidden = true;
  const toggle = document.createElement("button"); toggle.type = "button";
  const position = document.createElement("span"); controls.append(toggle, position); caption.append(controls);
  const alternative = document.createElement("pre"); alternative.className = "d3-chart-static-fallback"; alternative.textContent = regressionStaticFallback(block);
  figure.append(canvas, caption, alternative); host.replaceChildren(figure);
  host.dataset.presentationStepCount = String(block.windows.length); host.dataset.presentationStepHost = "chart";
  const frames = block.windows.map(window => Array.from({length: window.cycleIntervalMs ? block.data.length : 1}, (_, i) => {
    const selection = window.cycleIntervalMs ? cyclicRegressionWindow(block, window, i) : window;
    return {window: selection, result: regressionWindowResult(block, selection)};
  }));
  const results = frames.flatMap(f => f.map(frame => frame.result));
  const domain = (values: readonly number[], padding: number): [number, number] => {
    const lo = Math.min(0, ...values), hi = Math.max(0, ...values), pad = (hi - lo || 1) * padding;
    return [lo < 0 ? lo - pad : 0, hi > 0 ? hi + pad : pad];
  };
  const x = scaleLinear().domain(domain(block.data.map(d => d.x), 0.08)).nice(5).range([120, 870]);
  const fittedEnds = results.flatMap(r => [Math.min(...r.points.map(p => p.x)), Math.max(...r.points.map(p => p.x))].map(xx => r.intercept + r.slope * xx));
  const y = scaleLinear().domain(domain([...block.data.map(d => d.y), ...fittedEnds], 0.12)).nice(5).range([510, 150]);
  const error = scaleLinear().domain([0, Math.max(...results.flatMap(r => r.errors.map(e => e.value)), 1) * 1.1]).nice(4).range([510, 150]);
  const colour = new Map(block.data.map((d, i) => [d.id, i % 5 + 1]));
  const add = (parent: Element, tag: string, attrs: Record<string, string | number>, text?: string) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text; parent.append(node); return node;
  };
  let step = 0, offset = 0, paused = options.reducedMotion, timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => { if (timer !== undefined) clearInterval(timer); timer = undefined; };
  const render = () => {
    const index = Math.max(0, step - 1), {window, result} = frames[index]![offset % frames[index]!.length]!;
    controls.hidden = !block.windows.some(w => w.cycleIntervalMs);
    controls.style.visibility = window.cycleIntervalMs ? "visible" : "hidden";
    toggle.textContent = paused ? "Resume FIFO" : "Pause FIFO";
    const firstIndex = block.data.findIndex(d => d.id === window.datumIds[0]);
    position.textContent = `Start ${firstIndex + 1} of ${block.data.length}; ${window.datumIds.length} observations`;
    canvas.dataset.regressionWindowStart = String(firstIndex + 1);
    canvas.dataset.regressionMemberIds = window.datumIds.join(" ");
    const members = new Set(window.datumIds); canvas.replaceChildren();
    host.dataset.presentationStep = String(step); canvas.dataset.regressionWindowId = window.id;
    canvas.setAttribute("aria-label", `${block.label}. ${window.label}. ${result.points.length} observations. Mean absolute leave-one-out inverse-prediction error: ${result.meanAbsoluteError.toFixed(2)} ${block.xAxis.unit}. Complete data and window membership follow in the text alternative.`);
    add(canvas, "text", {class: "d3-regression-heading", x: 120, y: 30}, window.label);
    block.data.forEach((point, i) => {
      const xx = 120 + i * 1100 / Math.max(1, block.data.length - 1);
      const dot = add(canvas, "circle", {class: `d3-chart-series-${colour.get(point.id)}`, cx: xx, cy: 68, r: members.has(point.id) ? 8 : 4, opacity: members.has(point.id) ? 1 : 0.2});
      add(dot, "title", {}, `${i + 1}: ${point.x} ${block.xAxis.unit}; ${point.y} ${block.yAxis.unit}`);
      if (i === 0 || (i + 1) % 5 === 0 || i === block.data.length - 1) add(canvas, "text", {class: "d3-regression-small", x: xx, y: 98, "text-anchor": "middle"}, String(i + 1));
    });
    add(canvas, "text", {class: "d3-regression-small", x: 120, y: 127}, "Authored observation order");
    for (const tick of y.ticks(4)) {
      add(canvas, "line", {class: "d3-chart-grid-line", x1: 120, x2: 870, y1: y(tick), y2: y(tick)});
      add(canvas, "text", {class: "d3-chart-tick-label", x: 105, y: y(tick) + 7, "text-anchor": "end"}, tick.toLocaleString("en"));
    }
    for (const tick of x.ticks(5)) add(canvas, "text", {class: "d3-chart-tick-label", x: x(tick), y: 540, "text-anchor": "middle"}, String(tick));
    add(canvas, "line", {class: "d3-chart-axis", x1: 120, x2: 870, y1: 510, y2: 510});
    add(canvas, "line", {class: "d3-chart-axis", x1: 120, x2: 120, y1: 150, y2: 510});
    const endpoints = [Math.min(...result.points.map(p => p.x)), Math.max(...result.points.map(p => p.x))];
    add(canvas, "line", {class: "d3-regression-fit", x1: x(endpoints[0]!), x2: x(endpoints[1]!), y1: y(result.intercept + result.slope * endpoints[0]!), y2: y(result.intercept + result.slope * endpoints[1]!)});
    for (const point of result.points) {
      const dot = add(canvas, "circle", {class: `d3-regression-point d3-chart-series-${colour.get(point.id)}`, cx: x(point.x), cy: y(point.y), r: 7});
      add(dot, "title", {}, `Observation ${block.data.findIndex(d => d.id === point.id) + 1}: ${point.x} ${block.xAxis.unit}; ${point.y} ${block.yAxis.unit}`);
    }
    add(canvas, "text", {class: "d3-chart-axis-title", x: 495, y: 580, "text-anchor": "middle"}, `${block.xAxis.label} (${block.xAxis.unit})`);
    add(canvas, "text", {class: "d3-chart-axis-title", transform: "translate(28 330) rotate(-90)", "text-anchor": "middle"}, `${block.yAxis.label} (${block.yAxis.unit})`);
    add(canvas, "text", {class: "d3-regression-small", x: 870, y: 606, "text-anchor": "end"}, "Line: ordinary least squares; dots: supplied observations");
    add(canvas, "text", {class: "d3-regression-heading", x: 1115, y: 115, "text-anchor": "middle"}, "Leave-one-out");
    add(canvas, "text", {class: "d3-regression-small", x: 1115, y: 142, "text-anchor": "middle"}, `Absolute prediction error (${block.xAxis.unit})`);
    for (const tick of error.ticks(4)) {
      add(canvas, "line", {class: "d3-chart-grid-line", x1: 1000, x2: 1240, y1: error(tick), y2: error(tick)});
      add(canvas, "text", {class: "d3-chart-tick-label", x: 990, y: error(tick) + 7, "text-anchor": "end"}, String(tick));
    }
    result.errors.forEach((e, i) => {
      const dot = add(canvas, "circle", {class: `d3-chart-series-${colour.get(e.id)}`, cx: 1020 + (i % 8) * 28, cy: error(e.value), r: 5});
      add(dot, "title", {}, `Observation ${block.data.findIndex(d => d.id === e.id) + 1}: ${e.value.toFixed(2)} ${block.xAxis.unit}`);
    });
    add(canvas, "line", {class: "d3-regression-fit", x1: 1000, x2: 1240, y1: error(result.meanAbsoluteError), y2: error(result.meanAbsoluteError)});
    add(canvas, "text", {class: "d3-regression-heading", x: 1115, y: 550, "text-anchor": "middle"}, `Mean: ${result.meanAbsoluteError.toFixed(1)} ${block.xAxis.unit}`);
    add(canvas, "text", {class: "d3-regression-small", x: 1115, y: 582, "text-anchor": "middle"}, "Held-out errors, not training residuals");
  };
  const start = () => {
    stop(); const active = step > 0 ? block.windows[step - 1] : undefined;
    if (!active?.cycleIntervalMs || paused || document.hidden) return;
    timer = setInterval(() => { offset = (offset + 1) % block.data.length; render(); }, active.cycleIntervalMs);
  };
  const setStep = (value: number) => {
    const next = Math.max(0, Math.min(block.windows.length, Math.trunc(Number.isFinite(value) ? value : 0)));
    if (next === step) return;
    stop(); step = next; offset = 0; render(); start();
  };
  const onToggle = () => { paused = !paused; render(); start(); };
  const onVisibility = () => { document.hidden ? stop() : start(); };
  const listener = (event: Event) => setStep((event as CustomEvent<{step: number}>).detail.step);
  const scrollKeys = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault(); event.stopPropagation(); figure.scrollBy({left: event.key === "ArrowRight" ? 120 : -120, behavior: options.reducedMotion ? "instant" : "smooth"});
  };
  host.addEventListener("pcd-presentation-step", listener); figure.addEventListener("keydown", scrollKeys);
  toggle.addEventListener("click", onToggle); document.addEventListener("visibilitychange", onVisibility); render();
  return {stepCount: block.windows.length, setStep, destroy() {
    stop(); toggle.removeEventListener("click", onToggle); document.removeEventListener("visibilitychange", onVisibility);
    host.removeEventListener("pcd-presentation-step", listener); figure.removeEventListener("keydown", scrollKeys);
    host.removeAttribute("data-presentation-step-count"); host.removeAttribute("data-presentation-step-host"); host.removeAttribute("data-presentation-step"); figure.remove();
  }};
}
