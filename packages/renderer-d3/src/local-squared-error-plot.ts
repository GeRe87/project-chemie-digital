import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import type { ExperimentPanel } from "../../core/src/distribution-experiment.ts";

const svgNamespace = "http://www.w3.org/2000/svg";
const coefficientHalfWindow = .3;
let nextPlotId = 0;

export function createLocalSquaredErrorPlot(owner: Document, coefficient: "intercept" | "slope") {
  const slot = owner.createElement("div");
  slot.className = "experiment-local-error-plot";
  const gradientId = `pcd-local-error-fade-${nextPlotId++}`;
  const isSlope = coefficient === "slope";
  const title = isSlope ? "Vary the slope · hold intercept fixed" : "Vary the intercept · hold slope fixed";
  const unit = isSlope ? "mV/min" : "mV";
  const color = `var(--pcd-chart-series-${isSlope ? 2 : 1})`;

  return {
    slot,
    paint(segments: NonNullable<ExperimentPanel["residualSegments"]>, current: number) {
      const width = Math.max(280, slot.clientWidth || 440);
      const height = Math.max(170, slot.clientHeight || 240);
      const bounds: [number, number] = [current - coefficientHalfWindow, current + coefficientHalfWindow];
      const score = (offset: number) => segments.reduce((sum, point) => {
        const residual = point.observed - point.fitted - offset * (isSlope ? point.x : 1);
        return sum + residual * residual;
      }, 0);
      const points = Array.from({ length: 41 }, (_, index) => {
        const offset = coefficientHalfWindow * (index - 20) / 20;
        return { coefficient: current + offset, error: score(offset) };
      });
      const currentError = score(0);
      const errors = points.map(point => point.error);
      const minimum = Math.min(...errors);
      const maximum = Math.max(...errors);
      const pad = Math.max((maximum - minimum) * .12, .015);
      const left = 57, right = width - 12, top = 52, bottom = height - 42;
      const x = scaleLinear().domain(bounds).range([left, right]);
      const y = scaleLinear().domain([Math.max(0, minimum - pad), maximum + pad]).range([bottom, top]);
      const svg = owner.createElementNS(svgNamespace, "svg");
      const format = (value: number) => Number(value.toPrecision(3)).toString();
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", `${title}. Window ${format(bounds[0])} to ${format(bounds[1])} ${unit}. Current coefficient ${format(current)} ${unit}. Squared error ${format(currentError)} square millivolts.`);
      svg.dataset.localErrorCoefficient = coefficient;
      svg.dataset.coefficientBounds = JSON.stringify(bounds);
      const draw = (tag: string, attributes: Record<string, string | number>, label?: string, parent: SVGElement = svg) => {
        const node = owner.createElementNS(svgNamespace, tag);
        for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
        if (label !== undefined) node.textContent = label;
        parent.append(node);
        return node;
      };
      const defs = draw("defs", {});
      const fade = draw("linearGradient", {id: gradientId}, undefined, defs);
      for (const [offset, opacity] of [["0%", 0], ["20%", 1], ["80%", 1], ["100%", 0]] as const) {
        draw("stop", {offset, "stop-color": color, "stop-opacity": opacity}, undefined, fade);
      }
      const ink = {fill: "currentColor", "font-size": 17};
      draw("text", {...ink, x: 8, y: 22, "font-size": 20, "font-weight": 700}, title);
      draw("text", {...ink, x: left, y: 44}, "Squared error (mV²)");
      for (const tick of y.ticks(3)) {
        draw("line", {x1: left, x2: right, y1: y(tick), y2: y(tick), stroke: "currentColor", "stroke-opacity": .22});
        draw("text", {...ink, x: left - 7, y: y(tick) + 5, "text-anchor": "end"}, format(tick));
      }
      draw("path", {d: `M${left} ${top}V${bottom}H${right}`, fill: "none", stroke: "currentColor", "stroke-opacity": .5});
      const center = x(current);
      draw("line", {x1: center, x2: center, y1: top, y2: bottom, stroke: color, "stroke-dasharray": "5 5", "stroke-opacity": .65});
      const curve = line<typeof points[number]>().x(point => x(point.coefficient)).y(point => y(point.error))(points);
      if (curve) draw("path", {d: curve, fill: "none", stroke: `url(#${gradientId})`, "stroke-width": 4});
      draw("circle", {cx: center, cy: y(currentError), r: 6, fill: color, "data-current-error": currentError});
      for (const tick of [bounds[0], current, bounds[1]]) {
        draw("text", {...ink, x: x(tick), y: bottom + 20,
          "text-anchor": tick === bounds[0] ? "start" : tick === bounds[1] ? "end" : "middle"}, format(tick));
      }
      draw("text", {...ink, x: right, y: height - 4, "text-anchor": "end"}, `${isSlope ? "Slope" : "Intercept"} (${unit})`);
      slot.replaceChildren(svg);
    },
  };
}
