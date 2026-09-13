import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import type { ChartBlock, LineChartAnnotation, LineChartBlock, LineChartDatum } from "../../core/src/scene-document.ts";

export interface D3LineChartOptions { readonly reducedMotion: boolean; }
export interface D3LineChartRenderModel {
  readonly version: "1.0";
  readonly sourceBlockId: string;
  readonly label: string;
  readonly description: string;
  readonly xAxisLabel: string;
  readonly xAxisUnit?: string;
  readonly yAxisLabel: string;
  readonly yAxisUnit?: string;
  readonly series: LineChartBlock["series"];
  readonly annotations: readonly LineChartAnnotation[];
  readonly staticFallback: string;
}
export interface D3LineChartDiagnostic { readonly code: "INVALID_LINE_CHART_BLOCK" | "INVALID_LINE_CHART_HOST"; readonly message: string; }
export interface D3LineChartRenderModelResult { readonly model?: D3LineChartRenderModel; readonly diagnostics: readonly D3LineChartDiagnostic[]; }
export interface D3LineChartComponent { readonly model: D3LineChartRenderModel; readonly staticFallback: string; destroy(): void; }

function invalid(message: string): D3LineChartRenderModelResult {
  return { diagnostics: [{ code: "INVALID_LINE_CHART_BLOCK", message }] };
}
function fallback(block: LineChartBlock): string {
  const xu = block.xAxis.unit ? ` ${block.xAxis.unit}` : "";
  const yu = block.yAxis.unit ? ` ${block.yAxis.unit}` : "";
  return [block.label, block.description,
    ...block.series.flatMap((series) => [`Series: ${series.label}`, ...series.data.map((d) => `- x=${d.x}${xu}, y=${d.y}${yu}`)]),
    ...(block.annotations ?? []).map((a) => `Annotation: ${a.label}`),
  ].join("\n");
}
export function createD3LineChartRenderModel(block: ChartBlock): D3LineChartRenderModelResult {
  if (block.chartType !== "line") return invalid("renderer-d3 line charts require a canonical line ChartBlock");
  if (!block.series.length) return invalid("line chart series must not be empty");
  return { model: {
    version: "1.0", sourceBlockId: block.id, label: block.label, description: block.description,
    xAxisLabel: block.xAxis.label, ...(block.xAxis.unit ? { xAxisUnit: block.xAxis.unit } : {}),
    yAxisLabel: block.yAxis.label, ...(block.yAxis.unit ? { yAxisUnit: block.yAxis.unit } : {}),
    series: block.series, annotations: block.annotations ?? [], staticFallback: fallback(block),
  }, diagnostics: [] };
}
const SVG_NS = "http://www.w3.org/2000/svg";
function svg<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] { return document.createElementNS(SVG_NS, tag); }

