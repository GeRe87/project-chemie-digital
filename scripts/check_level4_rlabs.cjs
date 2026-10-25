/** Bounded local visual/execution acceptance against the existing Variance labs. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const output=process.env.REVIEW_DIR;assert(output,'Set REVIEW_DIR');fs.mkdirSync(output,{recursive:true});
const artifact=JSON.parse(fs.readFileSync('apps/pitch/public/authoring-runtime.json','utf8'));
const labs=artifact.sceneDocuments[0].scenes.filter(s=>s.blocks.some(b=>b.kind==='code'));
const baselineFile=path.join(output,'baseline-scenes.json');
if(fs.existsSync(baselineFile)){
  const before=JSON.parse(fs.readFileSync(baselineFile,'utf8'))[0];
  assert.deepEqual(artifact.sceneDocuments[0].scenes.map(s=>s.id),before.scenes.map(s=>s.id));
  for(const scene of artifact.sceneDocuments[0].scenes){
    const original=before.scenes.find(s=>s.id===scene.id);
    if(labs.includes(scene)){
      const code=b=>b.filter(b=>b.kind==='code').map(({source,...rest})=>rest);
      assert.deepEqual(code(scene.blocks),code(original.blocks),'No R source/settings changes; new glossary provenance is expected');
    }
    else assert.deepEqual(scene,original,'No changes outside the three R labs');
  }
}
let browser;
(async()=>{
  const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173';
  browser=await chromium.launch({channel:'msedge'});
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const manifest=await(await page.request.get(`${base}/course-runtime/manifest.json`)).json();
  const level=manifest.documents.find(d=>d.pathId.includes('level4-distribution-shape'));
  const variance=manifest.documents.find(d=>d.pathId.includes('variance-dispersion'));
  const results=[];
  for(const theme of ['light','dark'])for(const height of [1000,900]){
    await page.setViewportSize({width:1600,height});
    for(const [index,scene] of labs.entries()){
      // Start each deep link afresh: an in-document hash change is not a
      // navigation command while Reveal's existing stage lock is active.
      await page.goto('about:blank');
      await page.goto(`${base}/?level=${encodeURIComponent(level.id)}&theme=${theme}#/${encodeURIComponent(scene.id)}`);
      const slide=page.locator(`[id="${scene.id}"]`);await slide.locator('.cm-editor').waitFor();
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await slide.getAttribute('data-composition-profile'),'prompt-code');
      assert.equal(await slide.locator('.teaching-points > li').count(),3);
      assert.equal(await slide.locator('.pcd-marker-highlight').count(),1);
      assert.equal(await slide.locator('.code-function-workbench > .definition-list').count(),1);
      const glossary=slide.locator('.code-function-workbench > .definition-list');
      const geometry=await slide.evaluate(e=>{
        const box=s=>e.querySelector(s).getBoundingClientRect().toJSON();
        return {slide:e.getBoundingClientRect().toJSON(),prompt:box('.poll-prompt'),editor:box('.code-editor-host'),output:box('.code-output'),glossary:box('.code-function-workbench > .definition-list'),normal:getComputedStyle(e.querySelector('.poll-prompt')).fontWeight,bold:getComputedStyle(e.querySelector('.poll-prompt strong')).fontWeight};
      });
      await page.screenshot({path:path.join(output,'current-layout.png')});
      assert.equal(geometry.normal,'400');assert(Number(geometry.bold)>=600);
      assert(geometry.glossary.y>=geometry.output.y+geometry.output.height-1,'Function box below the output');
      for(const key of ['prompt','editor','output','glossary']){
        const r=geometry[key];assert(r.x>=-1&&r.y>=-1&&r.x+r.width<=1601&&r.y+r.height<=height-35,`${scene.id}: ${key} outside visible slide: ${JSON.stringify(geometry)}`);
      }
      await glossary.focus();await page.keyboard.press('End');
      await page.waitForFunction(id=>{const e=document.getElementById(id).querySelector('.code-function-workbench > .definition-list');return e.scrollTop+e.clientHeight>=e.scrollHeight-2;},scene.id);
      assert.equal(await glossary.getAttribute('tabindex'),'0');
      await glossary.evaluate(e=>e.scrollTop=0);
      const screenshot=`rlab-${index+1}-${theme}-${height}.png`;
      await page.screenshot({path:path.join(output,screenshot)});
      results.push({scene:scene.id,theme,height,geometry,screenshot,functions:await glossary.locator('.definition-list-entry').count()});
      if(theme==='light'&&height===1000&&process.env.SKIP_R_EXECUTION!=='1'){
        await slide.getByRole('button',{name:'Run',exact:true}).click();
        await page.waitForFunction(id=>!document.getElementById(id).querySelector('.code-run-button').disabled,scene.id,{timeout:240000});
        const text=await slide.locator('.code-output').innerText();
        assert(!/^(Error:|Loading R|Output will)/u.test(text),text);
        const plots=slide.locator('.code-plot-button');assert.equal(await plots.isVisible(),true,text);
        await plots.click();await page.locator('.pcd-r-plot-dialog[open] canvas').first().waitFor();
        await page.screenshot({path:path.join(output,`rlab-${index+1}-actual-r-plot.png`)});
        await page.getByRole('button',{name:'Close explanation',exact:true}).click();
        fs.writeFileSync(path.join(output,`rlab-${index+1}-output.txt`),text);
        await slide.getByRole('button',{name:'Reset',exact:true}).click();
        assert.equal(await slide.locator('.code-output').innerText(),'Output will appear here.');
        assert.equal(await plots.isVisible(),false);
      }
    }
    if(height===1000){
      await page.goto('about:blank');
      await page.goto(`${base}/?level=${encodeURIComponent(variance.id)}&theme=${theme}#/${encodeURIComponent('ex:scene-vr24--scene')}`);
      const reference=page.locator('[id="ex:scene-vr24--scene"]');await reference.locator('.cm-editor').waitFor();
      assert.equal(await reference.getAttribute('data-composition-profile'),'prompt-code');
      assert.equal(await reference.locator('.code-function-workbench > .definition-list').count(),1);
      await page.screenshot({path:path.join(output,`variance-reference-${theme}.png`)});
    }
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'rlab-review-manifest.json'),JSON.stringify({results,execution:process.env.SKIP_R_EXECUTION!=='1'},null,2));
  console.log(`PASS: three standard R labs; Light/Dark, 16:10/16:9; rich text, below-output complete glossary, keyboard scroll, visible bounds, Variance template${process.env.SKIP_R_EXECUTION==='1'?'':', real R execution/plots/reset'}. Artifacts: ${output}`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
