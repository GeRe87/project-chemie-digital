import { capturePageMotionSnapshot } from "./page-motion-snapshot.ts";

/** Commit navigation atomically, then move outgoing and incoming full pages
 * together. Cosmetic snapshots never become slides in the navigation model. */
export const PRESENTATION_PAGE_MOTION = Object.freeze({durationMs:800,easing:"cubic-bezier(.65,0,.35,1)"});

export function presentationPageFrames(direction:string,height:number) {
  const distance=(direction==="next"?1:-1)*height;
  return {incoming:[{translate:`0 ${distance}px`},{translate:"0 0"}],outgoing:[{translate:"0 0"},{translate:`0 ${-distance}px`}]};
}

/** Background travel is independent of fragment-page heights. A long proof must
 * not cause a much larger parallax jump than a short, plain page. */
export function presentationBackgroundProgress(pageIndex:number):number {
  return Math.max(0,pageIndex)*64;
}

export function mountPresentationPageMotion(root:HTMLElement):()=>void {
  type Snapshot=ReturnType<typeof capturePageMotionSnapshot> & {targetId:string};
  let prepared:Snapshot|undefined;
  let running:{animations:Animation[];snapshot?:Snapshot;restoreClip:()=>void}|undefined;
  const cancel=()=>{
    const previous=running;running=undefined;
    previous?.animations.forEach(a=>a.cancel());previous?.snapshot?.layer.remove();previous?.restoreClip();
    prepared?.layer.remove();prepared=undefined;delete root.dataset.pageMotion;
  };
  const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches||document.body.dataset.presentationMode==="script";
  const prepare=(event:Event)=>{
    cancel();if(reduced())return;
    const {sourceId,targetId}=(event as CustomEvent<{sourceId:string;targetId:string}>).detail;
    const source=root.ownerDocument.getElementById(sourceId);
    if(source&&root.contains(source))prepared={...capturePageMotionSnapshot(source),targetId};
  };
  const change=(event:Event)=>{
    const {targetId,direction}=(event as CustomEvent<{targetId:string;direction:string}>).detail;
    const pending=prepared;prepared=undefined;cancel();
    const snapshot=pending?.targetId===targetId?pending:undefined;
    if(pending&&!snapshot)pending.layer.remove();
    if(reduced()){snapshot?.layer.remove();cancel();return;}
    const scene=root.ownerDocument.getElementById(targetId);
    if(!scene||!root.contains(scene)){snapshot?.layer.remove();return;}
    const incoming=scene.closest?.<HTMLElement>(".scroll-page-content")??scene;
    if(typeof incoming.animate!=="function"){snapshot?.layer.remove();return;}
    const height=snapshot?.height??root.ownerDocument.defaultView?.innerHeight??900;
    const frames=presentationPageFrames(direction,height);
    const parent=incoming.parentElement,clip=parent?.style.clipPath??"",wasInert=incoming.inert;
    if(parent)parent.style.clipPath="inset(0)";
    // Moving targets are decorative until settled; navigation controls remain
    // active outside this container, and a fragment command settles it first.
    incoming.inert=true;
    const state={animations:[] as Animation[],snapshot,restoreClip:()=>{if(parent)parent.style.clipPath=clip;incoming.inert=wasInert;}};
    running=state;
    root.dataset.pageMotion="running";
    const options={duration:PRESENTATION_PAGE_MOTION.durationMs,easing:PRESENTATION_PAGE_MOTION.easing,fill:"both" as const};
    const entering=incoming.animate(frames.incoming,options);state.animations.push(entering);
    if(snapshot)state.animations.push(snapshot.layer.animate(frames.outgoing,options));
    const time=root.ownerDocument.timeline?.currentTime;
    if(typeof time==="number")state.animations.forEach(a=>{a.startTime=time;});
    entering.addEventListener("finish",()=>{if(running===state)cancel();},{once:true});
  };
  root.addEventListener("pcd-presentation-page-will-change",prepare);
  root.addEventListener("pcd-presentation-page-change",change);root.addEventListener("pcd-presentation-mode-change",cancel);
  // Accepted fragment commands and focus take priority over cosmetic motion.
  // Raw trackpad tails must not repeatedly snap a still-running transition.
  root.addEventListener("pcd-presentation-command",cancel);root.addEventListener("focusin",cancel);
  return()=>{cancel();root.removeEventListener("pcd-presentation-page-will-change",prepare);root.removeEventListener("pcd-presentation-command",cancel);root.removeEventListener("focusin",cancel);root.removeEventListener("pcd-presentation-page-change",change);root.removeEventListener("pcd-presentation-mode-change",cancel);};
}
