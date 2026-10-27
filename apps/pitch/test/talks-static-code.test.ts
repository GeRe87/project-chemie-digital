import assert from "node:assert/strict";
import test from "node:test";
import {mountSceneDocuments, type MinimalElement} from "../src/preview.ts";
import type {SceneDocument} from "../../../packages/core/src/scene-document.ts";

class Element implements MinimalElement {
  className = "";
  textContent: string | null = null;
  innerHTML = "";
  children: Element[] = [];
  attributes = new Map<string,string>();
  appendChild(node: MinimalElement) { this.children.push(node as Element); }
  setAttribute(name: string, value: string) { this.attributes.set(name,value); }
}

test("static code is keyboard-scrollable without changing executable code fallback focus", () => {
  for (const executable of [false,true]) {
    const source = [{resourceId:"example:source"}];
    const document: SceneDocument = {version:"1.1",id:"example:document",sourcePathId:"example:path",scenes:[{
      id:"example:scene",source,readingOrder:["heading","code"],blocks:[
        {id:"heading",kind:"prose",text:"Semantic source",source,intent:{kind:"introduce"}},
        {id:"code",kind:"code",language:executable ? "r" : "trig",code:"example",fallback:"example",editable:false,executable,source},
      ],
    }]};
    const root = new Element();
    const dispose = mountSceneDocuments({root,createElement:()=>new Element()},[document]);
    const flatten = (element: Element): Element[] => [element,...element.children.flatMap(flatten)];
    const pre = flatten(root).find(element=>element.className==="code-static-fallback")!;
    assert.ok(pre);
    assert.equal(pre.attributes.get("tabindex"),executable ? undefined : "0");
    assert.equal(pre.attributes.get("data-presentation-interactive"),executable ? undefined : "true");
    assert.equal(pre.children[0]!.textContent,"example");
    dispose();
  }
});
