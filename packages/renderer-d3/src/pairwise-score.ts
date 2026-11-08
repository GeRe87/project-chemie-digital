import {scaleLinear} from 'd3-scale';
import type {ExperimentBlock} from '../../core/src/distribution-experiment.ts';
import {pairwiseScores} from '../../core/src/pairwise-score.ts';
import {renderInlineText} from '../../renderer-shared/src/inline-math.ts';

/** Reusable compare → score → accumulate surface, driven entirely by RDF data.
 * Motion is optional; the same states remain accessible by keyboard and text. */
export function mountPairwiseScore(host:HTMLElement,block:ExperimentBlock){
 const steps=pairwiseScores(block),root=document.createElement('div');root.className='pairwise-score pcd-interactive';root.dataset.presentationInteractive='true';
 const initialCompleted=block.parameters.find(p=>p.key==='step')!.value;
 let completed=initialCompleted,busy=false,destroyed=false,revision=0;
 const controls=document.createElement('div'),status=document.createElement('p'),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 controls.className='pairwise-controls';status.setAttribute('aria-live','polite');status.className='pairwise-status';
 svg.setAttribute('viewBox','0 0 1000 350');svg.setAttribute('role','img');svg.setAttribute('aria-label',block.label);
 const table=document.createElement('table');table.className='pairwise-ledger';
 const ledger=document.createElement('details'),ledgerLabel=document.createElement('summary');ledgerLabel.textContent='Show completed comparisons';ledger.className='pairwise-ledger-disclosure';ledger.tabIndex=0;ledger.setAttribute('aria-label','Completed comparison ledger');ledger.append(ledgerLabel,table);
 const description=document.createElement('ul');description.className='pairwise-description';
 for(const line of block.description.split('\n')){const item=document.createElement('li');item.innerHTML=renderInlineText(line.replace(/^- /,''));description.append(item);}
 const button=(label:string,action:()=>void)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;controls.append(b);return b;};
 const previous=button('Previous',()=>{if(!busy){completed=Math.max(0,completed-1);paint();}});
 const next=button('Next comparison',()=>{void advance();});
 button('Reset',()=>{revision++;completed=initialCompleted;busy=false;svg.getAnimations({subtree:true}).forEach(a=>a.cancel());paint();});
 function paint(){
  svg.replaceChildren();table.replaceChildren();root.dataset.completed=String(completed);
  const node=(tag:string,attrs:Record<string,string|number>,text?:string)=>{const e=document.createElementNS(svg.namespaceURI,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text)e.textContent=text;svg.append(e);return e;};
  node('text',{x:500,y:35,'text-anchor':'middle','font-size':25,fill:'currentColor'},'X wins: +1 · tie: +0.5 · Y wins: +0');
  for(const group of [0,1]){
   const y=group===0?95:235;node('text',{x:25,y:y+8,'font-size':27,fill:'currentColor'},group===0?'X':'Y');
   const data=block.data!.filter(d=>d.y===group),x=scaleLinear().domain([0,Math.max(1,data.length-1)]).range([110,470]);
   data.forEach((d,i)=>{node('circle',{cx:x(i),cy:y,r:24,fill:group===0?'var(--pcd-chart-series-1)':'var(--pcd-chart-series-3)'});node('text',{x:x(i),y:y+8,'text-anchor':'middle','font-size':23,fill:'var(--pcd-surface-strong)'},String(d.x));node('text',{x:x(i),y:y+48,'text-anchor':'middle','font-size':18,fill:'currentColor'},d.label);});
  }
  const current=steps[Math.min(completed,steps.length-1)];
  node('text',{x:740,y:105,'text-anchor':'middle','font-size':25,fill:'currentColor'},'Statistic account U_X');
  node('text',{x:740,y:174,'text-anchor':'middle','font-size':54,fill:'currentColor'},String(completed?steps[completed-1]!.total:0));
  node('text',{x:740,y:235,'text-anchor':'middle','font-size':22,fill:'currentColor'},completed===steps.length?'All comparisons completed':`Next: ${current!.x.label} with ${current!.y.label}`);
  if(completed){const last=steps[completed-1]!;node('text',{x:500,y:325,'text-anchor':'middle','font-size':27,fill:'currentColor'},`${last.x.label} (${last.x.x}) ${last.relation} ${last.y.label} (${last.y.x}) → +${last.score}`);}
  status.textContent=completed?`${completed}/${steps.length}: ${steps[completed-1]!.x.label} ${steps[completed-1]!.relation} ${steps[completed-1]!.y.label}; +${steps[completed-1]!.score} points; U_X = ${steps[completed-1]!.total}.`:`0/${steps.length}: choose Next comparison.`;
  const header=table.createTHead().insertRow();for(const label of ['Pair','Comparison','Points','Account U_X']){const th=document.createElement('th');th.textContent=label;header.append(th);}
  const body=table.createTBody();steps.slice(0,completed).forEach(s=>{const row=body.insertRow();[`${s.x.label} / ${s.y.label}`,`${s.x.x} ${s.relation} ${s.y.x}`,`+${s.score}`,String(s.total)].forEach(t=>{row.insertCell().textContent=t;});});
  previous.disabled=completed===0;next.disabled=completed===steps.length;
 }
 async function advance(){
  if(busy||completed===steps.length)return;busy=true;const currentRevision=++revision;previous.disabled=true;next.disabled=true;
  const s=steps[completed]!,moving=document.createElementNS(svg.namespaceURI,'g');
  for(const [value,start,color] of [[s.x.x,120,'var(--pcd-chart-series-1)'],[s.y.x,880,'var(--pcd-chart-series-3)']] as const){
   const g=document.createElementNS(svg.namespaceURI,'g'),circle=document.createElementNS(svg.namespaceURI,'circle'),text=document.createElementNS(svg.namespaceURI,'text');
   circle.setAttribute('r','25');circle.setAttribute('fill',color);text.textContent=String(value);text.setAttribute('text-anchor','middle');text.setAttribute('y','8');text.setAttribute('fill','var(--pcd-surface-strong)');text.setAttribute('font-size','24');g.append(circle,text);g.setAttribute('transform',`translate(${start} 315)`);moving.append(g);
  }
  svg.append(moving);status.textContent=`Compare ${s.x.label} (${s.x.x}) with ${s.y.label} (${s.y.x}).`;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const animations=[...moving.children].map((g,i)=>g.animate([{transform:`translate(${i?880:120}px,315px)`},{transform:`translate(${i?540:460}px,315px)`}],{duration:650,fill:'forwards'}));await Promise.all(animations.map(a=>a.finished.catch(()=>{})));}
  if(destroyed||currentRevision!==revision)return;completed++;busy=false;paint();
 }
 root.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.stopPropagation();};root.append(controls,svg,status,description,ledger);host.replaceChildren(root);paint();
 return {destroy(){destroyed=true;busy=false;svg.getAnimations({subtree:true}).forEach(a=>a.cancel());host.replaceChildren();}};
}
