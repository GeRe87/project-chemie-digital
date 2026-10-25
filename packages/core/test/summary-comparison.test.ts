import {test} from "node:test";
import assert from "node:assert/strict";
import {intervalCount,observationAtRank,reflectedObservations} from "../src/summary-comparison.ts";
import {validateObservationExplorer,observationExplorerFallback,type ObservationExplorerBlock} from "../src/observation-explorer.ts";
const data=[4,8,4,-2].map((value,i)=>({id:`o${i}`,value}));
test("closed interval counts preserve ties, endpoints and observation identities",()=>{
  assert.deepEqual(intervalCount(data,4,4),{ids:["o0","o2"],count:2,total:4,fraction:.5});
  assert.equal(intervalCount(data,-2,8).count,4);
  assert.equal(intervalCount(data,5,7).count,0);
  assert.throws(()=>intervalCount(data,7,5));assert.throws(()=>intervalCount(data,NaN,8));
});
test("one-based rank selection preserves stable tied identities",()=>{
  assert.equal(observationAtRank(data,1).value,-2);assert.equal(observationAtRank(data,2).id,"o0");assert.equal(observationAtRank(data,3).id,"o2");
  for(const r of [0,5,2.5,NaN])assert.throws(()=>observationAtRank(data,r));
});
test("reflection is deterministic, identity-preserving and involutive",()=>{
  const original=structuredClone(data),reflected=reflectedObservations(data,3);
  assert.deepEqual(reflected.map(d=>d.value),[2,-2,2,8]);
  assert.deepEqual(reflectedObservations(reflected,3),data);assert.deepEqual(data,original);
  assert.throws(()=>reflectedObservations(data,Infinity));
});

const source=[{resourceId:"urn:comparison-fixture"}];
function comparison():ObservationExplorerBlock {
  const result=(id:string,value:number)=>({id,label:id,value,unit:"u",propertyId:id,source});
  return {id:"comparison",kind:"chart",chartType:"observations",label:"Fixture",description:"Synthetic test fixture",source,
    xAxis:{label:"Value",unit:"u"},yAxis:{label:"Series"},view:"summary",
    series:["a","b"].map(id=>({id,datasetId:id,label:id,source,data:[0,2].map((value,i)=>({id:id+i,value,label:String(i),source})),summaries:{mean:result("mean",1),variance:result("variance",2),sd:result("sd",Math.sqrt(2))}})),
    comparison:{minimum:-2,maximum:4,interval:[0,2],details:[],stages:[
      {id:"known",label:"Known",prompt:"Compare",mode:"summaries",source},
      {id:"data",label:"Reveal",prompt:"Inspect",mode:"spread",allowOverlay:true,source},
      {id:"explore",label:"Explore",prompt:"Choose freely",mode:"topics",allowOverlay:true,source,investigations:[
        {id:"rank",label:"Position",prompt:"Inspect rank",mode:"rank",source},
        {id:"interval",label:"Interval",prompt:"Inspect interval",mode:"interval",source},
        {id:"mirror",label:"Symmetry",prompt:"Reflect",mode:"mirror",source},
      ]},
    ]}};
}
test("optional probes are separate from the ordered disclosure stages and survive fallback",()=>{
  const block=comparison();validateObservationExplorer(block);
  assert.equal(block.comparison!.stages.length,3);
  assert.equal(block.comparison!.stages[2].investigations!.length,3);
  assert.match(observationExplorerFallback(block),/Inspect interval/);
});
test("static distribution comparison accepts four series, but not a single series",()=>{
  const original=comparison();
  const block={...original,series:[...original.series,...original.series.map(s=>({...s,id:s.id+"-copy"}))],
    comparison:{...original.comparison!,stages:[{id:"overview",label:"Overview",prompt:"Compare shapes",mode:"distribution" as const,source}]}};
  validateObservationExplorer(block);
  assert.match(observationExplorerFallback(block),/Compare shapes/);
  assert.throws(()=>validateObservationExplorer({...block,series:block.series.slice(0,1)}),/at least two/);
});
test("invalid optional modes, duplicate identities and nested probes fail closed",()=>{
  for(const invalid of ["mode","duplicate","nested"]){
    const block=comparison();const probes=block.comparison!.stages[2].investigations! as any[];
    if(invalid==="mode")probes[0].mode="ecdf";
    if(invalid==="duplicate")probes[1].id=probes[0].id;
    if(invalid==="nested")probes[0].investigations=[probes[1]];
    assert.throws(()=>validateObservationExplorer(block),/investigation|Investigations/);
  }
});
