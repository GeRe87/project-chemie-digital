import { test } from "node:test";
import assert from "node:assert/strict";
import { observationExplorerFallback, validateObservationExplorer, type ObservationExplorerBlock } from "../src/observation-explorer.ts";
import { validateSceneDocument } from "../src/scene-document.ts";
const source=[{resourceId:"urn:test"}];
export const explorer: ObservationExplorerBlock = {
  id:"explorer",kind:"chart",chartType:"observations",label:"ECDF",description:"Count at or below x",source,
  view:"ecdf",xAxis:{label:"Threshold",unit:"mg/L"},yAxis:{label:"F_n(x)"},
  threshold:{minimum:0,maximum:8,initial:4,step:.1},
  series:[{id:"s",datasetId:"dataset",label:"Synthetic",source,data:[2,4,4,5,5,6,7].map((value,i)=>({id:`o${i}`,label:`O${i+1}`,value,source}))}],
};
test("contract and complete static fallback retain ties and left/right limits",()=>{
  validateObservationExplorer(explorer);
  const text=observationExplorerFallback(explorer);
  assert.match(text,/3\/7/); assert.match(text,/jump 2\/7/); assert.match(text,/left limit/);
  assert.equal(text.split("O").length-1,7);
});
test("additive document version gates the new primitive",()=>{
  const document={version:"1.8" as const,id:"doc",sourcePathId:"path",scenes:[{id:"scene",source,blocks:[explorer],readingOrder:[explorer.id]}]};
  validateSceneDocument(document);
  assert.throws(()=>validateSceneDocument({...document,version:"1.7"}),/1.8/);
});
test("invalid domains, missing tails and unsupported combinations rejected",()=>{
  for(const threshold of [{minimum:2,maximum:8,initial:4,step:.1},{minimum:0,maximum:7,initial:4,step:.1},{minimum:0,maximum:8,initial:9,step:.1},{minimum:0,maximum:8,initial:4,step:0}]) assert.throws(()=>validateObservationExplorer({...explorer,threshold}));
  assert.throws(()=>validateObservationExplorer({...explorer,view:"order"}));
});
test("compact multiple ECDFs keep independent denominators and version gating",()=>{
  const second={...explorer.series[0],id:"second",label:"Second sample",data:[{...explorer.series[0].data[0],id:"other",value:3}]};
  const chart={...explorer,compact:true,series:[...explorer.series,second]};
  validateObservationExplorer(chart);
  const text=observationExplorerFallback(chart);assert.match(text,/3\/7/);assert.match(text,/Second sample: at x = 4: 1\/1 = 1/);
  const doc={version:"1.11" as const,id:"doc",sourcePathId:"path",scenes:[{id:"s",source,blocks:[chart],readingOrder:[chart.id]}]};
  validateSceneDocument(doc);assert.throws(()=>validateSceneDocument({...doc,version:"1.10"}),/1.11/);
  assert.throws(()=>validateObservationExplorer({...chart,view:"count"}),/Compact|exactly one/);
  assert.throws(()=>validateObservationExplorer({...chart,threshold:{...explorer.threshold!,maximum:6}}));
});
test("static ECDFs retain fixed counts and reject interactive-card combinations",()=>{
  const chart={...explorer,compact:true,interactive:false};
  validateObservationExplorer(chart);assert.match(observationExplorerFallback(chart),/3\/7/);
  assert.throws(()=>validateObservationExplorer({...chart,compact:false}),/Static/);
  assert.throws(()=>validateObservationExplorer({...chart,interactive:"false" as never}),/boolean/);
  assert.throws(()=>validateObservationExplorer({...chart,view:"order"}),/ECDF/);
});
