import type { ChartAxis, SourceReference, LineChartSeries } from "./scene-document.ts";
import { sampleQuantile } from "./box-plot.ts";

interface HistogramBase {
  readonly id: string; readonly kind: "chart"; readonly label: string; readonly description: string;
  readonly source: readonly SourceReference[];
  readonly xAxis: ChartAxis; readonly yAxis: ChartAxis;
  readonly edges: readonly number[];
}
export interface HistogramState {
  readonly id:string;readonly label:string;readonly description:string;
  readonly binCounts:readonly number[];readonly source:readonly SourceReference[];
}
export interface HistogramBlock extends HistogramBase {
  readonly chartType: "histogram";
  readonly normalization: "count" | "density";
  readonly curves?: readonly LineChartSeries[];
  /** Published bin counts, never reconstructed as artificial midpoint observations. */
  readonly binCounts?: readonly number[];
  /** Ordered authored snapshots on the same bin grid; never artificial observations. */
  readonly states?:readonly HistogramState[];
  readonly binAdjustment?: { readonly minimumWidth:number; readonly maximumWidth:number; readonly widthStep:number };
  readonly data: readonly { readonly id: string; readonly value: number; readonly source: readonly SourceReference[] }[];
}
export interface Histogram2DBlock extends HistogramBase {
  readonly chartType: "histogram2d";
  readonly yEdges: readonly number[];
  readonly data: readonly { readonly id: string; readonly value: number; readonly y: number; readonly source: readonly SourceReference[] }[];
}

