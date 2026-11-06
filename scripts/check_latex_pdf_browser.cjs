/* Start the local preview and build with npm run script:level5:pdf first. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base='http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=scroll&appearance-controls=hidden&mode=script';
(async()=>{
 const browser=await chromium.launch({channel:'msedge'});
 try{
  for(const theme of ['light','dark']){
   const page=await browser.newPage({viewport:{width:1560,height:950}});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base+'&theme='+theme);
   const link=page.getByRole('link',{name:'Open LaTeX script PDF',exact:true});
   await page.waitForFunction(()=>document.querySelector('.pcd-script-print')?.getAttribute('aria-disabled')==='false');
   const href=await link.getAttribute('href');assert.match(href,/\/script-pdf\/[a-f0-9]{64}\.pdf$/u);
   const response=await page.request.get(href);assert(response.ok());assert.match(response.headers()['content-type'],/application\/pdf/u);
   assert.equal((await response.body()).subarray(0,5).toString(),'%PDF-');
   await page.evaluate(()=>{window.__printCalls=0;window.print=()=>window.__printCalls++;});
   const navigation=page.context().waitForEvent('request',request=>request.resourceType()==='document'&&request.url()===href);
   await link.click();await navigation;
   assert.equal(await page.evaluate(()=>window.__printCalls),0,'PDF click must not print the HTML script');
   assert.deepEqual(errors,[]);console.log(theme+': exact-source LaTeX PDF link, bytes and click passed');
   await page.close();
  }
  for(const state of ['missing','stale','corrupt','figure-stale']){
   const context=await browser.newContext();
   await context.route('**/script-pdf/manifest.json',async route=>{
    if(state==='missing')return route.fulfill({status:404,body:'No PDF'});
    const response=await route.fetch();const data=await response.json();
    if(state==='stale')data.documents[0].sourceKey='0'.repeat(64);
    await route.fulfill({json:data});
   });
   if(state==='corrupt')await context.route('**/script-pdf/*.pdf',route=>route.fulfill({contentType:'application/pdf',body:'%PDF-tampered'}));
   if(state==='figure-stale')await context.route('**/chemometrics/level5-normal-ic-process.svg',async route=>{
    const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\n'});
   });
   const page=await context.newPage();await page.goto(base);
   await page.waitForFunction(()=>{const s=document.querySelector('.pcd-script-pdf-status');return s&&!s.textContent.startsWith('Checking');});
   const link=page.getByRole('link',{name:'Open LaTeX script PDF',exact:true});
   assert.equal(await link.getAttribute('aria-disabled'),'true');assert.equal(await link.getAttribute('href'),null);
   console.log(state+': PDF unavailable, no stale/HTML fallback');await context.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
