/* Local thematic-script smoke check. Start the ordinary preview first.
 * Usage: node scripts/check_thematic_script_browser.cjs OUTPUT_DIR [edge|firefox]
 */
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE||'../.local/browser-tools/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const output=process.argv[2];assert(output,'Specify a disposable output directory');fs.mkdirSync(output,{recursive:true});
 const engine=process.argv[3]||'edge';
  const level=Number(process.argv[4]??5);
  const preview=level===5?'authoring-level5-review-complete':`authoring-level${level}-caption-review`;
  const base=`http://127.0.0.1:5173/authoring.html?preview=${preview}&view=scroll&appearance-controls=hidden`;
  const runtime=await(await fetch(`http://127.0.0.1:5173/${preview}-runtime.json`)).json();
 const script=runtime.thematicScripts[0];assert(script);
  const expectedLegends=script.sections.flatMap(s=>s.materials).flatMap(m=>m.blocks).filter(b=>b.kind==='definition-list').reduce((n,b)=>n+b.entries.length,0);
 const browser=await(engine==='firefox'?firefox.launch():chromium.launch({channel:'msedge'}));
 const report={engine,errors:[],themes:[]};
 try{
  for(const theme of ['light','dark']){
   const page=await browser.newPage({viewport:{width:1560,height:950},reducedMotion:'reduce'});
   page.on('pageerror',e=>report.errors.push(e.message));
    const entry=script.sections.find(s=>s.relatedSceneIds.length);assert(entry);
    await page.goto(base+'&theme='+theme+'#/'+encodeURIComponent(entry.relatedSceneIds[0]));await page.locator('.pcd-script-toggle').waitFor();
    const scene=page.locator(`section[id="${entry.relatedSceneIds[0]}"]`);await scene.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300); // settle Reveal's scroll-view active-scene event
   const initial=await page.evaluate(()=>location.hash);
   await page.getByRole('button',{name:'Switch to script',exact:true}).click();
   assert.equal(await page.locator('.pcd-script-section').count(),script.sections.length);
   assert.equal(await page.locator('.thematic-script [data-source-scene-id]').count(),0,'Thematic chapter structure must not be a slide projection');
   assert.equal(await page.locator('.thematic-script .self-study-definition-entry').count(),expectedLegends);
  assert.equal(await page.locator('.thematic-script .katex-error').count(),0);
    const materials=script.sections.flatMap(s=>s.materials);
    assert.equal(await page.locator('.script-material').count(),materials.length);
     assert.equal(await page.locator('.script-material-caption').count(),materials.length);
     const images=page.locator('.thematic-script .self-study-media img');
     const expectedImages=materials.flatMap(m=>m.blocks).filter(b=>b.kind==='media-reference').length;
     assert.equal(await images.count(),expectedImages);
     for(const image of await images.all()){
       await image.scrollIntoViewIfNeeded();
       await image.evaluate(element=>element.complete?Promise.resolve():new Promise((resolve,reject)=>{element.addEventListener('load',resolve,{once:true});element.addEventListener('error',reject,{once:true});}));
       assert(await image.evaluate(element=>element.naturalWidth>0),'Every selected SVG is a real visible image');
     }
     const expectedCharts=materials.flatMap(m=>m.blocks).filter(b=>b.kind==='chart').length;
     const charts=page.locator('.thematic-script .self-study-chart-host');
     assert.equal(await charts.count(),expectedCharts);
      assert(await charts.evaluateAll(hosts=>hosts.every(host=>host.querySelector('svg'))),'Every selected chart has a graphical projection, not just a data table');
      assert(await charts.evaluateAll(hosts=>hosts.every(host=>Number(host.dataset.presentationStepCount??0)===0)),
        'Reading-view charts must show the complete result without slide-stage navigation');
     assert(await page.locator('.script-material .experiment-readouts').evaluateAll(outputs=>outputs.every(output=>getComputedStyle(output).display==='none')),'Script findings appear in authored captions, not duplicate readout grids');
     assert(await page.locator('.script-material .experiment-details pre').evaluateAll(details=>details.every(detail=>detail.textContent.length>20)),'Full numerical details remain available');
    assert.equal(await page.locator('.self-study-narration').evaluateAll(es=>es.some(e=>e.textContent.includes('[[ref:'))),false);
    const references=page.locator('.script-cross-reference');assert(await references.count()>=materials.length);
    assert(await references.evaluateAll(links=>links.every(link=>{
      const target=document.getElementById(link.getAttribute('href').slice(1));
      return target?.dataset.scriptMaterialId===link.dataset.targetMaterialId
        &&target.querySelector('.script-material-caption').textContent.startsWith(link.textContent+'.');
    })),'Every numbered reference resolves to its own captioned occurrence');
    for(const label of ['Fig.','Eq.','Table','Listing']){
      const matches=references.filter({hasText:label});if(!await matches.count())continue;
      const link=matches.first();await link.click();
      assert.equal(await page.evaluate(()=>location.hash),initial,'References must not mutate Reveal navigation');
      assert.equal(await page.evaluate(()=>document.activeElement.dataset.scriptMaterialId),await link.getAttribute('data-target-material-id'));
    }
   const contents=page.locator('.pcd-script-contents a');assert.equal(await contents.count(),script.sections.length);
   await page.locator('.pcd-script-view').evaluate(e=>e.scrollTop=0);
   const target=Math.min(3,script.sections.length-1);await contents.nth(target).click();
   assert.equal(await page.evaluate(()=>location.hash),initial,'Contents must not mutate Reveal navigation');
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.scriptSection),script.sections[target].id);
    await page.screenshot({path:path.join(output,`${engine}-${theme}-script.png`)});
    // Review the complete reading surface in overlapping viewport tiles, not
    // just the table of contents or one conveniently short chapter.
    const pane=page.locator('.pcd-script-view');
    const dimensions=await pane.evaluate(e=>({height:e.clientHeight,total:e.scrollHeight}));
    const tiles=[];
    for(let y=0;y<dimensions.total;y+=Math.max(1,Math.floor(dimensions.height*.85))){
      await pane.evaluate((e,y)=>e.scrollTop=y,y);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const file=`${engine}-${theme}-tile-${tiles.length+1}.png`;await page.screenshot({path:path.join(output,file)});tiles.push(file);
    }
    const contact=await browser.newPage({viewport:{width:1600,height:1200}});
    for(let start=0;start<tiles.length;start+=12){
      await contact.setContent('<style>body{margin:0;display:grid;grid-template-columns:repeat(4,400px);background:#ddd}article{height:400px;font:14px Arial}img{width:395px;height:365px;object-fit:contain;object-position:top}</style>'+tiles.slice(start,start+12).map((file,i)=>`<article><p>${start+i+1}</p><img src="data:image/png;base64,${fs.readFileSync(path.join(output,file)).toString('base64')}"></article>`).join(''));
      await contact.screenshot({path:path.join(output,`${engine}-${theme}-contact-${start+1}.png`)});
    }
    await contact.close();
   await page.setViewportSize({width:390,height:844});
   assert(await page.locator('.pcd-script-view').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Mobile reading pane must not overflow');
   await page.getByRole('button',{name:'Switch to presentation',exact:true}).click();
   assert.equal(await page.locator('.pcd-script-view').isVisible(),false);
   assert.equal(await page.evaluate(()=>location.hash),initial);
   await page.getByRole('button',{name:'Switch to script',exact:true}).click();
   await page.setViewportSize({width:1560,height:950});await page.emulateMedia({media:'print'});
    await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
     assert.equal(await page.locator('.thematic-script .self-study-definition-entry').count(),expectedLegends);
    assert.equal(await page.locator('.script-material-caption').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>0)),true);
    assert.equal(await page.locator('.thematic-script .self-study-definition-entry').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>0&&!e.closest('details:not([open])'))),true);
   if(engine==='edge'&&theme==='light')await page.pdf({path:path.join(output,'thematic-script.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
    report.themes.push({theme,chapters:script.sections.length,completeSymbolGroups:expectedLegends,captionedMaterials:materials.length,references:await references.count()});await page.close();
  }
  assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
 }finally{fs.writeFileSync(path.join(output,`${engine}-report.json`),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
