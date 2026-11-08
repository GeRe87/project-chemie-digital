/* Focused pairwise-score, reference and optional-setup interaction checks. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const out=process.argv[2];assert(out,'Specify a disposable review directory');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge'}),report={errors:[],themes:[]};
 try{for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width:1560,height:950},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(`http://127.0.0.1:5173/authoring.html?preview=authoring-level6-statistical-tests&view=scroll&appearance-controls=hidden&theme=${theme}`);
  await page.locator('.pcd-script-toggle').waitFor();await page.evaluate(()=>document.fonts.ready);
  const slide=page.locator('section').filter({has:page.locator('.pairwise-score')}),score=slide.locator('.pairwise-score');
  await slide.scrollIntoViewIfNeeded();await slide.screenshot({path:path.join(out,`${theme}-score-0.png`)});
  const next=score.getByRole('button',{name:'Next comparison'});
  for(let n=1;n<=9;n++){
   await next.focus();await page.keyboard.press('Enter');assert.equal(await score.getAttribute('data-completed'),String(n));
   if(n===4)await slide.screenshot({path:path.join(out,`${theme}-score-4.png`)});
  }
  assert.match(await score.locator('.pairwise-status').textContent(),/U_X = 1\./);
  assert(await next.isDisabled());assert.equal(await score.locator('tbody tr').count(),9);
  await score.locator('summary').focus();await page.keyboard.press('Enter');
  assert(await score.locator('table').isVisible());await slide.screenshot({path:path.join(out,`${theme}-score-9-ledger.png`)});
  assert(await score.locator('details').evaluate(e=>{const r=e.getBoundingClientRect(),s=e.closest('section').getBoundingClientRect();return r.bottom<=s.bottom+2&&r.top>=s.top-2;}),'Ledger is bounded on the same slide');
  await score.getByRole('button',{name:'Previous'}).click();assert.equal(await score.getAttribute('data-completed'),'8');
  await score.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await score.getAttribute('data-completed'),'0');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await score.evaluate(root=>{const buttons=[...root.querySelectorAll('button')];buttons[1].click();buttons[2].click();buttons[1].click();});
  await page.waitForFunction(()=>document.querySelector('.pairwise-score')?.dataset.completed==='1');
  await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));
  assert.equal(await score.getAttribute('data-completed'),'1','Cancelled animation must not advance reset state');
  const setup=page.locator('details.pcd-optional-material').filter({hasText:'Show experiment: rows and columns'}),summary=setup.locator('summary');
  await summary.scrollIntoViewIfNeeded();
  const closedPosition=await setup.evaluate(e=>({box:e.getBoundingClientRect().toJSON(),formula:e.closest('section').querySelector('.formula-with-legend').getBoundingClientRect().toJSON()}));
  assert(closedPosition.box.top>=closedPosition.formula.bottom-2,'Setup control follows formula');
  await summary.focus();await page.keyboard.press('Enter');assert(await setup.evaluate(e=>e.open));
  assert(await setup.locator('svg').isVisible());
  assert(await setup.locator('svg').evaluate(e=>e.getBoundingClientRect().width>900),'Desktop setup uses the available overlay surface');
  await setup.screenshot({path:path.join(out,`${theme}-setup-open.png`)});
  await page.keyboard.press('Escape');assert(!(await setup.evaluate(e=>e.open)));assert(await summary.evaluate(e=>e===document.activeElement));
  const references=page.locator('.scene-references a');assert((await references.count())>=25);
  for(const link of await references.all()){
   assert.match(await link.getAttribute('href'),/^https:\/\/www\.itl\.nist\.gov\//);assert.equal(await link.getAttribute('target'),'_blank');
   assert.match(await link.getAttribute('rel'),/noopener/);
  }
  await page.setViewportSize({width:390,height:844});await summary.scrollIntoViewIfNeeded();await summary.focus();await page.keyboard.press('Enter');
  assert(await page.locator('.pcd-optional-workspace-portal .pcd-optional-material[open]').count());
  await page.screenshot({path:path.join(out,`${theme}-setup-mobile.png`)});await page.keyboard.press('Escape');
  assert(await summary.evaluate(e=>e===document.activeElement));
  await page.setViewportSize({width:1560,height:950});await page.emulateMedia({media:'print'});
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  assert(await setup.locator('svg').isVisible(),'Static print exposes optional experiment setup');
  await page.emulateMedia({media:'screen'});
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  report.themes.push({theme,pairs:9,finalU:1,keyboard:true,motionReset:true,overlayEscape:true,mobileOverlay:true,printSetup:true,references:await references.count()});
  await page.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
