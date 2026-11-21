import test from 'node:test';
import assert from 'node:assert/strict';
import {leastSquares,regressionRow} from '../src/linear-regression.ts';
import {runExperiment,validateExperiment,type ExperimentBlock} from '../src/distribution-experiment.ts';
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const xs=[0,1,2,3,4],ys=[1.1,2.8,5.2,6.9,9];
test('QR fits the observed drift and residuals are orthogonal to both columns',()=>{
 const fit=leastSquares(xs.map(x=>regressionRow(x,0)),ys);
 close(fit.coefficients[0],1.02);close(fit.coefficients[1],1.99);close(fit.sse,.099);
 close(fit.residuals.reduce((a,b)=>a+b,0),0);
 close(fit.residuals.reduce((a,b,i)=>a+b*xs[i],0),0);
 assert.ok(fit.sse<leastSquares(xs.map(()=>[1]),ys).sse);
});
test('quadratic and reciprocal bases recover known models without fitting uncertainty',()=>{
 const quadratic=leastSquares(xs.map(x=>regressionRow(x,1)),[20.98,22.34,25.2,29.66,35.82]);
 [21,.5,.8].forEach((v,i)=>close(quadratic.coefficients[i],v));close(quadratic.sse,.004);
 const reciprocal=leastSquares([1,2,4,8].map(x=>regressionRow(x,2)),[8.4,4.4,2.4,1.4]);
 close(reciprocal.coefficients[0],.4);close(reciprocal.coefficients[1],8);
});
test('invalid domains, insufficient or dependent columns fail explicitly',()=>{
 assert.throws(()=>leastSquares([[1,1],[1,1]],[1,2]),/independent/);
 assert.throws(()=>leastSquares([[1,2]],[1]),/n >= p/);
 assert.throws(()=>leastSquares([[1],[NaN]],[1,2]),/finite/);
 assert.throws(()=>leastSquares([[1],[2]],[1]),/finite/);
 assert.throws(()=>regressionRow(0,2),/positive/);
 assert.throws(()=>regressionRow(1,.5),/Invalid/);
});
const source=[{resourceId:'urn:data',relationPath:'cd:numericValue',graphId:'urn:graph'}];
function experiment(mode=0):ExperimentBlock {
 const values={basis:0,intercept:0,slope:1,quadratic:0,mode};
 return {id:'urn:lab',kind:'chart',chartType:'experiment',experimentKind:'linear-regression',label:'Drift',description:'Fit the observations',source,xAxis:{label:'Time (min)'},yAxis:{label:'Signal (mV)'},parameters:Object.entries(values).map(([key,value])=>({id:`urn:${key}`,key,label:key,value,minimum:-10,maximum:10,step:.01,adjustable:mode===0&&['intercept','slope'].includes(key),source})),data:xs.map((x,i)=>({x,y:ys[i],label:`Measurement ${i+1}`,source}))};
}
test('manual negative slopes and automatic least squares share one authored dataset',()=>{
 const b=experiment();validateExperiment(b);
 const manual=runExperiment(b),fitted=runExperiment(b,{intercept:1.02,slope:1.99});
 assert.ok(Number(fitted.readouts.at(-1)?.value)<Number(manual.readouts.at(-1)?.value));
 assert.doesNotThrow(()=>runExperiment(b,{slope:-1}));
 const auto=experiment(1);validateExperiment(auto);close(Number(runExperiment(auto).readouts.at(-1)?.value),.099);
 assert.equal(runExperiment(auto).panels[0].residualSegments?.length,5);
 assert.throws(()=>runExperiment(auto,{slope:2}),/fixed/);
 assert.throws(()=>validateExperiment({...auto,data:[]}),/finite/);
});
