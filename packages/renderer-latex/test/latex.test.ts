import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderLatexScript,latexInline,latexMath,latexLabel,formatExperimentValue} from '../src/index.ts';
import {resolveScriptMaterialNumbers,type ThematicScript} from '../../core/src/thematic-script.ts';
import {scriptPdfFingerprintInput} from '../../core/src/script-pdf.ts';
import {runExperiment} from '../../core/src/distribution-experiment.ts';

const runtime=JSON.parse(readFileSync(new URL('../../../apps/pitch/public/authoring-level5-review-complete-runtime.json',import.meta.url),'utf8'));
const script:ThematicScript=runtime.thematicScripts[0];

test('experiment readouts suppress floating-point noise without losing small tails',()=>{
  assert.equal(formatExperimentValue(1.999999999999993),'2');
  assert.equal(formatExperimentValue(0.9772498680518206),'0.9772');
  assert.equal(formatExperimentValue(0.02275013194817947),'0.02275');
  assert.equal(formatExperimentValue(10.2),'10.2');
  assert.equal(formatExperimentValue(1.23456e-8),'1.23e-8');
  assert.equal(formatExperimentValue(0),'0');
  assert.equal(formatExperimentValue('95% interval'),'95% interval');
  const tex=renderLatexScript(script);
  const visible=tex.split('\n').filter(line=>!line.startsWith('%')).join('\n');
  assert.doesNotMatch(visible,/\\begin\{description\}|\\item\[Standardized distance\]|Model parameters\./u);
  assert.match(visible,/2\.275\\%/u);
  assert.match(visible,/97\.72\\%/u);
});

test('figure-specific numerical findings are authored caption prose, with full detail retained in source',()=>{
  const tex=renderLatexScript(script);
  const details=tex.split('\n').filter(line=>line.startsWith('% Full-precision experiment details: ')).map(line=>JSON.parse(line.slice('% Full-precision experiment details: '.length)));
  const experiments=script.sections.flatMap(section=>section.materials).flatMap(material=>material.blocks).filter(block=>block.kind==='chart'&&block.chartType==='experiment');
  assert.equal(details.length,experiments.length);
  for(const block of experiments){
    const result=runExperiment(block);
    const detail=details.find(detail=>detail.blockId===block.id);assert(detail);
    assert.deepEqual(detail.readouts,result.readouts,'Complete readouts remain recoverable at full precision');
    assert.deepEqual(detail.parameters,block.parameters.map(p=>({key:p.key,label:p.label,value:p.value})));
  }
  const comparison=script.sections.flatMap(section=>section.materials).find(material=>material.resourceId.endsWith('/p1-variance-compare'))!;
  const block=comparison.blocks[0]!;assert(block.kind==='chart'&&block.chartType==='experiment');
  const values=new Map(runExperiment(block).readouts.map(item=>[item.label,item.value]));
  for(const label of ['Theoretical relative SD','Comparison theoretical relative SD']){
    assert(comparison.caption!.includes((100*Number(values.get(label))).toFixed(2)+'%'));
  }
  assert(comparison.caption!.includes((100*Number(values.get('Relative SD of variance estimates'))).toFixed(2)+'%'));
});

test('R explanations use readable steps and code typography',()=>{
  const tex=renderLatexScript(script);
  assert.match(tex,/\\item \\textbf\{Choose the sample size\.\}/u);
  assert.match(tex,/\\texttt\{qnorm\}/u);
  assert.match(tex,/\\texttt\{\\%\\%\}/u);
  assert.match(tex,/\\textbf\{Check the counts\.\}/u);
});

test('formula legends have a consistent heading instead of internal entry titles',()=>{
  const tex=renderLatexScript(script);
  const legends=script.sections.flatMap(section=>section.materials)
    .filter(material=>material.blocks.some(block=>block.kind==='math'))
    .flatMap(material=>material.blocks.filter(block=>block.kind==='definition-list'));
  assert.equal((tex.match(/\\textbf\{Symbols\}/gu)??[]).length,legends.length);
  assert.doesNotMatch(tex,/\\textbf\{density and standardized argument\}/u);
  assert.doesNotMatch(tex,/\\textbf\{inverse CDF and decision threshold\}/u);
  assert.match(tex,/Standard-normal density per dimensionless/u);
  assert.match(tex,/Circle constant/u);
});

