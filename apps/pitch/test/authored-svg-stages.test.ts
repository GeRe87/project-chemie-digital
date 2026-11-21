import test from 'node:test';
import assert from 'node:assert/strict';
import {svgStageContract} from '../src/authored-svg-stages.ts';
import {safeSvgAttribute} from '../src/teaching-svg-runtime.ts';
test('authored stages accept only a bounded inert drawing contract',()=>{
 assert.deepEqual(svgStageContract('3','cumulative'),{count:3,mode:'cumulative'});
 for(const count of [null,'','0','5','Infinity','2.5'])assert.equal(svgStageContract(count,'exclusive'),undefined);
 assert.equal(svgStageContract('2','arbitrary'),undefined);
 assert.equal(safeSvgAttribute('data-teaching-stage-count','4'),true);
 assert.equal(safeSvgAttribute('data-teaching-stage-count','40'),false);
 assert.equal(safeSvgAttribute('data-teaching-stage-mode','cumulative'),true);
 assert.equal(safeSvgAttribute('onclick','doSomething()'),false);
});
