import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSelfStudyRenderPlan,renderSelfStudyHtml,renderSelfStudyBlocks} from '../src/index.ts';
import {createRevealRenderPlan} from '../../renderer-reveal/src/index.ts';
import type {SceneDocument} from '../../core/src/scene-document.ts';

test('scientific experiments retain their computed initial results in both static adapters',()=>{
 const source=[{resourceId:'urn:experiment'}];
 const document:SceneDocument={version:'1.14',id:'document',sourcePathId:'urn:path',scenes:[{
  id:'scene',source,readingOrder:['chart'],blocks:[{
   id:'chart',kind:'chart',chartType:'experiment',experimentKind:'means',label:'Means and individual results',
   description:'Assumed independent normal readings',source,xAxis:{label:'Concentration'},yAxis:{label:'Density'},
   parameters:Object.entries({mu:10,sigma:.1,n:6}).map(([key,value])=>({id:`urn:${key}`,key,label:key,value,
    minimum:value,maximum:value,step:1,adjustable:false,source})),
  }],
 }]};
 const result=createSelfStudyRenderPlan(document);assert.deepEqual(result.diagnostics,[]);
 const html=renderSelfStudyHtml(result.plan!,{interactive:false});
 assert.match(html,/SD of the mean/);assert.match(html,/0\.040824829/);assert.match(html,/does not remove a constant bias/);
 const reveal=createRevealRenderPlan(document,{reducedMotion:true,interactionPolicy:'static'});
 assert.deepEqual(reveal.diagnostics,[]);assert.match(JSON.stringify(reveal.plan),/SD of the mean/);
  assert.ok(createSelfStudyRenderPlan({...document,version:'1.13'}).diagnostics.length);
  const blocks=document.scenes[0]!.blocks;
  assert.match(renderSelfStudyBlocks(blocks),/<figcaption><strong>Means and individual results<\/strong> Assumed independent normal readings<\/figcaption>/u);
  assert.doesNotMatch(renderSelfStudyBlocks(blocks,{captioned:true}),/<figcaption>/u,'An occurrence with its own authored caption does not repeat a chart title and description');
});
