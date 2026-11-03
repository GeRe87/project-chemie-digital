import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSymbolDefinitions} from '../src/symbol-definitions.ts';

test('authored symbol rows render as paired definitions with conventions kept separate',()=>{
 const html=renderSymbolDefinitions('- **X**: Random result (mg/L).\n- **x**: Observed result (mg/L).\n\nCondition: independent observations.');
 assert(html);assert.equal((html.match(/class="authored-symbol-definition"/gu)??[]).length,2);
 assert.match(html,/<dt>X<\/dt><dd>Random result \(mg\/L\)\.<\/dd>/u);
 assert.match(html,/class="authored-symbol-conventions">Condition: independent observations\./u);
});
test('definitions support Greek symbols, stars and units without interpreting prose as mathematics',()=>{
 const html=renderSymbolDefinitions('- **σ**: Population SD (mg/L).\n- **x***: Chosen threshold (mg/L).\n- *****: Superscript star.');
 assert(html);assert.match(html,/<dt>x\*<\/dt>/u);assert.match(html,/<dt>\*<\/dt>/u);
 assert.match(renderSymbolDefinitions('- **$\\sigma_L$**: Log-scale SD.')!,/class="katex"/u);
 assert.match(renderSymbolDefinitions('- **version_1**: Plain text remains literal.')!,/<dt>version_1<\/dt>/u);
});
test('legacy prose is not guessed into definitions and all authored text is escaped',()=>{
 assert.equal(renderSymbolDefinitions('where x is a value and y is a result'),undefined);
 assert.equal(renderSymbolDefinitions('- **x**: Value\nUnstructured continuation'),undefined);
 const html=renderSymbolDefinitions('- **<x>**: <script>alert(1)</script>\n\nCondition: a < b.');
 assert(html);assert.doesNotMatch(html,/<script>/u);assert.match(html,/&lt;script&gt;/u);assert.match(html,/a &lt; b/u);
});

test('explicit inline mathematics works in symbol labels, meanings and conventions',()=>{
 const html=renderSymbolDefinitions('- **$Q_j$**: Scaled variance $\\frac{\\nu_j S_j^2}{\\sigma_j^2}$ (dimensionless).\n\nCondition: \\(n=6\\) independent observations.');
 assert(html);assert.equal((html.match(/class="katex"/gu)??[]).length,3);
 assert.match(html,/application\/x-tex/u);
 assert.doesNotMatch(html,/katex-error/u);
 assert.doesNotMatch(html,/\$Q_j\$/u);
 assert.match(html,/Scaled variance/u);
});
