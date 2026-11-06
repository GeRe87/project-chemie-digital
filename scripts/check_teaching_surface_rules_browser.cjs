/* Local review: calculation alignment, numbered flow cards and plot height. */
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({channel: 'msedge'});
  try {
    for (const theme of ['light', 'dark']) for (const width of [1580, 1280, 390]) {
      const page = await browser.newPage({viewport: {width, height: 953}, reducedMotion: 'reduce'});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=scroll&appearance-controls=hidden&theme=${theme}`);
      await page.locator('.pcd-script-toggle').waitFor();
      for (const id of ['ex:rv-n32--scene', 'ex:rv-n46--scene', 'ex:rv-n50--scene']) {
        const scene = page.locator(`section[id="${id}"]`);
        await scene.scrollIntoViewIfNeeded();
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const result = await scene.evaluate(s => {
          const rect = element => element?.getBoundingClientRect().toJSON();
          return {profile: s.dataset.compositionProfile, bounds: rect(s),
            table: rect(s.querySelector('table')), formula: rect(s.querySelector('.formula-with-legend')),
            answer: s.querySelector('[data-composition-region-container="footer"]')?.textContent,
            root: rect(s.querySelector('.distribution-experiment')),
            plotClientHeight: s.querySelector('.experiment-panels svg')?.clientHeight,
            plot: rect(s.querySelector('.experiment-panels svg')),
            actions: rect(s.querySelector('.experiment-actions'))};
        });
        if (id.includes('n32')) {
          assert.equal(result.profile, 'worked-calculation');
          assert.match(result.answer, /55% above/);
          if (width > 700) assert(Math.abs(result.table.top - result.formula.top) < 3, id);
          else assert(result.formula.top >= result.table.bottom - 2, id);
        } else {
          // Scroll-mode Reveal may scale a full design-space slide on mobile.
          assert(result.plotClientHeight >= 150, `${id}: collapsed plot`);
          assert(result.actions.top >= result.plot.bottom - 2, id);
          if (width > 700) {
            assert(result.plot.height > 280, `${id}: spare height did not reach plot`);
            assert(result.actions.bottom <= result.bounds.bottom - 8, `${id}: actions outside slide`);
            assert(result.root.bottom - result.actions.bottom < 40, `${id}: empty space below actions`);
          }
        }
      }
      const flow = page.locator('.d3-flow-svg').filter({has: page.locator('[data-flow-card-style="numbered"]')}).first();
      await flow.scrollIntoViewIfNeeded();
      const cards = await flow.locator('[data-flow-card-style="numbered"]').evaluateAll(nodes => nodes.map(node => ({
        top: node.querySelector('.d3-flow-node-shape').getBoundingClientRect().top,
        number: node.querySelector('.d3-flow-card-number').textContent,
        header: getComputedStyle(node.querySelector('.d3-flow-card-header-panel')).fill,
        color: getComputedStyle(node.querySelector('.d3-flow-node-title,.d3-flow-node-label')).fill,
      })));
      assert(cards.length >= 2);
      assert.equal(new Set(cards.map(c => c.number)).size, cards.length);
      assert(cards.every(c => c.color === 'rgb(255, 255, 255)'));
      assert(new Set(cards.map(c => c.header)).size >= 2);
      for(const row of await page.locator('.d3-flow-svg[data-numbered-card-row="true"]').all()){
        const geometry=await row.locator('[data-flow-card-style="numbered"]').evaluateAll(nodes=>nodes.map(node=>{
          const title=node.querySelector('.d3-flow-node-title,.d3-flow-node-label');
          const body=node.querySelector('.d3-flow-node-body');
          const shape=node.querySelector('.d3-flow-node-shape');
          return {title:title.getBoundingClientRect().toJSON(),body:body?.getBoundingClientRect().toJSON(),
            bounds:shape.getBoundingClientRect().toJSON(),anchor:title.getAttribute('text-anchor'),rx:getComputedStyle(shape).rx};
        }));
        assert(geometry.every(card=>card.anchor==='start'),'Flow titles are left-aligned');
        assert(geometry.every(card=>card.rx==='7px'),'Flow cards override pixel-theme square corners');
        assert(geometry.every(card=>card.title.left>=card.bounds.left&&card.title.right<=card.bounds.right+1),'Flow headings stay inside cards');
        const bodies=geometry.filter(card=>card.body).map(card=>card.body.top);
        if(bodies.length)assert(Math.max(...bodies)-Math.min(...bodies)<2,'Flow bodies share a top baseline');
      }
      assert.deepEqual(errors, []);
      console.log(`${theme} ${width}: calculation, flow and plot-space checks passed`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
