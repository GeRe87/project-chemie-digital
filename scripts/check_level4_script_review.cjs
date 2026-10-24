/** Local review artifacts only: authored script, both screenshot views and PDF. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
let browser;
(async()=>{
  const output=process.env.REVIEW_DIR;assert(output,'Set REVIEW_DIR to an approved local artifact directory');
  const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173';fs.mkdirSync(output,{recursive:true});
  if(process.env.REVIEW_SLIDES!=='0')execFileSync(process.execPath,['scripts/check_level4_order_statistics.cjs'],{stdio:'inherit',env:{...process.env,SCREENSHOT_DIR:path.join(output,'slides')}});
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const artifact=await(await page.request.get(base+'/authoring-runtime.json')).json(),document=artifact.sceneDocuments[0];
  assert.equal(document.scenes.length,65);assert(document.scenes.every(s=>s.narration));
  const manifest={datasetFingerprint:artifact.datasetFingerprint,sceneCount:65,scriptScreenshots:[],pdf:null};
  const frames=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  for(const theme of ['light','dark']){
    const directory=path.join(output,'script',theme);fs.mkdirSync(directory,{recursive:true});
    await page.goto(`${base}/authoring.html?theme=${theme}&background=none`);await page.locator('.reveal.ready').waitFor();
    const toggle=page.getByRole('button',{name:'Switch to script',exact:true});assert.equal(await toggle.isEnabled(),true);await toggle.click();
    const pane=page.locator('.pcd-script-view:not([hidden])');await pane.waitFor();await page.evaluate(()=>document.fonts.ready);await frames();
    assert.equal(await pane.locator('.self-study-section').count(),65);
    assert.equal(await pane.locator('.self-study-chart-host').count(),44);
    assert.equal(await pane.locator('.self-study-chart-host svg').count()>=44,true);
    assert.equal(await pane.locator('.self-study-formula-unit').count(),14);
    assert.equal(await pane.locator('.self-study-moment-table').count(),4);
    assert.equal(await pane.locator('.moment-matrix [data-panel-view]').count(),36);
    assert.equal(await pane.locator('.katex-error').count(),0);
    await pane.evaluate(n=>n.scrollTop=0);await frames();
    await page.screenshot({path:path.join(directory,'00-overview.png')});
    // The real button invokes the browser's print/Save-as-PDF dialog. Intercept
    // only in this test; the document below is exported with actual print CSS.
    await page.evaluate(()=>{window.__reviewPrintRequested=false;window.print=()=>{window.__reviewPrintRequested=true;};});
    await page.getByRole('button',{name:'Print / Save script as PDF',exact:true}).click();
    await page.waitForFunction(()=>window.__reviewPrintRequested===true);
    for(const[index,model]of document.scenes.entries()){
      const section=pane.locator(`[data-source-scene-id="${model.id}"]`);
      await section.scrollIntoViewIfNeeded();await frames();
      const height=await section.evaluate(n=>Math.ceil(n.getBoundingClientRect().height));
      await page.setViewportSize({width:1600,height:Math.max(1000,height+160)});
      await section.evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));await frames();
      const clip=await section.evaluate(n=>{
        const rectangles=[n,...n.querySelectorAll('figure,table,.self-study-math,pre')].filter(el=>el.getClientRects().length&&getComputedStyle(el).display!=='none'&&!el.closest('details:not([open])')).map(el=>el.getBoundingClientRect());
        const own=n.getBoundingClientRect(),left=Math.max(0,Math.min(...rectangles.map(r=>r.left))-12),right=Math.min(innerWidth,Math.max(...rectangles.map(r=>r.right))+12),top=Math.max(0,own.top-12);
        return {x:left,y:top,width:right-left,height:Math.min(innerHeight-top,own.bottom-top+12)};
      });
      assert(clip.height>=height,`${model.id}: screenshot includes the complete script section`);
      const slug=model.id.split('l4-scene-')[1].replace('--scene',''),file=`${String(index+1).padStart(2,'0')}-${slug}.png`;
      await page.screenshot({path:path.join(directory,file),clip});
      manifest.scriptScreenshots.push({sceneId:model.id,theme,path:`script/${theme}/${file}`,height});
    }
    // Switching back must recover a valid presentation scene and hide the PDF control.
    await page.getByRole('button',{name:'Switch to presentation',exact:true}).click();
    assert.equal(await page.locator('.pcd-script-print').isVisible(),false);
    assert.equal(await page.locator('.reveal').getAttribute('aria-hidden'),'false');
  }
  await page.setViewportSize({width:1600,height:1000});
  await page.goto(`${base}/authoring.html?theme=light&background=none&mode=script`);
  await page.locator('.pcd-script-view:not([hidden]) .moment-matrix-svg').first().waitFor();
  await page.evaluate(()=>document.fonts.ready);await page.emulateMedia({media:'print'});await frames();
  const pdfPath=path.join(output,'chemometrics-level4-script.pdf');
  await page.pdf({path:pdfPath,preferCSSPageSize:true,printBackground:true,tagged:true,outline:true,timeout:120000});
  const pdf=fs.readFileSync(pdfPath);assert(pdf.subarray(0,5).toString()==='%PDF-');
  const inspection=JSON.parse(execFileSync('python',['-X','utf8','-c',`
import json,re,sys
from pypdf import PdfReader,PdfWriter
r=json.load(sys.stdin);p=PdfReader(r['path']);texts=[page.extract_text() or '' for page in p.pages]
wide=[i for i,page in enumerate(p.pages) if float(page.mediabox.width)>float(page.mediabox.height)]
text=' '.join(' '.join(texts).split())
assert 10<len(p.pages)<110, len(p.pages)
assert len(wide)==4, wide
assert all('Empirical descriptors' in texts[i] and 'Histogram' in texts[i] for i in wide), 'Moment table and diagram must share one landscape page'
assert 'A mean and a standard deviation do not determine a distribution.' in text
assert 'Population skewness' in text and 'Population kurtosis' in text
assert 'Print / Save script' not in text
assert all(len(t.strip())>20 for t in texts), 'Blank or nearly blank PDF page'
w=PdfWriter()
formula=next(i for i,t in enumerate(texts) if 'Population skewness standardizes' in t)
sample=sorted(set([0,wide[0],formula,wide[-1],len(p.pages)-1]))
for i in sample:w.add_page(p.pages[i])
with open(r['sample'],'wb') as f:w.write(f)
print(json.dumps({'pageCount':len(p.pages),'landscapePages':[i+1 for i in wide],'pageTextLengths':[len(t) for t in texts],'samplePages':[i+1 for i in sample],'extractedCharacters':len(text)}))
`],{encoding:'utf8',input:JSON.stringify({path:pdfPath,sample:path.join(output,'pdf-review-sample.pdf')}),maxBuffer:4*1024*1024}));
  manifest.pdf={path:'chemometrics-level4-script.pdf',bytes:pdf.length,sha256:crypto.createHash('sha256').update(pdf).digest('hex'),...inspection};
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'review-manifest.json'),JSON.stringify(manifest,null,2));
  console.log(`PASS: script toggle, print button, 130 complete script screenshots, 44 diagrams, 14 formula legends; PDF ${inspection.pageCount} pages (${inspection.landscapePages.length} landscape). Artifacts: ${output}`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();});
