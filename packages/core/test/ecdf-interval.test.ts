import {test} from "node:test";
import assert from "node:assert/strict";
import {validateObservationExplorer,observationExplorerFallback,type ObservationExplorerBlock} from "../src/observation-explorer.ts";
const source=[{resourceId:"urn:data"}];
const block:ObservationExplorerBlock={id:"cdf",kind:"chart",chartType:"observations",label:"Two thresholds",description:"Illustrative data",source,
  xAxis:{label:"Result",unit:"mg/L"},yAxis:{label:"Fraction"},view:"ecdf",compact:true,
  series:[{id:"s",datasetId:"data",label:"One series",source,data:[1,2,2,3,4].map((value,i)=>({id:`x${i}`,value,label:`Reading ${i+1}`,source}))}],
  threshold:{minimum:0,maximum:5,initial:3,lowerInitial:2,step:1}};
test("interval fallback excludes every lower-endpoint tie and includes upper endpoint",()=>{
  validateObservationExplorer(block);
  assert.match(observationExplorerFallback(block),/Interval \(2, 3\]: 4-3 = 1 of 5/);
});
test("reversed, nonfinite, out-of-domain or count-view lower thresholds are invalid",()=>{
  for(const lowerInitial of [-1,4,NaN,Infinity])assert.throws(()=>validateObservationExplorer({...block,threshold:{...block.threshold!,lowerInitial}}));
  assert.throws(()=>validateObservationExplorer({...block,view:"count",compact:undefined}));
  assert.doesNotThrow(()=>validateObservationExplorer({...block,threshold:{...block.threshold!,lowerInitial:3}}));
});
