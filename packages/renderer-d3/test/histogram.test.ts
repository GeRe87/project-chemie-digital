import assert from "node:assert/strict";
import test from "node:test";
import type {HistogramBlock} from "../../core/src/histogram.ts";
import {mountD3Histogram} from "../src/histogram.ts";

class Element {
  readonly children:Element[]=[];
  readonly attributes=new Map<string,string>();
  readonly dataset:Record<string,string>={};
  className="";textContent="";
  readonly tagName:string;
  constructor(tagName:string){this.tagName=tagName;}
  readonly classList={add:(...names:string[])=>{this.className+=" "+names.join(" ");}};
  setAttribute(name:string,value:string){this.attributes.set(name,value);}
  append(...elements:Element[]){this.children.push(...elements);}
  replaceChildren(...elements:Element[]){this.children.splice(0,this.children.length,...elements);}
  addEventListener(){} removeEventListener(){}
  getBoundingClientRect(){return {width:800};}
  find(tag:string):Element[]{return [...(this.tagName===tag?[this]:[]),...this.children.flatMap(e=>e.find(tag))];}
}
const source=[{resourceId:"urn:fixture"}];
const base:HistogramBlock={id:"h",kind:"chart",chartType:"histogram",label:"Synthetic readings",description:"Bars: constructed data; line: specified reference",source,xAxis:{label:"Reading",unit:"mg/L"},yAxis:{label:"Density",unit:"L/mg"},normalization:"density",edges:[0,1,2],data:[{id:"a",value:.5,source},{id:"b",value:1.5,source}]};

test("histogram references use a shared non-clipping density scale and clean up on remount",()=>{
  const savedDocument=globalThis.document,savedElement=globalThis.HTMLElement;
  Object.assign(globalThis,{document:{createElement:(t:string)=>new Element(t),createElementNS:(_:string,t:string)=>new Element(t)},HTMLElement:Element});
  try{
    const host=new Element("div");
    const block:HistogramBlock={...base,curves:[{id:"reference",label:"Tall reference, not observations",source,data:[{id:"p0",x:0,y:5,source},{id:"p1",x:2,y:0,source}]}]};
    const component=mountD3Histogram(host,block);assert.ok("destroy" in component);
    assert.equal(host.find("figure")[0].dataset.referenceCurves,"true");
    const paths=host.find("path");assert.equal(paths.length,1);
    assert.equal(paths[0].attributes.get("data-reference-series"),"reference");
    assert.equal(paths[0].attributes.get("fill"),"none");
    const points=[...paths[0].attributes.get("d")!.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
    assert.equal(points.length,2);assert(points.every(([x,y])=>x>=85&&x<=765&&y>=45&&y<=405));
    assert.equal(host.find("rect").reduce((n,e)=>n+Number(e.attributes.get("data-count")),0),2);
    assert.equal(host.find("circle").length,0);
    assert.match(host.find("pre")[0].textContent,/Reference curve: Tall reference/);
    assert.match(host.find("pre")[0].textContent,/0: 5/);
    component.destroy();assert.equal(host.children.length,0);
    const published=mountD3Histogram(host,{...base,data:[],binCounts:[2000,3000]});assert.ok("destroy" in published);
    assert.equal(host.find("rect").reduce((n,e)=>n+Number(e.attributes.get("data-count")),0),5000);
    assert.match(host.find("pre")[0].textContent,/n=5000/);assert.match(host.find("pre")[0].textContent,/not reconstructed/);
    published.destroy();assert.equal(host.children.length,0);
    const plain=mountD3Histogram(host,base);assert.ok("destroy" in plain);
    assert.equal(host.find("path").length,0);assert.equal(host.find("figure")[0].dataset.referenceCurves,undefined);
    plain.destroy();assert.equal(host.children.length,0);
  }finally{Object.assign(globalThis,{document:savedDocument,HTMLElement:savedElement});}
});
