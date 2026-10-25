import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {SceneDocument} from "../../../packages/core/src/scene-document.ts";
import {inferRevealCompositionPlan,resolveCodeFunctionLegendUnits} from "../../../packages/renderer-reveal/src/composition-policy.ts";
import {teachingTextMarkup} from "../src/teaching-text.ts";

const artifact=JSON.parse(readFileSync(new URL("../public/authoring-runtime.json",import.meta.url),"utf8")) as {sceneDocuments:SceneDocument[]};
const document=artifact.sceneDocuments[0]!;
const labs=document.scenes.filter(s=>s.blocks.some(b=>b.kind==="code"&&b.language==="r"));

test("every active Level 4 R lab uses the shared Variance prompt/code/glossary standard",()=>{
  assert.equal(document.scenes.length,65);
  assert.equal(labs.length,3);
  for(const scene of labs){
    assert.deepEqual(scene.blocks.map(b=>b.kind),["prose","prompt","code","definition-list"]);
    assert.equal(inferRevealCompositionPlan(scene).profile,"prompt-code");
    const units=resolveCodeFunctionLegendUnits(scene);
    assert.equal(units.length,1);
    assert(units[0]!.legend.entries.length>=15);
    assert(units[0]!.legend.entries.every(e=>e.description?.trim()));
    assert(units[0]!.legend.source.some(s=>s.relationPath==="dct:hasPart"&&units[0]!.code.source.some(c=>c.resourceId===s.resourceId)));
  }
});

test("each R lab task has normal prose, selective bold, task/question bullets and a highlight",()=>{
  for(const scene of labs){
    const prompt=scene.blocks.find(b=>b.kind==="prompt")!;
    if(prompt.kind!=="prompt")throw Error("Missing task");
    const html=teachingTextMarkup(prompt.prompt);
    assert.match(html,/<p>[^<]+<strong>/u);
    assert.equal((html.match(/<li /gu)??[]).length,3);
    assert.match(html,/data-marker-purpose="task"/u);
    assert.match(html,/data-marker-purpose="question"/u);
    assert.match(html,/pcd-marker-highlight/u);
    assert(!html.includes("•"),"Use semantic list items, not bullet glyphs in a paragraph");
  }
});

test("authored function boxes explain every function called in the initial R source",()=>{
  for(const scene of labs){
    const {code,legend}=resolveCodeFunctionLegendUnits(scene)[0]!;
    // Ignore strings/comments so quoted setup instructions and labels are not
    // mistaken for executed calls. This is a bounded authoring lint, not an R parser.
    const source=code.code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*/gu," ");
    const calls=new Set([...source.matchAll(/\b([A-Za-z][\w.]*(?:::[A-Za-z][\w.]*)?)\s*\(/gu)].map(m=>m[1]!));
    const terms=legend.entries.map(e=>e.term).join(" ");
    for(const name of calls)assert(terms.includes(name),`${scene.id}: missing explanation of ${name}`);
    assert(terms.includes("<-")&&terms.includes("[["),"Explain R selection and assignment syntax too");
  }
});
