/* Local screenshot review of real slides, not just DOM presence.
 * OUTPUT_DIR [theme] [width] [level=4]; retain the original Level 4 entry point. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'../.local/browser-tools/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const out=process.argv[2];if(!out)throw new Error('Specify a disposable output directory');
 const theme=process.argv[3]||'light',width=Number(process.argv[4]||1560),level=Number(process.argv[5]||4);
 assert(Number.isInteger(level)&&level>=0&&level<=5,'Level must be between 0 and 5');
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge'});
 const report={level,theme,width,errors:[],slides:[],failures:[]};
 try{
  const page=await browser.newPage({viewport:{width,height:950},reducedMotion:'reduce'});
  page.on('pageerror',error=>report.errors.push(error.message));
  const base='http://127.0.0.1:5173/';
  const preview=level===5?'authoring-level5-review-complete':`authoring-level${level}-caption-review`;
  const runtime=await(await fetch(base+preview+'-runtime.json')).json();
  await page.goto(base+`authoring.html?preview=${preview}&view=scroll&appearance-controls=hidden&theme=${theme}`);
  await page.locator('.pcd-script-toggle').waitFor();await page.evaluate(()=>document.fonts.ready);
  for(const [index,scene] of runtime.sceneDocuments[0].scenes.entries()){
   const slide=page.locator(`.reveal section[id="${scene.id}"]`);
   await slide.scrollIntoViewIfNeeded();
   for(const image of await slide.locator('img').all()){
    await image.evaluate(el=>el.complete?Promise.resolve():new Promise((resolve,reject)=>{el.addEventListener('load',resolve,{once:true});el.addEventListener('error',reject,{once:true});}));
    assert(await image.evaluate(el=>el.naturalWidth>0),'Authored images must load before visual review');
   }
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const filename=`${String(index+1).padStart(2,'0')}-${scene.id.replace(/^ex:|--scene$/g,'')}.png`;
   const stages=await slide.locator('.fragment:not(.visible)').count();
   if(stages){
    await slide.screenshot({path:path.join(out,filename.replace('.png','.initial.png'))});
    for(let step=0;step<stages;step++)await page.keyboard.press('ArrowRight');
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   }
   // Native disclosure is part of the layout contract too. Inspect the complete
   // formula/legend units, rather than approving a compact collapsed substitute.
   if(process.argv.includes('--legends')){
    await slide.locator('details.symbol-legend-disclosure').evaluateAll(details=>details.forEach(detail=>detail.open=true));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   }
   const geometry=await slide.evaluate(el=>{
    const box=el.getBoundingClientRect(),style=getComputedStyle(el);
    const bounds=node=>{const r=node.getBoundingClientRect();return {x:r.x-box.x,y:r.y-box.y,width:r.width,height:r.height};};
    return {profile:el.dataset.compositionProfile,composition:el.dataset.composition,heading:el.querySelector('h1,h2,h3')?.textContent,
     width:box.width,height:box.height,rows:style.gridTemplateRows,alignItems:style.alignItems,
     regions:[...el.children].filter(n=>n.matches('.pcd-composition-region,[data-composition-region]')).map(n=>({region:n.dataset.compositionRegionContainer||n.dataset.compositionRegion,kind:n.dataset.componentKind,...bounds(n),contentTop:n.firstElementChild?bounds(n.firstElementChild).y:bounds(n).y})),
     visuals:[...el.querySelectorAll('.d3-chart-figure,.formula-with-legend,.teaching-surface')].map(n=>({class:n.className,...bounds(n)})),
     overflow:[...el.querySelectorAll('.pcd-composition-region,.formula-with-legend,.media-reference')].filter(n=>n.clientHeight>0&&(n.scrollHeight>n.clientHeight+3||n.scrollWidth>n.clientWidth+3)).map(n=>({class:n.className,region:n.dataset.compositionRegionContainer,clientHeight:n.clientHeight,scrollHeight:n.scrollHeight,clientWidth:n.clientWidth,scrollWidth:n.scrollWidth})),
     fragmentedTitles:[...el.querySelectorAll('.definition-list-term')].filter(n=>n.children.length!==1||!n.firstElementChild.matches('.definition-list-title')).map(n=>n.dataset.definitionEntryId),
     legacyFlowCards:[...el.querySelectorAll('.d3-flow-svg[data-diagram-type="flow"] .d3-flow-node')].filter(n=>n.dataset.flowCardStyle!=='numbered').map(n=>n.dataset.nodeId),
     flowContentOverflow:[...el.querySelectorAll('.d3-flow-node[data-flow-card-style="numbered"]')].flatMap(node=>{
       const shape=node.querySelector('.d3-flow-node-shape').getBBox();
       return [...node.querySelectorAll('.d3-flow-node-title,.d3-flow-node-label,.d3-flow-node-body,.d3-flow-node-notation,.d3-flow-node-part-title,.d3-flow-node-part-body')].flatMap(text=>{
         const b=text.getBBox();return b.x<shape.x-2||b.y<shape.y-2||b.x+b.width>shape.x+shape.width+2||b.y+b.height>shape.y+shape.height+2?[{node:node.dataset.nodeId,text:text.textContent,box:{x:b.x,y:b.y,width:b.width,height:b.height}}]:[];
       });
     })};
   });
   await slide.screenshot({path:path.join(out,filename)});
   report.slides.push({index:index+1,id:scene.id,file:filename,stages,...geometry});
   if(['scenario-data-visual','info-visual','formula-deck','data-visual','list-data','prompt-code','worked-calculation'].includes(geometry.profile)){
    const peers=geometry.regions.filter(r=>['primary','secondary','prelude','main'].includes(r.region));
    for(let i=0;i<peers.length;i++)for(let j=i+1;j<peers.length;j++){
     const a=peers[i],b=peers[j];
     // Compare real surfaces, not equal-height grid cells with centred children.
     if(Math.abs(a.y-b.y)<2&&Math.abs(a.x-b.x)>10&&Math.abs(a.contentTop-b.contentTop)>2)
      report.failures.push({id:scene.id,regions:[a.region,b.region],delta:Math.abs(a.contentTop-b.contentTop)});
    }
   }
   if(['definition-deck','formula-legend'].includes(geometry.profile)){
    const main=geometry.regions.find(r=>r.region==='main');
    if(main&&Math.abs(main.contentTop-main.y)>2)report.failures.push({id:scene.id,region:'main',delta:Math.abs(main.contentTop-main.y)});
   }
   for(const overflow of geometry.overflow)report.failures.push({id:scene.id,overflow});
   for(const rule of ['fragmentedTitles','legacyFlowCards','flowContentOverflow'])if(geometry[rule].length)report.failures.push({id:scene.id,rule,entries:geometry[rule]});
   const legends=slide.locator('details.symbol-legend-disclosure[open]');
   const scrollable=await legends.evaluateAll(ds=>ds.filter(d=>d.scrollHeight>d.clientHeight+3).length);
   if(scrollable){
    await legends.evaluateAll(ds=>ds.forEach(d=>d.scrollTop=d.scrollHeight));
    await slide.screenshot({path:path.join(out,filename.replace('.png','.legend-end.png'))});
    await legends.evaluateAll(ds=>ds.forEach(d=>d.scrollTop=0));
   }
  }
  // Contact sheets support an actual visual review of every slide, with originals
  // retained for inspecting labels, legends and captions at full resolution.
  await page.setViewportSize({width:1600,height:1200});
  for(let start=0;start<report.slides.length;start+=12){
   await page.setContent('<style>body{margin:0;background:#ddd;display:grid;grid-template-columns:repeat(4,400px)}article{height:400px;font:14px Arial}img{width:395px;height:365px;object-fit:contain;object-position:top}p{margin:5px}</style>'+report.slides.slice(start,start+12).map(s=>`<article><p>${s.index} ${s.profile||s.composition}</p><img src="data:image/png;base64,${fs.readFileSync(path.join(out,s.file)).toString('base64')}"></article>`).join(''));
   await page.screenshot({path:path.join(out,`contact-${start+1}.png`)});
  }
 }finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 console.log(`Level ${level} ${theme} ${width}px: ${report.slides.length} slide screenshots; ${report.errors.length} browser errors; ${report.failures.length} alignment failures`);
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failures,[]);
})().catch(error=>{console.error(error);process.exitCode=1;});
