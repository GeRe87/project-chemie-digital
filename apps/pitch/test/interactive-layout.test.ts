import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inferRevealCompositionPlan} from "../../../packages/renderer-reveal/src/composition-policy.ts";
import type {DiagramBlock,Scene} from "../../../packages/core/src/scene-document.ts";

const source=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");
test("shared formula legends do not inherit last-card spanning from infocards",()=>{
  const css=source("../src/teaching-primitives.css");
  assert.match(css,/\.formula-with-legend\s*>\s*\.definition-list\[data-symbol-legend="true"\]\s*>\s*\.definition-list-entry\s*\{\s*grid-column:\s*auto;\s*grid-row:\s*auto;/);
  assert.match(css,/\.definition-list:not\(\[data-symbol-legend="true"\]\)\s*>\s*\.definition-list-entry:last-child:nth-child\(odd\)/);
});
test("binary experiment stylesheet owns only component internals, not slide layouts or themes",()=>{
  const css=source("../src/binary-experiment.css");
  assert.doesNotMatch(css,/\.reveal|\bsection\b|\bh2\b|data-composition|!important|#[a-f\d]{3,8}\b/i);
  assert.doesNotMatch(css,/l5-|b01|b02|PFAS|repeat\((10|5),/i);
  assert.match(css,/--pcd-grid-columns,\s*auto-fit/);
  assert.match(css,/var\(--pcd-accent\)/);
  assert.doesNotMatch(css,/button\s*[:{,]/);
});
test("observation and binary views share one control and typography contract",()=>{
  const common=source("../src/interactive-primitives.css");
  assert.match(common,/\.pcd-interactive-controls button/);
  assert.match(common,/min-height: 44px/);
  assert.match(common,/:focus-visible/);
  assert.match(common,/container-type: inline-size/);
  assert.match(common,/--pcd-interactive-font-size: [\d.]+cqw/);
  for(const renderer of ["../../../packages/renderer-d3/src/binary-experiment.ts","../../../packages/renderer-d3/src/observation-explorer.ts"]){
    const text=source(renderer);assert.match(text,/pcd-interactive/);assert.match(text,/pcd-interactive-controls/);
  }
  const stage=source("../src/visual-stage-primitives.css");
  assert.match(stage,/data-interactive-surface="true"/);
  assert.doesNotMatch(stage,/binary-experiment|l5-b01|l5-b02/);
  const renderer=source("../../../packages/renderer-d3/src/binary-experiment.ts");
  assert.doesNotMatch(renderer,/PFAS|contaminat|concentration|l5-b01|l5-b02/);
});
test("adding a binary model does not introduce a new composition or a scene-specific layout",()=>{
  const provenance=[{resourceId:"urn:test"}];
  const diagram:DiagramBlock={id:"d",kind:"diagram",diagramType:"flow",label:"Decision",description:"Two outcomes",source:provenance,nodes:[{id:"a",label:"Input",source:provenance},{id:"b",label:"Decision",source:provenance}],edges:[{id:"ab",sourceNodeId:"a",targetNodeId:"b",label:"classify",source:provenance}]};
  const scene:Scene={id:"s",source:provenance,blocks:[{id:"h",kind:"prose",text:"Question",format:"plain",intent:{kind:"introduce"},source:provenance},diagram],readingOrder:["h","d"]};
  const model={id:"m",mode:"decision" as const,trialCount:1,positiveProbability:.2,seed:42,positiveLabel:"yes",negativeLabel:"no",unitLabel:"Unit",trialName:"Binary trial",source:provenance};
  const before=inferRevealCompositionPlan(scene);
  const after=inferRevealCompositionPlan({...scene,blocks:[scene.blocks[0]!,{...diagram,binaryExperiment:model}]});
  assert.deepEqual(after,before);
  assert.equal(after.kind,"visual-stage");
});

test("tall authored illustrations fit standard info-visual columns without identity selectors", () => {
  const css=source("../src/learning-stage-primitives.css");
  assert.match(css,/\[data-composition-profile="info-visual"\].*> \.media-reference img\s*\{[^}]*height: 100%;[^}]*object-fit: contain;/);
  assert.doesNotMatch(css,/rev-functions|rev-qq|path-level5-storyline/);
  assert.match(css,/\[data-composition-region-container="primary"\]:has\(> \.definition-list:not\(\[data-symbol-legend="true"\]\)\).*\.d3-chart-svg\s*\{\s*max-height: 24rem;/);
});
