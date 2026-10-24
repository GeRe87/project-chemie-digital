import {test} from "node:test";
import assert from "node:assert/strict";
import {histogramBins,histogramCells,histogramStaticFallback,validateHistogram,adjustedHistogramEdges,histogramRuleWidth,type HistogramBlock,type Histogram2DBlock} from "../src/histogram.ts";
import {validateSceneDocument} from "../src/scene-document.ts";
const source=[{resourceId:"urn:data"}];
test("adjusted grids retain all observations at both extremes and shifts",()=>{
  for(const width of [.5,.51,5,5.75,7.54,60])for(const shift of [-.5,-.05,0,.05,.5]){
    const edges=adjustedHistogramEdges(20,80,width,shift);
    assert(edges[0]<=20);assert(edges.at(-1)!>=80);
    assert.equal(histogramBins([20,40,60,80],edges).reduce((n,b)=>n+b.count,0),4);
  }
  const floating=adjustedHistogramEdges(.1,.9,.1,.1);assert(floating[0]<=.1);
  assert.throws(()=>adjustedHistogramEdges(0,1000,.01),/Too many/);
  assert.throws(()=>adjustedHistogramEdges(0,1,1,.6),/Invalid/);
});
test("named bin rules have explicit zero-spread behavior and reject unknown names",()=>{
  for(const rule of ["Freedman–Diaconis","Scott","Sturges"] as const){
    assert.equal(histogramRuleWidth([2,2,2],rule),null);
    assert(histogramRuleWidth([1,2,3,4,5],rule)!>0);
  }
  assert.throws(()=>histogramRuleWidth([1,2],"FD" as never),/Unknown/);
  assert.throws(()=>histogramRuleWidth([1,NaN],"Scott"));
});
test("bins retain ties and both endpoints exactly once",()=>{
  const bins=histogramBins([0,1,1,2,3,4],[0,1,2,3,4]);
  assert.deepEqual(bins.map(b=>b.count),[1,2,1,2]);assert.equal(bins.reduce((n,b)=>n+b.count,0),6);
});
test("unequal widths preserve sample fractions as areas, never raw count heights",()=>{
  const bins=histogramBins([0,1,2,3,4,5,6,7],[0,2,8],"density");
  assert.deepEqual(bins.map(b=>b.count),[2,6]);assert.equal(bins[0].height,.125);assert.equal(bins[1].height,.125);
  assert.equal(bins.reduce((n,b)=>n+b.height*(b.upper-b.lower),0),1);
  assert.throws(()=>histogramBins([0,1],[0,1,3],"count"),/density/);
  assert.equal(histogramBins([0,.001],[0,.01],"density")[0].height,100);
});
test("invalid edges, uncovered data and unsupported normalization fail closed",()=>{
  for(const edges of [[0],[0,0,1],[1,0],[0,Infinity],[0,NaN]])assert.throws(()=>histogramBins([0],edges));
  assert.throws(()=>histogramBins([], [0,1]));assert.throws(()=>histogramBins([NaN],[0,1]));
  assert.throws(()=>histogramBins([-1],[0,1]));assert.throws(()=>histogramBins([2],[0,1]));
  assert.throws(()=>histogramBins([0],[0,1],"bad" as never));
});
test("2D cells preserve original pairings rather than independently sorting axes",()=>{
  const data=[{value:0,y:0},{value:1,y:1},{value:2,y:2},{value:2,y:0}];
  const cells=histogramCells(data,[0,1,2],[0,1,2]);assert.deepEqual(cells.map(c=>c.count),[1,1,0,2]);
  assert.equal(cells.reduce((n,c)=>n+c.count,0),4);
  assert.throws(()=>histogramCells(data,[0,1,3],[0,1,2]),/equal-width/);
  assert.throws(()=>histogramCells([{value:0,y:3}],[0,1],[0,1]));
});
test("version 1.10 is additive and numerical alternatives remain available",()=>{
  const block:HistogramBlock={id:"h",kind:"chart",chartType:"histogram",label:"Test",description:"Synthetic",source,xAxis:{label:"Signal",unit:"a.u."},yAxis:{label:"Count"},edges:[0,1,2],normalization:"count",data:[{id:"o",value:1,source}]};
  const doc={version:"1.10" as const,id:"doc",sourcePathId:"path",scenes:[{id:"s",source,blocks:[block],readingOrder:[block.id]}]};
  validateSceneDocument(doc);assert.throws(()=>validateSceneDocument({...doc,version:"1.9"}),/1.10/);
  assert.match(histogramStaticFallback(block),/count=1/);assert.match(histogramStaticFallback(block),/final upper edge included/);
  assert.throws(()=>validateHistogram({...block,data:[...block.data,...block.data]}),/identities/);
  const paired:Histogram2DBlock={...block,chartType:"histogram2d",yEdges:[0,1,2],yAxis:{label:"Response",unit:"a.u."},data:[{id:"o",value:1,y:0,source}]};
  validateHistogram(paired);assert.match(histogramStaticFallback(paired),/y=\[0,1\]: count=1/);
});
