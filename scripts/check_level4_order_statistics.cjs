/** Local acceptance of order statistics, boxplot reading and histograms. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
let browser;
(async()=>{
  const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173',output=process.env.SCREENSHOT_DIR;
  if(output)fs.mkdirSync(output,{recursive:true});
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const artifact=await(await page.request.get(base+'/authoring-runtime.json')).json();
   const scenes=artifact.sceneDocuments[0].scenes;assert.equal(scenes.length,65);
   const newScenes=scenes.slice(1);assert.equal(newScenes.length,64);
  for(const theme of ['dark','light']){
    await page.goto(`${base}/authoring.html?theme=${theme}&background=none#/${encodeURIComponent(scenes[0].id)}`);
    const opening=page.locator(`section[id="${scenes[0].id}"]`);await opening.waitFor({state:'visible'});
    const colors=await opening.locator('table tbody tr td:first-child').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).color));
    assert.equal(new Set(colors).size,4,'Default tables color all four opening rows, not only two-column tables');
    if(output){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(output,`opening-table-${theme}.png`)});}
  }
  for(const theme of ['dark','light'])for(const model of newScenes){
     await page.goto(`${base}/authoring.html?theme=${theme}&background=none#/${encodeURIComponent(model.id)}`);
     await page.locator('.reveal.ready').waitFor();
    const slide=page.locator('section').filter({has:page.locator(`[id="${model.id}-title"]`)});
    await slide.waitFor({state:'visible'});await page.evaluate(()=>document.fonts.ready);
    await slide.evaluate(s=>s.closest('.scroll-page')?.scrollIntoView({behavior:'instant',block:'start'}));
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     if(model.blocks.some(b=>b.kind==='chart'))await slide.locator('svg').first().waitFor({state:'visible'});
     assert.equal(await slide.locator('.katex-error').count(),0);
     if(model.blocks.some(b=>b.kind==='math')){
       assert.equal(await slide.locator('.formula-with-legend').count(),model.blocks.filter(b=>b.kind==='math').length,`${model.id}: every formula has its visible legend`);
       if(model.id.includes('scene-applied-')){
         const colors=await slide.locator('.formula-with-legend .pcd-math-symbol').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).color));
         assert(new Set(colors).size>=3,`${model.id}: individual formula symbols use distinguishable colors`);
       }
     }
     const profile=model.blocks.some(b=>b.kind==='math')?(model.blocks.length===3?'info-visual':'formula-deck'):model.blocks.some(b=>b.kind==='code')?'prompt-code':model.blocks.some(b=>b.kind==='table')?'scenario-data-visual':model.blocks.some(b=>b.view==='moments')?'diagram':model.blocks.some(b=>b.kind==='chart')?'info-visual':null;
     assert.equal(await slide.getAttribute('data-composition-profile'),profile,model.id);
     const nestedOverflow=await slide.locator('[data-component-kind="info-surface"]').evaluateAll(nodes=>nodes.filter(n=>{const r=n.getBoundingClientRect();return r.top<0||r.bottom>970;}).map(n=>n.textContent.slice(0,100)));
     assert.deepEqual(nestedOverflow,[],`${model.id}: all explanatory text is visible`);
     if(model.id.includes('spread-normal')||model.id.includes('spread-skewed')){
       const bounds=await slide.evaluate(s=>({legend:s.querySelector('.d3-dot-legend').getBoundingClientRect().bottom,title:s.querySelector('.d3-chart-axis-title').getBoundingClientRect().top}));
       assert(bounds.title>bounds.legend,`${model.id}: legend clears the chart-axis title`);
     }
     if(model.id.includes('iqr-applications')){
       const overlap=await slide.locator('.d3-chart-category-label').evaluateAll(labels=>labels.flatMap((a,i)=>labels.slice(i+1).filter(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.min(x.right,y.right)>Math.max(x.left,y.left)&&Math.min(x.bottom,y.bottom)>Math.max(x.top,y.top);}).map(b=>a.textContent+' / '+b.textContent)));
       assert.deepEqual(overlap,[],'IQR category labels do not overlap');
     }
     if(model.blocks.some(b=>b.view==='moments')){
       assert.equal(await slide.locator('[data-panel-view]').count(),9);
       assert.equal(await slide.locator('[data-panel-view="scatter"] [data-observation-id]').count(),300);
       assert.equal(await slide.locator('[data-panel-view="histogram"] rect[data-count]').evaluateAll(nodes=>nodes.reduce((n,d)=>n+Number(d.dataset.count),0)),300);
     }
    const overlaps=await slide.locator('.definition-list-entry').evaluateAll(nodes=>nodes.flatMap(n=>{
      const a=n.querySelector('.definition-list-term')?.getBoundingClientRect(),b=n.querySelector('.definition-list-description')?.getBoundingClientRect();
      return a&&b&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1?[n.textContent]:[];
    }));assert.deepEqual(overlaps,[],`${model.id}: card term and description never overlap`);
    const clipped=await slide.locator('.formula-with-legend .definition-list-description').evaluateAll(nodes=>nodes.flatMap(n=>{
      const b=n.getBoundingClientRect(),clip=n.closest('[data-composition-region-container="main"]')?.getBoundingClientRect();
      return clip&&(b.bottom>clip.bottom+1||b.top<clip.top-1)?[n.textContent]:[];
    }));assert.deepEqual(clipped,[],`${model.id}: formula legend visible without scrolling`);
    const overflow=await slide.evaluate(s=>[...s.children].filter(n=>n.getBoundingClientRect().height>0).map(n=>({kind:n.getAttribute('data-composition-region')||n.getAttribute('data-composition-region-container'),top:n.getBoundingClientRect().top,bottom:n.getBoundingClientRect().bottom})).filter(r=>r.bottom>970||r.top<0));
    if(output)await page.screenshot({path:path.join(output,model.id.split('l4-scene-')[1].replace('--scene','')+'-'+theme+'.png')});
    assert.deepEqual(overflow,[],`${model.id} ${theme}: content clears slide navigation`);
    if(model.id.includes('box-construction'))assert.equal(await slide.locator('.d3-box-body').count(),1);
    if(model.id.includes('box-applications')){
      assert.equal(await slide.locator('.d3-box-body').count(),3);
    }
    if(model.id.includes('box-limits'))assert.equal(await slide.locator('.d3-box-body').count(),2);
    for(const chart of model.blocks.filter(b=>b.chartType==='histogram'||b.chartType==='histogram2d')){
      const selector=chart.chartType==='histogram'?'.d3-histogram-bin':'.d3-histogram-cell';
      assert.equal(await slide.locator(selector).evaluateAll(nodes=>nodes.reduce((n,d)=>n+Number(d.dataset.count),0)),chart.data.length);
      if(chart.chartType==='histogram')assert(await slide.locator(selector).evaluateAll(nodes=>Math.max(...nodes.map(n=>Number(n.getAttribute('height'))))>200),'Histogram vertical scale resolves the actual counts/densities');
    }
   }
   // Exercise real controls, not only the authored initial graph.
   const adjustable=scenes.find(s=>s.id.includes('histogram-rule-example'));
   await page.goto(`${base}/authoring.html?theme=dark&background=none#/${encodeURIComponent(adjustable.id)}`);
   await page.locator('.reveal.ready').waitFor();
   const adjustableSlide=page.locator(`section[id="${adjustable.id}"]`),controls=adjustableSlide.locator('.histogram-controls');
   await controls.waitFor();
   const countAll=async()=>assert.equal(await adjustableSlide.locator('.d3-histogram-bin').evaluateAll(nodes=>nodes.reduce((n,d)=>n+Number(d.dataset.count),0)),100);
   for(const width of ['0.5','5.75','60'])for(const shift of ['-0.5','0.5']){
     await controls.locator('input').nth(0).evaluate((n,v)=>{n.value=v;n.dispatchEvent(new Event('input',{bubbles:true}));},width);
     await controls.locator('input').nth(1).evaluate((n,v)=>{n.value=v;n.dispatchEvent(new Event('input',{bubbles:true}));},shift);
     await countAll();
     assert((await controls.locator('output').innerText()).startsWith(`Width ${Number(width)} a.u.;`),'Readout reports bin width, not viewport width');
   }
   for(const rule of ['Freedman–Diaconis','Scott','Sturges']){await controls.getByRole('button',{name:rule,exact:true}).click();await countAll();}
   await controls.getByRole('button',{name:'Reset bins'}).click();assert.equal(await controls.locator('input').nth(0).inputValue(),'5');assert.match(await controls.locator('output').innerText(),/^Width 5 a.u.;/);
   await controls.locator('input').nth(0).focus();await page.keyboard.press('ArrowRight');await countAll();
   assert.equal(decodeURIComponent(new URL(page.url()).hash).includes('histogram-rule-example'),true,'Slider key stays within its scene');
   if(output)await page.screenshot({path:path.join(output,'histogram-adjusted.png')});
   for(const slug of ['ecdf-worked','ecdf-river','ecdf-shapes','ecdf-crossing','ecdf-inverse']){
     const model=scenes.find(s=>s.id.includes(`scene-${slug}--`));
     await page.goto(`${base}/authoring.html?theme=dark&background=none#/${encodeURIComponent(model.id)}`);await page.locator('.reveal.ready').waitFor();
     const s=page.locator(`section[id="${model.id}"]`);await s.locator('.oe-current').first().waitFor();
     assert.equal(await s.locator('.oe-rows .oe-observation').count(),0);
     assert.equal(await s.locator('.oe-readout, .oe-description').count(),0,'No extra ECDF header boxes or text');
     assert.equal(await s.locator('.observation-explorer input, .observation-explorer button, .oe-controls').count(),0,'Static ECDF has no threshold controls');
     assert.equal(await s.locator('.observation-chart-host[data-presentation-interactive], .observation-explorer[data-presentation-interactive]').count(),0);
     if(slug==='ecdf-river'){
       assert.match(await s.locator('.oe-data pre').textContent(),/24\s*\/\s*50/);
     }else if(['ecdf-shapes','ecdf-crossing'].includes(slug))assert.equal(await s.locator('[data-series-id]').count(),4);
     else if(slug==='ecdf-worked')assert.match(await s.locator('.oe-data pre').textContent(),/3\s*\/\s*7/);
   }
   if(process.env.RUN_R==='1'){
    const model=newScenes.find(s=>s.id.includes('box-lab'));assert(model);
    await page.goto(`${base}/authoring.html?theme=dark&background=none&interactive=1#/${encodeURIComponent(model.id)}`);
    const slide=page.locator(`section[id="${model.id}"]`);await slide.locator('.cm-content').waitFor();
    assert(!await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/webr/'))),'R stays lazy until Run');
    const run=slide.getByRole('button',{name:'Run',exact:true});await run.click();
    await page.waitForFunction(id=>{const s=document.getElementById(id),b=s?.querySelector('.code-run-button'),o=s?.querySelector('.code-output');return b&&!b.disabled&&o&&!/Loading R runtime/.test(o.textContent);},model.id,{timeout:300000});
    const text=await slide.locator('.code-output').innerText();
    if(output)fs.writeFileSync(path.join(output,'ggplot-output.txt'),text);
    assert(!text.startsWith('Error:'),text);assert.match(text,/lower.*middle.*upper.*ymin.*ymax.*outliers/s);
    assert.match(text,/1\s+97\.55\s+100(?:\.0)?\s+102\.45\s+95\.1\s+104\.9/);
    assert.match(text,/2\s+90\.20\s+100(?:\.0)?\s+109\.80\s+80\.4\s+119\.6/);
    assert.match(text,/3\s+80\.60\s+90\.4\s+100\.20\s+70\.8\s+110/);
    const show=slide.locator('.code-plot-button');await show.waitFor({state:'visible'});await show.focus();await page.keyboard.press('Enter');
    const dialog=page.locator('.pcd-r-plot-dialog[open]');await dialog.waitFor();
    assert(await dialog.locator('canvas').count()>0);
    assert(await dialog.locator('canvas').first().evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return data.some((v,i)=>i%4!==3&&v<200);}),'Real ggplot pixels are present');
    if(output)await page.screenshot({path:path.join(output,'box-lab-ggplot.png')});
    await page.keyboard.press('Escape');assert.equal(await page.locator('.pcd-r-plot-dialog[open]').count(),0);
    assert.equal(await show.evaluate(n=>document.activeElement===n),true);
    await slide.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await show.isVisible(),false);
    const editor=slide.locator('.cm-content');
    const code=model.blocks.find(b=>b.kind==='code').code;
    const restored=code.replace('d$value[150] <- 110','d$value[150] <- 140');assert.notEqual(code,restored);
     await editor.locator('.cm-line').first().click();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.insertText(restored);await run.click();
    await page.waitForFunction(id=>!document.getElementById(id).querySelector('.code-run-button').disabled,model.id,{timeout:120000});
    const restoredOutput=await slide.locator('.code-output').innerText();
    assert(!restoredOutput.startsWith('Error:'),restoredOutput);
    assert.match(restoredOutput,/3\s+80\.60\s+90\.4\s+100\.20\s+70\.8\s+109\.2\s+140/);
    if(output)fs.writeFileSync(path.join(output,'ggplot-edited-output.txt'),restoredOutput);
    await slide.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await show.isVisible(),false);
    // Existing Variance text-only examples still print every top-level expression.
     await editor.locator('.cm-line').first().click();await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('as.character(packageVersion("ggplot2"))\na <- c(9, 10, 13)\nmean(a)\nvar(a)\nsd(a)');await run.click();
    await page.waitForFunction(id=>!document.getElementById(id).querySelector('.code-run-button').disabled,model.id,{timeout:60000});
    const values=await slide.locator('.code-output').innerText();for(const expected of ['10.666','4.333','2.081'])assert(values.includes(expected),values);
    if(output)fs.writeFileSync(path.join(output,'legacy-r-output.txt'),values);
    assert.equal(await show.isVisible(),false);
    const histogram=newScenes.find(s=>s.id.includes('histogram-lab'));assert(histogram);
    await page.goto(`${base}/authoring.html?theme=dark&background=none#/${encodeURIComponent(histogram.id)}`);
    const hs=page.locator(`section[id="${histogram.id}"]`);await hs.locator('.cm-content').waitFor();
    const hr=hs.getByRole('button',{name:'Run',exact:true});await hr.click();
    await page.waitForFunction(id=>!document.getElementById(id).querySelector('.code-run-button').disabled,histogram.id,{timeout:300000});
    const histText=await hs.locator('.code-output').innerText();assert(!histText.startsWith('Error:'),histText);assert.match(histText,/xmin.*xmax.*count.*density/s);assert.match(histText,/\[1\] 100/);
    if(output)fs.writeFileSync(path.join(output,'histogram-r-output.txt'),histText);
    await hs.locator('.code-plot-button').click();await page.locator('.pcd-r-plot-dialog[open] canvas').waitFor();
    if(output)await page.screenshot({path:path.join(output,'histogram-lab-ggplot.png')});await page.keyboard.press('Escape');
    await hs.evaluate(s=>s.closest('.scroll-page')?.scrollIntoView({behavior:'instant',block:'start'}));
    const he=hs.locator('.cm-content');await he.locator('.cm-line').first().click();await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(histogram.blocks.find(b=>b.kind==='code').code.replace('bin_width <- 4','bin_width <- 40'));await hr.click();
    await page.waitForFunction(id=>!document.getElementById(id).querySelector('.code-run-button').disabled,histogram.id,{timeout:60000});
    const coarse=await hs.locator('.code-output').innerText();assert.match(coarse,/30\s+70\s+100/);assert.match(coarse,/\[1\] 100/);
    if(output)fs.writeFileSync(path.join(output,'histogram-r-coarse-output.txt'),coarse);
     await hs.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await hs.locator('.code-plot-button').isVisible(),false);
     const moment=scenes.find(s=>s.id.includes('moment-lab'));assert(moment);
     await page.goto(`${base}/authoring.html?theme=dark&background=none#/${encodeURIComponent(moment.id)}`);
     const ms=page.locator(`section[id="${moment.id}"]`);await ms.locator('.cm-content').waitFor();
     const mr=ms.getByRole('button',{name:'Run',exact:true});await mr.click();
     await page.waitForFunction(id=>!document.getElementById(id).querySelector('.code-run-button').disabled,moment.id,{timeout:180000});
     const moments=await ms.locator('.code-output').innerText();assert(!/Error:/.test(moments),moments);assert.match(moments,/sample variance = 100/);assert.match(moments,/m2 = 99/);assert.match(moments,/Counterexample: mean = 0 ; m3 = 0/);
     if(output)fs.writeFileSync(path.join(output,'moments-r-output.txt'),moments);
     await ms.locator('.code-plot-button').click();await page.locator('.pcd-r-plot-dialog[open] canvas').waitFor();
     if(output)await page.screenshot({path:path.join(output,'moments-r-plot.png')});await page.keyboard.press('Escape');
     await ms.locator('.cm-line').first().click();await page.keyboard.press('ControlOrMeta+A');
     await page.keyboard.insertText(moment.blocks.find(b=>b.kind==='code').code.replace('offset <- 0','offset <- 100').replace('scale_factor <- 1','scale_factor <- 2'));await mr.click();
     await page.waitForFunction(id=>!document.getElementById(id).querySelector('.code-run-button').disabled,moment.id,{timeout:60000});
     const transformed=await ms.locator('.code-output').innerText();assert(!/Error:/.test(transformed),transformed);assert.match(transformed,/sample variance = 400/);assert.match(transformed,/m2 = 396/);
     if(output)fs.writeFileSync(path.join(output,'moments-r-transformed-output.txt'),transformed);
   }
   assert.deepEqual(errors,[]);console.log('PASS: 64 post-opening slides; Light/Dark, visible formula legends, non-overlapping labels, 3×3 moment panels, counts and bounds; bin controls and clean static ECDFs'+(process.env.RUN_R==='1'?'; all three real R labs, edited reruns and legacy text R.':'.'));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
