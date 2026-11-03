/* Local-only R workspace geometry, scrolling, keyboard and execution QA. */
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE||'../.local/browser-tools/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const runtime=JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/pitch/public/authoring-level5-review-complete-runtime.json'),'utf8'));
(async()=>{
 const output=process.argv[2],engine=process.argv[3]||'edge',execute=process.argv.includes('--execute');assert(output);fs.mkdirSync(output,{recursive:true});
 const browser=await(engine==='firefox'?firefox.launch():chromium.launch({channel:'msedge'}));const report={engine,errors:[],configurations:[],execution:null};
 try{
  for(const [width,height,theme]of [[1731,1006,'light'],[1280,720,'dark'],[390,844,'light']]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce',colorScheme:theme});page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto(`http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=deck&theme=${theme}`);
   await page.locator('.pcd-slides-pdf-link').waitFor({timeout:120000});await page.evaluate(()=>document.fonts.ready);
   const scenes=runtime.sceneDocuments[0].scenes.filter(s=>s.blocks.some(b=>b.kind==='code'&&b.language==='r'&&b.executable&&b.disclosure?.mode==='optional'));
   const checked=[];
   const within=(box,outer,label)=>{assert(box,`${label}: missing box`);assert(box.x>=outer.x-2&&box.y>=outer.y-2&&box.x+box.width<=outer.x+outer.width+2&&box.y+box.height<=outer.y+outer.height+2,`${label}: outside bounds ${JSON.stringify({box,outer})}`);};
   for(const scene of scenes){
    await page.evaluate(id=>location.hash='/'+id,scene.id);await page.waitForFunction(id=>document.querySelector('section.present')?.id===id,scene.id);
    const slide=page.locator('section.present');await slide.locator('details.pcd-optional-material > summary').click();
    const details=page.locator('details.pcd-optional-material[open]');
    if(width<=700)await page.locator('.pcd-optional-workspace-portal > details[open]').waitFor();
    const shell=details.locator('.code-block[data-code-layout="split"]').first(),editor=shell.locator('.code-editor-host'),results=shell.locator('.code-result-pane'),controls=shell.locator('.code-runtime-controls');
    await editor.locator('.cm-content').waitFor();await controls.getByRole('button',{name:'Run',exact:true}).waitFor();
    const panel=await details.boundingBox(),source=await editor.boundingBox(),result=await results.boundingBox();
    within(panel,{x:0,y:0,width,height},`${scene.id}: panel`);if(width>700)within(panel,await slide.boundingBox(),`${scene.id}: slide`);
    within(source,panel,`${scene.id}: editor`);within(result,panel,`${scene.id}: results`);within(await controls.boundingBox(),panel,`${scene.id}: button bar`);
    assert(source.height>70&&result.height>70,`${scene.id}: panes too short`);
    if(width>700)assert(source.x+source.width<=result.x+2,`${scene.id}: expected two columns`);else assert(source.y+source.height<=result.y+2,`${scene.id}: expected stacked panes`);
    assert.equal(await shell.locator('.code-output').count(),1);
    await shell.locator('.code-output').evaluate(e=>{e.textContent=Array.from({length:250},(_,i)=>`Workspace scroll check ${i}: `+'0123456789 '.repeat(8)).join('\n');});
    await results.evaluate(e=>e.scrollTop=e.scrollHeight);assert(await results.evaluate(e=>e.scrollTop>0),`${scene.id}: results do not scroll`);
    await shell.locator('.cm-scroller').evaluate(e=>e.scrollTop=e.scrollHeight);
    within(await controls.boundingBox(),panel,`${scene.id}: scrolled button bar`);
    await controls.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await shell.locator('.code-output').innerText(),'Output will appear here.');
    if(checked.length===0)await page.screenshot({path:path.join(output,`${engine}-${width}-${theme}.png`)});
    await editor.locator('.cm-content').focus();await page.keyboard.press('ArrowRight');assert.equal(await slide.getAttribute('id'),scene.id);
    if(width<=700&&checked.length===0){
     await page.setViewportSize({width:1280,height:720});await slide.locator('details.pcd-optional-material[open]').waitFor();
     await page.setViewportSize({width,height});await page.locator('.pcd-optional-workspace-portal > details[open]').waitFor();
     await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
     assert.equal(await slide.locator('details.pcd-optional-material').getAttribute('open'),null);
     await slide.locator('details.pcd-optional-material > summary').click();await page.locator('.pcd-optional-workspace-portal > details[open]').waitFor();
     await page.locator('.pcd-optional-workspace-portal > details > summary').click();
     await slide.locator('details.pcd-optional-material:not([open])').waitFor({state:'attached'});
     await slide.locator('details.pcd-optional-material > summary').click();await page.locator('.pcd-optional-workspace-portal > details[open]').waitFor();
     await editor.locator('.cm-content').focus();
    }
    await page.keyboard.press('Escape');assert.equal(await slide.locator('details.pcd-optional-material').getAttribute('open'),null);checked.push(scene.id);
   }
   if(execute&&width===1731&&scenes.length){
    const id=scenes[0].id;await page.evaluate(id=>location.hash='/'+id,id);await page.waitForFunction(id=>document.querySelector('section.present')?.id===id,id);
    const details=page.locator('section.present details.pcd-optional-material');await details.locator(':scope > summary').click();const shell=details.locator('.code-block[data-code-layout="split"]').first();
    await shell.locator('.cm-content').fill('cat(paste(rep("R workspace execution check", 180), collapse="\\n")); plot(1:12, (1:12)^2, type="b")');
    await shell.getByRole('button',{name:'Run',exact:true}).click();
    await page.waitForFunction(()=>{const s=document.querySelector('section.present .code-block[data-code-layout="split"]');return s?.querySelector('.code-run-button')&&!s.querySelector('.code-run-button').disabled&&s.querySelector('.code-output')?.textContent.includes('R workspace execution check');},{},{timeout:180000});
    assert.equal(await shell.locator('.code-result-pane canvas').count(),1);assert.equal(await shell.locator('.code-output[role="button"]').count(),0);
    const plots=shell.getByRole('button',{name:/Enlarge plots/});await plots.click();await page.locator('dialog.pcd-r-plot-dialog[open]').waitFor();await page.keyboard.press('Escape');
    assert.equal(await shell.locator('.code-result-pane canvas').count(),1,'Enlargement must not remove the inline plot');
    await page.screenshot({path:path.join(output,`${engine}-executed.png`)});report.execution={scene:id,inlinePlots:1,output:'R workspace execution check'};
   }
   report.configurations.push({width,height,theme,scenes:checked});await page.close();
  }
  assert.deepEqual(report.errors,[]);console.log(`${engine}: bounded code/output workspaces, independent scrolling and keyboard controls passed${execute?'; real R output and inline plot passed':''}`);
 }finally{await browser.close();fs.writeFileSync(path.join(output,`${engine}-r-workspaces.json`),JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
