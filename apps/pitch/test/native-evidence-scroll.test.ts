import {test} from "node:test";
import assert from "node:assert/strict";
import {canConsumeVerticalScroll} from "../src/presentation-step-runtime.ts";
test("long evidence consumes native scroll until its relevant edge, not the next slide",()=>{
  const box={scrollTop:0,clientHeight:500,scrollHeight:1200};
  assert.equal(canConsumeVerticalScroll(box,100),true);
  assert.equal(canConsumeVerticalScroll(box,-100),false);
  assert.equal(canConsumeVerticalScroll({...box,scrollTop:350},-100),true);
  assert.equal(canConsumeVerticalScroll({...box,scrollTop:700},100),false);
  assert.equal(canConsumeVerticalScroll({...box,scrollTop:700},-100),true);
  assert.equal(canConsumeVerticalScroll({...box,scrollHeight:500},100),false);
  assert.equal(canConsumeVerticalScroll(box,0),false);
});
