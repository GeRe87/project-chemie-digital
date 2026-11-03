/* Execute the actual authored optional programs through the local browser R UI.
 * Requires the same PLAYWRIGHT_MODULE as the other local browser probes. */
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE || '../.local/browser-tools/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const engine=process.argv[2]||'edge',browser=await(engine==='firefox'?firefox.launch():chromium.launch({channel:'msedge'}));
 try{
  const page=await browser.newPage({viewport:{width:1731,height:1006},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-opening&view=deck&interactive=1#/ex:rv-n05--scene');
  await page.locator('.pcd-slides-pdf-link').waitFor();
  const results=[];
  for(const [id,pattern] of [['ex:rv-n05--scene',/11 of 20 fraction: 0\.55/],['ex:rv-n06--scene',/1\.75/]]){
   if((await page.locator('section.present').getAttribute('id'))!==id){
    await page.locator('section.present .pcd-optional-material summary').focus();
    await page.keyboard.press('Escape');
    await page.locator('section.present h2').click();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(id=>document.querySelector('section.present')?.id===id,id);
   }
   const current=page.locator('section.present'),details=current.locator('.pcd-optional-material');
   await details.locator('summary').click();
   const editor=details.locator('.cm-content');await editor.waitFor();
   await details.getByRole('button',{name:'Run',exact:true}).click();
   await page.waitForFunction(id=>{
    const output=document.getElementById(id)?.querySelector('.code-output');
    return output&&!/Loading R runtime|Running|Output will appear here/.test(output.textContent);
   },id,{timeout:120000});
   const text=await details.locator('.code-output').innerText();
   assert(!/Error|unexpected|failed/i.test(text),text);assert.match(text,pattern);
   await details.locator('.code-plot-button').click();
   await page.locator('dialog[open] canvas').waitFor();assert.equal(await page.locator('dialog[open] canvas').count(),1);
   await page.keyboard.press('Escape');
   await editor.click();await page.keyboard.press('Escape');
   assert.equal(await details.getAttribute('open'),null,'Escape from the editor returns to the main slide');
   results.push({id,text,plots:1});
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({engine,results},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
