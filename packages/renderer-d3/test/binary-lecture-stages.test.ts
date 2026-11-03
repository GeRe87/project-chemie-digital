import {test} from "node:test";
import assert from "node:assert/strict";
import {bindBinaryLectureStages} from "../src/binary-lecture-stages.ts";
import type {BinaryExperiment} from "../../core/src/binary-experiment.ts";

test("lecture bridge uses the existing step event, restores backwards and removes listeners",()=>{
  class Host extends EventTarget {
    attrs=new Map<string,string>();
    getAttribute(key:string){return this.attrs.get(key)??null;}
    setAttribute(key:string,value:string){this.attrs.set(key,value);}
    removeAttribute(key:string){this.attrs.delete(key);}
  }
  const host=new Host(),seen:number[]=[];
  const source=[{resourceId:"urn:test"}];
  const model:BinaryExperiment={id:"m",mode:"decision",trialCount:1,positiveProbability:.2,seed:1,positiveLabel:"positive",negativeLabel:"negative",unitLabel:"Sample",trialName:"Bernoulli trial",source,stages:[0,1,2,3].map(i=>({id:`s${i}`,prompt:`Stage ${i}`,revealLevel:i,source}))};
  const unbind=bindBinaryLectureStages(host as unknown as HTMLElement,model,(_snapshot,index)=>seen.push(index));
  assert.equal(host.getAttribute("data-presentation-step-count"),"3");
  const step=(n:number)=>host.dispatchEvent(new CustomEvent("pcd-presentation-step",{detail:{step:n}}));
  step(1);step(2);step(1);step(0);step(3);step(999);step(-1);step(NaN);
  assert.deepEqual(seen,[0,1,2,1,0,3,0]);
  unbind();assert.equal(host.getAttribute("data-presentation-step-count"),null);step(2);
  assert.equal(seen.length,7);
  const complete: number[]=[];
  const unbindSingle=bindBinaryLectureStages(host as unknown as HTMLElement,{...model,stages:[model.stages![3]!]},snapshot=>complete.push(snapshot.revealLevel));
  assert.equal(host.getAttribute("data-presentation-step-count"),"0");
  assert.deepEqual(complete,[3]);step(99);assert.deepEqual(complete,[3]);
  unbindSingle();assert.equal(host.getAttribute("data-presentation-step-count"),null);
});