test('shared experiment threshold appears once in the figure caption',()=>{
  const tex=renderLatexScript(script);
  assert.match(tex,/Both panels use a concentration threshold of 10\.1 mg\/L/u);
  assert.doesNotMatch(tex,/Shared threshold: 10\.1/u);
  assert.doesNotMatch(tex,/\\item\[Shared threshold \(mg\/L\)\]/u);
});

test('real Level 5 LaTeX retains every caption, complete formula unit and R source',()=>{
  const before=JSON.stringify(script),tex=renderLatexScript(script);
  assert.equal(JSON.stringify(script),before);
  assert.match(tex,/\\documentclass\[11pt,a4paper\]/u);
  assert.equal((tex.match(/\\refstepcounter\{equation\}/gu)??[]).length,30);
  assert.equal((tex.match(/\\refstepcounter\{figure\}/gu)??[]).length,32);
  assert.equal((tex.match(/\\refstepcounter\{scripttable\}/gu)??[]).length,1);
  assert.equal((tex.match(/\\refstepcounter\{listing\}/gu)??[]).length,9);
  assert.doesNotMatch(tex,/\[\[ref:/u);
  assert.doesNotMatch(tex,/\\section\*\{Semantic source\}/u);
  for(const entry of resolveScriptMaterialNumbers(script)){
    assert(tex.includes(`\\label{${latexLabel(entry.material.id!)}}`));
    for(const block of entry.material.blocks){
      if(block.kind==='math')assert(tex.includes(block.expression),'formula source stays exact');
      if(block.kind==='code')assert(tex.includes(block.code),'R source stays exact');
    }
  }
  assert.match(tex,/\\begin\{longtable\}/u);
  assert.match(tex,/\\begin\{axis\}/u,'plots are real vector diagrams, not browser screenshots');
  assert.match(tex,/Individual nitrate result \(mg\/L\)/u);
  assert.match(tex,/Simulated density \(L\/mg\)/u);
  assert.doesNotMatch(tex,/Results: (?:20|50|100|1000)\./u);
  assert.match(tex,/The first 50 results from the same simulated sequence\./u);
  assert.match(tex,/The first 100 results from the same simulated sequence\./u);
  assert.match(tex,/The first 1,000 results from the same simulated sequence\./u);
});

test('TeX escapes prose, validates mathematical commands and protects literal code',()=>{
  assert.equal(latexInline('A&B_1 #5%'),String.raw`A\&B\_1 \#5\%`);
  assert.equal(latexInline('*****'),String.raw`\textbf{*}`);
  assert.match(latexInline(String.raw`\input{secret}`),/textbackslash/u);
  assert.equal(latexMath(String.raw`\varphi(z)=\frac{1}{\sqrt{2\pi}}`),String.raw`\varphi(z)=\frac{1}{\sqrt{2\pi}}`);
  for(const attack of [String.raw`\input{secret}`,String.raw`\directlua{os.execute('x')}`,String.raw`\begin{document}`,String.raw`^^5cinput{secret}`])assert.throws(()=>latexMath(attack));
  const bad=structuredClone(script);const code=bad.sections.flatMap(s=>s.materials).flatMap(m=>m.blocks).find(b=>b.kind==='code')!;
  (code as any).code=String.raw`\end{Verbatim}\input{secret}`;
  assert.throws(()=>renderLatexScript(bad),/verbatim/u);
});

test('reference labels survive reordering and freshness covers every semantic change',()=>{
  const changed={...script,sections:[...script.sections].reverse()};
  const first=script.sections[0]!.materials[0]!.id!;
  assert(renderLatexScript(changed).includes(latexLabel(first)));
  assert.notEqual(scriptPdfFingerprintInput(script),scriptPdfFingerprintInput(changed));
  const reordered=Object.fromEntries(Object.entries(script).reverse()) as unknown as ThematicScript;
  assert.equal(scriptPdfFingerprintInput(script),scriptPdfFingerprintInput(reordered));
});
