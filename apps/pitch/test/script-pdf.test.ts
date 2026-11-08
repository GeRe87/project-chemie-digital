import test from 'node:test';
import assert from 'node:assert/strict';
import {loadScriptPdf,sha256} from '../src/script-pdf.ts';
import {SCRIPT_PDF_FORMAT,scriptPdfFingerprintInput} from '../../../packages/core/src/script-pdf.ts';
import type {ThematicScript} from '../../../packages/core/src/thematic-script.ts';
import {installNoNetworkGuard} from '../src/preview.ts';

const source=[{resourceId:'https://example.org/text',provenanceIds:['https://example.org/graph']}];
const script:ThematicScript={version:'1.1',id:'https://example.org/script',pathId:'https://example.org/path',pathGraphId:'https://example.org/path-graph',language:'en',title:'Script',source,
  sections:[{id:'https://example.org/chapter',title:'Chapter',body:'An authored explanation.',source,relatedSceneIds:[],references:[],materials:[]}]};
const base='https://example.org/course/authoring.html';

async function fixture(selected=script){
  const pdf=new TextEncoder().encode('%PDF-1.7\nTest fixture, not a compiler output.');
  const pdfHash=await sha256(pdf),texHash='a'.repeat(64);
  const manifest={version:'1.0',format:SCRIPT_PDF_FORMAT,documents:[{scriptId:script.id,pathId:script.pathId,pathGraphId:script.pathGraphId,
    sourceKey:await sha256(new TextEncoder().encode(scriptPdfFingerprintInput(selected))),pdf:pdfHash+'.pdf',pdfSha256:pdfHash,latex:texHash+'.tex',latexSha256:texHash}]};
  const fetcher=(async(input:unknown)=>String(input).endsWith('manifest.json')?new Response(JSON.stringify(manifest)):new Response(pdf)) as typeof fetch;
  return {pdf,manifest,fetcher};
}
test('PDF selection is exact-script/hash bound and honors a deployment base',async()=>{
  const value=await fixture();const result=await loadScriptPdf(script,value.fetcher,base);
  assert.match(result.href,/^https:\/\/example.org\/course\/script-pdf\/[a-f0-9]{64}\.pdf$/u);
  assert.match(result.sourceHref,/\.tex$/u);
});
test('missing, stale, foreign and corrupt PDFs fail instead of silently printing HTML',async()=>{
  await assert.rejects(loadScriptPdf(script,(async()=>new Response('',{status:404})) as typeof fetch,base),/No generated/u);
  for(const mutate of [
    (m:any)=>m.documents[0].sourceKey='b'.repeat(64),
    (m:any)=>m.documents[0].pathGraphId='https://example.org/foreign',
    (m:any)=>m.documents[0].pdf='../foreign.pdf',
    (m:any)=>m.documents.push({...m.documents[0]}),
  ]){const value=await fixture();mutate(value.manifest);await assert.rejects(loadScriptPdf(script,value.fetcher,base));}
  const value=await fixture();
  await assert.rejects(loadScriptPdf(script,(async(input:unknown)=>String(input).endsWith('manifest.json')?new Response(JSON.stringify(value.manifest)):new Response('%PDF-tampered')) as typeof fetch,base),/integrity/u);
});
test('network guard permits only bounded same-origin generated PDF reads',async()=>{
  const calls:string[]=[];const target={fetch:(async(input:unknown)=>{calls.push(String(input));return new Response('ok');}) as typeof fetch};
  const restore=installNoNetworkGuard(target,base);
  try{
    await target.fetch('https://example.org/course/script-pdf/manifest.json');
    await target.fetch('https://example.org/course/script-pdf/'+'a'.repeat(64)+'.pdf');
    for(const url of ['https://foreign.org/course/script-pdf/manifest.json','https://example.org/course/script-pdf/arbitrary.pdf','https://example.org/course/script-pdf/manifest.json?url=foreign'])assert.throws(()=>target.fetch(url));
    assert.throws(()=>target.fetch('https://example.org/course/script-pdf/manifest.json',{method:'POST'}));
    assert.equal(calls.length,2);
  }finally{restore();}
});

test('PDF availability also verifies the exact source bytes of embedded SVG figures',async()=>{
  const svg=new TextEncoder().encode('<svg viewBox="0 0 10 10"></svg>');
  const selected:ThematicScript={...script,sections:[{...script.sections[0]!,body:'The figure is shown in [[ref:https://example.org/material]].',references:[{targetMaterialId:'https://example.org/material',source}],materials:[{
    id:'https://example.org/material',caption:'The model.',resourceId:source[0]!.resourceId,source,blocks:[{kind:'media-reference',id:'image',uri:'/chart.svg',mediaType:'image/svg+xml',alternativeText:'Model figure',integrity:'sha256-'+await sha256(svg),source}]
  }]}]};
  const value=await fixture(selected);
  const fetcher=(async(input:unknown)=>String(input).endsWith('chart.svg')?new Response(svg):value.fetcher(input as RequestInfo)) as typeof fetch;
  await loadScriptPdf(selected,fetcher,base);
  await assert.rejects(loadScriptPdf(selected,(async(input:unknown)=>String(input).endsWith('chart.svg')?new Response('<svg>changed</svg>'):value.fetcher(input as RequestInfo)) as typeof fetch,base),/figure is missing or out of date/u);
});

test('PDF reading references remain fingerprint-bound links without remote fetches',async()=>{
  const selected:ThematicScript={...script,sections:[{...script.sections[0]!,body:'Further reading in [[ref:https://example.org/material]].',references:[{targetMaterialId:'https://example.org/material',source}],materials:[{
    id:'https://example.org/material',caption:'Further reading.',resourceId:source[0]!.resourceId,source,blocks:[{kind:'media-reference',id:'reading',uri:'https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm',mediaType:'text/html',alternativeText:'NIST',source}]
  }]}]};
  const value=await fixture(selected),calls:string[]=[];
  await loadScriptPdf(selected,(async(input:unknown)=>{calls.push(String(input));return value.fetcher(input as RequestInfo);}) as typeof fetch,base);
  assert.equal(calls.length,2);assert(calls.every(url=>url.startsWith('https://example.org/course/script-pdf/')));
  const changed=structuredClone(selected);changed.sections[0]!.materials[0]!.blocks[0]!.uri='https://example.org/other';
  await assert.rejects(loadScriptPdf(changed,value.fetcher,base),/out of date/u);
});
