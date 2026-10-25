import { test } from "node:test";
import assert from "node:assert/strict";
import { cumulativeCount, empiricalSteps, orderedObservations } from "../src/empirical-distribution.ts";

const data = [6,4,7,2,5,4,5].map((value,i) => ({id:`o${i}`,value}));
test("ordering preserves every identity and stable ties, without mutating input", () => {
  const before = structuredClone(data);
  assert.deepEqual(orderedObservations(data).map(d => d.value), [2,4,4,5,5,6,7]);
  assert.deepEqual(orderedObservations(data).filter(d=>d.value===4).map(d=>d.id), ["o1","o5"]);
  assert.deepEqual(data,before);
});
test("inclusive thresholds, ties, both tails and intermediate plateaus", () => {
  for (const [x,count] of [[0,0],[1.9999,0],[2,1],[3.9,1],[4,3],[4.1,3],[5,5],[6,6],[7,7],[8,7]]) {
    const result = cumulativeCount(data,x);
    assert.equal(result.count,count); assert.equal(result.total,7); assert.equal(result.fraction,count/7);
    assert.equal(result.includedIds.length,count);
  }
});
test("one jump per distinct value; jumps equal multiplicity/n", () => {
  const steps = empiricalSteps(data);
  assert.deepEqual(steps.map(s=>[s.value,s.count,s.multiplicity]), [[2,1,1],[4,3,2],[5,5,2],[6,6,1],[7,7,1]]);
  for (const s of steps) {
    assert.equal(cumulativeCount(data,s.value).fraction,s.right);
    assert.equal(cumulativeCount(data,s.value-1e-8).fraction,s.left);
    assert.equal(cumulativeCount(data,s.value+1e-8).fraction,s.right);
  }
});
test("singleton, all ties, negative values and zero", () => {
  assert.deepEqual(empiricalSteps([{id:"a",value:0}]),[{value:0,count:1,multiplicity:1,left:0,right:1}]);
  assert.equal(empiricalSteps([{id:"a",value:-2},{id:"b",value:-2}])[0].right,1);
  assert.equal(cumulativeCount([{id:"a",value:-2},{id:"b",value:0}],-1).fraction,.5);
});
test("invalid or ambiguous observations and thresholds fail closed", () => {
  for (const values of [[],[{id:"a",value:NaN}],[{id:"a",value:Infinity}],[{id:"a",value:1},{id:"a",value:2}]]) assert.throws(()=>orderedObservations(values));
  for (const x of [NaN,Infinity,-Infinity]) assert.throws(()=>cumulativeCount(data,x));
});
