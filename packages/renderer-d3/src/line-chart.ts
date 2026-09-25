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
export interface D3LineChartDiagnostic {
  readonly code: "INVALID_LINE_CHART_BLOCK" | "INVALID_LINE_CHART_HOST";
  readonly message: string;
}
export interface D3LineChartRenderModelResult {
  readonly model?: D3LineChartRenderModel;
  readonly diagnostics: readonly D3LineChartDiagnostic[];
}
export interface D3LineChartComponent {
  readonly model: D3LineChartRenderModel;
  readonly staticFallback: string;
  readonly stepCount: number;
  setStep(step: number): void;
  destroy(): void;
}

export interface D3LineChartPresentationPlan {
  readonly progressive: boolean;
  readonly stepCount: number;
  readonly traceInitiallyVisible: boolean;
}

export function lineChartPresentationPlan(annotations: readonly LineChartAnnotation[]): D3LineChartPresentationPlan {
  const progressive = annotations.length > 0;
  return {
    progressive,
    stepCount: progressive ? 1 + annotations.length : 0,
    traceInitiallyVisible: !progressive,
  };
}

function invalid(message: string): D3LineChartRenderModelResult {
  return { diagnostics: [{ code: "INVALID_LINE_CHART_BLOCK", message }] };
}

function fallback(block: LineChartBlock): string {
  const xu = block.xAxis.unit ? ` ${block.xAxis.unit}` : "";
  const yu = block.yAxis.unit ? ` ${block.yAxis.unit}` : "";
  return [
    block.label,
    block.description,
    ...block.series.flatMap((series) => [
      `Series: ${series.label}`,
      ...series.data.map((datum) => `- x=${datum.x}${xu}, y=${datum.y}${yu}`),
    ]),
    ...(block.annotations ?? []).map((annotation) => `Annotation: ${annotation.label}`),
  ].join("\n");
}

export function createD3LineChartRenderModel(block: ChartBlock): D3LineChartRenderModelResult {
  if (block.chartType !== "line") {
    return invalid("renderer-d3 line charts require a canonical line ChartBlock");
  }
  if (!block.series.length) return invalid("line chart series must not be empty");
  return {
    model: {
      version: "1.0",
      sourceBlockId: block.id,
      label: block.label,
      description: block.description,
      xAxisLabel: block.xAxis.label,
      ...(block.xAxis.unit ? { xAxisUnit: block.xAxis.unit } : {}),
      yAxisLabel: block.yAxis.label,
      ...(block.yAxis.unit ? { yAxisUnit: block.yAxis.unit } : {}),
      series: block.series,
      annotations: block.annotations ?? [],
      staticFallback: fallback(block),
    },
    diagnostics: [],
  };
}

const SVG_NS = "http://www.w3.org/2000/svg";
function svg<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

function clampStep(step: number, count: number): number {
  return Math.max(0, Math.min(count, Math.trunc(Number.isFinite(step) ? step : 0)));
}

