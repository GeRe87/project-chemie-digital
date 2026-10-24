import { scaleLinear, scalePoint } from "d3-scale";
import { dotPlotStaticFallback, type ChartBlock, type DotPlotBlock } from "../../core/src/scene-document.ts";
import { appendDotLegendEntry, dotSummaryDiamond } from "./dot-plot-primitives.ts";
import {chartLabelLines} from "./chart-labels.ts";

export interface D3DotPlotOptions { readonly reducedMotion: boolean; }

export function createD3DotPlotRenderModel(block: ChartBlock) {
  if (block.chartType !== "dot") return { diagnostics: [{ code: "INVALID_DOT_PLOT_BLOCK", message: "Expected a dot ChartBlock" }] };
  return { model: { ...block, staticFallback: dotPlotStaticFallback(block) }, diagnostics: [] };
}

const SVG_NS = "http://www.w3.org/2000/svg";
function svg<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

/** Geometry is derived only from the generic contract, never from a resource identity. */
export function dotPlotGeometry(block: DotPlotBlock, width: number, height: number) {
  const values = block.groups.flatMap((group) => group.data.map((datum) => datum.value));
  values.push(...block.groups.flatMap(group => group.summary ? [group.summary.value] : []));
  values.push(...block.groups.flatMap(group=>group.interval?[group.interval.lower,group.interval.upper]:[]));
  values.push(...(block.curves ?? []).flatMap(curve => curve.data.map(datum => datum.y)));
  if (block.referenceLine) values.push(block.referenceLine.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min || Math.abs(max) || 1) * 0.18;
  const labelWidth=(width-190)/Math.max(1,block.groups.length);
  const labelRows=block.xScale||block.drawStems?1:Math.max(...block.groups.map(g=>chartLabelLines(g.label,labelWidth).length));
  const bottom=45+labelRows*24;
  const y = scaleLinear().domain([block.yMinimum ?? min - padding, max + padding]).nice(5).range([height - bottom, block.groups.some(g=>g.interval)?75:50]);
  // nice() must not move an explicitly authored lower domain boundary.
  if (block.yMinimum !== undefined) y.domain([block.yMinimum, y.domain()[1]!]);
  const x = scalePoint<string>().domain(block.drawStems ? block.groups.flatMap(g => g.data.map(d => d.id)) : block.groups.map((group) => group.id)).range([100, width - 90]).padding(0.7);
  const coordinates = [...block.groups.flatMap(group => group.x === undefined ? [] : [group.x]),
    ...(block.curves ?? []).flatMap(curve => curve.data.map(datum => datum.x))];
  const numericX = block.xScale === "linear"
    ? scaleLinear().domain([Math.min(...coordinates), Math.max(...coordinates)]).range([100, width - 45]) : undefined;
  return { x, y, numericX };
}