export function mountD3LineChart(host: unknown, block: ChartBlock, options: D3LineChartOptions): D3LineChartComponent | D3LineChartRenderModelResult {
  const result = createD3LineChartRenderModel(block);
  if (!result.model) return result;
  if (!(host instanceof HTMLElement)) return { diagnostics: [{ code: "INVALID_LINE_CHART_HOST", message: "D3 line chart host must be an HTMLElement" }] };
  const model = result.model;
  host.innerHTML = "";
  const figure = document.createElement("figure"); figure.className = "d3-chart-figure d3-chart-figure-line";
  const chartSvg = svg("svg"); chartSvg.classList.add("d3-chart-svg", "d3-chart-line-svg"); chartSvg.setAttribute("role", "img"); chartSvg.setAttribute("aria-label", `${model.label}. ${model.description}`);
  const caption = document.createElement("figcaption"); caption.className = "d3-chart-caption"; caption.textContent = model.description;
  const fallbackNode = document.createElement("pre"); fallbackNode.className = "d3-chart-static-fallback"; fallbackNode.textContent = model.staticFallback;
  figure.append(chartSvg, caption, fallbackNode); host.append(figure);
  let destroyed = false;
  const render = (): void => {
    if (destroyed) return; chartSvg.replaceChildren();
    const width = Math.max(680, Math.round(host.getBoundingClientRect().width || 1000));
    const height = Math.max(480, Math.round(width * 0.52));
    const margin = { top: 54, right: 58, bottom: 82, left: 98 };
    const plotWidth = width - margin.left - margin.right; const plotHeight = height - margin.top - margin.bottom;
    chartSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const allData = model.series.flatMap((s) => s.data);
    const minX = Math.min(...allData.map((d) => d.x)); const maxX = Math.max(...allData.map((d) => d.x)); const maxY = Math.max(0, ...allData.map((d) => d.y));
    const x = scaleLinear().domain([minX, maxX]).range([margin.left, margin.left + plotWidth]);
    const y = scaleLinear().domain([0, maxY * 1.14 || 1]).nice(5).range([margin.top + plotHeight, margin.top]);
    const grid = svg("g"); grid.classList.add("d3-chart-grid");
    for (const tick of y.ticks(5)) {
      const yy = y(tick); const gl = svg("line"); gl.classList.add("d3-chart-grid-line"); gl.setAttribute("x1", String(margin.left)); gl.setAttribute("x2", String(margin.left + plotWidth)); gl.setAttribute("y1", String(yy)); gl.setAttribute("y2", String(yy)); grid.append(gl);
      const t = svg("text"); t.classList.add("d3-chart-tick-label"); t.setAttribute("x", String(margin.left - 16)); t.setAttribute("y", String(yy + 5)); t.setAttribute("text-anchor", "end"); t.textContent = String(tick); grid.append(t);
    }
    for (const tick of x.ticks(6)) { const t = svg("text"); t.classList.add("d3-chart-tick-label"); t.setAttribute("x", String(x(tick))); t.setAttribute("y", String(margin.top + plotHeight + 30)); t.setAttribute("text-anchor", "middle"); t.textContent = tick.toFixed(2); grid.append(t); }
    chartSvg.append(grid);
    const highlights = svg("g"); highlights.classList.add("d3-chart-highlight-layer");
    for (const a of model.annotations.filter((item) => item.kind === "x-range")) {
      const series = model.series.find((s) => s.id === a.seriesId); if (!series) continue;
      const i0 = series.data.findIndex((d) => d.id === a.startDatumId); const i1 = series.data.findIndex((d) => d.id === a.endDatumId); if (i0 < 0 || i1 < i0) continue;
      const selected = series.data.slice(i0, i1 + 1); const d = area<LineChartDatum>().x((v) => x(v.x)).y0(y(0)).y1((v) => y(v.y))(selected);
      if (d) { const node = svg("path"); node.classList.add("d3-chart-range-highlight"); node.setAttribute("d", d); highlights.append(node); }
      const label = svg("text"); label.classList.add("d3-chart-annotation-label", "d3-chart-range-label"); label.setAttribute("x", String((x(selected[0]!.x) + x(selected[selected.length - 1]!.x)) / 2)); label.setAttribute("y", String(margin.top + 30)); label.setAttribute("text-anchor", "middle"); label.textContent = a.label; highlights.append(label);
    }
    chartSvg.append(highlights);
    const lines = svg("g"); lines.classList.add("d3-chart-line-layer");
    model.series.forEach((series, idx) => {
      const d = line<LineChartDatum>().x((v) => x(v.x)).y((v) => y(v.y))(series.data);
      if (d) { const node = svg("path"); node.classList.add("d3-chart-line", `d3-chart-series-${(idx % 5) + 1}`); node.setAttribute("d", d); node.setAttribute("fill", "none"); lines.append(node); }
      for (const v of series.data) { const c = svg("circle"); c.classList.add("d3-chart-line-point"); c.setAttribute("cx", String(x(v.x))); c.setAttribute("cy", String(y(v.y))); c.setAttribute("r", "4"); c.setAttribute("data-datum-id", v.id); lines.append(c); }
    });
    chartSvg.append(lines);
    const annotations = svg("g"); annotations.classList.add("d3-chart-annotation-layer");
    model.annotations.filter((item) => item.kind === "point").forEach((a, idx) => {
      const series = model.series.find((s) => s.id === a.seriesId); const datum = series?.data.find((d) => d.id === a.datumId); if (!datum) return;
      const px = x(datum.x), py = y(datum.y), dx = idx % 2 === 0 ? 72 : -72, dy = idx % 2 === 0 ? -46 : 50;
      const connector = svg("path"); connector.classList.add("d3-chart-annotation-connector"); connector.setAttribute("d", `M ${px} ${py} L ${px + dx * 0.55} ${py + dy * 0.55} L ${px + dx} ${py + dy}`); annotations.append(connector);
      const label = svg("text"); label.classList.add("d3-chart-annotation-label"); label.setAttribute("x", String(px + dx)); label.setAttribute("y", String(py + dy)); label.setAttribute("text-anchor", dx > 0 ? "start" : "end"); label.textContent = a.label; annotations.append(label);
    });
    chartSvg.append(annotations);
    const axes = svg("g"); axes.classList.add("d3-chart-axis-layer");
    const xa = svg("line"); xa.classList.add("d3-chart-axis"); xa.setAttribute("x1", String(margin.left)); xa.setAttribute("x2", String(margin.left + plotWidth)); xa.setAttribute("y1", String(margin.top + plotHeight)); xa.setAttribute("y2", String(margin.top + plotHeight)); axes.append(xa);
    const ya = svg("line"); ya.classList.add("d3-chart-axis"); ya.setAttribute("x1", String(margin.left)); ya.setAttribute("x2", String(margin.left)); ya.setAttribute("y1", String(margin.top)); ya.setAttribute("y2", String(margin.top + plotHeight)); axes.append(ya);
    const xt = svg("text"); xt.classList.add("d3-chart-axis-title"); xt.setAttribute("x", String(margin.left + plotWidth / 2)); xt.setAttribute("y", String(height - 18)); xt.setAttribute("text-anchor", "middle"); xt.textContent = model.xAxisUnit ? `${model.xAxisLabel} (${model.xAxisUnit})` : model.xAxisLabel; axes.append(xt);
    const yt = svg("text"); yt.classList.add("d3-chart-axis-title"); yt.setAttribute("transform", `translate(26 ${margin.top + plotHeight / 2}) rotate(-90)`); yt.setAttribute("text-anchor", "middle"); yt.textContent = model.yAxisUnit ? `${model.yAxisLabel} (${model.yAxisUnit})` : model.yAxisLabel; axes.append(yt);
    chartSvg.append(axes);
  };
  render();
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => render()) : undefined; observer?.observe(host);
  return { model, staticFallback: model.staticFallback, destroy(): void { if (destroyed) return; destroyed = true; observer?.disconnect(); host.innerHTML = ""; } };
}
