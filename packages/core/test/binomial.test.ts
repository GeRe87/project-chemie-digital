import {test} from "node:test";
import assert from "node:assert/strict";
import {arrangementAt,arrangementCount,binomialMass,binomialMoments,specifiedSequenceProbability} from "../src/binomial.ts";

const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);
test("PFAS teaching probabilities and moments are deterministic",()=>{
  const mass=binomialMass(10,.2);
  near(mass[2]!, .301989888);near(mass[0]!, .1073741824);
  near(mass.slice(4).reduce((a,b)=>a+b,0), .1208738816);
  near(specifiedSequenceProbability(10,.2,2), .0067108864);
  const moments=binomialMoments(10,.2);near(moments.mean,2);near(moments.variance,1.6);near(moments.sd,Math.sqrt(1.6));
});
test("mode-centred mass is normalized, finite and symmetric at extremes",()=>{
  for(const n of [1,10,100])for(const p of [0,Number.MIN_VALUE,1e-12,.05,.2,.5,.95,1-1e-12,1]){
    const mass=binomialMass(n,p);assert.equal(mass.length,n+1);
    assert.ok(mass.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
    near(mass.reduce((a,b)=>a+b,0),1);
    const reflected=binomialMass(n,1-p).toReversed();mass.forEach((v,i)=>near(v,reflected[i]!));
    near(mass.reduce((sum,v,k)=>sum+k*v,0),n*p);
  }
  assert.deepEqual(binomialMass(2,0),[1,0,0]);assert.deepEqual(binomialMass(2,1),[0,0,1]);
});
test("arrangement unranking covers exactly 45 distinct pairs",()=>{
  assert.equal(arrangementCount(10,2),45);
  const rows=Array.from({length:45},(_,i)=>arrangementAt(10,2,i));
  assert.equal(new Set(rows.map(row=>row.join())).size,45);
  rows.forEach(row=>{assert.equal(row.length,10);assert.equal(row.filter(Boolean).length,2);});
  assert.deepEqual(arrangementAt(1,0,0),[false]);assert.deepEqual(arrangementAt(1,1,0),[true]);
  for(let n=1;n<=10;n++)for(let k=0;k<=n;k++){
    const count=arrangementCount(n,k),rows=Array.from({length:count},(_,i)=>arrangementAt(n,k,i));
    assert.equal(new Set(rows.map(r=>r.join())).size,count);rows.forEach(r=>assert.equal(r.filter(Boolean).length,k));
  }
});
test("invalid numerical model and arrangement inputs are rejected",()=>{
  for(const [n,p] of [[0,.2],[101,.2],[1.5,.2],[10,-.1],[10,1.1],[10,NaN],[Infinity,.2]])assert.throws(()=>binomialMass(n!,p!));
  for(const k of [-1,11,.5,NaN])assert.throws(()=>specifiedSequenceProbability(10,.2,k));
  assert.throws(()=>arrangementCount(21,2));assert.throws(()=>arrangementAt(10,2,45));assert.throws(()=>arrangementAt(10,2,-1));
});
