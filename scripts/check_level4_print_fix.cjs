/** Bounded regression for normal-course printing with the actual background on.
 * Requires local Playwright, Python/pypdf and pdftoppm (no product dependency).
 * Native Windows driver operation is not automated by this test.
 */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {execFileSync}=require('node:child_process');
let browser;
(async()=>{
  const output=process.env.REVIEW_DIR;assert(output,'Set REVIEW_DIR to a local review directory');
  fs.mkdirSync(output,{recursive:true});
  const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173';
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const manifest=await(await page.request.get(`${base}/course-runtime/manifest.json`)).json();
  const entry=manifest.documents.find(d=>d.pathId.includes('level4-distribution-shape'));
  const variance=manifest.documents.find(d=>d.pathId.includes('variance-dispersion'));
  assert(entry&&variance);
  const artifact=await(await page.request.get(`${base}/${entry.runtime}`)).json();
  assert.equal(artifact.sceneDocuments[0].scenes.length,65);
  const binding=artifact.sceneDocumentBindings[0];
  const reference=artifact.teachingOfferingDocuments[0].units.flatMap(u=>u.paths).find(p=>p.id===binding.pathId&&p.graphId===binding.pathGraphId);
  const title=reference.labels.find(t=>t.language==='en').value;
  const evidence={datasetFingerprint:artifact.datasetFingerprint,scientificScenes:65,title,prints:[],titleScreenshots:[]};
  for(const theme of ['light','dark'])for(const height of [1000,900]){
    await page.setViewportSize({width:1600,height});
    await page.emulateMedia({media:'screen'});
    // Do not disable the course background: doing so hid the original regression.
    await page.goto(`${base}/?level=${encodeURIComponent(entry.id)}&theme=${theme}`);
    await page.locator('.reveal.ready').waitFor();await page.evaluate(()=>document.fonts.ready);
    const cover=page.locator('[data-lecture-title]');
    assert.equal(await cover.count(),1);assert.equal(await cover.locator('[data-composition-region="heading"]').innerText(),title);
    assert.equal(await cover.innerText(),title,'The title card has no additional course subtitle');
    assert.equal(await cover.getAttribute('data-resource-id'),binding.pathId);
    assert.equal(await cover.getAttribute('data-provenance-ids'),binding.pathGraphId);
    const geometry=await cover.locator('[data-composition-region="heading"]').boundingBox();
    assert(geometry.x>=0&&geometry.y>=0&&geometry.x+geometry.width<=1600&&geometry.y+geometry.height<height-50);
    const screenshot=`lecture-title-${theme}-${height}.png`;
    await page.screenshot({path:path.join(output,screenshot)});evidence.titleScreenshots.push(screenshot);
    assert.equal(await page.locator('.pcd-background-world').isVisible(),true);
    await page.getByRole('button',{name:'Next',exact:true}).click();
    const first=page.locator(`[id="${artifact.sceneDocuments[0].scenes[0].id}"]`);
    await first.waitFor({state:'visible'});
    await page.getByRole('button',{name:'Switch to script',exact:true}).click();
    const pane=page.locator('.pcd-script-view:not([hidden])');await pane.waitFor();
    assert.equal(await pane.locator('.self-study-section').count(),65);
    assert.equal(await pane.locator('.self-study-chart-host svg').count(),44);
    assert.equal(await pane.locator('.pcd-script-header h1').innerText(),title);
    await page.evaluate(()=>{window.__printRequests=0;window.print=()=>window.__printRequests++;});
    await page.getByRole('button',{name:'Print / Save script as PDF',exact:true}).click();
    await page.waitForFunction(()=>window.__printRequests===1);
    await page.emulateMedia({media:'print'});
    const intruders=await page.evaluate(()=>[...document.body.children].filter(e=>!e.matches('.pcd-script-view')&&getComputedStyle(e).display!=='none').map(e=>e.className||e.tagName));
    assert.deepEqual(intruders,[],'No fixed background, controls, dialog or slide may paint over the printed script');
    assert.equal(await page.locator('.pcd-background-world').isVisible(),false);
    assert.equal(await pane.evaluate(e=>getComputedStyle(e).position),'static');
    assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
    const plates=await pane.locator('.pcd-script-matrix-page').evaluateAll(figures=>figures.map(figure=>{
      const bounds=figure.getBoundingClientRect();
      const sheet=figure.querySelector('.pcd-script-matrix-sheet').getBoundingClientRect();
      const panels=[...figure.querySelectorAll('.moment-matrix-svg > g')].map(panel=>panel.getBoundingClientRect());
      return {panels:panels.length,fits:[sheet,...panels].every(r=>r.left>=bounds.left-1&&r.right<=bounds.right+1&&r.top>=bounds.top-1&&r.bottom<=bounds.bottom+1),width:sheet.width,height:sheet.height};
    }));
    assert.equal(plates.length,4);assert(plates.every(p=>p.panels===9&&p.fits),JSON.stringify(plates));
    // Full PDFs for both themes, one with printer backgrounds disabled and one on.
    if(height===1000){
      const file=theme==='light'?'chemometrics-level4-script-fixed.pdf':'chemometrics-level4-script-dark-backgrounds-on.pdf';
      await page.pdf({path:path.join(output,file),preferCSSPageSize:true,printBackground:theme==='dark',tagged:true,outline:true});
      evidence.prints.push({file,theme,printBackground:theme==='dark'});
    }
    await page.emulateMedia({media:'screen'});
    assert.equal(await page.locator('.pcd-background-world').isVisible(),true,'Cancel/finish printing restores the presentation background');
    await page.getByRole('button',{name:'Switch to presentation',exact:true}).click();
    assert.equal(await page.locator('.pcd-script-print').isVisible(),false);
  }
  await page.goto(`${base}/?level=${encodeURIComponent(variance.id)}`);
  await page.locator('.reveal.ready').waitFor();
  assert.equal(await page.locator('[data-lecture-title]').count(),0,'Do not duplicate the existing authored Variance title');
  await page.getByRole('button',{name:'Switch to script',exact:true}).click();
  assert.equal(await page.locator('.pcd-script-view .self-study-section').count(),48);
  assert.deepEqual(errors,[]);
  const inspection=JSON.parse(execFileSync('python',['-X','utf8','-c',`
import hashlib,json,pathlib,re,subprocess,sys
from pypdf import PdfReader,PdfWriter
data=json.load(sys.stdin);root=pathlib.Path(data['output']);results=[]
def ppm(path):
    raw=path.read_bytes();pos=0;tokens=[]
    while len(tokens)<4:
        while raw[pos:pos+1] in (b' ',b'\\t',b'\\r',b'\\n'):pos+=1
        if raw[pos:pos+1]==b'#':pos=raw.index(b'\\n',pos)+1;continue
        end=pos
        while raw[end:end+1] not in (b' ',b'\\t',b'\\r',b'\\n'):end+=1
        tokens.append(raw[pos:end]);pos=end
    assert tokens[0]==b'P6' and tokens[3]==b'255',tokens
    if raw[pos:pos+2]==b'\\r\\n':pos+=2
    else:pos+=1
    w,h=map(int,tokens[1:3]);pixels=memoryview(raw)[pos:];assert len(pixels)==w*h*3
    dark=total=0
    # Ignore printer headers/footers: blank user pages still contain these.
    for y in range(int(h*.10),int(h*.90)):
        for x in range(int(w*.08),int(w*.92)):
            i=(y*w+x)*3;dark+=min(pixels[i:i+3])<235;total+=1
    return dark/total
for item in data['prints']:
    pdf=root/item['file'];reader=PdfReader(pdf);texts=[p.extract_text() or '' for p in reader.pages]
    assert 10<len(texts)<110
    wide=[i for i,p in enumerate(reader.pages) if p.mediabox.width>p.mediabox.height]
    assert len(wide)==0,('All plates must now fit portrait paper without driver orientation switching',wide)
    assert data['title'] in ' '.join(texts[0].split())
    assert all(len(t.strip())>20 for t in texts)
    folder=root/('raster-'+item['theme']);folder.mkdir(exist_ok=True)
    subprocess.run(['pdftoppm','-r','40',str(pdf),str(folder/'page')],check=True,capture_output=True)
    images=sorted(folder.glob('page-*.ppm'),key=lambda p:int(re.search(r'-(\\d+)\\.ppm$',p.name)[1]))
    assert len(images)==len(texts)
    fractions=[ppm(p) for p in images]
    assert all(.002<f<.55 for f in fractions),('Blank or background-covered page',fractions)
    sample=PdfWriter()
    plates=[i for i,t in enumerate(texts) if 'Empirical descriptors; variances use squared measurement units' in t]
    assert len(plates)==4,plates
    assert pdf.stat().st_size<5_000_000,('Compact PDF budget exceeded',pdf.stat().st_size)
    indices=sorted(set([0,1,*plates]))
    for i in indices:sample.add_page(reader.pages[i])
    sample.write(root/('print-sample-'+item['theme']+'.pdf'))
    results.append({**item,'pages':len(texts),'landscapePages':[i+1 for i in wide],'rotatedMatrixPages':[i+1 for i in plates],'rasterInkFractions':fractions,'samplePages':[i+1 for i in indices],'bytes':pdf.stat().st_size,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest()})
print(json.dumps(results))
`],{input:JSON.stringify({output,title,prints:evidence.prints}),encoding:'utf8',maxBuffer:4*1024*1024,timeout:120000}));
  evidence.prints=inspection;
  fs.writeFileSync(path.join(output,'print-fix-manifest.json'),JSON.stringify(evidence,null,2));
  console.log(`PASS: normal course, backgrounds enabled; title in both themes and 16:9/16:10; PDF button, print isolation/restoration, unchanged 65 scenes and Variance. ${inspection.map(p=>`${p.theme}: ${p.pages} PDF pages, all independently raster-checked`).join('; ')}. Artifacts: ${output}`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();});
