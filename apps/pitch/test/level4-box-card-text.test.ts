import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {SceneDocument} from "../../../packages/core/src/scene-document.ts";
import {mountSceneDocuments,type MinimalElement} from "../src/preview.ts";
import {teachingTextMarkup} from "../src/teaching-text.ts";

class Element implements MinimalElement {
  innerHTML="";className="";textContent:string|null=null;children:Element[]=[];
  attributes=new Map<string,string>();
  appendChild(node:MinimalElement){this.children.push(node as Element);}
  setAttribute(name:string,value:string){this.attributes.set(name,value);}
}
const artifact=JSON.parse(readFileSync(new URL("../public/authoring-runtime.json",import.meta.url),"utf8")) as {sceneDocuments:SceneDocument[]};
const document=artifact.sceneDocuments[0]!;
const scenes=document.scenes.filter(s=>s.accessibility?.label?.startsWith("Boxplots:"));
const visit=(node:Element):Element[]=>[node,...node.children.flatMap(visit)];

test("all eight Boxplot explanation slides author a selective normal/bold/list/highlight hierarchy",()=>{
  assert.equal(scenes.length,8);
  for(const scene of scenes){
    const texts=scene.blocks.flatMap(b=>b.kind==="definition-list"?b.entries.map(e=>e.description??""):b.kind==="prose"&&b.intent?.kind!=="introduce"?[b.text]:[]);
    const html=texts.map(teachingTextMarkup).join("");
    assert.match(html,/<strong>/u);
    assert.match(html,/<ul class="teaching-points">/u);
    assert.equal((html.match(/pcd-marker-highlight--cyan/gu)??[]).length,1);
    assert(!texts.some(t=>t.includes("•")),"Use real list items, not bullet glyphs");
    for(const b of scene.blocks)if(b.kind==="prose"&&b.intent?.kind!=="introduce")assert.equal(b.format,"markdown");
  }
});

test("definition cards and coloured prose cards project real paragraphs, bullets and safe emphasis",()=>{
  const root=new Element();mountSceneDocuments({root,createElement:()=>new Element()},[{...document,scenes}]);
  const cards=visit(root).filter(e=>e.className==="definition-list-description");
  assert.equal(cards.length,3);
  for(const card of cards){
    assert.match(card.innerHTML,/<p>/u);assert.match(card.innerHTML,/<li /u);
    assert.match(card.innerHTML,/<strong>/u);assert.match(card.innerHTML,/pcd-marker-highlight/u);
  }
  const prose=visit(root).filter(e=>e.attributes.get("data-component-kind")==="info-surface");
  assert.equal(prose.length,15);
  assert.equal(prose.filter(e=>e.innerHTML.includes("<ul ")).length,7);
});
