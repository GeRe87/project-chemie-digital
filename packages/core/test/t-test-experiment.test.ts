import test from 'node:test';
import assert from 'node:assert/strict';
import {runExperiment,validateExperiment,type ExperimentBlock} from '../src/distribution-experiment.ts';
import {studentCdf,studentPdf} from '../src/distribution-math.ts';

const source=[{resourceId:'ex:test-authoring',relationPath:'cd:numericValue',provenanceIds:['https://example.test/graph']}];
function experiment(view=0):ExperimentBlock{
  const values={view,n:6,mean:48.5,sd:2,reference:50,alpha:.05,direction:0,effect:.4,M:4000,seed:617};
  const bounds:Record<string,[number,number]>={view:[0,1],n:[3,40],mean:[47,53],sd:[1,6],reference:[1,50],alpha:[.001,.1],direction:[0,2],effect:[-.4,.4],M:[4000,4000],seed:[617,617]};
  return {id:'t-experiment',kind:'chart',chartType:'experiment',experimentKind:'t-test',source,label:'One-sample t-test',description:'Synthetic independent Normal preparation model',xAxis:{label:'t'},yAxis:{label:'Density'},parameters:Object.entries(values).map(([key,value])=>({id:key,key,label:key,value,minimum:bounds[key][0],maximum:bounds[key][1],step:.001,adjustable:true,source}))};
}
const read=(result:ReturnType<typeof runExperiment>,label:string)=>Number(result.readouts.find(r=>r.label===label)!.value);

test('QC t, df and two-sided tail follow the specified mean, SD and independent n',()=>{
  const block=experiment();validateExperiment(block);const result=runExperiment(block);
  const t=(48.5-50)/(2/Math.sqrt(6));
   assert.equal(read(result,'Observed t'),t);assert.equal(read(result,'ν'),5);
  assert.equal(read(result,'p-value'),2*(1-studentCdf(Math.abs(t),5)));
  assert.equal(read(runExperiment(block,{mean:50}),'p-value'),1);
  assert(read(runExperiment(block,{n:40}),'p-value')<read(result,'p-value'));
  assert(read(runExperiment(block,{sd:6}),'p-value')>read(result,'p-value'));
  assert.equal(read(runExperiment(block,{mean:51.5}),'p-value'),read(result,'p-value'));
});

test('tail shading uses the same density and starts exactly at the observed extremeness boundary',()=>{
  const result=runExperiment(experiment());
  const tails=result.panels[0].traces.filter(trace=>trace.style==='area');
  const t=read(result,'Observed t');assert.equal(tails.length,2);
  assert(Math.abs(tails[0].points.at(-1)!.x+Math.abs(t))<1e-12);assert(Math.abs(tails[1].points[0].x-Math.abs(t))<1e-12);
  for(const tail of tails)for(const point of tail.points)assert(Math.abs(point.y-studentPdf(point.x,5))<1e-14);
});

test('lower alpha increases misses for exactly the same simulated t statistics',()=>{
  const block=experiment(1),overrides={reference:1,mean:48.5,sd:1,n:10,direction:1,effect:.4};
  const results=[.05,.01,.001].map(alpha=>runExperiment(block,{...overrides,alpha}));
  assert.deepEqual(results[0],runExperiment(block,{...overrides,alpha:.05}));
  const betas=results.map(result=>read(result,'Simulated type II error (%)'));
  assert(betas[0]<betas[1]&&betas[1]<betas[2]);
  for(const [i,result] of results.entries()){
    assert.equal(read(result,'Worst-case type I error (%)'),[5,1,.1][i]);
    assert.equal(result.panels.length,1);
    assert.deepEqual(result.readouts.map(r=>r.label),['Worst-case type I error (%)','Simulated type II error (%)']);
    const cutoff=result.panels[0].markers![0].x;
    assert(Math.abs(1-studentCdf(cutoff,9)-[.05,.01,.001][i])<1e-10);
  }
});

test('one-sided probabilities respect contrast orientation and controls reject invalid science',()=>{
  const b=experiment();const upper=read(runExperiment(b,{direction:1}),'p-value'),lower=read(runExperiment(b,{direction:2}),'p-value');
  assert(Math.abs(upper+lower-1)<1e-14);assert(upper>.5&&lower<.5);
  assert.throws(()=>runExperiment(b,{direction:1.5}),/direction/);
  assert.throws(()=>runExperiment(b,{sd:0}),/bounds/);
  assert.throws(()=>runExperiment(b,{n:3.5}),/integer/);
  assert.throws(()=>runExperiment(b,{alpha:0}),/bounds/);
});

test('H₀ and specified H₁ densities stay fixed when alpha moves the cutoff',()=>{
 const b=experiment(1),settings={sd:1,n:10,direction:1,effect:.4};
 const a=runExperiment(b,{...settings,alpha:.05}),c=runExperiment(b,{...settings,alpha:.001});
 const reference=(r:typeof a,label:string)=>r.panels[0].traces.find(t=>t.label.startsWith(label))!;
 assert.deepEqual(reference(a,'H₀'),reference(c,'H₀'));
 assert.deepEqual(reference(a,'H₁'),reference(c,'H₁'));
 const integral=(points:typeof a.panels[0]['traces'][0]['points'])=>points.slice(1).reduce((sum,p,i)=>sum+(p.x-points[i].x)*(p.y+points[i].y)/2,0);
 assert(Math.abs(integral(reference(a,'H₁').points)-1)<.01);
 const beta=reference(a,'Type II');assert(Math.abs(integral(beta.points)-read(a,'Simulated type II error (%)')/100)<.025);
 const typeI=reference(a,'Type I');assert(Math.abs(integral(typeI.points)-.05)<.002);
 assert(Math.abs(typeI.points.at(-1)!.x-reference(a,'H₀').points.at(-1)!.x)<1e-12);
 assert(c.panels[0].markers![0].x>a.panels[0].markers![0].x);
});
