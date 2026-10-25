import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import type {SceneDocument} from "../../../packages/core/src/scene-document.ts";
import {createSelfStudyRenderPlan,renderSelfStudyHtml} from "../../../packages/renderer-self-study/src/index.ts";
import {createRevealRenderPlan} from "../../../packages/renderer-reveal/src/index.ts";

const forbidden=/\u2014|&#(?:8212|x2014);|&mdash;/iu;
const dataset=new URL("../../../ontology/dataset/",import.meta.url);

test("all Level 4 authored sources avoid em dashes, including inactive examples and source titles",()=>{
  const files=readdirSync(dataset).filter(name=>/level4.*\.trig$/iu.test(name));
  assert(files.length>10);
  for(const file of files)assert.doesNotMatch(readFileSync(new URL(file,dataset),"utf8"),forbidden,file);
  // A range is not a sentence separator and must not be rewritten as punctuation.
  assert.match(readFileSync(new URL("chemometrics-level4-histograms.trig",dataset),"utf8"),/0\.5–24\.5/u);
});

test("all 65 compiled scenes and lecture/script projections avoid em dashes",()=>{
  const artifact=JSON.parse(readFileSync(new URL("../public/authoring-runtime.json",import.meta.url),"utf8")) as {sceneDocuments:SceneDocument[]};
  const document=artifact.sceneDocuments[0]!;assert.equal(document.scenes.length,65);
  assert.doesNotMatch(JSON.stringify(document),forbidden);
  const study=createSelfStudyRenderPlan(document);assert(study.plan);
  assert.doesNotMatch(renderSelfStudyHtml(study.plan,{interactive:false,narrative:true}),forbidden);
  assert.doesNotMatch(JSON.stringify(createRevealRenderPlan(document)),forbidden);
});

test("shared presentation, graph, diagram and static-export text generators do not reinsert em dashes",()=>{
  const roots=["../src/","../../../packages/core/src/","../../../packages/renderer-reveal/src/","../../../packages/renderer-self-study/src/","../../../packages/renderer-d3/src/"];
  for(const relative of roots){
    const root=new URL(relative,import.meta.url);
    for(const name of readdirSync(root,{recursive:true})){
      if(!/\.(?:ts|css)$/u.test(String(name)))continue;
      const url=new URL(String(name).replaceAll("\\","/"),root);
      assert.doesNotMatch(readFileSync(url,"utf8"),forbidden,fileURLToPath(url));
    }
  }
  assert.doesNotMatch(readFileSync(new URL("../../../scripts/generate_canonical_runtime.py",import.meta.url),"utf8"),forbidden);
});
