import test from 'node:test';
import assert from 'node:assert/strict';
import {pairwiseScores} from '../src/pairwise-score.ts';
import {runExperiment,validateExperiment,type ExperimentBlock} from '../src/distribution-experiment.ts';
const source=[{resourceId:'ex:observations',relationPath:'cd:numericValue',provenanceIds:['https://example.test/graph']}];
function block():ExperimentBlock{return {id:'pair-score',kind:'chart',chartType:'experiment',experimentKind:'pairwise-score',label:'Compare pairs',description:'- Compare original identities',source,xAxis:{label:'Comparison'},yAxis:{label:'Score'},parameters:[{id:'step',key:'step',label:'Completed comparisons',value:0,minimum:0,maximum:9,step:1,adjustable:true,source}],data:[1,2,2,2,3,4].map((x,i)=>({x,y:i<3?0:1,label:`${i<3?'X':'Y'}${i%3+1}`,source:[{...source[0],resourceId:`ex:observation-${i}`}]}))};}
test('all cross-group identities appear once and ties receive half credit',()=>{
 const b=block();validateExperiment(b);const scores=pairwiseScores(b);
 assert.equal(scores.length,9);assert.equal(new Set(scores.map(s=>s.x.source[0].resourceId+'/'+s.y.source[0].resourceId)).size,9);
 assert.equal(scores.filter(s=>s.score===.5).length,2);assert.equal(scores.at(-1)!.total,1);
 assert.deepEqual(scores.map(s=>s.score),[0,0,0,.5,0,0,.5,0,0]);
 for(let step=0;step<=9;step++)assert.equal(runExperiment(b,{step}).readouts[1].value,step?scores[step-1]!.total:0);
 assert.match(runExperiment(b).note,/9\. X3/); // Full static ledger is available before animation.
});
test('reverse orientation reverses wins and preserves ties',()=>{
 const b=block(),reversed={...b,data:b.data!.map(d=>({...d,y:1-d.y}))};
 assert.equal(pairwiseScores(reversed).at(-1)!.total,8);
});
test('invalid sources, groups, nonfinite observations and fractional states fail',()=>{
 const b=block();
 for(const data of [b.data!.map(d=>({...d,y:0})),b.data!.map(d=>({...d,x:NaN})),b.data!.map(d=>({...d,source:[]})),b.data!.map(d=>({...d,label:''}))])assert.throws(()=>validateExperiment({...b,data}));
 assert.throws(()=>runExperiment(b,{step:1.5}),/comparison step/);
 assert.throws(()=>runExperiment(b,{step:10}),/bounds/);
 for(const setting of [{minimum:-1},{maximum:8},{step:.5}])assert.throws(()=>validateExperiment({...b,parameters:b.parameters.map(p=>({...p,...setting}))}),/step bounds/);
});
