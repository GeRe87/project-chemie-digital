import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {checkScriptPdfs,buildScriptPdfs} from '../../../scripts/build_script_pdf.mts';
import {renderLatexScript} from '../src/index.ts';
import {SCRIPT_PDF_FORMAT,scriptPdfFingerprintInput} from '../../core/src/script-pdf.ts';

const hash=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
async function fixture(){
  const parent=resolve('.local/script-pdf-tests');await mkdir(parent,{recursive:true});
  const directory=await mkdtemp(join(parent,'case-'));
  const script=JSON.parse(await readFile(new URL('../../../apps/pitch/public/authoring-level5-review-complete-runtime.json',import.meta.url),'utf8')).thematicScripts[0];
  script.sections=[{...script.sections[0],body:'An independent artifact verification fixture.',references:[],materials:[]}];
  return {directory,script};
}
test('artifact verification rejects stale inputs and tampered TeX/PDF without a compiler',async()=>{
  const {directory,script}=await fixture();
  try{
    const tex=renderLatexScript(script),pdf=Buffer.from('%PDF-1.7\nSynthetic verification fixture.');
    const entry={scriptId:script.id,pathId:script.pathId,pathGraphId:script.pathGraphId,sourceKey:hash(scriptPdfFingerprintInput(script)),
      pdf:hash(pdf)+'.pdf',pdfSha256:hash(pdf),latex:hash(tex)+'.tex',latexSha256:hash(tex)};
    await writeFile(join(directory,entry.pdf),pdf);await writeFile(join(directory,entry.latex),tex);
    await writeFile(join(directory,'manifest.json'),JSON.stringify({version:'1.0',format:SCRIPT_PDF_FORMAT,documents:[entry]}));
    await checkScriptPdfs([script],directory);
    const stale=structuredClone(script);stale.sections[0].body+=' Changed explanation.';
    await assert.rejects(checkScriptPdfs([stale],directory),/stale/u);
    await writeFile(join(directory,entry.pdf),'%PDF-tampered');
    await assert.rejects(checkScriptPdfs([script],directory),/Changed/u);
    await writeFile(join(directory,entry.pdf),pdf);await writeFile(join(directory,entry.latex),'tampered');
    await assert.rejects(checkScriptPdfs([script],directory),/Changed/u);
  }finally{await rm(directory,{recursive:true});}
});
test('a missing compiler never publishes a success manifest',async()=>{
  const {directory,script}=await fixture();
  try{
    await assert.rejects(buildScriptPdfs([script],directory,join(directory,'missing-compiler')),/compiler failed/u);
    assert.equal(existsSync(join(directory,'manifest.json')),false);
  }finally{await rm(directory,{recursive:true});}
});
