/** Focused acceptance of the quiet, four-shape lecture opening. External Playwright. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
let browser;
(async()=>{
  const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173',output=process.env.SCREENSHOT_DIR;
  if(output)fs.mkdirSync(output,{recursive:true});
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const styleSignature=locator=>locator.evaluate(host=>{
    const properties={'.d3-dot-point':['fill','stroke','strokeWidth'],'.d3-chart-grid-line':['stroke','strokeWidth','strokeDasharray'],'.d3-chart-category-label':['fill','fontFamily','fontSize'],'.d3-chart-axis-title':['fill','fontFamily','fontSize','fontWeight']};
    return Object.fromEntries(Object.entries(properties).map(([selector,keys])=>{
      const style=getComputedStyle(host.querySelector(selector));
      return [selector,Object.fromEntries(keys.map(key=>[key,style[key]]))];
    }));
  });
  const artifact=await(await page.request.get(base+'/authoring-runtime.json')).json();
  assert(artifact.sceneDocuments[0].scenes.length>=1);
  const chart=artifact.sceneDocuments[0].scenes[0].blocks.find(b=>b.view==='summary');
  assert.equal(chart.series.length,4);
  for(const series of chart.series){
    assert.equal(series.data.length,100);
    const values=series.data.map(d=>d.value),mean=values.reduce((a,b)=>a+b)/values.length;
    const sd=Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/(values.length-1));
    assert(Math.abs(mean-50)<1e-10);assert(Math.abs(sd-10)<1e-10);
  }
  for(const theme of ['dark','light']){
    await page.goto(`${base}/authoring.html?theme=${theme}&background=none#/${encodeURIComponent(artifact.sceneDocuments[0].scenes[0].id)}`);
    const scene=page.locator('.d3-distribution-plot');await scene.waitFor({state:'visible'});
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await scene.getAttribute('data-mode'),'distribution');
    assert.equal(await scene.locator('svg').count(),1);
    assert.equal(await scene.locator('.d3-dot-point').count(),400);
    assert.equal(await scene.locator('.sc-value').count(),0);
    assert.equal(await scene.locator('.d3-dot-summary').count(),4);
    assert.equal(await scene.locator('.d3-dot-spread').count(),12);
    assert.equal(await scene.locator('.d3-dot-legend > span').count(),3);
    assert.equal(await scene.evaluate(n=>!!n.closest('.retro-neon-chart-window[data-chart-renderer="dot"]')),true);
    assert.equal(await scene.locator('.d3-dot-plot-figure .d3-dot-plot-svg').count(),1);
    assert.equal(await scene.locator('.sc-summary,.sc-cue,.sc-notes').count(),0);
    const slide=page.locator(`section[id="${artifact.sceneDocuments[0].scenes[0].id}"]`);
    assert.equal(await slide.getAttribute('data-composition-profile'),'scenario-data-visual');
    const primary=slide.locator(':scope > [data-composition-region-container="primary"]');
    const secondary=slide.locator(':scope > [data-composition-region-container="secondary"]');
    assert.equal(await primary.locator('.definition-list').count(),1);
    assert.equal(await primary.locator('table tbody tr').count(),4);
    assert.equal(await primary.locator('.keypoint-list').count(),1);
    assert.equal(await secondary.locator('.d3-distribution-plot').count(),1);
    assert.match(await primary.innerText(),/ECDF/);
    const left=await primary.boundingBox(),right=await secondary.boundingBox();
    const heading=await slide.locator(':scope > [data-composition-region="heading"]').boundingBox();
    assert(heading.width>left.width+right.width,'Shared heading spans both columns');
    assert(left.x+left.width<=right.x,'Use the shared side-by-side composition');
    assert(left.y+left.height<950&&right.y+right.height<950,'Both columns clear deck navigation');
    assert.equal(await scene.locator('select,input').count(),0);
    assert.equal(await scene.getByRole('button',{name:'Reset',exact:true}).count(),0);
    assert.equal(await scene.getByRole('button',{name:'Overlay series',exact:true}).count(),0);
    const geometry=await scene.locator('svg').evaluate(svg=>{
      const dots=[...svg.querySelectorAll('.d3-dot-point')];
      const ids=[...new Set(dots.map(d=>d.getAttribute('data-series-id')))];
      const groups=ids.map(id=>dots.filter(d=>d.getAttribute('data-series-id')===id).length);
      return {groups,ys:dots.map(d=>+d.getAttribute('cy')),axisY:+svg.querySelector('.d3-chart-axis').getAttribute('y1')};
    });
    assert.deepEqual(geometry.groups,[100,100,100,100]);
    assert(Math.min(...geometry.ys)>0);assert(Math.max(...geometry.ys)<geometry.axisY);
    if(output)await page.screenshot({path:path.join(output,`opening-four-shapes-${theme}.png`)});
    const bounds=await scene.boundingBox();assert(bounds.y+bounds.height<950,JSON.stringify(bounds));
    assert.equal(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor),theme==='dark'?'rgb(7, 16, 31)':'rgb(255, 255, 255)');
    const currentStyle=await styleSignature(scene);
    // Compare the actual rendered styles, not merely matching class names.
    const manifest=await(await page.request.get(base+'/course-runtime/manifest.json')).json();
    const variance=manifest.documents.find(d=>d.pathId.includes('variance-dispersion'));
    assert(variance);
    const reference=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
    await reference.goto(`${base}/?level=${encodeURIComponent(variance.id)}&theme=${theme}&background=none#/${encodeURIComponent('ex:scene-vr02--scene')}`);
    const referencePlot=reference.locator('.retro-neon-chart-window[data-chart-type="dot"]').first();
    await referencePlot.locator('.d3-dot-point').first().waitFor({state:'attached'});
    assert.deepEqual(currentStyle,await styleSignature(referencePlot),'Distribution dots inherit the existing Variance plot skin and lecture typography');
    if(output)await reference.screenshot({path:path.join(output,`variance-dot-reference-${theme}.png`)});
    await reference.close();
    await scene.locator('.d3-chart-details-button').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('.sc-dialog[open] .katex').count(),3);
    assert.match(await page.locator('.sc-dialog[open]').innerText(),/constructed illustrations/);
    await page.keyboard.press('Escape');assert.equal(await page.locator('.sc-dialog[open]').count(),0);
    await scene.locator('.sc-data summary').click();assert.match(await scene.locator('.sc-data').innerText(),/Vertical stacking/);
  }
  await page.goto(base+'/authoring-static.html');
  const text=await page.locator('body').innerText();
  assert.match(text,/Normal-like/);assert.match(text,/Bimodal/);assert.match(text,/Sample SD = 10/);assert.match(text,/ECDF/);
  if(process.env.CHECK_OVERWORLD==='1'){
    const manifest=await(await page.request.get(base+'/course-runtime/manifest.json')).json();
    const entry=manifest.documents.find(d=>d.pathId===artifact.sceneDocuments[0].sourcePathId);
    assert(entry);assert.equal(entry.sceneIds[0],artifact.sceneDocuments[0].scenes[0].id);
    await page.goto(base+'/');await page.waitForSelector('.pitch-course-world-shell');
    await page.goto(`${base}/?level=${encodeURIComponent(entry.id)}&background=none`);
    await page.waitForSelector('.d3-distribution-plot');assert.equal(await page.locator('.d3-distribution-plot .d3-dot-point').count(),400);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: shared scenario/table/conclusion + chart composition; computed dot/grid/axis styles match actual Variance plots in Light/Dark; shared diamond/legend/frame; four sets/400 dots; common empirical mean/SD; packing bounds; details keyboard/Escape; static fallback; requested Overworld check.');
  if(output)console.log('Screenshots: '+output);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
