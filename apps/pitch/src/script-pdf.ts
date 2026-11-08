import {SCRIPT_PDF_FORMAT,scriptPdfFingerprintInput} from '../../../packages/core/src/script-pdf.ts';
import type {ThematicScript} from '../../../packages/core/src/thematic-script.ts';
import {resolvePublicAssetUrl} from './public-asset-url.ts';

export async function sha256(data:Uint8Array):Promise<string>{
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(data)))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

/** Fail closed: a stale/missing/corrupt PDF never becomes a browser-print link. */
export async function loadScriptPdf(script:ThematicScript,fetcher:typeof fetch=fetch,baseHref?:string):Promise<{href:string;sourceHref:string;bundleHref?:string}>{
  const sourceKey=await sha256(new TextEncoder().encode(scriptPdfFingerprintInput(script)));
  const response=await fetcher(resolvePublicAssetUrl('/script-pdf/manifest.json',baseHref),{cache:'no-store'});
  if(!response.ok)throw new Error('No generated LaTeX PDF is available for this module.');
  const manifest=await response.json();
  if(manifest.version!=='1.0'||manifest.format!==SCRIPT_PDF_FORMAT||!Array.isArray(manifest.documents))throw new Error('Invalid LaTeX PDF manifest.');
  const matches=manifest.documents.filter((entry:Record<string,unknown>)=>entry.scriptId===script.id&&entry.pathId===script.pathId&&entry.pathGraphId===script.pathGraphId&&entry.sourceKey===sourceKey);
  if(matches.length!==1)throw new Error('The LaTeX PDF is missing or out of date. Rebuild it for the current script.');
  const entry=matches[0];
  for(const block of script.sections.flatMap(section=>section.materials).flatMap(material=>material.blocks).filter(block=>block.kind==='media-reference')){
    if(block.mediaType==='text/html'){
      if(!/^https:\/\/[^\s<>"\\{}\x00-\x20]+$/u.test(block.uri))throw new Error('Invalid reading reference.');
      const url=new URL(block.uri);if(url.username||url.password)throw new Error('Invalid reading reference.');
      continue; // Navigation is fingerprint-bound prose, not a fetched figure.
    }
    if(!/^\/[a-zA-Z0-9_./-]+\.svg$/u.test(block.uri)||block.uri.split('/').includes('..')||!/^sha256-[a-f0-9]{64}$/u.test(block.integrity??''))throw new Error('Invalid source-bound figure.');
    const asset=await fetcher(resolvePublicAssetUrl(block.uri,baseHref),{cache:'no-cache'});
    if(!asset.ok||'sha256-'+await sha256(new Uint8Array(await asset.arrayBuffer()))!==block.integrity)throw new Error('A script figure is missing or out of date. Rebuild the preview and PDF.');
  }
  if(typeof entry.pdfSha256!=='string'||!/^[a-f0-9]{64}$/u.test(entry.pdfSha256)||entry.pdf!==entry.pdfSha256+'.pdf'
      ||typeof entry.latexSha256!=='string'||!/^[a-f0-9]{64}$/u.test(entry.latexSha256)||entry.latex!==entry.latexSha256+'.tex')throw new Error('Unsafe LaTeX PDF artifact path.');
  const href=resolvePublicAssetUrl('/script-pdf/'+entry.pdf,baseHref);
  const pdf=await fetcher(href,{cache:'no-cache'});if(!pdf.ok)throw new Error('The generated LaTeX PDF file is missing.');
  const bytes=new Uint8Array(await pdf.arrayBuffer());
  if(new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-'||await sha256(bytes)!==entry.pdfSha256)throw new Error('The LaTeX PDF failed its integrity check.');
  if(entry.bundle!==undefined&&(!/^[a-f0-9]{64}$/u.test(entry.bundleSha256??'')||entry.bundle!==entry.bundleSha256+'.zip'))throw new Error('Unsafe LaTeX source bundle path.');
  return {href,sourceHref:resolvePublicAssetUrl('/script-pdf/'+entry.latex,baseHref),...(entry.bundle?{bundleHref:resolvePublicAssetUrl('/script-pdf/'+entry.bundle,baseHref)}:{})};
}
