/** Build-time only. Never invokes a compiler or network service from the browser. */
import {readFile,writeFile,mkdir,mkdtemp,rename} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import {renderLatexScript} from '../packages/renderer-latex/src/index.ts';
import {validateThematicScript,type ThematicScript} from '../packages/core/src/thematic-script.ts';
import {SCRIPT_PDF_FORMAT,scriptPdfFingerprintInput} from '../packages/core/src/script-pdf.ts';
import {scriptMedia,readScriptSvg,convertScriptSvg} from './script_pdf_media.mts';
import {latexMediaFilename} from '../packages/renderer-latex/src/index.ts';

const hash=(data:string|Uint8Array)=>createHash('sha256').update(data).digest('hex');
interface MediaAsset {uri:string;integrity:string;file:string;sha256:string;}
interface Entry {scriptId:string;pathId:string;pathGraphId:string;sourceKey:string;pdf:string;pdfSha256:string;latex:string;latexSha256:string;assets?:MediaAsset[];bundle?:string;bundleSha256?:string;}
interface Manifest {version:'1.0';format:string;documents:Entry[];}

export async function checkScriptPdfs(scripts:readonly ThematicScript[],directory:string,publicRoot=resolve('apps/pitch/public')):Promise<void>{
  if(!scripts.length)return;
  const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8')) as Manifest;
  if(manifest.version!=='1.0'||manifest.format!==SCRIPT_PDF_FORMAT||!Array.isArray(manifest.documents)||manifest.documents.length!==scripts.length)throw new Error('Script PDF manifest/version/scope mismatch');
  for(const script of scripts){
    const key=hash(scriptPdfFingerprintInput(script));
    const entries=manifest.documents.filter(entry=>entry.scriptId===script.id&&entry.pathId===script.pathId&&entry.pathGraphId===script.pathGraphId&&entry.sourceKey===key);
    if(entries.length!==1)throw new Error(`Missing/stale script PDF: ${script.id}`);
    const entry=entries[0]!;
    const media=scriptMedia(script);
    if((entry.assets??[]).length!==media.length)throw new Error('Missing script figure assets');
    for(const block of media){
      await readScriptSvg(block,publicRoot);
      const assets=(entry.assets??[]).filter(asset=>asset.uri===block.uri&&asset.integrity===block.integrity&&asset.file===latexMediaFilename(block));
      if(assets.length!==1)throw new Error('Missing/stale figure asset');
      if(hash(await readFile(join(directory,assets[0]!.file)))!==assets[0]!.sha256)throw new Error('Tampered figure PDF');
    }
    if(media.length){
      if(!/^[a-f0-9]{64}\.zip$/u.test(entry.bundle??'')||entry.bundle!==entry.bundleSha256+'.zip'||hash(await readFile(join(directory,entry.bundle!)))!==entry.bundleSha256)throw new Error('Missing/tampered LaTeX source bundle');
    }
    if(!/^[a-f0-9]{64}\.pdf$/u.test(entry.pdf)||!/^[a-f0-9]{64}\.tex$/u.test(entry.latex)
      ||entry.pdf!==entry.pdfSha256+'.pdf'||entry.latex!==entry.latexSha256+'.tex')throw new Error('Unsafe generated script filename');
    const pdf=await readFile(join(directory,entry.pdf));const tex=await readFile(join(directory,entry.latex));
    if(pdf.subarray(0,5).toString()!=='%PDF-'||hash(pdf)!==entry.pdfSha256||hash(tex)!==entry.latexSha256||tex.toString()!==renderLatexScript(script))throw new Error('Changed script PDF/LaTeX artifact');
  }
}

