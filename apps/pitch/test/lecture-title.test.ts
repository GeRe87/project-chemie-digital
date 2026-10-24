import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import type {CanonicalRuntimeArtifact} from "../../../packages/core/src/canonical-runtime.ts";
import type {SceneDocument} from "../../../packages/core/src/scene-document.ts";
import {hasAuthoredTitleSlide,prependLectureTitle,resolveLectureTitle} from "../src/lecture-title.ts";

const artifact=JSON.parse(readFileSync(new URL("../public/authoring-runtime.json",import.meta.url),"utf8")) as CanonicalRuntimeArtifact;
const document=artifact.sceneDocuments[0]!;
const bindings=artifact.sceneDocumentBindings!;

test("lecture title resolves existing authored labels through the exact graph/path binding",()=>{
  const before=JSON.stringify(artifact);
  const title=resolveLectureTitle(document,bindings,artifact.teachingOfferingDocuments);
  assert.equal(title?.title,"Quantiles & Statistical Moments");
  assert.equal(title?.course,"Chemometrics and Applied Statistics");
  assert.equal(title?.pathId,bindings[0]!.pathId);
  assert.equal(title?.graphId,bindings[0]!.pathGraphId);
  assert.equal(document.scenes.length,65,"metadata chrome is not a new scientific scene");
  assert.equal(JSON.stringify(artifact),before);
});

test("missing or mismatched path provenance does not invent a lecture title",()=>{
  assert.equal(resolveLectureTitle(document,[],artifact.teachingOfferingDocuments),undefined);
  assert.equal(resolveLectureTitle(document,bindings,[]),undefined);
  assert.equal(resolveLectureTitle(document,bindings.map(b=>({...b,pathGraphId:"https://example.test/other"})),artifact.teachingOfferingDocuments),undefined);
});

test("existing heading-only title slides are not duplicated",()=>{
  const source=[{resourceId:"fixture"}];
  const title:SceneDocument={...document,scenes:[{id:"title",source,blocks:[{id:"heading",kind:"prose",text:"Title",source,intent:{kind:"introduce"}}],readingOrder:["heading"]}]};
  assert.equal(hasAuthoredTitleSlide(title),true);
  assert.equal(hasAuthoredTitleSlide(document),false);
  assert.equal(hasAuthoredTitleSlide({...title,scenes:[]}),false);
  assert.equal(hasAuthoredTitleSlide({...title,scenes:[{...title.scenes[0]!,blocks:[{id:"text",kind:"prose",text:"Not an authored title",source}]}]}),false);
});

test("generated lecture title uses the shared heading-only layout without a course subtitle",()=>{
  class Element {
    id="";className="";textContent="";dataset:Record<string,string>={};
    children:Element[]=[];attributes=new Map<string,string>();parent?:Element;
    readonly tagName:string;
    constructor(tagName:string){this.tagName=tagName;}
    get ownerDocument(){return {createElement:(tag:string)=>new Element(tag)};}
    setAttribute(name:string,value:string){this.attributes.set(name,value);}
    append(...nodes:Element[]){for(const node of nodes){node.parent=this;this.children.push(node);}}
    before(node:Element){node.parent=this.parent;this.parent!.children.splice(this.parent!.children.indexOf(this),0,node);}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(node=>node!==this);}
  }
  const root=new Element("div"),first=new Element("section");
  first.dataset.sceneDocumentId=document.id;root.append(first);
  const title=resolveLectureTitle(document,bindings,artifact.teachingOfferingDocuments)!;
  const unmount=prependLectureTitle(root as unknown as HTMLElement,document,title);
  const cover=root.children[0]!;
  assert.equal(cover.dataset.composition,"stack");
  assert.equal(cover.dataset.compositionMainCount,"0");
  assert.equal(cover.children.length,1);
  assert.equal(cover.children[0]!.tagName,"h2");
  assert.equal(cover.children[0]!.dataset.compositionRegion,"heading");
  assert.equal(cover.children[0]!.textContent,"Quantiles & Statistical Moments");
  assert.equal(root.children[1],first);
  unmount();assert.deepEqual(root.children,[first]);
});
