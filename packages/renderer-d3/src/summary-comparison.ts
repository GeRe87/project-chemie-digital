import katex from "katex";
import type { ObservationExplorerBlock } from "../../core/src/observation-explorer.ts";
import { observationExplorerFallback, validateObservationExplorer } from "../../core/src/observation-explorer.ts";
import { intervalCount, observationAtRank, reflectedObservations } from "../../core/src/summary-comparison.ts";
import { dotSwarm } from "./dot-swarm.ts";
import { appendDotLegendEntry, dotSummaryDiamond } from "./dot-plot-primitives.ts";

const NS="http://www.w3.org/2000/svg";
const format=(n:number)=>Number(n.toFixed(3)).toString();
function html<K extends keyof HTMLElementTagNameMap>(tag:K,cls="",text?:string){
  const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;
}
function svg<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,string|number>,text?:string){
  const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;
}

/** One generic staged comparison surface; all prompts, data, results and modes
 * come from the semantic chart contract, never a scene/path identity. */
export function mountSummaryComparison(host:HTMLElement,block:ObservationExplorerBlock){
  validateObservationExplorer(block);
  const config=block.comparison!;
  const staticDistribution=config.stages.length===1&&config.stages[0].mode==="distribution";
  let stageIndex=0,rank=Math.ceil(Math.min(...block.series.map(s=>s.data.length))/2);
  let lower=config.interval[0],upper=config.interval[1],mirror=false,overlay=false;
  let investigationId:string|undefined;
  const root=html("div",staticDistribution?"d3-distribution-plot":"summary-comparison");
  root.dataset.view="summary";
  const cue=html("p","sc-cue");cue.setAttribute("aria-live","polite");
  const figure=html(staticDistribution?"figure":"div",staticDistribution?"d3-chart-figure d3-dot-plot-figure":"sc-figure");
  if(staticDistribution){
    const legend=html("div","d3-dot-legend");
    appendDotLegendEntry(legend,"Observations","observation");
    appendDotLegendEntry(legend,"Mean","summary");
    appendDotLegendEntry(legend,"±1 sample SD","spread");
    figure.append(legend);
  }
  // Retain the same diagram node and coordinate system through every disclosure.
  const graph=svg("svg",{role:"img",...(staticDistribution?{class:"d3-chart-svg d3-dot-plot-svg"}:{})});figure.append(graph);
  const summaries=html("div","sc-summaries");
  const interaction=html("div","sc-interaction");
  const readout=html("output","sc-readout");readout.setAttribute("aria-live","polite");
  const notes=html("div","sc-notes");
  const footer=html("div","sc-controls");
  const back=html("button","","Back"),next=html("button","sc-next"),reset=html("button","","Reset"),details=html("button","sc-details","Scientific details");
  const align=html("button","sc-overlay","Overlay series");
  for(const b of [back,next,reset,details,align])b.type="button";
  footer.append(back,next,align,reset,details);
  const data=html("details","sc-data");
  data.append(html("summary","","Data & accessible description"),html("pre","",observationExplorerFallback(block)));
  const caption=html("figcaption","d3-chart-caption",config.stages[0].prompt);
  // A static chart is only a visual primitive. Scenario, table and conclusions
  // are ordinary SceneDocument blocks composed by the shared presentation policy.
  if(staticDistribution){
    figure.append(caption);footer.className="d3-chart-tools";details.className="d3-chart-details-button";
    footer.prepend(data);root.append(figure,footer);
  }
  else root.append(cue,summaries,figure,interaction,readout,notes,footer,data);
  host.replaceChildren(root);

  const dialog=html("dialog","sc-dialog");dialog.dataset.presentationModal="true";dialog.setAttribute("aria-label","Scientific details");
  const close=html("button","","Close");close.type="button";
  dialog.append(close,html("h2","","Scientific details"));
  for(const d of config.details){
    const n=html(d.expression?"div":"p",d.expression?"sc-math":"");
    n.dataset.resourceId=d.source.map(s=>s.resourceId).join(" ");
    if(d.expression)n.innerHTML=katex.renderToString(d.expression,{displayMode:true,throwOnError:false,output:"htmlAndMathml"});
    else n.textContent=d.text??"";
    dialog.append(n);
  }
  document.body.append(dialog);
  details.onclick=()=>dialog.showModal();close.onclick=()=>dialog.close();
  const modalKey=(e:KeyboardEvent)=>{if(!dialog.open)return;e.stopImmediatePropagation();if(e.key==="Escape"){e.preventDefault();dialog.close();}};
  const modalWheel=(e:Event)=>{if(!dialog.open)return;e.stopImmediatePropagation();if(!(e.target instanceof Node)||!dialog.contains(e.target))e.preventDefault();};
  window.addEventListener("keydown",modalKey,true);window.addEventListener("wheel",modalWheel,{capture:true,passive:false});
  const stopKeys=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest("button,input,select,summary"))e.stopPropagation();};root.addEventListener("keydown",stopKeys);

  function draw(){
    const stage=config.stages[stageIndex];
    const probe=stage.investigations?.find(p=>p.id===investigationId);
    const mode=probe?.mode??stage.mode;
    root.dataset.mode=mode;root.dataset.stage=String(stageIndex);
    cue.textContent=probe?.prompt??stage.prompt;
    const width=Math.max(360,Math.min(1200,figure.clientWidth||1200));
    const distribution=mode==="distribution";
    const narrow=width<600,height=distribution?block.series.length*100+90:(narrow?360:370),left=narrow?90:155,right=width-38;
    const x=(v:number)=>left+(v-config.minimum)/(config.maximum-config.minimum)*(right-left);
    graph.replaceChildren();graph.setAttribute("viewBox",`0 0 ${width} ${height}`);
    graph.setAttribute("aria-label",`${block.label}. ${probe?.prompt??stage.prompt}. ${block.series.map(s=>s.label+': '+(mode==="summaries"||distribution?`${s.data.length} observations; `+Object.values(s.summaries!).map(r=>r.label).join(', '):s.data.map(d=>d.value).join(', '))).join('. ')} ${block.xAxis.unit??""}. ${distribution?'Vertical offsets separate dots only; all horizontal positions are actual values.':''}`);
    const showDots=mode!=="summaries",showCenter=distribution||["mean","spread","summaries","overlay","mirror"].includes(mode);
    const showSpread=distribution||mode==="spread"||mode==="summaries";
    const axisY=height-55;
    const rawTickStep=(config.maximum-config.minimum)/(narrow?6:12);
    const magnitude=10**Math.floor(Math.log10(rawTickStep));
    const tickStep=distribution?([1,2,5,10].find(n=>n*magnitude>=rawTickStep)??10)*magnitude:Math.max(1,Math.ceil(rawTickStep));
    for(let v=config.minimum;v<=config.maximum;v+=tickStep){
      graph.append(svg("line",{x1:x(v),x2:x(v),y1:55,y2:axisY,class:distribution?"d3-chart-grid-line":"sc-grid"}),svg("text",{x:x(v),y:axisY+27,"text-anchor":"middle",class:distribution?"d3-chart-tick-label":"sc-tick"},format(v)));
    }
    graph.append(svg("line",{x1:left,x2:right,y1:axisY,y2:axisY,class:distribution?"d3-chart-axis":"sc-axis"}),svg("text",{x:(left+right)/2,y:height-4,"text-anchor":"middle",class:distribution?"d3-chart-axis-title":"sc-axis-label"},`${block.xAxis.label} (${block.xAxis.unit??""})`));
    const perSeries:string[]=[];
    block.series.forEach((series,index)=>{
      const cls=index===0?"sc-series-a":"sc-series-b";
      const y=distribution?55+index*100:(overlay||mode==="overlay"?155+index*30:95+index*145);
      const summary=series.summaries!;
      graph.append(svg("text",{x:narrow?5:15,y:y+7,class:distribution?"d3-chart-category-label":`sc-series-label ${cls}`},series.label));
      if(showCenter&&!distribution){
        graph.append(svg("line",{x1:x(summary.mean.value),x2:x(summary.mean.value),y1:y-12,y2:y+48,class:`sc-center ${cls}`}));
      }
      if(showSpread){
        const lo=summary.mean.value-summary.sd.value,hi=summary.mean.value+summary.sd.value;
        graph.append(svg("line",{x1:x(lo),x2:x(hi),y1:y+34,y2:y+34,class:distribution?"d3-dot-spread":`sc-spread ${cls}`}));
        for(const endpoint of [lo,hi])graph.append(svg("line",{x1:x(endpoint),x2:x(endpoint),y1:y+26,y2:y+42,class:distribution?"d3-dot-spread":`sc-spread ${cls}`}));
        if(distribution){
          const marker=svg("path",{d:dotSummaryDiamond(x(summary.mean.value),y+34,8),class:"d3-dot-summary","data-result-id":summary.mean.id});
          marker.append(svg("title",{},summary.mean.label));graph.append(marker);
        }
      }
      if(mode==="interval")graph.append(svg("rect",{x:x(lower),y:y-36,width:x(upper)-x(lower),height:72,class:"sc-interval"}));
      const chosen=mode==="rank"?observationAtRank(series.data,rank):undefined;
      const included=mode==="interval"?intervalCount(series.data,lower,upper):undefined;
      if(showDots){
        const stacks=new Map<number,number>();
        const separation=Math.min(9,Math.max(5,(right-left)/85));
        const offsets=distribution?dotSwarm(series.data.map(d=>x(d.value)),separation):[];
        for(const [observationIndex,observation] of series.data.entries()){
          const stack=stacks.get(observation.value)??0;stacks.set(observation.value,stack+1);
          const yy=distribution?y+offsets[observationIndex]:y-stack*22,active=chosen?.id===observation.id||included?.ids.includes(observation.id);
          const dot=svg("circle",{cx:x(observation.value),cy:yy,r:distribution?separation/2.25:(active?12:9),class:distribution?"d3-dot-point d3-chart-series-1":`sc-dot ${cls}${active?" sc-selected":""}`,"data-observation-id":observation.id,"data-series-id":series.id});
          dot.append(svg("title",{},`${series.label}, ${observation.label}: ${observation.value} ${block.xAxis.unit??""}`));
          graph.append(dot);
          if(!distribution&&!overlay&&mode!=="overlay")graph.append(svg("text",{x:x(observation.value),y:yy-23,"text-anchor":"middle",class:`sc-value ${cls}`},format(observation.value)));
        }
      }
      if(mode==="mirror"&&mirror){
        for(const d of reflectedObservations(series.data,summary.mean.value))graph.append(svg("circle",{cx:x(d.value),cy:y+20,r:10,class:`sc-reflection ${cls}`}));
      }
      if(chosen)perSeries.push(`${series.label}: x₍${rank}₎ = ${format(chosen.value)} ${block.xAxis.unit??""}`);
      if(included)perSeries.push(`${series.label}: ${included.count}/${included.total} (${format(included.fraction*100)}%)`);
    });
    summaries.replaceChildren();
    const keys=distribution?[]:(mode==="mean"?["mean"]:(["spread","summaries","overlay"].includes(mode)||stage.investigations?["mean","variance","sd"]:[]));
    for(const key of keys){
      const results=block.series.map(s=>s.summaries![key as "mean"|"variance"|"sd"]);
      const same=results.every(r=>r.value===results[0].value&&r.unit===results[0].unit&&r.propertyId===results[0].propertyId);
      for(const[index,result]of(same?[results[0]]:results).entries()){
        const label=html("span","sc-summary",same?result.label:`${block.series[index].label}: ${result.label}`);
        label.dataset.resourceId=result.id;summaries.append(label);
      }
    }
    readout.textContent=perSeries.join("   ·   ");readout.hidden=!perSeries.length;
    notes.replaceChildren(...(stage.topics??[]).map(t=>html("span",stage.mode==="topics"?"sc-topic":"sc-note",t.text)));
    back.disabled=stageIndex===0;next.disabled=stageIndex===config.stages.length-1;
    back.hidden=stageIndex===0;
    reset.hidden=config.stages.length===1;
    next.hidden=stageIndex===config.stages.length-1;
    next.textContent=config.stages[stageIndex+1]?.label??"Continue";
    align.hidden=!stage.allowOverlay;align.setAttribute("aria-pressed",String(overlay));
    align.textContent=overlay?"Separate series":"Overlay series";
  }
  function controls(){
    interaction.replaceChildren();
    const stage=config.stages[stageIndex];
    if(stage.investigations){
      const label=html("label","sc-mode-label","Optional view "),select=html("select","sc-investigation");
      select.setAttribute("aria-label","Optional investigation");
      const overview=html("option","","Overview");overview.value="";select.append(overview);
      for(const probe of stage.investigations){const option=html("option","",probe.label);option.value=probe.id;select.append(option);}
      select.value=investigationId??"";label.append(select);interaction.append(label);
      select.onchange=()=>{investigationId=select.value||undefined;controls();draw();interaction.querySelector<HTMLSelectElement>("select")?.focus();};
    }
    const mode=stage.investigations?.find(p=>p.id===investigationId)?.mode??stage.mode;
    if(mode==="rank"){
      const label=html("label","","Ordered position r ");const input=html("input");
      input.type="range";input.min="1";input.max=String(Math.min(...block.series.map(s=>s.data.length)));input.step="1";input.value=String(rank);
      const value=html("output","",`r = ${rank}`);label.append(input,value);interaction.append(label);
      input.oninput=()=>{rank=input.valueAsNumber;value.textContent=`r = ${rank}`;draw();};
    }
    if(mode==="interval"){
      const error=html("span","sc-error");error.setAttribute("aria-live","polite");
      const inputs:HTMLInputElement[]=[];
      for(const[name,value]of[["From",lower],["To",upper]] as const){
        const label=html("label","",name+" "),input=html("input");input.type="number";input.min=String(config.minimum);input.max=String(config.maximum);input.step="any";input.value=String(value);label.append(input);interaction.append(label);inputs.push(input);
      }
      interaction.append(html("span","sc-boundary",`${block.xAxis.unit??""} · inclusive endpoints`),error);
      for(const input of inputs)input.oninput=()=>{
        const[a,b]=inputs.map(i=>i.valueAsNumber);
        const valid=Number.isFinite(a)&&Number.isFinite(b)&&a<=b&&a>=config.minimum&&b<=config.maximum;
        for(const n of inputs)n.setAttribute("aria-invalid",String(!valid));
        error.textContent=valid?"":`Choose an ordered interval within ${config.minimum}–${config.maximum}.`;
        if(valid){lower=a;upper=b;draw();}
      };
    }
    if(mode==="mirror"){
      const button=html("button","sc-reflect",mirror?"Hide reflection":"Show reflection");button.type="button";button.setAttribute("aria-pressed",String(mirror));
      button.onclick=()=>{mirror=!mirror;button.setAttribute("aria-pressed",String(mirror));button.textContent=mirror?"Hide reflection":"Show reflection";draw();};interaction.append(button);
    }
  }
  function setStage(index:number){
    const focused=document.activeElement;stageIndex=Math.max(0,Math.min(config.stages.length-1,index));
    investigationId=undefined;overlay=!!config.stages[stageIndex].allowOverlay&&overlay;controls();draw();
    if(focused===next&&next.hidden)(interaction.querySelector<HTMLElement>("select")??back).focus();
    else if(focused===back&&back.hidden)next.focus();
  }
  back.onclick=()=>setStage(stageIndex-1);next.onclick=()=>setStage(stageIndex+1);
  align.onclick=()=>{overlay=!overlay;draw();};
  reset.onclick=()=>{rank=Math.ceil(Math.min(...block.series.map(s=>s.data.length))/2);lower=config.interval[0];upper=config.interval[1];mirror=false;dialog.close();setStage(0);};
  setStage(0);
  let lastWidth=figure.clientWidth;
  const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(()=>{if(figure.clientWidth!==lastWidth){lastWidth=figure.clientWidth;draw();}}):undefined;
  observer?.observe(figure);
  return {destroy(){observer?.disconnect();root.removeEventListener("keydown",stopKeys);window.removeEventListener("keydown",modalKey,true);window.removeEventListener("wheel",modalWheel,true);dialog.close();dialog.remove();root.remove();}};
}
