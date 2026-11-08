/* Bounded editorial review of the revised opening; no build or publication. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const out=process.argv[2];assert(out,'Specify a disposable review directory');fs.mkdirSync(out,{recursive:true});
 const base='http://127.0.0.1:5173/',stem='authoring-level6-statistical-tests';
  const runtime=await(await fetch(base+stem+'-runtime.json')).json(),scenes=runtime.sceneDocuments[0].scenes.slice(0,14);
 const browser=await chromium.launch({channel:'msedge'}),report={errors:[],themes:[]};
 const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const input=async(locator,value)=>locator.evaluate((e,value)=>{e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
 try{for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width:1560,height:950},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(base+`authoring.html?preview=${stem}&view=scroll&appearance-controls=hidden&theme=${theme}`);
  await page.locator('.pcd-script-toggle').waitFor();await page.evaluate(()=>document.fonts.ready);
  for(const [i,scene] of scenes.entries()){
   const slide=page.locator(`.reveal section[id="${scene.id}"]`);await slide.scrollIntoViewIfNeeded();await settle(page);
   assert.equal(await slide.locator('.katex-error').count(),0);
   for(const image of await slide.locator('img').all())assert(await image.evaluate(e=>e.complete&&e.naturalWidth>0),'Missing slide image');
   const overflow=await slide.evaluate(s=>{
    const r=s.getBoundingClientRect();return [...s.querySelectorAll('[data-composition-region-container],.teaching-card,.formula-with-legend,table')]
     .filter(e=>e.getClientRects().length).filter(e=>{const q=e.getBoundingClientRect();return q.left<r.left-3||q.right>r.right+3||q.bottom>r.bottom+3;}).map(e=>e.className);
   });assert.deepEqual(overflow,[],`Clipped content in ${scene.id}`);
   await slide.screenshot({path:path.join(out,`${theme}-${String(i+1).padStart(2,'0')}.png`)});
   for(const disclosure of await slide.locator('.symbol-legend-disclosure').all()){
    await disclosure.locator('summary').focus();await page.keyboard.press('Enter');
     assert(await disclosure.evaluate(e=>e.open));assert(await disclosure.locator('dl').first().isVisible());
    await disclosure.locator('summary').focus();await page.keyboard.press('Enter');assert(!(await disclosure.evaluate(e=>e.open)));
   }
  }
  const alpha=page.locator('.reveal section').filter({has:page.locator('[data-experiment-kind="t-test"] input[aria-label^="Alpha:"]')});
  await alpha.scrollIntoViewIfNeeded();const control=alpha.getByRole('slider');assert.equal(await control.count(),1);
   const root=alpha.locator('.distribution-experiment'),betas=[];
   assert.equal(await root.locator('.experiment-panels > figure').count(),1);
   assert.equal(await root.locator('.experiment-readouts > span').count(),2);
   assert.doesNotMatch(await root.locator('.experiment-readouts').textContent(),/power|degrees of freedom/i);
  for(const value of [.05,.01,.001]){
   await input(control,value);await settle(page);
   assert.equal(await root.evaluate(e=>JSON.parse(e.dataset.modelValues).alpha),value);
   const valueText=await root.locator('.experiment-readouts').textContent();
   const match=valueText.match(/Simulated type II error \(%\): ([\d.]+)/);assert(match,valueText);betas.push(Number(match[1]));
   await alpha.screenshot({path:path.join(out,`${theme}-alpha-${value}.png`)});
  }
  assert(betas[0]<betas[1]&&betas[1]<betas[2]);
  await control.focus();await page.keyboard.press('Home');assert.equal(await control.inputValue(),'0.001');
  await page.keyboard.press('ArrowRight');assert.equal(await control.inputValue(),'0.002');
  await root.getByRole('button',{name:'Reset model'}).click();assert.equal(await control.inputValue(),'0.05');
  assert.equal(await root.locator('output').textContent(),'5%');
  const qc=page.locator('.reveal section').filter({has:page.locator('[data-experiment-kind="t-test"] input[aria-label="Sample mean (µg/L)"]')});
  await qc.scrollIntoViewIfNeeded();assert.equal(await qc.getByRole('slider').count(),3);
  for(const slider of await qc.getByRole('slider').all())assert(await slider.isVisible());
  const mean=qc.getByRole('slider',{name:'Sample mean (µg/L)',exact:true});await input(mean,50);await settle(page);
  assert.match(await qc.locator('.experiment-readouts').textContent(),/p-value: 1/);
  await input(mean,48.5);await input(qc.getByRole('slider',{name:'Independent preparations n',exact:true}),40);await settle(page);
   assert.match(await qc.locator('.experiment-readouts').textContent(),/ν: 39/);
  await qc.screenshot({path:path.join(out,`${theme}-qc-n40.png`)});
  assert.equal(await qc.locator('[aria-invalid="true"]').count(),0);
  await qc.getByRole('button',{name:'Reset model'}).click();
   await page.getByRole('button',{name:'Switch to script',exact:true}).click();
    for(const filename of ['level6-frozen-lake.svg','level6-decision-trees.svg']){
    const image=page.locator(`.pcd-script-view img[src$="${filename}"]`);assert.equal(await image.count(),1);
    await image.scrollIntoViewIfNeeded();await image.evaluate(e=>e.decode());assert(await image.evaluate(e=>e.complete&&e.naturalWidth>0));
   }
   await page.setViewportSize({width:390,height:844});assert(await page.locator('.pcd-script-view').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Narrow Script overflow');
   report.themes.push({theme,slides:scenes.length,betaPercentAtAlpha5_1_01:betas,sliders:4,keyboard:true,scriptPictures:2,narrowScript:true});await page.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
