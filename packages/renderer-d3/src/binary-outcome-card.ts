import type {BinaryExperiment} from "../../core/src/binary-experiment.ts";

export function binaryOutcomeCard(label:string,model:BinaryExperiment,outcome?:boolean,coding=false,compact=false):HTMLDivElement {
  const el=document.createElement("div");el.className=`binary-sample${outcome===undefined?"":" "+(outcome?"is-positive":"is-negative")}`;
  const name=document.createElement("span");name.className="binary-sample-label";name.textContent=label;
  const tube=document.createElement("span");tube.className="binary-tube";tube.setAttribute("aria-hidden","true");el.append(tube,name);
  if(outcome!==undefined){const status=document.createElement("strong");const meaning=outcome?model.positiveLabel:model.negativeLabel;status.textContent=compact?(outcome?"+":"−"):`${outcome?"+":"−"} ${meaning}${coding?outcome?" · 1":" · 0":""}`;if(compact){status.setAttribute("aria-label",meaning);el.dataset.outcomeStyle="compact";}el.append(status);}
  return el;
}

export function binaryOutcomeKey(model:BinaryExperiment):HTMLParagraphElement {
  const key=document.createElement("p");key.className="binary-outcome-key";key.textContent=`+ ${model.positiveLabel} · − ${model.negativeLabel}`;key.setAttribute("data-interactive-detail","true");return key;
}
