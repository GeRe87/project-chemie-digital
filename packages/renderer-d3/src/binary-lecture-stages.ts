import type {BinaryExperiment,BinaryExperimentStage} from "../../core/src/binary-experiment.ts";

/** Native presentation fragments drive reversible snapshots, not button clicks. */
export function bindBinaryLectureStages(host:HTMLElement,model:BinaryExperiment,apply:(stage:BinaryExperimentStage,index:number)=>void):()=>void {
  if(!model.stages)return ()=>{};
  const previous=host.getAttribute("data-presentation-step-count");
  let activeIndex=0;
  host.setAttribute("data-presentation-step-count",String(model.stages.length-1));
  const listener:EventListener=event=>{
    const step=(event as CustomEvent<{step:number}>).detail?.step;
    if(!Number.isInteger(step))return;
    const index=Math.max(0,Math.min(model.stages!.length-1,step));
    if(index===activeIndex)return;
    activeIndex=index;
    apply(model.stages![index]!,index);
  };
  host.addEventListener("pcd-presentation-step",listener);
  apply(model.stages[0]!,0);
  return ()=>{
    host.removeEventListener("pcd-presentation-step",listener);
    if(previous===null)host.removeAttribute("data-presentation-step-count");else host.setAttribute("data-presentation-step-count",previous);
  };
}
