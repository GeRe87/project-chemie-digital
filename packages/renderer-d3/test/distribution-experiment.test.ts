import test from 'node:test';
import assert from 'node:assert/strict';
import {teachingReadouts} from '../src/distribution-experiment.ts';
import type {ExperimentBlock, ExperimentResult} from '../../core/src/distribution-experiment.ts';

const source=[{resourceId:'urn:test'}];
function block(kind:ExperimentBlock['experimentKind'],values:Record<string,number>):ExperimentBlock {
 return {id:'unrelated-widget',kind:'chart',chartType:'experiment',experimentKind:kind,label:'Example',description:'Assumed model',source,
  xAxis:{label:'x'},yAxis:{label:'y'},parameters:Object.entries(values).map(([key,value])=>({id:key,key,label:key,value,minimum:0,maximum:10000,step:1,adjustable:true,source}))};
}
function result(labels:string[]):ExperimentResult {
 return {panels:[],readouts:labels.map((label,i)=>({label,value:i+.123456789})),note:'Complete model assumptions'};
}
test('lognormal forward/inverse display keeps only the question-specific results without changing calculations',()=>{
 const b=block('lognormal',{view:3});
 const r=result(['Threshold','Standardized distance','Standard-normal density at distance','Left probability','Upper probability','Median','Arithmetic expectation','Mode','Inverse threshold for selected rate','Selected upper-tail rate']);
 const before=structuredClone(r),shown=teachingReadouts(b,r);
 assert.deepEqual(shown.map(v=>v.label),['Threshold','Upper probability','Inverse threshold for selected rate','Selected upper-tail rate']);
 assert.deepEqual(r,before);assert.ok(shown.every(v=>r.readouts.includes(v)));
});
test('interval and design views retain their own results rather than unrelated significance diagnostics',()=>{
 const r=result(['Observed statistic','Residual degrees of freedom','Two-sided Student p','97.5th percentile','Comparison 97.5th percentile','Lower mean confidence limit (mg/L)','Upper mean confidence limit (mg/L)','CRM reference inside interval']);
 assert.deepEqual(teachingReadouts(block('student',{view:3}),r).map(v=>v.label),['Lower mean confidence limit (mg/L)','Upper mean confidence limit (mg/L)','CRM reference inside interval']);
 assert.deepEqual(teachingReadouts(block('student',{comparisonN:30}),r).map(v=>v.label),['Residual degrees of freedom','97.5th percentile','Comparison 97.5th percentile']);
});
test('one-trial Monte Carlo keeps the complete draw-transform sequence; repeated trials show uncertainty',()=>{
 const r=result(['Trials retained','Mean (mg/L)','Output SD (mg/L)','Central lower 95% (mg/L)','Central upper 95% (mg/L)','First uniform: signal','First absorbance','First result (mg/L)']);
 const b=block('dilution',{M:1});
 assert.equal(teachingReadouts(b,r).length,3);
 assert.equal(teachingReadouts(b,r,{M:10000}).length,4);
 assert.ok(teachingReadouts(b,r).every(v=>v.label.startsWith('First ')));
});
