import {scaleLinear,scalePoint} from "d3-scale";
import {boxPlotSummary,boxPlotStaticFallback,type BoxPlotBlock} from "../../core/src/box-plot.ts";

const NS="http://www.w3.org/2000/svg";
/** Ordinary chart primitive using the same surface, axes and points as dot plots. */
export function mountD3BoxPlot(host:unknown,block:BoxPlotBlock){
  if(typeof HTMLElement==="undefined" || !(host instanceof HTMLElement))return {diagnostics:[{code:"INVALID_BOX_PLOT_HOST",message:"Box plot requires an HTML host"}]};
  const figure=document.createElement("figure");figure.className="d3-chart-figure d3-dot-plot-figure";
  const canvas=document.createElementNS(NS,"svg");canvas.classList.add("d3-chart-svg","d3-dot-plot-svg","d3-box-plot-svg");
  canvas.setAttribute("role","img");canvas.setAttribute("aria-label",boxPlotStaticFallback(block));
  const caption=document.createElement("figcaption");caption.className="d3-chart-caption";caption.textContent=block.description;
  const fallback=document.createElement("pre");fallback.className="d3-chart-static-fallback";fallback.textContent=boxPlotStaticFallback(block);
  figure.append(canvas,caption,fallback);host.replaceChildren(figure);
  const render=()=>{
    const width=Math.max(600,host.getBoundingClientRect().width||900),height=Math.max(400,Math.min(520,width*.64));
    canvas.replaceChildren();canvas.setAttribute("viewBox",`0 0 ${width} ${height}`);
    const values=block.groups.flatMap(g=>g.data.map(d=>d.value));const min=Math.min(...values),max=Math.max(...values),pad=(max-min||1)*.15;
    const y=scaleLinear().domain([block.yMinimum??min-pad,max+pad]).nice(5).range([height-65,45]);
    if(block.yMinimum!==undefined)y.domain([block.yMinimum,y.domain()[1]!]);
    const x=scalePoint<string>().domain(block.groups.map(g=>g.id)).range([100,width-70]).padding(.65);
    const node=(tag:string,attrs:Record<string,string|number>,text?:string)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text)n.textContent=text;canvas.append(n);return n;};
    for(const tick of y.ticks(6)){
      node("line",{x1:100,x2:width-70,y1:y(tick),y2:y(tick),class:"d3-chart-grid-line"});
      node("text",{x:83,y:y(tick)+5,"text-anchor":"end",class:"d3-chart-tick-label"},String(tick));
    }
    node("text",{x:100,y:22,class:"d3-chart-axis-title"},`${block.yAxis.label} (${block.yAxis.unit})`);
    node("text",{x:width/2,y:height-8,"text-anchor":"middle",class:"d3-chart-axis-title"},block.xAxis.label);
    block.groups.forEach((group,index)=>{
      const stats=boxPlotSummary(group.data.map(d=>d.value),block.fenceMultiplier),xx=x(group.id)!,half=Math.min(48,x.step()*.22);
      const cls=`d3-chart-series-${index%5+1}`;
      if(block.showObservations)group.data.forEach((d,i)=>node("circle",{cx:xx-half-18-(i%7)*3,cy:y(d.value),r:2.4,class:`d3-box-observation ${cls}`,"data-observation-id":d.id}));
      node("line",{x1:xx,x2:xx,y1:y(stats.lowerWhisker),y2:y(stats.upperWhisker),class:`d3-box-whisker ${cls}`});
      for(const v of[stats.lowerWhisker,stats.upperWhisker])node("line",{x1:xx-half*.55,x2:xx+half*.55,y1:y(v),y2:y(v),class:`d3-box-whisker ${cls}`});
      const box=node("rect",{x:xx-half,y:y(stats.upper),width:half*2,height:Math.max(1,y(stats.lower)-y(stats.upper)),class:`d3-box-body ${cls}`,"data-group-id":group.id});
      const title=document.createElementNS(NS,"title");title.textContent=`${group.label}: Q1 ${stats.lower}, median ${stats.median}, Q3 ${stats.upper}`;box.append(title);
      node("line",{x1:xx-half,x2:xx+half,y1:y(stats.median),y2:y(stats.median),class:"d3-box-median"});
      for(const i of stats.outlierIndices){const d=group.data[i];const point=node("circle",{cx:xx,cy:y(d.value),r:5,class:`d3-dot-point ${cls}`,"data-observation-id":d.id});const title=document.createElementNS(NS,"title");title.textContent=`Flagged observation: ${d.value} ${block.yAxis.unit}`;point.append(title);}
      node("text",{x:xx,y:height-39,"text-anchor":"middle",class:"d3-chart-category-label"},group.label);
    });
  };
  render();const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(render):undefined;observer?.observe(host);
  return {destroy(){observer?.disconnect();host.replaceChildren();}};
}
