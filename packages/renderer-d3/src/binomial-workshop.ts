import type {DiagramBlock} from "../../core/src/scene-document.ts";
import type {BinaryExperiment} from "../../core/src/binary-experiment.ts";
import {arrangementAt,arrangementCount,binomialMass,binomialMoments,specifiedSequenceProbability} from "../../core/src/binomial.ts";
import type {D3FlowRuntimeMount} from "./flow-diagram.ts";
import {binaryOutcomeCard,binaryOutcomeKey} from "./binary-outcome-card.ts";
import {balanceCardGrid} from "./card-grid.ts";
import {bindBinaryLectureStages} from "./binary-lecture-stages.ts";

/** Finite-model investigations. No course identities, authored formulas or legends in code. */
export function mountBinomialWorkshop(host:HTMLElement,block:DiagramBlock,model:BinaryExperiment):D3FlowRuntimeMount {
  let stage=0,index=0,n=model.trialCount,p=model.positiveProbability,caseIndex=0;
  const lecture=!!model.stages;
  let lecturePrompt="";
  const root=document.createElement("div");root.className="binary-experiment pcd-interactive";root.dataset.mode=model.mode;
  const intro=document.createElement("p");intro.className="binary-intro";intro.textContent=block.description;
  const content=document.createElement("div");
  for(const detail of [intro,content])detail.setAttribute("data-interactive-detail","true");
  const parameters=document.createElement("div");parameters.className="binary-controls pcd-interactive-controls";
  const parameterFields:{label:string;text:HTMLSpanElement;input:HTMLInputElement;current:()=>number}[]=[];
  const controls=document.createElement("div");controls.className="binary-controls pcd-interactive-controls";
  const output=document.createElement("p");output.className="binary-output";output.setAttribute("aria-live","polite");
  const percent=(v:number)=>`${Number((100*v).toFixed(4))}%`;
  const fmt=(v:number)=>String(Number(v.toFixed(4)));
  const target=model.mode==="zero"?0:model.targetCount??0;
  const signal=()=>{if(!lecture)host.dispatchEvent(new CustomEvent("pcd-semantic-stage",{detail:{step:stage}}));};
  function button(label:string,action:()=>void){const el=document.createElement("button");el.type="button";el.textContent=label;el.addEventListener("click",action);controls.append(el);return el;}
  let advance:HTMLButtonElement;
  if(model.mode==="arrangements")button("Move the positives",()=>{index=(index+1)%arrangementCount(n,target);render();});
  if(model.mode==="assumptions"){
    const cases=block.nodes.filter(node=>node.visualRole==="case");
    cases.forEach((_,i)=>button(`Case ${i+1}`,()=>{caseIndex=i;stage=0;render();}));
  }
  advance=button(model.mode==="distribution"?"Explain centre and spread":model.mode==="assumptions"?"Show reasoning":model.mode==="zero"?"Show model probability":model.mode==="sequence"?"Show the factors":"Count all arrangements",()=>{stage++;render();});
  button("Reset",()=>{stage=0;index=0;n=model.trialCount;p=model.positiveProbability;caseIndex=0;render();});
  function parameter(label:string,current:()=>number,min:number,max:number,step:number,change:(value:number)=>void){
    const wrap=document.createElement("label"),text=document.createElement("span"),input=document.createElement("input");
    text.textContent=`${label}: ${current()}`;input.type="range";input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(current());input.setAttribute("aria-label",label);
    parameterFields.push({label,text,input,current});
    input.addEventListener("input",()=>{change(Number(input.value));stage=0;render();});wrap.append(text,input);return wrap;
  }
  function drawMass(){
    const panel=document.createElement("div");panel.className="binary-counts";
    const NS="http://www.w3.org/2000/svg",svg=document.createElementNS(NS,"svg");svg.setAttribute("viewBox","0 0 700 230");svg.setAttribute("role","img");
    const mass=binomialMass(n,p);svg.setAttribute("aria-label",`Exact model probabilities: ${mass.map((v,k)=>`${k}: ${percent(v)}`).join('; ')}`);
    function shape(tag:string,attrs:Record<string,string|number>,text?:string){const el=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;svg.append(el);}
    const width=600/(n+1);shape("path",{d:"M55 30V180H665",class:"binary-axis"});
    shape("text",{x:55,y:18},"Probability per count (fixed 0–100% scale)");
    for(const v of [0,.5,1])shape("text",{x:48,y:185-145*v,"text-anchor":"end"},`${100*v}%`);
    mass.forEach((v,k)=>{shape("rect",{x:60+k*width+width*.1,y:180-145*v,width:Math.max(.5,width*.8),height:145*v,class:"binary-bar","data-model-count":k,"data-model-probability":v});if(k===0||k===n||n<=20||k%Math.ceil(n/5)===0)shape("text",{x:60+(k+.5)*width,y:201,"text-anchor":"middle"},String(k));});
    shape("text",{x:360,y:225,"text-anchor":"middle"},"Number of positive outcomes");panel.append(svg);return panel;
  }
  function arrangementOverview(){
    const wrap=document.createElement("div");
    const count=arrangementCount(n,target),caption=document.createElement("p");caption.textContent=`${count} arrangements with ${target} positives`;wrap.append(caption);
    const grid=document.createElement("div");grid.className="binary-arrangement-grid";
    // Keep the overview finite. Larger positioning models retain the sample view.
    for(let i=0;i<count;i++){
      const row=document.createElement("div");row.className="binary-arrangement";row.dataset.arrangement=String(i);
      const values=arrangementAt(n,target,i);row.setAttribute("role","img");row.setAttribute("aria-label",`Arrangement ${i+1}: positive positions ${values.flatMap((v,j)=>v?[j+1]:[]).join(", ")}`);
      values.forEach(v=>{const dot=document.createElement("span");dot.className=v?"is-positive":"is-negative";dot.textContent=v?"+":"−";dot.setAttribute("aria-hidden","true");row.append(dot);});grid.append(row);
    }
    wrap.append(grid);return wrap;
  }
  function render(){
    content.replaceChildren();root.dataset.revealStage=String(stage);
    if(model.mode==="distribution"){
      for(const field of parameterFields){field.text.textContent=`${field.label}: ${field.current()}`;field.input.value=String(field.current());}
      if(lecture)parameters.textContent=`Trials: ${n} · Positive probability: ${fmt(p)}`;
      content.append(drawMass());
      advance.disabled=stage>=1;
      const moments=binomialMoments(n,p);
      output.textContent=stage?`Expected count: ${fmt(moments.mean)}. Variance: ${fmt(moments.variance)} squared counts. Standard deviation: ${fmt(moments.sd)} counts.`:"Predict the shape before changing a parameter. Then explain its centre and spread.";
    }else if(model.mode==="assumptions"){
      const conditions=document.createElement("p");conditions.textContent=block.nodes.filter(node=>node.visualRole==="condition").map(node=>node.label).join(" · ");
      const item=block.nodes.filter(node=>node.visualRole==="case")[caseIndex]!;
      const question=document.createElement("p");question.textContent=item.label;content.append(conditions,question);
      advance.disabled=stage>=1;
      output.textContent=stage?item.description??"":"Discuss: which trial unit and which model assumptions apply?";
    }else{
      const grid=document.createElement("div");grid.className="binary-sample-grid";
      const outcomes=arrangementAt(n,target,index);
      outcomes.forEach((v,i)=>{const card=binaryOutcomeCard(`${model.unitLabel} ${i+1}`,model,v,false,lecture);if(model.mode==="sequence"&&stage>=1){const factor=document.createElement("small");factor.textContent=fmt(v?p:1-p);card.append(factor);}grid.append(card);});
      content.append(lecture&&model.mode==="arrangements"&&stage>=1&&arrangementCount(n,target)<=100?arrangementOverview():grid);
      advance.disabled=stage>=2;
      if(model.mode==="sequence"){
        advance.textContent=stage===0?"Show the factors":"Show sequence probability";
        output.textContent=stage>=2?`This one specified sequence: ${percent(specifiedSequenceProbability(n,p,target))}. Not the probability of every sequence with this count.`:stage===1?"Independent outcomes: multiply their probabilities. The powers count repeated factors.":"A specified sequence, not a simulated series. How likely is this exact order?";
      }else if(model.mode==="arrangements"){
        advance.textContent=stage===0?"Count all arrangements":"Show binomial probability";
        output.textContent=stage>=2?`Exactly ${target} positives, in any order: ${percent(binomialMass(n,p)[target]!)}.`:stage===1?`${arrangementCount(n,target)} equally likely arrangements. Same count, different positions.`:"Move the positive results. Does their count change?";
      }else{
        advance.textContent=stage===0?"Show model probability":"Reverse the question";
        output.textContent=stage>=2?"Prediction assumed a known positive-result probability. Estimation starts from the observed zero count and an unknown probability. Zero observed does not establish zero probability.":stage===1?`Under the assumed ${100*p}% positive-result probability: ${percent(binomialMass(n,p)[0]!)} for zero positives.`:"Illustrative observation: no positive results. Does that establish a zero event probability?";
      }
    }
    if(lecturePrompt){
      const calculation=model.mode==="sequence"&&stage>=2?` Probability: ${percent(specifiedSequenceProbability(n,p,target))}.`:
        model.mode==="arrangements"&&stage>=2?` Probability: ${percent(binomialMass(n,p)[target]!)}.`:
        model.mode==="zero"&&stage===1?` Probability: ${percent(binomialMass(n,p)[0]!)}.`:
        model.mode==="distribution"&&stage>=1?` Expected count: ${fmt(binomialMoments(n,p).mean)}. Variance: ${fmt(binomialMoments(n,p).variance)} squared counts.`:"";
      if(model.mode!=="assumptions"||stage===0)output.textContent=lecturePrompt+calculation;
    }
    const grid=content.querySelector<HTMLElement>(".binary-sample-grid");if(grid)balanceCardGrid(grid);
    signal();
  }
  if(model.mode==="distribution"&&!lecture)parameters.append(parameter("Trials",()=>n,1,100,1,v=>n=v),parameter("Positive probability",()=>p,0,1,.05,v=>p=v));
  root.append(intro,...(lecture&&["sequence","arrangements","zero"].includes(model.mode)?[binaryOutcomeKey(model)]:[]),parameters,content,...(lecture?[]:[controls]),output);host.replaceChildren(root);if(!lecture)render();
  const unbind=bindBinaryLectureStages(host,model,(snapshot,step)=>{
    stage=snapshot.revealLevel;index=snapshot.arrangementIndex??0;caseIndex=snapshot.caseIndex??0;
    n=snapshot.trialCount??model.trialCount;p=snapshot.positiveProbability??model.positiveProbability;
    lecturePrompt=snapshot.prompt;root.dataset.lectureStage=String(step);render();
  });
  return {update(){const grid=content.querySelector<HTMLElement>(".binary-sample-grid");if(grid)balanceCardGrid(grid);},focusNode(){},destroy(){unbind();root.remove();}};
}
