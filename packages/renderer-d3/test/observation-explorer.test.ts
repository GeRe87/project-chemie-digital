import {test} from "node:test";
import assert from "node:assert/strict";
import {ecdfGeometry, mountObservationExplorer} from "../src/observation-explorer.ts";
import type {ObservationExplorerBlock} from "../../core/src/observation-explorer.ts";

const source=[{resourceId:"urn:fixture"}];
const block: ObservationExplorerBlock={id:"plot",kind:"chart",chartType:"observations",view:"ecdf",label:"Fixture",description:"Three observations, two distinct values",source,
  xAxis:{label:"Threshold",unit:"u"},yAxis:{label:"Fraction"},threshold:{minimum:-1,maximum:5,initial:2,step:.1},
  series:[{id:"series",datasetId:"dataset",label:"Observations",source,data:[0,2,2].map((value,i)=>({id:`o${i}`,label:`O${i}`,value,source}))}]};
test("ECDF geometry preserves plateaus and distinct left/right endpoints at tied values",()=>{
  assert.deepEqual(ecdfGeometry(block),[
    {value:0,count:1,multiplicity:1,left:0,right:1/3,end:2},
    {value:2,count:3,multiplicity:2,left:1/3,right:1,end:5},
  ]);
});
test("invalid/non-browser mounts fail with a diagnostic, not a DOM reference error",()=>{
  assert.equal(mountObservationExplorer(null,block).diagnostics?.[0].code,"INVALID_OBSERVATION_EXPLORER");
});
