import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {renderLatexScript,latexText,latexMath} from '../src/index.ts';
import type {ThematicScript} from '../../core/src/thematic-script.ts';

test('percent units remain escaped while TeX comments stay forbidden',()=>{
  assert.equal(latexMath('100\\%'),'100\\%');
  assert.throws(()=>latexMath('100% comment'),/Unsafe/);
  assert.throws(()=>latexMath('100\\\\% comment'),/Unsafe/);
  assert.equal(latexMath('\\mathrm{\\mu g/L}'),'\\symup{\\mu}\\mathrm{g/L}');
});

test('all independently authored foundation scripts project through the shared LaTeX renderer',()=>{
  const scripts:ThematicScript[]=JSON.parse(execFileSync('python',['-X','utf8','-c',`
import sys,json
sys.path.insert(0,'scripts')
import generate_canonical_runtime as r
a=r.build_offering_artifact(r.EX+'teaching-offering-chemometrics-applied-statistics',snapshot_language='en')
print(json.dumps(a['thematicScripts'][:5]))
`],{cwd:fileURLToPath(new URL('../../../',import.meta.url)),encoding:'utf8',maxBuffer:32*1024*1024}));
  assert.equal(scripts.length,5);
  for(const script of scripts){
    const tex=renderLatexScript(script);
    assert.match(tex,/\\documentclass/u);
    assert.equal((tex.match(/\\section\{/gu)??[]).length,script.sections.length);
    for(const section of script.sections)for(const material of section.materials){
      assert(tex.includes(latexText(material.caption!))||tex.includes(material.id!));
      const block=material.blocks[0]!;
      if(block.kind==='math'&&block.derivation){
        for(const step of block.derivation.steps){
          assert(tex.includes(latexMath(step.from.expression)));
          assert(tex.includes(latexMath(step.to.expression)));
          assert(tex.includes(latexText(step.operation)));
        }
        for(const entry of block.derivation.legend)assert(tex.includes(latexText(entry.explanation??entry.description??'')));
      }
    }
  }
});
