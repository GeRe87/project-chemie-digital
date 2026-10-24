/** Bounded terminology, numeric-preservation and visual check. External Playwright. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const output=process.env.REVIEW_DIR;assert(output,'Set REVIEW_DIR');fs.mkdirSync(output,{recursive:true});
const artifact=JSON.parse(fs.readFileSync('apps/pitch/public/authoring-runtime.json','utf8'));
const document=artifact.sceneDocuments[0],forbidden=/\b(?:type|typ)[ -]?7\b/iu;
const baseline=path.join(output,'baseline-runtime.json');
const numeric=(value,p='root',result=[])=>{
  if(typeof value==='number')result.push([p,value]);
  else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))numeric(v,p+'.'+k,result);
  return result;
};
if(fs.existsSync(baseline)){
  const before=JSON.parse(fs.readFileSync(baseline,'utf8')).sceneDocuments[0];
  assert.deepEqual(document.scenes.map(s=>s.id),before.scenes.map(s=>s.id));
  assert.deepEqual(numeric(document),numeric(before),'All numeric data/parameters remain unchanged');
  for(const scene of document.scenes)for(const b of scene.blocks){
    const original=before.scenes.find(s=>s.id===scene.id).blocks.find(o=>o.id===b.id);
    if(b.kind==='math')assert.equal(b.expression,original.expression.replaceAll('Q_7','Q').replaceAll('IQR}_7','IQR}'));
    if(b.kind==='code')assert.equal(b.code,original.code.replaceAll('type7_box','interpolated_box').replaceAll('Type-7 boxplot','Boxplot: linear interpolation').replaceAll('type7_Q1','Q1').replaceAll('type7_Q3','Q3'),'R computation is unchanged apart from helper/output names');
  }
}
let browser;
(async()=>{
  const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173';
  browser=await chromium.launch({channel:'msedge'});
  const page=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const theme of ['light','dark']){
    await page.goto('about:blank');
    await page.goto(`${base}/?level=ex%3Apath-chemometrics-level4-distribution-shape-lecture&mode=script&theme=${theme}`);
    await page.locator('.pcd-script-view .moment-matrix-svg').last().waitFor();
    const pane=page.locator('.pcd-script-view');
    assert.equal(await pane.locator('.self-study-section').count(),65);
    assert.doesNotMatch(await pane.textContent(),forbidden);
    assert.doesNotMatch(await page.locator('#pitch-slides').textContent(),forbidden);
    for(const label of await pane.locator('[aria-label]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label'))))assert.doesNotMatch(label,forbidden);
    assert.equal(await pane.locator('.moment-matrix-svg .mm-column-title').filter({hasText:'Boxplot · linear interpolation'}).count(),4);
    for(const slug of ['quartiles-concept','quantiles-concept','iqr-concept','box-symmetric','ecdf-inverse','mean-matrix']){
      await page.goto('about:blank');
      const id=`ex:l4-scene-${slug}--scene`;
      await page.goto(`${base}/?level=ex%3Apath-chemometrics-level4-distribution-shape-lecture&theme=${theme}#/${encodeURIComponent(id)}`);
      const slide=page.locator(`[id="${id}"]`);await slide.waitFor();
      if(slug==='mean-matrix')await slide.locator('.moment-matrix-svg').waitFor();
      await page.evaluate(()=>document.fonts.ready);
      assert.doesNotMatch(await slide.innerText(),forbidden);
      assert.equal(await slide.locator('.katex-error').count(),0);
      if(slug.endsWith('-concept')){
        assert.equal(await slide.locator('.formula-with-legend > .definition-list').count(),1);
        const legend=slide.locator('.formula-with-legend > .definition-list');
        const r=await legend.boundingBox();assert(r.y>=0&&r.y+r.height<865,`${slug}: symbol legend outside the slide`);
        assert.equal(await legend.evaluate(e=>e.scrollHeight>e.clientHeight+2),false);
      }
      if(slug==='mean-matrix'){
        const title=slide.locator('.mm-column-title').nth(1);
        assert(await title.evaluate(e=>e.getBBox().width<475),'Column heading fits its panel width');
        assert.equal(await slide.locator('.moment-matrix-svg > g').count(),9);
      }
      await page.screenshot({path:path.join(output,`${slug}-${theme}.png`)});
    }
    if(theme==='light'){
      await page.goto('about:blank');
      const id='ex:l4-scene-moment-lab--scene';
      await page.goto(`${base}/?level=ex%3Apath-chemometrics-level4-distribution-shape-lecture#/${encodeURIComponent(id)}`);
      const lab=page.locator(`[id="${id}"]`);await lab.locator('.cm-editor').waitFor();
      await lab.getByRole('button',{name:'Run',exact:true}).click();
      await page.waitForFunction(id=>!document.getElementById(id).querySelector('.code-run-button').disabled,id,{timeout:180000});
      const text=await lab.locator('.code-output').innerText();
      assert(!text.startsWith('Error:'),text);assert.doesNotMatch(text,forbidden);
      assert.match(text,/sample variance = 100 ; m2 = 99/u);
      fs.writeFileSync(path.join(output,'moment-lab-output.txt'),text);
      await lab.locator('.code-plot-button').click();await page.locator('.pcd-r-plot-dialog[open] canvas').waitFor();
      await page.screenshot({path:path.join(output,'moment-lab-actual-plot.png')});
      await page.getByRole('button',{name:'Close explanation',exact:true}).click();
    }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: all 65 slide/script sections use linear-interpolation terminology; numeric data, rank calculation and R computation preserved; same-slide legends and matrix headings fit in Light/Dark 16:9. Artifacts: '+output);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
