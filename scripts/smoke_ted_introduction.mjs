/** Test the RDF-generated content on an ordinary static server, not a second app. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";

const [base="http://127.0.0.1:4186", modulePath, executablePath, screenshots, axePath] = process.argv.slice(2);
if (!modulePath) throw new Error("Supply Playwright's absolute index.mjs path");
const { chromium } = await import(pathToFileURL(modulePath).href);
const manifest=await (await fetch(`${base}/course-runtime/manifest.json`)).json();
assert.equal(manifest.documents.length,1);
const entry=manifest.documents[0];
const artifact=await (await fetch(`${base}/${entry.runtime}`)).json();
const scenes=artifact.sceneDocuments[0].scenes;
assert.equal(scenes.length,29,"Expected title + 28 authored content scenes");
// Run the actual production policy, not a blanket search over machine-readable
// provenance, source descriptions and already-approved demonstration asset URLs.
const publicArtifact=await(await fetch(`${base}/course-runtime.json`)).json();
const lazyExpected={...publicArtifact}; delete lazyExpected.presentationCollection;
assert.deepEqual(artifact,lazyExpected,"lazy presentation differs from the validated public artifact");
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),"talks-smoke-policy-"));
try {
  const file=path.join(temporary,"public-transport.json");
  await fs.writeFile(file,JSON.stringify(publicArtifact),"utf8");
  await promisify(execFile)(process.execPath,["--experimental-strip-types",
    fileURLToPath(new URL("./validate_presentation_transport.mts",import.meta.url)),file,publicArtifact.presentationCollection.id]);
} finally { await fs.rm(temporary,{recursive:true,force:true}); }
const axe=axePath ? await fs.readFile(axePath,"utf8") : undefined;
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
const results=[];
try {
  for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
    for (const theme of ["dark","light"]) {
      for (const reducedMotion of ["no-preference","reduce"]) {
        const context=await browser.newContext({viewport,reducedMotion});
        const page=await context.newPage(), errors=[], missing=[];
        page.on("pageerror",e=>errors.push(e.message));
        page.on("console",m=>{if(m.type()==="error") errors.push(m.text());});
        page.on("response",r=>{if(r.status()>=400) missing.push(`${r.status()} ${r.url()}`);});
        for (const [index,scene] of scenes.entries()) {
          const url=new URL(base);
          url.searchParams.set("theme",theme); url.searchParams.set("level",entry.id);
          url.hash=`/${encodeURIComponent(scene.id)}`;
          await page.goto(url.href,{waitUntil:"networkidle"});
          await page.waitForFunction(id=>document.querySelector(".reveal .slides > section.present")?.id===id,scene.id);
          const current=page.locator(".reveal .slides > section.present");
          if(scene.blocks.some(b=>b.kind==="media-reference")) {
             await current.locator(".media-reference img,.media-reference video,.media-reference svg.teaching-svg").first().waitFor();
            assert.ok(await current.locator(".media-reference").count()>=1,"authored media is not rendered");
          }
          const stage=current.locator("[data-presentation-step-count]");
          const steps=await stage.count() ? Number(await stage.first().getAttribute("data-presentation-step-count")):0;
          const initial=steps ? Number(await stage.first().getAttribute("data-presentation-step")):0;
          if(steps) assert.equal(initial,1,"visual slides must enter with their first stage already active");
          for(let step=initial+1;step<=steps;step++) {
            await page.keyboard.press("ArrowRight");
            await page.waitForFunction(({id,step})=>document.getElementById(id)?.querySelector("[data-presentation-step-count]")?.dataset.presentationStep===String(step),{id:scene.id,step});
            assert.equal(await current.getAttribute("id"),scene.id,"stage navigation skipped a slide");
          }
          await page.waitForTimeout(250);
          if(screenshots && reducedMotion==="no-preference") {
            await fs.mkdir(screenshots,{recursive:true});
            await page.screenshot({path:`${screenshots}/${index}-${viewport.width}-${theme}.png`});
          }
          const geometry=await current.evaluate(section=>{
            const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
             const visible=element=>{const r=element.getBoundingClientRect();return r.width>0&&r.height>0;};
             const visual=[...section.querySelectorAll(".teaching-svg,.d3-flow-svg,.d3-chart-svg,.media-reference img,.media-reference video")].find(visible)
               ?? [...section.querySelectorAll(".definition-list,.code-block,svg")].find(visible);
            const nodes=[...section.querySelectorAll("h1,h2,.keypoint-list li,.teaching-svg")];
            const returnControl=document.querySelector(".pcd-return-world");
             const viewBox=visual?.tagName.toLowerCase()==='svg' ? visual.viewBox?.baseVal : undefined;
             const aspect=viewBox?.width&&viewBox?.height ? viewBox.width/viewBox.height : undefined;
             return {section:rect(section),visual:visual?rect(visual):null,visualAspect:aspect,returnControl:returnControl?rect(returnControl):null,
              items:nodes.map(rect),overflowX:document.documentElement.scrollWidth>innerWidth+2,
              overflowY:document.documentElement.scrollHeight>innerHeight+2,text:section.innerText};
          });
          assert.ok(!geometry.overflowX && !geometry.overflowY,"body overflow");
          for(const item of geometry.items) {
            assert.ok(item.x>=-2 && item.x+item.width<=viewport.width+2,`horizontal clipping in ${scene.id}`);
            assert.ok(item.y>=-2 && item.y+item.height<=viewport.height+2,`vertical clipping in ${scene.id}: ${JSON.stringify(item)}`);
            const control=geometry.returnControl;
            if(control) assert.ok(item.x+item.width<=control.x || item.x>=control.x+control.width
              || item.y+item.height<=control.y || item.y>=control.y+control.height,`content overlaps return control in ${scene.id}`);
          }
            // Flat authored SVG comparisons can be naturally below 110px high
            // at phone width. Require their full proportional height instead of
            // accidentally testing a header card or imposing a distorted ratio.
            const minimumHeight=geometry.visualAspect ? Math.min(110,geometry.visual.width/geometry.visualAspect*.9) : 110;
            if(index>0) assert.ok(geometry.visual?.width>200 && geometry.visual?.height>minimumHeight,`visual too small in ${scene.id}`);
           for(const block of scene.blocks.filter(b=>b.kind==="diagram"&&b.presentation==="dialog")) {
             const button=current.getByRole("button",{name:`Open ${block.label}`,exact:true});
             await button.focus(); await page.keyboard.press("Enter");
             const diagram=page.locator(".pcd-diagram-dialog[open] .d3-flow-svg");
             await diagram.waitFor();
             const bounds=await diagram.boundingBox();
             assert.ok(bounds&&bounds.width>200&&bounds.height>110,"dialog graph must be readable");
             await page.keyboard.press("Escape");
             assert.equal(await page.locator(".pcd-diagram-dialog[open]").count(),0,"Escape must close the graph dialog");
             assert.ok(await button.evaluate(element=>element===document.activeElement),"dialog must restore launcher focus");
           }
           assert.ok(!/\*\*|==/.test(geometry.text),"unrendered emphasis markers");
           assert.ok(!/cogniflow/i.test(geometry.text.replaceAll("https://cogniflow.odea-project.org/cf#", "")),"internal branding in visible slide text");
          if(axe) {
            await page.addScriptTag({content:axe});
            const violations=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
            assert.deepEqual(violations,[],`WCAG violation in ${scene.id}`);
          }
          results.push({sceneId:scene.id,viewport,theme,reducedMotion,steps,geometry});
          if(index<scenes.length-1) {
            await page.keyboard.press("ArrowRight");
            await page.waitForFunction(id=>document.querySelector(".reveal .slides > section.present")?.id===id,scenes[index+1].id);
          }
        }
        await page.getByRole("button",{name:"Talks Overworld",exact:true}).click();
        await page.getByRole("heading",{name:"Talks Overworld",exact:true}).waitFor();
        assert.equal(await page.locator("[data-scene-document-id]").count(),1);
        assert.deepEqual(errors,[]); assert.deepEqual(missing,[]);
        await context.close();
      }
    }
  }
  const fallback=await (await fetch(`${base}/course-runtime/static-course.html`)).text();
  for(const scene of scenes) assert.ok(fallback.includes(scene.id));
  assert.match(fallback,/not measured data/);
  console.log(JSON.stringify({passed:results.length,staticFallback:true,results},null,2));
} finally {await browser.close();}
