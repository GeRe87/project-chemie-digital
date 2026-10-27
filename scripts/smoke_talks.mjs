/** Optional production smoke test; Playwright/browser are supplied by the host. */
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";

const [base = "http://127.0.0.1:4186", modulePath, executablePath, screenshotDirectory, axePath] = process.argv.slice(2);
if (!modulePath) throw new Error("Supply the absolute path to Playwright's index.mjs");
const { chromium } = await import(pathToFileURL(modulePath).href);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const title = "Automated and FAIR microplastics analysis using TED-GC-MS";
const results = [];
const axeSource = axePath ? await fs.readFile(axePath,"utf8") : undefined;
async function audit(page) {
  if (!axeSource) return;
  await page.addScriptTag({ content:axeSource });
  const violations = await page.evaluate(async () => (await window.axe.run(document, {
    runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]},
  })).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})));
  assert.deepEqual(violations,[],"WCAG accessibility violations");
}
try {
  for (const viewport of [{ width:1440,height:900 }, { width:390,height:844 }]) {
    for (const theme of ["dark","light"]) {
      for (const reducedMotion of ["no-preference","reduce"]) {
        const context = await browser.newContext({ viewport, reducedMotion });
        const page = await context.newPage();
        const errors = [], missing = [], requests = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
        page.on("response", response => { if (response.status() >= 400) missing.push(`${response.status()} ${response.url()}`); });
        page.on("request", request => requests.push(request.url()));
        await page.goto(`${base}/?theme=${theme}`, { waitUntil:"networkidle" });
        await page.getByRole("heading", { name:"Talks Overworld", exact:true }).waitFor();
        assert.equal(await page.locator("[data-scene-document-id]").count(), 1);
        assert.equal(await page.getByRole("heading", { name:title,exact:true }).count(), 1);
        assert.equal(await page.locator(".pcd-background-stage").count(),1);
        assert.equal(await page.locator(".pcd-background-layer").count(),3);
        assert.ok(!requests.some(uri=>uri.includes(`_layer_${theme === "dark" ? "light":"dark"}.webp`)),"inactive theme should not load");
        assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight <= window.innerHeight+2),"world body scroll");
        await audit(page);
        const button = page.getByRole("button", { name:"Open presentation" });
        await button.focus(); await page.keyboard.press("Enter");
        await page.locator(".scientific-title").waitFor();
        await page.waitForTimeout(1200);
        assert.ok(await page.locator(".reveal .slides > section").count() >= 1);
        assert.equal(await page.locator(".scientific-title h1").textContent(),title);
        assert.match(await page.locator(".scientific-title").textContent(),/Gerrit Renner/);
        assert.match(await page.locator(".scientific-title").textContent(),/Faculty of Chemistry/);
        assert.equal(await page.locator(".reveal-scroll").count(),0);
        const geometry = await page.evaluate(() => {
          const title = document.querySelector(".scientific-title").getBoundingClientRect();
          const heading = document.querySelector(".scientific-title h1").getBoundingClientRect();
          const layers = [...document.querySelectorAll(".pcd-background-layer")].map(layer=>({
            transform:layer.querySelector(".pcd-background-strip").style.transform,
            // Compare compositing dimensions before the authored layer transform.
            // The foreground's intentional scale is not a mismatched source tile.
            width:layer.querySelector("img").offsetWidth,
            height:layer.querySelector("img").offsetHeight,
            naturalWidth:layer.querySelector("img").naturalWidth,
            naturalHeight:layer.querySelector("img").naturalHeight,
            renderedWidth:layer.querySelector("img").getBoundingClientRect().width,
            renderedHeight:layer.querySelector("img").getBoundingClientRect().height,
          }));
          return { title:{x:title.x,y:title.y,width:title.width,height:title.height},
            heading:{x:heading.x,y:heading.y,width:heading.width,height:heading.height}, layers,
            bodyScroll:document.documentElement.scrollHeight > window.innerHeight+2,
            horizontalScroll:document.documentElement.scrollWidth > window.innerWidth+2,
            visibleText:document.body.innerText };
        });
        assert.ok(!geometry.bodyScroll,"unexpected vertical body scroll");
        assert.ok(!geometry.horizontalScroll,"unexpected horizontal body scroll");
        assert.ok(geometry.heading.x >= -1 && geometry.heading.x+geometry.heading.width <= viewport.width+1,"heading outside viewport");
        assert.ok(geometry.title.y >= -1 && geometry.title.y+geometry.title.height <= viewport.height+2,"title layout outside viewport");
        assert.equal(new Set(geometry.layers.map(l=>`${l.width}:${l.height}`)).size,1,"composited layer sizes differ");
        assert.equal(new Set(geometry.layers.map(l=>`${l.naturalWidth}:${l.naturalHeight}`)).size,1,"source tile dimensions differ");
        assert.ok(geometry.layers.every(l=>l.naturalWidth>0 && l.renderedWidth>=viewport.width && l.renderedHeight>=viewport.height),"background tiles must load and cover the viewport");
        assert.ok(!/cogniflow/i.test(geometry.visibleText),"unrelated public content");
        const transforms = geometry.layers.map(l=>l.transform);
        await page.waitForTimeout(250);
        assert.deepEqual(await page.locator(".pcd-background-strip").evaluateAll(nodes=>nodes.map(n=>n.style.transform)),transforms,"idle background drift");
        if (reducedMotion === "reduce") assert.equal(new Set(transforms).size,1,"reduced-motion layers should remain at zero-progress alignment");
        else assert.equal(new Set(transforms).size,3,"parallax depths should differ");
        await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowLeft");
        assert.equal(await page.locator(".scientific-title").count(),1);
        await audit(page);
        await page.keyboard.press("Alt+t");
        assert.equal(await page.locator("body").getAttribute("data-presentation-theme"),theme === "dark" ? "light":"dark");
        await page.keyboard.press("Alt+t");
        await page.keyboard.press("Alt+b");
        assert.equal(await page.locator("#presentation-background-select").inputValue(),"none");
        assert.equal(await page.locator("body.pcd-background-active").count(),0);
        await page.keyboard.press("Alt+b");
        assert.equal(await page.locator("#presentation-background-select").inputValue(),"talks-laboratory");
        await page.waitForTimeout(450);
        assert.equal(await page.locator(".pcd-background-stage").count(),1);
        assert.deepEqual(await page.locator("#presentation-background-select option").evaluateAll(nodes=>nodes.map(n=>n.value)),["none","talks-laboratory"]);
        await page.setViewportSize({width:viewport.width+40,height:viewport.height});
        await page.waitForTimeout(1000);
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        assert.deepEqual(await page.locator(".pcd-background-strip").evaluateAll(nodes=>nodes.map(n=>n.style.transform)),transforms,"resize accumulated parallax drift");
        if (screenshotDirectory && reducedMotion === "no-preference") {
          await fs.mkdir(screenshotDirectory,{recursive:true});
          await page.screenshot({path:`${screenshotDirectory}/title-${viewport.width}-${theme}.png`});
        }
        await page.getByRole("button", {name:"Talks Overworld",exact:true}).click();
        await page.getByRole("heading", {name:"Talks Overworld",exact:true}).waitFor();
        await page.getByRole("button", {name:`Switch to ${theme === "dark" ? "light":"dark"} mode`}).click();
        await page.waitForTimeout(400);
        assert.equal(await page.locator("body").getAttribute("data-presentation-theme"),theme === "dark" ? "light":"dark");
        if (screenshotDirectory && reducedMotion === "no-preference") await page.screenshot({path:`${screenshotDirectory}/world-${viewport.width}-${theme === "dark" ? "light":"dark"}.png`});
        assert.deepEqual(errors,[]); assert.deepEqual(missing,[]);
        await audit(page);
        results.push({viewport,theme,reducedMotion,geometry});
        await context.close();
      }
    }
  }
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage(); await page.goto(base);
  await page.getByRole("link",{name:/Open static (course|presentation) content/}).click();
  assert.match(await page.locator("body").textContent(),/Gerrit Renner/);
  assert.match(await page.locator("body").textContent(),/GERSTEL Microplastics Expert Meeting/);
  await context.close();
  console.log(JSON.stringify({passed:results.length,staticFallback:true,results},null,2));
} finally { await browser.close(); }
