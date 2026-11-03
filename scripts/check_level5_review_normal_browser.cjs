/* Local normal-pilot states and actual R replay. Pass --r for four R cases. */
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE || '../.local/browser-tools/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const runtime=JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/pitch/public/authoring-level5-review-normal-runtime.json'),'utf8'));
const scene=runtime.sceneDocuments[0].scenes.find(s=>s.id==='ex:rv-n08--scene');
const model=scene.blocks.find(b=>b.kind==='chart'),source=scene.blocks.find(b=>b.kind==='code').code;
(async()=>{
 const output=process.argv[2],engine=process.argv[3]||'edge',execute=process.argv.includes('--r');assert(output,'Specify local output directory');fs.mkdirSync(output,{recursive:true});
 const browser=await(engine==='firefox'?firefox.launch():chromium.launch({channel:'msedge'})),report={engine,errors:[],configurations:[],r:[]};
 try{
  for(const [width,height,theme] of [[1731,1006,'light'],[1280,720,'dark'],[390,844,'light']]){
   const page=await browser.newPage({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});
   const rRequests=[];page.on('request',request=>{if(request.url().includes('/vendor/webr/'))rRequests.push(request.url());});
   page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto(`http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-normal&view=deck&theme=${theme}${execute?'&interactive=1':''}#/ex:rv-n08--scene`);
   await page.locator('.pcd-slides-pdf-link').waitFor();await page.evaluate(()=>document.fonts.ready);
   const current=page.locator('section.present'),select=current.getByRole('combobox',{name:'Saved experiment state'}),states=[];
   let ticks;
   for(const [i,state]of model.states.entries()){
    await select.selectOption(String(i));
    const counts=await current.locator('.d3-histogram-bin').evaluateAll(bins=>bins.map(b=>Number(b.dataset.count)));
    assert.deepEqual(counts,state.binCounts);
    assert.match(await current.locator('.histogram-readout').innerText(),new RegExp(`${counts.reduce((a,b)=>a+b,0)} published results`));
    assert.equal(await current.locator('svg[data-histogram-state]').getAttribute('data-histogram-state'),state.id);
    const now=await current.locator('.d3-chart-tick-label').allTextContents();if(ticks)assert.deepEqual(now,ticks);else ticks=now;
    states.push({id:state.id,count:counts.reduce((a,b)=>a+b,0)});
    await current.locator('figure').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,`${engine}-${width}-${i}.png`)});
   }
   await current.getByRole('button',{name:'Reset experiment'}).click();assert.equal(await select.inputValue(),'0');
   assert.deepEqual(rRequests,[],'State changes must not initialize R');
   if(execute&&width===1731){
    const details=current.locator('.pcd-optional-material');await details.locator('summary').click();
    const editor=details.locator('.cm-content');await editor.waitFor();
    for(const [i,n]of [20,50,100,1000].entries()){
     const marker=`NORMAL_PREFIX_OK_${n}`;
     const script=source.replace('M <- 20',`M <- ${n}`)+`\nstopifnot(identical(as.integer(h$counts),as.integer(c(${model.states[i].binCounts.join(',')}))))\ncat('${marker}\\n')`;
     await editor.evaluate((element,script)=>{const view=element.cmTile.view;view.dispatch({changes:{from:0,to:view.state.doc.length,insert:script}});if(view.state.doc.toString()!==script)throw Error('Editor replacement mismatch');},script);
     await details.getByRole('button',{name:'Run',exact:true}).click();
     await page.waitForFunction(marker=>document.querySelector('section.present .code-output')?.textContent.includes(marker),marker,{timeout:120000});
     const text=await details.locator('.code-output').innerText();assert(!/error:/i.test(text),text);
     await details.locator('.code-plot-button').click();await page.locator('dialog[open] canvas').waitFor();await page.keyboard.press('Escape');report.r.push({n,marker,plots:1});
    }
    await details.getByRole('button',{name:'Reset',exact:true}).click();
   }
   report.configurations.push({width,height,theme,states});await page.close();
  }
 }finally{await browser.close();fs.writeFileSync(path.join(output,`${engine}-normal-report.json`),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));assert.deepEqual(report.errors,[]);
})().catch(e=>{console.error(e);process.exitCode=1;});
