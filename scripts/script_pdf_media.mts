/** Offline SVG -> vector PDF assets. The script itself is always typeset by LaTeX. */
import {readFile,writeFile,realpath} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import type {ThematicScript} from '../packages/core/src/thematic-script.ts';
import type {MediaReferenceBlock} from '../packages/core/src/scene-document.ts';
import {latexMediaFilename} from '../packages/renderer-latex/src/index.ts';

export const scriptMedia=(script:ThematicScript)=>script.sections.flatMap(section=>section.materials)
  .flatMap(material=>material.blocks).filter((block):block is MediaReferenceBlock=>block.kind==='media-reference'&&block.mediaType!=='text/html');
export async function readScriptSvg(block:MediaReferenceBlock,publicRoot:string){
  latexMediaFilename(block);
  if(!/^\/[a-zA-Z0-9_./-]+\.svg$/u.test(block.uri)||block.uri.split('/').includes('..'))throw new Error('Unsafe script SVG path');
  const root=await realpath(publicRoot),file=await realpath(resolve(root,'.'+block.uri));
  const rel=relative(root,file);if(rel.startsWith('..')||isAbsolute(rel))throw new Error('Script SVG leaves public root');
  const bytes=await readFile(file);
  if('sha256-'+createHash('sha256').update(bytes).digest('hex')!==block.integrity)throw new Error('Stale/tampered script SVG');
  if(bytes.length>2*1024*1024)throw new Error('Script SVG exceeds the bounded asset budget');
  validateScriptSvg(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  return bytes;
}
export function validateScriptSvg(svg:string){
  if(/<!|<\?|\son[a-z]+\s*=|@import|@font-face|\\/iu.test(svg))throw new Error('Active or external SVG content is forbidden');
  const tags=new Set(['svg','g','path','line','polyline','polygon','rect','circle','ellipse','text','tspan','title','desc','defs','marker','style','clipPath','linearGradient','radialGradient','stop','filter','feDropShadow','metadata']);
  for(const match of svg.matchAll(/<\/?([a-zA-Z][\w:-]*)\b/gu))if(!tags.has(match[1]!))throw new Error('Unsupported script SVG element: '+match[1]);
  for(const match of svg.matchAll(/(?:\b(?:xlink:)?href\s*=\s*["']([^"']*)["']|url\(\s*([^)]*)\))/giu)){
    if(!/^#[a-zA-Z0-9_-]+$/u.test((match[1]??match[2]!).replace(/["']/gu,'').trim()))throw new Error('External SVG references are forbidden');
  }
  const box=svg.match(/<svg\b[^>]*\bviewBox=["']([\d. -]+)["']/u)?.[1]?.trim().split(/\s+/u).map(Number);
  if(!box||box.length!==4||box.some(v=>!Number.isFinite(v))||box[2]!<=0||box[3]!<=0||box[2]!>10000||box[3]!>10000)throw new Error('Invalid SVG viewBox');
  return {width:box[2]!,height:box[3]!};
}
function browserExecutable(){
  const candidates=[process.env.SCRIPT_PDF_BROWSER,
    process.platform==='win32'?join(process.env['ProgramFiles(x86)']??'C:/Program Files (x86)','Microsoft/Edge/Application/msedge.exe'):undefined,
    '/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  const executable=candidates.find(candidate=>candidate&&existsSync(candidate));
  if(!executable)throw new Error('SVG export infrastructure requires Chromium/Edge; set SCRIPT_PDF_BROWSER');
  return executable;
}
export async function convertScriptSvg(bytes:Uint8Array,directory:string,index:number):Promise<Buffer>{
  const svg=new TextDecoder('utf-8',{fatal:true}).decode(bytes),{width,height}=validateScriptSvg(svg);
  const html=join(directory,`svg-${index}.html`),pdf=join(directory,`svg-${index}.pdf`);
  await writeFile(html,`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>@page{size:${width}px ${height}px;margin:0}html,body{margin:0;width:${width}px;height:${height}px}svg{display:block;width:100%;height:100%}</style></head><body>${svg}</body></html>`);
  // The CLI can write its PDF and then hang during browser shutdown on Windows.
  // Await the print protocol directly and close the owned browser explicitly.
  const browser=await chromium.launch({executablePath:browserExecutable(),headless:true,chromiumSandbox:true,timeout:60000,
    args:['--disable-background-networking','--disable-component-update','--force-color-profile=srgb']});
  try{
    const page=await browser.newPage();
    await page.route('**/*',route=>route.request().url().startsWith('file:')?route.continue():route.abort());
    await page.goto(pathToFileURL(html).href,{timeout:60000});
    let timer:ReturnType<typeof setTimeout>|undefined;
    try{
      await Promise.race([page.pdf({path:pdf,preferCSSPageSize:true,printBackground:true}),
        new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('SVG PDF export timed out')),60000);})]);
    }finally{clearTimeout(timer);}
  }finally{await browser.close();}
  const output=await readFile(pdf);if(output.subarray(0,5).toString()!=='%PDF-')throw new Error('SVG converter returned no PDF');
  return output;
}
