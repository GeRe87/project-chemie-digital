/* Optional integration probe: install Playwright separately; no build/server dependency. */
const { chromium } = require('../.local/browser-tools/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:4186/';
  const artifactDir = process.argv[3] || 'dist/chemometrics';
  const reportName = process.argv[4] || 'production';
  if (!/^[a-z0-9-]+$/.test(reportName)) throw Error('Report name must be a safe basename');
  const artifact = JSON.parse(fs.readFileSync(path.join(artifactDir, 'course-runtime.json'), 'utf8'));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { url, errors: [], failed: [], remote: [], levels: [], labs: [] };
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failed.push({ url: request.url(), error: request.failure() }));
  page.on('response', response => { if (response.status() >= 400) report.failed.push({ url: response.url(), status: response.status() }); });
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(url).origin) report.remote.push(request.url());
  });
  for (const theme of ['dark', 'light']) {
    for (const binding of artifact.sceneDocumentBindings) {
      await page.goto(url + '?theme=' + theme);
      const control = page.locator(`.pitch-world-start[data-scene-document-id="${binding.sceneDocumentId}"]`);
      await control.waitFor({ state: 'visible' });
      await control.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(700);
      if (await page.locator('.pitch-course-world').isVisible()) throw Error('Level did not open: ' + binding.sceneDocumentId);
      const sections = page.locator(`section[data-scene-document-id="${binding.sceneDocumentId}"]:not([data-course-level-buffer]):not([data-course-return-sentinel])`);
      const expected = artifact.sceneDocuments.find(d => d.id === binding.sceneDocumentId);
      if (await sections.count() !== expected.scenes.length) throw Error('Scene coverage changed');
      for (const scene of await sections.all()) {
        const workbench = scene.locator('.code-function-workbench');
        if (!await workbench.count()) continue;
        await scene.scrollIntoViewIfNeeded();
        await workbench.locator('.code-run-button').click();
        await page.waitForFunction(id => {
          const output = document.getElementById(id)?.querySelector('.code-output');
          return output && !/Loading R runtime|Output will appear here/.test(output.textContent);
        }, await scene.getAttribute('id'), { timeout: 120000 });
        const output = await workbench.locator('.code-output').innerText();
        if (/^Error:/.test(output)) throw Error(output);
        await workbench.locator('.code-reset-button').click();
        if ((await workbench.locator('.code-output').innerText()) !== 'Output will appear here.') throw Error('Reset failed');
        report.labs.push({ theme, scene: await scene.getAttribute('id'), output });
      }
      const last = sections.last(); await last.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      report.levels.push({ theme, document: binding.sceneDocumentId, count: expected.scenes.length,
        diagrams: await sections.locator('svg.d3-flow-svg, [data-diagram-block-id] svg').count(),
        charts: await sections.locator('[data-chart-block-id] svg').count(),
        math: await sections.locator('.katex').count(), mathErrors: await sections.locator('.katex-error').count(),
        media: await sections.locator('.media-reference svg, .media-reference img').count() });
      const buffer = page.locator(`section[data-course-level-buffer][data-scene-document-id="${binding.sceneDocumentId}"]`);
      await buffer.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
      // Leave the R editor/control keyboard-isolation boundary before deck navigation.
      await buffer.click({ position: { x: 40, y: 40 } });
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(700);
      report.levels.at(-1).returned = await page.locator('.pitch-course-world').isVisible();
    }
  }
  await page.goto(url);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `.local/${reportName}-overworld-390.png` });
  fs.writeFileSync(`.local/${reportName}-browser-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  if (report.errors.length || report.failed.length || report.remote.length || report.levels.some(l => l.mathErrors || !l.returned)) throw Error('Static browser validation failed');
})().catch(error => { console.error(error); process.exitCode = 1; });
