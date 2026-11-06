import test from 'node:test';
import assert from 'node:assert/strict';
import {renderThematicScript} from '../src/thematic-script.ts';
import {validateThematicScript,resolveScriptMaterialNumbers,resolveScriptSectionFlow,type ThematicScript} from '../../core/src/thematic-script.ts';
import type {SceneBlock} from '../../core/src/scene-document.ts';
import {renderSelfStudyBlocks} from '../src/index.ts';

const base='https://example.org/';
const source=[{resourceId:base+'text',provenanceIds:[base+'graph']}];

test('authored media captions stay with the media and remain escaped',()=>{
  const html=renderSelfStudyBlocks([{kind:'media-reference',id:'media',uri:'/image.svg',alternativeText:'Accessible image alternative',caption:'The image shows <script>unsafe</script>.',source}]);
  assert.match(html,/<figure class="self-study-media">/u);
  assert.match(html,/<figcaption>The image shows &lt;script&gt;unsafe&lt;\/script&gt;\.<\/figcaption>/u);
  assert.match(html,/Accessible image alternative/u);
});
const script:ThematicScript={version:'1.0',id:base+'script',pathId:base+'path',pathGraphId:base+'path-graph',language:'en',title:'A thematic script',source,sections:[
 {id:base+'b',title:'One coherent theme',body:'A model explains $X$.\n\nA second paragraph gives the reason, not a slide instruction. <script>unsafe</script>',source,relatedSceneIds:[],materials:[]},
 {id:base+'a',title:'Its consequence',body:'The consequence follows from the preceding argument.',source,relatedSceneIds:['ex:renamed-scene'],materials:[]},
]};
test('thematic prose has its own reading order, contents and safe inline math',()=>{
 const before=JSON.stringify(script);const html=renderThematicScript(script);
 assert(html.indexOf('One coherent theme')<html.indexOf('Its consequence'));
 assert.match(html,/pcd-script-contents/u);assert.match(html,/class="katex"/u);
 assert.match(html,/&lt;script&gt;/u);assert.doesNotMatch(html,/<script>/u);
 assert.doesNotMatch(html,/data-source-scene-id/u);
 assert.equal(JSON.stringify(script),before);
});
test('script contracts fail closed for ambiguity, malformed structures and versions',()=>{
 for(const mutate of [
  (s:any)=>s.version='9', (s:any)=>s.sections=[],
  (s:any)=>s.sections[1].id=s.sections[0].id,
  (s:any)=>s.sections[0].body='', (s:any)=>s.pathId='javascript:unsafe',
  (s:any)=>s.source=[], (s:any)=>s.sections[0].relatedSceneIds=['x','x'],
 ]){const value=structuredClone(script);mutate(value);assert.throws(()=>validateThematicScript(value));}
});

test('chapter titles and contents use the same safe inline symbols as prose',()=>{
 const value={...script,sections:script.sections.map((s,i)=>i===0?{...s,title:'$\\varphi$ describes density'}:s)};
 const html=renderThematicScript(value);
 assert.equal((html.match(/class="katex"/gu)??[]).length,3,'Symbol appears in contents, chapter heading and existing body');
 assert.doesNotMatch(html,/katex-error/u);
});

function referenceScript():ThematicScript {
 const materials=['one','two'].map(id=>({id:base+id,caption:`A labelled ${id} illustration <script>unsafe</script>.`,source,
  resourceId:base+'resource-'+id,blocks:[{kind:'media-reference',id:'block:'+id,uri:'/image.svg',mediaType:'image/svg+xml',alternativeText:'A diagram',source:[{resourceId:base+'resource-'+id}]} as SceneBlock]}));
 const table={id:base+'table',caption:'Observed values.',source,resourceId:base+'data',blocks:[{kind:'table',id:'table',caption:'Observed values',columns:[{id:'col',label:'Result',source}],rows:[{id:'row',source,cells:[{id:'cell',text:'1',source}]}],source:[{resourceId:base+'data'}]} as SceneBlock]};
 return {...script,version:'1.1',sections:[{...script.sections[0]!,body:`The first pattern is in [[ref:${base}one]]. **Compare [[ref:${base}two]]** with [[ref:${base}table]]. $X$ is a result.`,
  references:[...materials,table].map(m=>({targetMaterialId:m.id,source})),materials:[...materials,table]}]};
}

test('captioned figures and tables have separate counters, stable anchors and safe prose links',()=>{
 const value=referenceScript();const html=renderThematicScript(value);
 assert.deepEqual(resolveScriptMaterialNumbers(value).map(e=>[e.category,e.number]),[['figure',1],['figure',2],['table',1]]);
 assert.equal((html.match(/class="script-cross-reference"/gu)??[]).length,3);
 assert.match(html,/Fig\. 1<\/a>/u);assert.match(html,/Table 1<\/a>/u);
 assert.match(html,/<strong>Compare <a /u);
 assert.match(html,/&lt;script&gt;unsafe&lt;\/script&gt;/u);
 assert.doesNotMatch(html,/\[\[ref:|<script>/u);
 const reordered={...value,sections:value.sections.map(section=>({...section,materials:[...section.materials].reverse()}))};
 const next=renderThematicScript(reordered);
 const anchor=`script-material-${encodeURIComponent(value.id)}-${encodeURIComponent(base+'one')}`;
 assert(html.includes(`id="${anchor}"`));assert(next.includes(`id="${anchor}"`));
 assert.match(next,/Fig\. 2<\/a>/u,'reference updates after material order changes');
});

test('new script contracts reject missing captions, unresolved relations and foreign targets',()=>{
 for(const mutate of [
  (s:any)=>delete s.sections[0].materials[0].caption,
  (s:any)=>s.sections[0].references.pop(),
  (s:any)=>s.sections[0].body=s.sections[0].body.replace(base+'one',base+'foreign'),
  (s:any)=>s.sections[0].materials[0].id=s.sections[0].materials[1].id,
 ]){const value=referenceScript();mutate(value);assert.throws(()=>renderThematicScript(value));}
});

test('reference-looking code remains literal and cannot create an active script link',()=>{
 const value=referenceScript();(value.sections[0] as any).body+=` Code: \`[[ref:${base}foreign]]\`.`;
 const html=renderThematicScript(value);
 assert.match(html,/<code>\[\[ref:https:\/\/example.org\/foreign\]\]<\/code>/u);
 assert.equal((html.match(/class="script-cross-reference"/gu)??[]).length,3);
});

test('materials follow their first local prose reference in shared reading order',()=>{
  const value=referenceScript(),section=value.sections[0]!;
  const next={...section,body:`Explain the second illustration [[ref:${base}two]].\n\nThen compare [[ref:${base}one]] and [[ref:${base}table]].\n\nRefer back to [[ref:${base}two]].`};
  const flow=resolveScriptSectionFlow(next);
  assert.deepEqual(flow.map(item=>item.kind==='prose'?'prose':item.material.id),['prose',base+'two','prose',base+'one',base+'table','prose']);
  const html=renderThematicScript({...value,sections:[next]});
  assert(html.indexOf('Explain the second illustration')<html.indexOf('data-script-material-id="'+base+'two"'));
  assert(html.indexOf('data-script-material-id="'+base+'two"')<html.indexOf('Then compare'));
  assert.equal((html.match(/data-script-material-id="https:\/\/example.org\/two"/gu)??[]).length,1);
  assert.deepEqual(resolveScriptMaterialNumbers({...value,sections:[next]}).map(entry=>[entry.material.id,entry.number]),[[base+'two',1],[base+'one',2],[base+'table',1]]);
});
