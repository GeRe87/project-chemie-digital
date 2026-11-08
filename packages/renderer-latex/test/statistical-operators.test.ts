import test from 'node:test';
import assert from 'node:assert/strict';
import {latexMath,latexText} from '../src/index.ts';

test('bounded minimum and maximum operators preserve authored statistical notation',()=>{
  for(const expression of [String.raw`p=\min(1,mp_j)`,String.raw`G=\max_{1\le i\le n}|x_i-\bar x|/s`])
    assert.equal(latexMath(expression),expression);
  assert.throws(()=>latexMath(String.raw`\input{external}`),/unsafe/);
  assert.throws(()=>latexMath(String.raw`\write18{command}`),/unsafe/);
});

test('type-II error beta survives prose and symbol legends as a mathematical glyph',()=>{
  assert.equal(latexText('β'),String.raw`\ensuremath{\beta}`);
});
