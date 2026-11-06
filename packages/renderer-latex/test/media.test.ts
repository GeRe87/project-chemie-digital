import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readScriptSvg,validateScriptSvg} from '../../../scripts/script_pdf_media.mts';

const safe='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 530"><rect width="760" height="530"/><text x="20" y="30">Model</text></svg>';
test('offline SVG projection rejects active content and external resources',()=>{
  assert.deepEqual(validateScriptSvg(safe),{width:760,height:530});
  for(const unsafe of ['<script>alert(1)</script>','<image href="https://example.org/a.png"/>','<foreignObject/>','<rect onclick="evil()"/>','<style>@import "https://example.org";</style>','<style>rect{fill:url(https://example.org)}</style>','<!DOCTYPE svg SYSTEM "file:///secret">','<style>rect{fill:u\\72l(https://example.org)}</style>'])assert.throws(()=>validateScriptSvg(safe.replace('</svg>',unsafe+'</svg>')));
});
test('offline figures support passive local clips, gradients and shadows',()=>{
  const definitions='<defs><clipPath id="clip"><rect width="10" height="10"/></clipPath><linearGradient id="water"><stop offset="0" stop-color="#fff"/></linearGradient><filter id="shadow"><feDropShadow dx="1" dy="1"/></filter></defs><g clip-path="url(#clip)" filter="url(#shadow)"><rect width="10" height="10" fill="url(#water)"/></g><metadata>Authored schematic</metadata>';
  assert.deepEqual(validateScriptSvg(safe.replace('</svg>',definitions+'</svg>')),{width:760,height:530});
  assert.throws(()=>validateScriptSvg(safe.replace('</svg>','<filter><feImage href="https://example.org"/></filter></svg>')));
});
test('SVG source hashes and public-root boundaries are checked without a browser',async()=>{
  const parent=resolve('.local/script-pdf-tests');await mkdir(parent,{recursive:true});const directory=await mkdtemp(join(parent,'svg-'));
  const block={kind:'media-reference' as const,id:'image',uri:'/image.svg',mediaType:'image/svg+xml',integrity:'sha256-'+createHash('sha256').update(safe).digest('hex'),alternativeText:'Model',source:[{resourceId:'urn:image'}]};
  try{
    await writeFile(join(directory,'image.svg'),safe);
    assert.equal((await readScriptSvg(block,directory)).toString(),safe);
    await writeFile(join(directory,'image.svg'),safe+' ');
    await assert.rejects(readScriptSvg(block,directory),/Stale\/tampered/u);
    await assert.rejects(readScriptSvg({...block,uri:'/../secret.svg'},directory),/Unsafe/u);
  }finally{await rm(directory,{recursive:true});}
});
