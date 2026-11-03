/* Optional, local-only visual QA. Set PLAYWRIGHT_MODULE to an installed Playwright
 * directory. Start the preview first. Output is disposable, not semantic content.
 * Usage: node scripts/check_slides_pdf_browser.cjs URL OUTPUT_DIR [edge|firefox]
 */
const {chromium, firefox} = require(process.env.PLAYWRIGHT_MODULE || '../.local/browser-tools/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const base = new URL(process.argv[2] || 'http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1');
  const output = process.argv[3];
  assert(output, 'Specify a local output directory for screenshots and the QA report');
  const engine = process.argv[4] || 'edge';
  assert(['edge', 'firefox'].includes(engine), 'Engine must be edge or firefox');
  fs.mkdirSync(output, {recursive: true});
  const browser = await (engine === 'firefox' ? firefox.launch() : chromium.launch({channel: 'msedge'}));
  const report = {engine, url: base.href, themes: [], errors: [], failures: []};
  try {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({viewport: {width: 1731, height: 1006}, reducedMotion: 'reduce', colorScheme: theme});
      page.on('pageerror', error => report.errors.push(error.message));
      const url = new URL(base);
      url.searchParams.set('theme', theme);
      url.searchParams.set('print-pdf', '');
      url.searchParams.delete('mode');
      url.searchParams.delete('interactive');
      url.hash = '';
      await page.goto(url.href);
      await page.waitForFunction(() => document.body.dataset.slidesPdfReady === 'true', {}, {timeout: 120000});
      await page.emulateMedia({media: 'print'});
      const pages = await page.locator('.pdf-page').evaluateAll(pages => pages.map((page, index) => {
        const slide = page.querySelector('section');
        const bounds = page.getBoundingClientRect();
        const scale = Number(slide.dataset.pdfScale);
        const visible = element => {
          const css = getComputedStyle(element);
          return css.display !== 'none' && css.visibility !== 'hidden' && element.getClientRects().length > 0;
        };
        // Deliberately independent of the fitter. In particular do NOT measure
        // KaTeX's clipped SVG paths or hidden MathML accessibility tree.
        const components = [...slide.querySelectorAll('h1,h2,h3,p,pre,table,figure,img,canvas,.math-display,.katex-html .base,.definition-list-entry,figcaption,.experiment-description')]
          .filter(visible).map(element => {
            const rect = element.getBoundingClientRect();
            return {tag: element.tagName, text: element.textContent.slice(0, 80),
              effectiveFont: parseFloat(getComputedStyle(element).fontSize) * scale,
              width: rect.width, height: rect.height,
              clipped: rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2 || rect.left < bounds.left - 2 || rect.right > bounds.right + 2};
          });
        const heading = components.find(c => /^H[12]$/.test(c.tag));
        const graphics=[...slide.querySelectorAll('.d3-chart-svg,.oe-stage > svg,.media-reference img,.media-reference > svg,.distribution-experiment svg')]
          .filter(visible).map(element=>{const r=element.getBoundingClientRect();return{tag:element.tagName,width:r.width,height:r.height,
            primitives:element.tagName.toLowerCase()==='svg'?element.querySelectorAll('path,rect,circle,line,polyline,text').length:null};});
        const formulas=[...slide.querySelectorAll('.formula-with-legend')].map(unit=>[...unit.querySelectorAll(':scope > .math-display .katex-html .base')].filter(visible).map(e=>e.getBoundingClientRect()));
        let formulaCollisions=0;
        for(let a=0;a<formulas.length;a++)for(let b=a+1;b<formulas.length;b++)for(const x of formulas[a])for(const y of formulas[b])
          if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>4&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>4)formulaCollisions++;
        const source = [...slide.querySelectorAll('[data-source-resource-id]')].map(e => e.dataset.sourceResourceId);
        const texts = [...slide.querySelectorAll('p,figcaption,.definition-list-description,.experiment-readouts span,.experiment-description')]
          .filter(e => visible(e) && !e.querySelector('.katex') && !e.closest('.katex'))
          .map(e => e.innerText).filter(t => t.trim().length >= 40);
        return {page: index + 1, id: slide.id, title: heading?.text, source, scale, texts,
          widthFraction: slide.getBoundingClientRect().width / bounds.width,
          headingFont: heading?.effectiveFont, components,graphics,formulaCollisions};
      }));
      for (const entry of pages) {
        const problems = [];
        if (!Number.isFinite(entry.scale) || entry.scale <= 0) problems.push('invalid scale');
        if (entry.widthFraction < .70) problems.push('miniaturized: less than 70% page width');
        if (entry.headingFont < 18) problems.push('heading below 18 CSS px after scaling');
        if(entry.components.some(c=>['P','DD','DT','FIGCAPTION'].includes(c.tag)&&c.text.length>35&&c.effectiveFont<10))problems.push('explanatory text below 10 CSS px after scaling');
        if (!entry.components.length) problems.push('no visible content');
        if (entry.components.some(c => c.clipped)) problems.push('visible content outside page');
        if(entry.graphics.some(g=>g.width<160||g.height<100||g.primitives===0))problems.push('missing or collapsed core graphic');
        if(entry.formulaCollisions)problems.push('colliding formula comparison');
        if (problems.length) report.failures.push({theme, page: entry.page, id: entry.id, problems});
        if (process.env.PDF_QA_SCREENSHOTS === 'all' || problems.length || [1,17,19,28,53,66,71,72,75,79,111].includes(entry.page)) {
          await page.locator('.pdf-page').nth(entry.page - 1).screenshot({path: path.join(output, `${engine}-${theme}-${String(entry.page).padStart(3, '0')}.png`), animations: 'disabled', timeout: 15000});
        }
      }
      assert.equal(await page.locator('.katex-error').count(), 0, 'Invalid rendered formula');
      assert.equal(await page.locator('.pcd-slides-pdf-toolbar').isVisible(), false);
      console.log(`${engine} ${theme}: audited ${pages.length} pages`);
      if (engine === 'edge' && process.env.PDF_QA_EXPORT !== '0') await page.pdf({path: path.join(output, `${engine}-${theme}.pdf`), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, timeout: 120000});
      // Compare the same reviewed scenes in the live presentation, at the final
      // fragment state. IDs are obtained from the print DOM, not hard-coded CSS.
      const comparisons = [];
      for (const number of [17, 19, 28, 53, 66, 71, 72, 75, 79]) {
        const entry = pages[number - 1];
        if (!entry) continue;
        const live = new URL(base);
        live.searchParams.set('theme', theme);
        live.searchParams.set('view', 'deck');
        live.searchParams.delete('print-pdf');
        live.searchParams.delete('mode');
        live.searchParams.delete('interactive');
        live.hash = `/${entry.id}`;
        await page.goto(live.href);
        await page.waitForFunction(id => document.querySelector('section.present')?.id === id, entry.id);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.querySelectorAll('section.present img')].map(i => i.decode()));
          document.querySelectorAll('section.present .fragment').forEach(e => e.classList.add('visible'));
        });
        await page.emulateMedia({media: 'screen'});
        const title = await page.locator('section.present h2').first().textContent();
        assert.equal(title.trim().slice(0, 80), entry.title.trim());
        await page.screenshot({path: path.join(output, `${engine}-${theme}-${String(number).padStart(3, '0')}-live.png`)});
        comparisons.push({page: number, id: entry.id, titleMatches: true});
      }
      report.themes.push({theme, pages, comparisons});
      await page.close();
    }
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(output, `${engine}-report.json`), JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify({engine, pages: report.themes.map(t => t.pages.length),
    minScale: Math.min(...report.themes.flatMap(t => t.pages.map(p => p.scale))), errors: report.errors, failures: report.failures}, null, 2));
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.failures, []);
})().catch(error => {console.error(error); process.exitCode = 1;});