export function validateBinEdges(edges: readonly number[]): void {
  if (edges.length < 2 || edges.length > 513 || edges.some((v,i)=>!Number.isFinite(v)||(i>0&&(!Number.isFinite(v-edges[i-1])||v<=edges[i-1])))) throw new Error("Bin edges must be finite, strictly increasing, with 1–512 bins");
}
export function equalBinWidths(edges: readonly number[]): boolean {
  const h=edges[1]-edges[0];return edges.slice(1).every((v,i)=>Math.abs((v-edges[i])-h)<=1e-10*Math.max(1,Math.abs(h)));
}
/** Left closed/right open, except the last bin includes the upper endpoint. */
export function binIndex(value: number, edges: readonly number[]): number {
  if(!Number.isFinite(value)||value<edges[0]||value>edges.at(-1)!)throw new Error("Every finite observation must be covered by the bin edges");
  if(value===edges.at(-1))return edges.length-2;
  let lo=0,hi=edges.length-1;
  while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(value<edges[mid])hi=mid;else lo=mid;}
  return lo;
}
export function histogramBins(values: readonly number[], edges: readonly number[], normalization: "count"|"density"="count") {
  validateBinEdges(edges);
  if(!values.length)throw new Error("Histogram data must be nonempty");
  if(!["count","density"].includes(normalization))throw new Error("Unknown histogram normalization");
  if(normalization==="count"&&!equalBinWidths(edges))throw new Error("Unequal-width histograms require density heights");
  const counts=Array(edges.length-1).fill(0) as number[];
  values.forEach(v=>counts[binIndex(v,edges)]++);
  return counts.map((count,i)=>{const width=edges[i+1]-edges[i],height=normalization==="count"?count:count/values.length/width;
    if(!Number.isFinite(height))throw new Error("Histogram height exceeds finite numeric range");
    return {lower:edges[i],upper:edges[i+1],count,height,relativeFrequency:count/values.length};});
}
export function histogramBlockBins(block:HistogramBlock,edges:readonly number[]=block.edges){
  if(block.binCounts===undefined)return histogramBins(block.data.map(d=>d.value),edges,block.normalization);
  validateBinEdges(edges);
  if(!Array.isArray(block.binCounts)||block.data.length||block.binAdjustment||edges.length!==block.edges.length||edges.some((v,i)=>v!==block.edges[i])||block.binCounts.length!==edges.length-1||block.binCounts.some(c=>!Number.isSafeInteger(c)||c<0)||!Number.isSafeInteger(block.binCounts.reduce((a,b)=>a+b,0))||block.binCounts.every(c=>c===0))throw new Error("Invalid pre-binned histogram counts or incompatible raw data/adjustment");
  if(!["count","density"].includes(block.normalization)||(block.normalization==="count"&&!equalBinWidths(edges)))throw new Error("Invalid pre-binned normalization; unequal bins require density");
  const n=block.binCounts.reduce((a,b)=>a+b,0);
  return block.binCounts.map((count,i)=>{const height=block.normalization==="count"?count:count/n/(edges[i+1]-edges[i]);if(!Number.isFinite(height))throw new Error("Nonfinite pre-binned density");return {lower:edges[i],upper:edges[i+1],count,height,relativeFrequency:count/n};});
}
export function histogramObservationCount(block:HistogramBlock):number{return histogramBlockBins(block).reduce((n,b)=>n+b.count,0);}
export function histogramCells(data: readonly {value:number;y:number}[], edges: readonly number[], yEdges: readonly number[]) {
  validateBinEdges(edges);validateBinEdges(yEdges);
  if(!data.length||!equalBinWidths(edges)||!equalBinWidths(yEdges)||(edges.length-1)*(yEdges.length-1)>4096)throw new Error("2D histograms require nonempty paired data and equal-width grids of at most 4096 cells");
  const nx=edges.length-1,ny=yEdges.length-1,counts=Array(nx*ny).fill(0) as number[];
  data.forEach(d=>counts[binIndex(d.y,yEdges)*nx+binIndex(d.value,edges)]++);
  return counts.map((count,i)=>({xLower:edges[i%nx],xUpper:edges[i%nx+1],yLower:yEdges[Math.floor(i/nx)],yUpper:yEdges[Math.floor(i/nx)+1],count}));
}
export function validateHistogram(block: HistogramBlock|Histogram2DBlock): void {
  if(!block.xAxis.unit||(!block.data.length&&!(block.chartType==="histogram"&&block.binCounts!==undefined)))throw new Error("Histograms require measurement units and observations or published bin counts");
  const ids=new Set<string>();
  for(const d of block.data){if(!d.id||ids.has(d.id)||!d.source.length)throw new Error("Histogram observations require unique identities and provenance");ids.add(d.id);}
  if(block.chartType==="histogram"){
    histogramBlockBins(block);
    if(block.states!==undefined){
      if(!Array.isArray(block.states)||block.states.length<2||block.states.length>20||block.binCounts===undefined||block.data.length||block.binAdjustment)throw new Error("Histogram states require 2–20 published-count snapshots on one fixed grid");
      const stateIds=new Set<string>();
      for(const state of block.states){
        if(!state.id||stateIds.has(state.id)||!state.label||!state.description||!state.source.length)throw new Error("Histogram states need unique identities, labels, descriptions and provenance");
        stateIds.add(state.id);histogramBlockBins({...block,binCounts:state.binCounts});
      }
      if(block.states[0].binCounts.some((c: number, i: number)=>c!==block.binCounts![i]))throw new Error("First histogram state must match the saved default counts");
    }
    if(block.curves!==undefined){
      if(!Array.isArray(block.curves)||!block.curves.length||block.normalization!=="density"||!block.yAxis.unit)throw new Error("Histogram reference curves require density normalization and density units");
      const curveIds=new Set<string>(),pointIds=new Set(ids);
      for(const curve of block.curves){
        if(!curve.id||curveIds.has(curve.id)||!curve.label||!curve.source.length||curve.data.length<2)throw new Error("Histogram curves require unique identities, labels, provenance and coordinates");
        curveIds.add(curve.id);
        for(const [i,p]of curve.data.entries()){
          if(!p.id||pointIds.has(p.id)||!p.source.length||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.y<0||p.x<block.edges[0]||p.x>block.edges.at(-1)!||(i>0&&p.x<=curve.data[i-1].x))throw new Error("Invalid histogram curve coordinates or provenance");
          pointIds.add(p.id);
        }
      }
    }
    const a=block.binAdjustment;
    if(a&&(![a.minimumWidth,a.maximumWidth,a.widthStep].every(Number.isFinite)||a.minimumWidth<=0||a.maximumWidth<a.minimumWidth||a.widthStep<=0||!equalBinWidths(block.edges)||(block.edges.at(-1)!-block.edges[0])/a.minimumWidth>510||block.edges[1]-block.edges[0]<a.minimumWidth||block.edges[1]-block.edges[0]>a.maximumWidth))throw new Error("Invalid interactive histogram width limits or initial edges");
  }
  else {if("curves" in block||"binCounts" in block||"states" in block)throw new Error("Reference curves, states and published counts require a 1D histogram");if(!block.yAxis.unit)throw new Error("2D histograms require both measurement units");histogramCells(block.data,block.edges,block.yEdges);}
}
/** Extend a shifted grid to cover the entire authored domain, never clip data. */
export function adjustedHistogramEdges(minimum:number,maximum:number,width:number,shift=0):number[]{
  if(![minimum,maximum,width,shift].every(Number.isFinite)||minimum>=maximum||width<=0||Math.abs(shift)>.5)throw new Error("Invalid histogram adjustment");
  const origin=minimum+shift*width;
  let first=origin+Math.floor((minimum-origin)/width)*width;
  if(first>minimum)first-=width;
  let count=Math.ceil((maximum-first)/width);if(first+count*width<maximum)count++;
  if(count>512)throw new Error("Too many adjusted bins");
  const edges=Array.from({length:count+1},(_,i)=>first+i*width);validateBinEdges(edges);return edges;
}
export function histogramRuleWidth(values:readonly number[],rule:"Freedman–Diaconis"|"Scott"|"Sturges"):number|null{
  if(!["Freedman–Diaconis","Scott","Sturges"].includes(rule))throw new Error("Unknown histogram rule");
  if(values.length<2||values.some(v=>!Number.isFinite(v)))throw new Error("Bin rules require at least two finite observations");
  const n=values.length,mean=values.reduce((a,b)=>a+b/n,0),range=Math.max(...values)-Math.min(...values);
  const h=rule==="Freedman–Diaconis"?2*(sampleQuantile(values,.75)-sampleQuantile(values,.25))*n**(-1/3):rule==="Scott"?3.5*Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/(n-1))*n**(-1/3):range/Math.ceil(1+Math.log2(n));
  return Number.isFinite(h)&&h>0?h:null;
}
export function histogramStaticFallback(block: HistogramBlock|Histogram2DBlock): string {
  const bounds="Bins are [lower, upper), with the final upper edge included.";
  if(block.chartType==="histogram2d")return [block.label,block.description,`n=${block.data.length}; cell colors and labels encode counts. ${bounds}`,...histogramCells(block.data,block.edges,block.yEdges).map(c=>`x=[${c.xLower},${c.xUpper}], y=[${c.yLower},${c.yUpper}]: count=${c.count}`)].join("\n");
  return [block.label,block.description,`n=${histogramObservationCount(block)}; heights=${block.normalization}; ${bounds}`,...(block.binCounts?["Published bin counts; original within-bin values are not reconstructed."]:[]),...histogramBlockBins(block).map(b=>`[${b.lower},${b.upper}]: count=${b.count}; height=${b.height}; relative frequency=${b.relativeFrequency}`),...(block.states??[]).flatMap(s=>[s.label,s.description,`n=${s.binCounts.reduce((a,b)=>a+b,0)}`,`Counts: ${s.binCounts.join(", ")}`]),...(block.curves??[]).flatMap(c=>[`Reference curve: ${c.label}; coordinates are not sample observations.`,...c.data.map(p=>`${p.x}: ${p.y}`)])].join("\n");
}
