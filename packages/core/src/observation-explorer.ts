import type { SourceReference, ChartAxis } from "./scene-document.ts";
import { cumulativeCount, empiricalSteps, orderedObservations } from "./empirical-distribution.ts";
import {empiricalMoments,type MomentMetric} from "./moments.ts";
import {boxPlotSummary} from "./box-plot.ts";
import {histogramBins} from "./histogram.ts";

export interface ObservationSeries {
  readonly id: string;
  readonly datasetId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  /** Authored presentation order; never inferred from numeric values or RDF order. */
  readonly data: readonly { readonly id: string; readonly value: number; readonly label: string; readonly source: readonly SourceReference[] }[];
  readonly summaries?: { readonly mean: ComparisonResult; readonly variance: ComparisonResult; readonly sd: ComparisonResult };
}
export interface ComparisonResult {
  readonly id: string; readonly label: string; readonly value: number; readonly unit: string;
  readonly propertyId: string; readonly source: readonly SourceReference[];
}
export interface ComparisonStage {
  readonly id: string; readonly label: string; readonly prompt: string;
  readonly mode: "observations" | "mean" | "spread" | "summaries" | "overlay" | "rank" | "interval" | "mirror" | "topics" | "distribution";
  readonly source: readonly SourceReference[];
  readonly topics?: readonly { readonly text: string; readonly source: readonly SourceReference[] }[];
  /** Independent optional probes, not additional steps in the lecture sequence. */
  readonly investigations?: readonly ComparisonStage[];
  readonly allowOverlay?: boolean;
}
export interface SummaryComparison {
  readonly minimum: number; readonly maximum: number;
  readonly stages: readonly ComparisonStage[];
  readonly interval: readonly [number, number];
  readonly details: readonly { readonly text?: string; readonly expression?: string; readonly source: readonly SourceReference[] }[];
}
export interface ObservationExplorerBlock {
  readonly id: string;
  readonly kind: "chart";
  readonly chartType: "observations";
  readonly label: string;
  readonly description: string;
  readonly source: readonly SourceReference[];
  readonly xAxis: ChartAxis;
  readonly yAxis: ChartAxis;
  readonly view: "compare" | "order" | "count" | "ecdf" | "summary" | "moments";
  readonly momentMetric?:MomentMetric;
  readonly compact?: boolean;
  /** False renders a fixed ECDF with no threshold controls. Defaults to true. */
  readonly interactive?: boolean;
  readonly series: readonly ObservationSeries[];
  readonly threshold?: { readonly minimum: number; readonly maximum: number; readonly initial: number; readonly step: number };
  readonly formal?: { readonly definition: string; readonly expression: string; readonly spokenText: string; readonly source: readonly SourceReference[] };
  readonly liveUpdate?: never;
  readonly comparison?: SummaryComparison;
}

export function validateObservationExplorer(block: ObservationExplorerBlock): void {
  if (!["compare", "order", "count", "ecdf", "summary", "moments"].includes(block.view)) throw new Error("Unknown observation view");
  if(block.view==="moments"){
    if(!["mean","variance","kurtosis","skewness"].includes(block.momentMetric!)||block.series.length>6||!block.xAxis.unit)throw new Error("Moment views require a known metric, measurement unit and 1–6 series");
    for(const s of block.series)empiricalMoments(s.data.map(d=>d.value));
  }else if(block.momentMetric!==undefined)throw new Error("Moment metric belongs only to moment views");
  if (!block.series.length || new Set(block.series.map(s => s.id)).size !== block.series.length) throw new Error("Unique observation series required");
  if(block.compact!==undefined&&(typeof block.compact!=="boolean"||block.view!=="ecdf"))throw new Error("Compact observations belong to ECDF views");
  if(block.interactive!==undefined&&(typeof block.interactive!=="boolean"||block.view!=="ecdf"||block.interactive===false&&!block.compact))throw new Error("Static observation display requires a compact ECDF and a boolean option");
  if (block.view !== "compare" && block.view !== "summary" && block.view!=="ecdf" && block.view!=="moments" && block.series.length !== 1) throw new Error("This view requires exactly one series");
  for (const series of block.series) {
    if (!series.id || !series.datasetId || !series.label || !series.source.length) throw new Error("Series provenance and label required");
    orderedObservations(series.data);
    if (series.data.some(d => !d.label || !d.source.length)) throw new Error("Observation labels and provenance required");
  }
  if (block.view === "count" || block.view === "ecdf") {
    const t = block.threshold;
    if (!t || ![t.minimum, t.maximum, t.initial, t.step].every(Number.isFinite) || t.minimum >= t.maximum || t.step <= 0 || t.initial < t.minimum || t.initial > t.maximum) throw new Error("Invalid threshold domain");
    const values = block.series.flatMap(s=>s.data.map(d => d.value));
    if (t.minimum >= Math.min(...values) || t.maximum <= Math.max(...values)) throw new Error("Domain must include both empirical tails");
  } else if (block.threshold) throw new Error("Threshold belongs only to count or ECDF views");
  if (block.formal && (block.view !== "ecdf" || !block.formal.definition || !block.formal.expression || !block.formal.spokenText || !block.formal.source.length)) throw new Error("Invalid ECDF formalization");
  if (block.view === "summary") {
    const c=block.comparison;
    if (!c || block.series.length < 2 || !Number.isFinite(c.minimum) || !Number.isFinite(c.maximum) || c.minimum >= c.maximum || !c.stages.length) throw new Error("Summary comparison requires at least two series, a domain and stages");
    if (new Set(c.stages.map(s=>s.id)).size !== c.stages.length) throw new Error("Comparison stage identities must be unique");
    if (!c.interval.every(Number.isFinite) || c.interval[0] < c.minimum || c.interval[1] > c.maximum || c.interval[0] > c.interval[1]) throw new Error("Invalid comparison interval");
    for (const s of block.series) {
      if (!s.summaries || s.data.some(d=>d.value<c.minimum || d.value>c.maximum)) throw new Error("Comparison observations and summaries must fit the domain");
      for (const r of Object.values(s.summaries)) if (!r.id || !r.label || !r.unit || !r.propertyId || !r.source.length || !Number.isFinite(r.value)) throw new Error("Invalid comparison result");
      if (s.summaries.sd.value<0 || s.summaries.variance.value<0) throw new Error("Dispersion cannot be negative");
    }
    for (const s of c.stages) {
      if (!s.id || !s.label || !s.prompt || !s.source.length || !["observations","mean","spread","summaries","overlay","rank","interval","mirror","topics","distribution"].includes(s.mode)) throw new Error("Invalid comparison stage");
      if (s.allowOverlay !== undefined && typeof s.allowOverlay !== "boolean") throw new Error("Overlay permission must be boolean");
      if (s.investigations !== undefined) {
        if (!s.investigations.length || new Set(s.investigations.map(p=>p.id)).size !== s.investigations.length) throw new Error("Investigations must have unique identities");
        for (const p of s.investigations) if (!p.id || !p.label || !p.prompt || !p.source.length || !["rank","interval","mirror"].includes(p.mode) || p.investigations !== undefined) throw new Error("Invalid optional investigation");
      }
    }
  } else if (block.comparison) throw new Error("Comparison stages require the summary view");
}

