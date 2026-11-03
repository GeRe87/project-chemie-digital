/* Local integration QA: lazy world -> reviewed Level 5 -> world. */
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE||'../.local/browser-tools/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const output=process.argv[2],engine=process.argv[3]||'edge';assert(output);fs.mkdirSync(output,{recursive:true});
 const browser=await(engine==='firefox'?firefox.launch():chromium.launch({channel:'msedge'}));
 const report={engine,checks:[],errors:[]};
 try{
  for(const [width,height]of [[1440,900],[390,844]])for(const theme of ['light','dark']){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto(`http://127.0.0.1:5173/?theme=${theme}`);
   const world=page.locator('.pitch-course-world-shell');await world.waitFor();
   assert.equal(await page.locator('.slides section').count(),0,'Opening world must not eagerly mount slides');
   assert.equal(await world.locator('.pitch-world-region').count(),7);
   assert.equal(await world.locator('.pitch-world-start').count(),6);
   const region=world.locator('.pitch-world-region').nth(2),level=region.locator('[data-level="5"]');
   assert.match(await region.innerText(),/Theoretical Distributions & Similarity Analysis/);
   assert.equal(await level.count(),1);assert.equal(await region.locator('.pitch-world-start').count(),1);
   const image=level.locator('img');await image.evaluate(e=>e.decode());assert.match(await image.getAttribute('alt'),/Decorative, not measurement data/);
   await level.scrollIntoViewIfNeeded();assert(await world.evaluate(e=>e.scrollWidth<=e.clientWidth+2));
   await page.screenshot({path:path.join(output,`${engine}-${width}-${theme}-region3.png`)});
   const start=level.getByRole('button',{name:'Start level: Theoretical Distribution Models',exact:true});
   const documentId=await start.getAttribute('data-scene-document-id');await start.focus();await page.keyboard.press('Enter');
   await page.locator('section.present').waitFor({timeout:120000});
   assert.equal(await page.locator('section.present').getAttribute('data-scene-document-id'),documentId);
   const authored=page.locator('.slides section[data-scene-document-id]:not([data-course-level-buffer]):not([data-course-return-sentinel])');
   assert.equal(await authored.count(),42,'41 authored scenes plus the level title');
   assert.equal(await page.locator('.katex-error').count(),0);
   await page.screenshot({path:path.join(output,`${engine}-${width}-${theme}-level5.png`)});
   await page.getByRole('button',{name:'Course Overworld',exact:true}).click();await world.waitFor();
   assert.equal(await world.locator('[data-level="5"]').count(),1);
   report.checks.push({width,height,theme,documentId,scenes:41,returned:true});await page.close();
  }
  assert.deepEqual(report.errors,[]);console.log(`${engine}: Level 5 in Region 3, 41 scenes, keyboard start and return passed in both themes and viewport sizes`);
 }finally{await browser.close();fs.writeFileSync(path.join(output,`${engine}-level5-overworld.json`),JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
