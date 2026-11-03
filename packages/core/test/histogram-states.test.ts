import {test} from "node:test";
import assert from "node:assert/strict";
import {validateHistogram,histogramBlockBins,histogramStaticFallback,type HistogramBlock} from "../src/histogram.ts";
const source=[{resourceId:"urn:counts"}];
const block:HistogramBlock={id:"h",kind:"chart",chartType:"histogram",label:"Saved experiment",description:"Not measurements",source,
 xAxis:{label:"Result",unit:"u"},yAxis:{label:"Density",unit:"1/u"},edges:[0,1,2],normalization:"density",data:[],binCounts:[1,1],
 states:[{id:"small",label:"2 draws",description:"Initial snapshot",source,binCounts:[1,1]},{id:"large",label:"10 draws",description:"Extended snapshot",source,binCounts:[6,4]}]};
test("authored histogram snapshots retain counts and unit-area density without fake raw data",()=>{
 validateHistogram(block);assert.equal(block.data.length,0);
 for(const state of block.states!){
  const bins=histogramBlockBins({...block,binCounts:state.binCounts});
  assert.equal(bins.reduce((n,b)=>n+b.count,0),state.binCounts.reduce((a,b)=>a+b,0));
  assert.equal(bins.reduce((a,b)=>a+b.height*(b.upper-b.lower),0),1);
 }
 assert.match(histogramStaticFallback(block),/10 draws\nExtended snapshot\nn=10\nCounts: 6, 4/);
});
test("invalid states, raw data, rebinning and a changed default fail closed",()=>{
 const states=block.states!;
 for(const invalid of [[],[states[0]],[states[0],states[0]],[states[0],{...states[1],binCounts:[-1,2]}],[states[0],{...states[1],binCounts:[1]}]]){
  assert.throws(()=>validateHistogram({...block,states:invalid}));
 }
 assert.throws(()=>validateHistogram({...block,binCounts:[2,0]}));
 assert.throws(()=>validateHistogram({...block,binAdjustment:{minimumWidth:.5,maximumWidth:1,widthStep:.5}}));
 assert.throws(()=>validateHistogram({...block,data:[{id:"x",value:1,source}]}));
});
