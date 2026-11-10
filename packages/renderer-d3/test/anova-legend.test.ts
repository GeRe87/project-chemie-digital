import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runExperiment,validateExperiment,type ExperimentBlock,type ExperimentPanel} from '../../core/src/distribution-experiment.ts';
import {experimentLegendEntries,experimentTraceColorIndex} from '../src/distribution-experiment.ts';

const source=[{resourceId:'anova-legend-fixture'}];
const groups=['Method A','Method B','Method C'].map((label,index)=>({
 id:`method-${index}`,label,source,
 data:[-3,-1,0,1,2,4].map((offset,i)=>({id:`method-${index}-observation-${i}`,value:10+index*4+offset,source})),
}));

function fixture(view:number):ExperimentBlock {
 return {
  kind:'chart',chartType:'experiment',id:'anova-legend',experimentKind:'anova-one-way',source,
  label:'Compare three methods',description:'Compare group means and within-group variation.',
  xAxis:{label:'Method',unit:'1'},yAxis:{label:'Response',unit:'mg/L'},differenceUnit:'mg/L',
  groups,
  parameters:[
   {id:'between',source,key:'betweenScale',label:'Between-group scale',value:1,minimum:0,maximum:3,step:0.1,adjustable:true},
   {id:'within',source,key:'withinScale',label:'Within-group scale',value:1,minimum:0,maximum:3,step:0.1,adjustable:true},
   {id:'view',source,key:'view',label:'View',value:view,minimum:0,maximum:2,step:1,adjustable:true},
  ],
 };
}

function groupColors(block:ExperimentBlock,panel:ExperimentPanel){
 return panel.traces.flatMap((trace,index)=>trace.style==='points'&&trace.emphasis!=='reference'
  ? [{label:trace.label,colorIndex:experimentTraceColorIndex(block,panel,index)}] : []);
}

test('ANOVA legends stay bounded in every view without changing numerical results',()=>{
 for(const view of [0,1,2]){
  const block=fixture(view);validateExperiment(block);const result=runExperiment(block);
  assert.ok(result.panels.length>0);
  const before=JSON.stringify(result);
  for(const panel of result.panels){
   const entries=experimentLegendEntries(block,panel);
   assert.ok(entries.length<=6);
   assert.equal(entries.filter(entry=>entry.label==='Within-group residuals').length,view===1?1:0);
  }
  assert.equal(JSON.stringify(result),before);
  assert.equal(result.readouts.find(item=>item.label==='N')?.value,18);
  assert.equal(result.readouts.find(item=>item.label==='k')?.value,3);
 }
});

test('one neutral residual legend entry retains all 18 identified trajectories and coordinates',()=>{
 const block=fixture(1),result=runExperiment(block),panel=result.panels[0];
 const residuals=panel.traces.filter(trace=>trace.style==='trajectory');
 assert.equal(residuals.length,18);
 const coordinates=residuals.map(trace=>trace.points.map(point=>({...point})));
 const labels=groups.flatMap(group=>group.data.map(row=>`${row.id}: fitted to observed (residual)`));
 assert.deepEqual(residuals.map(trace=>trace.label),labels);
 for(const trace of residuals){
  assert.equal(trace.emphasis,'reference');
  assert.equal(trace.points.length,2);
  assert.equal(trace.points[0].x,trace.points[1].x);
  assert.ok(trace.points.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)));
  assert.equal(experimentTraceColorIndex(block,panel,panel.traces.indexOf(trace)),undefined);
 }
 const entries=experimentLegendEntries(block,panel);
 assert.equal(entries.length,6);
 assert.deepEqual(entries[0],{label:'Within-group residuals',reference:true,colorIndex:undefined});
 assert.deepEqual(entries.slice(1).map(entry=>entry.label),['Method A','Method B','Method C','Current group means','Current grand mean']);
 assert.deepEqual(residuals.map(trace=>trace.points),coordinates);
 assert.deepEqual(panel.traces.filter(trace=>trace.style==='trajectory').map(trace=>trace.label),labels);
 for(const group of groups)for(const row of group.data){
  assert.equal(result.readouts.find(item=>item.label===`${row.id}: current (mg/L)`)?.value,row.value);
 }
});

test('group palette slots agree between plotted traces and legends across views',()=>{
 const expected=groups.map((group,index)=>({label:group.label,colorIndex:index+1}));
 for(const view of [0,1]){
  const block=fixture(view),panel=runExperiment(block).panels[0];
  assert.deepEqual(groupColors(block,panel),expected);
  const entries=experimentLegendEntries(block,panel);
  assert.deepEqual(entries.filter(entry=>groups.some(group=>group.label===entry.label)).map(({label,colorIndex})=>({label,colorIndex})),expected);
  panel.traces.forEach((trace,index)=>{
   if(trace.emphasis==='reference')assert.equal(experimentTraceColorIndex(block,panel,index),undefined);
  });
 }
 const block=fixture(2),panel=runExperiment(block).panels[0];
 panel.traces.forEach((trace,index)=>{
  assert.equal(experimentTraceColorIndex(block,panel,index),trace.emphasis==='reference'?undefined:index%5+1);
 });
});

test('legacy legends retain every trajectory, original order and index-based colors',()=>{
 const actual=runExperiment(fixture(1)).panels[0];
 const panel:ExperimentPanel={...actual,traces:actual.traces.map((trace,index)=>index<18?{...trace,emphasis:undefined}:trace)};
 const block={experimentKind:'normal'} as const;
 const entries=experimentLegendEntries(block,panel);
 assert.equal(entries.length,panel.traces.length);
 assert.equal(entries.filter(entry=>entry.label==='Within-group residuals').length,0);
 assert.deepEqual(entries,panel.traces.map((trace,index)=>({
  label:trace.label,reference:trace.emphasis==='reference',
  colorIndex:trace.emphasis==='reference'?undefined:index%5+1,
 })));
 panel.traces.forEach((trace,index)=>{
  assert.equal(experimentTraceColorIndex(block,panel,index),trace.emphasis==='reference'?undefined:index%5+1);
 });
});
