import test from 'node:test';
import assert from 'node:assert/strict';
import {teachingReadouts} from '../src/distribution-experiment.ts';
import {runExperiment, experimentFallback, validateExperiment, type ExperimentBlock} from '../../core/src/distribution-experiment.ts';

function block():ExperimentBlock {
  const source = [{resourceId:'synthetic-data'}];
  return {
    id:'independent-anova', kind:'chart', chartType:'experiment', experimentKind:'anova-one-way',
    label:'Compare preparations', description:'Constructed independent preparations for teaching.', source,
    xAxis:{label:'Method'}, yAxis:{label:'Recovery',unit:'%'}, differenceUnit:'percentage points',
    parameters:[
      {id:'between',key:'betweenScale',label:'Between-group scale',value:1,minimum:0,maximum:3,step:.1,adjustable:true,source},
      {id:'within',key:'withinScale',label:'Within-group scale',value:1,minimum:0,maximum:3,step:.1,adjustable:true,source},
      {id:'view',key:'view',label:'View',value:0,minimum:0,maximum:2,step:1,adjustable:true,source},
    ],
    groups:[[93,95,94,92,96,94],[97,99,98,100,96,98],[94,93,92,95,91,93]].map((values,i)=>({
      id:`method-${i}`,label:`Method ${i}`,source,
      data:values.map((value,j)=>({id:`preparation-${i}-${j}`,value,source})),
    })),
  };
}

test('actual ANOVA execution projects view-specific readouts while retaining the complete identity ledger',()=>{
  const b=block();
  validateExperiment(b);
  const expected=[
    ['N','k','Grand mean (%)'],
    ['SS between (percentage points)²','SS within (percentage points)²','SS total (percentage points)²'],
    ['df between','df within','F','p-value'],
  ];
  const baseline=runExperiment(b);
  for(const view of [0,1,2]){
    const overrides={view,betweenScale:2,withinScale:.5};
    const result=runExperiment(b,overrides);
    const before=structuredClone(result);
    const shown=teachingReadouts(b,result,overrides);
    assert.deepEqual(shown.map(row=>row.label),expected[view]);
    assert.ok(shown.every(row=>result.readouts.includes(row)));
    assert.deepEqual(result,before);
    assert.deepEqual(result.readouts,runExperiment(b,{...overrides,view:0}).readouts);
    const ledger=new Map(result.readouts.map(row=>[row.label,row.value]));
    for(const group of b.groups!)for(const observation of group.data){
      assert.equal(ledger.get(`${observation.id}: original (%)`),observation.value);
      assert.equal(typeof ledger.get(`${observation.id}: current (%)`),'number');
    }
    assert.equal(result.readouts.filter(row=>row.label.endsWith(': original (%)')).length,18);
    assert.equal(result.readouts.filter(row=>row.label.endsWith(': current (%)')).length,18);
  }
  assert.deepEqual(teachingReadouts(b,baseline).map(row=>row.label),expected[0]);
  const authoredView={...b,parameters:b.parameters.map(p=>p.key==='view'?{...p,value:1}:p)};
  assert.deepEqual(teachingReadouts(authoredView,runExperiment(authoredView)).map(row=>row.label),expected[1]);
  assert.deepEqual(teachingReadouts(authoredView,runExperiment(authoredView,{view:2}),{view:2}).map(row=>row.label),expected[2]);
  const fallback=experimentFallback(b);
  for(const group of b.groups!)for(const observation of group.data){
    assert.ok(fallback.includes(`${observation.id}: original (%): ${observation.value}`));
    assert.ok(fallback.includes(`${observation.id}: current (%): ${observation.value}`));
  }
  assert.deepEqual(runExperiment(b),baseline);
});

test('legacy execution and default readout presentation remain unchanged',()=>{
  const source=[{resourceId:'synthetic-data'}];
  const b:ExperimentBlock={
    id:'legacy-means',kind:'chart',chartType:'experiment',experimentKind:'means',
    label:'Means',description:'Independent Normal results.',source,
    xAxis:{label:'Concentration'},yAxis:{label:'Density'},
    parameters:[['mu',10],['sigma',2],['n',4]].map(([key,value])=>({
      id:String(key),key:String(key),label:String(key),value:Number(value),minimum:0,maximum:100,step:1,adjustable:true,source,
    })),
  };
  validateExperiment(b);
  const result=runExperiment(b);
  const before=structuredClone(result);
  assert.strictEqual(teachingReadouts(b,result),result.readouts);
  assert.deepEqual(result.readouts,[
    {label:'Individual SD (mg/L)',value:2},
    {label:'SD of the mean (mg/L)',value:1},
    {label:'Measurements per mean',value:4},
  ]);
  assert.deepEqual(result,before);
});
