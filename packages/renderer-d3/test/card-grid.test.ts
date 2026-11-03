import {test} from "node:test";
import assert from "node:assert/strict";
import {balancedCardColumns} from "../src/card-grid.ts";

test("card grids balance measured capacity instead of leaving a nine-plus-one row",()=>{
  assert.equal(balancedCardColumns(10,10),10);
  assert.equal(balancedCardColumns(10,9),5);
  assert.equal(balancedCardColumns(10,6),5);
  assert.equal(balancedCardColumns(10,5),5);
  assert.equal(balancedCardColumns(12,11),6);
  assert.equal(balancedCardColumns(8,6),4);
  assert.equal(balancedCardColumns(0,5),1);
  for(let count=1;count<=100;count++)for(let capacity=1;capacity<=20;capacity++){
    const columns=balancedCardColumns(count,capacity);
    assert(columns<=capacity);assert(columns<=count);
    assert.equal(Math.ceil(count/columns),Math.ceil(count/capacity));
  }
  assert.throws(()=>balancedCardColumns(-1,5));assert.throws(()=>balancedCardColumns(10,0));
});
