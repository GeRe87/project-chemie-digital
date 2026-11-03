/* Local screen-layout audit, deliberately separate from the PDF fitter. */
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE||'../.local/browser-tools/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const runtime=JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/pitch/public/authoring-level5-review-complete-runtime.json'),'utf8'));
(async()=>{
 const output=process.argv[2],engine=process.argv[3]||'edge';if(!output)throw Error('Specify an output directory');fs.mkdirSync(output,{recursive:true});
 const browser=await(engine==='firefox'?firefox.launch():chromium.launch({channel:'msedge'}));const report={engine,configurations:[],errors:[]};
 try{
  for(const [view,width,height]of [['deck',1731,1006],['deck',1280,720],['scroll',1731,1006]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto(`http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=${view}&clean=1&theme=light`);
   await page.locator('.pcd-slides-pdf-link').waitFor({timeout:120000});await page.evaluate(()=>document.fonts.ready);const scenes=[];
   for(const scene of runtime.sceneDocuments[0].scenes){
     if(view==='deck'){await page.evaluate(id=>{location.hash='/'+id;},scene.id);await page.waitForFunction(id=>document.querySelector('section.present')?.id===id,scene.id);}
     const current=page.locator(`section[id="${scene.id}"]`);
     if(view==='scroll')await current.scrollIntoViewIfNeeded();
     await current.evaluate(s=>{s.querySelectorAll('.fragment').forEach(e=>e.classList.add('visible'));s.querySelectorAll('[data-presentation-disclosure-visible]').forEach(e=>{e.dataset.presentationDisclosureVisible='true';e.removeAttribute('aria-hidden');});});
     const audit=await current.evaluate((slide,view)=>{
      const bounds=slide.getBoundingClientRect().toJSON();if(view==='deck'){bounds.bottom=Math.min(bounds.bottom,innerHeight);bounds.right=Math.min(bounds.right,innerWidth);}
      const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&r.width>0&&r.height>0&&!e.closest('.katex-mathml,math,details:not([open]) > :not(summary)');};
     const selector='h1,h2,h3,p,li,dt,dd,.math-display,.katex-html .base,.experiment-description,.experiment-readouts span,.experiment-panels > figure > svg,.media-reference img';
     const clipped=[],scrolling=[],prose=[];
     for(const e of slide.querySelectorAll(selector)){
      if(!visible(e)||e.closest('dialog,.experiment-details,.code-example-optional'))continue;
      const r=e.getBoundingClientRect(),text=e.textContent.trim().slice(0,100);
      if(r.left<bounds.left-3||r.right>bounds.right+3||r.top<bounds.top-3||r.bottom>bounds.bottom+3)clipped.push({reason:'outside slide',tag:e.tagName,text});
      for(let parent=e.parentElement;parent&&parent!==slide;parent=parent.parentElement){
       const s=getComputedStyle(parent),p=parent.getBoundingClientRect();
       if(/hidden|clip/.test(s.overflowY)&&r.bottom>p.bottom+3&&r.top<p.bottom)clipped.push({reason:'clipped by '+parent.className,tag:e.tagName,text});
      }
      if(['P','DD'].includes(e.tagName)&&!e.closest('.symbol-explanation,.scene-topic,.experiment-note')){const words=e.innerText.trim().split(/\s+/).length;if(words>55&&!e.querySelector('ul,ol'))prose.push({words,text});}
     }
     for(const e of slide.querySelectorAll('.pcd-composition-region,.distribution-experiment,.definition-list'))if(visible(e)&&/auto|scroll/.test(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+4)scrolling.push({class:e.className,overflow:e.scrollHeight-e.clientHeight});
     return{id:slide.id,title:slide.querySelector('h2')?.textContent,clipped,scrolling,prose};
    },view);scenes.push(audit);
    if(audit.clipped.length||audit.scrolling.length)await page.screenshot({path:path.join(output,`${engine}-${view}-${width}-${scene.id.replaceAll(':','_')}.png`)});
   }
   report.configurations.push({view,width,height,scenes});await page.close();
  }
 }finally{await browser.close();fs.writeFileSync(path.join(output,`${engine}-layout.json`),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({engine,errors:report.errors,configurations:report.configurations.map(c=>({view:c.view,width:c.width,clipped:c.scenes.filter(s=>s.clipped.length).map(s=>({id:s.id,problems:s.clipped.length})),scrolling:c.scenes.filter(s=>s.scrolling.length).map(s=>({id:s.id,surfaces:s.scrolling})),longProse:c.scenes.filter(s=>s.prose.length).map(s=>({id:s.id,paragraphs:s.prose}))}))},null,2));
 if(report.errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
