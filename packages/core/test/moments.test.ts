import assert from "node:assert/strict";
import {test} from "node:test";
import {empiricalMoments} from "../src/moments.ts";
import {validateObservationExplorer,observationExplorerFallback,type ObservationExplorerBlock} from "../src/observation-explorer.ts";
import {validateSceneDocument} from "../src/scene-document.ts";
const source=[{resourceId:"urn:source"}];
test("descriptive moment conventions distinguish m2 from sample variance",()=>{
  const m=empiricalMoments([98,99,100,101,102]);
  const expected={n:5,mean:100,m2:2,m3:0,m4:6.8,sampleVariance:2.5,skewness:0,kurtosis:1.7};
  for(const key of Object.keys(expected))assert(Math.abs(m[key]!-expected[key])<1e-12,key);
});
test("positive affine transformations preserve shape coefficients and constant data stay undefined",()=>{
  const x=[0,1,2,10],m=empiricalMoments(x),t=empiricalMoments(x.map(v=>100+2*v));
  assert.equal(t.mean,100+2*m.mean);assert.equal(t.m2,4*m.m2);
  assert.equal(t.skewness,m.skewness);assert.equal(t.kurtosis,m.kurtosis);
  const zero=empiricalMoments(Array(100).fill(3));assert.equal(zero.m2,0);assert.equal(zero.skewness,null);assert.equal(zero.kurtosis,null);
  assert.throws(()=>empiricalMoments([1]));assert.throws(()=>empiricalMoments([1,NaN]));
});
test("moment view is generic, source-linked and version-gated",()=>{
  const chart:ObservationExplorerBlock={id:"m",kind:"chart",chartType:"observations",view:"moments",momentMetric:"variance",label:"Views",description:"Same data",source,xAxis:{label:"Value",unit:"a.u."},yAxis:{label:"Views"},series:[{id:"s",datasetId:"d",label:"Synthetic",source,data:[1,2,4].map((value,i)=>({id:`o${i}`,value,label:`O${i}`,source}))}]};
  validateObservationExplorer(chart);assert.match(observationExplorerFallback(chart),/sample variance/);
  const doc={id:"d",version:"1.12" as const,sourcePathId:"p",scenes:[{id:"s",source,blocks:[chart],readingOrder:[chart.id]}]};
  validateSceneDocument(doc);assert.throws(()=>validateSceneDocument({...doc,version:"1.11"}),/1.12/);
  assert.throws(()=>validateObservationExplorer({...chart,momentMetric:"raw-fourth" as never}),/known metric/);
  assert.throws(()=>validateObservationExplorer({...chart,view:"order"}),/Moment metric/);
});
