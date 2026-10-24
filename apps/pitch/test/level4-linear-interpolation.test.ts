import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {SceneDocument} from "../../../packages/core/src/scene-document.ts";
import {sampleQuantile} from "../../../packages/core/src/box-plot.ts";
import {createSelfStudyRenderPlan,renderSelfStudyHtml} from "../../../packages/renderer-self-study/src/index.ts";
import {createRevealRenderPlan} from "../../../packages/renderer-reveal/src/index.ts";

const artifact=JSON.parse(readFileSync(new URL("../public/authoring-runtime.json",import.meta.url),"utf8")) as {sceneDocuments:SceneDocument[]};
const document=artifact.sceneDocuments[0]!;
const oldTerm=/\b(?:type|typ)[ -]?7\b/iu;
function checkText(value:unknown,key="root"):void {
  if(["source","id","sourcePathId","quantileMethod"].includes(key))return;
  if(typeof value==="string")assert.doesNotMatch(value,oldTerm,key);
  else if(value&&typeof value==="object")for(const [name,child]of Object.entries(value))checkText(child,name);
}

test("lecture-facing text, R helper labels and script use linear interpolation rather than a numbered method name",()=>{
  assert.equal(document.scenes.length,65);
  checkText(document);
  const study=createSelfStudyRenderPlan(document);assert(study.plan);
  const html=renderSelfStudyHtml(study.plan,{interactive:false,narrative:true});
  assert.doesNotMatch(html.replace(/<[^>]*>/gu,""),oldTerm);
  const plan=createRevealRenderPlan(document);checkText(plan);
});

test("the calculation is still linear interpolation at the existing ranks, not the inverse ECDF",()=>{
  assert.equal(sampleQuantile([2,4,5,8],.25),3.5);
  assert.equal(sampleQuantile([2,4,5,8],.75),5.75);
  assert.equal(sampleQuantile([2,4,4,5,5,6,30],.25),4);
  assert.equal(sampleQuantile([2,4,4,5,5,6,30],.75),5.5);
  const river=Array.from({length:50},(_,i)=>(i+1)/2);
  assert.equal(sampleQuantile(river,.25),6.625);
  assert.equal(river[Math.ceil(50*.25)-1],6.5);
});

test("simplified quantile notation retains same-slide authored symbol legends and the rank formula",()=>{
  for(const slug of ["quartiles-concept","quantiles-concept","iqr-concept"]){
    const scene=document.scenes.find(s=>s.id===`ex:l4-scene-${slug}--scene`)!;
    const math=scene.blocks.find(b=>b.kind==="math")!;
    if(math.kind!=="math")throw Error("Missing formula");
    assert.doesNotMatch(math.expression,/Q_7|IQR\}_7/u);
    const index=scene.blocks.indexOf(math);const legend=scene.blocks[index+1]!;
    assert.equal(legend.kind,"definition-list");
    assert(legend.source.some(s=>s.relationPath==="dct:hasPart"&&math.source.some(m=>m.resourceId===s.resourceId)));
    if(legend.kind==="definition-list")assert(legend.entries.some(e=>e.description?.includes("Q̂(p)")));
    if(slug==="quantiles-concept")assert.match(math.expression,/h=1\+\(n-1\)p/u);
  }
});
