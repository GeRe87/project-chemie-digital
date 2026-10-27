/** Browser regression for the source-authored #296 revisions, including every stage. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {pathToFileURL} from "node:url";

const [base="http://127.0.0.1:5196", modulePath, executablePath, screenshots, axePath] = process.argv.slice(2);
if (!modulePath) throw new Error("Supply the absolute Playwright index.mjs path");
const {chromium} = await import(pathToFileURL(modulePath).href);
const manifest = await (await fetch(`${base}/course-runtime/manifest.json`)).json();
const entry = manifest.documents[0];
const artifact = await (await fetch(`${base}/${entry.runtime}`)).json();
const scenes = artifact.sceneDocuments[0].scenes;
assert.equal(scenes.length, 29);
const names = ["overview","heating","capture","markers","process-variance","nesting","temperature-program","calibration-time","fifo-design","processing","fair","semantics","processing-unit","validation","ai","thanks"];
const axe = axePath ? await fs.readFile(axePath,"utf8") : undefined;
const browser = await chromium.launch({headless:true, ...(executablePath ? {executablePath} : {})});
let cases=0, stages=0;
try {
  for (const viewport of [{width:1440,height:900},{width:390,height:844}]) for (const theme of ["dark","light"]) for (const reducedMotion of ["no-preference","reduce"]) {
    for (const name of names) {
      // Each direct-entry case starts without a previous learner/fragment state.
      const context = await browser.newContext({viewport,reducedMotion});
      try {
        const page=await context.newPage(), errors=[];
        page.on("pageerror",error=>errors.push(error.message));
        page.on("response",response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
        const id=`ex:ted-scene-${name}--scene`, scene=scenes.find(scene=>scene.id===id);
        assert.ok(scene);
        const url=new URL(base);url.searchParams.set("theme",theme);url.searchParams.set("level",entry.id);url.hash=`/${encodeURIComponent(id)}`;
        await page.goto(url.href,{waitUntil:"networkidle"});
        await page.waitForFunction(id=>document.querySelector("section.present")?.id===id,id);
        const current=page.locator("section.present"), host=current.locator("[data-presentation-step-count]").first();
        const count=await host.count() ? Number(await host.getAttribute("data-presentation-step-count")) : 0;
        if(count) await page.waitForFunction(id=>document.getElementById(id)?.querySelector("[data-presentation-step-count]")?.dataset.presentationStep==="1",id);
        if(name==="markers") assert.equal(count,5);
        if(name==="validation") assert.equal(count,2);
        if(name==="processing" || name==="processing-unit" || name==="ai" || name==="nesting") assert.equal(count,3);
        for(let step=1;step<=Math.max(1,count);step++) {
          if(step>1) {
            await page.keyboard.press("ArrowRight");
            await page.waitForFunction(({id,step})=>document.getElementById(id)?.querySelector("[data-presentation-step-count]")?.dataset.presentationStep===String(step),{id,step});
          }
          await page.waitForTimeout(reducedMotion==="reduce" ? 80 : 450);
          assert.equal(await current.getAttribute("id"),id);
          if(name==="markers") {
            const inset=current.locator(".d3-chart-annotation-media");
            assert.equal(await inset.count(),1);
            assert.equal(await inset.evaluate(el=>getComputedStyle(el.parentElement).opacity),step>=4?"1":"0");
            for(const dash of await current.locator('.d3-chart-line').evaluateAll(es=>es.map(e=>getComputedStyle(e).strokeDasharray))) assert.equal(dash,"none");
            if(step===4) {
              const geometry=await inset.evaluate(el=>{const peak=el.parentElement.querySelector('circle');return {x:+el.getAttribute('x'),y:+el.getAttribute('y'),w:+el.getAttribute('width'),px:+peak.getAttribute('cx'),py:+peak.getAttribute('cy')};});
              assert.ok(geometry.px<geometry.x || geometry.px>geometry.x+geometry.w,"inset obscures selected marker");
              assert.ok(geometry.y>0);
              assert.ok((await inset.getAttribute('href')).endsWith(theme==='dark'?'spectrum-dark.svg':'spectrum.svg'));
              await page.keyboard.press('Alt+t');
              await page.waitForTimeout(100);
              assert.ok((await inset.getAttribute('href')).endsWith(theme==='light'?'spectrum-dark.svg':'spectrum.svg'));
              await page.keyboard.press('Alt+t');
            }
          }
          if(name==="processing-unit") {
            const anchored=current.locator("path[data-source-part-id]");
            assert.equal(await anchored.count(),step-1);
            if(step>=2) assert.equal(await anchored.first().getAttribute("data-source-part-id"),"ex:ted-unit-part-concept");
            if(step===3) assert.equal(await anchored.last().getAttribute("data-target-part-id"),"ex:ted-unit-part-average");
            if(step>=2) {
              const reference=current.locator('.d3-flow-part-reference');
              assert.match(await reference.getAttribute('d'),/^M[\d.]+ [\d.]+V[\d.]+H/,'reference must descend before travelling left');
              assert.ok(await reference.evaluate(e=>{const r=e.getBBox(),v=e.ownerSVGElement.viewBox.baseVal;return r.x>=v.x&&r.y>=v.y&&r.x+r.width<=v.x+v.width&&r.y+r.height<=v.y+v.height;}),'reference route is outside the diagram canvas');
            }
          }
          if(name==="processing" && step===3) {
            assert.equal(await current.locator(".d3-flow-edge-label-group.d3-flow-edge-state-active").count(),4);
            const active=await current.locator('.d3-flow-edge-label-group.d3-flow-edge-state-active rect').first().evaluate(e=>getComputedStyle(e).fill);
            assert.notEqual(active,await current.evaluate(e=>getComputedStyle(e).getPropertyValue('--pcd-surface-strong').trim()));
          }
          if(name==='thanks') for(const text of ['Gerrit Renner','gerrit.renner@uni-due.de','www.uni-due.de/iac','talks.odea-project.org']) assert.ok((await current.textContent()).includes(text));
          if(name==='validation') assert.equal(await current.locator('image[href*="ted-validation-failure"]').count(),step===1?1:0);
          if(name==='ai') {
            const fills=await current.locator('.d3-flow-edge-label-panel').evaluateAll(es=>es.map(e=>getComputedStyle(e).fill));
            assert.ok(fills.length>0);
            if(theme==='light') for(const fill of fills) {const rgb=fill.match(/[\d.]+/g).map(Number);assert.ok(rgb[0]+rgb[1]+rgb[2]>400,'dark connector panel in light mode');}
          }
          if(name==="validation") assert.ok((await current.locator(".d3-flow-svg").textContent()).includes(step===1?"SHACL: failed":"SHACL: passed"));
          if(name==="heating") assert.equal(await current.locator(".pcd-list-item-details li").count(),1);
          if(name==="nesting" || name==="calibration-time") {
            const chart=scene.blocks.find(block=>block.kind==="chart");
            const expected=new Set(chart.scenarios.flatMap(s=>s.lanes.flatMap(l=>l.intervals.filter(i=>i.showRunLabel).map(i=>i.id))));
            const labels=await current.locator(".d3-timeline-run").evaluateAll(es=>es.map(e=>e.getAttribute("data-interval-id")));
            assert.equal(labels.length,expected.size);
            for(const label of labels) assert.ok(expected.has(label));
          }
          const bounds=await current.evaluate(section=>{
            const r=element=>{const b=element.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
            const items=[...section.querySelectorAll("h2,.teaching-svg,.formula-with-legend,.pcd-diagram-dialog-launcher,.keypoint-list,.code-block")].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height;});
            return {items:items.map(r),overflow:document.documentElement.scrollWidth>innerWidth+2||document.documentElement.scrollHeight>innerHeight+2};
          });
          assert.equal(bounds.overflow,false,`${name}: document overflow`);
          for(const b of bounds.items) assert.ok(b.x>=-2&&b.y>=-2&&b.x+b.width<=viewport.width+2&&b.y+b.height<=viewport.height+2,`${name} stage ${step}: clipped content ${JSON.stringify(b)}`);
          if(name==="process-variance" || name==="fair") {
            assert.equal(await current.locator('svg.teaching-svg').count(),1,'SVG failed safe inline enhancement');
            const panel=current.locator('svg.teaching-svg rect').first();
            const before=await panel.evaluate(e=>getComputedStyle(e).fill);
            await page.keyboard.press('Alt+t');
            assert.notEqual(await panel.evaluate(e=>getComputedStyle(e).fill),before,'illustration did not respond to theme change');
            await page.keyboard.press('Alt+t');
            const unit=current.locator(".formula-with-legend");
            assert.equal(await unit.count(),1);
            assert.ok(await unit.locator(".definition-list-description").isVisible());
          }
          if(screenshots&&reducedMotion==="no-preference") {
            await fs.mkdir(screenshots,{recursive:true});
            await page.screenshot({path:`${screenshots}/${name}-${step}-${viewport.width}-${theme}.png`});
          }
          stages++;
        }
        if(name==="semantics" && viewport.width<700) {
          const heading=await current.locator("h2").boundingBox();
          const primary=current.locator('[data-composition-region-container="primary"]');
          const primaryBox=await primary.boundingBox();
          assert.ok(heading.y+heading.height<=primaryBox.y,"scrollable explanation overlaps heading");
          for(const pane of [primary,current.locator(".code-static-fallback")]) {
            await pane.focus();await page.keyboard.press("PageDown");await page.waitForTimeout(180);
            assert.ok(await pane.evaluate(element=>element.scrollTop)>0,"native keyboard scrolling failed");
            assert.equal(await current.getAttribute("id"),id,"scroll key navigated away from the source example");
          }
        }
        if(axe) {
          await page.addScriptTag({content:axe});
          const violations=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
          assert.deepEqual(violations,[],`${name}: accessibility regression`);
        }
        assert.deepEqual(errors,[]);
        cases++;
      } finally {await context.close();}
    }
  }
  console.log(JSON.stringify({passed:cases,stages,viewports:2,themes:2,motionModes:2,axe:!!axe},null,2));
} finally {await browser.close();}
