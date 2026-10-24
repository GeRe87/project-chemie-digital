import {test} from "node:test";
import assert from "node:assert/strict";
import {dotSwarm} from "../src/dot-swarm.ts";

test("dot packing preserves input and separates all observations deterministically",()=>{
  const xs=[1,1,1,2,3,4,8,12,12],before=[...xs];
  const ys=dotSwarm(xs,6.5);
  assert.deepEqual(xs,before);assert.deepEqual(ys,dotSwarm(xs,6.5));
  for(let i=0;i<xs.length;i++)for(let j=0;j<i;j++)assert((xs[i]-xs[j])**2+(ys[i]-ys[j])**2>=6.5**2-1e-9);
});
test("dot packing rejects non-finite coordinates or invalid separation",()=>{
  assert.throws(()=>dotSwarm([NaN],6));assert.throws(()=>dotSwarm([1],0));
});
