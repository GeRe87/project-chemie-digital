import {test} from "node:test";
import assert from "node:assert/strict";
import {mountSceneDocuments, type MinimalElement} from "../src/preview.ts";
import {inferRevealCompositionPlan} from "../../../packages/renderer-reveal/src/composition-policy.ts";
import {evaluateLectureContentBudget} from "../../../packages/renderer-reveal/src/lecture-readability.ts";
import {optionalWorkspaceBounds} from "../src/optional-material.ts";
import type {Scene, CodeBlock} from "../../../packages/core/src/scene-document.ts";

class Element implements MinimalElement {
  innerHTML=""; className=""; textContent:string|null=null;
  children:Element[]=[]; attrs=new Map<string,string>();
  readonly tag:string;
  constructor(tag:string) {this.tag=tag;}
  appendChild(child:MinimalElement) {this.children.push(child as Element);}
  setAttribute(name:string,value:string) {this.attrs.set(name,value);}
}
const source=[{resourceId:"urn:source"}];
const heading={id:"h",kind:"prose" as const,text:"An observation question",intent:{kind:"introduce" as const},source};
const answer={id:"a",kind:"prose" as const,text:"A visible answer without live R.",intent:{kind:"explain" as const},source};
const code:CodeBlock={id:"r",kind:"code",language:"r",code:"x <- 1\nprint(x)",fallback:"x <- 1\nprint(x)",editable:true,executable:true,source,disclosure:{order:2,mode:"optional"}};
const scene:Scene={id:"urn:unseen-scene",source,blocks:[heading,answer,code],readingOrder:["h","a","r"]};

test("optional R does not change the main composition or content budget",()=>{
  const main={...scene,blocks:[heading,answer],readingOrder:["h","a"]};
  assert.deepEqual(inferRevealCompositionPlan(scene),inferRevealCompositionPlan(main));
  assert.deepEqual(evaluateLectureContentBudget(scene),evaluateLectureContentBudget(main));
});
test("native details preserves the full R source, outside primary composition",()=>{
  const root=new Element("main");
  mountSceneDocuments({root,createElement:tag=>new Element(tag)},[{id:"doc",version:"1.0",sourcePathId:"urn:path",scenes:[scene]}]);
  const details=root.children[0]!.children.find(e=>e.tag==="details")!;
  assert.equal(details.className,"pcd-optional-material");
  assert.equal(details.children[0]!.textContent,"Experiment details / R");
  const content=details.children[1]!;
  assert.equal(content.children[0]!.attrs.get("data-code-block-id"),"r");
  assert.equal(content.children[0]!.children[0]!.children[0]!.textContent,code.fallback);
  const shell=content.children[0]!;
  assert.equal(shell.attrs.get("data-code-layout"),"split");
  const output=shell.children.find(child=>child.className==="code-result-pane")!;
  assert.ok(output);assert.equal(output.attrs.get("aria-label"),"R results");
  assert.equal(output.children[0]!.className,"code-output");
  assert.equal(root.children.length,1);
});

test("optional workspaces fit both the transformed slide and visible viewport without scaling text",()=>{
  for(const [rect,lw,lh,vw,vh] of [
    [{left:100,top:120,width:1440,height:900},1440,900,1731,1006],
    [{left:60,top:20,width:1080,height:675},1440,900,1280,720],
    [{left:0,top:-150,width:390,height:1000},390,1000,390,844],
  ] as const){
    const result=optionalWorkspaceBounds(rect,lw,lh,vw,vh)!;assert.ok(result);
    const sx=rect.width/lw,sy=rect.height/lh;
    const left=rect.left+result.left*sx,top=rect.top+result.top*sy;
    assert.ok(left>=8&&top>=8);assert.ok(left+result.width*sx<=vw-8+.001);assert.ok(top+result.height*sy<=vh-8+.001);
    assert.ok(result.left>=0&&result.top>=0);
  }
  assert.equal(optionalWorkspaceBounds({left:0,top:0,width:0,height:0},0,0,100,100),undefined);
  assert.equal(optionalWorkspaceBounds({left:0,top:0,width:Infinity,height:100},100,100,100,100),undefined);
});
