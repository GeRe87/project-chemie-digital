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

test('regression derivatives and coloured matrices survive the bounded math export',()=>{
  assert.equal(latexText('XᵀX and A⊙B'),String.raw`X\ensuremath{{}^{\mathsf T}}X and A\ensuremath{\odot}B`);
  for(const expression of [
    String.raw`\frac{\partial Q}{\partial\beta} = 2X^{\mathsf T}X\beta-2X^\top y`,
    String.raw`\textcolor{teal}{\begin{bmatrix}6&12\\12&28\end{bmatrix}}`,
    String.raw`\begin{array}{c|r}1&2\\3&4\end{array}`,
  ]) assert.equal(latexMath(expression),expression);
  for(const expression of [
    String.raw`\begin {document}`,
    String.raw`\begin{array}{p{10pt}}1\end{array}`,
    String.raw`\textcolor[HTML]{FFFFFF}{x}`,
  ]) assert.throws(()=>latexMath(expression),/Unsupported/);
});
