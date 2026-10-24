import {test} from "node:test";
import assert from "node:assert/strict";
import {sampleQuantile,boxPlotSummary,boxPlotStaticFallback,type BoxPlotBlock} from "../src/box-plot.ts";
import {validateSceneDocument} from "../src/scene-document.ts";

const source=[{resourceId:"urn:fixture"}];
const reference=[2,4,4,5,5,6,7],modified=[2,4,4,5,5,6,30];
test("type7 interpolation matches endpoints, singleton, ties and even n",()=>{
  assert.equal(sampleQuantile([2,4,5,8],.25),3.5);
  assert.equal(sampleQuantile(reference,.25),4);assert.equal(sampleQuantile(reference,.75),5.5);
  assert.equal(sampleQuantile([7],0),7);assert.equal(sampleQuantile([7],1),7);
  assert.equal(sampleQuantile([3,1,2],0),1);assert.equal(sampleQuantile([3,1,2],1),3);
  assert.equal(sampleQuantile([-1e308,1e308],.5),0);
  assert(Math.abs(sampleQuantile(modified,.9)-15.6)<1e-12);
  assert.throws(()=>sampleQuantile([],0));assert.throws(()=>sampleQuantile([NaN],.5));assert.throws(()=>sampleQuantile([1],1.1));
});
test("quartile boxes keep observed whiskers distinct from fences and retain flagged identities",()=>{
  const a=boxPlotSummary(reference),b=boxPlotSummary(modified);
  assert.deepEqual([a.lower,a.median,a.upper,a.iqr,a.lowerFence,a.upperFence],[4,5,5.5,1.5,1.75,7.75]);
  assert.deepEqual([a.lowerWhisker,a.upperWhisker,a.outlierIndices],[2,7,[]]);
  assert.deepEqual([b.lowerWhisker,b.upperWhisker,b.outlierIndices],[2,6,[6]]);
  assert.deepEqual(modified,[2,4,4,5,5,6,30]);
  assert.deepEqual(boxPlotSummary([4,4,4]).outlierIndices,[]);
  assert.equal(boxPlotSummary([4]).iqr,0);
  assert.throws(()=>boxPlotSummary([1,2],-1));assert.throws(()=>boxPlotSummary([1,2],0));
  assert.throws(()=>boxPlotSummary([-1e308,1e308]),/finite numeric range/);
});
test("box plots are additive version 1.9 and preserve numerical static alternatives",()=>{
  const block:BoxPlotBlock={id:"box",kind:"chart",chartType:"box",label:"Fixture",description:"Synthetic fixture",source,
    xAxis:{label:"Set"},yAxis:{label:"Concentration",unit:"mg/L"},quantileMethod:"type7",fenceMultiplier:1.5,
    groups:[{id:"modified",label:"Modified",source,data:modified.map((value,i)=>({id:"o"+i,value,source}))}]};
  const document={version:"1.9" as const,id:"doc",sourcePathId:"path",scenes:[{id:"scene",source,blocks:[block],readingOrder:[block.id]}]};
  validateSceneDocument(document);assert.throws(()=>validateSceneDocument({...document,version:"1.8"}),/1.9/);
  assert.match(boxPlotStaticFallback(block),/whiskers=\[2, 6\]/);assert.match(boxPlotStaticFallback(block),/flagged observations: 30/);
  assert.throws(()=>validateSceneDocument({...document,scenes:[{...document.scenes[0],blocks:[{...block,quantileMethod:"type1" as never}]}]}),/type7/);
});
