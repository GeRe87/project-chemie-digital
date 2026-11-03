import {test} from "node:test";
import assert from "node:assert/strict";
import {binaryRandom,initialBinarySeries,runBinarySeries,revealBinaryCount,collectBinaryCount,validateBinaryExperiment,binaryExperimentFallback,type BinaryExperiment} from "../src/binary-experiment.ts";
import {validateSceneDocument,type SceneDocument} from "../src/scene-document.ts";

const source=[{resourceId:"urn:experiment"}];
const model:BinaryExperiment={id:"model",mode:"series",trialCount:10,positiveProbability:.2,seed:20261030,positiveLabel:"positive",negativeLabel:"negative",unitLabel:"Sample",trialName:"Bernoulli trial",source};
test("fixed PRNG vectors and repeated series are reproducible without fixed positive positions",()=>{
  assert.deepEqual(binaryRandom(0),{state:1831565813,value:.26642920868471265});
  let state=initialBinarySeries(model);const rows:string[]=[];
  for(let i=0;i<5;i++){
    state=runBinarySeries(model,state);rows.push(state.outcomes.map(Number).join(""));
    state=collectBinaryCount(revealBinaryCount(state));
  }
  assert.deepEqual(rows,["0000000010","1000001010","0000000000","0000001010","0000000000"]);
  assert.deepEqual(state.collected,[1,3,0,2,0]);
  assert.deepEqual(runBinarySeries(model,initialBinarySeries(model)).outcomes,state.outcomes.map((_,i)=>rows[0]![i]==="1"));
});
test("series, count and collection are separate immutable steps without duplicate counts",()=>{
  const initial=initialBinarySeries(model);
  assert.throws(()=>revealBinaryCount(initial));assert.throws(()=>collectBinaryCount(initial));
  const run=runBinarySeries(model,initial);
  assert.equal(run.run,1);assert.equal(run.outcomes.length,10);assert.equal(run.countVisible,false);assert.deepEqual(run.collected,[]);
  assert.throws(()=>runBinarySeries(model,run),/Collect/);
  const visible=revealBinaryCount(run);assert.deepEqual(visible.collected,[]);
  const collected=collectBinaryCount(visible);assert.deepEqual(collected.collected,[1]);
  assert.equal(collectBinaryCount(collected),collected);
  assert.equal(runBinarySeries(model,collected).countVisible,false);
  assert.equal(initial.run,0);assert.equal(initial.outcomes.length,0);
});
test("probability endpoints, new draws and invalid model bounds",()=>{
  for(const p of [0,1]){
    const m={...model,positiveProbability:p,seed:0};
    assert(runBinarySeries(m,initialBinarySeries(m)).outcomes.every(v=>v===(p===1)));
  }
  for(const patch of [{trialCount:0},{trialCount:101},{trialCount:1.5},{positiveProbability:NaN},{positiveProbability:-.1},{positiveProbability:1.1},{seed:-1},{seed:2**32},{seed:.5},{source:[]},{positiveLabel:"negative"},{mode:"other"}])assert.throws(()=>validateBinaryExperiment({...model,...patch} as BinaryExperiment));
  assert.throws(()=>validateBinaryExperiment({...model,mode:"decision"}));
  assert.match(binaryExperimentFallback(model),/Not real measurements/);
});
test("many seeded trials are consistent with the assumed mean, not forced to equal it",()=>{
  const m={...model,trialCount:100};let state=initialBinarySeries(m);
  for(let i=0;i<1000;i++)state=collectBinaryCount(revealBinaryCount(runBinarySeries(m,state)));
  const fraction=state.collected.reduce((a,b)=>a+b,0)/100000;
  assert(Math.abs(fraction-.2)<.005);
  assert(new Set(state.collected).size>10);
  assert.throws(()=>runBinarySeries(m,state),/1000/);
});
test("binary flow capability is additive to 1.12 and requires explicit valid provenance",()=>{
  const diagram={id:"d",kind:"diagram" as const,diagramType:"flow" as const,label:"Experiment",description:"Synthetic iid model",source,binaryExperiment:model,nodes:[{id:"a",label:"Samples",source},{id:"b",label:"Count",source}],edges:[{id:"ab",sourceNodeId:"a",targetNodeId:"b",label:"count",source}]};
  const document:SceneDocument={version:"1.13",id:"doc",sourcePathId:"path",scenes:[{id:"scene",source,blocks:[diagram],readingOrder:["d"]}]};
  validateSceneDocument(document);
  assert.throws(()=>validateSceneDocument({...document,version:"1.12"}),/1.13/);
  assert.throws(()=>validateSceneDocument({...document,scenes:[{...document.scenes[0]!,blocks:[{...diagram,binaryExperiment:{...model,positiveProbability:2}}]}]}),/probability/);
});
