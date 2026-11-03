import test from 'node:test';
import assert from 'node:assert/strict';
import {normalPdf,normalCdf,normalQuantile,studentCdf,fCdf,quantile,gammaQ} from '../src/distribution-math.ts';
import {runExperiment,validateExperiment,type ExperimentBlock} from '../src/distribution-experiment.ts';
const close=(x:number,y:number,tolerance=1e-10)=>assert.ok(Math.abs(x-y)<tolerance,`${x} != ${y}`);
const source=[{resourceId:'urn:parameter',relationPath:'cd:numericValue',graphId:'urn:graph'}];
function dilution():ExperimentBlock {const values={M:10000,seed:20261101,signal:.200,signalSd:.003,slope:.095,intercept:.010,pipette:10,pipetteHalf:.02,flask:100,flaskHalf:.08,source:0};return{id:'experiment',kind:'chart',chartType:'experiment',experimentKind:'dilution',label:'Dilution',description:'Authored input models',source,xAxis:{label:'Concentration'},yAxis:{label:'Density'},parameters:Object.entries(values).map(([key,value])=>({id:`urn:${key}`,key,label:key,value,minimum:0,maximum:key==='seed'?2147483646:key==='M'?10000:1000,step:1,adjustable:true,source}))};}
test('scientific reference functions reproduce the independent review',()=>{
 close(normalPdf(2),.05399096651318806);close(normalCdf(2),.9772498680518208);close(10+.1*normalQuantile(.99),10.232634787404084);
 close(2*(1-studentCdf(Math.sqrt(6),5)),.05797277355754);close(2*(1-fCdf(9,5,5)),.03074944088508);close(quantile(x=>fCdf(x,5,5),.975),7.146381828732819);
 close(1-fCdf(6,1,5),2*(1-studentCdf(Math.sqrt(6),5)));close(gammaQ(2.5,6),.03478778050624185);
 const critical=quantile(x=>studentCdf(x,5),.975);close(10.1-critical*.1/Math.sqrt(6),9.995056436010401);
 for(const p of [.000001,.001,.025,.5,.975,.999,.999999])close(normalCdf(normalQuantile(p)),p,2e-14);
});
test('dilution replay preserves the exact seed and all three uncertainty modes',()=>{
 const block=dilution();validateExperiment(block);const result=runExperiment(block);const get=(label:string)=>Number(result.readouts.find(r=>r.label===label)!.value);
 close(get('Nominal result (mg/L)'),20);close(get('Mean (mg/L)'),19.9986223648564,1e-11);close(get('Output SD (mg/L)'),.31674478361247,1e-11);close(get('Central lower 95% (mg/L)'),19.37110491120053,1e-10);close(get('Central upper 95% (mg/L)'),20.62749774955301,1e-10);
 const sd=(source:number)=>Number(runExperiment(block,{source}).readouts.find(r=>r.label==='Output SD (mg/L)')!.value);assert.ok(sd(2)<sd(1));assert.ok(sd(1)<sd(0));assert.deepEqual(runExperiment(block),result);
 assert.throws(()=>runExperiment(block,{source:3}));assert.throws(()=>runExperiment(block,{M:10001}));assert.throws(()=>runExperiment(block,{seed:0}));assert.throws(()=>runExperiment(block,{unknown:1}));
 assert.equal(runExperiment(block,{M:1}).readouts.find(r=>r.label==='Output SD (mg/L)')!.value,'Not estimated from one trial');
});
test('assumption stress uses one data-near domain across stable, outlier and drift states',()=>{
 const values={n:6,sigma:.1,seed:20261102,mode:0,mu:10,outlierShift:.8,drift:.5};
 const block:ExperimentBlock={...dilution(),experimentKind:'stress',parameters:Object.entries(values).map(([key,value])=>({
  id:`urn:${key}`,key,label:key,value,minimum:0,maximum:2147483646,step:1,adjustable:key==='mode',source,
 }))};
 validateExperiment(block);const results=[0,1,2].map(mode=>runExperiment(block,{mode}));
 const domain=results[0].panels[0].yDomain!;
 assert.ok(domain[0]>9&&domain[1]<12,'Variation near ten must not be flattened against a zero baseline');
 for(const result of results){const p=result.panels[0];close(p.yDomain![0],domain[0]);close(p.yDomain![1],domain[1]);
  assert.ok(p.traces.every(t=>t.points.every(v=>v.y>=domain[0]&&v.y<=domain[1])));
 }
});

test('distribution-only Student and F views need no observed statistic or significance parameter',()=>{
 const model=(kind:ExperimentBlock['experimentKind'],values:Record<string,number>):ExperimentBlock=>({...dilution(),experimentKind:kind,
  parameters:Object.entries(values).map(([key,value])=>({id:key,key,label:key,value,minimum:value,maximum:value,step:1,adjustable:false,source}))});
 for(const b of [model('student',{n:6,M:1000,sigma:.1,seed:20261102,view:4}),
  model('student',{n:4,comparisonN:30,M:1000,sigma:.1,seed:20261102,view:4}),
  model('f-ratio',{nA:6,nB:10,M:1000,sigma:.1,seed:20261102,reverse:0,view:3})]){
  validateExperiment(b);const r=runExperiment(b);
  assert.ok(r.readouts.length>=2);assert.ok(r.panels[0].traces.length>=2);
  assert.equal(r.panels[0].markers,undefined);
  assert.ok(!r.readouts.some(v=>/Observed| p$|critical|bound|percentile/i.test(v.label)));
  assert.doesNotMatch(r.note,/reject|CRM|alpha|confidence/i);
 }
});
