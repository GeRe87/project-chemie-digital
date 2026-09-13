import { scaleBand, scaleLinear } from "d3-scale";
import type { ChartBlock } from "../../core/src/scene-document.ts";

export interface D3BarChartOptions { readonly reducedMotion: boolean; }
export interface D3BarDatum { readonly id: string; readonly category: string; readonly value: number; }
export interface D3BarChartRenderModel {
  readonly version: "1.0";
  readonly sourceBlockId: string;
  readonly label: string;
  readonly description: string;
  readonly xAxisLabel: string;
  readonly yAxisLabel: string;
  readonly yAxisUnit?: string;
  readonly data: readonly D3BarDatum[];
  readonly staticFallback: string;
}
export interface D3BarChartDiagnostic {
  readonly code: "INVALID_BAR_CHART_BLOCK" | "INVALID_BAR_CHART_HOST";
  readonly message: string;
}
export interface D3BarChartRenderModelResult { readonly model?: D3BarChartRenderModel; readonly diagnostics: readonly D3BarChartDiagnostic[]; }
export interface D3BarChartComponent { readonly model: D3BarChartRenderModel; readonly staticFallback: string; destroy(): void; }

function invalid(message: string): D3BarChartRenderModelResult {
  return { diagnostics: [{ code: "INVALID_BAR_CHART_BLOCK", message }] };
}
function fallback(block: ChartBlock): string {
  const unit = block.yAxis.unit ? ` ${block.yAxis.unit}` : "";
  return [block.label, block.description, `${block.xAxis.label} / ${block.yAxis.label}`,
    ...block.data.map((datum) => `- ${datum.category}: ${datum.value}${unit}`)].join("\n");
}
export function createD3BarChartRenderModel(block: ChartBlock): D3BarChartRenderModelResult {
  if (block.kind !== "chart" || block.chartType !== "bar") return invalid("renderer-d3 bar charts require a canonical bar ChartBlock");
  if (!block.data.length) return invalid("bar chart data must not be empty");
  const ids = block.data.map((datum) => datum.id);
  if (new Set(ids).size !== ids.length) return invalid("bar chart datum ids must be unique");
  if (block.data.some((datum) => !Number.isFinite(datum.value))) return invalid("bar chart values must be finite");
  return { model: {
    version: "1.0", sourceBlockId: block.id, label: block.label, description: block.description,
    xAxisLabel: block.xAxis.label, yAxisLabel: block.yAxis.label,
    ...(block.yAxis.unit ? { yAxisUnit: block.yAxis.unit } : {}),
    data: block.data.map(({ id, category, value }) => ({ id, category, value })),
    staticFallback: fallback(block),
  }, diagnostics: [] };
}

const SVG_NS = "http://www.w3.org/2000/svg";
function svg<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] { return document.createElementNS(SVG_NS, tag); }
function wrapLabel(text: string, maxCharacters = 16): string[] {
  const words = text.split(/\s+/u); const lines: string[] = []; let line = "";
  for (const word of words) { const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxCharacters || !line) line = candidate; else { lines.push(line); line = word; } }
  if (line) lines.push(line); return lines.length ? lines : [text];
}

