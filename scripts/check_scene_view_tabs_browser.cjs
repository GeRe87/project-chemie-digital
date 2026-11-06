/* Local-only ribbon interaction, state preservation and geometry regression. */
const {launchBrowser}=require('./browser-tools.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const engine=process.argv[2]||'chromium';
 const browser=await launchBrowser(engine);
 try{
  for(const [view,width,height] of [['deck',1731,1006],['scroll',1731,1006],['deck',1280,720],['scroll',390,844]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=${view}&appearance-controls=hidden`);
   await page.locator('.pcd-slides-pdf-link').waitFor();
   const ids=await page.locator('section[data-scene-view-tabs="true"]').evaluateAll(es=>es.map(e=>e.id));
   assert(ids.length>10);
   for(const id of ids){
    const slide=page.locator(`section[id="${id}"]`);
    if(view==='deck'){await page.evaluate(id=>location.hash='/'+id,id);await page.waitForFunction(id=>document.querySelector('section.present')?.id===id,id);}
    else await slide.scrollIntoViewIfNeeded();
    const diagram=slide.getByRole('tab',{name:'Diagram',exact:true}),formula=slide.getByRole('tab',{name:'Formula & symbols',exact:true});
    await diagram.click();
    const experiment=slide.locator('.distribution-experiment'),hasExperiment=await experiment.count();
    const adjustable=slide.locator('input[type="number"]').first();
    if(await adjustable.count()){
     await adjustable.fill(await adjustable.getAttribute('min'));await adjustable.dispatchEvent('change');
    }
    const before=await slide.boundingBox(),model=hasExperiment?await experiment.getAttribute('data-model-values'):null;
    const hash=await page.evaluate(()=>decodeURIComponent(location.hash));
    await diagram.focus();await page.keyboard.press('ArrowRight');
    assert.equal(await formula.getAttribute('aria-selected'),'true');
    assert.equal(await formula.evaluate(e=>e===document.activeElement),true);
    assert.equal(await slide.getByRole('tabpanel').count(),1);
    assert.equal(await slide.locator('.formula-with-legend').first().isVisible(),true);
    const after=await slide.boundingBox();assert(Math.abs(before.height-after.height)<2,'Tab switch must not enlarge the slide');
    const legend=slide.locator('details.symbol-legend-disclosure').first();
    if(await legend.count()){
     await legend.locator('summary').click();
     assert.equal(await legend.locator('.definition-list-description').first().isVisible(),true);
     assert(Math.abs((await slide.boundingBox()).height-before.height)<2,'Opening the legend must stay inside the tab stage');
     await legend.locator('summary').click();await formula.focus();
    }
    await page.keyboard.press('Alt+ArrowUp');assert.equal(await diagram.getAttribute('aria-selected'),'true');
    await page.keyboard.press('Alt+ArrowDown');assert.equal(await formula.getAttribute('aria-selected'),'true');
    await page.keyboard.press('Home');assert.equal(await diagram.getAttribute('aria-selected'),'true');
    await formula.click();await page.keyboard.press('End');assert.equal(await formula.getAttribute('aria-selected'),'true');
    await diagram.click();
    assert.equal(hasExperiment?await experiment.getAttribute('data-model-values'):null,model);
    assert.equal(await page.evaluate(()=>decodeURIComponent(location.hash)),hash,'Tabs must not navigate to another slide');
    if(id==='ex:pc-n10--scene'){
     await page.evaluate(()=>document.activeElement?.blur());
     await page.keyboard.press('Alt+ArrowDown');assert.equal(await formula.getAttribute('aria-selected'),'true');
     await page.keyboard.press('Alt+ArrowUp');assert.equal(await diagram.getAttribute('aria-selected'),'true');
    }
    const input=slide.locator('input').first();
    if(await input.count()){
     await input.focus();await page.keyboard.press('Alt+ArrowDown');assert.equal(await diagram.getAttribute('aria-selected'),'true','Editor keys must remain native');
    }
    if(width>700){
     const panel=await slide.getByRole('tabpanel').boundingBox();assert(panel.width>before.width*.9,`${id}: diagram ${panel.width} must use the full stage width ${before.width}`);
     const visual=await slide.locator('[data-scene-view-active="true"] > [data-component-kind="visual"]').boundingBox();
     assert(visual&&Math.abs(visual.height-panel.height)<4,'Single-column visual must fill the remaining stage height');
     const canvases=await slide.locator('.experiment-panels > figure > svg,.d3-chart-svg').evaluateAll(es=>es.filter(e=>e.clientHeight>0).map(e=>({canvas:e.viewBox.baseVal.height,cell:e.clientHeight})));
     assert(canvases.every(({canvas,cell})=>Math.abs(canvas-cell)<3),`${id}: plot coordinates must follow allocated height: ${JSON.stringify(canvases)}`);
     const flows=await slide.locator('.d3-flow-svg').evaluateAll(es=>es.map(e=>({width:e.clientWidth,titles:[...e.querySelectorAll('.d3-flow-node-title')].map(title=>title.querySelectorAll('tspan').length)})));
     const logicalSlideWidth=await slide.evaluate(e=>e.clientWidth);
     assert(flows.every(flow=>flow.width>=logicalSlideWidth*.9),'Flow must use the full stage width');
     assert(flows.every(flow=>flow.titles.every(lines=>lines<=3)),'Short flow titles must not become narrow word fragments');
    }
   }
   // A native browser print also exposes both existing regions, not only the active tab.
   const first=page.locator(`section[id="${ids[0]}"]`);
   if(view==='deck'){await page.evaluate(id=>location.hash='/'+id,ids[0]);await page.waitForFunction(id=>document.querySelector('section.present')?.id===id,ids[0]);}
   else await first.scrollIntoViewIfNeeded();
   await first.getByRole('tab',{name:'Formula & symbols',exact:true}).click();
   await page.emulateMedia({media:'print'});assert.equal(await first.getByRole('tabpanel').count(),2);await page.emulateMedia({media:'screen'});
   const lifecycle=await page.evaluate(async()=>{
    const {mountSceneViewTabs}=await import('/src/scene-view-tabs.ts');
    const fixture=document.createElement('div');
    fixture.innerHTML='<section id="renamed-scene" data-composition-profile="visual-formula"><div id="existing-primary" role="group" tabindex="3" data-composition-region-container="primary"><div data-chart-block-id="renamed-chart"></div></div><div data-composition-region-container="secondary"><div class="formula-with-legend">Formula remains here</div></div></section>';
    const before=fixture.innerHTML;let updates=0;
    const destroy=mountSceneViewTabs(fixture,()=>updates++);
    const tabs=fixture.querySelectorAll('[role="tab"]'),count=tabs.length;
    tabs[1].click();destroy();destroy();tabs[0].click();
    return{count,updates,restored:fixture.innerHTML===before};
   });
   assert.deepEqual(lifecycle,{count:2,updates:1,restored:true});
   assert.deepEqual(errors,[]);await page.close();console.log(`${engine} ${view} ${width}: ${ids.length} tabbed slides passed`);
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
