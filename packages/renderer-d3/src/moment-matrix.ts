import {scaleLinear} from "d3-scale";
import {empiricalMoments} from "../../core/src/moments.ts";
import {histogramBins} from "../../core/src/histogram.ts";
import {boxPlotSummary,sampleQuantile} from "../../core/src/box-plot.ts";
import {observationExplorerFallback,type ObservationExplorerBlock} from "../../core/src/observation-explorer.ts";
const NS="http://www.w3.org/2000/svg";
const fmt=(v:number|null)=>v===null?"undefined":Number(v.toFixed(3)).toString();
/** Shared views of identical series. All data geometry is computed, never authored pixels. */
export function mountMomentMatrix(host:HTMLElement,block:ObservationExplorerBlock){
  const figure=document.createElement("figure");figure.className="d3-chart-figure moment-matrix";
  const boxConvention="Boxplots use linearly interpolated quartiles and 1.5 × IQR fences.";
  const svg=document.createElementNS(NS,"svg");svg.classList.add("moment-matrix-svg");svg.setAttribute("role","img");svg.setAttribute("aria-label",`${block.label}. ${block.description} ${boxConvention}`);
  const caption=document.createElement("figcaption");caption.className="d3-chart-caption";caption.textContent=`Horizontal axes: ${block.xAxis.label} (${block.xAxis.unit}). ${block.description} ${boxConvention}`;
  const fallback=document.createElement("pre");fallback.className="d3-chart-static-fallback";fallback.textContent=observationExplorerFallback(block);
  figure.append(svg,caption,fallback);host.replaceChildren(figure);
  const metric=block.momentMetric!,all=block.series.flatMap(s=>s.data.map(d=>d.value));
  const lo=Math.floor(Math.min(...all)/5)*5,hi=Math.ceil(Math.max(...all)/5)*5;
  const minimum=lo===hi?lo-1:lo,maximum=lo===hi?hi+1:hi;
  const edges=Array.from({length:17},(_,i)=>minimum+(maximum-minimum)*i/16);
  const rows=block.series.map(s=>({series:s,m:empiricalMoments(s.data.map(d=>d.value)),bins:histogramBins(s.data.map(d=>d.value),edges)}));
  const maxCount=Math.max(...rows.flatMap(r=>r.bins.map(b=>b.count)),1);
  const width=1440,rowHeight=180,height=60+rows.length*rowHeight;
  svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
  const add=(parent:SVGElement,tag:string,attrs:Record<string,string|number>,text?:string)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;parent.append(n);return n;};
  const ink="var(--pcd-chart-text)",meanColor="var(--pcd-chart-series-1)",medianColor="var(--pcd-chart-series-2)",tailColor="var(--pcd-chart-series-4)";
  for(const[c,label]of ["Points","Boxplot · linear interpolation","Histogram · common bins"].entries())add(svg,"text",{x:c*480+240,y:24,"text-anchor":"middle",fill:ink,class:"mm-column-title"},label);
  rows.forEach(({series,m,bins},row)=>{
    const value=metric==="mean"?m.mean:metric==="variance"?m.m2:m[metric];
    const units=metric==="mean"?` ${block.xAxis.unit}`:metric==="variance"?` (${block.xAxis.unit})²`:"";
    const stat=metric==="mean"?"mean":metric==="variance"?"m₂":metric==="kurtosis"?"K":"g₁";
    const data=series.data,median=sampleQuantile(data.map(d=>d.value),.5),sd=Math.sqrt(m.m2);
    const maxPower=Math.max(...data.map(d=>Math.abs(d.value-m.mean)**(metric==="kurtosis"?4:3)),1);
    for(const[col,view]of ["scatter","box","histogram"].entries()){
      const g=add(svg,"g",{"data-panel-view":view,"data-series-id":series.id,"data-metric":metric,"data-metric-value":value??"undefined",transform:`translate(${col*480},${40+row*rowHeight})`});
      add(g,"rect",{x:5,y:2,width:470,height:174,rx:5,fill:"none",stroke:"var(--pcd-chart-axis)","stroke-opacity":.5});
      add(g,"text",{x:20,y:25,fill:ink,class:"mm-panel-title"},`${series.label} · ${stat} = ${fmt(value)}${units}`);
      const x=scaleLinear().domain([minimum,maximum]).range([42,455]),bottom=143,top=45;
      for(const t of x.ticks(5)){add(g,"line",{x1:x(t),x2:x(t),y1:top,y2:bottom,stroke:"var(--pcd-chart-grid)","stroke-opacity":.3});add(g,"text",{x:x(t),y:164,"text-anchor":"middle",fill:ink,class:"mm-tick"},String(t));}
      add(g,"line",{x1:42,x2:455,y1:bottom,y2:bottom,stroke:"var(--pcd-chart-axis)"});
      if(metric==="variance"||metric==="kurtosis"){
        const k=metric==="variance"?1:2,left=Math.max(minimum,m.mean-k*sd),right=Math.min(maximum,m.mean+k*sd);
        add(g,"rect",{x:x(left),y:top,width:x(right)-x(left),height:bottom-top,fill:meanColor,"fill-opacity":.1,"data-guide":"central-scale"});
        for(const v of[left,right])add(g,"line",{x1:x(v),x2:x(v),y1:top,y2:bottom,stroke:meanColor,"stroke-dasharray":"3 4","stroke-opacity":.6});
      }
      if(view==="scatter")data.forEach((d,i)=>{
        const radius=metric==="skewness"||metric==="kurtosis"?2+5*(Math.abs(d.value-m.mean)**(metric==="kurtosis"?4:3)/maxPower):2.7;
        const point=add(g,"circle",{cx:x(d.value),cy:75+(i%7)*7,r:radius,fill:metric==="skewness"?(d.value<m.mean?medianColor:tailColor):metric==="kurtosis"&&Math.abs(d.value-m.mean)>2*sd?tailColor:meanColor,"fill-opacity":.72,"data-observation-id":d.id});
        add(point,"title",{},`${d.label}: ${d.value} ${block.xAxis.unit}`);
      });
      if(view==="box"){
        const q=boxPlotSummary(data.map(d=>d.value)),yy=94;
        add(g,"line",{x1:x(q.lowerWhisker),x2:x(q.upperWhisker),y1:yy,y2:yy,stroke:ink});
        for(const v of[q.lowerWhisker,q.upperWhisker])add(g,"line",{x1:x(v),x2:x(v),y1:yy-13,y2:yy+13,stroke:ink});
        add(g,"rect",{x:x(q.lower),y:yy-23,width:x(q.upper)-x(q.lower),height:46,fill:medianColor,"fill-opacity":.25,stroke:medianColor});
        add(g,"line",{x1:x(q.median),x2:x(q.median),y1:yy-23,y2:yy+23,stroke:ink,"stroke-width":3});
        for(const i of q.outlierIndices)add(g,"circle",{cx:x(data[i].value),cy:yy,r:3,fill:tailColor,"data-flagged-id":data[i].id});
      }
      if(view==="histogram"){
        const y=scaleLinear().domain([0,maxCount]).range([bottom,top]);
        for(const b of bins)add(g,"rect",{x:x(b.lower),y:y(b.count),width:x(b.upper)-x(b.lower),height:bottom-y(b.count),fill:meanColor,"fill-opacity":.45,stroke:"var(--pcd-chart-axis)","data-count":b.count});
        for(const t of y.ticks(3))add(g,"text",{x:36,y:y(t)+5,"text-anchor":"end",fill:ink,class:"mm-tick"},String(t));
      }
      add(g,"line",{x1:x(m.mean),x2:x(m.mean),y1:top,y2:bottom,stroke:meanColor,"stroke-width":3,"data-guide":"mean"});
      if(metric==="skewness")add(g,"line",{x1:x(median),x2:x(median),y1:top,y2:bottom,stroke:medianColor,"stroke-width":2,"stroke-dasharray":"6 4","data-guide":"median"});
    }
  });
  return {destroy(){host.replaceChildren();}};
}