export function mountD3BarChart(host: unknown, block: ChartBlock, _options: D3BarChartOptions): D3BarChartComponent | D3BarChartRenderModelResult {
  const result = createD3BarChartRenderModel(block); if (!result.model) return result;
  if (!(host instanceof HTMLElement)) return { diagnostics: [{ code: "INVALID_BAR_CHART_HOST", message: "D3 bar chart host must be an HTMLElement" }] };
  const model = result.model; host.innerHTML = "";
  const figure = document.createElement("figure"); figure.className = "d3-chart-figure d3-chart-figure-bar";
  const caption = document.createElement("figcaption"); caption.className = "d3-chart-caption"; caption.textContent = model.description;
  const chartSvg = svg("svg"); chartSvg.classList.add("d3-chart-svg"); chartSvg.setAttribute("role", "img"); chartSvg.setAttribute("aria-label", `${model.label}. ${model.description}`);
  const fallbackNode = document.createElement("pre"); fallbackNode.className = "d3-chart-static-fallback"; fallbackNode.textContent = model.staticFallback;
  figure.append(chartSvg, caption, fallbackNode); host.append(figure); let destroyed = false;

  const render = (): void => {
    if (destroyed) return; chartSvg.replaceChildren();
    const width = Math.max(640, Math.round(host.getBoundingClientRect().width || 960));
    const height = Math.max(460, Math.round(width * 0.52)); const margin = { top: 58, right: 36, bottom: 112, left: 92 };
    const plotWidth = Math.max(100, width - margin.left - margin.right); const plotHeight = Math.max(100, height - margin.top - margin.bottom);
    chartSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const maximum = Math.max(0, ...model.data.map((datum) => datum.value));
    const y = scaleLinear().domain([0, maximum * 1.15 || 1]).nice(5).range([margin.top + plotHeight, margin.top]);
    const x = scaleBand<string>().domain(model.data.map((datum) => datum.id)).range([margin.left, margin.left + plotWidth]).padding(0.28);
    const grid = svg("g"); grid.classList.add("d3-chart-grid"); const axis = svg("g"); axis.classList.add("d3-chart-axis-layer");
    const bars = svg("g"); bars.classList.add("d3-chart-bar-layer"); const labels = svg("g"); labels.classList.add("d3-chart-label-layer");
    for (const tick of y.ticks(5)) { const yy = y(tick); const line = svg("line"); line.classList.add("d3-chart-grid-line"); line.setAttribute("x1", String(margin.left)); line.setAttribute("x2", String(margin.left + plotWidth)); line.setAttribute("y1", String(yy)); line.setAttribute("y2", String(yy)); grid.append(line);
      const tickText = svg("text"); tickText.classList.add("d3-chart-tick-label"); tickText.setAttribute("x", String(margin.left - 16)); tickText.setAttribute("y", String(yy + 5)); tickText.setAttribute("text-anchor", "end"); tickText.textContent = String(tick); labels.append(tickText); }
    const yAxis = svg("line"); yAxis.classList.add("d3-chart-axis"); yAxis.setAttribute("x1", String(margin.left)); yAxis.setAttribute("x2", String(margin.left)); yAxis.setAttribute("y1", String(margin.top)); yAxis.setAttribute("y2", String(margin.top + plotHeight)); axis.append(yAxis);
    const xAxis = svg("line"); xAxis.classList.add("d3-chart-axis"); xAxis.setAttribute("x1", String(margin.left)); xAxis.setAttribute("x2", String(margin.left + plotWidth)); xAxis.setAttribute("y1", String(margin.top + plotHeight)); xAxis.setAttribute("y2", String(margin.top + plotHeight)); axis.append(xAxis);
    model.data.forEach((datum, index) => { const bx = x(datum.id) ?? margin.left; const by = y(datum.value); const bw = x.bandwidth(); const bh = Math.max(0, margin.top + plotHeight - by);
      const rect = svg("rect"); rect.classList.add("d3-chart-bar", `d3-chart-series-${(index % 5) + 1}`); rect.setAttribute("data-datum-id", datum.id); rect.setAttribute("x", String(bx)); rect.setAttribute("y", String(by)); rect.setAttribute("width", String(bw)); rect.setAttribute("height", String(bh)); bars.append(rect);
      const valueText = svg("text"); valueText.classList.add("d3-chart-value-label"); valueText.setAttribute("x", String(bx + bw / 2)); valueText.setAttribute("y", String(by - 14)); valueText.setAttribute("text-anchor", "middle"); valueText.textContent = String(datum.value); labels.append(valueText);
      const category = svg("text"); category.classList.add("d3-chart-category-label"); category.setAttribute("x", String(bx + bw / 2)); category.setAttribute("y", String(margin.top + plotHeight + 32)); category.setAttribute("text-anchor", "middle");
      wrapLabel(datum.category).forEach((line, lineIndex) => { const tspan = svg("tspan"); tspan.setAttribute("x", String(bx + bw / 2)); tspan.setAttribute("dy", lineIndex === 0 ? "0" : "1.15em"); tspan.textContent = line; category.append(tspan); }); labels.append(category); });
    const xTitle = svg("text"); xTitle.classList.add("d3-chart-axis-title"); xTitle.setAttribute("x", String(margin.left + plotWidth / 2)); xTitle.setAttribute("y", String(height - 18)); xTitle.setAttribute("text-anchor", "middle"); xTitle.textContent = model.xAxisLabel; labels.append(xTitle);
    const yTitle = svg("text"); yTitle.classList.add("d3-chart-axis-title"); yTitle.setAttribute("transform", `translate(24 ${margin.top + plotHeight / 2}) rotate(-90)`); yTitle.setAttribute("text-anchor", "middle"); yTitle.textContent = model.yAxisUnit ? `${model.yAxisLabel} (${model.yAxisUnit})` : model.yAxisLabel; labels.append(yTitle);
    chartSvg.append(grid, axis, bars, labels);
  };
  render(); const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => render()) : undefined; resizeObserver?.observe(host);
  return { model, staticFallback: model.staticFallback, destroy(): void { if (destroyed) return; destroyed = true; resizeObserver?.disconnect(); host.innerHTML = ""; } };
}
