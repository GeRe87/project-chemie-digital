/* Local review previews; deliberately does not build or publish a course. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'../.local/browser-tools/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const walk=blocks=>blocks.flatMap(block=>[block,...(block.children?walk(block.children):[])]);
(async()=>{
 const out=process.argv[2];assert(out,'Specify a disposable output directory');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge'}),report={errors:[],modules:[]};
 try{
  for(let level=0;level<5;level++){
   const stem=`authoring-level${level}-caption-review`,base='http://127.0.0.1:5173/';
   const runtime=await(await fetch(base+stem+'-runtime.json')).json();
   const scenes=runtime.sceneDocuments.flatMap(d=>d.scenes),blocks=scenes.flatMap(s=>walk(s.blocks));
   for(const theme of ['light','dark']){
    const page=await browser.newPage({viewport:{width:1560,height:950},reducedMotion:'reduce'});
    page.on('pageerror',error=>report.errors.push({level,theme,message:error.message}));
    await page.goto(base+`authoring.html?preview=${stem}&view=scroll&appearance-controls=hidden&theme=${theme}`);
    await page.locator('.pcd-script-toggle').waitFor();
    assert.equal(await page.locator('.katex-error').count(),0);
    for(const scene of scenes){
     const element=page.locator(`.reveal section[id="${scene.id}"]`);
     await element.scrollIntoViewIfNeeded();
     for(const image of await element.locator('img').all()){
      await image.evaluate(el=>el.complete?Promise.resolve():new Promise((resolve,reject)=>{el.onload=resolve;el.onerror=reject;}));
      assert(await image.evaluate(el=>el.naturalWidth>0));
     }
    }
    assert.equal(await page.locator('.reveal .media-caption').count(),blocks.filter(b=>b.kind==='media-reference'&&b.caption).length);
    const hiddenFlowCaptions=await page.locator('.reveal .d3-flow-host .d3-flow-caption').evaluateAll(captions=>captions.filter(caption=>getComputedStyle(caption).display==='none'||caption.getBoundingClientRect().width<10).map(caption=>caption.closest('section[id]')?.id));
    assert.deepEqual(hiddenFlowCaptions,[],'Authored flow captions must not be hidden by composition CSS');
    assert.equal(await page.locator('.pcd-script-toggle').isDisabled(),level<3);
    const entry={level,theme,scenes:scenes.length,script:false};
    if(level>=3){
     await page.getByRole('button',{name:'Switch to script',exact:true}).click();
     const pane=page.locator('.pcd-script-view');
     assert.equal(await pane.locator('.self-study-section').count(),scenes.length);
     const charts=pane.locator('.self-study-chart-host');
     assert.equal(await charts.count(),blocks.filter(b=>b.kind==='chart').length);
     assert(await charts.evaluateAll(hosts=>hosts.every(host=>host.querySelector('svg'))));
     assert(await pane.locator('.self-study-media').evaluateAll(figures=>figures.every(figure=>figure.querySelector('figcaption')?.textContent.trim())));
     assert(await pane.locator('.self-study-dot-plot,.self-study-scientific-chart,.self-study-chart').evaluateAll(figures=>figures.every(figure=>{const caption=figure.querySelector(':scope > figcaption');return caption?.textContent.trim()&&getComputedStyle(caption).display!=='none';})));
     assert.equal(await pane.locator('.katex-error').count(),0);
     await page.screenshot({path:path.join(out,`level${level}-${theme}-script.png`)});
     await page.setViewportSize({width:390,height:844});
     assert(await pane.evaluate(el=>el.scrollWidth<=el.clientWidth+2),'Script must fit the mobile reading pane');
     entry.script=true;entry.charts=await charts.count();
    }
    report.modules.push(entry);await page.close();
   }
  }
  assert.deepEqual(report.errors,[]);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
