import assert from "node:assert/strict";
import test from "node:test";
import { clockParts } from "../src/presentation-clock.ts";
import { mountPresentationPageMotion, PRESENTATION_PAGE_MOTION, presentationBackgroundProgress, presentationPageFrames } from "../src/presentation-page-motion.ts";
import { validateSceneDocument, type SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../../../packages/renderer-self-study/src/index.ts";

test("local clock uses 12-hour padded hh/mm and explicit meridiem",()=>{
  assert.deepEqual(clockParts(new Date(2026,0,1,0,5)),{hours:"12",minutes:"05",meridiem:"a.m."});
  assert.deepEqual(clockParts(new Date(2026,0,1,12,9)),{hours:"12",minutes:"09",meridiem:"p.m."});
  assert.deepEqual(clockParts(new Date(2026,0,1,23,59)),{hours:"11",minutes:"59",meridiem:"p.m."});
});

test("page motion cancels superseded visuals without changing committed navigation state",()=>{
  const originalDocument=globalThis.document,originalMatch=globalThis.matchMedia;
  let reduced=false;const listeners=new Map<string,EventListener>();const animations:Array<{cancelled:boolean;finish?:()=>void}>=[];
  const scene={animate:()=>{const entry={cancelled:false,finish:undefined as (()=>void)|undefined};animations.push(entry);return {cancel(){entry.cancelled=true;},addEventListener(_type:string,fn:()=>void){entry.finish=fn;}};}};
  const root={dataset:{} as Record<string,string>,ownerDocument:{getElementById:()=>scene},contains:()=>true,addEventListener(t:string,f:EventListener){listeners.set(t,f);},removeEventListener(t:string){listeners.delete(t);}};
  try{
    Object.assign(globalThis,{document:{body:{dataset:{}}},matchMedia:()=>({matches:reduced})});
    const destroy=mountPresentationPageMotion(root as unknown as HTMLElement);
    const change=()=>listeners.get("pcd-presentation-page-change")!({detail:{targetId:"arbitrary",direction:"next"}} as unknown as Event);
    change();change();assert.equal(animations[0]!.cancelled,true);assert.equal(root.dataset.pageMotion,"running");
    animations[0]!.finish!();assert.equal(root.dataset.pageMotion,"running");animations[1]!.finish!();assert.equal(root.dataset.pageMotion,undefined);
    change();listeners.get("pcd-presentation-command")!({} as Event);assert.equal(animations[2]!.cancelled,true);assert.equal(root.dataset.pageMotion,undefined);
    reduced=true;change();assert.equal(animations.length,3);destroy();assert.equal(listeners.size,0);
  }finally{Object.assign(globalThis,{document:originalDocument,matchMedia:originalMatch});}
});

test("calm presentation motion is slower and background travel ignores fragment-page heights",()=>{
  assert.equal(PRESENTATION_PAGE_MOTION.durationMs,800);
  assert.deepEqual(presentationPageFrames('next',900),{incoming:[{translate:'0 900px'},{translate:'0 0'}],outgoing:[{translate:'0 0'},{translate:'0 -900px'}]});
  assert.deepEqual(presentationPageFrames('prev',720),{incoming:[{translate:'0 -720px'},{translate:'0 0'}],outgoing:[{translate:'0 0'},{translate:'0 720px'}]});
  assert.equal(presentationBackgroundProgress(0),0);
  assert.equal(presentationBackgroundProgress(-1),0);
  assert.equal(presentationBackgroundProgress(19)-presentationBackgroundProgress(18),64);
  assert.equal(presentationBackgroundProgress(18)-presentationBackgroundProgress(19),-64);
});

test("script projection uses authored narration, preserves math and escapes prose",()=>{
  const source=[{resourceId:"fixture"}];
  const d:SceneDocument={id:"doc",sourcePathId:"path",version:"1.7",scenes:[{id:"scene",source,narration:"First paragraph.\n\nSecond <script> paragraph.",blocks:[
    {id:"heading",kind:"prose",text:"Heading",intent:{kind:"introduce"},source},
    {id:"bullets",kind:"list",listStyle:"unordered",items:[{id:"item",text:"Presentation-only short statement",source}],source},
    {id:"math",kind:"math",expression:"x=1",spokenText:"x equals one",source},
  ],readingOrder:["heading","bullets","math"]}]};
  const result=createSelfStudyRenderPlan(d);assert.ok(result.plan);
  const ordinary=renderSelfStudyHtml(result.plan,{interactive:false});assert.match(ordinary,/Presentation-only/);
  const script=renderSelfStudyHtml(result.plan,{interactive:false,narrative:true});
  assert.match(script,/First paragraph/);assert.match(script,/Second &lt;script&gt;/);assert.doesNotMatch(script,/<script>|Presentation-only/);assert.match(script,/<math/);
  assert.throws(()=>validateSceneDocument({...d,scenes:[{...d.scenes[0]!,narration:" "}]}),/narration/);
});

test("self-study preserves dot observations and reference values rather than assuming a line chart",()=>{
  const source=[{resourceId:"fixture"}];
  const d:SceneDocument={id:"doc",sourcePathId:"path",version:"1.7",scenes:[{id:"s",source,blocks:[{id:"plot",source,kind:"chart",chartType:"dot",label:"Points",description:"Observed values",xAxis:{label:"Group"},yAxis:{label:"Value",unit:"a.u."},groups:[{id:"g",label:"G",source,data:[{id:"point",value:7,source}]}]}],readingOrder:["plot"]}]};
  const result=createSelfStudyRenderPlan(d);assert.deepEqual(result.diagnostics,[]);assert.ok(result.plan);
  const markup=renderSelfStudyHtml(result.plan,{interactive:false});assert.match(markup,/Points/);assert.match(markup,/7/);
});
