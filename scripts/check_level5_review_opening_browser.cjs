/* Local pilot QA. PLAYWRIGHT_MODULE selects an already installed module.
 * Usage: node scripts/check_level5_review_opening_browser.cjs OUTPUT_DIR [edge|firefox]
 */
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE || '../.local/browser-tools/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const output=process.argv[2],engine=process.argv[3]||'edge'; assert(output,'Specify local audit output');fs.mkdirSync(output,{recursive:true});
 const browser=await(engine==='firefox'?firefox.launch():chromium.launch({channel:'msedge'}));
 const preview=process.env.REVIEW_PREVIEW||'authoring-level5-review-opening',last=Number(process.env.REVIEW_LAST_SCENE||6);
 assert(/^authoring(?:-[a-z0-9]+)*$/.test(preview)&&Number.isInteger(last)&&last>=6&&last<=9);
 const report={engine,preview,errors:[],configurations:[]};
 const base=`http://127.0.0.1:5173/authoring.html?preview=${preview}&view=deck`;
 try{
  for(const [width,height,theme] of [[1731,1006,'light'],[1280,720,'dark'],[390,844,'light']]){
   const page=await browser.newPage({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});
   const rRequests=[];
   await page.route('**/vendor/webr/**',route=>{rRequests.push(route.request().url());return route.abort();});
   page.on('pageerror',error=>report.errors.push(error.message));
   await page.goto(`${base}&theme=${theme}#/ex:rv-n05--scene`);
   await page.waitForFunction(()=>document.querySelector('section.present')?.id==='ex:rv-n05--scene');
   await page.locator('.pcd-slides-pdf-link').waitFor();
   const current=page.locator('section.present'),readout=current.locator('.oe-readout');
   await readout.waitFor(); assert.match(await readout.innerText(),/11 \/ 20.*55%/s);
   const toggle=current.getByRole('checkbox',{name:'Compare two thresholds'});
   await toggle.uncheck();assert.match(await readout.innerText(),/15 \/ 20/);
   await toggle.check();assert.match(await readout.innerText(),/11 \/ 20/);
   const lower=current.getByRole('slider',{name:'Lower threshold (mg/L)',exact:true});
   await lower.evaluate(e=>{e.value='9.9';e.dispatchEvent(new Event('input',{bubbles:true}));});
   assert.match(await readout.innerText(),/8 \/ 20.*40%/s);
   const upper=current.getByRole('slider',{name:'Threshold x (mg/L)',exact:true});
   await upper.evaluate(e=>{e.value='10.3';e.dispatchEvent(new Event('input',{bubbles:true}));});
   assert.match(await readout.innerText(),/10 \/ 20.*50%/s);
   await lower.evaluate(e=>{e.value='10.5';e.dispatchEvent(new Event('input',{bubbles:true}));});
   assert.equal(await lower.getAttribute('aria-invalid'),'true');assert.match(await readout.innerText(),/10 \/ 20/);
   await current.getByRole('button',{name:'Reset',exact:true}).click();assert.match(await readout.innerText(),/11 \/ 20.*55%/s);
   const details=current.locator('.pcd-optional-material');
   assert.equal(await details.getAttribute('open'),null);
   await details.locator('summary').click();assert.notEqual(await details.getAttribute('open'),null);
   assert.match(await details.locator('.code-static-fallback').innerText(),/lower <- 9.80; upper <- 10.20/);
   assert.equal(await page.locator('section.present').getAttribute('id'),'ex:rv-n05--scene');
   await details.locator('summary').focus();await page.keyboard.press('Escape');assert.equal(await details.getAttribute('open'),null);
   const scenes=[];
   for(let n=2;n<=last;n++){
    await page.goto(`${base}&theme=${theme}#/ex:rv-n0${n}--scene`);
    await page.waitForFunction(id=>document.querySelector('section.present')?.id===id,`ex:rv-n0${n}--scene`);
    await page.locator('.pcd-slides-pdf-link').waitFor();
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:path.join(output,`${engine}-${width}-${theme}-n0${n}.png`)});
    scenes.push(await page.locator('section.present').evaluate(s=>({id:s.id,profile:s.dataset.compositionProfile,
     scrollable:getComputedStyle(s).overflowY==='auto'&&s.scrollHeight>s.clientHeight,
     overflow:[...s.querySelectorAll('h2,.oe-readout,.teaching-points,figure')].filter(e=>{
      const r=e.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth+2||r.bottom>innerHeight+2);
     }).map(e=>({tag:e.tagName,text:e.textContent.slice(0,70)}))})));
    if(width<700){
     const scene=page.locator('section.present'),target=scene.locator('figure,.oe-readout').last();
     if(await target.count()){
      await target.scrollIntoViewIfNeeded();
      assert.equal(await scene.getAttribute('id'),`ex:rv-n0${n}--scene`);
      const reachable=await target.evaluate(e=>{
       const r=e.getBoundingClientRect(),s=e.closest('section');
       return r.left>=-2&&r.right<=innerWidth+2&&r.top<innerHeight&&r.bottom>0&&
        (r.bottom<=innerHeight+2||getComputedStyle(s).overflowY==='auto'&&s.scrollHeight>s.clientHeight);
      });assert(reachable,'Phone evidence must be visible or reachable within its same scrollable scene');
     }
    }
   }
   if(last!==6){
    await page.goto(`${base}&theme=${theme}#/ex:rv-n06--scene`);
    await page.locator('.pcd-slides-pdf-link').waitFor();
    await page.waitForFunction(()=>document.querySelector('section.present')?.id==='ex:rv-n06--scene');
   }
   const histogram=page.locator('section.present');
   await histogram.getByRole('slider',{name:'Bin width (mg/L)',exact:true}).evaluate(e=>{e.value='0.1';e.dispatchEvent(new Event('input',{bubbles:true}));});
   await histogram.getByRole('slider',{name:'Bin origin shift (fraction of width)',exact:true}).evaluate(e=>{e.value='0.25';e.dispatchEvent(new Event('input',{bubbles:true}));});
   assert.match(await histogram.locator('.histogram-readout').innerText(),/counted 20\/20/);
   assert.equal(await histogram.locator('.d3-histogram-bin').evaluateAll(bins=>bins.reduce((s,b)=>s+Number(b.dataset.count),0)),20);
   if(width<700){
    await page.goto(`${base.replace('view=deck','view=scroll')}&theme=${theme}#/ex:rv-n05--scene`);
    await page.locator('.pcd-slides-pdf-link').waitFor();
    await page.waitForFunction(()=>document.querySelector('section.present')?.id==='ex:rv-n05--scene');
    await page.locator('section.present').evaluate(s=>{s.scrollTop=0;});
    const point=await page.locator('section.present [data-composition-region-container="primary"]').evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+40};});
    await page.mouse.move(point.x,point.y);await page.mouse.wheel(0,250);
    await page.waitForFunction(()=>document.querySelector('section.present')?.scrollTop>0);
    assert.equal(await page.locator('section.present').getAttribute('id'),'ex:rv-n05--scene','Native reading scroll must not turn the page');
   }
   assert.deepEqual(rRequests,[],'Experiments must not load or execute R');
   report.configurations.push({width,height,theme,scenes});await page.close();
  }
 }finally{await browser.close();fs.writeFileSync(path.join(output,`${engine}-opening-report.json`),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));assert.deepEqual(report.errors,[]);
 assert.deepEqual(report.configurations.flatMap(c=>c.scenes.filter(s=>s.overflow.length&&!s.scrollable).map(s=>({width:c.width,id:s.id,overflow:s.overflow}))),[]);
})().catch(e=>{console.error(e);process.exitCode=1;});