export function mountD3DotPlot(host: unknown, block: ChartBlock, _options: D3DotPlotOptions) {
  const result = createD3DotPlotRenderModel(block);
  if (!result.model) return result;
  if (!(host instanceof HTMLElement)) return { diagnostics: [{ code: "INVALID_DOT_PLOT_HOST", message: "Dot plot host must be an HTMLElement" }] };
  const model = result.model;
  host.replaceChildren();
  const figure = document.createElement("figure");
  figure.className = "d3-chart-figure d3-dot-plot-figure";
  const canvas = svg("svg");
  canvas.classList.add("d3-chart-svg", "d3-dot-plot-svg");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${model.label}. ${model.description}`);
  const fallback = document.createElement("pre");
  fallback.className = "d3-chart-static-fallback";
  fallback.textContent = model.staticFallback;
  const caption = document.createElement("figcaption");
  caption.className = "d3-chart-caption";
  caption.textContent = model.description;
  const legend = document.createElement("div");
  legend.className = "d3-dot-legend";
  const legendEntry = (label: string, kind: string) => {
    appendDotLegendEntry(legend, label, kind);
  };
  if (block.observationLabel) legendEntry(block.observationLabel, "observation");
  if (block.groups.some(group => group.summary)) legendEntry(block.summaryLabel ?? "Group summary", "summary");
   if (block.referenceLine) legendEntry(`${block.referenceLine.label}: ${Number(block.referenceLine.value.toFixed(3))} ${block.yAxis.unit}`, "reference");
  for (const curve of block.curves ?? []) legendEntry(curve.label, "curve");
  for (const group of block.groups) if(group.interval) legendEntry(`${group.interval.label} ${block.yAxis.unit}`, "reference");
  if (block.drawStems) for (const [index, group] of block.groups.entries()) {
    legendEntry(group.label, "observation");
    legend.lastElementChild?.classList.add(`d3-chart-series-${index % 5 + 1}`);
    legend.lastElementChild?.querySelector("i")?.setAttribute("style", `background:var(--pcd-chart-series-${index % 5 + 1})`);
  }
  figure.append(legend, canvas, caption, fallback);
  host.append(figure);

  const render = () => {
    canvas.replaceChildren();
    const width = Math.max(600, Math.round(host.getBoundingClientRect().width || 900));
    const height = Math.max(370, Math.min(520, width * .48));
    canvas.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const { x, y, numericX } = dotPlotGeometry(model, width, height);
    const groupX = (group: DotPlotBlock["groups"][number]) => numericX ? numericX(group.x!) : x(group.id)!;
    const text = (label: string, xx: number, yy: number, className: string, anchor = "middle") => {
      const node = svg("text");
      node.textContent = label;
      node.setAttribute("x", String(xx)); node.setAttribute("y", String(yy));
      node.setAttribute("text-anchor", anchor); node.classList.add(className);
      canvas.append(node);
      return node;
    };
    for (const tick of y.ticks(6)) {
      const grid = svg("line");
      grid.classList.add("d3-chart-grid-line");
      grid.setAttribute("x1", "100"); grid.setAttribute("x2", String(width - (numericX ? 45 : 90)));
      grid.setAttribute("y1", String(y(tick))); grid.setAttribute("y2", String(y(tick)));
      canvas.append(grid);
      text(String(tick), 83, y(tick) + 5, "d3-chart-tick-label", "end");
    }
    text(`${model.yAxis.label} (${model.yAxis.unit})`, 100, 30, "d3-chart-axis-title", "start");
    text(model.xAxis.label, width / 2, height - 8, "d3-chart-axis-title");
    if (model.referenceLine) {
      const reference = model.referenceLine;
      const line = svg("line");
      line.classList.add("d3-dot-reference-line");
      line.setAttribute("data-reference-id", reference.id);
      line.setAttribute("x1", "100"); line.setAttribute("x2", String(width - (numericX ? 45 : 90)));
      line.setAttribute("y1", String(y(reference.value))); line.setAttribute("y2", String(y(reference.value)));
      canvas.append(line);
    }
    if (numericX) {
      const ticks = [...new Set([numericX.domain()[0]!, ...numericX.ticks(6), numericX.domain()[1]!])];
      for (const tick of ticks) text(String(tick), numericX(tick), height - 39, "d3-chart-category-label");
      for (const curve of model.curves ?? []) {
        const path = svg("path");
        path.classList.add("d3-dot-curve"); path.setAttribute("data-series-id", curve.id);
        path.setAttribute("d", curve.data.map((point, i) => `${i ? "L" : "M"}${numericX(point.x)},${y(point.y)}`).join(" "));
        canvas.append(path);
      }
    }
    const halos = svg("g");
    const points = svg("g");
    model.groups.forEach((group, index) => {
      if (!numericX && !model.drawStems){
        const label=text("",x(group.id)!,y.range()[0]+26,"d3-chart-category-label");
        for(const [i,line] of chartLabelLines(group.label,(width-190)/model.groups.length).entries()){
          const span=svg("tspan");span.setAttribute("x",String(x(group.id)!));span.setAttribute("dy",i?"24":"0");span.textContent=line;label.append(span);
        }
      }
      const layer = svg("g");
      layer.setAttribute("data-group-id", group.id);
      if(group.interval){
        const interval=group.interval,xx=groupX(group),half=Math.min(40,x.step()*.22),top=y(interval.upper),bottom=y(interval.lower);
        const band=svg("rect");band.classList.add("d3-dot-interval",`d3-chart-series-${index%5+1}`);band.setAttribute("x",String(xx-half));band.setAttribute("width",String(half*2));band.setAttribute("y",String(top));band.setAttribute("height",String(bottom-top));band.setAttribute("data-interval-id",interval.id);canvas.append(band);
        for(const value of [interval.lower,interval.upper]){const line=svg("line");line.classList.add("d3-dot-interval-bound");for(const[k,v]of Object.entries({x1:xx-half,x2:xx+half,y1:y(value),y2:y(value)}))line.setAttribute(k,String(v));canvas.append(line);}
        const count=group.data.filter(d=>d.value>=interval.lower&&d.value<=interval.upper).length;
        text(`${count}/${group.data.length} = ${Number((100*count/group.data.length).toFixed(1))}%`,xx,62,"d3-chart-tick-label");
      }
      group.data.forEach((datum, datumIndex) => {
        // Equal values are stacked horizontally without changing their numeric position.
        const equals = group.data.filter((item) => item.value === datum.value);
        const rank = group.data.slice(0, datumIndex).filter((item) => item.value === datum.value).length;
        // A categorical strip can spread observations within its category so a
        // larger summary marker does not hide them. Numeric x values never move.
        const strip = (group.summary||group.interval) && group.data.length > 1
          ? (datumIndex / (group.data.length - 1) - .5) * Math.min(32, x.step() * .35)
          : (rank - (equals.length - 1) / 2) * 22;
        const xx = model.drawStems ? x(datum.id)! : groupX(group) + (numericX ? 0 : strip);
        if (model.drawStems && model.referenceLine) {
          text(datum.label!, xx, height - 39, "d3-chart-category-label");
          const stem = svg("line"); stem.classList.add("d3-deviation-stem", `d3-chart-series-${index % 5 + 1}`);
          stem.setAttribute("data-datum-id", datum.id); stem.setAttribute("x1", String(xx)); stem.setAttribute("x2", String(xx));
          stem.setAttribute("y1", String(y(model.referenceLine.value))); stem.setAttribute("y2", String(y(datum.value)));
          const deviation = datum.value - model.referenceLine.value;
          const signed = `${deviation >= 0 ? "+" : ""}${deviation.toFixed(2)}`;
          stem.setAttribute("data-deviation", String(deviation)); canvas.append(stem);
          const side = datumIndex % 2 === 0 ? -1 : 1;
          text(signed, xx + (deviation < 0 ? side * 8 : 0), y(datum.value) + (deviation >= 0 ? -14 : 25),
            "d3-chart-tick-label", deviation >= 0 ? "middle" : side < 0 ? "end" : "start");
        }
        const point = svg("circle");
        point.classList.add("d3-dot-point", `d3-chart-series-${model.observationLabel ? 1 : index % 5 + 1}`);
        point.setAttribute("data-datum-id", datum.id);
        point.setAttribute("cx", String(xx)); point.setAttribute("cy", String(y(datum.value))); point.setAttribute("r", String(model.markerRadius ?? 5));
        point.setAttribute("opacity", String(model.markerOpacity ?? 1));
        const halo = svg("circle");
        halo.classList.add("d3-dot-point-halo");
        halo.setAttribute("cx", String(xx)); halo.setAttribute("cy", String(y(datum.value))); halo.setAttribute("r", "7.5");
        if (model.markerOpacity === undefined || model.markerOpacity === 1) halos.append(halo);
        const title = svg("title"); title.textContent = `${group.label}: ${datum.value} ${model.yAxis.unit}`;
        point.append(title); layer.append(point);
      });
      points.append(layer);
    });
    // Keep every halo below every point, and all observations above the lines.
    canvas.append(halos, points);
    for (const group of model.groups) {
      if (!group.summary) continue;
      const summary = group.summary;
      const marker = svg("path");
      const r = model.summaryRadius ?? 9, xx = groupX(group), yy = y(summary.value);
      marker.classList.add("d3-dot-summary"); marker.setAttribute("data-result-id", summary.id);
      marker.setAttribute("d", dotSummaryDiamond(xx, yy, r));
      const title = svg("title"); title.textContent = `${group.label}, ${summary.label}: ${summary.value} ${model.yAxis.unit}`;
      marker.append(title); canvas.append(marker);
    }
  };
  render();
  const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(render);
  observer?.observe(host);
  return { model, staticFallback: model.staticFallback, destroy() { observer?.disconnect(); host.replaceChildren(); } };
}