export function mountD3LineChart(
  host: unknown,
  block: ChartBlock,
  options: D3LineChartOptions,
): D3LineChartComponent | D3LineChartRenderModelResult {
  const result = createD3LineChartRenderModel(block);
  if (!result.model) return result;
  if (!(host instanceof HTMLElement)) {
    return {
      diagnostics: [{ code: "INVALID_LINE_CHART_HOST", message: "D3 line chart host must be an HTMLElement" }],
    };
  }

  const model = result.model;
  const presentation = lineChartPresentationPlan(model.annotations);
  const stepCount = presentation.stepCount;
  let currentStep = 0;
  let destroyed = false;

  host.innerHTML = "";
  if (presentation.progressive) {
    host.setAttribute("data-presentation-step-count", String(stepCount));
    host.setAttribute("data-presentation-step-host", "chart");
  } else {
    host.removeAttribute("data-presentation-step-count");
    host.removeAttribute("data-presentation-step-host");
  }

  const figure = document.createElement("figure");
  figure.className = "d3-chart-figure d3-chart-figure-line";
  const chartSvg = svg("svg");
  chartSvg.classList.add("d3-chart-svg", "d3-chart-line-svg");
  chartSvg.setAttribute("role", "img");
  chartSvg.setAttribute("aria-label", `${model.label}. ${model.description}`);
  const caption = document.createElement("figcaption");
  caption.className = "d3-chart-caption";
  caption.textContent = model.description;
  const fallbackNode = document.createElement("pre");
  fallbackNode.className = "d3-chart-static-fallback";
  fallbackNode.textContent = model.staticFallback;
  figure.append(chartSvg, caption, fallbackNode);
  host.append(figure);

  const applyStep = (): void => {
    const traceVisible = presentation.traceInitiallyVisible || currentStep >= 1;
    for (const path of chartSvg.querySelectorAll<SVGPathElement>(".d3-chart-line")) {
      path.style.strokeDashoffset = traceVisible ? "0" : "1";
      path.style.opacity = traceVisible ? "1" : "0";
    }
    for (const point of chartSvg.querySelectorAll<SVGCircleElement>(".d3-chart-line-point")) {
      point.style.opacity = traceVisible ? "0.48" : "0";
    }
    for (const group of chartSvg.querySelectorAll<SVGGElement>("[data-annotation-step]")) {
      const requiredStep = Number(group.dataset.annotationStep ?? "999");
      const visible = currentStep >= requiredStep;
      group.style.opacity = visible ? "1" : "0";
      group.style.transform = visible ? "translateY(0)" : "translateY(8px)";
    }
  };

  const render = (): void => {
    if (destroyed) return;
    chartSvg.replaceChildren();
    const width = Math.max(680, Math.round(host.getBoundingClientRect().width || 1000));
    const height = Math.max(480, Math.round(width * 0.52));
    const margin = { top: 54, right: 58, bottom: 82, left: 98 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    chartSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const allData = model.series.flatMap((series) => series.data);
    const minX = Math.min(...allData.map((datum) => datum.x));
    const maxX = Math.max(...allData.map((datum) => datum.x));
    const maxY = Math.max(0, ...allData.map((datum) => datum.y));
    const x = scaleLinear().domain([minX, maxX]).range([margin.left, margin.left + plotWidth]);
    const y = scaleLinear().domain([0, maxY * 1.14 || 1]).nice(5).range([margin.top + plotHeight, margin.top]);

    const grid = svg("g");
    grid.classList.add("d3-chart-grid");
    for (const tick of y.ticks(5)) {
      const yy = y(tick);
      const gridLine = svg("line");
      gridLine.classList.add("d3-chart-grid-line");
      gridLine.setAttribute("x1", String(margin.left));
      gridLine.setAttribute("x2", String(margin.left + plotWidth));
      gridLine.setAttribute("y1", String(yy));
      gridLine.setAttribute("y2", String(yy));
      grid.append(gridLine);
      const tickText = svg("text");
      tickText.classList.add("d3-chart-tick-label");
      tickText.setAttribute("x", String(margin.left - 16));
      tickText.setAttribute("y", String(yy + 5));
      tickText.setAttribute("text-anchor", "end");
      tickText.textContent = String(tick);
      grid.append(tickText);
    }
    for (const tick of x.ticks(6)) {
      const tickText = svg("text");
      tickText.classList.add("d3-chart-tick-label");
      tickText.setAttribute("x", String(x(tick)));
      tickText.setAttribute("y", String(margin.top + plotHeight + 30));
      tickText.setAttribute("text-anchor", "middle");
      tickText.textContent = tick.toFixed(2);
      grid.append(tickText);
    }
    chartSvg.append(grid);

    const lines = svg("g");
    lines.classList.add("d3-chart-line-layer");
    model.series.forEach((series, index) => {
      const pathData = line<LineChartDatum>()
        .x((datum) => x(datum.x))
        .y((datum) => y(datum.y))(series.data);
      if (pathData) {
        const node = svg("path");
        node.classList.add("d3-chart-line", `d3-chart-series-${(index % 5) + 1}`);
        node.setAttribute("d", pathData);
        node.setAttribute("fill", "none");
        node.setAttribute("pathLength", "1");
        node.setAttribute("stroke-dasharray", "1");
        node.style.strokeDashoffset = "1";
        node.style.opacity = "0";
        node.style.transition = options.reducedMotion ? "none" : "stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1), opacity 180ms ease";
        lines.append(node);
      }
      for (const datum of series.data) {
        const point = svg("circle");
        point.classList.add("d3-chart-line-point");
        point.setAttribute("cx", String(x(datum.x)));
        point.setAttribute("cy", String(y(datum.y)));
        point.setAttribute("r", "4");
        point.setAttribute("data-datum-id", datum.id);
        point.style.opacity = "0";
        point.style.transition = options.reducedMotion ? "none" : "opacity 300ms ease 360ms";
        lines.append(point);
      }
    });
    chartSvg.append(lines);

    model.annotations.forEach((annotation, annotationIndex) => {
      const group = svg("g");
      group.classList.add("d3-chart-progressive-annotation");
      group.dataset.annotationStep = String(annotationIndex + 2);
      group.dataset.annotationIndex = String(annotationIndex);
      group.dataset.annotationId = annotation.id;
      group.style.opacity = "0";
      group.style.transform = "translateY(8px)";
      group.style.transition = options.reducedMotion ? "none" : "opacity 360ms ease, transform 360ms cubic-bezier(.2,.8,.2,1)";

      const series = model.series.find((candidate) => candidate.id === annotation.seriesId);
      if (!series) return;

      if (annotation.kind === "x-range") {
        const startIndex = series.data.findIndex((datum) => datum.id === annotation.startDatumId);
        const endIndex = series.data.findIndex((datum) => datum.id === annotation.endDatumId);
        if (startIndex < 0 || endIndex < startIndex) return;
        const selectedData = series.data.slice(startIndex, endIndex + 1);
        const areaPath = area<LineChartDatum>()
          .x((datum) => x(datum.x))
          .y0(y(0))
          .y1((datum) => y(datum.y))(selectedData);
        if (areaPath) {
          const areaNode = svg("path");
          areaNode.classList.add("d3-chart-range-highlight");
          areaNode.setAttribute("d", areaPath);
          group.append(areaNode);
        }
        const label = svg("text");
        label.classList.add("d3-chart-annotation-label", "d3-chart-range-label");
        label.setAttribute("x", String((x(selectedData[0]!.x) + x(selectedData[selectedData.length - 1]!.x)) / 2));
        label.setAttribute("y", String(margin.top + 30));
        label.setAttribute("text-anchor", "middle");
        label.textContent = annotation.label;
        group.append(label);
      } else {
        const datum = series.data.find((candidate) => candidate.id === annotation.datumId);
        if (!datum) return;
        const pointAnnotationIndex = model.annotations
          .slice(0, annotationIndex + 1)
          .filter((item) => item.kind === "point").length - 1;
        const px = x(datum.x);
        const py = y(datum.y);
        const dx = pointAnnotationIndex % 2 === 0 ? 72 : -72;
        const dy = pointAnnotationIndex % 2 === 0 ? -46 : 50;

        const focus = svg("circle");
        focus.classList.add("d3-chart-annotation-focus");
        focus.setAttribute("cx", String(px));
        focus.setAttribute("cy", String(py));
        focus.setAttribute("r", "8");
        group.append(focus);

        const connector = svg("path");
        connector.classList.add("d3-chart-annotation-connector");
        connector.setAttribute("d", `M ${px} ${py} L ${px + dx * 0.55} ${py + dy * 0.55} L ${px + dx} ${py + dy}`);
        group.append(connector);
        const label = svg("text");
        label.classList.add("d3-chart-annotation-label");
        label.setAttribute("x", String(px + dx));
        label.setAttribute("y", String(py + dy));
        label.setAttribute("text-anchor", dx > 0 ? "start" : "end");
        label.textContent = annotation.label;
        group.append(label);
      }
      chartSvg.append(group);
    });

    const axes = svg("g");
    axes.classList.add("d3-chart-axis-layer");
    const xAxis = svg("line");
    xAxis.classList.add("d3-chart-axis");
    xAxis.setAttribute("x1", String(margin.left));
    xAxis.setAttribute("x2", String(margin.left + plotWidth));
    xAxis.setAttribute("y1", String(margin.top + plotHeight));
    xAxis.setAttribute("y2", String(margin.top + plotHeight));
    axes.append(xAxis);
    const yAxis = svg("line");
    yAxis.classList.add("d3-chart-axis");
    yAxis.setAttribute("x1", String(margin.left));
    yAxis.setAttribute("x2", String(margin.left));
    yAxis.setAttribute("y1", String(margin.top));
    yAxis.setAttribute("y2", String(margin.top + plotHeight));
    axes.append(yAxis);
    const xTitle = svg("text");
    xTitle.classList.add("d3-chart-axis-title");
    xTitle.setAttribute("x", String(margin.left + plotWidth / 2));
    xTitle.setAttribute("y", String(height - 18));
    xTitle.setAttribute("text-anchor", "middle");
    xTitle.textContent = model.xAxisUnit ? `${model.xAxisLabel} (${model.xAxisUnit})` : model.xAxisLabel;
    axes.append(xTitle);
    const yTitle = svg("text");
    yTitle.classList.add("d3-chart-axis-title");
    yTitle.setAttribute("transform", `translate(26 ${margin.top + plotHeight / 2}) rotate(-90)`);
    yTitle.setAttribute("text-anchor", "middle");
    yTitle.textContent = model.yAxisUnit ? `${model.yAxisLabel} (${model.yAxisUnit})` : model.yAxisLabel;
    axes.append(yTitle);
    chartSvg.append(axes);

    applyStep();
  };

  const setStep = (step: number): void => {
    const next = clampStep(step, stepCount);
    if (next === currentStep) return;
    currentStep = next;
    applyStep();
  };

  const stepListener: EventListener = (event) => {
    const step = (event as CustomEvent<{ step?: unknown }>).detail?.step;
    if (typeof step === "number") setStep(step);
  };

  if (presentation.progressive) host.addEventListener("pcd-presentation-step", stepListener);
  render();
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => render()) : undefined;
  observer?.observe(host);

  return {
    model,
    staticFallback: model.staticFallback,
    stepCount,
    setStep,
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      if (presentation.progressive) host.removeEventListener("pcd-presentation-step", stepListener);
      observer?.disconnect();
      host.innerHTML = "";
    },
  };
}
