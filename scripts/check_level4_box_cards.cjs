/** Focused rich-text/geometry acceptance; external local Playwright only. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const output=process.env.REVIEW_DIR;assert(output,'Set REVIEW_DIR');fs.mkdirSync(output,{recursive:true});
const artifact=JSON.parse(fs.readFileSync('apps/pitch/public/authoring-runtime.json','utf8'));
const scenes=artifact.sceneDocuments[0].scenes;
const targets=scenes.filter(s=>s.accessibility?.label.startsWith('Boxplots:'));
assert.equal(targets.length,8);
const baseline=path.join(output,'baseline-runtime.json');
if(fs.existsSync(baseline)){
  const before=JSON.parse(fs.readFileSync(baseline,'utf8')).sceneDocuments[0].scenes;
  assert.deepEqual(scenes.map(s=>s.id),before.map(s=>s.id));
  for(const scene of scenes){
    const original=before.find(s=>s.id===scene.id);
    if(!targets.includes(scene))assert.deepEqual(scene,original,'Only the eight Boxplot explanation scenes may change');
    else {
      const science=s=>s.blocks.filter(b=>['chart','math','table','code'].includes(b.kind));
      assert.deepEqual(science(scene),science(original),'Keep all scientific diagrams, formulas, tables and code');
      assert.equal(scene.narration,original.narration);
    }
  }
}
let browser;
(async()=>{
  const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173';
  browser=await chromium.launch({channel:'msedge'});
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));const evidence=[];
  for(const theme of ['light','dark'])for(const height of [1000,900]){
    await page.setViewportSize({width:1600,height});
    for(const [index,scene] of targets.entries()){
      await page.goto('about:blank');
      await page.goto(`${base}/?level=ex%3Apath-chemometrics-level4-distribution-shape-lecture&theme=${theme}#/${encodeURIComponent(scene.id)}`);
      const slide=page.locator(`[id="${scene.id}"]`);await slide.locator('svg').first().waitFor();
      await page.evaluate(()=>document.fonts.ready);
      assert(await slide.locator('strong').count()>=3);
      assert(await slide.locator('.teaching-points > li').count()>=2);
      assert.equal(await slide.locator('.pcd-marker-highlight').count(),1);
      assert.equal(await slide.locator('.katex-error').count(),0);
      const boxes=await slide.locator('.definition-list-description, [data-component-kind="info-surface"]').evaluateAll(nodes=>nodes.map(e=>{
        const r=e.getBoundingClientRect();const p=e.querySelector('p')??e;const strong=e.querySelector('strong');
        return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height,overflow:e.scrollHeight>e.clientHeight+2,normal:getComputedStyle(p).fontWeight,bold:strong?getComputedStyle(strong).fontWeight:null};
      }));
      const screenshot=`box-${index+1}-${theme}-${height}.png`;
      await page.screenshot({path:path.join(output,screenshot)});
      for(const box of boxes){
        assert(box.x>=0&&box.y>=0&&box.right<=1601&&box.bottom<=height-30,`${scene.id}: card outside viewport: ${JSON.stringify(boxes)}`);
        assert(!box.overflow,`${scene.id}: card overflow: ${JSON.stringify(boxes)}`);
        assert.equal(box.normal,'400');
        if(box.bold)assert(Number(box.bold)>=600);
      }
      evidence.push({scene:scene.id,theme,height,screenshot,boxes});
    }
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'box-card-manifest.json'),JSON.stringify(evidence,null,2));
  console.log('PASS: eight Boxplot explanation scenes; rich text, real bullets, one highlight, normal/bold hierarchy, visible bounds/no clipping in Light/Dark and 16:10/16:9; scientific blocks and other 57 scenes unchanged. Artifacts: '+output);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
