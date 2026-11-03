/* Built-site smoke gate. No dev server, source imports or remote services. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launchBrowser, readCourseMetadata } = require('./browser-tools.cjs');

function blocksIn(blocks) {
  return blocks.flatMap(block => [block, ...(block.kind === 'group' ? blocksIn(block.children) : [])]);
}
function isSymbolList(block) {
  return block.kind === 'definition-list' && block.entries.length > 0
    && block.entries.every(entry => entry.symbol) && block.disclosure?.mode !== 'optional';
}

(async () => {
  const base = new URL(process.argv[2] || 'http://127.0.0.1:4186/');
  const artifactDir = path.resolve(process.argv[3] || 'dist/chemometrics');
  const output = path.resolve(process.argv[4] || '.local/release-browser');
  const engine = process.argv[5] || process.env.PLAYWRIGHT_BROWSER || 'chromium';
  assert(['chromium', 'firefox', 'webkit', 'edge'].includes(engine), 'Unsupported browser engine.');
  fs.mkdirSync(output, { recursive: true });
  const reportPath = path.join(output, `${engine}-release-browser.json`);
  const report = { ok: false, engine, url: base.href, levels: [], errors: [], failedRequests: [], remoteRequests: [], checks: [], symbolLegendChecks: 0 };
  // Invalidate earlier evidence even when parsing input or launching the browser fails.
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  let browser;
  try {
  const { manifest } = readCourseMetadata(artifactDir);
  assert(manifest?.transportVersion === '2.0', 'Release verification requires the split course transport.');
  const documents = manifest.documents.map(record => ({
    record,
    document: JSON.parse(fs.readFileSync(path.join(artifactDir, record.runtime), 'utf8')).sceneDocuments[0],
  }));
  browser = await launchBrowser(engine);
  report.browserVersion = browser.version();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    const requested = [];
    let stageExample;
    function monitor(page) {
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) report.failedRequests.push({ url: response.url(), status: response.status() });
    });
    page.on('requestfailed', request => {
      // Browser navigation may cancel optional media decoding; transport/script
      // failures remain fatal, including errors that do not produce HTTP responses.
      if (!['media', 'image'].includes(request.resourceType()) || !/ERR_ABORTED|NS_BINDING_ABORTED/.test(request.failure()?.errorText || '')) {
        report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
      }
    });
    page.on('request', request => {
      requested.push(request.url());
      if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== base.origin) report.remoteRequests.push(request.url());
    });
    }
    monitor(page);
    async function waitForPresentation(id) {
      await page.waitForFunction(id => document.querySelector('.pcd-bootstrap-status[data-state="error"]')
        || Array.from(document.querySelectorAll('section[data-scene-document-id]')).some(element => element.dataset.sceneDocumentId === id), id);
      assert.equal(await page.locator('.pcd-bootstrap-status[data-state="error"]').count(), 0, 'Course initialization failed.');
      await page.locator('.pcd-bootstrap-status').waitFor({ state: 'detached' });
    }
    async function goToScene(id) {
      await page.evaluate(id => { location.hash = '/' + encodeURIComponent(id); }, id);
      await page.waitForFunction(id => document.querySelector('section.present')?.id === id, id);
    }
    for (const theme of ['dark', 'light']) {
      for (const { record, document } of documents) {
        const worldUrl = new URL(base); worldUrl.searchParams.set('theme', theme); worldUrl.searchParams.set('view', 'deck');
        const requestStart = requested.length;
        await page.goto(worldUrl.href);
        const control = page.locator(`.pitch-world-start[data-scene-document-id="${record.id}"]`);
        await control.waitFor({ state: 'visible' });
        assert(!requested.slice(requestStart).some(uri => /course-runtime\/(level-|graph-)/.test(uri)), 'Course map must not download scene or global graph data.');
        await control.focus(); await page.keyboard.press('Enter');
        await waitForPresentation(record.id);
        const sections = page.locator(`section[data-scene-document-id="${record.id}"]:not([data-course-level-buffer]):not([data-course-return-sentinel]):not([data-lecture-title])`);
        assert.deepEqual(await sections.evaluateAll(elements => elements.map(element => element.id)), record.sceneIds, 'Every selected scene must be rendered in canonical order; generated title chrome is separate.');
        assert.equal(await sections.locator('.katex-error').count(), 0, 'Formula rendering failed.');
        const chartScene = document.scenes.find(scene => blocksIn(scene.blocks).some(block => block.kind === 'chart'));
        if (chartScene) {
          await goToScene(chartScene.id);
          await page.locator('section.present [data-chart-block-id] svg').first().waitFor({ state: 'attached' });
        }
        const formulaScene = document.scenes.find(scene => blocksIn(scene.blocks).some(block => block.kind === 'math')
          && blocksIn(scene.blocks).some(isSymbolList));
        if (formulaScene) {
          await goToScene(formulaScene.id);
          for (const legend of blocksIn(formulaScene.blocks).filter(isSymbolList)) {
            const symbols = page.locator('section.present details.symbol-legend-disclosure').filter({
              has: page.locator(`[data-definition-entry-id="${legend.entries[0].id}"]`),
            });
            assert.equal(await symbols.count(), 1, 'An authored symbol legend must have a visible disclosure.');
            if (!await symbols.evaluate(element => element.open)) {
              const summary = symbols.locator('summary'); await summary.focus(); await page.keyboard.press('Enter');
            }
            assert(await symbols.evaluate(element => element.open), 'Symbols must open from the keyboard.');
            const renderedIds = await symbols.locator('.definition-list-entry').evaluateAll(entries => entries.map(entry => entry.dataset.definitionEntryId));
            assert.deepEqual(renderedIds, legend.entries.map(entry => entry.id), 'Every authored symbol entry must be rendered in order.');
            report.symbolLegendChecks++;
          }
        }
        const staged = page.locator(`section[data-scene-document-id="${record.id}"][data-stage-lock="true"]`).first();
        if (!stageExample && await staged.count()) stageExample = { record, id: await staged.getAttribute('id') };
        const countBefore = await sections.count();
        await page.evaluate(() => {
          window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
          window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
        });
        assert.equal(await sections.count(), countBefore, 'A cached page transition must preserve presentation DOM.');
        if (chartScene) {
          await goToScene(chartScene.id);
          await page.locator('section.present [data-chart-block-id] svg').first().waitFor({ state: 'attached' });
        }
        report.levels.push({ theme, id: record.id, scenes: countBefore,
          transportBytes: fs.statSync(path.join(artifactDir, record.runtime)).size,
          initializationMs: await page.evaluate(() => performance.getEntriesByName('pcd-level-initialization').at(-1)?.duration ?? null) });
        await page.locator('.pcd-return-world').click();
        await page.locator('.pitch-course-world').waitFor({ state: 'visible' });
        await page.goBack();
        await waitForPresentation(record.id);
      }
    }
    assert(report.symbolLegendChecks > 0, 'The smoke gate must exercise an authored formula legend.');
    assert(!requested.some(uri => uri.includes(manifest.sharedGraph.path)), 'Ordinary levels must not download the full shared graph.');
    report.checks.push('All levels, both themes, keyboard navigation, formula rendering, chart mounting, cached lifecycle events and history return.');

    const lab = documents.flatMap(({ record, document }) => document.scenes.flatMap(scene =>
      blocksIn(scene.blocks).map(block => ({ record, scene, block }))))
      .find(({ block }) => block.kind === 'code' && block.language === 'r' && block.executable && block.editable);
    assert(lab, 'The course must contain a representative executable R example.');
    const labUrl = new URL(base); labUrl.searchParams.set('level', lab.record.id); labUrl.searchParams.set('view', 'deck'); labUrl.hash = '/' + encodeURIComponent(lab.scene.id);
    await page.goto(labUrl.href); await waitForPresentation(lab.record.id); await goToScene(lab.scene.id);
    const optional = page.locator('section.present details.pcd-optional-material');
    for (const disclosure of await optional.all()) if (!await disclosure.evaluate(element => element.open)) await disclosure.locator(':scope > summary').click();
    const workspace = page.locator(`section.present .code-block[data-code-block-id="${lab.block.id}"]`);
    assert.equal(await workspace.count(), 1, 'The selected editable R workspace must be mounted.');
    async function waitForOutput(text) {
      await page.waitForFunction(({ id, text }) => Array.from(document.querySelectorAll('[data-code-block-id]'))
        .find(element => element.getAttribute('data-code-block-id') === id)?.querySelector('.code-output')?.textContent.includes(text),
        { id: lab.block.id, text }, { timeout: 180000 });
    }
    const editor = workspace.locator('.cm-content'); await editor.waitFor();
    await editor.fill('cat("release smoke: ", 2 + 2, "\\n", sep="")');
    await workspace.locator('.code-run-button').click();
    await waitForOutput('release smoke: 4');
    await editor.fill('repeat {}'); await workspace.locator('.code-run-button').click();
    await workspace.locator('.code-stop-button').click();
    await workspace.locator('.code-reset-button').click();
    assert.equal(await workspace.locator('.code-output').innerText(), 'Output will appear here.');
    await editor.fill('cat("R recovered after stop")'); await workspace.locator('.code-run-button').click();
    await waitForOutput('R recovered after stop');
    await workspace.locator('.code-reset-button').click();
    assert.equal(await workspace.locator('.code-output').innerText(), 'Output will appear here.');
    report.checks.push('Real local webR execution, Stop, Reset and successful execution after worker restart.');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base.href); await page.locator('.pitch-course-world').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(output, `${engine}-course-mobile.png`), fullPage: true });
    await page.locator('.pitch-world-start').first().click(); await waitForPresentation(documents[0].record.id);
    assert(stageExample, 'The smoke gate must cover an authored locked presentation stage.');
    const stageUrl = new URL(base); stageUrl.searchParams.set('level', stageExample.record.id); stageUrl.searchParams.set('view', 'deck'); stageUrl.hash = '/' + encodeURIComponent(stageExample.id);
    await page.goto(stageUrl.href); await waitForPresentation(stageExample.record.id); await goToScene(stageExample.id);
    await page.locator('body.pcd-stage-lock-active').waitFor({ state: 'attached' });
    const touchActions = await page.evaluate(() => Array.from(document.querySelectorAll('html, body, .reveal-viewport, .reveal')).map(element => getComputedStyle(element).touchAction));
    assert(touchActions.every(value => value === 'auto' || value === 'manipulation' || value.split(/\s+/).includes('pinch-zoom')), 'Every presentation ancestor must preserve browser pinch zoom.');
    report.checks.push('Mobile opening and pinch-zoom CSS policy. Physical device gestures remain a manual check.');

    const staticContext = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await staticContext.newPage();
    monitor(fallback);
    await fallback.goto(base.href);
    await fallback.getByRole('link', { name: 'Open static course content' }).click();
    const staticIds = await fallback.locator('article[data-pitch-step]').evaluateAll(elements => elements.map(element => element.getAttribute('data-pitch-step')));
    assert.deepEqual(staticIds, documents.flatMap(item => item.record.sceneIds), 'The no-JavaScript course must retain all selected scenes in order.');
    assert((await fallback.locator('dl').count()) > 0, 'Static formula legends must remain present.');
    await staticContext.close();
    report.checks.push('Root no-JavaScript escape reaches the complete static course and authored legends.');

    const pdfDocument = documents.find(({ document }) => document.scenes.some(scene => blocksIn(scene.blocks).some(isSymbolList)));
    assert(pdfDocument, 'A representative print document with authored symbols is required.');
    const pdfUrl = new URL(base); pdfUrl.searchParams.set('level', pdfDocument.record.id); pdfUrl.searchParams.set('view', 'deck'); pdfUrl.searchParams.set('print-pdf', '');
    const printPage = await context.newPage(); monitor(printPage);
    await printPage.goto(pdfUrl.href);
    await printPage.waitForFunction(() => document.body.dataset.slidesPdfReady === 'true', null, { timeout: 120000 });
    await printPage.emulateMedia({ media: 'print' });
    await printPage.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    assert((await printPage.locator('.pdf-page').count()) > 0, 'Slides PDF must initialize printable pages.');
    const printedIds = await printPage.locator('.pdf-page section[data-scene-document-id]:not([data-course-level-buffer]):not([data-course-return-sentinel]):not([data-lecture-title])').evaluateAll(elements => [...new Set(elements.map(element => element.id))]);
    assert.deepEqual(printedIds.sort(), [...pdfDocument.record.sceneIds].sort(), 'Slides PDF must contain all selected scene identities.');
    const printedLegends = printPage.locator('details.symbol-legend-disclosure');
    assert((await printedLegends.count()) > 0, 'The print fixture must contain symbol legends.');
    assert(await printedLegends.evaluateAll(elements => elements.every(element => element.open)), 'Print legends must be open without interaction.');
    assert.equal(await printPage.locator('.katex-error').count(), 0, 'PDF formula rendering failed.');
    await printPage.close();
    report.checks.push('Slides PDF initializes with all selected scenes and open formula legends.');

    // Fault injection uses a separate page so expected failures cannot hide
    // accidental HTTP or runtime errors in the successful course checks above.
    const failure = await context.newPage();
    await failure.route('**/course-runtime/manifest.json', route => route.fulfill({ status: 503, body: 'Deliberate release-gate failure' }));
    await failure.goto(base.href);
    const alert = failure.locator('.pcd-bootstrap-status[data-state="error"]'); await alert.waitFor();
    assert.equal(await alert.getByRole('link', { name: 'Open static course content' }).getAttribute('href'), './course-runtime/static-course.html');
    await failure.unroute('**/course-runtime/manifest.json');
    monitor(failure); // All requests and errors from successful Retry are checked too.
    await alert.getByRole('button', { name: 'Retry loading' }).click();
    await failure.locator('.pitch-course-world').waitFor({ state: 'visible' });
    await failure.close();
    report.checks.push('Manifest failure presents a static escape and Retry recovers.');

    assert.deepEqual(report.errors, [], 'Uncaught browser errors.');
    assert.deepEqual(report.failedRequests, [], 'Unexpected failed local requests.');
    assert.deepEqual([...new Set(report.remoteRequests)], [], 'Static release unexpectedly contacted a remote service.');
    report.ok = true;
    console.log(`${engine}: ${report.levels.length} level/theme combinations and ${report.checks.length} release checks passed.`);
  } catch (error) {
    report.ok = false; report.failure = error.stack || String(error); throw error;
  } finally {
    try { if (browser) await browser.close(); }
    finally { fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n'); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
