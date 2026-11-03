import {test} from "node:test";
import assert from "node:assert/strict";
import {binarySeriesAtStage,validateBinaryExperiment,type BinaryExperiment,type BinaryExperimentStage} from "../src/binary-experiment.ts";
const source=[{resourceId:"urn:authored"}];
const model:BinaryExperiment={id:"m",mode:"series",trialCount:10,positiveProbability:.2,seed:20261030,positiveLabel:"positive",negativeLabel:"negative",unitLabel:"Sample",trialName:"Bernoulli trial",source};
const stage=(seriesRun:number,revealLevel:number):BinaryExperimentStage=>({id:`s-${seriesRun}-${revealLevel}`,prompt:"Discuss this series.",revealLevel,seriesRun,source});
test("lecture snapshots replay the seeded series independently of navigation history",()=>{
  for(const [run,count] of [[1,1],[2,3],[3,0],[4,2],[5,0]]){
    const hidden=binarySeriesAtStage(model,stage(run!,0));assert.equal(hidden.outcomes.filter(Boolean).length,count);assert.equal(hidden.countVisible,false);assert.equal(hidden.collected.length,run!-1);
    const shown=binarySeriesAtStage(model,stage(run!,1));assert.equal(shown.countVisible,true);assert.equal(shown.collected.length,run!-1);
    const collected=binarySeriesAtStage(model,stage(run!,2));assert.equal(collected.collected.length,run);
    assert.deepEqual(binarySeriesAtStage(model,stage(1,0)),binarySeriesAtStage(model,stage(1,0)));
  }
  assert.deepEqual(binarySeriesAtStage(model,stage(0,0)).collected,[]);
  const final=binarySeriesAtStage(model,stage(3,2));binarySeriesAtStage(model,stage(1,0));
  assert.deepEqual(binarySeriesAtStage(model,stage(3,2)),final);
});
test("lecture configuration requires bounded snapshots, authored prompts and provenance",()=>{
  validateBinaryExperiment({...model,stages:[stage(0,0),stage(1,0)]});
  validateBinaryExperiment({...model,stages:[stage(1,2)]});
  for(const stages of [[],[stage(0,0),stage(0,0)],[stage(0,0),{...stage(1,0),prompt:""}],[stage(0,0),{...stage(1,0),source:[]}],[stage(0,0),stage(21,0)],[stage(0,0),{...stage(1,0),positiveProbability:.8}]])assert.throws(()=>validateBinaryExperiment({...model,stages}));
});
