/* Local Level-6 screenshot review; never publishes or changes authored content. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const out=process.argv[2];assert(out,'Specify a disposable screenshot directory');
 const base=process.argv[3]||'http://127.0.0.1:5173/';fs.mkdirSync(out,{recursive:true});
 const stem='authoring-level6-statistical-tests';
 const artifact=await(await fetch(base+stem+'-runtime.json')).json();
 const document=artifact.sceneDocuments[0],script=artifact.thematicScripts[0];
 const browser=await chromium.launch({channel:'msedge'}),report={errors:[],failed:[],themes:[]};
 try{for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width:1560,height:950},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)report.failed.push({url:r.url(),status:r.status()});});
  await page.goto(base+`authoring.html?preview=${stem}&view=scroll&appearance-controls=hidden&theme=${theme}`);
  await page.locator('.pcd-script-toggle').waitFor();await page.evaluate(()=>document.fonts.ready);
  const entry={theme,slides:[],legendChecks:0,script:{}};
  for(const [index,scene] of document.scenes.entries()){
   const slide=page.locator(`.reveal section[id="${scene.id}"]`);await slide.scrollIntoViewIfNeeded();
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(await slide.locator('.katex-error').count(),0,scene.id);
    for(const caption of await slide.locator('.d3-chart-caption,.experiment-caption-text,.pairwise-description').all())assert.doesNotMatch(await caption.textContent(),/\*\*/,'Authored emphasis must render, not leak Markdown markers');
   for(const image of await slide.locator('img').all())assert(await image.evaluate(e=>e.complete&&e.naturalWidth>0),'Missing image');
   const geometry=await slide.evaluate(s=>{
    const r=s.getBoundingClientRect();
    const surfaces=[...s.querySelectorAll('[data-composition-region-container],.teaching-card,.formula-with-legend,table,.d3-dot-plot-svg')].filter(e=>e.getClientRects().length);
    const mathOverflow=[...s.querySelectorAll('.katex-display .katex')].filter(e=>{const q=e.getBoundingClientRect();return q.left<r.left-3||q.right>r.right+3;}).map(e=>e.textContent);
     const contentOverflow=[...s.querySelectorAll('.pcd-composition-region')].filter(e=>e.getClientRects().length&&(e.scrollHeight>e.clientHeight+3||e.scrollWidth>e.clientWidth+3)).map(e=>({class:e.className,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}));
      const illustrations=[...s.querySelectorAll('.media-reference svg.teaching-svg')].filter(svg=>!svg.closest('details:not([open])')).map(svg=>{
       const scale=Math.abs(svg.getScreenCTM()?.a??1),box=svg.viewBox.baseVal;
       const sizes=[...svg.querySelectorAll('text')].map(t=>parseFloat(getComputedStyle(t).fontSize)*scale).sort((a,b)=>a-b);
       return {width:box.width*scale,height:box.height*scale,minimumLabelPx:sizes[0],medianLabelPx:sizes[Math.floor(sizes.length/2)]};
    });
      return {width:r.width,height:r.height,mathOverflow,contentOverflow,illustrations,overflow:surfaces.filter(e=>{const q=e.getBoundingClientRect();return q.left<r.left-3||q.right>r.right+3||q.top<r.top-3||q.bottom>r.bottom+3;}).map(e=>({tag:e.tagName,class:e.className,rect:e.getBoundingClientRect().toJSON()}))};
   });
     await slide.screenshot({path:path.join(out,`${theme}-${String(index+1).padStart(2,'0')}.png`)});
     for(const illustration of geometry.illustrations){
     assert(illustration.width>=geometry.width*.4,scene.id+': illustration must use a substantial teaching surface');
     assert(illustration.minimumLabelPx===undefined||illustration.minimumLabelPx>=16,scene.id+': SVG label below the local 16px floor');
    }
    await slide.screenshot({path:path.join(out,`${theme}-${String(index+1).padStart(2,'0')}.png`)});
   for(const disclosure of await slide.locator('.symbol-legend-disclosure').all()){
    const summary=disclosure.locator('summary');await summary.focus();await page.keyboard.press('Enter');
    assert(await disclosure.evaluate(e=>e.open),'Keyboard must open the Symbols control');
     assert(await disclosure.locator('dl').first().isVisible(),'Full symbol legend must be visible');
    assert(await disclosure.evaluate(e=>{const r=e.closest('section').getBoundingClientRect(),d=e.getBoundingClientRect();return d.left>=r.left-3&&d.right<=r.right+3&&d.top>=r.top-3&&d.bottom<=r.bottom+3;}),'Full disclosure must remain on the same slide');
    await summary.focus();await page.keyboard.press('Enter');assert(!(await disclosure.evaluate(e=>e.open)));
    entry.legendChecks++;
   }
    const disclosures=slide.locator('.symbol-legend-disclosure');
    if(await disclosures.count()){
     await disclosures.evaluateAll(es=>es.forEach(e=>{e.open=true;}));
     await slide.screenshot({path:path.join(out,`${theme}-${String(index+1).padStart(2,'0')}-symbols.png`)});
     assert(await disclosures.evaluateAll(es=>es.every(e=>{const r=e.closest('section').getBoundingClientRect(),d=e.getBoundingClientRect();return d.left>=r.left-3&&d.right<=r.right+3&&d.top>=r.top-3&&d.bottom<=r.bottom+3&&e.scrollWidth<=e.clientWidth+3&&e.scrollHeight<=e.clientHeight+3;})),scene.id+': simultaneous complete legends must fit without internal clipping');
     await slide.screenshot({path:path.join(out,`${theme}-${String(index+1).padStart(2,'0')}-symbols.png`)});
     await disclosures.evaluateAll(es=>es.forEach(e=>{e.open=false;}));
    }
    entry.slides.push({id:scene.id,...geometry});
  }
  await page.getByRole('button',{name:'Switch to script',exact:true}).click();
  assert.equal(await page.locator('.pcd-script-section').count(),script.sections.length);
  assert.equal(await page.locator('.katex-error').count(),0);
  const charts=page.locator('.pcd-script-view .self-study-chart-host');
  const expectedCharts=script.sections.flatMap(s=>s.materials).flatMap(m=>m.blocks).filter(b=>b.kind==='chart').length;
  assert.equal(await charts.count(),expectedCharts);assert(await charts.evaluateAll(es=>es.every(e=>e.querySelector('svg'))));
  for(const section of await page.locator('.pcd-script-section').all()){
   await section.scrollIntoViewIfNeeded();
   const id=await section.getAttribute('data-script-section');
   await page.screenshot({path:path.join(out,`${theme}-script-${encodeURIComponent(id).slice(-50)}.png`)});
  }
  await page.setViewportSize({width:390,height:844});
  assert(await page.locator('.pcd-script-view').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Narrow Script overflow');
  await page.screenshot({path:path.join(out,`${theme}-script-mobile.png`)});
  entry.script={chapters:script.sections.length,charts:await charts.count(),narrow:true};
   const expectedLegends=document.scenes.flatMap(s=>s.blocks).filter(b=>b.kind==='math').length;
   assert.equal(entry.legendChecks,expectedLegends);report.themes.push(entry);await page.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failed,[]);
  console.log(JSON.stringify({themes:report.themes.map(t=>({theme:t.theme,slides:t.slides.length,legendChecks:t.legendChecks,overflowSlides:t.slides.filter(s=>s.overflow.length||s.mathOverflow.length||s.contentOverflow.length).map(s=>s.id),script:t.script})),errors:report.errors,failed:report.failed},null,2));
  assert(report.themes.every(t=>t.slides.every(s=>s.mathOverflow.length===0)),'A displayed formula extends beyond its slide');
  assert(report.themes.every(t=>t.slides.every(s=>s.contentOverflow.length===0)),'Content extends beyond its composition region');
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
