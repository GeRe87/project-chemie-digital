import {scaleLinear} from 'd3-scale';
import {line,area} from 'd3-shape';
import {runExperiment,validateExperiment,type ExperimentBlock,type ExperimentPanel} from '../../core/src/distribution-experiment.ts';
import {experimentPlotGeometry,wrapExperimentAxis} from './experiment-layout.ts';
const NS='http://www.w3.org/2000/svg';
const format=(v:number|string)=>typeof v==='string'?v:Math.abs(v)<1e-4&&v!==0?v.toExponential(2):Number(v.toPrecision(4)).toString();
/** Presentation emphasis only: the complete numerical result remains in details
 * and in the core's static/script fallback. Never discard or recompute results. */
export function teachingReadouts(block:ExperimentBlock,result:ReturnType<typeof runExperiment>,values:Record<string,number>={}){
 const parameter=(key:string)=>values[key]??block.parameters.find(p=>p.key===key)?.value;
 const only=(labels:string[])=>result.readouts.filter(v=>labels.includes(v.label));
 switch(block.experimentKind){
  case 'normal':{
   if(parameter('view')===5||parameter('view')===4)return result.readouts;
   if(parameter('view')===3)return only(['Selected upper-tail rate','Central coverage','Total outside both bounds']);
   return only(['Threshold','Standardized distance',parameter('inverse')?'Upper probability':parameter('view')===1?'Left probability':'Upper probability']);
  }
  case 'lognormal':
   if(parameter('view')===1)return only(['Median','Dimensionless log SD']);
   if(parameter('view')===3)return only(['Threshold','Upper probability','Inverse threshold for selected rate','Selected upper-tail rate']);
   return only(['Threshold','Upper probability','Median','Arithmetic expectation','Mode']);
  case 'ecdf':return only(['Observed count at threshold','Empirical fraction at threshold','Full-model probability at threshold']);
  case 'variance':return parameter('comparisonN')?only(['Measurements per series','Theoretical relative SD','Comparison measurements per series','Comparison theoretical relative SD']):only(['Mean estimated variance','Relative SD of variance estimates','Theoretical relative SD']);
  case 'student':
   if(parameter('view')===4)return result.readouts;
   if(parameter('view')===3)return only(['Lower mean confidence limit (mg/L)','Upper mean confidence limit (mg/L)','CRM reference inside interval']);
   if(parameter('comparisonN'))return only(['Residual degrees of freedom','97.5th percentile','Comparison 97.5th percentile']);
   return only(['Observed statistic','Residual degrees of freedom','Two-sided Student p']);
  case 'f-ratio':return parameter('view')===3?result.readouts:only(['Observed ratio','Numerator df','Denominator df','Lower equal-tail bound','Upper equal-tail bound','Two-sided p']);
  case 'pearson':return parameter('view')===1?only(['Pearson statistic','Degrees of freedom','Prespecified upper 5% cutoff','Interpretation']):result.readouts;
  case 'dilution':return parameter('M')===1?result.readouts.filter(v=>v.label.startsWith('First ')):only(['Mean (mg/L)','Output SD (mg/L)','Central lower 95% (mg/L)','Central upper 95% (mg/L)']);
  case 'distribution':return parameter('view')===0?only(['Model interval probability','Empirical interval fraction']):only(parameter('view')===1?['Shared threshold (mg/L)','Accumulated probability F(x)']:['Chosen cumulative probability p','Inverse-CDF threshold (mg/L)','Accumulated probability F(x)']);
  default:return result.readouts;
 }
}
export function mountDistributionExperiment(host:unknown,block:ExperimentBlock){
 if(typeof HTMLElement==='undefined'||!(host instanceof HTMLElement))return{diagnostics:[{code:'INVALID_EXPERIMENT_HOST',message:'Expected HTML host'}]};
  validateExperiment(block);const root=document.createElement('div');root.className='distribution-experiment pcd-interactive';root.dataset.presentationInteractive='true';root.dataset.experimentKind=block.experimentKind;root.setAttribute('role','region');root.setAttribute('aria-label',block.label);
  const controls=document.createElement('div');controls.className='experiment-controls pcd-interactive-controls';const panels=document.createElement('div');panels.className='experiment-panels';const output=document.createElement('div');output.className='experiment-readouts';output.setAttribute('role','status');output.setAttribute('aria-live','polite');
  const description=document.createElement('div');description.className='experiment-description';
   description.textContent=block.label;
   const authoredDescription=document.createElement('p');authoredDescription.className='experiment-model-description';authoredDescription.textContent=block.description;
   const note=document.createElement('p');note.className='experiment-note';const details=document.createElement('details');details.className='experiment-details pcd-interactive-disclosure';const summary=document.createElement('summary');summary.textContent='Details';summary.setAttribute('aria-label','Model notes and all numerical results');const fallback=document.createElement('pre');details.append(summary,description,authoredDescription,note,fallback);
   const settings=document.createElement('details');settings.className='experiment-settings pcd-interactive-disclosure';const settingsSummary=document.createElement('summary');settingsSummary.textContent='Settings';settingsSummary.setAttribute('aria-label','Simulation settings');const advancedControls=document.createElement('div');advancedControls.className='experiment-controls pcd-interactive-controls';settings.append(settingsSummary,advancedControls);
    settingsSummary.onclick=()=>{if(!settings.open)details.open=false;};summary.onclick=()=>{if(!details.open)settings.open=false;};details.ontoggle=()=>{summary.textContent=details.open?'Close details':'Details';};
  const feedback=document.createElement('p');feedback.setAttribute('role','alert');feedback.className='experiment-feedback';
  const comparison=document.createElement('div');comparison.className='experiment-source-comparison';
 const values:Record<string,number>={},inputs=new Map<string,HTMLInputElement>();
 for(const p of block.parameters.filter(p=>p.adjustable)){
  const label=document.createElement('label');label.textContent=p.label;const input=document.createElement('input');input.type='number';input.min=String(p.minimum);input.max=String(p.maximum);input.step=String(p.step);input.value=String(p.value);input.setAttribute('aria-label',p.label);
    input.onchange=()=>{try{const candidate={...values,[p.key]:input.valueAsNumber},result=runExperiment(block,candidate);Object.assign(values,candidate);input.removeAttribute('aria-invalid');feedback.textContent='';paint(result);}catch(e){input.setAttribute('aria-invalid','true');feedback.textContent=String(e);}};inputs.set(p.key,input);label.append(input);(p.key==='M'||p.key==='seed'||controls.children.length>=2?advancedControls:controls).append(label);
 }
  const reset=document.createElement('button');reset.type='button';reset.textContent='Reset';reset.setAttribute('aria-label','Reset model');reset.onclick=()=>{for(const key of Object.keys(values))delete values[key];for(const p of block.parameters){const input=inputs.get(p.key);if(input){input.value=String(p.value);input.removeAttribute('aria-invalid');}}feedback.textContent='';paint(runExperiment(block));};
   const actions=document.createElement('div');actions.className='experiment-actions pcd-interactive-controls';actions.append(details);if(advancedControls.children.length)actions.append(settings);if(inputs.size)actions.append(reset);if(!controls.children.length)controls.hidden=true;
   let lastResult:ReturnType<typeof runExperiment>|undefined;
    let lastSize='';
    let observer:ResizeObserver|undefined;
   function graph(panel:ExperimentPanel,wide:boolean,availableHeight=0){
     const geometry=experimentPlotGeometry(root.clientWidth,Number(root.dataset.panelCount)||1),chartWidth=wide?geometry.plotWidth:640,right=chartWidth-25,xTitle=wrapExperimentAxis(panel.xLabel,chartWidth-30),yTitle=wrapExperimentAxis(panel.yLabel,chartWidth-90),titleExtra=(panel.xLabels?30:0)+26*(xTitle.length-1),baseHeight=Math.max(geometry.height,availableHeight-titleExtra),chartHeight=baseHeight+titleExtra,bottomY=baseHeight-58,topY=Math.max(34,38+26*(yTitle.length-1));
    const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox',`0 0 ${chartWidth} ${chartHeight}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`${panel.xLabel}; ${panel.yLabel}. ${panel.traces.map(t=>t.label).join('; ')}. Numerical coordinates are accessible below.`);
   const points=panel.traces.flatMap(t=>t.points).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),xs=[...points.map(p=>p.x),...(panel.markers??[]).map(m=>m.x)];let lo=Math.min(...xs),hi=Math.max(...xs),bottom=Math.min(0,...points.map(p=>p.y)),top=Math.max(...points.map(p=>p.y));if(hi===lo){lo--;hi++;}if(top===bottom)top++;
    const x=scaleLinear().domain(panel.xDomain??[lo,hi]).range([70,right]),y=scaleLinear().domain(panel.yDomain??[bottom,top*1.08]).range([bottomY,topY]);
   svg.dataset.yDomain=JSON.stringify(y.domain());svg.dataset.xDomain=JSON.stringify(x.domain());
  const node=(tag:string,attrs:Record<string,string|number>,text?:string)=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;svg.append(e);return e;};
    if(!panel.hideYAxis)for(const v of y.ticks(3)){node('line',{x1:70,x2:right,y1:y(v),y2:y(v),class:'d3-chart-grid-line'});node('text',{x:61,y:y(v)+5,'text-anchor':'end',class:'d3-chart-tick-label'},format(v));}
    for(const tick of panel.xLabels??x.ticks(chartWidth<450?3:5).map(value=>({value,label:format(value)}))){
    const parts=panel.xLabels?tick.label.split(' '):[tick.label];
     node('text',{x:x(tick.value),y:bottomY+24,'text-anchor':'middle',class:'d3-chart-tick-label'},parts[0]);
     if(parts.length>1)node('text',{x:x(tick.value),y:bottomY+48,'text-anchor':'middle',class:'d3-chart-tick-label'},parts.slice(1).join(' '));
   }
    const title=(lines:string[],x:number,y:number,anchor:string)=>{const text=node('text',{x,y,'text-anchor':anchor,class:'d3-chart-axis-title'});lines.forEach((line,index)=>{const span=document.createElementNS(NS,'tspan');span.setAttribute('x',String(x));span.setAttribute('dy',index?'26':'0');span.textContent=line;text.append(span);});};
     title(yTitle,70,24,'start');title(xTitle,chartWidth/2,baseHeight+(panel.xLabels?30:0)-6,'middle');
   panel.traces.forEach((trace,i)=>{const color=trace.emphasis==='reference'?'var(--pcd-experiment-reference)':`var(--pcd-chart-series-${i%5+1})`;
   if(trace.style==='area'){const path=area<{x:number;y:number}>().x(p=>x(p.x)).y0(y(0)).y1(p=>y(p.y))(trace.points as {x:number;y:number}[]);node('path',{d:path??'',fill:color,'fill-opacity':.35});}
    else if(trace.style==='line'||trace.style==='trajectory'){const path=line<{x:number;y:number}>().x(p=>x(p.x)).y(p=>y(p.y))(trace.points as {x:number;y:number}[]);node('path',{d:path??'',stroke:color,'stroke-width':3,fill:'none','data-trace-label':trace.label,...(i?{'stroke-dasharray':'7 3'}:{})});if(trace.style==='trajectory')trace.points.forEach((p,j)=>{node('circle',{cx:x(p.x),cy:y(p.y),r:5,fill:color});if(panel.labelPoints&&(trace.points.length<=3||j===0||j===trace.points.length-1))node('text',{x:x(p.x),y:y(p.y)-12,'text-anchor':'middle',class:'d3-chart-tick-label'},format(p.y));});}
    else if(trace.style==='points')trace.points.forEach(p=>{const mark=node('circle',{cx:x(p.x),cy:y(p.y),r:trace.emphasis==='reference'?8:4,fill:color,'data-trace-label':trace.label,'data-value-x':p.x,'data-value-y':p.y,...(trace.emphasis==='reference'?{stroke:'var(--pcd-surface-strong)','stroke-width':2.5,'data-experiment-reference':'true'}:{})}),title=document.createElementNS(NS,'title');title.textContent=`${trace.label}: ${p.x}, ${p.y}`;mark.append(title);});
   else{const width=Math.min(40,Math.abs(x(trace.points[1]?.x??trace.points[0].x+1)-x(trace.points[0].x))*.85);trace.points.forEach(p=>node('rect',{x:x(p.x)-width/2,y:y(p.y),width,height:Math.max(0,y(0)-y(p.y)),fill:color,'fill-opacity':.5}));}
   });
      // The full marker labels and values remain in Details; repeating them
      // above narrow plots collides with axis titles and duplicates readouts.
      (panel.markers??[]).forEach((mark,i)=>{const color=`var(--pcd-chart-series-${(i+1)%5+1})`,at=x(mark.x),marker=node('line',{x1:at,x2:at,y1:topY,y2:bottomY,stroke:color,'stroke-width':2,'stroke-dasharray':'5 3','data-experiment-marker':mark.label,'data-marker-x':mark.x}),title=document.createElementNS(NS,'title');title.textContent=`${mark.label}: ${format(mark.x)}`;marker.append(title);});
    if(panel.inset){const inset=graph(panel.inset,false);inset.setAttribute('x',String(chartWidth*.56));inset.setAttribute('y','85');inset.setAttribute('width',String(chartWidth*.43));inset.setAttribute('height','175');inset.dataset.experimentInset='true';const background=document.createElementNS(NS,'rect');for(const[k,v]of Object.entries({x:0,y:0,width:640,height:340,fill:'var(--pcd-surface-strong)',stroke:'currentColor'}))background.setAttribute(k,String(v));inset.prepend(background);svg.append(inset);}
    return svg;
 }
  function paintPanels(result:ReturnType<typeof runExperiment>){
    const previous=[...panels.querySelectorAll<SVGSVGElement>(':scope > figure > svg')];
    const fill=typeof getComputedStyle!=='undefined'&&getComputedStyle(root).getPropertyValue('--pcd-experiment-fill-stage').trim()==='1';
    const heights=previous.map(svg=>fill?svg.clientHeight:0);
    previous.forEach(svg=>observer?.unobserve(svg));
    panels.dataset.layout=experimentPlotGeometry(root.clientWidth,result.panels.length).stacked?'stack':'row';
    panels.replaceChildren();root.dataset.panelCount=String(result.panels.length);for(const [index,panel] of result.panels.entries()){const figure=document.createElement('figure'),caption=document.createElement('figcaption');panel.traces.forEach((trace,i)=>{const entry=document.createElement('span');entry.className='experiment-legend-entry';const swatch=document.createElement('i');if(trace.emphasis==='reference')entry.dataset.experimentReference='true';swatch.style.background=trace.emphasis==='reference'?'var(--pcd-experiment-reference)':`var(--pcd-chart-series-${i%5+1})`;swatch.setAttribute('aria-hidden','true');entry.append(swatch,document.createTextNode(trace.label));caption.append(entry);});const svg=graph(panel,true,heights[index]);figure.append(svg,caption);panels.append(figure);if(fill)observer?.observe(svg);}
    panels.style.removeProperty('--pcd-experiment-legend-height');
    if(fill&&panels.dataset.layout==='row'){
      const legendHeight=Math.max(0,...[...panels.querySelectorAll('figcaption')].map(caption=>caption.clientHeight));
      panels.style.setProperty('--pcd-experiment-legend-height',`${legendHeight}px`);
    }
  }
  function paint(result:ReturnType<typeof runExperiment>){
   lastResult=result;paintPanels(result);
  const singleTrial=block.experimentKind==='dilution'&&(values.M??block.parameters.find(p=>p.key==='M')!.value)===1;
  panels.hidden=singleTrial;root.dataset.singleTrial=String(singleTrial);
    const emphasized=teachingReadouts(block,result,values);root.dataset.readoutCount=String(emphasized.length);
     output.replaceChildren();for(const item of emphasized){const row=document.createElement('span'),label=document.createElement('span'),value=document.createElement('strong');row.dataset.readoutKind=typeof item.value==='string'?'text':'number';label.textContent=item.label;value.textContent=format(item.value);row.append(label,document.createTextNode(': '),value);output.append(row);}
   comparison.replaceChildren();const sources=result.readouts.filter(v=>v.label.includes('-only output SD')&&typeof v.value==='number');comparison.hidden=!sources.length;
    if(sources.length){const heading=document.createElement('p');heading.textContent='Input-specific output SDs: not additive shares.';comparison.append(heading);const max=Math.max(...sources.map(s=>Number(s.value)));for(const source of sources){const row=document.createElement('div'),label=document.createElement('span'),track=document.createElement('span'),bar=document.createElement('i');row.className='experiment-source-row';label.textContent=`${source.label}: ${format(source.value)}`;track.className='experiment-source-track';bar.style.width=`${max?100*Number(source.value)/max:0}%`;bar.setAttribute('aria-hidden','true');track.append(bar);row.append(label,track);comparison.append(row);}}
    note.textContent=result.note;fallback.textContent=[...result.readouts.map(v=>`${v.label}: ${v.value}`),...result.panels.flatMap(p=>[...(p.xLabels??[]).map(v=>`${v.value}: ${v.label}`),...(p.markers??[]).map(v=>`${v.label}: ${v.x}`),...p.traces.flatMap(t=>[t.label,...t.points.map(v=>`${v.x}: ${v.y}`)])])].join('\n');root.dataset.modelValues=JSON.stringify({...Object.fromEntries(block.parameters.map(p=>[p.key,p.value])),...values});
 }
    const stop=(e:Event)=>{e.stopPropagation();if((e as KeyboardEvent).key==='Escape'){const opened=details.open?details:settings.open?settings:undefined;if(opened){opened.open=false;opened.querySelector('summary')?.focus();}}};root.addEventListener('keydown',stop);root.append(controls,feedback,panels,output,comparison,actions);host.replaceChildren(root);paint(runExperiment(block));
    observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(()=>{const size=[root.clientWidth,root.clientHeight,panels.clientHeight,...[...panels.querySelectorAll<SVGSVGElement>(':scope > figure > svg')].map(svg=>svg.clientHeight)].join(':');if(root.clientWidth>0&&size!==lastSize){lastSize=size;if(lastResult)paintPanels(lastResult);}});observer?.observe(root);observer?.observe(panels);
    return{destroy(){observer?.disconnect();root.removeEventListener('keydown',stop);host.replaceChildren();}};
}
