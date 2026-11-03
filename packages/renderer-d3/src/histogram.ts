import {scaleLinear} from "d3-scale";
import {line} from "d3-shape";
import {histogramBlockBins,histogramCells,histogramStaticFallback,adjustedHistogramEdges,histogramRuleWidth,type HistogramBlock,type Histogram2DBlock} from "../../core/src/histogram.ts";

const NS="http://www.w3.org/2000/svg";
export function mountD3Histogram(host:unknown,block:HistogramBlock|Histogram2DBlock){
  if(typeof HTMLElement==="undefined"||!(host instanceof HTMLElement))return {diagnostics:[{code:"INVALID_HISTOGRAM_HOST",message:"Histogram requires an HTML host"}]};
  const figure=document.createElement("figure");figure.className="d3-chart-figure d3-histogram-figure";
  if(block.chartType==="histogram"&&block.curves?.length)figure.dataset.referenceCurves="true";
  const svg=document.createElementNS(NS,"svg");svg.classList.add("d3-chart-svg","d3-histogram-svg");svg.setAttribute("role","img");svg.setAttribute("aria-label",`${block.label}. ${block.description} Numerical bin data follow in the text alternative.`);
  const caption=document.createElement("figcaption");caption.className="d3-chart-caption";caption.textContent=block.description;
  const fallback=document.createElement("pre");fallback.className="d3-chart-static-fallback";fallback.textContent=histogramStaticFallback(block);
  let edges=[...block.edges],width=edges[1]-edges[0],shift=0;
  let stateIndex=0;
  const controls=document.createElement("div");controls.className="histogram-controls";controls.dataset.presentationInteractive="true";
  const readout=document.createElement("output");readout.className="histogram-readout";readout.setAttribute("aria-live","polite");
  let widthInput:HTMLInputElement|undefined,originInput:HTMLInputElement|undefined;
  figure.append(svg,caption,fallback);host.replaceChildren(figure);
  const render=()=>{
    const width=Math.max(280,figure.clientWidth||host.clientWidth||host.getBoundingClientRect().width||900),naturalHeight=width>=1000?320:480,fill=typeof getComputedStyle!=='undefined'&&getComputedStyle(host).getPropertyValue('--pcd-chart-fill-stage').trim()==='1',height=fill?Math.max(naturalHeight,svg.clientHeight):naturalHeight,left=85,right=width-35,bottom=height-75,top=45;
    svg.replaceChildren();svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
    const node=(tag:string,attrs:Record<string,string|number>,text?:string)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;svg.append(n);return n;};
    const x=scaleLinear().domain([edges[0],edges.at(-1)!]).range([left,right]);
    const state=block.chartType==="histogram"?block.states?.[stateIndex]:undefined;
    const active=block.chartType==="histogram"&&state?{...block,binCounts:state.binCounts}:block;
    const bins=active.chartType==="histogram"?histogramBlockBins(active,active.binCounts?active.edges:edges):[];
    const curves=block.chartType==="histogram"?block.curves??[]:[];
    const stateHeights=block.chartType==="histogram"?block.states?.flatMap(s=>histogramBlockBins({...block,binCounts:s.binCounts}).map(b=>b.height))??[]:[];
    const y=scaleLinear().domain(block.chartType==="histogram2d"?[block.yEdges[0],block.yEdges.at(-1)!]:[0,(Math.max(...bins.map(b=>b.height),...stateHeights,...curves.flatMap(c=>c.data.map(p=>p.y)))||1)*1.12]).range([bottom,top]);
    if(state&&active.chartType==="histogram"){
      caption.textContent=`${block.description} ${state.description}`;
      readout.textContent=`${bins.reduce((n,b)=>n+b.count,0)} published results · fixed axes and bins.`;
      svg.dataset.histogramState=state.id;
      fallback.textContent=histogramStaticFallback(active);
    }
    for(const t of y.ticks(5)){node("line",{x1:left,x2:right,y1:y(t),y2:y(t),class:"d3-chart-grid-line"});node("text",{x:left-10,y:y(t)+5,"text-anchor":"end",class:"d3-chart-tick-label"},String(Number(t.toPrecision(4))));}
    for(const t of x.ticks(7))node("text",{x:x(t),y:bottom+24,"text-anchor":"middle",class:"d3-chart-tick-label"},String(Number(t.toPrecision(4))));
    node("text",{x:left,y:22,class:"d3-chart-axis-title"},`${block.yAxis.label}${block.yAxis.unit?` (${block.yAxis.unit})`:""}`);
    node("text",{x:(left+right)/2,y:height-13,"text-anchor":"middle",class:"d3-chart-axis-title"},`${block.xAxis.label} (${block.xAxis.unit})`);
    if(block.chartType==="histogram")for(const b of bins){const rect=node("rect",{x:x(b.lower),y:y(b.height),width:x(b.upper)-x(b.lower),height:y(0)-y(b.height),class:"d3-histogram-bin","data-count":b.count,"data-lower":b.lower,"data-upper":b.upper});const title=document.createElementNS(NS,"title");title.textContent=`[${b.lower},${b.upper}]: count ${b.count}, height ${b.height}`;rect.append(title);}
    else {
      const cells=histogramCells(block.data,block.edges,block.yEdges),max=Math.max(...cells.map(c=>c.count),1);
      for(const c of cells){const rect=node("rect",{x:x(c.xLower),y:y(c.yUpper),width:x(c.xUpper)-x(c.xLower),height:y(c.yLower)-y(c.yUpper),class:"d3-histogram-cell","fill-opacity":.08+.82*c.count/max,"data-count":c.count});const title=document.createElementNS(NS,"title");title.textContent=`x [${c.xLower},${c.xUpper}], y [${c.yLower},${c.yUpper}]: ${c.count}`;rect.append(title);
        if(cells.length<=100)node("text",{x:x((c.xLower+c.xUpper)/2),y:y((c.yLower+c.yUpper)/2)+5,"text-anchor":"middle",class:"d3-histogram-cell-label"},String(c.count));}
      node("text",{x:right,y:22,"text-anchor":"end",class:"d3-chart-tick-label"},`Cell counts: 0–${max}`);
    }
    for(const [i,curve]of curves.entries()){
      const path=line<{readonly x:number;readonly y:number}>().x(p=>x(p.x)).y(p=>y(p.y))(curve.data);
      if(path){const trace=node("path",{d:path,fill:"none",class:`d3-chart-line d3-chart-series-${i%5+1}`,"data-reference-series":curve.id});const title=document.createElementNS(NS,"title");title.textContent=curve.label;trace.append(title);}
    }
    if(block.chartType==="histogram"&&block.binAdjustment){
      readout.textContent=`Width ${Number((edges[1]-edges[0]).toFixed(4))} ${block.xAxis.unit}; ${bins.length} covering bins; origin shift ${Number(shift.toFixed(2))} × width; counted ${bins.reduce((n,b)=>n+b.count,0)}/${block.data.length}.`;
      fallback.textContent=histogramStaticFallback({...block,edges});
    }
  };
  const stop=(e:Event)=>e.stopPropagation();controls.addEventListener("keydown",stop);controls.addEventListener("wheel",stop);
  if(block.chartType==="histogram"&&block.states){
    const label=document.createElement("label");label.textContent="Saved experiment state";
    const select=document.createElement("select");select.setAttribute("aria-label","Saved experiment state");
    block.states.forEach((state,i)=>{const option=document.createElement("option");option.value=String(i);option.textContent=state.label;select.append(option);});
    select.onchange=()=>{stateIndex=Number(select.value);render();};label.append(select);controls.append(label);
    const reset=document.createElement("button");reset.type="button";reset.textContent="Reset experiment";reset.onclick=()=>{stateIndex=0;select.value="0";render();};controls.append(reset);
    figure.prepend(controls);figure.append(readout);
  }
  if(block.chartType==="histogram"&&block.binAdjustment){
    const a=block.binAdjustment;
    const input=(label:string,min:number,max:number,step:number,value:number)=>{const l=document.createElement("label");l.textContent=label;const n=document.createElement("input");n.type="range";n.min=String(min);n.max=String(max);n.step=String(step);n.value=String(value);n.setAttribute("aria-label",label);l.append(n);controls.append(l);return n;};
    widthInput=input(`Bin width (${block.xAxis.unit})`,a.minimumWidth,a.maximumWidth,a.widthStep,width);
    originInput=input("Bin origin shift (fraction of width)",-.5,.5,.05,0);
    const update=()=>{width=widthInput!.valueAsNumber;shift=originInput!.valueAsNumber;edges=adjustedHistogramEdges(block.edges[0],block.edges.at(-1)!,width,shift);render();};
    widthInput.oninput=update;originInput.oninput=update;
    for(const rule of ["Freedman–Diaconis","Scott","Sturges"] as const){const b=document.createElement("button");b.type="button";b.textContent=rule;b.onclick=()=>{const proposed=histogramRuleWidth(block.data.map(d=>d.value),rule);if(proposed===null){readout.textContent=`${rule}: no positive width (zero dispersion/range). Choose an explicit width.`;return;}const chosen=Math.max(a.minimumWidth,Math.min(a.maximumWidth,Math.round(proposed/a.widthStep)*a.widthStep));widthInput!.value=String(chosen);update();readout.textContent+=` ${rule} proposed ${Number(proposed.toFixed(4))}; chosen width is rounded/bounded by the controls.`;};controls.append(b);}
    const reset=document.createElement("button");reset.type="button";reset.textContent="Reset bins";reset.onclick=()=>{edges=[...block.edges];width=edges[1]-edges[0];shift=0;widthInput!.value=String(width);originInput!.value="0";render();};controls.append(reset,readout);figure.prepend(controls);
  }
  render();const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(render):undefined;observer?.observe(host);
  return {destroy(){observer?.disconnect();controls.removeEventListener("keydown",stop);controls.removeEventListener("wheel",stop);host.replaceChildren();}};
}
