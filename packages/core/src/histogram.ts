import type { ChartAxis, SourceReference } from "./scene-document.ts";
import { sampleQuantile } from "./box-plot.ts";

interface HistogramBase {
  readonly id: string; readonly kind: "chart"; readonly label: string; readonly description: string;
  readonly source: readonly SourceReference[];
  readonly xAxis: ChartAxis; readonly yAxis: ChartAxis;
  readonly edges: readonly number[];
}
export interface HistogramBlock extends HistogramBase {
  readonly chartType: "histogram";
  readonly normalization: "count" | "density";
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
export function histogramCells(data: readonly {value:number;y:number}[], edges: readonly number[], yEdges: readonly number[]) {
  validateBinEdges(edges);validateBinEdges(yEdges);
  if(!data.length||!equalBinWidths(edges)||!equalBinWidths(yEdges)||(edges.length-1)*(yEdges.length-1)>4096)throw new Error("2D histograms require nonempty paired data and equal-width grids of at most 4096 cells");
  const nx=edges.length-1,ny=yEdges.length-1,counts=Array(nx*ny).fill(0) as number[];
  data.forEach(d=>counts[binIndex(d.y,yEdges)*nx+binIndex(d.value,edges)]++);
  return counts.map((count,i)=>({xLower:edges[i%nx],xUpper:edges[i%nx+1],yLower:yEdges[Math.floor(i/nx)],yUpper:yEdges[Math.floor(i/nx)+1],count}));
}
export function validateHistogram(block: HistogramBlock|Histogram2DBlock): void {
  if(!block.xAxis.unit||!block.data.length)throw new Error("Histograms require measurement units and observations");
  const ids=new Set<string>();
  for(const d of block.data){if(!d.id||ids.has(d.id)||!d.source.length)throw new Error("Histogram observations require unique identities and provenance");ids.add(d.id);}
  if(block.chartType==="histogram"){
    histogramBins(block.data.map(d=>d.value),block.edges,block.normalization);
    const a=block.binAdjustment;
    if(a&&(![a.minimumWidth,a.maximumWidth,a.widthStep].every(Number.isFinite)||a.minimumWidth<=0||a.maximumWidth<a.minimumWidth||a.widthStep<=0||!equalBinWidths(block.edges)||(block.edges.at(-1)!-block.edges[0])/a.minimumWidth>510||block.edges[1]-block.edges[0]<a.minimumWidth||block.edges[1]-block.edges[0]>a.maximumWidth))throw new Error("Invalid interactive histogram width limits or initial edges");
  }
  else {if(!block.yAxis.unit)throw new Error("2D histograms require both measurement units");histogramCells(block.data,block.edges,block.yEdges);}
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
  return [block.label,block.description,`n=${block.data.length}; heights=${block.normalization}; ${bounds}`,...histogramBins(block.data.map(d=>d.value),block.edges,block.normalization).map(b=>`[${b.lower},${b.upper}]: count=${b.count}; height=${b.height}; relative frequency=${b.relativeFrequency}`)].join("\n");
}
