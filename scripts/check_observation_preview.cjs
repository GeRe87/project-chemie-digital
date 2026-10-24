/** Focused browser acceptance check; Playwright may live in an external tooling dir.
 * PLAYWRIGHT_MODULE=<absolute module path> node scripts/check_observation_preview.cjs
 * PREVIEW_URL and SCREENSHOT_DIR are optional. No browser dependency is added to the product.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let browser;

(async () => {
  const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
  browser = await chromium.launch({channel:'msedge',headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  const artifact = await (await page.request.get(`${base}/authoring-runtime.json`)).json();
  const scenes = artifact.sceneDocuments[0].scenes;
  assert.equal(scenes.length,4);
  const open = async (index, theme='dark') => {
    await page.goto(`${base}/authoring.html?theme=${theme}&background=none#/${encodeURIComponent(scenes[index].id)}`);
    const shell=page.locator(`.observation-explorer[data-view="${['compare','order','count','ecdf'][index]}"]`);
    await shell.waitFor({state:'visible'});
    await shell.scrollIntoViewIfNeeded();
    await page.evaluate(()=>document.fonts.ready);
    return shell;
  };
  const shots=process.env.SCREENSHOT_DIR;
  if(shots)fs.mkdirSync(shots,{recursive:true});
  const screenshot=async name=>{if(shots)await page.screenshot({path:path.join(shots,name+'.png')});};
  let shell=await open(0);
  assert.equal(await shell.locator('.oe-observation').count(),7);
  await shell.getByRole('button',{name:'Reveal modified measurements',exact:true}).click();
  assert.equal(await shell.locator('.oe-observation').count(),14);
  assert.equal(await shell.locator('.oe-series').nth(1).locator('.oe-value').allTextContents().then(v=>v.includes('30')),true);
  await screenshot('scene-1-dark');
  await shell.getByRole('button',{name:'Reset',exact:true}).click();
  assert.equal(await shell.locator('.oe-observation').count(),7);

  shell=await open(1);
  const identity=await shell.locator('.oe-observation').first().getAttribute('data-observation-id');
  await shell.locator('.oe-observation').first().click();
  await shell.getByRole('button',{name:'Sort by measured value',exact:true}).click();
  assert.deepEqual(await shell.locator('.oe-value').allTextContents(),['2','4','4','5','5','6','7']);
  assert.equal(await shell.locator('[data-selected=true]').getAttribute('data-observation-id'),identity);
  assert.match(await shell.locator('.oe-readout').innerText(),/ordered rank 6/);
  await screenshot('scene-2-dark');
  await shell.getByRole('button',{name:'Reset',exact:true}).click();
  assert.deepEqual(await shell.locator('.oe-value').allTextContents(),['6','4','7','2','5','4','5']);

  for(const index of [2,3]) {
    shell=await open(index);
    const number=shell.locator('input[type=number]');
    for(const [value,count] of [['0',0],['2',1],['3.9',1],['4',3],['4.1',3],['5',5],['7',7],['8',7]]) {
      await number.fill(value);
      assert.equal(await shell.locator('[data-included=true]').count(),count);
      assert.equal(await shell.locator('.oe-count').innerText(),`${count} / 7`);
    }
    await number.fill('99'); assert.equal(await number.getAttribute('aria-invalid'),'true');
    await shell.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await number.inputValue(),'3.9');
    assert.equal(await number.getAttribute('aria-invalid'),null);
    const range=shell.locator('input[type=range]');
    await range.focus(); await range.press('ArrowRight');
    assert.equal(await number.inputValue(),'4');
    assert.equal(await shell.locator('.oe-count').innerText(),'3 / 7');
    await screenshot(`scene-${index+1}-dark`);
    if(index===3) {
      assert.equal(await shell.locator('.oe-step').count(),6);
      assert.equal(await shell.locator('.oe-open').count(),5);
      assert.equal(await page.locator('.oe-formal').getAttribute('open'),null);
      await shell.locator('.oe-formal-trigger').click();
      assert.equal(await page.locator('.oe-formula .katex').count(),1);
      await screenshot('scene-4-formula-dark');
      await page.keyboard.press('Escape');
      await shell.getByRole('button',{name:'Reset',exact:true}).click();
      assert.equal(await page.locator('.oe-formal').getAttribute('open'),null);
    }
  }
  shell=await open(3,'light');
  assert.equal(await page.locator('body').getAttribute('data-presentation-theme'),'light');
  await screenshot('scene-4-light');
  const wide=await shell.boundingBox(); assert(wide.width>900);
  await page.setViewportSize({width:390,height:844});
  shell=await open(3,'light');
  await shell.locator('input[type=number]').fill('4');
  assert.equal(await shell.locator('.oe-count').innerText(),'3 / 7');
  await screenshot('scene-4-portrait-light');
  assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('pcd-native-mobile')),true);
  const controlSize=await shell.locator('input[type=number]').boundingBox();
  assert(controlSize.height>=30,`Portrait controls must not be a scaled desktop canvas: ${JSON.stringify(controlSize)}`);
  const scrollHost=shell.locator('..');
  await scrollHost.hover();
  await page.mouse.wheel(0,450);
  await page.waitForFunction(()=>document.querySelector('.observation-chart-host:has([data-view="ecdf"])').scrollTop>0);
  // Scrolling the experiment must not advance the lecture or change its threshold.
  assert.equal(await shell.locator('input[type=number]').inputValue(),'4');
  await shell.locator('.oe-formal-trigger').click();
  assert.equal(await page.locator('.oe-formal').getAttribute('open'),'');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert(overflow.scroll<=overflow.width+1,JSON.stringify(overflow));
  await page.goto(`${base}/authoring-static.html`);
  assert.match(await page.locator('body').innerText(),/left limit/);
  assert.deepEqual(errors,[]);
  console.log('PASS: four scenes; reveal/reset; stable identities/sorting; thresholds/ties/tails; keyboard; ECDF endpoints; formula disclosure; light/dark; portrait; static fallback; no page errors.');
  if(shots)console.log(`Screenshots: ${shots}`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();});
