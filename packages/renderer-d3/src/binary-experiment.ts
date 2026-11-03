import {binarySeriesAtStage,collectBinaryCount,initialBinarySeries,revealBinaryCount,runBinarySeries,type BinaryExperiment} from "../../core/src/binary-experiment.ts";
import type {DiagramBlock} from "../../core/src/scene-document.ts";
import type {D3FlowRuntimePort} from "./flow-diagram.ts";
import {balanceCardGrid} from "./card-grid.ts";
import {binaryOutcomeCard,binaryOutcomeKey} from "./binary-outcome-card.ts";
import {mountBinomialWorkshop} from "./binomial-workshop.ts";
import {bindBinaryLectureStages} from "./binary-lecture-stages.ts";

/** Uses the existing flow lifecycle; only the authored experiment capability changes the view. */
export function binaryExperimentRuntime(block:DiagramBlock,model:BinaryExperiment):D3FlowRuntimePort {
  return {
    measureHost:host=>typeof HTMLElement!=="undefined"&&host instanceof HTMLElement?host.clientWidth||1000:1000,
    observeResize(host,callback){
      if(typeof ResizeObserver==="undefined"||!(host instanceof HTMLElement))return ()=>{};
      const observer=new ResizeObserver(()=>{if(host.clientWidth>0)callback(host.clientWidth);});observer.observe(host);
      return ()=>observer.disconnect();
    },
    mount(host){
      if(typeof HTMLElement==="undefined"||!(host instanceof HTMLElement))throw new Error("Binary experiment needs an HTML host");
      if(!["decision","series"].includes(model.mode))return mountBinomialWorkshop(host,block,model);
      const root=document.createElement("div");root.className="binary-experiment pcd-interactive";root.dataset.mode=model.mode;
      let state=initialBinarySeries(model),stage=0;
      let lecturePrompt="";
      const intro=document.createElement("p");intro.className="binary-intro";intro.textContent=block.description;
      const visual=document.createElement("div");visual.className="binary-visual";
      const controls=document.createElement("div");controls.className="binary-controls pcd-interactive-controls";
      const output=document.createElement("p");output.className="binary-output";output.setAttribute("aria-live","polite");
      const metadata=document.createElement("p");metadata.className="binary-metadata";
      function button(label:string,action:()=>void){const el=document.createElement("button");el.type="button";el.textContent=label;el.addEventListener("click",action);controls.append(el);return el;}
      let advance:HTMLButtonElement|undefined,run:HTMLButtonElement|undefined,reveal:HTMLButtonElement|undefined,collect:HTMLButtonElement|undefined;
      if(model.mode==="decision")advance=button("Show outcomes",()=>{stage++;render();});
      else{
        run=button("Run a series",()=>{state=runBinarySeries(model,state);render();});
        reveal=button("Show count",()=>{state=revealBinaryCount(state);render();});
        collect=button("Collect count",()=>{state=collectBinaryCount(state);render();});
      }
      button("Reset",()=>{stage=0;state=initialBinarySeries(model);render();});
      function card(label:string,outcome?:boolean,coding=false){
        return binaryOutcomeCard(label,model,outcome,coding,!!model.stages&&model.mode==="series");
      }
      function histogram(){
        const panel=document.createElement("div");panel.className="binary-counts";
        const heading=document.createElement("h3");heading.textContent="Collected counts across repeated series";
        const NS="http://www.w3.org/2000/svg",svg=document.createElementNS(NS,"svg");svg.setAttribute("viewBox","0 0 700 230");svg.setAttribute("role","img");
        const counts=Array.from({length:model.trialCount+1},(_,i)=>state.collected.filter(v=>v===i).length);
        svg.setAttribute("aria-label",state.collected.length?counts.map((v,i)=>`${i} ${model.positiveLabel} outcomes: ${v} series`).join('; '):"No counts collected yet. Empty frequency chart.");
        function shape(tag:string,attrs:Record<string,string|number>,text?:string){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;svg.append(el);}
        const maximum=Math.max(1,...counts),width=600/counts.length;
        shape("path",{d:"M55 30V180H665",class:"binary-axis"});
        shape("text",{x:55,y:18},"Number of collected series");
        shape("text",{x:360,y:225,"text-anchor":"middle"},`Count of ${model.positiveLabel} outcomes per series`);
        counts.forEach((count,i)=>{const x=60+i*width,h=130*count/maximum;
          if(count)shape("rect",{x:x+width*.15,y:180-h,width:width*.7,height:h,class:"binary-bar","data-count-category":i,"data-series-frequency":count});
          if(count)shape("text",{x:x+width*.5,y:173-h,"text-anchor":"middle"},String(count));
          shape("text",{x:x+width*.5,y:200,"text-anchor":"middle"},String(i));
        });
        panel.append(heading,svg);return panel;
      }
      function render(){
        visual.replaceChildren();
        if(model.mode==="decision"){
          const sample=card(block.nodes[0]!.label);sample.classList.add("binary-single");visual.append(sample);
          const rule=document.createElement("div");rule.className="binary-rule";rule.textContent=block.nodes[1]!.label;visual.append(rule);
          if(stage>=1){const outcomes=document.createElement("div");outcomes.className="binary-outcomes";outcomes.append(card("Outcome",true,stage>=2),card("Outcome",false,stage>=2));visual.append(outcomes);}
          advance!.textContent=stage===0?"Show outcomes":stage===1?"Add outcome codes":"Name the trial";advance!.disabled=stage>=3;
          output.textContent=stage>=3?model.trialName:stage===2?"1 and 0 encode the two outcomes.":stage===1?"Which outcome will we count?":"Predict before revealing the possible outcomes.";
          metadata.textContent="";
        }else{
          const samples=document.createElement("div");samples.className="binary-sample-grid";
          for(let i=0;i<model.trialCount;i++)samples.append(card(`${model.unitLabel} ${i+1}`,state.outcomes[i]));
          visual.append(samples,histogram());
          run!.disabled=state.run!==state.collected.length||state.run>=1000;
          run!.textContent=state.run?"Next series":"Run a series";
          reveal!.disabled=!state.outcomes.length||state.countVisible;
          collect!.disabled=!state.countVisible||state.run===state.collected.length;
          output.textContent=state.countVisible?`${model.positiveLabel} outcomes: ${state.outcomes.filter(Boolean).length} of ${model.trialCount}. ${state.run===state.collected.length?"Count collected.":"Now collect the count."}`:state.run?`Count the ${model.positiveLabel} outcomes before revealing the total.`:`How many ${model.positiveLabel} outcomes do you expect? Is that count guaranteed?`;
          metadata.textContent=`Model simulation · initial seed ${model.seed} · series ${state.run} · ${state.collected.length} collected. Not real measurements.`;
        }
        root.dataset.revealStage=String(stage);root.dataset.run=String(state.run);
        if(lecturePrompt)output.textContent=lecturePrompt+(model.mode==="series"&&state.countVisible?` Positive outcomes: ${state.outcomes.filter(Boolean).length} of ${model.trialCount}.`:"");
        const grid=visual.querySelector<HTMLElement>(".binary-sample-grid");if(grid)balanceCardGrid(grid);
      }
      root.append(intro,...(model.stages&&model.mode==="series"?[binaryOutcomeKey(model)]:[]),visual,...(model.stages?[]:[controls]),output,metadata);host.replaceChildren(root);if(!model.stages)render();
      const unbind=bindBinaryLectureStages(host,model,(snapshot,step)=>{
        stage=snapshot.revealLevel;lecturePrompt=snapshot.prompt;
        if(model.mode==="series")state=binarySeriesAtStage(model,snapshot);
        root.dataset.lectureStage=String(step);render();
      });
      return {update(){const grid=visual.querySelector<HTMLElement>(".binary-sample-grid");if(grid)balanceCardGrid(grid);},focusNode(){},destroy(){unbind();root.remove();}};
    },
  };
}
