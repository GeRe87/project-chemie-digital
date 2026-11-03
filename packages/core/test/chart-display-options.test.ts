import {test} from "node:test";
import assert from "node:assert/strict";
import {validateSceneDocument,type SceneDocument,type LineChartBlock} from "../src/scene-document.ts";
const source=[{resourceId:"urn:authored"}];
const line:LineChartBlock={id:"c",kind:"chart",chartType:"line",label:"Constructed model",description:"Not observations",source,xAxis:{label:"Input"},yAxis:{label:"Output"},series:[{id:"s",label:"Model",source,data:[{id:"a",x:0,y:0,source},{id:"b",x:1,y:1,source}]}]};
const document=(chart:LineChartBlock,version:SceneDocument["version"]="1.13"):SceneDocument=>({version,id:"doc",sourcePathId:"urn:path",scenes:[{id:"scene",source,blocks:[chart],readingOrder:[chart.id]}]});
test("complete annotated charts and explicit geometry are additive to the unpublished 1.13 contract",()=>{
  const chart:LineChartBlock={...line,presentation:"complete",interpolation:"step-after",showPoints:true,yDomain:[0,1]};
  validateSceneDocument(document(chart));assert.throws(()=>validateSceneDocument(document(chart,"1.12")),/1.13/);
  validateSceneDocument(document(line,"1.2"));
});
test("invalid line display options and clipped domains fail closed",()=>{
  for(const patch of [{presentation:"quiz"},{interpolation:"smooth"},{showPoints:1},{yDomain:[0,0]},{yDomain:[0,.5]},{yDomain:[0,Infinity]},{yDomain:[]},{yDomain:null},{yDomain:false}]){
    assert.throws(()=>validateSceneDocument(document({...line,...patch} as LineChartBlock)));
  }
});