export async function buildScriptPdfs(scripts:readonly ThematicScript[],directory:string,compiler='lualatex',publicRoot=resolve('apps/pitch/public')):Promise<Manifest>{
  scripts.forEach(validateThematicScript);
  if(new Set(scripts.map(script=>script.id)).size!==scripts.length||new Set(scripts.map(script=>JSON.stringify([script.pathId,script.pathGraphId]))).size!==scripts.length)throw new Error('Duplicate script identity/path binding');
  await mkdir(directory,{recursive:true});
  let prior:Manifest|undefined;
  if(existsSync(join(directory,'manifest.json'))){
    prior=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8')) as Manifest;
    if(prior.version!=='1.0'||![SCRIPT_PDF_FORMAT,'latex-script-1.1','latex-script-1.0'].includes(prior.format))throw new Error('Unfamiliar output manifest; choose a dedicated output directory');
  }
  const manifest:Manifest={version:'1.0',format:SCRIPT_PDF_FORMAT,documents:[]};
  // Identical SVGs can belong to several Scripts. Reuse bytes produced in this
  // invocation: browser PDF metadata may differ between two conversions.
  const convertedAssets=new Map<string,Buffer>();
  for(const script of [...scripts].sort((a,b)=>a.id.localeCompare(b.id))){
    const tex=renderLatexScript(script);
    const parent=process.platform==='win32'&&process.env.LOCALAPPDATA?join(process.env.LOCALAPPDATA,'Temp','opencode'):resolve('.local/script-pdf-builds');
    await mkdir(parent,{recursive:true});const work=await mkdtemp(join(parent,'latex-script-'));
    const assets:MediaAsset[]=[];
    for(const [index,block] of scriptMedia(script).entries()){
      const svg=await readScriptSvg(block,publicRoot),file=latexMediaFilename(block);
      const cached=prior?.documents.flatMap(entry=>entry.assets??[]).find(asset=>asset.uri===block.uri&&asset.integrity===block.integrity&&asset.file===file);
      let bytes:Buffer;
      if(convertedAssets.has(file))bytes=convertedAssets.get(file)!;
      else if(cached){bytes=await readFile(join(directory,file));if(hash(bytes)!==cached.sha256)throw new Error('Tampered cached figure PDF');}
      else bytes=await convertScriptSvg(svg,work,index);
      convertedAssets.set(file,bytes);
      await writeFile(join(work,file),bytes);
      const output=join(directory,file);
      if(existsSync(output)){if(hash(await readFile(output))!==hash(bytes))throw new Error('Unfamiliar figure output; refusing overwrite');}
      else await writeFile(output,bytes,{flag:'wx'});
      assets.push({uri:block.uri,integrity:block.integrity!,file,sha256:hash(bytes)});
    }
    await writeFile(join(work,'script.tex'),tex,'utf8');
    let log='';
    for(let pass=0;pass<3;pass++){
      const args=['--interaction=nonstopmode','--halt-on-error','--file-line-error','--no-shell-escape',
        ...(process.platform==='win32'?['--disable-installer']:[]),'script.tex'];
      const result=spawnSync(compiler,args,{cwd:work,encoding:'utf8',timeout:300_000,maxBuffer:16*1024*1024,windowsHide:true});
      if(result.error||result.status!==0)throw new Error(`LaTeX compiler failed (infrastructure or document error); diagnostics preserved in ${work}\n${result.error?.message??result.stdout.slice(-7000)}\n${result.stderr??''}`);
      log=await readFile(join(work,'script.log'),'utf8');
      if(pass>=1&&!/Rerun to get|Label\(s\) may have changed|undefined references/u.test(log))break;
    }
    if(/Missing character:|undefined references|Reference .* undefined|Rerun to get|Label\(s\) may have changed/u.test(log))throw new Error(`Incomplete LaTeX output; inspect ${work}/script.log`);
    if([...log.matchAll(/Overfull \\[hv]box \(([\d.]+)pt too (?:wide|high)\)/gu)].some(match=>Number(match[1])>3))throw new Error(`LaTeX content exceeds its layout budget; inspect ${work}/script.log`);
    const pdf=await readFile(join(work,'script.pdf'));if(pdf.subarray(0,5).toString()!=='%PDF-')throw new Error('Compiler did not produce a PDF');
    let bundle:Buffer|undefined;
    if(assets.length){
      const bundlePath=join(work,'source.zip');
      const result=spawnSync(process.env.PYTHON??'python',['-c','import sys,zipfile; z=zipfile.ZipFile(sys.argv[1],"w",zipfile.ZIP_DEFLATED); [z.write(p,p) for p in sys.argv[2:]]; z.close()',bundlePath,'script.tex',...assets.map(asset=>asset.file)],{cwd:work,encoding:'utf8',timeout:30000,windowsHide:true});
      if(result.error||result.status!==0)throw new Error('LaTeX source bundle failed: '+(result.error?.message??result.stderr));
      bundle=await readFile(bundlePath);
      const output=join(directory,hash(bundle)+'.zip');
      if(!existsSync(output))await writeFile(output,bundle,{flag:'wx'});
      else if(hash(await readFile(output))!==hash(bundle))throw new Error('Tampered source bundle output');
    }
    const pdfSha256=hash(pdf),latexSha256=hash(tex);
    const entry:Entry={scriptId:script.id,pathId:script.pathId,pathGraphId:script.pathGraphId,
      sourceKey:hash(scriptPdfFingerprintInput(script)),pdf:pdfSha256+'.pdf',pdfSha256,latex:latexSha256+'.tex',latexSha256,...(assets.length?{assets}:{}),...(bundle?{bundle:hash(bundle)+'.zip',bundleSha256:hash(bundle)}:{})};
    // Content-addressed files do not overwrite unrelated work. Publish the
    // manifest only after every compiler pass and every script has succeeded.
    for(const [name,bytes] of [[entry.pdf,pdf],[entry.latex,Buffer.from(tex)]] as const){
      const file=join(directory,name);
      if(existsSync(file)){if(hash(await readFile(file))!==hash(bytes))throw new Error('Unfamiliar changes at content-addressed output path');}
      else await writeFile(file,bytes,{flag:'wx'});
    }
    manifest.documents.push(entry);
    console.log(`Built LaTeX PDF: ${script.title}; source=${entry.sourceKey}; diagnostics=${work}`);
  }
  const staged=join(directory,`manifest-${randomUUID()}.tmp`);
  await writeFile(staged,JSON.stringify(manifest,null,2)+'\n','utf8');await rename(staged,join(directory,'manifest.json'));
  await checkScriptPdfs(scripts,directory,publicRoot);
  return manifest;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const {values}=parseArgs({options:{runtime:{type:'string'},'out-dir':{type:'string'},'public-root':{type:'string'},check:{type:'boolean'},compiler:{type:'string'}}});
    if(!values.runtime||!values['out-dir'])throw new Error('Usage: build_script_pdf.mts --runtime GENERATED_RUNTIME.json --out-dir PUBLIC/script-pdf [--check]');
    const artifact=JSON.parse(await readFile(resolve(values.runtime),'utf8'));
    const scripts:unknown=artifact.thematicScripts??[];if(!Array.isArray(scripts))throw new Error('Invalid thematicScripts');scripts.forEach(validateThematicScript);
    const publicRoot=resolve(values['public-root']??'apps/pitch/public');
    if(values.check)await checkScriptPdfs(scripts,resolve(values['out-dir']),publicRoot);
    else await buildScriptPdfs(scripts,resolve(values['out-dir']),values.compiler??process.env.LUALATEX??'lualatex',publicRoot);
  }catch(error){console.error(error instanceof Error?error.message:error);process.exitCode=1;}
}
