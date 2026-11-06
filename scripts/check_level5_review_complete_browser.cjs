/* Local-only complete-deck QA; outputs remain disposable. */
const {launchBrowser}=require('./browser-tools.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const runtime=JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/pitch/public/authoring-level5-review-complete-runtime.json'),'utf8'));
(async()=>{
 const output=process.argv[2],engine=process.argv[3]||'chromium';assert(output);fs.mkdirSync(output,{recursive:true});
 const browser=await launchBrowser(engine);
 const report={engine,errors:[],configurations:[]};
 try{
  for(const [width,height,theme]of [[1731,1006,'light'],[1280,720,'dark'],[390,844,'light']]){
   const page=await browser.newPage({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'}),rRequests=[];
   page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(r.url().includes('/vendor/webr/'))rRequests.push(r.url());});
   await page.goto(`http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=deck&theme=${theme}`);
   await page.locator('.pcd-slides-pdf-link').waitFor({timeout:120000});await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('.reveal .slides > section').count(),42);
    assert.match(await page.locator('.reveal .slides > section').first().innerText(),/Theoretical Distribution Models/);
   const scenes=[];
    for(const [index,scene]of runtime.sceneDocuments[0].scenes.entries()){
     const reviewNumber=Number(scene.id.match(/-n(\d+)--scene$/)?.[1])||0; // Stable authoring IDs, not current pages.
    await page.evaluate(id=>{location.hash='/'+id;},scene.id);
    await page.waitForFunction(id=>document.querySelector('section.present')?.id===id,scene.id);
     if(reviewNumber!==37)await page.evaluate(()=>document.querySelectorAll('section.present .fragment').forEach(e=>e.classList.add('visible')));
     const current=page.locator('section.present');assert.equal(await current.locator('.katex-error').count(),0);
      for(const media of scene.blocks.filter(b=>b.kind==='media-reference'&&b.caption)){
        const caption=current.locator(`[data-media-block-id="${media.id}"] > figcaption.media-caption`);
        assert.equal(await caption.innerText(),media.caption);
        if(width>700){const box=await caption.boundingBox();assert(box&&box.y>=0&&box.y+box.height<=height+2,`${scene.id}: media caption outside viewport`);}
      }
     if(reviewNumber===29){assert.equal(await current.locator('.definition-list-description ul').count(),3);assert.equal(await current.locator('.definition-list-description .pcd-marker-highlight').count(),3);assert.ok(await current.locator('.definition-list-description strong').count()>=3);}
     if(['ex:lg-log-scale-scene--scene','ex:ix-square-scene--scene'].includes(scene.id)){await current.locator('.media-reference[data-media-aspect="panoramic"]').waitFor();if(width>700){const illustration=await current.locator('.media-reference').boundingBox(),formula=await current.locator('.formula-with-legend').boundingBox(),slide=await current.boundingBox();assert(illustration&&formula&&slide);assert(illustration.y+illustration.height<=formula.y+2,'Panoramic illustration must precede its formula vertically');assert(illustration.width>=slide.width*.8,'Illustration must use the available slide width');}}
     if(scene.id==='ex:map-mechanisms-scene--scene'){assert.equal(await current.locator('.formula-with-legend').count(),5);const legends=current.locator('details.symbol-legend-disclosure');assert.equal(await legends.count(),5);for(const legend of await legends.all()){assert.equal(await legend.getAttribute('open'),null);await legend.locator('summary').click();assert.notEqual(await legend.getAttribute('open'),null);assert.equal(await current.getAttribute('id'),scene.id);await legend.locator('summary').press('Enter');assert.equal(await legend.getAttribute('open'),null);}}
    const experiment=current.locator('.distribution-experiment'),hasExperiment=await experiment.count();
    const checks=[];
     if(hasExperiment){
       await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
       assert.ok(await experiment.locator('svg').count());assert.ok((await experiment.locator('.experiment-readouts').innerText()).length>20,`${scene.id}: missing teaching results`);
       assert.equal(await experiment.locator(':scope > figcaption.experiment-caption').count(),1);
       assert.equal(await experiment.locator(':scope > figcaption.experiment-caption').isVisible(),true);
       assert.equal(await experiment.locator('details .experiment-caption').count(),0);
       assert.equal(await experiment.locator(':scope > .experiment-readouts').count(),0);
       assert.equal(await experiment.locator(':scope > figcaption.experiment-caption > .experiment-readouts').count(),1);
      const assertWidgetFits=async()=>{if(width<=700)return;const box=await experiment.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+2&&box.y+box.height<=height+2,`${scene.id}: widget outside ${width}x${height} viewport`);};
       await assertWidgetFits();
       assert.ok(await experiment.locator(':scope > .experiment-controls > label').count()<=2,`${scene.id}: too many primary controls`);
       const typography=await experiment.locator('label,input,button,figcaption,.experiment-readouts,svg text').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().height>0).map(e=>parseFloat(getComputedStyle(e).fontSize)));
       assert.ok(typography.every(size=>size>=22),`${scene.id}: text below the logical 22px floor`);
       const canvases=await experiment.locator('.experiment-panels > figure > svg').evaluateAll(es=>es.map(e=>({canvas:e.viewBox.baseVal.width,cell:e.parentElement.clientWidth})));
       assert.ok(canvases.every(({canvas,cell})=>Math.abs(canvas-cell)<=2),`${scene.id}: SVG coordinates do not match their content cell`);
       const settingsDisclosure=experiment.locator('details.experiment-settings');
       if(await settingsDisclosure.count()){
        assert.equal(await settingsDisclosure.locator('input').first().isVisible(),false);
        await settingsDisclosure.locator('summary').focus();await page.keyboard.press('Enter');
        assert.notEqual(await settingsDisclosure.getAttribute('open'),null);
        assert.equal(await settingsDisclosure.locator('input').first().isVisible(),true);
        await page.keyboard.press('Escape');assert.equal(await settingsDisclosure.getAttribute('open'),null);
        assert.equal(await settingsDisclosure.locator('summary').evaluate(e=>e===document.activeElement),true);
       }
       if(reviewNumber===10&&width===1731){
        const before=await experiment.getAttribute('data-model-values'),readouts=await experiment.locator('.experiment-readouts').innerText();
        await page.setViewportSize({width:1280,height:720});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        assert.equal(await experiment.getAttribute('data-model-values'),before);
        assert.equal(await experiment.locator('.experiment-readouts').innerText(),readouts);
        await page.setViewportSize({width,height});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
       }
      const notes=experiment.locator('details.experiment-details');await notes.locator('summary').click();assert.notEqual(await notes.getAttribute('open'),null);assert.ok((await notes.locator('pre').innerText()).length>20);await assertWidgetFits();await notes.locator('summary').focus();await page.keyboard.press('Escape');assert.equal(await notes.getAttribute('open'),null);assert.equal(await current.getAttribute('id'),scene.id);
      const block=scene.blocks.find(b=>b.kind==='chart'&&b.chartType==='experiment');
      if(reviewNumber===36)assert.equal(JSON.parse(await experiment.getAttribute('data-model-values')).df,2);
      if(reviewNumber===44)assert.equal(JSON.parse(await experiment.getAttribute('data-model-values')).n,2);
      if(reviewNumber===10){const domains=await experiment.locator('.experiment-panels > figure > svg').evaluateAll(es=>es.map(e=>e.dataset.xDomain));assert.equal(domains.length,2);assert.equal(domains[0],domains[1]);const markers=await experiment.locator('[data-marker-x]').evaluateAll(es=>es.map(e=>Number(e.dataset.markerX)));assert.deepEqual(markers,[10.1,10.1]);}
       if(reviewNumber===10){await current.getByRole('tab',{name:'Formula & symbols',exact:true}).click();const details=current.locator('details.symbol-legend-disclosure');assert.equal(await details.count(),1);const first=details.first();assert.equal(await first.getAttribute('open'),null);assert.equal(await first.locator('summary').innerText(),'Symbols');assert.equal(await first.locator('.definition-list-description').first().isVisible(),false);await first.locator('summary').click();assert.notEqual(await first.getAttribute('open'),null);assert.equal(await first.locator('.definition-list-description').first().isVisible(),true);assert.equal(await first.locator('.authored-symbol-definitions').count(),2);assert.equal(await first.locator('.symbol-explanation').count(),0);await first.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await first.getAttribute('open'),null);assert.equal(await current.getAttribute('id'),scene.id);await current.getByRole('tab',{name:'Diagram',exact:true}).click();}
      if(reviewNumber===12){assert.doesNotMatch(await experiment.locator('.experiment-readouts').innerText(),/probability|2\.275|0\.02275/);}
      if(reviewNumber===20){assert.doesNotMatch(await experiment.locator('.experiment-readouts').innerText(),/variance ratio|F p/);}
      if(reviewNumber===26)assert.equal(await experiment.locator('[data-experiment-inset]').count(),1);
      if(reviewNumber===66){assert.equal(await experiment.locator('.experiment-source-row').count(),2);assert.match(await experiment.locator('.experiment-source-comparison').innerText(),/not additive/);}
      if(reviewNumber===65){assert.equal(await experiment.getAttribute('data-single-trial'),'true');assert.equal(await experiment.locator('.experiment-panels').isVisible(),false);assert.match(await experiment.locator('.experiment-readouts').innerText(),/First uniform: signal/);}
      if(reviewNumber===63)assert.match(await experiment.locator('.experiment-readouts').innerText(),/Counts differ significantly from stated proportions/);
      if(reviewNumber===62){const expected=experiment.locator('circle[data-experiment-reference="true"]');assert.equal(await expected.count(),5);assert.deepEqual(await expected.evaluateAll(es=>es.map(e=>Number(e.dataset.valueY))),[10,20,40,20,10]);assert.ok((await expected.evaluateAll(es=>es.map(e=>Number(e.getAttribute('r'))))).every(r=>r>=8));assert.equal(await experiment.locator('.experiment-legend-entry[data-experiment-reference="true"]').innerText(),'Expected');}
      if([26,47,48,53,66].includes(reviewNumber))assert.ok(await experiment.locator('[data-experiment-marker]').count()>=3);
     for(const parameter of block.parameters.filter(p=>p.adjustable)){
       const input=experiment.getByRole('spinbutton',{name:parameter.label,exact:true});
       const settings=experiment.locator('details.experiment-settings');
       if(!await input.isVisible())await settings.locator('summary').click();
      const value=parameter.value===parameter.minimum?Math.min(parameter.maximum,parameter.value+parameter.step):parameter.minimum;
       await input.fill(String(value));await input.dispatchEvent('change');
       if(await settings.count()&&await settings.getAttribute('open')!==null)await settings.locator('summary').click();
      assert.equal(await experiment.locator('[aria-invalid="true"]').count(),0,`${scene.id}: ${parameter.key}`);
       assert.equal(JSON.parse(await experiment.getAttribute('data-model-values'))[parameter.key],value);
        if(reviewNumber===63&&parameter.key==='mode')assert.match(await experiment.locator('.experiment-readouts').innerText(),/No significant departure from stated proportions/);
        try{await assertWidgetFits();}catch(error){console.error({scene:scene.id,parameter:parameter.key,value,box:await experiment.boundingBox()});throw error;}
      checks.push(parameter.key);await experiment.getByRole('button',{name:'Reset model'}).click();
     }
     assert.equal(await experiment.locator('.experiment-feedback').innerText(),'');
    }
     if(reviewNumber===37&&width===1731){const answer=current.locator('[data-presentation-disclosure-step="2"]');assert.equal(await answer.getAttribute('data-presentation-disclosure-visible'),'false');await page.locator('body').click({position:{x:2,y:2}});await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('section.present [data-presentation-disclosure-step="1"]')?.getAttribute('data-presentation-disclosure-visible')==='true');await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('section.present [data-presentation-disclosure-step="2"]')?.getAttribute('data-presentation-disclosure-visible')==='true');assert.equal(await answer.getAttribute('data-presentation-disclosure-visible'),'true');}
     if(hasExperiment||[31,37,42,48,59,60,63].includes(reviewNumber))await page.screenshot({path:path.join(output,`${engine}-${width}-N${String(reviewNumber).padStart(2,'0')}.png`)});
    scenes.push({slide:index+2,id:scene.id,experiment:hasExperiment?await experiment.getAttribute('data-experiment-kind'):null,checks});
   }
   if(width===1731){
    await page.getByRole('button',{name:'Switch to script',exact:true}).click();
    const script=page.getByRole('main',{name:'Course script',exact:true});await script.waitFor();
      assert.equal(await script.locator('[data-source-scene-id]').count(),0);
      const thematic=runtime.thematicScripts[0];
      assert.equal(await script.locator('.pcd-script-section').count(),thematic.sections.length);
      const expectedExperiments=thematic.sections.flatMap(s=>s.materials).flatMap(m=>m.blocks).filter(b=>b.kind==='chart'&&b.chartType==='experiment').length;
      assert.equal(await script.locator('.distribution-experiment').count(),expectedExperiments);
      assert.equal(await script.locator('.distribution-experiment input:enabled').count(),0,'Reference figures cannot be changed independently of their authored captions');
      assert.equal(await script.locator('.authored-symbol-definitions').count(),43);
      assert.equal(await script.locator('.self-study-symbol-explanation').count(),0);
      const scriptText=await script.innerText();assert.match(scriptText,/Fixed true population mean/);assert.match(scriptText,/Random normalized variance ratio/);assert.doesNotMatch(scriptText,/Live case: from dilution|Simulated concentration uncertainty/);
    await page.getByRole('button',{name:'Switch to presentation',exact:true}).click();
   }
   assert.deepEqual(rRequests,[],'Experiments must run without initializing R');report.configurations.push({width,height,theme,scenes});await page.close();
  }
 }finally{await browser.close();fs.writeFileSync(path.join(output,`${engine}-complete-report.json`),JSON.stringify(report,null,2));}
   assert.deepEqual(report.errors,[]);console.log(`${engine}: 41 scenes, all experiment parameters, three viewport/theme configurations passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