export function observationExplorerFallback(block: ObservationExplorerBlock): string {
  validateObservationExplorer(block);
  const lines = [block.label, block.description, ...block.series.flatMap(s => [s.label,
    ...s.data.map((d, i) => `${i + 1}. ${d.label}: ${d.value} ${block.xAxis.unit ?? ""}`),
    ...(block.view === "order" ? ["Ordered (ties retained):", ...orderedObservations(s.data).map((d,i) => `Rank ${i+1}: ${d.label} = ${d.value}`)] : []),
  ])];
  if (block.threshold) {
    for(const series of block.series){const result = cumulativeCount(series.data, block.threshold.initial);
      lines.push(`${series.label}: at x = ${block.threshold.initial}: ${result.count}/${result.total} = ${result.fraction}`);
      lines.push("Right-continuous counts (all tied observations enter together):",...empiricalSteps(series.data).map(s => `x = ${s.value}: left limit ${s.left}; F_n(x) = ${s.right}; jump ${s.multiplicity}/${result.total}`),"Below the minimum: 0; at and above the maximum: 1.");}
  }
  if (block.formal) lines.push(block.formal.definition, block.formal.expression, block.formal.spokenText);
  if(block.view==="moments"){
    const all=block.series.flatMap(s=>s.data.map(d=>d.value));let lo=Math.floor(Math.min(...all)/5)*5,hi=Math.ceil(Math.max(...all)/5)*5;
    if(lo===hi){lo-=1;hi+=1;}const edges=Array.from({length:17},(_,i)=>lo+(hi-lo)*i/16);
    for(const s of block.series){const values=s.data.map(d=>d.value),m=empiricalMoments(values),q=boxPlotSummary(values);
      lines.push(`${s.label}: mean=${m.mean}; m2=${m.m2}; sample variance=${m.sampleVariance}; skewness=${m.skewness??"undefined"}; kurtosis=${m.kurtosis??"undefined"}; excess=${m.kurtosis===null?"undefined":m.kurtosis-3}. Point, boxplot and histogram views retain this same series; moments use all observations.`,
        `Linearly interpolated box: Q1=${q.lower}; median=${q.median}; Q3=${q.upper}; observed whiskers=[${q.lowerWhisker}, ${q.upperWhisker}].`,
        ...histogramBins(values,edges).map(b=>`Histogram [${b.lower},${b.upper}${b.upper===hi?"]":")"}: count=${b.count}`));
    }
  }
  if (block.comparison) {
    for (const series of block.series) lines.push(series.label, ...Object.values(series.summaries!).map(r=>r.label));
    for (const stage of block.comparison.stages) lines.push(stage.label, stage.prompt, ...(stage.topics??[]).map(t=>t.text), ...(stage.investigations??[]).flatMap(p=>[p.label,p.prompt]));
    for (const detail of block.comparison.details) lines.push(detail.text??detail.expression??"");
  }
  return lines.join("\n");
}
