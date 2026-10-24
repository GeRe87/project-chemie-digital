import {test} from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {validateCanonicalRuntimeArtifact} from "../../../packages/core/src/canonical-runtime.ts";
import {createRevealRenderPlan} from "../../../packages/renderer-reveal/src/index.ts";
import {createSelfStudyRenderPlan, renderSelfStudyHtml} from "../../../packages/renderer-self-study/src/index.ts";
import {mountSceneDocuments, type MinimalElement} from "../src/preview.ts";
import {inferRevealCompositionPlan} from "../../../packages/renderer-reveal/src/composition-policy.ts";

class Element implements MinimalElement {
  innerHTML=""; className=""; textContent:string|null=null; children:Element[]=[]; attributes=new Map<string,string>();
  appendChild(node:MinimalElement){this.children.push(node as Element);}
  setAttribute(name:string,value:string){this.attributes.set(name,value);}
}
// Compile from canonical TriG without requiring or writing an ignored preview file.
const fullArtifact=JSON.parse(execFileSync("python",["-X","utf8","-c",`
import sys
sys.path.insert(0, 'scripts')
import generate_canonical_runtime as r
base='https://w3id.org/project-chemie-digital/'
artifact=r.build_artifact(r.CourseUnitPathSelectionRequest(
 offering_id=base+'resource/teaching-offering-chemometrics-applied-statistics',
 placement_id=base+'resource/unit-placement-chemometrics-quantiles-moments-shape',
 unit_id=base+'resource/learning-unit-quantiles-moments-shape',
 requested_path_id=base+'resource/path-chemometrics-level4-distribution-shape-lecture',
 requested_path_graph_id=base+'graph/paths/chemometrics-level4-distribution-shape-lecture'))
print(r.canonical_json(artifact))
`],{cwd:fileURLToPath(new URL("../../../",import.meta.url)),encoding:"utf8",maxBuffer:32*1024*1024}));
const artifact={...fullArtifact,sceneDocuments:fullArtifact.sceneDocuments.map(d=>({
  ...d,scenes:d.scenes.filter(s=>s.blocks.some(b=>b.chartType==="observations"&&b.view==="ecdf"))
}))};
test("opening projects one static four-shape comparison before any ECDF",()=>{
  const intro={...fullArtifact,sceneDocuments:fullArtifact.sceneDocuments.map(d=>({...d,scenes:d.scenes.slice(0,1)}))};
  validateCanonicalRuntimeArtifact(intro);
  const root=new Element();mountSceneDocuments({root,createElement:()=>new Element()},intro.sceneDocuments);
  assert.equal(root.children.length,1);
  const scene=intro.sceneDocuments[0].scenes[0];
  assert.deepEqual(scene.blocks.map(b=>b.kind),["prose","definition-list","table","list","chart"]);
  const composition=inferRevealCompositionPlan(scene);
  assert.equal(composition.profile,"scenario-data-visual");
  assert.deepEqual(composition.placements.map(p=>p.region),["heading","primary","primary","primary","secondary"]);
  const chart=scene.blocks.find(b=>b.kind==="chart");
  assert.equal(chart.comparison.stages.length,1);
  assert.equal(chart.comparison.stages[0].mode,"distribution");
  assert.equal(chart.series.length,4);
  assert(chart.series.every(s=>s.data.length===100));
  const plan=createSelfStudyRenderPlan(intro.sceneDocuments[0]);assert.deepEqual(plan.diagnostics,[]);
  assert.match(renderSelfStudyHtml(plan.plan!,{interactive:false}),/Sample variance = 100/);
  const visit=(node:Element):Element[]=>[node,...node.children.flatMap(visit)];
  const host=visit(root).find(n=>n.attributes.get("data-chart-renderer")==="dot")!;
  assert(host);assert.match(host.className,/retro-neon-chart-window/);
  assert.doesNotMatch(host.className,/observation-chart-host/);
  assert.equal(host.attributes.has("data-presentation-interactive"),false);
});
test("real compiled iteration projects through the production Pitch path without scene-ID rules",()=>{
  validateCanonicalRuntimeArtifact(artifact);
  const root=new Element();
  mountSceneDocuments({root,createElement:()=>new Element()},artifact.sceneDocuments);
   assert.equal(root.children.length,5);
  const visit=(node:Element):Element[]=>[node,...node.children.flatMap(visit)];
  const hosts=visit(root).filter(n=>n.attributes.get("data-chart-type")==="observations");
   assert.equal(hosts.length,5);
  for(const host of hosts){
     assert.equal(host.attributes.has("data-presentation-interactive"),false);
     assert.equal(host.attributes.has("tabindex"),false);
    assert.ok(host.attributes.get("data-resource-id"));
  }
});
test("renderer-neutral static adapters preserve observation and ECDF meaning",()=>{
  const document=artifact.sceneDocuments[0];
  const reveal=createRevealRenderPlan(document,{reducedMotion:true,interactionPolicy:"static"});
  assert.deepEqual(reveal.diagnostics,[]);
   assert.equal(reveal.plan?.sections.length,5);
  const study=createSelfStudyRenderPlan(document);
  assert.deepEqual(study.diagnostics,[]);
  const html=renderSelfStudyHtml(study.plan!,{interactive:false});
   assert.match(html,/left limit/); assert.match(html,/O7/); assert.match(html,/24\/50/);
});
test("notation and analytical case scenes use existing generic Variance compositions",()=>{
  const document=fullArtifact.sceneDocuments[0];
   assert.equal(document.version,"1.12");assert.equal(document.scenes.length,65);
   const increment=document.scenes.slice(1);assert.equal(increment.length,64);
  for(const scene of increment){
    const profile=inferRevealCompositionPlan(scene).profile;
    if(scene.blocks.some(b=>b.kind==="code"))assert.equal(profile,"prompt-code");
     else if(scene.blocks.some(b=>b.kind==="math"))assert.equal(profile,scene.blocks.length===3?"info-visual":"formula-deck");
    else if(scene.blocks.some(b=>b.kind==="table"))assert.equal(profile,"scenario-data-visual");
     else if(scene.blocks.some(b=>b.view==="moments"))assert.equal(profile,"diagram");
     else if(scene.blocks.some(b=>b.kind==="chart"))assert.equal(profile,"info-visual");
     else assert.equal(profile,undefined);
    const renamed={...scene,id:"urn:unrelated-scene",blocks:scene.blocks.map(b=>({...b,id:"urn:"+b.id})),readingOrder:scene.readingOrder.map(id=>"urn:"+id)};
    assert.equal(inferRevealCompositionPlan(renamed).profile,profile);
  }
  const study=createSelfStudyRenderPlan({...document,scenes:increment});assert.deepEqual(study.diagnostics,[]);
  const html=renderSelfStudyHtml(study.plan!,{interactive:false});
  assert.match(html,/fences=\[1.75, 7.75\]/);assert.match(html,/whiskers=\[98, 102\]/);assert.match(html,/geom_boxplot/);
  const root=new Element();mountSceneDocuments({root,createElement:()=>new Element()},[{...document,scenes:increment}]);
   assert.match(html,/heights=density/);assert.match(html,/cell colors and labels encode counts/);
   assert.equal(root.children.length,64);
});

test("full Level 4 script keeps authored prose, all scientific chart hosts, formulas and tables",()=>{
  const document=fullArtifact.sceneDocuments[0];assert(document.scenes.every(s=>s.narration));
  const plan=createSelfStudyRenderPlan(document);assert.deepEqual(plan.diagnostics,[]);
  const html=renderSelfStudyHtml(plan.plan!,{interactive:false,narrative:true});
  assert.equal((html.match(/class="self-study-narration"/g)||[]).length,65);
  assert.equal((html.match(/class="self-study-chart-host"/g)||[]).length,44);
  assert.equal((html.match(/class="self-study-formula-unit"/g)||[]).length,14);
  assert.equal((html.match(/class="self-study-moment-table"/g)||[]).length,4);
  assert.match(html,/probability-weighted/);assert.match(html,/Population skewness/);assert.match(html,/Population kurtosis/);
  assert(html.indexOf('Population skewness')<html.indexOf('Population kurtosis'));
});
