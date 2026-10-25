import type { ChartAxis, DotPlotGroup, SourceReference } from "./scene-document.ts";

export interface BoxPlotBlock {
  readonly id: string; readonly kind: "chart"; readonly chartType: "box";
  readonly label: string; readonly description: string;
  readonly source: readonly SourceReference[];
  readonly xAxis: ChartAxis; readonly yAxis: ChartAxis;
  readonly groups: readonly DotPlotGroup[];
  readonly quantileMethod: "type7";
  readonly fenceMultiplier: number;
  readonly yMinimum?: number;
  readonly showObservations?: boolean;
  readonly liveUpdate?: never;
}

/** R type 7, including singleton and both endpoints. Input is never mutated. */
export function sampleQuantile(values: readonly number[], p: number): number {
  if (!values.length || values.some(x=>!Number.isFinite(x)) || !Number.isFinite(p) || p<0 || p>1) throw new Error("Quantile requires finite nonempty data and p in [0,1]");
  const sorted=[...values].sort((a,b)=>a-b),h=(sorted.length-1)*p,j=Math.floor(h);
  const d=h-j,value=(1-d)*sorted[j]+d*sorted[Math.min(j+1,sorted.length-1)];
  if(!Number.isFinite(value))throw new Error("Quantile exceeds finite numeric range");
  return value;
}

export function boxPlotSummary(values: readonly number[], multiplier=1.5) {
  if (!Number.isFinite(multiplier)||multiplier<0)throw new Error("Invalid fence multiplier");
  const lower=sampleQuantile(values,.25),median=sampleQuantile(values,.5),upper=sampleQuantile(values,.75);
  const iqr=upper-lower,lowerFence=lower-multiplier*iqr,upperFence=upper+multiplier*iqr;
  if(![iqr,lowerFence,upperFence].every(Number.isFinite))throw new Error("Box plot statistics exceed finite numeric range");
  const inside=values.filter(v=>v>=lowerFence&&v<=upperFence);
  if(!inside.length)throw new Error("No observed whisker endpoints for this fence multiplier");
  return {lower,median,upper,iqr,lowerFence,upperFence,
    lowerWhisker:Math.min(...inside),upperWhisker:Math.max(...inside),
    outlierIndices:values.flatMap((v,i)=>v<lowerFence||v>upperFence?[i]:[])};
}

export function boxPlotStaticFallback(block: BoxPlotBlock): string {
  return [block.label,block.description,`Quantiles: linear interpolation; fences: ${block.fenceMultiplier} × IQR. Whiskers end at observations, not fences.`,
    ...block.groups.map(g=>{const s=boxPlotSummary(g.data.map(d=>d.value),block.fenceMultiplier);
      return `${g.label}: n=${g.data.length}; Q1=${s.lower}; median=${s.median}; Q3=${s.upper}; IQR=${s.iqr}; fences=[${s.lowerFence}, ${s.upperFence}]; whiskers=[${s.lowerWhisker}, ${s.upperWhisker}] ${block.yAxis.unit??""}; flagged observations: ${s.outlierIndices.map(i=>g.data[i].value).join(", ")||"none"}. Values: ${g.data.map(d=>d.value).join(", ")}`;
    })].join("\n");
}
