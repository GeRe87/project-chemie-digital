import assert from "node:assert/strict";
import test from "node:test";
import type {SceneDocument} from "../../../packages/core/src/scene-document.ts";
import {hasAuthoredTitleSlide,prependLectureTitle} from "../src/lecture-title.ts";

const pathId = "ex:fixture-path";
const graphId = "graph:fixture";
const document = {
  id: "fixture-document", sourcePathId: pathId, source: [{resourceId: pathId}],
  scenes: [{id: "fixture-scene", blocks: [], readingOrder: [], source: [{resourceId: pathId}]}],
} as SceneDocument;
const title = {title: "Fixture lecture", course: "Fixture course", pathId, graphId};

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
  const unmount=prependLectureTitle(root as unknown as HTMLElement,document,title);
  const cover=root.children[0]!;
  assert.equal(cover.dataset.composition,"stack");
  assert.equal(cover.dataset.compositionMainCount,"0");
  assert.equal(cover.children.length,1);
  assert.equal(cover.children[0]!.tagName,"h2");
  assert.equal(cover.children[0]!.dataset.compositionRegion,"heading");
  assert.equal(cover.children[0]!.textContent,"Fixture lecture");
  assert.equal(root.children[1],first);
  unmount();assert.deepEqual(root.children,[first]);
});
