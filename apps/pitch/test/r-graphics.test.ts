import {test} from "node:test";
import assert from "node:assert/strict";
import {captureRCode} from "../src/code-runtime.ts";

test("R text/graphics capture preserves the source wrapper and purges protected objects",async()=>{
  let purged=0,script="",options:unknown;
  const image={close(){}} as ImageBitmap;
  class Shelter {
    async captureR(code:string,config:unknown){script=code;options=config;return {result:{async toArray(){return ["[1] 5"];}},output:[{type:"stderr",data:"message"}],images:[image]};}
    async purge(){purged++;}
  }
  const result=await captureRCode({Shelter},"plot(1:3)\nmedian(1:9)");
  assert.match(script,/print.eval=TRUE/);assert.match(script,/plot\(1:3\)/);
  assert.deepEqual(options,{captureGraphics:{width:720,height:420,bg:"white"}});
  assert.equal(result.text,"message\n[1] 5");assert.deepEqual(result.images,[image]);assert.equal(purged,1);
});
test("R failures purge the shelter and release images without publishing stale graphics",async()=>{
  let closed=0,purged=0;
  class Shelter {
    async captureR(){return {result:{async toArray(){throw new Error("R error");}},output:[],images:[{close(){closed++;}} as ImageBitmap]};}
    async purge(){purged++;}
  }
  await assert.rejects(captureRCode({Shelter},"stop('x')"),/R error/);
  assert.equal(closed,1);assert.equal(purged,1);
});
test("captured R conditions remain visible instead of being lost with graphics capture",async()=>{
  class Shelter {
    async captureR(){return {result:{async toArray(){return ["ok"];}},images:[],output:[{type:"warning",data:{async get(){return{async toString(){return "Check the input";}};}}}]};}
    async purge(){}
  }
  assert.equal((await captureRCode({Shelter},"warning('Check the input')")).text,"warning: Check the input\nok");
});
