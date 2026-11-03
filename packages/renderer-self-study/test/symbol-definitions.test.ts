import test from 'node:test';
import assert from 'node:assert/strict';
import type {SceneDocument} from '../../core/src/scene-document.ts';
import {createSelfStudyRenderPlan,renderSelfStudyHtml} from '../src/index.ts';

test('script and static views render the complete authored definition list once instead of brief plus full prose',()=>{
 const document:SceneDocument={version:'1.14',id:'ex:symbol-document',sourcePathId:'ex:symbol-path',scenes:[{
  id:'ex:symbol-scene',source:[{resourceId:'ex:symbol-scene'}],narration:'One short explanation.',readingOrder:['ex:legend'],blocks:[{
   kind:'definition-list',id:'ex:legend',emphasis:'supporting',source:[{resourceId:'ex:legend'}],entries:[{
    id:'ex:entry',term:'Variables and units',expression:'X,x',symbol:true,description:'Brief duplicate presentation wording.',
    explanation:'- **X**: Random result (mg/L).\n- **x**: Observed result (mg/L).\n\nCondition: independent observations.',
    source:[{resourceId:'ex:symbol',relationPath:'cd:presentationDefinition'},{resourceId:'ex:symbol',relationPath:'cd:body'}],
   }],
  }],
 }]};
 const result=createSelfStudyRenderPlan(document);assert.deepEqual(result.diagnostics,[]);assert(result.plan);
 const before=JSON.stringify(result.plan);
 for(const narrative of [false,true]){
  const html=renderSelfStudyHtml(result.plan,{interactive:false,narrative});
  assert.equal((html.match(/class="authored-symbol-definitions"/gu)??[]).length,1);
  assert.match(html,/<dt>X<\/dt><dd>Random result \(mg\/L\)/u);
  assert.match(html,/Condition: independent observations/u);
  assert.doesNotMatch(html,/Brief duplicate presentation wording/u);
 }
 assert.equal(JSON.stringify(result.plan),before,'Rendering must not mutate the semantic projection');
});
