import type { ChartBlock } from "../../core/src/scene-document.ts";
import { cumulativeCount, empiricalSteps, orderedObservations } from "../../core/src/empirical-distribution.ts";
import { observationExplorerFallback, validateObservationExplorer, type ObservationExplorerBlock } from "../../core/src/observation-explorer.ts";
import katex from "katex";
import { mountSummaryComparison } from "./summary-comparison.ts";
import {mountMomentMatrix} from "./moment-matrix.ts";

const NS = "http://www.w3.org/2000/svg";
const format = (value: number) => Number(value.toFixed(4)).toString();
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number>, text?: string) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Dedicated step geometry: horizontal intervals, separate open/closed endpoints.
 * Vertical dashed guides are not interpolated values of the ECDF. */
export function ecdfGeometry(block: ObservationExplorerBlock) {
  validateObservationExplorer(block);
  const t = block.threshold!;
  const steps = empiricalSteps(block.series[0].data);
  return steps.map((s, i) => ({ ...s, end: steps[i + 1]?.value ?? t.maximum }));
}

export function mountObservationExplorer(host: unknown, chart: ChartBlock) {
  if (chart.chartType !== "observations" || typeof HTMLElement === "undefined" || !(host instanceof HTMLElement)) return { diagnostics: [{ code: "INVALID_OBSERVATION_EXPLORER", message: "Expected observation chart and HTML host" }] };
  const block = chart;
  validateObservationExplorer(block);
  if (block.view === "summary") return mountSummaryComparison(host, block);
  if (block.view === "moments") return mountMomentMatrix(host,block);
  let threshold = block.threshold?.initial ?? 0;
  let sorted = false;
  let activeId: string | undefined;
  let variant = 0;
  const shell = element("div", "observation-explorer");
  shell.dataset.view = block.view;
  const interactive=block.interactive!==false;
  shell.dataset.compact=String(!!block.compact);
  if(interactive)shell.dataset.presentationInteractive="true";
  const description = element("p", "oe-description", block.description);
  const controls = element("div", "oe-controls");
  const stage = element("div", "oe-stage");
  const readout = element("output", "oe-readout");
  readout.setAttribute("aria-live", "polite"); readout.setAttribute("aria-atomic", "true");
  const rows = element("div", "oe-rows");
  const fallback = element("details", "oe-data");
  fallback.append(element("summary", "", "Data & accessible description"), element("pre", "", observationExplorerFallback(block)));
  const reset = element("button", "oe-reset", "Reset"); reset.type = "button";
  let range: HTMLInputElement | undefined;
  let number: HTMLInputElement | undefined;
  let sort: HTMLButtonElement | undefined;
  const feedback = element("span", "oe-validation"); feedback.setAttribute("aria-live", "polite");

  const choose = (id: string) => { activeId = activeId === id ? undefined : id; render(); };
  const renderRows = () => {
    rows.replaceChildren();
    if(block.compact)return;
    const series = block.view === "compare" ? block.series.slice(0, variant + 1) : block.series;
    for (const s of series) {
      // Never emit <section> here: Reveal reserves it for presentation scenes.
      const row = element("div", "oe-series");
      row.append(element("h3", "oe-series-label", `${s.label} · ${block.xAxis.unit ?? ""}`));
      if (block.view === "compare") {
        const all = block.series.flatMap(series => series.data.map(d => d.value));
        const lo = Math.min(0, ...all), hi = Math.max(...all);
        const span = hi - lo || 1;
        const x = (value: number) => 35 + (value - lo) / span * 850;
        const plot = svg("svg", {viewBox:"0 0 930 100",role:"img","aria-label":`${s.label}: ${s.data.map(d => `${d.label} ${d.value}`).join(", ")} ${block.xAxis.unit ?? ""}. Both series use the same concentration scale.`});
        plot.classList.add("oe-comparison-plot");
        plot.append(svg("line", {x1:35,x2:885,y1:65,y2:65,class:"oe-grid"}));
        for (const value of [...new Set([lo, hi])]) plot.append(svg("text",{x:x(value),y:92,"text-anchor":"middle",class:"oe-tick"},format(value)));
        const stacked = new Map<number,number>();
        for (const d of s.data) {
          const stack = stacked.get(d.value) ?? 0; stacked.set(d.value,stack+1);
          const dot = svg("circle",{cx:x(d.value),cy:53-stack*18,r:7,class:"oe-closed"});
          dot.append(svg("title",{},`${d.label}: ${d.value} ${block.xAxis.unit ?? ""}`)); plot.append(dot);
        }
        row.append(plot);
      }
      const data = sorted ? orderedObservations(s.data) : s.data;
      const strip = element("div", "oe-observations");
      for (const [index, d] of data.entries()) {
        const included = d.value <= threshold;
        const card = element("button", "oe-observation"); card.type = "button";
        card.dataset.observationId = d.id;
        card.setAttribute("aria-pressed", String(activeId === d.id));
        card.dataset.included = String(!!block.threshold && included);
        card.dataset.selected = String(activeId === d.id);
        card.append(element("span", "oe-identity", d.label), element("strong", "oe-value", format(d.value)),
          element("span", "oe-rank", sorted ? `x₍${index + 1}₎ · rank ${index + 1}` : `position ${index + 1}`));
        card.setAttribute("aria-label", `${d.label}, ${d.value} ${block.xAxis.unit ?? ""}, ${sorted ? "rank" : "display position"} ${index+1}${block.threshold ? included ? ", included: at or below threshold" : ", above threshold" : ""}`);
        card.onclick = () => choose(d.id);
        strip.append(card);
      }
      row.append(strip); rows.append(row);
    }
  };
  const renderECDF = () => {
    stage.replaceChildren();
    const t = block.threshold!;
    const width = Math.max(320, Math.min(1120, Math.round(stage.clientWidth || 960)));
    const height = block.compact?370:260, left = 54, right = width - 24, top = 25, bottom = height-48;
    const x = (v: number) => left + (v - t.minimum) / (t.maximum - t.minimum) * (right-left);
    const y = (v: number) => bottom - v * (bottom-top);
    const graph = svg("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": `${block.label}. Open circles are excluded left limits; filled circles are the value at each jump. Dashed vertical segments only mark jumps.` });
    for (const q of [0, .25, .5, .75, 1]) {
      graph.append(svg("line", {x1:left,x2:right,y1:y(q),y2:y(q),class:"oe-grid"}), svg("text", {x:left-12,y:y(q)+5,"text-anchor":"end",class:"oe-tick"},format(q)));
    }
    graph.append(svg("text", {x:left,y:16,class:"oe-axis-title"},block.yAxis.label));
    const allSteps=block.series.flatMap(series=>empiricalSteps(series.data));
    const ticks = [...new Set(allSteps.length<=12?[t.minimum,...allSteps.map(s=>s.value),t.maximum]:Array.from({length:6},(_,i)=>t.minimum+i*(t.maximum-t.minimum)/5))];
    for (const v of ticks) graph.append(svg("text", {x:x(v),y:bottom+24,"text-anchor":"middle",class:"oe-tick"},format(v)));
    graph.append(svg("text", {x:(left+right)/2,y:height-3,"text-anchor":"middle",class:"oe-axis-title"},`${block.xAxis.label} (${block.xAxis.unit ?? ""})`));
    const legend=element("div","oe-legend");
    block.series.forEach((series,index)=>{
      const color=`var(--pcd-chart-series-${index%4+1})`,label=element("span","",series.label);label.style.color=color;legend.append(label);
      const g=svg("g",{"data-series-id":series.id}),raw=empiricalSteps(series.data),steps=raw.map((s,i)=>({...s,end:raw[i+1]?.value??t.maximum}));
      const append=(node:SVGElement,open=false)=>{node.style.stroke=color;if(node.tagName==="circle")node.style.fill=open?"var(--pcd-chart-surface)":color;g.append(node);};
      append(svg("line",{x1:left,x2:x(steps[0].value),y1:y(0),y2:y(0),class:"oe-step"}));
      for(const s of steps){append(svg("line",{x1:x(s.value),x2:x(s.end),y1:y(s.right),y2:y(s.right),class:"oe-step"}));append(svg("line",{x1:x(s.value),x2:x(s.value),y1:y(s.left),y2:y(s.right),class:"oe-jump"}));
        append(svg("circle",{cx:x(s.value),cy:y(s.left),r:raw.length>20?2.2:5,class:"oe-open"}),true);append(svg("circle",{cx:x(s.value),cy:y(s.right),r:raw.length>20?2.2:5,class:"oe-closed"}));}
      const result=cumulativeCount(series.data,threshold);append(svg("circle",{cx:x(threshold),cy:y(result.fraction),r:7,class:"oe-current"}));graph.append(g);
    });
    graph.append(svg("line",{x1:x(threshold),x2:x(threshold),y1:top,y2:bottom,class:"oe-threshold"}));
    if(block.series.length>1)stage.append(legend);
    stage.append(graph);
  };
  function render() {
    // Preserve the identity and focus when rebuilding order-dependent cards.
    const focused = rows.contains(document.activeElement) ? (document.activeElement as HTMLElement)?.dataset.observationId : undefined;
    renderRows();
    if (block.view === "ecdf") renderECDF();
    if (block.threshold) {
      readout.replaceChildren(...block.series.map(series=>{const r=cumulativeCount(series.data,threshold);return element("span","oe-count",`${block.series.length>1?series.label+": ":""}${r.count} / ${r.total} = ${format(100*r.fraction)}%`);}),element("span","oe-condition",`observations ≤ ${format(threshold)} ${block.xAxis.unit??""}`));
      if(block.series.length===1){const r=cumulativeCount(block.series[0].data,threshold);readout.replaceChildren(element("span","oe-count",`${r.count} / ${r.total}`),element("span","oe-fraction",`≈ ${format(r.fraction)} · ${format(100*r.fraction)}%`),element("span","oe-condition",`observations ≤ ${format(threshold)} ${block.xAxis.unit??""}`));}
      if(range)range.value = String(threshold);
      if(number)number.value = String(threshold);
      range?.setAttribute("aria-valuetext", `${threshold} ${block.xAxis.unit ?? ""}: ${readout.textContent}`);
    } else if (block.view === "order") {
      const s = block.series[0]; const ordered = orderedObservations(s.data);
      const d = s.data.find(d => d.id === activeId);
      readout.textContent = d ? `${d.label}: ${d.value} ${block.xAxis.unit ?? ""} · display position ${s.data.indexOf(d)+1} → ordered rank ${ordered.findIndex(o => o.id === d.id)+1}. Equal values remain separate observations.` : "Select an observation to follow its identity through sorting. Equal values share a value, not an identity.";
      sort!.textContent = sorted ? "Show original order" : "Sort by measured value";
      sort!.setAttribute("aria-pressed", String(sorted));
    }
    if (focused) Array.from(rows.querySelectorAll<HTMLButtonElement>("button")).find(n => n.dataset.observationId === focused)?.focus();
  }
  if (block.threshold && interactive) {
    const t = block.threshold;
    const label = element("label", "", `Threshold x (${block.xAxis.unit ?? ""})`);
    number = element("input"); number.type = "number"; number.min=String(t.minimum); number.max=String(t.maximum); number.step="any";
    label.append(number); controls.append(label);
    range = element("input"); range.type="range"; range.min=String(t.minimum); range.max=String(t.maximum); range.step=String(t.step);
    range.setAttribute("aria-label", `Threshold x (${block.xAxis.unit ?? ""})`);
    const update = (input: HTMLInputElement) => {
      const value = input.valueAsNumber;
      if (!Number.isFinite(value) || value<t.minimum || value>t.maximum) {
        input.setAttribute("aria-invalid","true"); feedback.textContent=`Enter a number from ${t.minimum} to ${t.maximum}.`; return;
      }
      number!.removeAttribute("aria-invalid"); range!.removeAttribute("aria-invalid"); feedback.textContent=""; threshold=value; render();
    };
    range.oninput=()=>update(range!); number.oninput=()=>update(number!);
    controls.append(range);
  }
  if (block.view === "order") {
    sort = element("button"); sort.type="button"; sort.onclick=()=>{ sorted=!sorted; render(); }; controls.append(sort);
  }
  if (block.view === "compare") {
    const reveal = element("button", "", "Reveal modified measurements"); reveal.type="button";
    reveal.setAttribute("aria-expanded", "false");
    reveal.onclick=()=>{ variant=variant ? 0 : block.series.length-1; reveal.textContent=variant ? "Hide modified measurements" : "Reveal modified measurements"; reveal.setAttribute("aria-expanded",String(!!variant)); render(); };
    controls.append(reveal);
    reset.onclick=()=>{ variant=0; activeId=undefined; reveal.textContent="Reveal modified measurements"; reveal.setAttribute("aria-expanded","false"); render(); };
  } else reset.onclick=()=>{
    threshold=block.threshold?.initial ?? 0; sorted=false; activeId=undefined; feedback.textContent="";
    number?.removeAttribute("aria-invalid"); formalDialog?.close(); render();
  };
  controls.append(reset,feedback);
  const stopKeys = (event: KeyboardEvent) => event.stopPropagation();
  if(interactive)shell.addEventListener("keydown",stopKeys);
  if(interactive)shell.append(description);
  if(interactive)shell.append(controls);
  if (block.threshold && interactive) shell.append(readout);
  if (block.view === "ecdf") shell.append(stage);
  shell.append(rows);
  if (block.view === "order") shell.append(readout);
  let formalDialog: HTMLDialogElement | undefined;
  const modalKey = (event: KeyboardEvent) => {
    if (!formalDialog?.open) return;
    event.stopImmediatePropagation();
    if (event.key === "Escape") { event.preventDefault(); formalDialog.close(); }
  };
  const modalWheel = (event: Event) => {
    if (!formalDialog?.open) return;
    event.stopImmediatePropagation();
    if (!(event.target instanceof Node) || !formalDialog.contains(event.target)) event.preventDefault();
  };
  if (block.formal) {
    formalDialog=element("dialog","oe-formal");
    formalDialog.dataset.presentationModal="true";
    formalDialog.setAttribute("aria-label","ECDF: definition and formula");
    const formula=element("div","oe-formula");
    formula.innerHTML=katex.renderToString(block.formal.expression,{displayMode:true,throwOnError:false,output:"htmlAndMathml"});
    formula.setAttribute("aria-label",block.formal.spokenText);
    const close=element("button","","Close"); close.type="button"; close.onclick=()=>formalDialog!.close();
    formalDialog.append(close,element("h3","","Definition & formula"),element("p","",block.formal.definition),formula);
    const show=element("button","oe-formal-trigger","After exploring: definition & formula"); show.type="button";
    show.onclick=()=>formalDialog!.showModal();
    shell.append(show);
    // A native top-layer dialog keeps the mathematics readable without expanding
    // beyond a Reveal page, and supplies focus trapping, Escape and focus return.
    document.body.append(formalDialog);
    window.addEventListener("keydown",modalKey,true);
    window.addEventListener("wheel",modalWheel,{capture:true,passive:false});
  }
  shell.append(fallback); host.replaceChildren(shell); render();
  let previousWidth = stage.clientWidth;
  const observer = block.view === "ecdf" && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
    if (stage.clientWidth !== previousWidth) { previousWidth=stage.clientWidth; renderECDF(); }
  }) : undefined;
  observer?.observe(stage);
  return { destroy() { observer?.disconnect(); window.removeEventListener("keydown",modalKey,true); window.removeEventListener("wheel",modalWheel,true); formalDialog?.close(); formalDialog?.remove(); shell.removeEventListener("keydown",stopKeys); shell.remove(); } };
}
